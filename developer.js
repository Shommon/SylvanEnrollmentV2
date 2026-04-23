'use strict';

let devModeActive = false;
let selectedEl = null;
let dragState = null, resizeState = null;
const positionData = new Map(); // id → {left, top, width, height, hasWidth, hasHeight}

const PAGE1_FIELDS = [
  { id: 'studentName',          hasWidth: true,  hasHeight: true  },
  { id: 'age',                  hasWidth: true,  hasHeight: true  },
  { id: 'dob',                  hasWidth: true,  hasHeight: true  },
  { id: 'school',               hasWidth: true,  hasHeight: true  },
  { id: 'grade',                hasWidth: true,  hasHeight: true  },
  { id: 'custName',             hasWidth: true,  hasHeight: true  },
  { id: 'custRel',              hasWidth: true,  hasHeight: true  },
  { id: 'street',               hasWidth: true,  hasHeight: true  },
  { id: 'city',                 hasWidth: true,  hasHeight: true  },
  { id: 'state',                hasWidth: true,  hasHeight: true  },
  { id: 'zip',                  hasWidth: true,  hasHeight: true  },
  { id: 'email',                hasWidth: true,  hasHeight: true  },
  { id: 'occ',                  hasWidth: true,  hasHeight: true  },
  { id: 'phone',                hasWidth: true,  hasHeight: true  },
  { id: 'phoneTypeCluster',     hasWidth: false, hasHeight: false },
  { id: 'altPhone',             hasWidth: true,  hasHeight: true  },
  { id: 'altPhoneTypeCluster',  hasWidth: false, hasHeight: false },
  { id: 'prefContactCluster',   hasWidth: false, hasHeight: false },
  { id: 'prefOther',            hasWidth: true,  hasHeight: true  },
  { id: 'cust2Name',            hasWidth: true,  hasHeight: true  },
  { id: 'cust2Rel',             hasWidth: true,  hasHeight: true  },
  { id: 'email2',               hasWidth: true,  hasHeight: true  },
  { id: 'occ2',                 hasWidth: true,  hasHeight: true  },
  { id: 'phone2',               hasWidth: true,  hasHeight: true  },
  { id: 'phone2TypeCluster',    hasWidth: false, hasHeight: false },
  { id: 'altPhone2',            hasWidth: true,  hasHeight: true  },
  { id: 'altPhone2TypeCluster', hasWidth: false, hasHeight: false },
  { id: 'prefContact2Cluster',  hasWidth: false, hasHeight: false },
  { id: 'prefOther2',           hasWidth: true,  hasHeight: true  },
  { id: 'siblings1',            hasWidth: true,  hasHeight: true  },
  { id: 'siblings2',            hasWidth: true,  hasHeight: true  },
  { id: 'q1a',                  hasWidth: true,  hasHeight: true  },
  { id: 'q1b',                  hasWidth: true,  hasHeight: true  },
  { id: 'q1c',                  hasWidth: true,  hasHeight: true  },
  { id: 'prevSylvanCluster',    hasWidth: false, hasHeight: false },
  { id: 'q3',                   hasWidth: true,  hasHeight: true  },
  { id: 'q4a',                  hasWidth: true,  hasHeight: true  },
  { id: 'q4b',                  hasWidth: true,  hasHeight: true  },
];

const PAGE2_FIELDS = [
  { id: 'levelCluster',         hasWidth: false, hasHeight: false },
  { id: 'improvementCluster',   hasWidth: false, hasHeight: false },
  { id: 'improvOther',          hasWidth: true,  hasHeight: true  },
  { id: 'iepCluster',           hasWidth: false, hasHeight: false },
  { id: 'q8a',                  hasWidth: true,  hasHeight: true  },
  { id: 'q8b',                  hasWidth: true,  hasHeight: true  },
  { id: 'supportPlanCluster',   hasWidth: false, hasHeight: false },
  { id: 'q10a',                 hasWidth: true,  hasHeight: true  },
  { id: 'q10b',                 hasWidth: true,  hasHeight: true  },
  { id: 'q10c',                 hasWidth: true,  hasHeight: true  },
  { id: 'q11a',                 hasWidth: true,  hasHeight: true  },
  { id: 'q11b',                 hasWidth: true,  hasHeight: true  },
  { id: 'q12',                  hasWidth: true,  hasHeight: true  },
  { id: 'daysCluster',          hasWidth: false, hasHeight: false },
  { id: 'convTimeCluster',      hasWidth: false, hasHeight: false },
  { id: 'paymentCluster',       hasWidth: false, hasHeight: false },
  { id: 'sigCanvas',            hasWidth: true,  hasHeight: true  },
  { id: 'sigDate',              hasWidth: true,  hasHeight: true  },
];

