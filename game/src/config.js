// Sizzle & Serve: Kucing Chef's Kitchen — configuration.
// One place for every number the rules use: the canvas size, the kitchen layout,
// the ingredients and what each station does to them, the five recipes, and the
// three shift days with their escalating pressure. Nothing here draws or moves.
export const VIEW = { width: 1280, height: 720 };

export const SHIFT_SECONDS = 120;
export const ORDER_PATIENCE = 45;
export const MAX_ORDERS = 4;
export const CARRY_MAX = 3;
export const COMBO_WINDOW = 6;

// The chef's walk speed (pixels per second) and body radius.
export const CHEF = { speed: 300, radius: 22, startX: 640, startY: 560 };

// Chopping takes this many clean hits; cooking takes these seconds on a burner.
export const CHOP_HITS = 4;
export const COOK_SECONDS = { patty: 6, pasta: 8, soup: 9 };
export const BURN_SECONDS = 7;

// Every ingredient: its key, display name, emoji-free vector colour, the station
// that prepares it (none = served raw), and the state it reaches when prepared.
export const INGREDIENTS = {
  bun: { name: 'Bun', colour: '#e8b06a', dark: '#b97f3e', prep: null, label: 'BUN' },
  patty: { name: 'Patty', colour: '#8a5a3b', dark: '#5f3a24', prep: 'cook', label: 'PATTY' },
  lettuce: { name: 'Lettuce', colour: '#7dc383', dark: '#4c9455', prep: 'chop', label: 'LETTUCE' },
  tomato: { name: 'Tomato', colour: '#e4574a', dark: '#b03327', prep: 'chop', label: 'TOMATO' },
  pasta: { name: 'Pasta', colour: '#f2d06b', dark: '#c9a13a', prep: 'cook', label: 'PASTA' },
  cheese: { name: 'Cheese', colour: '#f7c948', dark: '#d9a41f', prep: null, label: 'CHEESE' },
};

// A recipe step names an ingredient and the state it must be in on the plate.
// 'raw' means the pantry item as grabbed; 'chopped' and 'cooked' need a station.
export const RECIPES = [
  {
    id: 'salad', name: 'Garden Salad', price: 10,
    steps: [
      { item: 'lettuce', state: 'chopped' },
      { item: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'burger', name: 'Classic Burger', price: 16,
    steps: [
      { item: 'bun', state: 'raw' },
      { item: 'patty', state: 'cooked' },
      { item: 'lettuce', state: 'chopped' },
    ],
  },
  {
    id: 'melt', name: 'Cheese Melt Burger', price: 18,
    steps: [
      { item: 'bun', state: 'raw' },
      { item: 'patty', state: 'cooked' },
      { item: 'cheese', state: 'raw' },
    ],
  },
  {
    id: 'pasta', name: 'Marinara Pasta', price: 15,
    steps: [
      { item: 'pasta', state: 'cooked' },
      { item: 'tomato', state: 'chopped' },
    ],
  },
  {
    id: 'soup', name: 'Tomato Soup', price: 14,
    steps: [
      { item: 'tomato', state: 'cooked' },
      { item: 'tomato', state: 'cooked' },
    ],
  },
];

// Each day unlocks more recipes, allows more tickets at once, drains patience
// faster, and sets the coin target that clears the shift.
export const DAYS = [
  { day: 1, name: 'Day 1 — First Shift', recipes: ['salad', 'burger'], maxOrders: 2, patienceScale: 1.0, spawnEvery: 9, target: 60 },
  { day: 2, name: 'Day 2 — Lunch Rush', recipes: ['salad', 'burger', 'melt', 'pasta'], maxOrders: 3, patienceScale: 0.8, spawnEvery: 7, target: 110 },
  { day: 3, name: 'Day 3 — Dinner Rush', recipes: ['salad', 'burger', 'melt', 'pasta', 'soup'], maxOrders: 4, patienceScale: 0.65, spawnEvery: 5, target: 170 },
];

// Kitchen layout, in canvas pixels. The order board hangs across the top; the
// pantry shelves run down the left wall; chop, stove, plate and serve form the
// working line; the trash bin sits by the door.
export const LAYOUT = {
  board: { x: 16, y: 12, w: 1248, h: 92 },
  pantry: { x: 16, y: 128, w: 190, h: 420 },
  chop: { x: 250, y: 128, w: 210, h: 132 },
  stove: { x: 500, y: 128, w: 300, h: 132 },
  plate: { x: 840, y: 128, w: 210, h: 132 },
  serve: { x: 1090, y: 128, w: 174, h: 132 },
  trash: { x: 1090, y: 560, w: 174, h: 120 },
  floor: { x: 16, y: 268, w: 1248, h: 420 },
};

// Pantry slots, top to bottom, so the mouse and the number keys agree.
export const PANTRY_ORDER = ['bun', 'patty', 'lettuce', 'tomato', 'pasta', 'cheese'];

// Palette: warm diner cream and teal, wood floor, tomato-red accents.
export const COLOURS = {
  wall: '#f7ead7', floor: '#d9a86c', floorDark: '#c7955c',
  counter: '#2e7d7b', counterTop: '#3a9a97', counterEdge: '#1f5c5a',
  board: '#fff8e7', boardEdge: '#c9a86a', ink: '#2b2118', muted: '#7a6a58',
  ticket: '#fffdf5', ticketEdge: '#d8c49a', good: '#3d9b4f', warn: '#e8a13a',
  bad: '#d64541', gold: '#f7c948', panel: '#fff3d6',
};
