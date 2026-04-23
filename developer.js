'use strict';

let devModeActive = false;
let selectedEl = null;
let dragState = null, resizeState = null;
const positionData = new Map(); // id → {left, top, width, height, hasWidth, hasHeight}
let textboxCounter = 0;
const dynamicFields = []; // user-created textboxes

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
  { id: 'state',               hasWidth: true,  hasHeight: true  },
  { id: 'zip',                 hasWidth: true,  hasHeight: true  },
  { id: 'email',               hasWidth: true,  hasHeight: true  },
  { id: 'occ',                 hasWidth: true,  hasHeight: true  },
  { id: 'phone',               hasWidth: true,  hasHeight: true  },
  { id: 'phoneTypeCluster',     hasWidth: false, hasHeight: false },
  { id: 'altPhone',            hasWidth: true,  hasHeight: true  },
  { id: 'altPhoneTypeCluster',  hasWidth: false, hasHeight: false },
  { id: 'prefContactCluster',   hasWidth: false, hasHeight: false },
  { id: 'prefOther',          hasWidth: true,  hasHeight: true  },
  { id: 'cust2Name',          hasWidth: true,  hasHeight: true  },
  { id: 'cust2Rel',           hasWidth: true,  hasHeight: true  },
  { id: 'email2',             hasWidth: true,  hasHeight: true  },
  { id: 'occ2',               hasWidth: true,  hasHeight: true  },
  { id: 'phone2',             hasWidth: true,  hasHeight: true  },
  { id: 'phone2TypeCluster',  hasWidth: false, hasHeight: false },
  { id: 'altPhone2',          hasWidth: true,  hasHeight: true  },
  { id: 'altPhone2TypeCluster', hasWidth: false, hasHeight: false },
  { id: 'prefContact2Cluster', hasWidth: false, hasHeight: false },
  { id: 'prefOther2',         hasWidth: true,  hasHeight: true  },
  { id: 'siblings1',          hasWidth: true,  hasHeight: true  },
  { id: 'siblings2',          hasWidth: true,  hasHeight: true  },
  { id: 'q1a',                hasWidth: true,  hasHeight: true  },
  { id: 'q1b',                hasWidth: true,  hasHeight: true  },
  { id: 'q1c',                hasWidth: true,  hasHeight: true  },
  { id: 'prevSylvanCluster', hasWidth: false, hasHeight: false },
  { id: 'q3',                 hasWidth: true,  hasHeight: true  },
  { id: 'q4a',                hasWidth: true,  hasHeight: true  },
  { id: 'q4b',                hasWidth: true,  hasHeight: true  },
];

let PAGE2_FIELDS = [
  { id: 'levelCluster',         hasWidth: false, hasHeight: false },
  { id: 'improvementCluster',   hasWidth: false, hasHeight: false },
  { id: 'improvOther',        hasWidth: true,  hasHeight: true  },
  { id: 'iepCluster',         hasWidth: false, hasHeight: false },
  { id: 'q8',               hasWidth: true,  hasHeight: true  },
  { id: 'supportPlanCluster', hasWidth: false, hasHeight: false },
  { id: 'q10',              hasWidth: true,  hasHeight: true  },
  { id: 'q11a',             hasWidth: true,  hasHeight: true  },
  { id: 'q11b',             hasWidth: true,  hasHeight: true  },
  { id: 'q12',              hasWidth: true,  hasHeight: true  },
  { id: 'daysCluster',       hasWidth: false, hasHeight: false },
  { id: 'convTimeCluster',    hasWidth: false, hasHeight: false },
  { id: 'paymentCluster',     hasWidth: false, hasHeight: false },
  { id: 'sigCanvas',        hasWidth: true,  hasHeight: true  },
  { id: 'sigDate',          hasWidth: true,  hasHeight: true  },
];

let PAGE3_FIELDS = [];
let PAGE4_FIELDS = [];

let ALL_FIELDS = [...PAGE1_FIELDS, ...PAGE2_FIELDS, ...PAGE3_FIELDS, ...PAGE4_FIELDS];

