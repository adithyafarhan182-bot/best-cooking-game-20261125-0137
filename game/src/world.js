// Sizzle & Serve — the world: state, orders, stations and the cooking rules.
// Everything the game simulates lives here and nowhere else: the chef's position,
// what the chef carries, the two burners, the chopping board, the plate under
// assembly, the order tickets and their patience, the shift clock, coins and combo.
// Rendering reads this state; it never writes it.
import {
  BURN_SECONDS, CARRY_MAX, CHEF, CHOP_HITS, COOK_SECONDS, DAYS, INGREDIENTS,
  LAYOUT, MAX_ORDERS, ORDER_PATIENCE, RECIPES, SHIFT_SECONDS,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSE = 'pause';
export const SCREEN_OVER = 'over';

export const EVENT_NONE = 0;
export const EVENT_SERVE = 1;
export const EVENT_EXPIRE = 2;
export const EVENT_OVER = 4;
export const EVENT_BURN = 8;

// A tiny seeded generator so a staged screenshot and a replay always agree.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function stationCentre(box) {
  return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
}

function nearChef(box, chef) {
  const c = stationCentre(box);
  const dx = chef.x - clamp(chef.x, box.x - 8, box.x + box.w + 8);
  const dy = chef.y - clamp(chef.y, box.y - 8, box.y + box.h + 8);
  return Math.hypot(dx, dy) < 110 || (chef.x > box.x - 30 && chef.x < box.x + box.w + 30 && chef.y > box.y - 30 && chef.y < box.y + box.h + 30);
}

/** A fresh, empty world: title screen, day one, nothing cooking. */
export function createWorld(seed = 20261125) {
  return {
    seed,
    rand: mulberry32(seed),
    screen: SCREEN_TITLE,
    dayIndex: 0,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    spawnTimer: 4,
    coins: 0,
    served: 0,
    lost: 0,
    combo: 0,
    comboTimer: 0,
    bestCombo: 0,
    stars: 0,
    cleared: false,
    chef: { x: CHEF.startX, y: CHEF.startY, face: -1, walking: false, carryAnim: 0 },
    carry: [],
    chopping: null,
    burners: [
      { item: null, progress: 0, burning: 0 },
      { item: null, progress: 0, burning: 0 },
    ],
    plate: [],
    orders: [],
    nextOrderId: 1,
    floaters: [],
    shake: 0,
    message: '',
    messageTimer: 0,
  };
}

export function dayConfig(world) {
  return DAYS[Math.min(world.dayIndex, DAYS.length - 1)];
}

export function recipeSteps(recipe) {
  return recipe.steps.map((s) => ({ ...s }));
}

/** Start a fresh shift on the given day (0-based). */
export function startShift(world, dayIndex = 0) {
  const fresh = createWorld(world.seed);
  fresh.screen = SCREEN_PLAY;
  fresh.dayIndex = dayIndex;
  return fresh;
}

function spawnOrder(world) {
  const day = dayConfig(world);
  if (world.orders.length >= Math.min(day.maxOrders, MAX_ORDERS)) return;
  const pool = day.recipes.map(recipeById);
  const recipe = pool[Math.floor(world.rand() * pool.length)];
  world.orders.push({
    id: world.nextOrderId,
    recipeId: recipe.id,
    patience: ORDER_PATIENCE * day.patienceScale,
    maxPatience: ORDER_PATIENCE * day.patienceScale,
  });
  world.nextOrderId += 1;
}

function addFloater(world, x, y, text, colour) {
  world.floaters.push({ x, y, text, colour, life: 1.2 });
}

function say(world, text, seconds = 1.6) {
  world.message = text;
  world.messageTimer = seconds;
}

/** Does the plate hold exactly this recipe's steps, in any order? */
export function plateMatches(plate, recipe) {
  if (plate.length !== recipe.steps.length) return false;
  const wanted = recipe.steps.map((s) => `${s.item}:${s.state}`).sort().join('|');
  const have = plate.map((s) => `${s.item}:${s.state}`).sort().join('|');
  return wanted === have;
}

function orderForPlate(world) {
  return world.orders.find((o) => plateMatches(world.plate, recipeById(o.recipeId))) ?? null;
}

