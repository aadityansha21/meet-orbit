'use strict';

const API_URL = 'http://127.0.0.1:8765';
const ACCENT = '#facc15';
const GRID = 100; // Diagram coordinate space is GRID x GRID.

const $ = (id) => document.getElementById(id);
const highlight = $('highlight');
const diagram = $('diagram');

/** @type {{imageB64: string, width: number, height: number} | null} */
let capture = null;
let steps = [];
let index = 0;

/** Resets the UI for a fresh capture. */
function reset() {
  steps = [];
  index = 0;
  $('guide').hidden = true;
  $('status').textContent = '';
  $('query').value = '';
  clearHighlight();
  $('query').focus();
}

/** Resizing a canvas clears it, so this doubles as "erase". */
function clearHighlight() {
  highlight.width = window.innerWidth;
  highlight.height = window.innerHeight;
}

/** Outlines the target box, scaled from screenshot pixels to window pixels. */
function drawTarget(box) {
  clearHighlight();
  if (!box || !capture) return;
  const ctx = highlight.getContext('2d');
  const sx = window.innerWidth / capture.width;
  const sy = window.innerHeight / capture.height;
  ctx.strokeStyle = ACCENT;
  ctx.lineWidth = 4;
  ctx.shadowColor = ACCENT;
  ctx.shadowBlur = 16;
  ctx.strokeRect(box.x * sx - 6, box.y * sy - 6, box.w * sx + 12, box.h * sy + 12);
}

/** Renders diagram primitives from the 100x100 grid onto the sketch canvas. */
function drawDiagram(shapes) {
  const ctx = diagram.getContext('2d');
  const sx = diagram.width / GRID;
  const sy = diagram.height / GRID;
  ctx.clearRect(0, 0, diagram.width, diagram.height);
  ctx.strokeStyle = ctx.fillStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.font = '14px system-ui';

  for (const s of shapes) {
    const [x1, y1, x2, y2] = [s.x1 * sx, s.y1 * sy, s.x2 * sx, s.y2 * sy];
    ctx.beginPath();
    switch (s.kind) {
      case 'line':
      case 'arrow':
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (s.kind === 'arrow') drawArrowHead(ctx, x1, y1, x2, y2);
        break;
      case 'rect':
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
        break;
      case 'circle':
        ctx.arc(x1, y1, s.x2 * sx, 0, Math.PI * 2);
        ctx.stroke();
        break;
      default:
        break;
    }
    if (s.label) {
      const atAnchor = s.kind === 'text' || s.kind === 'circle';
      ctx.fillText(s.label, atAnchor ? x1 : x2 + 4, atAnchor ? y1 : y2);
    }
  }
}

function drawArrowHead(ctx, x1, y1, x2, y2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 10;
  ctx.beginPath();
  for (const delta of [-Math.PI / 6, Math.PI / 6]) {
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - size * Math.cos(angle + delta), y2 - size * Math.sin(angle + delta));
  }
  ctx.stroke();
}

/** Shows the step at `index` and syncs navigation controls. */
function renderStep() {
  const step = steps[index];
  $('title').textContent = step.title;
  $('explanation').textContent = step.explanation;
  $('counter').textContent = `${index + 1} / ${steps.length}`;
  $('prev').disabled = index === 0;
  $('next').disabled = index === steps.length - 1;
  diagram.hidden = step.diagram.length === 0;
  drawDiagram(step.diagram);
  drawTarget(step.target);
}

/** Sends the screenshot and question to the backend. */
async function ask(query) {
  if (!capture) return;
  $('status').textContent = 'Thinking…';
  try {
    const res = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_b64: capture.imageB64,
        width: capture.width,
        height: capture.height,
        query,
      }),
    });
    if (!res.ok) throw new Error((await res.json()).detail || res.statusText);
    const guidance = await res.json();
    steps = guidance.steps;
    index = 0;
    $('status').textContent = `${guidance.mode}: ${guidance.summary}`;
    $('guide').hidden = steps.length === 0;
    if (steps.length) renderStep();
  } catch (err) {
    $('status').textContent = `Error: ${err.message}`;
  }
}

window.orbit.onCapture((payload) => {
  capture = payload;
  reset();
});

$('ask').addEventListener('submit', (event) => {
  event.preventDefault();
  ask($('query').value.trim());
});
$('prev').addEventListener('click', () => { index -= 1; renderStep(); });
$('next').addEventListener('click', () => { index += 1; renderStep(); });
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') window.orbit.hide();
});
