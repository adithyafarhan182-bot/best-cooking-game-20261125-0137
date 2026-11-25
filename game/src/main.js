// Sizzle & Serve — main: boot the canvas, run the loop, wire input to rules.
// One fixed-step loop (60 Hz) drives the world; rendering follows every frame.
// The ?shot= query stages a screenshot scene instead of live play, so a capture
// shows the real game mid-shift. P pauses, M mutes, Enter starts, R restarts.
import { VIEW } from './config.js';
import {
  EVENT_BURN, EVENT_EXPIRE, EVENT_OVER, EVENT_SERVE, SCREEN_OVER, SCREEN_PAUSE,
  SCREEN_PLAY, SCREEN_TITLE, createWorld, grabIngredient, interact, nearestStation,
  startShift, stepWorld, takeBurner,
} from './world.js';
import { drawGame } from './render.js';
import {
  bindInput, consumePress, createInput, endFrame, moveVector, pantryHit,
  stationHit,
} from './input.js';
import {
  isMuted, playBurn, playChop, playCoin, playDing, playPop, playTicket,
  startMusic, startSizzle, stopMusic, stopSizzle, toggleMute,
} from './audio.js';
import { shotFromUrl, stageShot } from './shots.js';
import { LAYOUT, PANTRY_ORDER } from './config.js';

const STEP = 1 / 60;

const canvas = document.getElementById('game');
const statusEl = document.getElementById('status');
const ctx = canvas.getContext('2d');

function fitCanvas() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = VIEW.width;
  canvas.height = VIEW.height;
  canvas.style.width = `${Math.floor(VIEW.width * scale)}px`;
  canvas.style.height = `${Math.floor(VIEW.height * scale)}px`;
}

const input = createInput();
bindInput(canvas, input);

let world = createWorld();
let shotMode = false;
let lastOrderCount = 0;
let lastBurnerDone = [false, false];
let accumulator = 0;
let lastTime = performance.now();

/** Announce the state for screen readers, throttled to real changes. */
function announce() {
  if (!statusEl) return;
  const day = world.dayIndex + 1;
  if (world.screen === SCREEN_PLAY) {
    statusEl.textContent = `Day ${day}. ${world.coins} coins. ${world.orders.length} orders waiting. ${Math.ceil(world.timeLeft)} seconds left.`;
  } else if (world.screen === SCREEN_OVER) {
    statusEl.textContent = `Shift over. ${world.coins} coins, ${world.served} dishes served.`;
  } else if (world.screen === SCREEN_TITLE) {
    statusEl.textContent = 'Sizzle and Serve: Milo the cat chef\'s kitchen. Press Enter to start your shift.';
  }
}

function handleEvents(events) {
  if (events & EVENT_SERVE) {
    playCoin();
    announce();
  }
  if (events & EVENT_EXPIRE) playBurn();
  if (events & EVENT_BURN) {
    playBurn();
    announce();
  }
  if (events & EVENT_OVER) {
    stopSizzle();
    stopMusic();
    announce();
  }
}

function clickBurner(point) {
  const s = LAYOUT.stove;
  if (point.x < s.x || point.x > s.x + s.w || point.y < s.y || point.y > s.y + s.h) return false;
  const index = point.x < s.x + s.w / 2 ? 0 : 1;
  return takeBurner(world, index);
}

function handleClick(point) {
  if (world.screen !== SCREEN_PLAY) return;
  if (clickBurner(point)) { playPop(); return; }
  const pantryKey = pantryHit(point);
  if (pantryKey) {
    if (grabIngredient(world, pantryKey)) playPop();
    return;
  }
  const station = stationHit(point);
  if (station) {
    // Walk to the station, then use it when close enough.
    const box = LAYOUT[station];
    input.walkTarget = { x: box.x + box.w / 2, y: box.y + box.h + 40 };
    input.pendingStation = station;
  }
}

function useNearestStation() {
  const station = nearestStation(world);
  if (!station) return;
  const before = world.chopping ? world.chopping.hits : -1;
  const events = interact(world, station);
  if (world.chopping && world.chopping.hits > before) playChop();
  else if (station === 'plate' || station === 'pantry') playPop();
  handleEvents(events);
}

function frame(now) {
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (!shotMode && world.screen === SCREEN_PLAY) {
    accumulator += dt;
    while (accumulator >= STEP) {
      accumulator -= STEP;
      const move = moveVector(input, world.chef);
      const events = stepWorld(world, STEP, move);
      handleEvents(events);
      // A clicked station fires once the chef arrives.
      if (input.pendingStation && nearestStation(world) === input.pendingStation) {
        useNearestStation();
        input.pendingStation = null;
        input.walkTarget = null;
      }
      // Ticket slide-in and burner-ready sounds on real changes.
      if (world.orders.length > lastOrderCount) playTicket();
      lastOrderCount = world.orders.length;
      world.burners.forEach((burner, i) => {
        const done = !!burner.item && burner.progress >= 1;
        if (done && !lastBurnerDone[i]) playDing();
        lastBurnerDone[i] = done;
      });
      const cooking = world.burners.some((b) => b.item && b.progress < 1);
      if (cooking) startSizzle(); else stopSizzle();
    }
  }
  if (!shotMode) {
    if (consumePress(input, 'Enter') || consumePress(input, 'NumpadEnter')) {
      if (world.screen === SCREEN_TITLE) {
        world = startShift(world, 0);
        startMusic();
        announce();
      } else if (world.screen === SCREEN_OVER) {
        const next = world.cleared && world.dayIndex < 2 ? world.dayIndex + 1 : 0;
        world = startShift(world, next);
        startMusic();
        announce();
      }
    }
    if (consumePress(input, 'KeyP')) {
      if (world.screen === SCREEN_PLAY) { world.screen = SCREEN_PAUSE; stopSizzle(); }
      else if (world.screen === SCREEN_PAUSE) { world.screen = SCREEN_PLAY; }
    }
    if (consumePress(input, 'KeyM')) {
      toggleMute();
      if (isMuted()) stopSizzle();
    }
    if (consumePress(input, 'KeyR')) {
      if (world.screen === SCREEN_OVER || world.screen === SCREEN_PAUSE) {
        world = startShift(world, world.dayIndex);
        startMusic();
      }
    }
    if (world.screen === SCREEN_PLAY) {
      if (consumePress(input, 'KeyE') || consumePress(input, 'Space')) useNearestStation();
      for (let i = 0; i < PANTRY_ORDER.length; i += 1) {
        if (consumePress(input, `Digit${i + 1}`)) {
          if (grabIngredient(world, PANTRY_ORDER[i])) playPop();
        }
      }
      if (input.click) handleClick(input.click);
    }
  }
  const hot = world.screen === SCREEN_PLAY ? nearestStation(world) : null;
  ctx.save();
  if (world.shake > 0) {
    ctx.translate((Math.random() - 0.5) * world.shake * 8, (Math.random() - 0.5) * world.shake * 8);
  }
  drawGame(ctx, world, hot);
  ctx.restore();
  endFrame(input);
  requestAnimationFrame(frame);
}

function boot() {
  fitCanvas();
  window.addEventListener('resize', fitCanvas);
  const shot = shotFromUrl();
  if (shot) {
    world = stageShot(shot);
    shotMode = true;
  } else {
    announce();
  }
  requestAnimationFrame(frame);
}

boot();
