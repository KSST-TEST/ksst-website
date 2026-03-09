/* LOAD VSN ALLOCATION TOOL */
function loadVSN() {
    document.getElementById("content-area").innerHTML = `
        <h2>Shri Vishnu Sahasranamam – Allocation Tool</h2>

        <div class="tool-box">

            <!-- Row 1: Batch + Date + Time -->
            <div class="row">
                <div class="col">
                    <label><b>Batch Number</b></label><br>
                    <input type="text" id="batchNumber" placeholder="Batch" class="small-input">
                </div>

                <div class="col">
                    <label><b>Satsang Date</b></label><br>
                    <input type="date" id="satsangDate" class="small-input" onchange="formatDate()">
                </div>

                <div class="col">
                    <label><b>Satsang Time <span style="font-size:13px; font-style:italic;">(IST)</span></b></label><br>
                    <input type="time" id="satsangTime" class="small-input">
                </div>
            </div>

            <br>

            <!-- Row 2: Names + Backup Names -->
            <div class="row">

                <div class="col">
                    <label>
                        <b>Enter Devotee Names</b><br>
                        <span style="font-size:13px; font-style:italic;">
                            (Registered for the Above-Mentioned Satsang Date and Time)
                        </span>
                    </label><br>

                    <textarea id="mainNames" placeholder="One name per line"></textarea>

                    <button class="btn" onclick="clearMain()">CLEAR MAIN</button>
                </div>

                <div class="col">
                    <label>
                        <b>Enter Backup Devotees</b><br>
                        <span style="font-size:13px; font-style:italic;">
                            (Available for the Above Satsang Date & Time)
                        </span>
                    </label><br>

                    <textarea id="backupNames" placeholder="One name per line"></textarea>

                    <button class="btn" onclick="clearBackup()">CLEAR BACKUP</button>
                </div>

            </div>

            <br>

            <!-- Buttons -->
            <button class="btn" onclick="allocateFullVSN()">ALLOCATE FULL VSN</button>
            <button class="btn" onclick="allocate108()">ALLOCATE 108 SLOKAS</button>

            <br><br>

            <!-- Output -->
            <h3>Allocation Output</h3>
            <textarea id="output" placeholder="Allocation will appear here..."></textarea><br><br>

            <div id="reallocate-buttons"></div>

            <button class="btn" onclick="copyOutput()">COPY</button>
            <button class="btn" onclick="downloadExcel()">DOWNLOAD EXCEL</button>
            <button class="btn" onclick="downloadPDF()">DOWNLOAD PDF</button>

        </div>
    `;
}

/* FORMAT DATE TO dd/mm/yyyy */
function formatDate() {
    let input = document.getElementById("satsangDate").value;
    if (!input) return;

    let date = new Date(input);
    let day = String(date.getDate()).padStart(2, '0');
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let year = date.getFullYear();

    document.getElementById("satsangDate").setAttribute("data-formatted", `${day}/${month}/${year}`);
}

/* CLEAR MAIN NAMES */
function clearMain() {
    document.getElementById("mainNames").value = "";
}

/* CLEAR BACKUP NAMES */
function clearBackup() {
    document.getElementById("backupNames").value = "";
}

