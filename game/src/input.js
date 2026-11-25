// Sizzle & Serve — input: keyboard and mouse, kept separate from the rules.
// WASD / arrows walk the chef; E or Space uses the nearest station; number keys
// 1–6 grab a pantry item; P pauses, M mutes, R restarts, Enter starts. The mouse
// clicks a station to walk to it and use it, or clicks a pantry shelf to grab.
import { LAYOUT, PANTRY_ORDER } from './config.js';

const KEY_MOVE = {
  ArrowUp: { x: 0, y: -1 }, KeyW: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, KeyS: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, KeyA: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, KeyD: { x: 1, y: 0 },
};

/** Fresh input state: which keys are held and where the mouse is. */
export function createInput() {
  return {
    keys: new Set(),
    mouse: { x: 0, y: 0, down: false },
    click: null,
    pressed: new Set(),
    walkTarget: null,
  };
}

function canvasPoint(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function pointIn(box, p) {
  return p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h;
}

/** Which pantry shelf (if any) sits under a canvas point. */
export function pantryHit(point) {
  if (!pointIn(LAYOUT.pantry, point)) return null;
  const slotH = (LAYOUT.pantry.h - 44) / PANTRY_ORDER.length;
  const index = Math.floor((point.y - LAYOUT.pantry.y - 36) / slotH);
  if (index < 0 || index >= PANTRY_ORDER.length) return null;
  return PANTRY_ORDER[index];
}

/** Which station box (if any) sits under a canvas point. */
export function stationHit(point) {
  for (const [name, box] of Object.entries(LAYOUT)) {
    if (name === 'board' || name === 'floor') continue;
    if (pointIn(box, point)) return name;
  }
  return null;
}

/** The walk direction from held keys, plus a click-to-walk target if set. */
export function moveVector(input, chef) {
  let x = 0;
  let y = 0;
  for (const key of input.keys) {
    const dir = KEY_MOVE[key];
    if (dir) { x += dir.x; y += dir.y; }
  }
  if (x !== 0 || y !== 0) {
    input.walkTarget = null;
    const len = Math.hypot(x, y);
    return { x: x / len, y: y / len };
  }
  if (input.walkTarget) {
    const dx = input.walkTarget.x - chef.x;
    const dy = input.walkTarget.y - chef.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 12) {
      input.walkTarget = null;
      return { x: 0, y: 0 };
    }
    return { x: dx / dist, y: dy / dist };
  }
  return { x: 0, y: 0 };
}

/** True once for a key pressed since the last frame; call consumePress to read. */
export function consumePress(input, code) {
  if (input.pressed.has(code)) {
    input.pressed.delete(code);
    return true;
  }
  return false;
}

export function endFrame(input) {
  input.pressed.clear();
  input.click = null;
}

/** Wire the canvas and window to an input state; returns an unbind function. */
export function bindInput(canvas, input) {
  function onKeyDown(event) {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) event.preventDefault();
    if (!event.repeat) input.pressed.add(event.code);
    input.keys.add(event.code);
  }
  function onKeyUp(event) {
    input.keys.delete(event.code);
  }
  function onMouseMove(event) {
    input.mouse = { ...canvasPoint(canvas, event), down: input.mouse.down };
  }
  function onMouseDown(event) {
    const p = canvasPoint(canvas, event);
    input.mouse = { ...p, down: true };
    input.click = p;
  }
  function onMouseUp(event) {
    input.mouse = { ...canvasPoint(canvas, event), down: false };
  }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  return function unbind() {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mousedown', onMouseDown);
    window.removeEventListener('mouseup', onMouseUp);
  };
}