const PAGE3_FIELDS = [
  { id: 'sigCanvas2',           hasWidth: true,  hasHeight: true  },
];

const ALL_FIELDS = [...PAGE1_FIELDS, ...PAGE2_FIELDS, ...PAGE3_FIELDS];

// Track per-element drag handlers so we can remove them on exit
const dragHandlers = new Map(); // id → { el, handler }
const labelEls = new Map(); // id → label div element

// ─────────────────────────────────────────────
// Entry point (called from onclick in index.html)
// ─────────────────────────────────────────────
function developerMode() {
  if (location.protocol === 'file:') {
    alert('Dev Mode requires a local server.\nRun:  python3 -m http.server 8080\nThen open:  http://localhost:8080');
    return;
  }
  if (devModeActive) {
    exitDevMode();
    return;
  }
  promptCredentials();
}

// ─────────────────────────────────────────────
// Login modal
// ─────────────────────────────────────────────
function promptCredentials() {
  const overlay = document.createElement('div');
  overlay.id = 'dev-login-modal';
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'background:rgba(0,0,0,.6)',
    'z-index:99999', 'display:flex', 'align-items:center', 'justify-content:center',
  ].join(';');
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:10px;padding:32px 28px;min-width:300px;box-shadow:0 8px 32px rgba(0,0,0,.3)">
      <h2 style="margin:0 0 20px;font-size:18px;font-family:Arial,sans-serif;color:#222">Dev Mode Login</h2>
      <input id="dev-username" type="text" placeholder="Username" autocomplete="off"
        style="width:100%;padding:8px 10px;margin-bottom:10px;border:1px solid #ccc;border-radius:4px;font-size:14px;box-sizing:border-box">
      <input id="dev-password" type="password" placeholder="Password"
        style="width:100%;padding:8px 10px;margin-bottom:16px;border:1px solid #ccc;border-radius:4px;font-size:14px;box-sizing:border-box">
      <p id="dev-login-error" style="color:#c00;font-size:13px;margin:0 0 12px;font-family:Arial,sans-serif;display:none"></p>
      <button id="dev-login-btn"
        style="width:100%;padding:10px;background:#1a3a6b;color:#fff;border:none;border-radius:5px;font-size:14px;font-weight:700;cursor:pointer">
        Login
      </button>
    </div>`;
  document.body.appendChild(overlay);

  const usernameEl  = document.getElementById('dev-username');
  const passwordEl  = document.getElementById('dev-password');
  const errorEl     = document.getElementById('dev-login-error');
  const loginBtn    = document.getElementById('dev-login-btn');

  function attemptLogin() {
    loginBtn.disabled = true;
    loginBtn.textContent = 'Checking…';
    fetch('developer.json')
      .then(r => r.json())
      .then(creds => {
        if (usernameEl.value === creds.username && passwordEl.value === creds.password) {
          overlay.remove();
          enterDevMode();
        } else {
          errorEl.textContent = 'Invalid credentials.';
          errorEl.style.display = 'block';
          loginBtn.disabled = false;
          loginBtn.textContent = 'Login';
          passwordEl.value = '';
          passwordEl.focus();
        }
      })
      .catch(() => {
        errorEl.textContent = 'Could not load developer.json.';
        errorEl.style.display = 'block';
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
      });
  }

  loginBtn.addEventListener('click', attemptLogin);
  passwordEl.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });
  usernameEl.focus();
}

// ─────────────────────────────────────────────
// Coordinate helpers
// ─────────────────────────────────────────────
function getComputedPercentages(el) {
  const page     = el.closest('.pdf-page');
  const pageRect = page.getBoundingClientRect();
  const elRect   = el.getBoundingClientRect();
  return {
    left:   ((elRect.left - pageRect.left) / page.offsetWidth)  * 100,
    top:    ((elRect.top  - pageRect.top)  / page.offsetHeight) * 100,
    width:  (elRect.width  / page.offsetWidth)  * 100,
    height: (elRect.height / page.offsetHeight) * 100,
  };
}

function buildPositionData() {
  positionData.clear();
  for (const field of ALL_FIELDS) {
    const el = document.getElementById(field.id);
    if (!el) continue;
    const pct = getComputedPercentages(el);
    positionData.set(field.id, {
      left:      pct.left,
      top:       pct.top,
      width:     pct.width,
      height:    pct.height,
      hasWidth:  field.hasWidth,
      hasHeight: field.hasHeight,
    });
  }
}

// ─────────────────────────────────────────────
// Dev panel
// ─────────────────────────────────────────────
function injectDevPanel() {
  const panel = document.createElement('div');
  panel.id = 'dev-panel';
  panel.style.cssText = [
    'position:fixed', 'bottom:80px', 'right:20px', 'z-index:9999',
    'background:#222', 'color:#eee', 'font-family:Arial,sans-serif', 'font-size:13px',
    'border-radius:8px', 'padding:14px 16px', 'box-shadow:0 4px 20px rgba(0,0,0,.5)',
    'min-width:240px',
  ].join(';');
  panel.innerHTML = `
    <div style="font-weight:700;margin-bottom:10px;font-size:14px;color:#ff6400">
      DEV MODE &nbsp;<span id="dev-sel-id" style="color:#aaa;font-weight:400;font-size:12px">(none)</span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:6px;align-items:center">
      <label style="width:44px">left</label>
      <input id="dev-inp-left" type="number" step="0.1"
        style="width:70px;padding:3px 5px;background:#333;color:#eee;border:1px solid #555;border-radius:3px;font-size:12px">
      <span>%</span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:6px;align-items:center">
      <label style="width:44px">top</label>
      <input id="dev-inp-top" type="number" step="0.1"
        style="width:70px;padding:3px 5px;background:#333;color:#eee;border:1px solid #555;border-radius:3px;font-size:12px">
      <span>%</span>
    </div>
    <div id="dev-width-row" style="display:flex;gap:8px;margin-bottom:6px;align-items:center">
      <label style="width:44px">width</label>
      <input id="dev-inp-width" type="number" step="0.1"
        style="width:70px;padding:3px 5px;background:#333;color:#eee;border:1px solid #555;border-radius:3px;font-size:12px">
      <span>%</span>
    </div>
    <div id="dev-height-row" style="display:flex;gap:8px;margin-bottom:10px;align-items:center">
      <label style="width:44px">height</label>
      <input id="dev-inp-height" type="number" step="0.1"
        style="width:70px;padding:3px 5px;background:#333;color:#eee;border:1px solid #555;border-radius:3px;font-size:12px">
      <span>%</span>
    </div>
    <div style="display:flex;gap:8px">
      <button id="dev-export-btn"
        style="flex:1;padding:7px 4px;background:#ff6400;color:#fff;border:none;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer">
        Lock &amp; Export CSS
      </button>
      <button id="dev-exit-btn"
        style="padding:7px 10px;background:#555;color:#fff;border:none;border-radius:4px;font-size:12px;cursor:pointer">
        Exit
      </button>
    </div>`;
  document.body.appendChild(panel);

  // Two-way binding: panel inputs → apply to element
  ['dev-inp-left', 'dev-inp-top', 'dev-inp-width', 'dev-inp-height'].forEach(id => {
    const inp = document.getElementById(id);
    inp.addEventListener('change', applyPanelValues);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') applyPanelValues(); });
  });

  document.getElementById('dev-export-btn').addEventListener('click', lockAndExport);
  document.getElementById('dev-exit-btn').addEventListener('click', exitDevMode);
}

function updatePanelDisplay() {
  const panel = document.getElementById('dev-panel');
  if (!panel) return;

  const selId     = panel.querySelector('#dev-sel-id');
  const leftInp   = panel.querySelector('#dev-inp-left');
  const topInp    = panel.querySelector('#dev-inp-top');
  const widthInp  = panel.querySelector('#dev-inp-width');
  const heightInp = panel.querySelector('#dev-inp-height');
  const widthRow  = panel.querySelector('#dev-width-row');
  const heightRow = panel.querySelector('#dev-height-row');

  if (!selectedEl) {
    if (selId) selId.textContent = '(none)';
    return;
  }

  const d = positionData.get(selectedEl.id);
  if (!d) return;

  selId.textContent   = '#' + selectedEl.id;
  leftInp.value       = parseFloat(d.left.toFixed(2));
  topInp.value        = parseFloat(d.top.toFixed(2));

  if (d.hasWidth) {
    widthRow.style.display  = '';
    widthInp.value = parseFloat(d.width.toFixed(2));
  } else {
    widthRow.style.display  = 'none';
  }

  if (d.hasHeight) {
    heightRow.style.display = '';
    heightInp.value = parseFloat(d.height.toFixed(2));
  } else {
    heightRow.style.display = 'none';
  }
}

function positionLabel(id) {
  const label = labelEls.get(id);
  if (!label) return;
  const d = positionData.get(id);
  if (!d) return;
  label.style.left = d.left + '%';
  label.style.top  = d.top  + '%';
}

function createFieldLabels() {
  for (const field of ALL_FIELDS) {
    const el = document.getElementById(field.id);
    if (!el) continue;
    const overlay = el.closest('.overlay');
    if (!overlay) continue;
    const label = document.createElement('div');
    label.className = 'dev-label';
    label.textContent = field.id;
    overlay.appendChild(label);
    labelEls.set(field.id, label);
    positionLabel(field.id);
  }
}

function removeFieldLabels() {
  for (const label of labelEls.values()) label.remove();
  labelEls.clear();
}

function applyPanelValues() {
  if (!selectedEl) return;
  const d = positionData.get(selectedEl.id);
  if (!d) return;
  const panel = document.getElementById('dev-panel');
  if (!panel) return;

  const leftVal   = parseFloat(panel.querySelector('#dev-inp-left').value);
  const topVal    = parseFloat(panel.querySelector('#dev-inp-top').value);
  const widthVal  = d.hasWidth  ? parseFloat(panel.querySelector('#dev-inp-width').value)  : NaN;
  const heightVal = d.hasHeight ? parseFloat(panel.querySelector('#dev-inp-height').value) : NaN;

  if (!isNaN(leftVal))                  { d.left   = leftVal;   selectedEl.style.left   = leftVal   + '%'; }
  if (!isNaN(topVal))                   { d.top    = topVal;    selectedEl.style.top    = topVal    + '%'; }
  if (!isNaN(widthVal)  && d.hasWidth)  { d.width  = widthVal;  selectedEl.style.width  = widthVal  + '%'; }
  if (!isNaN(heightVal) && d.hasHeight) { d.height = heightVal; selectedEl.style.height = heightVal + '%'; }

  positionData.set(selectedEl.id, d);
  positionLabel(selectedEl.id);
}

// ─────────────────────────────────────────────
// Drag
// ─────────────────────────────────────────────
function makeFieldsDraggable(el) {
  function onMouseDown(e) {
    if (e.target.classList.contains('dev-resize-handle')) return;
    e.stopImmediatePropagation();

    // Select
    if (selectedEl && selectedEl !== el) selectedEl.classList.remove('dev-selected');
    selectedEl = el;
    el.classList.add('dev-selected');
    updatePanelDisplay();

    const page = el.closest('.pdf-page');
    const d    = positionData.get(el.id);
    dragState  = { startX: e.clientX, startY: e.clientY, origLeft: d.left, origTop: d.top, page };

    function onMouseMove(e) {
      if (!dragState) return;
      const newLeft = dragState.origLeft + (e.clientX - dragState.startX) / dragState.page.offsetWidth  * 100;
      const newTop  = dragState.origTop  + (e.clientY - dragState.startY) / dragState.page.offsetHeight * 100;
      el.style.left = newLeft + '%';
      el.style.top  = newTop  + '%';
      const dd = positionData.get(el.id);
      dd.left = newLeft;
      dd.top  = newTop;
      positionData.set(el.id, dd);
      positionLabel(el.id);
      if (selectedEl === el) updatePanelDisplay();
    }

    function onMouseUp() {
      dragState = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  }

  // Capture phase so we intercept before the sigCanvas drawing handler
  el.addEventListener('mousedown', onMouseDown, true);
  dragHandlers.set(el.id, { el, handler: onMouseDown });
}

// ─────────────────────────────────────────────
// Resize
// ─────────────────────────────────────────────
function makeResizable(el) {
  const handle = document.createElement('div');
  handle.className = 'dev-resize-handle';
  el.appendChild(handle);

  handle.addEventListener('mousedown', function(e) {
    e.stopPropagation();
    e.preventDefault();

    const page = el.closest('.pdf-page');
    const d    = positionData.get(el.id);
    resizeState = { startX: e.clientX, startY: e.clientY, origW: d.width, origH: d.height, page };

    function onMouseMove(e) {
      if (!resizeState) return;
      const newW = Math.max(1,   resizeState.origW + (e.clientX - resizeState.startX) / resizeState.page.offsetWidth  * 100);
      const newH = Math.max(0.1, resizeState.origH + (e.clientY - resizeState.startY) / resizeState.page.offsetHeight * 100);
      el.style.width  = newW + '%';
      el.style.height = newH + '%';
      const dd = positionData.get(el.id);
      dd.width  = newW;
      dd.height = newH;
      positionData.set(el.id, dd);
      if (selectedEl === el) updatePanelDisplay();
    }

    function onMouseUp() {
      resizeState = null;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup',   onMouseUp);
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);
  });
}

// ─────────────────────────────────────────────
// Enter / Exit dev mode
// ─────────────────────────────────────────────
function enterDevMode() {
  devModeActive = true;
  buildPositionData();
  createFieldLabels();

  for (const field of ALL_FIELDS) {
    const el = document.getElementById(field.id);
    if (!el) continue;
    makeFieldsDraggable(el);
    if (field.hasWidth && field.hasHeight) makeResizable(el);
  }

  injectDevPanel();
  document.body.classList.add('dev-mode');
  document.getElementById('devModeBtn').textContent = 'Exit Dev Mode';
  window.addEventListener('beforeprint', exitDevMode);
  showToast('Dev Mode active — drag fields to reposition');
}

function exitDevMode() {
  devModeActive = false;

  for (const { el, handler } of dragHandlers.values()) {
    el.removeEventListener('mousedown', handler, true);
  }
  dragHandlers.clear();

  document.querySelectorAll('.dev-resize-handle').forEach(h => h.remove());

  if (selectedEl) { selectedEl.classList.remove('dev-selected'); selectedEl = null; }

  const panel = document.getElementById('dev-panel');
  if (panel) panel.remove();

  document.body.classList.remove('dev-mode');

  const btn = document.getElementById('devModeBtn');
  if (btn) btn.textContent = 'Dev Mode';

  window.removeEventListener('beforeprint', exitDevMode);
  removeFieldLabels();
  positionData.clear();
}

// ─────────────────────────────────────────────
// CSS generation & export
// ─────────────────────────────────────────────
function fmt(n) {
  return parseFloat(n.toFixed(2)).toString();
}

function generatePositionCSS() {
  const lines = ['/* Page 1 */'];
  for (const field of PAGE1_FIELDS) {
    const d = positionData.get(field.id);
    if (!d) continue;
    let rule = `#${field.id.padEnd(22)} { left: ${fmt(d.left)}%;  top: ${fmt(d.top)}%;`;
    if (field.hasWidth)  rule += `  width: ${fmt(d.width)}%;`;
    if (field.hasHeight) rule += `  height: ${fmt(d.height)}%;`;
    if (field.id === 'sigCanvas' || field.id === 'sigCanvas2') rule += `  border-bottom: 1.5px solid #999;`;
    rule += ' }';
    lines.push(rule);
  }
  lines.push('');
  lines.push('/* Page 2 */');
  for (const field of PAGE2_FIELDS) {
    const d = positionData.get(field.id);
    if (!d) continue;
    let rule = `#${field.id.padEnd(22)} { left: ${fmt(d.left)}%;  top: ${fmt(d.top)}%;`;
    if (field.hasWidth)  rule += `  width: ${fmt(d.width)}%;`;
    if (field.hasHeight) rule += `  height: ${fmt(d.height)}%;`;
    if (field.id === 'sigCanvas' || field.id === 'sigCanvas2') rule += `  border-bottom: 1.5px solid #999;`;
    rule += ' }';
    lines.push(rule);
  }
  lines.push('');
  for (const field of PAGE3_FIELDS) {
    const d = positionData.get(field.id);
    if (!d) continue;
    let rule = `#${field.id.padEnd(22)} { left: ${fmt(d.left)}%;  top: ${fmt(d.top)}%;`;
    if (field.hasWidth)  rule += `  width: ${fmt(d.width)}%;`;
    if (field.hasHeight) rule += `  height: ${fmt(d.height)}%;`;
    if (field.id === 'sigCanvas' || field.id === 'sigCanvas2') rule += `  border-bottom: 1.5px solid #999;`;
    rule += ' }';
    lines.push(rule);
  }
  lines.push('');
  return lines.join('\n');
}

