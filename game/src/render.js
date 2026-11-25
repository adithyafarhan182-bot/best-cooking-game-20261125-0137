// Sizzle & Serve — render: every pixel the player sees, drawn on one canvas.
// The kitchen is a warm diner: cream walls, wood floor, teal counters. The order
// board hangs across the top with a ticket per customer; the pantry shelves run
// down the left; chop, stove, plate and serve form the working line. The chef is
// Milo, an orange cat in a white toque. All food is drawn from vector shapes.
import { COLOURS, INGREDIENTS, LAYOUT, PANTRY_ORDER, RECIPES } from './config.js';
import { dayConfig, plateMatches, shiftSummary } from './world.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, colour, align = 'center', weight = 700) {
  ctx.fillStyle = colour;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

function stateMark(state) {
  if (state === 'chopped') return '✂';
  if (state === 'cooked') return '🔥';
  return '';
}

/** One ingredient, drawn as a chunky vector icon. `state` changes the look. */
export function drawIngredient(ctx, item, state, x, y, s) {
  if (state === 'chopped') {
    // Chopped food reads as neat pieces: three small wedges of the same icon.
    ctx.save();
    ctx.translate(x - s * 0.42, y + s * 0.28);
    ctx.scale(0.42, 0.42);
    drawIngredient(ctx, item, 'raw', 0, 0, s);
    ctx.restore();
    ctx.save();
    ctx.translate(x + s * 0.38, y + s * 0.3);
    ctx.scale(0.42, 0.42);
    drawIngredient(ctx, item, 'raw', 0, 0, s);
    ctx.restore();
    ctx.save();
    ctx.translate(x, y - s * 0.32);
    ctx.scale(0.42, 0.42);
    drawIngredient(ctx, item, 'raw', 0, 0, s);
    ctx.restore();
    return;
  }
  const def = INGREDIENTS[item];
  const u = s / 2;
  ctx.save();
  ctx.translate(x, y);
  if (item === 'bun') {
    ctx.fillStyle = def.dark;
    ctx.beginPath(); ctx.ellipse(0, u * 0.32, u * 0.95, u * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = def.colour;
    ctx.beginPath(); ctx.ellipse(0, 0, u, u * 0.78, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff2cf';
    for (const [sx, sy] of [[-0.4, -0.35], [0.1, -0.5], [0.45, -0.25]]) {
      ctx.beginPath(); ctx.ellipse(sx * u, sy * u, u * 0.09, u * 0.06, 0.4, 0, Math.PI * 2); ctx.fill();
    }
  } else if (item === 'patty') {
    ctx.fillStyle = state === 'cooked' ? '#6b4226' : def.colour;
    rr(ctx, -u, -u * 0.45, s, u * 0.9, u * 0.4);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (const [sx, sy] of [[-0.5, 0], [0, -0.15], [0.5, 0.05]]) {
      ctx.beginPath(); ctx.arc(sx * u, sy * u, u * 0.12, 0, Math.PI * 2); ctx.fill();
    }
    if (state === 'cooked') {
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-u * 0.4, -u * 0.7); ctx.quadraticCurveTo(-u * 0.5, -u * 1.1, -u * 0.3, -u * 1.25); ctx.stroke();
    }
  } else if (item === 'lettuce') {
    ctx.fillStyle = def.dark;
    ctx.beginPath();
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      const r = i % 2 === 0 ? u : u * 0.72;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r * 0.85;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = def.colour;
    ctx.beginPath(); ctx.arc(0, 0, u * 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = def.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -u * 0.5); ctx.lineTo(0, u * 0.5); ctx.stroke();
  } else if (item === 'tomato') {
    ctx.fillStyle = def.colour;
    ctx.beginPath(); ctx.arc(0, u * 0.1, u * 0.85, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff8a7a';
    ctx.beginPath(); ctx.ellipse(-u * 0.3, -u * 0.3, u * 0.35, u * 0.25, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = def.dark;
    ctx.beginPath();
    ctx.moveTo(0, -u * 0.75);
    ctx.lineTo(-u * 0.3, -u * 0.95); ctx.lineTo(-u * 0.05, -u * 0.7);
    ctx.lineTo(0.25, -u * 0.95); ctx.lineTo(0.15, -u * 0.7);
    ctx.closePath(); ctx.fill();
  } else if (item === 'pasta') {
    ctx.strokeStyle = def.dark;
    ctx.lineWidth = u * 0.22;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-u * 0.8, i * u * 0.45);
      ctx.quadraticCurveTo(0, i * u * 0.45 - u * 0.35, u * 0.8, i * u * 0.45);
      ctx.stroke();
    }
    ctx.strokeStyle = def.colour;
    ctx.lineWidth = u * 0.14;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-u * 0.8, i * u * 0.45);
      ctx.quadraticCurveTo(0, i * u * 0.45 - u * 0.35, u * 0.8, i * u * 0.45);
      ctx.stroke();
    }
  } else if (item === 'cheese') {
    ctx.fillStyle = def.colour;
    ctx.beginPath();
    ctx.moveTo(-u * 0.9, u * 0.6); ctx.lineTo(u * 0.9, u * 0.6);
    ctx.lineTo(u * 0.9, -u * 0.2); ctx.lineTo(-u * 0.9, -u * 0.6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = def.dark;
    for (const [sx, sy] of [[-0.4, 0.15], [0.2, -0.1], [0.55, 0.3]]) {
      ctx.beginPath(); ctx.arc(sx * u, sy * u, u * 0.11, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
  if (state === 'cooked') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - 6, y - s * 0.7); ctx.quadraticCurveTo(x - 10, y - s, x - 6, y - s * 1.15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 8, y - s * 0.7); ctx.quadraticCurveTo(x + 12, y - s, x + 8, y - s * 1.15); ctx.stroke();
    ctx.restore();
  }
}

function stationShell(ctx, box, title, hint, hot = false) {
  ctx.fillStyle = COLOURS.counterEdge;
  rr(ctx, box.x - 3, box.y - 3, box.w + 6, box.h + 6, 14);
  ctx.fill();
  ctx.fillStyle = COLOURS.counter;
  rr(ctx, box.x, box.y, box.w, box.h, 12);
  ctx.fill();
  ctx.fillStyle = COLOURS.counterTop;
  rr(ctx, box.x, box.y, box.w, 34, 12);
  ctx.fill();
  ctx.fillRect(box.x, box.y + 22, box.w, 12);
  text(ctx, title, box.x + box.w / 2, box.y + 17, 15, '#ffffff');
  if (hint) text(ctx, hint, box.x + box.w / 2, box.y + box.h - 12, 11, '#cfe8e7', 'center', 600);
  if (hot) {
    ctx.strokeStyle = COLOURS.gold;
    ctx.lineWidth = 3;
    rr(ctx, box.x - 3, box.y - 3, box.w + 6, box.h + 6, 14);
    ctx.stroke();
  }
}

function drawTicket(ctx, order, x, y, w, h) {
  const recipe = recipeById(order.recipeId);
  const frac = Math.max(0, order.patience / order.maxPatience);
  const urgent = frac < 0.25;
  ctx.fillStyle = COLOURS.ticket;
  rr(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = urgent ? COLOURS.bad : COLOURS.ticketEdge;
  ctx.lineWidth = urgent ? 3 : 2;
  rr(ctx, x, y, w, h, 10);
  ctx.stroke();
  text(ctx, `#${order.id} ${recipe.name}`, x + 10, y + 13, 13, COLOURS.ink, 'left');
  text(ctx, `$${recipe.price}`, x + w - 10, y + 13, 13, COLOURS.good, 'right');
  const stepW = 34;
  const totalW = recipe.steps.length * stepW;
  let sx = x + (w - totalW) / 2 + stepW / 2;
  for (const step of recipe.steps) {
    drawIngredient(ctx, step.item, step.state, sx, y + 32, 24);
    text(ctx, stateMark(step.state), sx + 12, y + 20, 12, COLOURS.muted);
    sx += stepW;
  }
  ctx.fillStyle = '#e9ddc4';
  rr(ctx, x + 10, y + h - 12, w - 20, 8, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? COLOURS.good : frac > 0.25 ? COLOURS.warn : COLOURS.bad;
  rr(ctx, x + 10, y + h - 12, (w - 20) * frac, 8, 4);
  ctx.fill();
}

function drawChef(ctx, chef, carry) {
  const bob = chef.walking ? Math.sin(performance.now() / 90) * 3 : Math.sin(performance.now() / 500) * 1.5;
  const x = chef.x;
  const y = chef.y + bob * 0.4;
  ctx.save();
  ctx.translate(x, y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0, 26, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
  // Tail.
  ctx.strokeStyle = '#e8893a';
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-14 * chef.face, 12);
  ctx.quadraticCurveTo(-34 * chef.face, 18, -30 * chef.face, -6 + bob);
  ctx.stroke();
  // Body: white apron over orange fur.
  ctx.fillStyle = '#f59a3e';
  ctx.beginPath(); ctx.ellipse(0, 8, 20, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(0, 12, 13, 12, 0, 0, Math.PI * 2); ctx.fill();
  // Head with ears.
  ctx.fillStyle = '#f59a3e';
  ctx.beginPath(); ctx.arc(0, -16, 17, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-13, -26); ctx.lineTo(-17, -40); ctx.lineTo(-5, -31); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(13, -26); ctx.lineTo(17, -40); ctx.lineTo(5, -31); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffb37a';
  ctx.beginPath(); ctx.moveTo(-12, -28); ctx.lineTo(-14, -36); ctx.lineTo(-7, -30); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(12, -28); ctx.lineTo(14, -36); ctx.lineTo(7, -30); ctx.closePath(); ctx.fill();
  // Toque.
  ctx.fillStyle = '#ffffff';
  rr(ctx, -14, -46, 28, 12, 6);
  ctx.fill();
  ctx.beginPath(); ctx.arc(-8, -46, 7, 0, Math.PI * 2); ctx.arc(0, -49, 8, 0, Math.PI * 2); ctx.arc(8, -46, 7, 0, Math.PI * 2); ctx.fill();
  // Face.
  ctx.fillStyle = '#2b2118';
  ctx.beginPath(); ctx.arc(-6, -18, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(6, -18, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e4574a';
  ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(3, -12); ctx.lineTo(0, -9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#2b2118';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, -9); ctx.quadraticCurveTo(-3, -6, -6, -7); ctx.moveTo(0, -9); ctx.quadraticCurveTo(3, -6, 6, -7); ctx.stroke();
  // Carried items stacked above the head.
  carry.forEach((c, i) => {
    drawIngredient(ctx, c.item, c.state, 0, -58 - i * 22, 20);
  });
  ctx.restore();
}

function drawHud(ctx, world) {
  const day = dayConfig(world);
  const mins = Math.floor(world.timeLeft / 60);
  const secs = Math.floor(world.timeLeft % 60);
  const low = world.timeLeft <= 15;
  ctx.fillStyle = low ? COLOURS.bad : COLOURS.ink;
  rr(ctx, 16, 640, 210, 56, 12);
  ctx.fill();
  text(ctx, `${mins}:${String(secs).padStart(2, '0')}`, 121, 660, 26, '#ffffff');
  text(ctx, low ? 'HURRY!' : 'SHIFT TIMER', 121, 684, 11, '#ffd9d9');
  ctx.fillStyle = COLOURS.panel;
  rr(ctx, 240, 640, 300, 56, 12);
  ctx.fill();
  text(ctx, `$${world.coins} / $${day.target}`, 390, 660, 22, COLOURS.ink);
  text(ctx, `${day.name}  •  Served ${world.served}  •  Lost ${world.lost}`, 390, 684, 12, COLOURS.muted);
  if (world.combo >= 2) {
    ctx.fillStyle = COLOURS.gold;
    rr(ctx, 554, 640, 150, 56, 12);
    ctx.fill();
    text(ctx, `COMBO x${world.combo}`, 629, 660, 20, COLOURS.ink);
    text(ctx, 'serve fast to keep it', 629, 684, 11, COLOURS.muted);
  }
  text(ctx, 'WASD / arrows move • E interact • 1–6 grab • P pause • M mute', 1240, 688, 12, '#5a4a38', 'right', 600);
}

function drawFloaters(ctx, world) {
  for (const f of world.floaters) {
    ctx.globalAlpha = Math.min(1, f.life);
    ctx.font = `700 22px "Trebuchet MS", Verdana, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(43,33,24,0.85)';
    ctx.strokeText(f.text, f.x, f.y);
    text(ctx, f.text, f.x, f.y, 22, f.colour);
    ctx.globalAlpha = 1;
  }
}

/** Draw the whole play scene: kitchen, tickets, stations, chef, HUD. */
export function drawPlay(ctx, world, hotStation) {
  const { width, height } = ctx.canvas;
  ctx.fillStyle = COLOURS.wall;
  ctx.fillRect(0, 0, width, height);
  // Wood floor with planks.
  ctx.fillStyle = COLOURS.floor;
  ctx.fillRect(LAYOUT.floor.x, LAYOUT.floor.y, LAYOUT.floor.w, LAYOUT.floor.h);
  ctx.fillStyle = COLOURS.floorDark;
  for (let y = LAYOUT.floor.y + 52; y < LAYOUT.floor.y + LAYOUT.floor.h; y += 52) {
    ctx.fillRect(LAYOUT.floor.x, y, LAYOUT.floor.w, 3);
  }
  // Order board.
  const b = LAYOUT.board;
  ctx.fillStyle = COLOURS.board;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.strokeStyle = COLOURS.boardEdge;
  ctx.lineWidth = 2;
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.stroke();
  text(ctx, 'ORDER BOARD', b.x + 12, b.y + 18, 14, COLOURS.ink, 'left');
  if (world.orders.length === 0) {
    text(ctx, 'No orders yet — tickets slide in here. Grab ingredients and be ready!', b.x + b.w / 2, b.y + 56, 15, COLOURS.muted, 'center', 600);
  } else {
    const tw = 240;
    const gap = 12;
    const total = world.orders.length * tw + (world.orders.length - 1) * gap;
    let tx = b.x + (b.w - total) / 2;
    for (const order of world.orders) {
      drawTicket(ctx, order, tx, b.y + 28, tw, 58);
      tx += tw + gap;
    }
  }
  // Pantry shelves.
  const p = LAYOUT.pantry;
  stationShell(ctx, p, 'PANTRY', 'click or press 1–6', hotStation === 'pantry');
  const slotH = (p.h - 44) / PANTRY_ORDER.length;
  PANTRY_ORDER.forEach((key, i) => {
    const y = p.y + 36 + i * slotH + slotH / 2;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
    rr(ctx, p.x + 8, y - slotH / 2 + 2, p.w - 16, slotH - 4, 8);
    ctx.fill();
    drawIngredient(ctx, key, 'raw', p.x + 34, y, 34);
    text(ctx, `${i + 1} ${INGREDIENTS[key].name}`, p.x + 58, y, 14, '#ffffff', 'left');
    const prep = INGREDIENTS[key].prep;
    text(ctx, prep === 'chop' ? 'chop it' : prep === 'cook' ? 'cook it' : 'serve raw', p.x + p.w - 12, y, 11, '#cfe8e7', 'right', 600);
  });
  // Chopping board.
  const c = LAYOUT.chop;
  stationShell(ctx, c, 'CHOP BOARD', world.chopping ? 'press E to chop!' : 'E: put lettuce / tomato', hotStation === 'chop');
  ctx.fillStyle = '#e8c890';
  rr(ctx, c.x + 20, c.y + 48, c.w - 40, 52, 8);
  ctx.fill();
  if (world.chopping) {
    drawIngredient(ctx, world.chopping.item, 'raw', c.x + c.w / 2, c.y + 74, 40);
    const frac = world.chopping.hits / 4;
    ctx.fillStyle = '#d8c49a';
    rr(ctx, c.x + 20, c.y + 106, c.w - 40, 8, 4);
    ctx.fill();
    ctx.fillStyle = COLOURS.good;
    rr(ctx, c.x + 20, c.y + 106, (c.w - 40) * frac, 8, 4);
    ctx.fill();
  } else {
    text(ctx, '🔪', c.x + c.w / 2, c.y + 74, 30, '#8a6a3a');
  }
  // Stove with two burners. The hint lives in the title strip's second line in
  // the shell; burner status is written under each burner instead.
  const s = LAYOUT.stove;
  stationShell(ctx, s, 'STOVE', '', hotStation === 'stove');
  world.burners.forEach((burner, i) => {
    const bx = s.x + 30 + i * 150;
    const by = s.y + 76;
    ctx.fillStyle = '#1f5c5a';
    ctx.beginPath(); ctx.arc(bx, by, 44, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#123f3d';
    ctx.beginPath(); ctx.arc(bx, by, 34, 0, Math.PI * 2); ctx.fill();
    if (burner.item) {
      drawIngredient(ctx, burner.item.item, burner.item.state, bx, by - 4, 40);
      if (burner.progress < 1) {
        ctx.strokeStyle = COLOURS.gold;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(bx, by, 40, -Math.PI / 2, -Math.PI / 2 + burner.progress * Math.PI * 2);
        ctx.stroke();
      } else {
        const frac = 1 - burner.burning / 7;
        ctx.strokeStyle = frac > 0.4 ? COLOURS.good : COLOURS.bad;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(bx, by, 40, -Math.PI / 2, -Math.PI / 2 + Math.max(0, frac) * Math.PI * 2);
        ctx.stroke();
        text(ctx, burner.burning > 4 ? 'BURNING!' : 'READY!', bx, s.y + 122, 12, burner.burning > 4 ? '#ffb3b3' : '#d8f7d8');
      }
    } else {
      text(ctx, '○', bx, by, 34, '#3a9a97');
      text(ctx, 'E: put on a pan', bx, s.y + 122, 11, '#cfe8e7', 'center', 600);
    }
  });
  // Plate counter: the dish mid-assembly.
  const pl = LAYOUT.plate;
  stationShell(ctx, pl, 'PLATE', 'E: add what you carry', hotStation === 'plate');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(pl.x + pl.w / 2, pl.y + 76, 78, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8c49a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(pl.x + pl.w / 2, pl.y + 76, 78, 26, 0, 0, Math.PI * 2); ctx.stroke();
  if (world.plate.length === 0) {
    text(ctx, 'empty plate', pl.x + pl.w / 2, pl.y + 76, 13, COLOURS.muted, 'center', 600);
  } else {
    world.plate.forEach((step, i) => {
      drawIngredient(ctx, step.item, step.state, pl.x + 34 + i * 44, pl.y + 76, 36);
    });
  }
  // Serve window.
  const sv = LAYOUT.serve;
  stationShell(ctx, sv, 'SERVE', 'E: hand over the plate', hotStation === 'serve');
  ctx.fillStyle = '#fff8e7';
  rr(ctx, sv.x + 16, sv.y + 44, sv.w - 32, 56, 8);
  ctx.fill();
  const match = world.plate.length > 0 && world.orders.some((o) => plateMatches(world.plate, recipeById(o.recipeId)));
  text(ctx, world.plate.length === 0 ? '—' : match ? '✓ READY!' : '? check ticket', sv.x + sv.w / 2, sv.y + 72, 14, match ? COLOURS.good : COLOURS.muted);
  // Trash bin.
  const t = LAYOUT.trash;
  stationShell(ctx, t, 'TRASH', 'E: dump hands + plate', hotStation === 'trash');
  ctx.fillStyle = '#5a6b7a';
  rr(ctx, t.x + t.w / 2 - 26, t.y + 48, 52, 56, 8);
  ctx.fill();
  ctx.fillStyle = '#7a8b9a';
  rr(ctx, t.x + t.w / 2 - 30, t.y + 42, 60, 10, 5);
  ctx.fill();
  // Chef, message, floaters, HUD.
  drawChef(ctx, world.chef, world.carry);
  if (world.messageTimer > 0) {
    ctx.fillStyle = 'rgba(43,33,24,0.92)';
    rr(ctx, width / 2 - 260, 596, 520, 32, 16);
    ctx.fill();
    text(ctx, world.message, width / 2, 613, 14, '#ffffff');
  }
  drawFloaters(ctx, world);
  drawHud(ctx, world);
  if (world.shake > 0) {
    ctx.fillStyle = `rgba(214,69,65,${world.shake * 0.12})`;
    ctx.fillRect(0, 0, width, height);
  }
}

function drawTitle(ctx, world) {
  drawPlay(ctx, world, null);
  ctx.fillStyle = 'rgba(30,20,12,0.62)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = COLOURS.panel;
  rr(ctx, 290, 110, 700, 500, 20);
  ctx.fill();
  ctx.strokeStyle = COLOURS.boardEdge;
  ctx.lineWidth = 3;
  rr(ctx, 290, 110, 700, 500, 20);
  ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', 640, 160, 44, COLOURS.ink);
  text(ctx, "Milo the cat chef's kitchen", 640, 200, 20, COLOURS.muted, 'center', 600);
  text(ctx, 'Tickets come in — chop, cook, plate, serve before patience runs out!', 640, 244, 16, COLOURS.ink, 'center', 600);
  const lines = [
    '•  Grab from the PANTRY (click or keys 1–6), up to 3 items.',
    '•  CHOP lettuce & tomato on the board — press E four times.',
    '•  COOK patties, pasta & soup on the stove — don\'t let them burn!',
    '•  PLATE the dish to match a ticket, then SERVE it at the window.',
    '•  Fast serves pay tips. Combos multiply. Reach the daily target!',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 292 + i * 34, 16, COLOURS.ink, 'center', 600));
  ctx.fillStyle = COLOURS.good;
  rr(ctx, 490, 480, 300, 56, 14);
  ctx.fill();
  text(ctx, '▶  START SHIFT  (Enter)', 640, 509, 20, '#ffffff');
  text(ctx, 'WASD / arrows to walk • E to interact • mouse works too • M mute', 640, 566, 13, COLOURS.muted, 'center', 600);
}

function drawPause(ctx, world) {
  drawPlay(ctx, world, null);
  ctx.fillStyle = 'rgba(30,20,12,0.55)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  text(ctx, 'PAUSED', 640, 330, 48, '#ffffff');
  text(ctx, 'Press P to keep cooking', 640, 380, 18, '#ffe9b0', 'center', 600);
}

function drawOver(ctx, world) {
  drawPlay(ctx, world, null);
  ctx.fillStyle = 'rgba(30,20,12,0.68)';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const sum = shiftSummary(world);
  ctx.fillStyle = COLOURS.panel;
  rr(ctx, 340, 130, 600, 460, 20);
  ctx.fill();
  ctx.strokeStyle = COLOURS.boardEdge;
  ctx.lineWidth = 3;
  rr(ctx, 340, 130, 600, 460, 20);
  ctx.stroke();
  text(ctx, sum.cleared ? 'SHIFT COMPLETE!' : 'SHIFT OVER', 640, 180, 38, COLOURS.ink);
  text(ctx, sum.cleared ? '★'.repeat(sum.stars) + '☆'.repeat(3 - sum.stars) : 'The target got away this time', 640, 222, 30, COLOURS.gold);
  text(ctx, `${sum.name}`, 640, 262, 16, COLOURS.muted, 'center', 600);
  const rows = [
    [`Coins earned`, `$${sum.coins}  (target $${sum.target})`],
    [`Dishes served`, `${sum.served}`],
    [`Customers lost`, `${sum.lost}`],
    [`Best combo`, `x${sum.bestCombo}`],
  ];
  rows.forEach(([label, value], i) => {
    text(ctx, label, 420, 310 + i * 36, 17, COLOURS.ink, 'left', 600);
    text(ctx, value, 860, 310 + i * 36, 17, COLOURS.ink, 'right');
  });
  ctx.fillStyle = COLOURS.good;
  rr(ctx, 490, 470, 300, 56, 14);
  ctx.fill();
  text(ctx, sum.cleared && sum.day < 3 ? '▶  NEXT DAY  (Enter)' : '↻  PLAY AGAIN  (Enter)', 640, 499, 19, '#ffffff');
  text(ctx, 'Press R to restart this day', 640, 556, 13, COLOURS.muted, 'center', 600);
}

/** Draw the current screen. `hotStation` highlights the station in reach. */
export function drawGame(ctx, world, hotStation) {
  if (world.screen === 'title') drawTitle(ctx, world);
  else if (world.screen === 'pause') drawPause(ctx, world);
  else if (world.screen === 'over') drawOver(ctx, world);
  else drawPlay(ctx, world, hotStation);
}
