# SylvanEnrollmentV2

A simple static HTML enrollment form. No build system, tests, or linting.

## Run

Open `index.html` in a browser.

## Project structure

```
index.html   - Single self-contained enrollment form with embedded CSS/JS
```

The form overlays input fields on a scanned PDF background image. It includes:
- Student/guardian information fields
- Questionnaire inputs
- Signature canvas with touch/mouse support
- Print/Save-to-PDF button
- Email PDF button

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
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const pdf = Utilities.base64Decode(data.pdf);
  const blob = Utilities.newBlob(pdf, 'application/pdf', data.filename);
  GmailApp.sendEmail(data.to, data.subject, data.body, { attachments: [blob] });
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

**Note:** The recipient email is currently hardcoded as `sdtai2@outlook.com` in `handleEmail()`. Update it in `script.js` to the actual recipient.

### Subject line prompt

When **✉ Email PDF** is clicked, a prompt asks for a subject line (defaults to "Sylvan Enrollment Form"). The user can type the customer's name or any identifier — it becomes the email subject. If cancelled, no email is sent.

No additional commands or configurations needed.