/** The nearest station the chef can use right now, or null. */
export function nearestStation(world) {
  const chef = world.chef;
  const boxes = [
    ['pantry', LAYOUT.pantry], ['chop', LAYOUT.chop], ['stove', LAYOUT.stove],
    ['plate', LAYOUT.plate], ['serve', LAYOUT.serve], ['trash', LAYOUT.trash],
  ];
  let best = null;
  let bestD = Infinity;
  for (const [name, box] of boxes) {
    if (!nearChef(box, chef)) continue;
    const c = stationCentre(box);
    const d = Math.hypot(chef.x - c.x, chef.y - c.y);
    if (d < bestD) { bestD = d; best = name; }
  }
  return best;
}

/** What the interact key does at a station; returns an event mask. */
export function interact(world, station) {
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  const chef = world.chef;
  if (station === 'pantry') {
    if (world.carry.length >= CARRY_MAX) { say(world, 'Hands full! Serve or trash something first.'); return EVENT_NONE; }
    return EVENT_NONE; // pantry picks happen by item: use grabIngredient()
  }
  if (station === 'chop') {
    if (world.chopping) {
      world.chopping.hits += 1;
      world.chef.carryAnim = 0.15;
      if (world.chopping.hits >= CHOP_HITS) {
        const done = { item: world.chopping.item, state: 'chopped' };
        world.chopping = null;
        if (world.carry.length < CARRY_MAX) {
          world.carry.push(done);
          say(world, `${INGREDIENTS[done.item].name} chopped!`);
        }
      }
      return EVENT_NONE;
    }
    const idx = world.carry.findIndex((c) => INGREDIENTS[c.item].prep === 'chop' && c.state === 'raw');
    if (idx === -1) { say(world, 'Nothing to chop — grab lettuce or tomato first.'); return EVENT_NONE; }
    const item = world.carry.splice(idx, 1)[0];
    world.chopping = { item: item.item, hits: 0 };
    return EVENT_NONE;
  }
  if (station === 'stove') {
    const burner = world.burners.find((b) => !b.item) ?? null;
    const idx = world.carry.findIndex((c) => INGREDIENTS[c.item].prep === 'cook' && (c.state === 'raw' || (c.item === 'tomato' && c.state === 'chopped')));
    if (!burner) { say(world, 'Both burners are busy!'); return EVENT_NONE; }
    if (idx === -1) { say(world, 'Nothing to cook — grab a patty, pasta or chopped tomato.'); return EVENT_NONE; }
    const item = world.carry.splice(idx, 1)[0];
    burner.item = item;
    burner.progress = 0;
    burner.burning = 0;
    return EVENT_NONE;
  }
  if (station === 'plate') {
    if (world.carry.length === 0) { say(world, 'Hands empty — bring an ingredient to the plate.'); return EVENT_NONE; }
    const item = world.carry.shift();
    world.plate.push(item);
    world.chef.carryAnim = 0.15;
    return EVENT_NONE;
  }
  if (station === 'serve') {
    const order = orderForPlate(world);
    if (!order) { say(world, 'That plate matches no order yet — check the tickets!'); return EVENT_NONE; }
    return serveOrder(world, order);
  }
  if (station === 'trash') {
    if (world.carry.length === 0 && world.plate.length === 0) { say(world, 'Nothing to throw away.'); return EVENT_NONE; }
    world.carry = [];
    world.plate = [];
    world.combo = 0;
    say(world, 'Trashed. Fresh start!');
    return EVENT_NONE;
  }
  return EVENT_NONE;
}

/** Grab one pantry item straight into the chef's hands. */
export function grabIngredient(world, key) {
  if (world.screen !== SCREEN_PLAY) return false;
  if (!INGREDIENTS[key]) return false;
  if (world.carry.length >= CARRY_MAX) { say(world, 'Hands full!'); return false; }
  world.carry.push({ item: key, state: 'raw' });
  world.chef.carryAnim = 0.15;
  return true;
}

/** Take a finished burner item into the chef's hands. */
export function takeBurner(world, index) {
  const burner = world.burners[index];
  if (!burner || !burner.item) return false;
  if (burner.progress < 1) { say(world, 'Still cooking — wait for the ring to fill!'); return false; }
  if (world.carry.length >= CARRY_MAX) { say(world, 'Hands full!'); return false; }
  const item = burner.item;
  burner.item = null;
  burner.progress = 0;
  burner.burning = 0;
  world.carry.push({ item: item.item, state: 'cooked' });
  return true;
}

