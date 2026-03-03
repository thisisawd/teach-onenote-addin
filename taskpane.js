/* ============================================================
   taskpane.js — Office.js bootstrap for OneNote Task Pane
   ============================================================
   This file handles ONLY the Office.js initialization.
   It is generic Office Add-in boilerplate with OneNote-specific
   notes where relevant.

   What is OneNote-specific:
     - Office.onReady reports { host: "OneNote" }
     - OneNote.run() is available for page manipulation
     - Host Name="Notebook" in manifest.xml

   What is generic Office.js:
     - Office.onReady() pattern
     - The loading / error handling below
   ============================================================ */

(function () {
  "use strict";

  // Office.onReady waits for office.js to initialize.
  // It resolves once the host application (OneNote) is ready.
  Office.onReady(function (info) {
    console.log("[Teach] Office.onReady — host:", info.host, "platform:", info.platform);

    // Validate we are running inside OneNote (Notebook)
    if (info.host === Office.HostType.OneNote || info.host === "OneNote") {
      console.log("[Teach] Running inside OneNote — full API available.");
    } else if (info.host) {
      console.warn("[Teach] Running in", info.host, "— OneNote-specific APIs may not be available.");
    } else {
      // No host detected (e.g. opened directly in browser for testing)
      console.warn("[Teach] No Office host detected — running in standalone browser mode.");
    }

    // Hand off to the main app code in taskpane.html
    // The HTML defines window.onTeachReady(info), which wires
    // all UI event handlers and checks Azure OpenAI config.
    if (typeof window.onTeachReady === "function") {
      window.onTeachReady(info);
    }
  });
})();
