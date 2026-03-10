/* ============================================================
   UNIVERSAL ALLOCATION ENGINE (STAGE 3)
   Contains:
   - UI loader placeholder
   - Read names
   - Shuffle (universal)
   - Read batch/date/time
   - dynamicWidth (universal)
   ============================================================ */


/* ============================================================
   UNIVERSAL SHUFFLE
   ============================================================ */
function shuffle(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}


/* ============================================================
   UNIVERSAL DYNAMIC WIDTH
   ============================================================ */
function dynamicWidth(names) {
    let longest = Math.max(...names.map(n => n.length));
    return longest + 5;
}


/* ============================================================
   DYNAMIC UI LOADER (placeholder for now)
   ============================================================ */
function loadStothramUI(config) {
    // TODO (later):
    // Build UI dynamically using config.name and config.buttons
    // For now, satsangallocation.html UI is used.
}


/* ============================================================
   UNIVERSAL ALLOCATION ENGINE
   ============================================================ */
function runAllocation(config, options) {

    /* STEP 1 — Read participant names */
    let mainRaw = document.getElementById("mainNames").value
        .split("\n")
        .map(x => x.trim())
        .filter(x => x !== "");

    let mainNames = mainRaw.length > 0 ? mainRaw : ["-"];

    console.log("Engine received names:", mainNames);


    /* STEP 1B — Shuffle if requested */
    if (options && options.shuffle === true) {
        mainNames = shuffle(mainNames);
    }

    console.log("Engine after shuffle:", mainNames);


    /* STEP 2 — Read batch/date/time */
    const batch = (document.getElementById("batchNumber").value || "").trim();

    const dateElem = document.getElementById("satsangDate");
    const satsangDate =
        dateElem.getAttribute("data-formatted") || dateElem.value || "";

    const satsangTime =
        (document.getElementById("satsangTime").value || "").trim();

    console.log("Engine received date/time:", batch, satsangDate, satsangTime);


    /* STEP 3 — Compute dynamic width */
    const width = dynamicWidth(mainNames);
    console.log("Engine computed width:", width);


    /* ============================================================
       STOP HERE — DO NOT ADD ANYTHING ELSE YET.
       Next steps will gradually move logic from vsn.js into here.
       ============================================================ */
}