function serveOrder(world, order) {
  const recipe = recipeById(order.recipeId);
  const patienceBonus = Math.round((order.patience / order.maxPatience) * 6);
  const comboBonus = Math.min(world.combo, 5);
  const earned = recipe.price + patienceBonus + comboBonus;
  world.coins += earned;
  world.served += 1;
  world.combo += 1;
  world.bestCombo = Math.max(world.bestCombo, world.combo);
  world.comboTimer = 6;
  world.orders = world.orders.filter((o) => o.id !== order.id);
  world.plate = [];
  const c = stationCentre(LAYOUT.serve);
  addFloater(world, c.x, c.y - 20, `+$${earned}`, '#3d9b4f');
  if (world.combo >= 2) addFloater(world, c.x, c.y - 52, `COMBO x${world.combo}!`, '#e8a13a');
  return EVENT_SERVE;
}

/** Advance the world by dt seconds. `move` is {x, y} in -1..1. Returns events. */
export function stepWorld(world, dt, move) {
  if (world.screen !== SCREEN_PLAY) return EVENT_NONE;
  let events = EVENT_NONE;
  world.elapsed += dt;
  world.timeLeft = Math.max(0, SHIFT_SECONDS - world.elapsed);
  if (world.comboTimer > 0) {
    world.comboTimer -= dt;
    if (world.comboTimer <= 0) world.combo = 0;
  }
  if (world.messageTimer > 0) world.messageTimer -= dt;
  if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 3);
  for (const f of world.floaters) { f.y -= 34 * dt; f.life -= dt; }
  world.floaters = world.floaters.filter((f) => f.life > 0);

  // The chef walks the floor, never through a counter.
  const chef = world.chef;
  const speed = CHEF.speed * dt;
  const nx = clamp(chef.x + move.x * speed, LAYOUT.floor.x + 26, LAYOUT.floor.x + LAYOUT.floor.w - 26);
  const ny = clamp(chef.y + move.y * speed, LAYOUT.floor.y + 26, LAYOUT.floor.y + LAYOUT.floor.h - 26);
  chef.walking = move.x !== 0 || move.y !== 0;
  if (move.x !== 0) chef.face = move.x > 0 ? 1 : -1;
  chef.x = nx;
  chef.y = ny;
  if (chef.carryAnim > 0) chef.carryAnim -= dt;

  // Orders arrive on a timer until the day's cap.
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0) {
    spawnOrder(world);
    world.spawnTimer = dayConfig(world).spawnEvery;
  }

  // Patience drains; an expired ticket is a lost customer.
  for (const order of world.orders) order.patience -= dt;
  const expired = world.orders.filter((o) => o.patience <= 0);
  if (expired.length > 0) {
    world.orders = world.orders.filter((o) => o.patience > 0);
    world.lost += expired.length;
    world.combo = 0;
    say(world, 'A customer walked out! Be quicker next time.');
    events |= EVENT_EXPIRE;
  }

  // Burners cook, then burn if nobody collects them.
  for (const burner of world.burners) {
    if (!burner.item) continue;
    const need = COOK_SECONDS[burner.item.item] ?? COOK_SECONDS.patty;
    if (burner.progress < 1) {
      burner.progress = Math.min(1, burner.progress + dt / need);
    } else {
      burner.burning += dt;
      if (burner.burning >= BURN_SECONDS) {
        burner.item = null;
        burner.progress = 0;
        burner.burning = 0;
        world.shake = 0.6;
        say(world, 'Burnt! The pan is ruined — grab a fresh one.');
        events |= EVENT_BURN;
      }
    }
  }

  if (world.timeLeft <= 0) {
    world.screen = SCREEN_OVER;
    const day = dayConfig(world);
    world.cleared = world.coins >= day.target;
    world.stars = world.cleared ? (world.coins >= day.target * 1.5 ? 3 : world.coins >= day.target * 1.2 ? 2 : 1) : 0;
    events |= EVENT_OVER;
  }
  return events;
}

/** The shift summary shown on the game-over screen. */
export function shiftSummary(world) {
  const day = dayConfig(world);
  return {
    day: day.day, name: day.name, coins: world.coins, target: day.target,
    served: world.served, lost: world.lost, bestCombo: world.bestCombo,
    cleared: world.cleared, stars: world.stars,
  };
}
