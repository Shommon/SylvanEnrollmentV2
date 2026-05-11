# SylvanEnrollmentV2

A static HTML enrollment form with 7 pages. No build system, tests, or linting.

## Project structure

```
index.html     - HTML markup for all 7 pages (input fields, canvases, radio clusters)
script.js      - Signature pads, PDF generation, email, auto-fill behavior
developer.js   - Dev Mode: drag/resize fields, field discovery, CSS export
style.css      - Positioning and styling for all fields
pages/         - Background images (p1.jpg … p7.jpg)
AGENTS.md      - This file
```

## Key design decisions

### Field discovery (developer.js) — dynamic DOM-based

There are **no hardcoded `PAGE#_FIELDS` arrays.** Instead, `getPageFields(num)` scans `#pageN .overlay` for all elements with an `id` attribute at runtime. The `hasWidth`/`hasHeight` flags are inferred from the element class:

- `.radio-cluster` → `hasWidth: false, hasHeight: false`
- Everything else → `hasWidth: true, hasHeight: true`

**Adding a new input field:** Just add it to `index.html` with an `id`. Dev mode, `showID()`, and `resetFields()` pick it up automatically.

`logPageFields()` can be called from the console to print the current field arrays if needed.

## Form features

### Auto-fill student name
Typing in `#studentName` (page 1) automatically syncs to all other fields whose `id` contains "studentName" (case-insensitive), currently:
- `#studentNamePg4` (page 4)
- `#studentNamePg7` (page 7)

Implemented in `script.js` via an `input` event listener with `[id*="studentName" i]` selector.

### Auto-fill student age
Typing in `#age` (page 1) automatically syncs to all `<input>` elements whose `id` contains "Age" (case-insensitive), currently:
- `#studentAgePg4` (page 4)

Implemented in `script.js` via an `input` event listener with `input[id*="Age" i]` selector.

### Auto-fill student DOB
Typing in `#dob` (page 1) automatically syncs to all `<input>` elements whose `id` contains "DOB" (case-insensitive), currently:
- `#studentDOBPg4` (page 4)

Implemented in `script.js` via an `input` event listener with `input[id*="DOB" i]` selector.

### Auto-fill customer name
Typing in `#custName` (page 1) automatically syncs to all fields whose `id` contains "custName" (case-insensitive), plus explicitly `#pubAgreePrintedName`, currently:
- `#authExchangeCustName` (page 6)
- `#custNamePg7` (page 7)
- `#pubAgreePrintedName` (page 5)

Does NOT sync to `#cust2Name` / `#customer2NamePg4` since those don't contain "custName" as a contiguous substring. Implemented in `script.js` via an `input` event listener with `[id*="custName" i], #pubAgreePrintedName` selector.

### Signature pads
All `<canvas id="sigCanvas*">` elements are initialized as signature pads with mouse + touch support.

### Signature dates
All `#sigDate*` fields auto-fill with today's date on load.

### Reset fields
`resetFields()` clears all inputs, radios, checkboxes, textareas, and canvases across all pages.

## Exporting

### Print / Save PDF
Click **Print / Save PDF** — captures all 7 pages as a letter-size PDF using html2canvas + jsPDF. Downloads the file `Sylvan-Enrollment.pdf`.

### Email PDF
Click **✉ Email PDF** — generates the same PDF and sends it as an attachment via a Google Apps Script web app deployed at `script.google.com`.

**One-time setup for the sender:**
1. Go to https://script.google.com/ and create a new project
2. Paste the script from the `doPost()` function (below) into `Code.gs`
3. Deploy → New deployment → Web app (Execute as: Me, Access: Anyone)
4. Open the deployed URL once to authorize Gmail permissions
5. Copy the deployment URL into the `fetch()` URL in `script.js`

### Apps Script code (`Code.gs`)
```javascript
var RECIPIENT = 'sdtai2@outlook.com'; // ← CHANGE THIS to your email

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const pdf = Utilities.base64Decode(data.pdf);
  const blob = Utilities.newBlob(pdf, 'application/pdf', data.filename);
  GmailApp.sendEmail(RECIPIENT, data.subject, data.body, { attachments: [blob] });
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**Note:** The recipient is now set server-side via `RECIPIENT` in the Apps Script project. The client no longer sends or knows the recipient address.

### Subject line prompt
When **✉ Email PDF** is clicked, a prompt asks for a subject line (defaults to "Sylvan Enrollment Form"). If cancelled, no email is sent.

## Dev Mode

### Entering Dev Mode
Click the **Dev Mode** button (loads `developer.json` credentials). Requires a local server (`python3 -m http.server 8080`).

In Dev Mode you can:
- **Drag** any field to reposition it
- **Resize** fields (only those with `hasWidth && hasHeight`)
- **Lock & Export CSS** — regenerates `style.css` with current positions. Writes below the `/* ── Field positions ── */` sentinel comment.
- **Exit** to remove all labels and handlers

### Show ID mode
Call `showID()` from the console to toggle outlines and ID labels on every form field. Call again to toggle off.

### CSS export sentinel
The `lockAndExport()` function in `developer.js` looks for this exact comment in `style.css`:
```css
/* ── Field positions ── */
```
Everything below it gets replaced with the freshly-generated position rules.

### Developer credentials
Stored in `developer.json` (not tracked in git). Expected format:
```json
{ "username": "…", "password": "…" }
```

No additional commands or configurations needed.