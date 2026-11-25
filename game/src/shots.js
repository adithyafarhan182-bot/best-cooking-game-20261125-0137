// Sizzle & Serve — screenshot staging: the scenes behind ?shot=.
// Each scene is a real game state the rules can produce — orders, a plate
// mid-assembly, burners cooking, a chopping board half done, a shift timer and
// coins — composed directly so the same name always gives the same frame.
// The renderer draws it exactly as it draws live play; nothing here is a
// mock-up, and no pixels are edited after the capture.
import { LAYOUT, SHIFT_SECONDS } from './config.js';
import { createWorld, startShift } from './world.js';

function order(id, recipeId, patience, maxPatience) {
  return { id, recipeId, patience, maxPatience };
}

function base(dayIndex, timeLeft, coins, served, lost, combo) {
  const world = startShift(createWorld(20261125), dayIndex);
  world.elapsed = SHIFT_SECONDS - timeLeft;
  world.timeLeft = timeLeft;
  world.coins = coins;
  world.served = served;
  world.lost = lost;
  world.combo = combo;
  world.comboTimer = combo > 0 ? 5 : 0;
  world.spawnTimer = 6;
  return world;
}

/** The title screen: a kitchen already ticking, two tickets on the board. */
function stageTitle() {
  const world = base(0, 118, 0, 0, 0, 0);
  world.orders = [
    order(1, 'salad', 38, 45),
    order(2, 'burger', 42, 45),
  ];
  world.nextOrderId = 3;
  world.screen = 'title';
  world.chef.x = 620;
  world.chef.y = 480;
  return world;
}

/** The cover: mid-rush play. Three tickets, a burger half-plated, lettuce on
 *  the board, pasta on a burner, a patty ready on the other, chopped tomato in
 *  hand, coins and a combo already on the board. */
function stagePlay() {
  const world = base(1, 78, 34, 2, 0, 2);
  world.orders = [
    order(3, 'burger', 30, 36),
    order(4, 'pasta', 22, 36),
    order(5, 'melt', 34, 36),
  ];
  world.nextOrderId = 6;
  world.plate = [
    { item: 'bun', state: 'raw' },
    { item: 'patty', state: 'cooked' },
  ];
  world.chopping = { item: 'lettuce', hits: 2 };
  world.burners[0] = { item: { item: 'pasta', state: 'raw' }, progress: 0.62, burning: 0 };
  world.burners[1] = { item: { item: 'patty', state: 'raw' }, progress: 1, burning: 1.5 };
  world.carry = [{ item: 'tomato', state: 'chopped' }];
  world.chef.x = 880;
  world.chef.y = 330;
  world.chef.face = 1;
  world.floaters = [{ x: 1000, y: 300, text: '+$16', colour: '#3d9b4f', life: 1.0 }];
  world.message = 'Burger needs lettuce — chop it, then serve!';
  world.messageTimer = 1.2;
  return world;
}

/** The dinner rush: day three, four tickets, one about to walk out, both
 *  burners going and the clock nearly out. */
function stageRush() {
  const world = base(2, 22, 128, 8, 1, 3);
  world.orders = [
    order(9, 'soup', 6, 29),
    order(10, 'burger', 18, 29),
    order(11, 'pasta', 25, 29),
    order(12, 'salad', 12, 29),
  ];
  world.nextOrderId = 13;
  world.plate = [
    { item: 'lettuce', state: 'chopped' },
    { item: 'tomato', state: 'chopped' },
  ];
  world.chopping = { item: 'tomato', hits: 3 };
  world.burners[0] = { item: { item: 'patty', state: 'raw' }, progress: 0.45, burning: 0 };
  world.burners[1] = { item: { item: 'tomato', state: 'chopped' }, progress: 0.8, burning: 0 };
  world.carry = [{ item: 'bun', state: 'raw' }];
  world.chef.x = 560;
  world.chef.y = 330;
  world.chef.face = -1;
  world.message = 'RUSH HOUR! Soup ticket is about to walk out!';
  world.messageTimer = 1.2;
  return world;
}

/** The serve: a finished burger on the plate, chef at the window, the tip
 *  still floating up and a three-combo on the board. */
function stageServed() {
  const world = base(1, 64, 52, 3, 0, 3);
  world.orders = [
    order(6, 'burger', 28, 36),
    order(7, 'salad', 33, 36),
  ];
  world.nextOrderId = 8;
  world.plate = [
    { item: 'bun', state: 'raw' },
    { item: 'patty', state: 'cooked' },
    { item: 'lettuce', state: 'chopped' },
  ];
  world.burners[0] = { item: { item: 'pasta', state: 'raw' }, progress: 0.3, burning: 0 };
  world.burners[1] = { item: null, progress: 0, burning: 0 };
  world.carry = [];
  world.chef.x = 1150;
  world.chef.y = 335;
  world.chef.face = 1;
  world.floaters = [
    { x: 1000, y: 320, text: '+$18', colour: '#3d9b4f', life: 1.0 },
    { x: 1000, y: 288, text: 'COMBO x3!', colour: '#e8a13a', life: 1.0 },
  ];
  world.message = 'Perfect burger! Serve it at the window!';
  world.messageTimer = 1.2;
  return world;
}

/**
 * Build the world for a screenshot scene: 'title', 'play' (the cover),
 * 'rush' or 'served'. Any other name stages the title.
 */
export function stageShot(name) {
  if (name === 'play') return stagePlay();
  if (name === 'rush') return stageRush();
  if (name === 'served') return stageServed();
  return stageTitle();
}

/** The ?shot= value in the page URL, or null when the player just opens it. */
export function shotFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get('shot');
  } catch {
    return null;
  }
}

export { LAYOUT };
