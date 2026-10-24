// Runs before first paint (loaded synchronously in <head>). Kept as an external file because the
// CSP forbids inline scripts. Marks the page as JS-enabled so the reveal animations and the
// splash screen only apply when ap-app.js can actually run.
document.documentElement.classList.add('js')
