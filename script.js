// ── Signature Pad ──
const canvas = document.getElementById('sigCanvas');
let drawing = false;
let lastX = 0, lastY = 0;

function setupCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.strokeStyle = '#1a3a6b';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function getCtx() {
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#1a3a6b';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  return ctx;
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  if (e.touches && e.touches.length) {
    return {
      x: (e.touches[0].clientX - rect.left),
      y: (e.touches[0].clientY - rect.top)
    };
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

canvas.addEventListener('mousedown', e => {
  drawing = true;
  const p = getPos(e);
  lastX = p.x; lastY = p.y;
  const ctx = getCtx();
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  e.preventDefault();
}, {passive:false});

canvas.addEventListener('mousemove', e => {
  if (!drawing) return;
  e.preventDefault();
  const ctx = getCtx();
  const p = getPos(e);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  lastX = p.x; lastY = p.y;
}, {passive:false});

canvas.addEventListener('mouseup',    () => { drawing = false; });
canvas.addEventListener('mouseleave', () => { drawing = false; });

canvas.addEventListener('touchstart', e => {
  drawing = true;
  const p = getPos(e);
  lastX = p.x; lastY = p.y;
  const ctx = getCtx();
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  e.preventDefault();
}, {passive:false});

canvas.addEventListener('touchmove', e => {
  if (!drawing) return;
  e.preventDefault();
  const ctx = getCtx();
  const p = getPos(e);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  lastX = p.x; lastY = p.y;
}, {passive:false});

canvas.addEventListener('touchend', () => { drawing = false; });

// Set default date
const today = new Date();
const mm = String(today.getMonth()+1).padStart(2,'0');
const dd = String(today.getDate()).padStart(2,'0');
const yyyy = today.getFullYear();
document.getElementById('sigDate').value = mm + '/' + dd + '/' + yyyy;

// Init canvas after images load
window.addEventListener('load', () => {
  setupCanvas();
  // Re-setup on resize
  window.addEventListener('resize', setupCanvas);
});



