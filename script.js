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


// ── PDF Generation (jsPDF + html2canvas) ──
async function handlePrint() {
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;color:#fff;font-family:Arial,sans-serif;font-size:20px';
  overlay.textContent = 'Generating PDF…';
  document.body.appendChild(overlay);
  // Yield so overlay renders
  await new Promise(r => setTimeout(r, 50));

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
  const pages = document.querySelectorAll('.pdf-page');

  for (let i = 0; i < pages.length; i++) {
    const canvas = await html2canvas(pages[i], {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });
    const imgData = canvas.toDataURL('image/jpeg', 0.92);
    if (i > 0) doc.addPage();
    doc.addImage(imgData, 'JPEG', 0, 0, 8.5, 11);
  }

  overlay.remove();
  doc.save('Sylvan-Enrollment.pdf');
}

// ── Email PDF via Google Apps Script ──
async function handleEmail() {
  const subject = prompt('Enter subject (e.g. customer name):', 'Sylvan Enrollment Form');
  if (subject === null) return;

  const recipient = 'sdtai2@outlook.com';

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:99999;display:flex;align-items:center;justify-content:center;color:#fff;font-family:Arial,sans-serif;font-size:20px';
  overlay.textContent = 'Generating PDF…';
  document.body.appendChild(overlay);
  await new Promise(r => setTimeout(r, 50));

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'letter' });
  const pages = document.querySelectorAll('.pdf-page');
  for (let i = 0; i < pages.length; i++) {
    overlay.textContent = 'Capturing page ' + (i + 1) + ' of ' + pages.length + '…';
    const canvas = await html2canvas(pages[i], { scale: 1, useCORS: true, backgroundColor: '#ffffff', logging: false });
    const imgData = canvas.toDataURL('image/jpeg', 0.7);
    if (i > 0) doc.addPage();
    doc.addImage(imgData, 'JPEG', 0, 0, 8.5, 11);
  }

  overlay.textContent = 'Encoding PDF…';
  await new Promise(r => setTimeout(r, 30));

  const pdfBlob = doc.output('blob');
  const reader = new FileReader();
  const base64 = await new Promise(resolve => {
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(pdfBlob);
  });

  overlay.textContent = 'Uploading (' + Math.round(base64.length / 1024) + ' KB)…';

  const scriptUrl = 'https://script.google.com/macros/s/AKfycby3sAVqb96Ay-zVh9i7VhI1Mik8_HWBHOu-VObxjJjipUmhzlizXKhQA0GqwSv735h4/exec';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    const res = await fetch(scriptUrl, {
      method: 'POST',
      mode: 'no-cors',
      body: JSON.stringify({
        pdf: base64,
        to: recipient,
        subject: subject + ' - ' + new Date().toLocaleDateString(),
        body: 'Attached is the Sylvan enrollment form.',
        filename: 'Sylvan-Enrollment-' + Date.now() + '.pdf',
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    overlay.remove();
    alert('Email sent successfully!');
  } catch (err) {
    overlay.remove();
    if (err.name === 'AbortError') {
      alert('Request timed out after 90s. The PDF may be too large or the Apps Script needs to be re-deployed. Try opening ' + scriptUrl + ' in your browser first to authorize it.');
    } else {
      alert('Failed to send: ' + err.message + '\n\nMake sure you have deployed the Apps Script and authorized it by opening the URL in your browser.');
    }
  }
}

// ── Auto-fill student name to other pages ──
const studentNameSrc = document.getElementById('studentName');
if (studentNameSrc) {
  studentNameSrc.addEventListener('input', () => {
    document.querySelectorAll('[id*="studentName" i]').forEach(el => {
      if (el.id !== 'studentName') el.value = studentNameSrc.value;
    });
  });
}

// ── Auto-fill student age to other pages ──
const ageSrc = document.getElementById('age');
if (ageSrc) {
  ageSrc.addEventListener('input', () => {
    document.querySelectorAll('input[id*="Age" i]').forEach(el => {
      if (el !== ageSrc) el.value = ageSrc.value;
    });
  });
}

// ── Auto-fill customer name to other pages ──
const custNameSrc = document.getElementById('custName');
if (custNameSrc) {
  custNameSrc.addEventListener('input', () => {
    document.querySelectorAll('[id*="custName" i], #pubAgreePrintedName').forEach(el => {
      if (el !== custNameSrc) el.value = custNameSrc.value;
    });
  });
}

// ── Auto-fill student DOB to other pages ──
const dobSrc = document.getElementById('dob');
if (dobSrc) {
  dobSrc.addEventListener('input', () => {
    document.querySelectorAll('input[id*="DOB" i]').forEach(el => {
      if (el !== dobSrc) el.value = dobSrc.value;
    });
  });3
}

// ── Auto-fill Grade at School to other pages ──
const gradeSrc = document.getElementById('grade');
if (gradeSrc) {
  gradeSrc.addEventListener('input', () => {
    document.querySelectorAll('[id*="grade" i], #studentGradePg4').forEach(el => {
      if (el !== gradeSrc) el.value = gradeSrc.value;
    });
  });
}

// ── Auto-fill Customer Address to other pages ──
const emailSrc = document.getElementById('email');
if (emailSrc) {
  emailSrc.addEventListener('input', () => {
    document.querySelectorAll('[id*="email" i], #custEmailPg4').forEach(el => {
      if (el !== emailSrc) el.value = emailSrc.value;
    });
  });
}

// ── Init ──
window.addEventListener('load', () => {
  initSignaturePads();
  window.addEventListener('resize', () => {
    signaturePads.forEach(pad => pad.setup());
  });
});