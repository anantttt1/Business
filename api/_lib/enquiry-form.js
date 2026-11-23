// Link between the website's enquiry popup and the EXISTING Google Form.
//
// The form is never edited or recreated: the popup posts to the form's public
// `formResponse` endpoint (through /api/enquiry, so success can be confirmed server-side)
// and the answers land in the form's linked Google Sheet as usual.
//
// !! Entry IDs must be copied from the live form, never guessed !!
// A wrong ID silently drops an answer or makes Google reject the whole response.
// Where to read them: open the form -> View page source -> find `FB_PUBLIC_LOAD_DATA_`.
// Each question is an array whose last block holds `[[<entry id>, ...options]]`;
// <entry id> is the number that goes after `entry.` (see README of the enquiry popup in AGENTS.md).
//
// Until every required `entry` below is filled in and `VERIFIED` is set to true, /api/enquiry
// refuses to submit ("not_configured"), so the popup can never show a fake success.

export const FORM_ID = '1FAIpQLSf5Bs0ByBb_Lyh8sYrb45H7F8ogLMBPqyZqHuCDZx1WUbKTPg';

// Flip to true ONLY after the IDs / required flags / option texts below were checked against the live form.
export const VERIFIED = false;

// key = field name used by the popup (public/enquiry.js)
//   entry    : Google Forms entry id as a string, e.g. '1234567890'   (null = not read from the form yet)
//   required : mirrors the form's "Required" switch for that question
//   max      : server-side length cap
export const FIELDS = {
  fullName: { entry: null, required: true, max: 100 },
  email: { entry: null, required: true, max: 254 },
  linkedin: { entry: null, required: false, max: 300 },
  whatsapp: { entry: null, required: true, max: 20 },
  service: { entry: null, required: true, max: 120 },
  requirements: { entry: null, required: true, max: 1500 },
  timeline: { entry: null, required: true, max: 120 },
  showcase: { entry: null, required: true, max: 120 },
};

// How the WhatsApp number is written into the sheet:
//   'plus'   -> +919876543210   'digits' -> 919876543210   'local' -> 9876543210
// Pick the one the form question accepts (a "Number" validation rejects the '+').
export const PHONE_FORMAT = 'plus';

// Extra hidden parameters some forms need (multi-section forms use pageHistory, e.g. { pageHistory: '0,1' }).
export const EXTRA_PARAMS = {};

// A response only counts as confirmed when Google answers HTTP 200 AND the page contains one of these.
// The default confirmation page has the "Your response has been recorded" text and a
// "Submit another response" link (…?usp=form_confirmation). If the form owner customised the
// confirmation message or hid that link, add a pattern that matches the custom page here.
export const CONFIRMATION_MARKERS = [
  /Your response has been recorded/i,
  /usp=form_confirmation/,
  /freebirdFormviewerViewResponseConfirmation/,
];

export function isConfigured() {
  if (!VERIFIED) return false;
  // Every REQUIRED field needs a real entry id; optional ones may stay null (they are then not sent).
  return Object.values(FIELDS).every((f) => !f.required || /^\d{4,}$/.test(String(f.entry)));
}
