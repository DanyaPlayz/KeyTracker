const activeKeysDisplay = document.getElementById('activeKeys');
const cpsDisplay = document.getElementById('cps');
const pointerCanvas = document.getElementById('pointerCanvas');
const pointerCtx = pointerCanvas.getContext('2d');
const mouseButtons = {
  0: document.getElementById('mouse-left'),
  1: document.getElementById('mouse-middle'),
  2: document.getElementById('mouse-right'),
};
const pressedKeys = new Set();
const clickTimes = [];
const modeSelect = document.getElementById('modeSelect');
const waterfallKeysSelect = document.getElementById('waterfallKeysSelect');
const waterfallKeys = new Set(['q', 'w', 'e', 'r', 't', 'y', 'a', 's', 'd', 'f', 'g', 'z', 'x', 'c', 'v']);
let currentMode = 'normal';
const pointerTraces = [];
const traceOptions = {
  mouse: {
    color: 'rgba(125, 211, 252, 0.9)',
    radius: 12,
  },
  touch: {
    color: 'rgba(110, 231, 183, 0.9)',
    radius: 20,
  },
};
const keyMapping = [
  ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
  ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
  ['CapsLock', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
  ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
  ['Ctrl', 'Win', 'Alt', 'Space', 'Alt', 'Fn', 'Menu', 'Ctrl'],
];

function buildKeyboard() {
  const rowFn = document.getElementById('row-fn');
  const rowTop = document.getElementById('row-top');
  const rowQ = document.getElementById('row-q');
  const rowA = document.getElementById('row-a');
  const rowZ = document.getElementById('row-z');
  const rowArrows = document.getElementById('row-arrows');

  keyMapping[0].forEach(label => rowFn.appendChild(createKey(label, 'wide')));
  keyMapping[1].forEach(label => rowTop.appendChild(createKey(label, label === 'Backspace' ? 'xl' : '')));
  keyMapping[2].forEach(label => rowQ.appendChild(createKey(label, label === 'Tab' ? 'xl' : '')));
  keyMapping[3].forEach(label => rowA.appendChild(createKey(label, label === 'CapsLock' ? 'xl' : label === 'Enter' ? 'xl' : '')));
  keyMapping[4].forEach(label => rowZ.appendChild(createKey(label, label.includes('Shift') ? 'xl' : '')));
  ['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].forEach(label => rowArrows.appendChild(createKey(label, 'wide')));
}

function createKey(label, extraClass = '') {
  const key = document.createElement('div');
  key.className = `key ${extraClass}`.trim();
  key.dataset.key = label.toLowerCase();
  key.innerText = label;
  const waterfallContainer = document.createElement('div');
  waterfallContainer.className = 'waterfall-layer';
  key.appendChild(waterfallContainer);
  return key;
}

function normalizeKey(key) {
  if (key === ' ') return 'space';
  if (key === 'esc') return 'esc';
  return key.toLowerCase();
}

function updateActiveKeys() {
  if (pressedKeys.size === 0) {
    activeKeysDisplay.textContent = 'None';
    return;
  }
  const keys = Array.from(pressedKeys).sort();
  activeKeysDisplay.textContent = keys.join(', ');
}

function setKeyState(key, active) {
  const normalized = normalizeKey(key);
  const keyElement = document.querySelector(`.key[data-key="${CSS.escape(normalized)}"]`);
  if (keyElement) {
    keyElement.classList.toggle('active', active);
  }
}

function updateWaterfallKeySelectionState() {
  document.querySelectorAll('.key').forEach(keyElement => {
    const keyName = keyElement.dataset.key;
    keyElement.classList.toggle('waterfall-target', waterfallKeys.has(keyName) && currentMode === 'waterfall');
  });
}

function createWaterfallDrop(keyName) {
  const keyElement = document.querySelector(`.key[data-key="${CSS.escape(keyName)}"]`);
  if (!keyElement) return;
  const drop = document.createElement('div');
  drop.className = 'waterfall-drop';
  const leftPosition = 12 + Math.random() * 56;
  drop.style.left = `${leftPosition}%`;
  keyElement.appendChild(drop);
  requestAnimationFrame(() => drop.classList.add('visible'));
  setTimeout(() => drop.remove(), 800);
}

function handleKeyDown(event) {
  const keyName = normalizeKey(event.key);
  pressedKeys.add(keyName);
  setKeyState(keyName, true);
  updateActiveKeys();
  if (currentMode === 'waterfall' && waterfallKeys.has(keyName)) {
    createWaterfallDrop(keyName);
  }
}

function handleKeyUp(event) {
  const keyName = normalizeKey(event.key);
  pressedKeys.delete(keyName);
  setKeyState(keyName, false);
  updateActiveKeys();
}

function handleMouseDown(event) {
  const button = event.button;
  const buttonElement = mouseButtons[button];
  if (buttonElement) {
    buttonElement.classList.add('active');
  }
}

function handleMouseUp(event) {
  const button = event.button;
  const buttonElement = mouseButtons[button];
  if (buttonElement) {
    buttonElement.classList.remove('active');
  }
}

function recordClick() {
  const now = performance.now();
  clickTimes.push(now);
  while (clickTimes.length && now - clickTimes[0] > 1000) {
    clickTimes.shift();
  }
  cpsDisplay.textContent = clickTimes.length.toFixed(2);
}

function handleClick(event) {
  if (event.button === 0 || event.button === 1 || event.button === 2) {
    recordClick();
  }
}

function handleWheel() {
  const scrollKey = document.querySelector('#mouse-scroll');
  if (!scrollKey) return;
  scrollKey.classList.add('active');
  setTimeout(() => scrollKey.classList.remove('active'), 120);
}

function buildWaterfallOptions() {
  const allKeys = Array.from(new Set(keyMapping.flat().concat(['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'])));
  allKeys.sort();
  allKeys.forEach(label => {
    const option = document.createElement('option');
    option.value = normalizeKey(label);
    option.textContent = label;
    if (waterfallKeys.has(normalizeKey(label))) {
      option.selected = true;
    }
    waterfallKeysSelect.appendChild(option);
  });
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  pointerCanvas.width = window.innerWidth * ratio;
  pointerCanvas.height = window.innerHeight * ratio;
  pointerCanvas.style.width = `${window.innerWidth}px`;
  pointerCanvas.style.height = `${window.innerHeight}px`;
  pointerCtx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function drawPointerTraces() {
  pointerCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  pointerTraces.forEach(trace => {
    const opts = traceOptions[trace.type] || traceOptions.mouse;
    if (trace.points.length > 1) {
      pointerCtx.strokeStyle = opts.color;
      pointerCtx.lineWidth = opts.radius * 0.8;
      pointerCtx.lineCap = 'round';
      pointerCtx.beginPath();
      pointerCtx.moveTo(trace.points[0].x, trace.points[0].y);
      trace.points.forEach(point => {
        pointerCtx.lineTo(point.x, point.y);
      });
      pointerCtx.stroke();
    }
    const current = trace.points[trace.points.length - 1];
    pointerCtx.fillStyle = opts.color;
    pointerCtx.beginPath();
    pointerCtx.arc(current.x, current.y, opts.radius, 0, Math.PI * 2);
    pointerCtx.fill();
  });
}

function startPointerTrace(event) {
  pointerTraces.push({
    id: event.pointerId,
    type: event.pointerType,
    points: [{ x: event.clientX, y: event.clientY }],
    active: true,
  });
  drawPointerTraces();
}

function updatePointerTrace(event) {
  const trace = pointerTraces.find(t => t.id === event.pointerId);
  if (!trace || !trace.active) return;
  trace.points.push({ x: event.clientX, y: event.clientY });
  if (trace.points.length > 40) trace.points.shift();
  drawPointerTraces();
}

function endPointerTrace(event) {
  const trace = pointerTraces.find(t => t.id === event.pointerId);
  if (!trace) return;
  trace.active = false;
  setTimeout(() => {
    const index = pointerTraces.indexOf(trace);
    if (index !== -1) {
      pointerTraces.splice(index, 1);
      drawPointerTraces();
    }
  }, 400);
}

function init() {
  buildKeyboard();
  buildWaterfallOptions();
  updateWaterfallKeySelectionState();
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  modeSelect.addEventListener('change', event => {
    currentMode = event.target.value;
    updateWaterfallKeySelectionState();
  });
  waterfallKeysSelect.addEventListener('change', event => {
    waterfallKeys.clear();
    Array.from(event.target.selectedOptions).forEach(option => waterfallKeys.add(option.value));
    updateWaterfallKeySelectionState();
  });
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', () => {
    pressedKeys.clear();
    document.querySelectorAll('.key.active').forEach(el => el.classList.remove('active'));
    updateActiveKeys();
  });
  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('click', handleClick);
  window.addEventListener('wheel', handleWheel, { passive: true });
  window.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' || event.pointerType === 'touch') {
      startPointerTrace(event);
    }
  }, { passive: true });
  window.addEventListener('pointermove', event => {
    if (event.pointerType === 'mouse' || event.pointerType === 'touch') {
      updatePointerTrace(event);
    }
  }, { passive: true });
  window.addEventListener('pointerup', endPointerTrace, { passive: true });
  window.addEventListener('pointercancel', endPointerTrace, { passive: true });
}

init();