/* SHUFFLE ARRAY */
function shuffle(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

/* DYNAMIC WIDTH FOR TEXT ALIGNMENT */
function dynamicWidth(names) {
    let longest = Math.max(...names.map(n => n.length));
    return longest + 5;
}

/* FORMAT LINE (NORMAL FORMAT) */
function formatLine(segment, sloka, main, backup, width) {
    return (
        segment.padEnd(20, " ") + " – " +
        sloka.padEnd(14, " ") + " - " +
        main.padEnd(width, " ") + " – " +
        `[ ${backup} ]`
    );
}

/* FULL VSN ALLOCATION */
function allocateFullVSN(shuffleMode = false) {

    let mainRaw = document.getElementById("mainNames").value
        .split("\n").map(x => x.trim()).filter(x => x !== "");

    let backupRaw = document.getElementById("backupNames").value
        .split("\n").map(x => x.trim()).filter(x => x !== "");

    if (shuffleMode) {
        mainRaw = shuffle(mainRaw);
        backupRaw = shuffle(backupRaw);
    }

    const mainNames = mainRaw.length > 0 ? mainRaw : ["-"];
    const backupNames = backupRaw.length > 0 ? backupRaw : ["No Backup"];

    let mainIndex = 0;
    let backupIndex = 0;

    let width = dynamicWidth(mainNames);

    const batch = (document.getElementById("batchNumber").value || "").trim();
    const dateElem = document.getElementById("satsangDate");
    const satsangDate = dateElem.getAttribute("data-formatted") || dateElem.value || "";
    const satsangTime = (document.getElementById("satsangTime").value || "").trim();

    const segments = [
        { seg: "Starting Prayer", sloka: "" },

        { seg: "Poorvangam",  sloka: "1-5" },
        { seg: "Poorvangam",  sloka: "6-11" },
        { seg: "Poorvangam",  sloka: "12-16" },
        { seg: "Poorvangam",  sloka: "17-22" },

        { seg: "Nyasa",       sloka: "" },

        { seg: "Dhyaanam",    sloka: "1-3" },
        { seg: "Dhyaanam",    sloka: "4-8" },

        { seg: "Shlokam",     sloka: "1-6" },
        { seg: "Shlokam",     sloka: "7-13" },
        { seg: "Shlokam",     sloka: "14-20" },
        { seg: "Shlokam",     sloka: "21-27" },
        { seg: "Shlokam",     sloka: "28-33" },
        { seg: "Shlokam",     sloka: "34-40" },
        { seg: "Shlokam",     sloka: "41-47" },
        { seg: "Shlokam",     sloka: "48-54" },
        { seg: "Shlokam",     sloka: "55-60" },
        { seg: "Shlokam",     sloka: "61-67" },
        { seg: "Shlokam",     sloka: "68-74" },
        { seg: "Shlokam",     sloka: "75-81" },
        { seg: "Shlokam",     sloka: "82-87" },
        { seg: "Shlokam",     sloka: "88-94" },
        { seg: "Shlokam",     sloka: "95-101" },
        { seg: "Shlokam",     sloka: "102-108" },

        { seg: "Phalashruti", sloka: "1-6" },
        { seg: "Phalashruti", sloka: "7-13" },
        { seg: "Phalashruti", sloka: "14-19" },
        { seg: "Phalashruti", sloka: "20-26" },
        { seg: "Phalashruti", sloka: "27-33" },

        { seg: "KSHAMA PRARTHANA", sloka: "" },
        { seg: "Ending Prayer",    sloka: "" }
    ];

    let lines = [];
    lines.push("*Om Namo Narayana*");
    lines.push("----------------------------------------------------------");
    lines.push(
        "Batch Number: " + (batch || "") +
        "   Satsang Date: " + (satsangDate || "") +
        "   Satsang Time: " + (satsangTime || "") + " IST"
    );
    lines.push("----------------------------------------------------------");
    lines.push("");

    segments.forEach((s) => {
        let main = mainNames[mainIndex % mainNames.length];
        let backup = backupNames[backupIndex % backupNames.length];

        if (
            s.seg === "Starting Prayer" ||
            s.seg === "Nyasa" ||
            s.seg === "KSHAMA PRARTHANA" ||
            s.seg === "Ending Prayer"
        ) {
            let label = s.seg.toUpperCase();
            lines.push(`${label} : ${main} – [ ${backup} ]`);
            lines.push("");
        } else {
            lines.push(formatLine(s.seg, s.sloka, main, backup, width));
        }

        mainIndex++;
        backupIndex++;

        if (
            (s.seg === "Poorvangam" && s.sloka === "17-22") ||
            (s.seg === "Dhyaanam" && s.sloka === "4-8") ||
            (s.seg === "Shlokam" && s.sloka === "102-108") ||
            (s.seg === "Phalashruti" && s.sloka === "27-33")
        ) {
            lines.push("");
        }
    });

    document.getElementById("output").value = lines.join("\n");

    document.getElementById("reallocate-buttons").innerHTML = `
        <button class="btn" onclick="allocateFullVSN(true)">REALLOCATE FULL VSN</button>
        <button class="btn" onclick="allocate108(true)">REALLOCATE 108 SLOKAS</button>
    `;
}

/* 108 SLOKAS ALLOCATION */
function allocate108(shuffleMode = false) {

    let mainRaw = document.getElementById("mainNames").value
        .split("\n").map(x => x.trim()).filter(x => x !== "");

    let backupRaw = document.getElementById("backupNames").value
        .split("\n").map(x => x.trim()).filter(x => x !== "");

    if (shuffleMode) {
        mainRaw = shuffle(mainRaw);
        backupRaw = shuffle(backupRaw);
    }

    const mainNames = mainRaw.length > 0 ? mainRaw : ["-"];
    const backupNames = backupRaw.length > 0 ? backupRaw : ["No Backup"];

    let mainIndex = 0;
    let backupIndex = 0;

    let width = dynamicWidth(mainNames);

    const batch = (document.getElementById("batchNumber").value || "").trim();
    const dateElem = document.getElementById("satsangDate");
    const satsangDate = dateElem.getAttribute("data-formatted") || dateElem.value || "";
    const satsangTime = (document.getElementById("satsangTime").value || "").trim();

    const segments = [
        { seg: "Starting Prayer", sloka: "" },

        { seg: "Shlokam", sloka: "1-6" },
        { seg: "Shlokam", sloka: "7-13" },
        { seg: "Shlokam", sloka: "14-20" },
        { seg: "Shlokam", sloka: "21-27" },
        { seg: "Shlokam", sloka: "28-33" },
        { seg: "Shlokam", sloka: "34-40" },
        { seg: "Shlokam", sloka: "41-47" },
        { seg: "Shlokam", sloka: "48-54" },
        { seg: "Shlokam", sloka: "55-60" },
        { seg: "Shlokam", sloka: "61-67" },
        { seg: "Shlokam", sloka: "68-74" },
        { seg: "Shlokam", sloka: "75-81" },
        { seg: "Shlokam", sloka: "82-87" },
        { seg: "Shlokam", sloka: "88-94" },
        { seg: "Shlokam", sloka: "95-101" },
        { seg: "Shlokam", sloka: "102-108" },

        { seg: "KSHAMA PRARTHANA", sloka: "" },
        { seg: "Ending Prayer",    sloka: "" }
    ];

    let lines = [];
    lines.push("*Om Namo Narayana*");
    lines.push("----------------------------------------------------------");
    lines.push(
        "Batch Number: " + (batch || "") +
        "   Satsang Date: " + (satsangDate || "") +
        "   Satsang Time: " + (satsangTime || "") + " IST"
    );
    lines.push("----------------------------------------------------------");
    lines.push("");

    segments.forEach((s) => {
        let main = mainNames[mainIndex % mainNames.length];
        let backup = backupNames[backupIndex % backupNames.length];

        if (
            s.seg === "Starting Prayer" ||
            s.seg === "KSHAMA PRARTHANA" ||
            s.seg === "Ending Prayer"
        ) {
            let label = s.seg.toUpperCase();
            lines.push(`${label} : ${main} – [ ${backup} ]`);
            lines.push("");
        } else {
            lines.push(formatLine(s.seg, s.sloka, main, backup, width));
        }

        mainIndex++;
        backupIndex++;

        if (s.seg === "Shlokam" && s.sloka === "102-108") {
            lines.push("");
        }
    });

    document.getElementById("output").value = lines.join("\n");

    document.getElementById("reallocate-buttons").innerHTML = `
        <button class="btn" onclick="allocateFullVSN(true)">REALLOCATE FULL VSN</button>
        <button class="btn" onclick="allocate108(true)">REALLOCATE 108 SLOKAS</button>
    `;
}

/* COPY OUTPUT */
function copyOutput() {
    let text = document.getElementById("output");
    text.select();
    document.execCommand("copy");
    alert("Copied!");
}

