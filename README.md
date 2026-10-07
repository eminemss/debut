# Merian's 18th Birthday

A mobile-first birthday invitation and celebration page made with plain HTML, CSS, and JavaScript. No build step or third-party packages are required.

## Preview

Open `index.html` in a browser, or use VS Code's Live Server extension if you have it installed.

## Personalize before sharing

- Replace the portrait placeholder in the hero with the birthday person's photo.
- Update the date, venue, dress code, and birthday message in `index.html`.
- Edit the five tradition descriptions in `script.js`.
- If you change the event date, update the countdown date in `script.js` as well.

## Enable attendance confirmations and photo uploads

The RSVP and photo forms use Google Apps Script to email attendance confirmations to `gianallanflores14@gmail.com` and save uploaded photos to a Drive folder. These features are inactive until the script is deployed and its URL is configured.

1. Create a project at [script.google.com](https://script.google.com/) and paste in the contents of `google-apps-script.gs`.
2. Select `setup` in the Apps Script editor and run it once. Review and grant the requested Google Drive and email permissions. This creates the event photo folder in the Google account that owns the script.
3. Deploy the project as a **Web app**, set **Execute as** to your account, and set access to **Anyone** so guests can submit without signing in. Copy the deployed web app URL.
4. Paste that URL into `APPS_SCRIPT_ENDPOINT` at the top of `script.js`, then publish the updated site.

The public web app URL can be invoked by anyone who has it. Keep the URL out of unrelated public posts, review the Apps Script execution log and Drive folder, and redeploy a new version after changing the Apps Script code. The browser cannot read the response from Google's web app, so the page can report that it sent a request but cannot confirm email delivery or Drive storage. Each selected image must be 8 MB or smaller; the upload control accepts up to five images per batch, and the camera button uses the device camera when supported.