function rebuildAllFields() {
  ALL_FIELDS.length = 0;
  ALL_FIELDS.push(...PAGE1_FIELDS, ...PAGE2_FIELDS, ...PAGE3_FIELDS, ...PAGE4_FIELDS);
}

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

  const modalDiv = document.createElement('div');
  modalDiv.style.cssText = 'background:#fff;border-radius:10px;padding:32px 28px;min-width:300px;box-shadow:0 8px 32px rgba(0,0,0,.3)';

  const h2 = document.createElement('h2');
  h2.style.cssText = 'margin:0 0 20px;font-size:18px;font-family:Arial,sans-serif;color:#222';
  h2.textContent = 'Dev Mode Login';
  modalDiv.appendChild(h2);

  const usernameInp = document.createElement('input');
  usernameInp.id = 'dev-username';
  usernameInp.type = 'text';
  usernameInp.placeholder = 'Username';
  usernameInp.autocomplete = 'off';
  usernameInp.style.cssText = 'width:100%;padding:8px 10px;margin-bottom:10px;border:1px solid #ccc;border-radius:4px;font-size:14px;box-sizing:border-box';
  modalDiv.appendChild(usernameInp);

  const passwordInp = document.createElement('input');
  passwordInp.id = 'dev-password';
  passwordInp.type = 'password';
  passwordInp.placeholder = 'Password';
  passwordInp.style.cssText = 'width:100%;padding:8px 10px;margin-bottom:16px;border:1px solid #ccc;border-radius:4px;font-size:14px;box-sizing:border-box';
  modalDiv.appendChild(passwordInp);

  const errorP = document.createElement('p');
  errorP.id = 'dev-login-error';
  errorP.style.cssText = 'color:#c00;font-size:13px;margin:0 0 12px;font-family:Arial,sans-serif;display:none';
  modalDiv.appendChild(errorP);

  const loginBtn = document.createElement('button');
  loginBtn.id = 'dev-login-btn';
  loginBtn.style.cssText = 'width:100%;padding:10px;background:#1a3a6b;color:#fff;border:none;border-radius:5px;font-size:14px;font-weight:700;cursor:pointer';
  loginBtn.textContent = 'Login';
  modalDiv.appendChild(loginBtn);

  overlay.appendChild(modalDiv);
  document.body.appendChild(overlay);

  const usernameEl = document.getElementById('dev-username');
  const passwordEl = document.getElementById('dev-password');
  const errorEl = document.getElementById('dev-login-error');
  const loginBtnEl = document.getElementById('dev-login-btn');

  function attemptLogin() {
    loginBtnEl.disabled = true;
    loginBtnEl.textContent = 'Checking…';
    fetch('developer.json')
      .then(r => r.json())
      .then(creds => {
        if (usernameEl.value === creds.username && passwordEl.value === creds.password) {
          overlay.remove();
          enterDevMode();
        } else {
          errorEl.textContent = 'Invalid credentials.';
          errorEl.style.display = 'block';
          loginBtnEl.disabled = false;
          loginBtnEl.textContent = 'Login';
          passwordEl.value = '';
          passwordEl.focus();
        }
      })
      .catch(() => {
        errorEl.textContent = 'Could not load developer.json.';
        errorEl.style.display = 'block';
        loginBtnEl.disabled = false;
        loginBtnEl.textContent = 'Login';
      });
  }

  loginBtnEl.addEventListener('click', attemptLogin);
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

  const titleDiv = document.createElement('div');
  titleDiv.style.cssText = 'font-weight:700;margin-bottom:10px;font-size:14px;color:#ff6400';
  titleDiv.innerHTML = 'DEV MODE &nbsp;<span id="dev-sel-id" style="color:#aaa;font-weight:400;font-size:12px">(none)</span>';
  panel.appendChild(titleDiv);

  function createRow(labelText) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;gap:8px;margin-bottom:6px;align-items:center';
    const label = document.createElement('label');
    label.style.cssText = 'width:44px';
    label.textContent = labelText;
    row.appendChild(label);
    return row;
  }

  const leftRow = createRow('left');
  const leftInp = document.createElement('input');
  leftInp.id = 'dev-inp-left';
  leftInp.type = 'number';
  leftInp.step = '0.1';
  leftInp.style.cssText = 'width:70px;padding:3px 5px;background:#333;color:#eee;border:1px solid #555;border-radius:3px;font-size:12px';
  leftRow.appendChild(leftInp);
  const leftSpan = document.createElement('span');
  leftSpan.textContent = '%';
  leftRow.appendChild(leftSpan);
  panel.appendChild(leftRow);

  const topRow = createRow('top');
  const topInp = document.createElement('input');
  topInp.id = 'dev-inp-top';
  topInp.type = 'number';
  topInp.step = '0.1';
  topInp.style.cssText = 'width:70px;padding:3px 5px;background:#333;color:#eee;border:1px solid #555;border-radius:3px;font-size:12px';
  topRow.appendChild(topInp);
  const topSpan = document.createElement('span');
  topSpan.textContent = '%';
  topRow.appendChild(topSpan);
  panel.appendChild(topRow);

  const widthRow = createRow('width');
  widthRow.id = 'dev-width-row';
  const widthInp = document.createElement('input');
  widthInp.id = 'dev-inp-width';
  widthInp.type = 'number';
  widthInp.step = '0.1';
  widthInp.style.cssText = 'width:70px;padding:3px 5px;background:#333;color:#eee;border:1px solid #555;border-radius:3px;font-size:12px';
  widthRow.appendChild(widthInp);
  const widthSpan = document.createElement('span');
  widthSpan.textContent = '%';
  widthRow.appendChild(widthSpan);
  panel.appendChild(widthRow);

  const heightRow = createRow('height');
  heightRow.id = 'dev-height-row';
  const heightInp = document.createElement('input');
  heightInp.id = 'dev-inp-height';
  heightInp.type = 'number';
  heightInp.step = '0.1';
  heightInp.style.cssText = 'width:70px;padding:3px 5px;background:#333;color:#eee;border:1px solid #555;border-radius:3px;font-size:12px';
  heightRow.appendChild(heightInp);
  const heightSpan = document.createElement('span');
  heightSpan.textContent = '%';
  heightRow.appendChild(heightSpan);
  panel.appendChild(heightRow);

  const btnDiv = document.createElement('div');
  btnDiv.style.cssText = 'display:flex;gap:8px;margin-bottom:10px';

  const exportBtn = document.createElement('button');
  exportBtn.id = 'dev-export-btn';
  exportBtn.style.cssText = 'flex:1;padding:7px 4px;background:#ff6400;color:#fff;border:none;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer';
  exportBtn.innerHTML = 'Lock &amp; Export CSS';
  btnDiv.appendChild(exportBtn);

  const exitBtn = document.createElement('button');
  exitBtn.id = 'dev-exit-btn';
  exitBtn.style.cssText = 'padding:7px 10px;background:#555;color:#fff;border:none;border-radius:4px;font-size:12px;cursor:pointer';
  exitBtn.textContent = 'Exit';
  btnDiv.appendChild(exitBtn);
  panel.appendChild(btnDiv);

  const idRow = document.createElement('div');
  idRow.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center';
  const idLabel = document.createElement('label');
  idLabel.style.cssText = 'width:44px;font-size:12px';
  idLabel.textContent = 'ID';
  idRow.appendChild(idLabel);
  const idInp = document.createElement('input');
  idInp.id = 'dev-textbox-id';
  idInp.type = 'text';
  idInp.style.cssText = 'flex:1;padding:5px 7px;background:#333;color:#eee;border:1px solid #555;border-radius:3px;font-size:12px';
  idInp.placeholder = 'textbox1';
  idRow.appendChild(idInp);
  panel.appendChild(idRow);

  const addBtn = document.createElement('button');
  addBtn.id = 'dev-add-textbox-btn';
  addBtn.style.cssText = 'width:100%;padding:7px;background:#1a3a6b;color:#fff;border:none;border-radius:4px;font-size:12px;font-weight:700;cursor:pointer';
  addBtn.textContent = '+ Add Textbox';
  panel.appendChild(addBtn);

  document.body.appendChild(panel);

  ['dev-inp-left', 'dev-inp-top', 'dev-inp-width', 'dev-inp-height'].forEach(id => {
    const inp = document.getElementById(id);
    inp.addEventListener('change', applyPanelValues);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') applyPanelValues(); });
  });

  updateTextboxIdInput();

  document.getElementById('dev-export-btn').addEventListener('click', lockAndExport);
  document.getElementById('dev-exit-btn').addEventListener('click', exitDevMode);
  document.getElementById('dev-add-textbox-btn').addEventListener('click', () => {
    const idInp = document.getElementById('dev-textbox-id');
    let customId = idInp.value.trim();
    if (!customId) {
      customId = getNextTextboxId();
    }
    if (customId.indexOf(' ') !== -1) {
      showToast('ID cannot contain spaces');
      return;
    }
    if (!isIdUnique(customId)) {
      showToast('ID already exists: ' + customId);
      return;
    }
    const page = getCurrentPage();
    createTextBox(page, customId);
    updateTextboxIdInput();
    showToast('Created ' + getLastCreatedId());
  });
}

