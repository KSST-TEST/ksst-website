/* ============================================================
   UNIVERSAL ALLOCATION ENGINE (FINAL VERSION)
   With History Input Support + Clean Modular Structure
   ============================================================ */


/* ============================================================
   SHUFFLE (Universal)
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
   DYNAMIC WIDTH (Universal)
   ============================================================ */
function dynamicWidth(names) {
    let longest = Math.max(...names.map(n => n.length));
    return longest + 5;
}


/* ============================================================
   FORMAT LINE (Universal)
   ============================================================ */
function formatLine(segment, sloka, main, width) {
    return (
        segment.padEnd(20, " ") + " – " +
        sloka.padEnd(14, " ") + " - " +
        main.padEnd(width, " ")
    );
}


/* ============================================================
   HISTORY PARSER (NEW)
   Reads previous allocations and extracts names.
   ============================================================ */
function parseHistoryInput() {
    let raw = document.getElementById("historyInput").value.trim();
    if (!raw) return [];

    let lines = raw.split("\n").map(x => x.trim()).filter(x => x !== "");

    // Extract names from lines like:
    // "Shlokam – 1-6 - Lakshmi"
    // "STARTING PRAYER : Sita"
    let names = [];

    lines.forEach(line => {
        if (line.includes(" - ")) {
            let parts = line.split(" - ");
            let name = parts[1]?.trim();
            if (name) names.push(name);
        } else if (line.includes(":")) {
            let parts = line.split(":");
            let name = parts[1]?.trim();
            if (name) names.push(name);
        }
    });

    return names;
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


    /* STEP 2 — Read history input */
    let historyNames = parseHistoryInput();

    // (Fairness logic can be added later here)
    // For now, we simply log it.
    console.log("History names:", historyNames);


    /* STEP 3 — Shuffle if requested */
    if (options && options.shuffle === true) {
        mainNames = shuffle(mainNames);
    }


    /* STEP 4 — Read batch/date/time */
    const batch = (document.getElementById("batchNumber").value || "").trim();

    const dateElem = document.getElementById("satsangDate");
    const satsangDate =
        dateElem.getAttribute("data-formatted") || dateElem.value || "";

    const satsangTime =
        (document.getElementById("satsangTime").value || "").trim();


    /* STEP 5 — Compute dynamic width */
    const width = dynamicWidth(mainNames);


    /* STEP 6 — Select segment list */
    let segments = [];

    if (options && options.mode === "108-only") {
        segments = config.segments_108;
    } else {
        segments = config.segments_full;
    }


    /* STEP 7 — Generate header */
    let finalLines = [];

    finalLines.push("*Om Namo Narayana*");
    finalLines.push("----------------------------------------------------------");
    finalLines.push(
        "Batch Number: " + (batch || "") +
        "   Satsang Date: " + (satsangDate || "") +
        "   Satsang Time: " + (satsangTime || "") + " IST"
    );
    finalLines.push("----------------------------------------------------------");
    finalLines.push("");


    /* STEP 8 — Cycle through names */
    let mainIndex = 0;
    let rawAllocations = [];

    segments.forEach(seg => {
        let assignedName = mainNames[mainIndex % mainNames.length];

        rawAllocations.push({
            segment: seg.seg,
            sloka: seg.sloka,
            name: assignedName
        });

        mainIndex++;
    });


    /* STEP 9 — Special segment formatting */
    let formattedLines = [];

    rawAllocations.forEach(item => {

        let upper = item.segment.toUpperCase();

        if (
            upper === "STARTING PRAYER" ||
            upper === "NYASA" ||
            upper === "KSHAMA PRARTHANA" ||
            upper === "ENDING PRAYER"
        ) {
            formattedLines.push(`${upper} : ${item.name}`);
            formattedLines.push(""); // blank line
        } else {
            formattedLines.push(
                formatLine(item.segment, item.sloka, item.name, width)
            );
        }
    });


    /* STEP 10 — Group blank lines */
    let outputLines = [];

    rawAllocations.forEach((item, index) => {

        let upper = item.segment.toUpperCase();

        outputLines.push(formattedLines[index]);

        if (
            (upper === "POORVANGAM" && item.sloka === "17-22") ||
            (upper === "DHYAANAM" && item.sloka === "4-8") ||
            (upper === "SHLOKAM" && item.sloka === "102-108") ||
            (upper === "PHALASHRUTI" && item.sloka === "27-33")
        ) {
            outputLines.push("");
        }
    });


    /* STEP 11 — OUTPUT TO TEXTAREA */
    finalLines.push(...outputLines);

    document.getElementById("output").value = finalLines.join("\n");


    /* STEP 12 — REALLOCATE BUTTONS */
    document.getElementById("reallocate-buttons").innerHTML = `
        <button class="btn" onclick="runAllocation(VSN_CONFIG, { mode: '${options.mode}', shuffle: true })">
            REALLOCATE
        </button>
    `;
}
