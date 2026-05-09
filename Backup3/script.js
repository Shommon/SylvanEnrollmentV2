// ── Signature Pad ──
class SignaturePad {
  constructor(canvasEl) {
    this.canvas = canvasEl;
    this.drawing = false;
    this.lastX = 0;
    this.lastY = 0;
    this.ctx = null;
  }

  setup() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.ctx.strokeStyle = '#1a3a6b';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  getCtx() {
    this.ctx.strokeStyle = '#1a3a6b';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    return this.ctx;
  }

  getPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if (e.touches && e.touches.length) {
      return {
        x: (e.touches[0].clientX - rect.left),
        y: (e.touches[0].clientY - rect.top)
      };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  onMouseDown(e) {
    this.drawing = true;
    const p = this.getPos(e);
    this.lastX = p.x;
    this.lastY = p.y;
    const ctx = this.getCtx();
    ctx.beginPath();
    ctx.moveTo(this.lastX, this.lastY);
    e.preventDefault();
  }

  onMouseMove(e) {
    if (!this.drawing) return;
    e.preventDefault();
    const ctx = this.getCtx();
    const p = this.getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    this.lastX = p.x;
    this.lastY = p.y;
  }

  onMouseUp() {
    this.drawing = false;
  }

  attachEvents() {
    this.canvas.addEventListener('mousedown', e => this.onMouseDown(e), { passive: false });
    this.canvas.addEventListener('mousemove', e => this.onMouseMove(e), { passive: false });
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp());

    this.canvas.addEventListener('touchstart', e => this.onMouseDown(e), { passive: false });
    this.canvas.addEventListener('touchmove', e => this.onMouseMove(e), { passive: false });
    this.canvas.addEventListener('touchend', () => this.onMouseUp());
  }
}

// ── Initialize all signature canvases ──
const signaturePads = [];

function initSignaturePads() {
  document.querySelectorAll('canvas[id^="sigCanvas"]').forEach((canvas, index) => {
    const pad = new SignaturePad(canvas);
    pad.setup();
    pad.attachEvents();
    signaturePads.push(pad);
  });
}

// Set default date for primary signature
const today = new Date();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const yyyy = today.getFullYear();
document.getElementById('sigDate').value = mm + '/' + dd + '/' + yyyy;
document.getElementById('sigDate2').value = mm + '/' + dd + '/' + yyyy;
document.getElementById('sigDate3').value = mm + '/' + dd + '/' + yyyy;
document.getElementById('sigDate4').value = mm + '/' + dd + '/' + yyyy;
document.getElementById('sigDate5').value = mm + '/' + dd + '/' + yyyy;
document.getElementById('sigDate6').value = mm + '/' + dd + '/' + yyyy;
document.getElementById('sigDate7').value = mm + '/' + dd + '/' + yyyy;


// Init canvases after images load
window.addEventListener('load', () => {
  initSignaturePads();
  window.addEventListener('resize', () => {
    signaturePads.forEach(pad => pad.setup());
  });
});