function isIdUnique(id) {
  return !dynamicFields.some(f => f.id === id);
}

function getNextTextboxId() {
  let num = textboxCounter + 1;
  while (!isIdUnique('textbox' + num)) { num++; }
  return 'textbox' + num;
}

function getLastCreatedId() {
  if (dynamicFields.length > 0) {
    return dynamicFields[dynamicFields.length - 1].id;
  }
  return '';
}

function updateTextboxIdInput() {
  const idInp = document.getElementById('dev-textbox-id');
  if (idInp) {
    idInp.value = getNextTextboxId();
  }
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
  rebuildAllFields();
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
  showToast('Dev Mode active - drag fields to reposition');
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
    let rule = '#' + field.id.padEnd(22) + ' { left: ' + fmt(d.left) + '%;  top: ' + fmt(d.top) + '%;';
    if (field.hasWidth)  rule += '  width: ' + fmt(d.width) + '%;';
    if (field.hasHeight) rule += '  height: ' + fmt(d.height) + '%;';
    if (field.id === 'sigCanvas') rule += '  border-bottom: 1.5px solid #999;';
    rule += ' }';
    lines.push(rule);
  }
  lines.push('');
  lines.push('/* Page 2 */');
  for (const field of PAGE2_FIELDS) {
    const d = positionData.get(field.id);
    if (!d) continue;
    let rule = '#' + field.id.padEnd(22) + ' { left: ' + fmt(d.left) + '%;  top: ' + fmt(d.top) + '%;';
    if (field.hasWidth)  rule += '  width: ' + fmt(d.width) + '%;';
    if (field.hasHeight) rule += '  height: ' + fmt(d.height) + '%;';
    if (field.id === 'sigCanvas') rule += '  border-bottom: 1.5px solid #999;';
    rule += ' }';
    lines.push(rule);
  }
  lines.push('');
  lines.push('/* Dynamic textboxes */');
  for (const field of dynamicFields) {
    const d = positionData.get(field.id);
    if (!d) continue;
    let rule = '#' + field.id.padEnd(22) + ' { left: ' + fmt(d.left) + '%;  top: ' + fmt(d.top) + '%;';
    if (field.hasWidth)  rule += '  width: ' + fmt(d.width) + '%;';
    if (field.hasHeight) rule += '  height: ' + fmt(d.height) + '%;';
    rule += ' }';
    lines.push(rule);
  }
  lines.push('');
  return lines.join('\n');
}

