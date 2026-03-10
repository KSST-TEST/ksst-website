/* ============================================================
   UNIVERSAL ALLOCATION ENGINE (STAGE 1)
   Only basic input-reading logic is included at this stage.
   ============================================================ */

function loadStothramUI(config) {
    // TODO (later):
    // Build UI dynamically using config.name and config.buttons
    // For now, satsangallocation.html UI is used.
}

/* ============================================================
   runAllocation(config, options)
   This will eventually contain the full universal allocation logic.
   For now, it only reads inputs (names, batch, date, time).
   ============================================================ */

function runAllocation(config, options) {

    /* STEP 1 — Read participant names */
    let mainRaw = document.getElementById("mainNames").value
        .split("\n")
        .map(x => x.trim())
        .filter(x => x !== "");

    let mainNames = mainRaw.length > 0 ? mainRaw : ["-"];

    console.log("Engine received names:", mainNames);


    /* STEP 2 — Read batch/date/time */
    const batch = (document.getElementById("batchNumber").value || "").trim();

    const dateElem = document.getElementById("satsangDate");
    const satsangDate =
        dateElem.getAttribute("data-formatted") || dateElem.value || "";

    const satsangTime =
        (document.getElementById("satsangTime").value || "").trim();

    console.log("Engine received date/time:", batch, satsangDate, satsangTime);


    /* ============================================================
       STOP HERE — DO NOT ADD ANYTHING ELSE YET.
       Next steps will gradually move logic from vsn.js into here.
       ============================================================ */
}
