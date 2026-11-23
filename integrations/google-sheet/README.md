# Enquiry popup -> Google Sheet (Apps Script receiver)

Why this exists: the Google Form asks every visitor to sign in to Google, and no website can submit such a form
on a visitor's behalf. This script runs as the Sheet's owner instead, so it can write the popup's answers into
the same Google Sheet without touching the form.

Flow: popup -> `/api/enquiry` (Vercel) -> this script (secret + request id) -> new row in the "Website Enquiries"
tab -> read back -> `{ ok: true, id, row }` -> popup shows "Thank you". Anything else shows an error.

## One-time setup
1. Open the Google Sheet that is linked to the form. **Extensions -> Apps Script**.
2. Delete the sample code, paste `enquiry.gs`, and set `SECRET` to a long random password.
3. **Deploy -> New deployment -> Web app**. Execute as **Me**, Who has access **Anyone**. Deploy and authorise
   (Google shows an "unverified app" warning for your own script: Advanced -> Go to project -> Allow).
4. Copy the **Web app URL** (ends with `/exec`).
5. Vercel -> project -> **Settings -> Environment Variables** (Production): add
   `ENQUIRY_SCRIPT_URL` = the Web app URL and `ENQUIRY_SCRIPT_SECRET` = the same password. Redeploy.
6. Send one test enquiry from the live site and check the "Website Enquiries" tab (delete the test row afterwards).

## Later changes
- Edited the script? **Deploy -> Manage deployments -> Edit -> New version**, otherwise the live URL keeps the old code.
- Changed the secret? Update the Vercel variable too.
- Columns are fixed by `HEADERS`; the tab is created automatically on the first enquiry.