function generateTextboxJS() {
  if (dynamicFields.length === 0) return '';
  const lines = [];
  lines.push('// Generated textboxes - DO NOT EDIT');
  lines.push('document.addEventListener(\'DOMContentLoaded\', function() {');
  for (const field of dynamicFields) {
    const d = positionData.get(field.id);
    if (!d) continue;
    const pageId = field.pageId || '';
    lines.push('  createTextBoxForPage(' + d.left + ', ' + d.top + ', ' + d.width + ', ' + d.height + ', \'' + field.id + '\', \'' + pageId + '\');');
  }
  lines.push('});');
  return lines.join('\n');
}

async function lockAndExport() {
  const css = generatePositionCSS();
  const textboxJS = generateTextboxJS();

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
  }

  if (textboxJS) {
    try {
      const handleJS = await window.showSaveFilePicker({
        suggestedName: 'generated-textboxes.js',
        types: [{ description: 'JavaScript file', accept: { 'text/javascript': ['.js'] } }],
      });
      const writableJS = await handleJS.createWritable();
      await writableJS.write(textboxJS);
      await writableJS.close();
      showToast('generated-textboxes.js saved!');
      showCopyModal('/* style.css */\n\n' + css + '\n\n\n/* generated-textboxes.js */\n\n' + textboxJS);
    } catch (e) {
      showCopyModal('/* style.css */\n\n' + css + '\n\n\n/* generated-textboxes.js */\n\n' + textboxJS);
    }
  } else {
    showCopyModal('/* style.css */\n\n' + css);
  }
}