async function lockAndExport() {
  const css = generatePositionCSS();

  let existing;
  try {
    existing = await fetch('style.css').then(r => r.text());
  } catch (e) {
    showCopyModal('/* Could not read style.css */\n\n' + css);
    return;
  }

  const sentinel  = '/* \u2500\u2500 Field positions \u2500\u2500 */';
  const parts     = existing.split(sentinel);
  const newContent = parts[0] + sentinel + '\n\n' + css;

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: 'style.css',
      types: [{ description: 'CSS file', accept: { 'text/css': ['.css'] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(newContent);
    await writable.close();
    showToast('style.css saved!');
  } catch (e) {
    // Cancelled or browser doesn't support File System Access API
    showCopyModal(newContent);
  }
}

function showCopyModal(text) {
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'background:rgba(0,0,0,.7)',
    'z-index:99999', 'display:flex', 'align-items:center', 'justify-content:center',
  ].join(';');
  overlay.innerHTML = `
    <div style="background:#fff;border-radius:10px;padding:24px;width:620px;max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,.4)">
      <h3 style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:16px">Replace style.css with this content</h3>
      <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:13px;color:#555">
        Copy the text below and replace the full contents of <code>style.css</code>.
      </p>
      <textarea id="dev-copy-area"
        style="width:100%;height:300px;font-family:monospace;font-size:11.5px;padding:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;resize:vertical"></textarea>
      <div style="display:flex;gap:10px;margin-top:12px">
        <button id="dev-copy-btn"
          style="flex:1;padding:9px;background:#1a3a6b;color:#fff;border:none;border-radius:5px;font-size:14px;cursor:pointer;font-weight:700">
          Copy
        </button>
        <button id="dev-copy-close"
          style="padding:9px 16px;background:#999;color:#fff;border:none;border-radius:5px;font-size:14px;cursor:pointer">
          Close
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  // Use .value instead of innerHTML to avoid HTML-escaping issues
  document.getElementById('dev-copy-area').value = text;

  document.getElementById('dev-copy-btn').addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => {
      document.getElementById('dev-copy-btn').textContent = 'Copied!';
    }).catch(() => {
      document.getElementById('dev-copy-area').select();
      document.execCommand('copy');
      document.getElementById('dev-copy-btn').textContent = 'Copied!';
    });
  });
  document.getElementById('dev-copy-close').addEventListener('click', () => overlay.remove());
}

// ─────────────────────────────────────────────
// Toast notification
// ─────────────────────────────────────────────
function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = [
    'position:fixed', 'bottom:140px', 'right:20px', 'z-index:99999',
    'background:#333', 'color:#fff', 'padding:10px 18px', 'border-radius:6px',
    'font-family:Arial,sans-serif', 'font-size:13px',
    'box-shadow:0 3px 12px rgba(0,0,0,.4)', 'pointer-events:none',
    'transition:opacity .3s',
  ].join(';');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2200);
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  if (location.protocol === 'file:') {
    const btn = document.getElementById('devModeBtn');
    if (btn) btn.style.display = 'none';
  }
});