function showCopyModal(text) {
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'background:rgba(0,0,0,.7)',
    'z-index:99999', 'display:flex', 'align-items:center', 'justify-content:center',
  ].join(';');

  const container = document.createElement('div');
  container.style.cssText = 'background:#fff;border-radius:10px;padding:24px;width:620px;max-width:95vw;box-shadow:0 8px 32px rgba(0,0,0,.4)';

  const h3 = document.createElement('h3');
  h3.style.cssText = 'margin:0 0 8px;font-family:Arial,sans-serif;font-size:16px';
  h3.textContent = 'Replace style.css with this content';
  container.appendChild(h3);

  const p = document.createElement('p');
  p.style.cssText = 'margin:0 0 10px;font-family:Arial,sans-serif;font-size:13px;color:#555';
  p.innerHTML = 'Copy the text below and replace the full contents of <code>style.css</code>.';
  container.appendChild(p);

  const textarea = document.createElement('textarea');
  textarea.id = 'dev-copy-area';
  textarea.style.cssText = 'width:100%;height:300px;font-family:monospace;font-size:11.5px;padding:8px;border:1px solid #ccc;border-radius:4px;box-sizing:border-box;resize:vertical';
  container.appendChild(textarea);

  const btnDiv = document.createElement('div');
  btnDiv.style.cssText = 'display:flex;gap:10px;margin-top:12px';

  const copyBtn = document.createElement('button');
  copyBtn.id = 'dev-copy-btn';
  copyBtn.style.cssText = 'flex:1;padding:9px;background:#1a3a6b;color:#fff;border:none;border-radius:5px;font-size:14px;cursor:pointer;font-weight:700';
  copyBtn.textContent = 'Copy';
  btnDiv.appendChild(copyBtn);

  const closeBtn = document.createElement('button');
  closeBtn.id = 'dev-copy-close';
  closeBtn.style.cssText = 'padding:9px 16px;background:#999;color:#fff;border:none;border-radius:5px;font-size:14px;cursor:pointer';
  closeBtn.textContent = 'Close';
  btnDiv.appendChild(closeBtn);

  container.appendChild(btnDiv);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  textarea.value = text;

  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.textContent = 'Copied!';
    }).catch(() => {
      textarea.select();
      document.execCommand('copy');
      copyBtn.textContent = 'Copied!';
    });
  });
  closeBtn.addEventListener('click', () => overlay.remove());
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

// Create new textbox
function getCurrentPage() {
  const pages = document.querySelectorAll('.pdf-page');
  for (const page of pages) {
    const rect = page.getBoundingClientRect();
    if (rect.top <= window.innerHeight / 2 && rect.bottom > window.innerHeight / 2) {
      return page;
    }
  }
  return pages[0];
}

function createTextBox(pageDiv, customId) {
  textboxCounter++;
  const id = customId || 'textbox' + textboxCounter;
  const pageId = pageDiv.id || '';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'f';
  input.id = id;

  input.style.position = 'absolute';
  input.style.left = '30%';
  input.style.top = '49%';
  input.style.width = '40%';
  input.style.height = '2.2%';

  const overlay = pageDiv.querySelector('.overlay');
  if (overlay) {
    overlay.appendChild(input);
  } else {
    pageDiv.appendChild(input);
  }

  positionData.set(id, {
    left: 30,
    top: 49,
    width: 40,
    height: 2.2,
    hasWidth: true,
    hasHeight: true,
  });

  const fieldData = { id: id, hasWidth: true, hasHeight: true, pageId: pageId };
  dynamicFields.push(fieldData);

  if (pageId === 'page1' || pageId === '') {
    PAGE1_FIELDS.push({ id: id, hasWidth: true, hasHeight: true });
  } else if (pageId === 'page2') {
    PAGE2_FIELDS.push({ id: id, hasWidth: true, hasHeight: true });
  } else if (pageId === 'page3') {
    PAGE3_FIELDS.push({ id: id, hasWidth: true, hasHeight: true });
  } else if (pageId === 'page4') {
    PAGE4_FIELDS.push({ id: id, hasWidth: true, hasHeight: true });
  }

  rebuildAllFields();

  makeFieldsDraggable(input);
  makeResizable(input);

  showToast('Created ' + id + ' on ' + pageId);

  return input;
}

function createTextBoxForPage(left, top, width, height, id, pageId) {
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'f';
  input.id = id;

  input.style.position = 'absolute';
  input.style.left = left + '%';
  input.style.top = top + '%';
  input.style.width = width + '%';
  input.style.height = height + '%';

  let targetPage = null;
  if (pageId) {
    targetPage = document.getElementById(pageId);
  }
  if (!targetPage) {
    targetPage = document.querySelector('.pdf-page');
  }
  if (targetPage) {
    const overlay = targetPage.querySelector('.overlay');
    if (overlay) {
      overlay.appendChild(input);
    } else {
      targetPage.appendChild(input);
    }
  }

  return input;
}


