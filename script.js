/* PASSWORD CHECK */
function checkPassword() {
    if (document.getElementById("pass").value === "Vaikuntha") {
        document.getElementById("password-screen").style.display = "none";
        document.getElementById("tool-screen").style.display = "block";
    } else {
        alert("Incorrect Password");
    }
}

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
            <button class="btn" onclick="downloadOutput()">DOWNLOAD CSV</button>

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

/* FULL VSN ALLOCATION LOGIC */
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
    const backupNames = backupRaw.length > 0 ? backupRaw : ["-"];

    let mainIndex = 0;
    let backupIndex = 0;

    const batch = (document.getElementById("batchNumber").value || "").trim();
    const dateElem = document.getElementById("satsangDate");
    const satsangDate = dateElem.getAttribute("data-formatted") || dateElem.value || "";
    const satsangTime = (document.getElementById("satsangTime").value || "").trim();

    const segments = [
        { label: "Starting Prayer", range: "", code: "N" },

        { label: "Poorvangam", range: "1-5-[5]",   code: "A" },
        { label: "Poorvangam", range: "6-11-[6]",  code: "B" },
        { label: "Poorvangam", range: "12-16-[5]", code: "C" },
        { label: "Poorvangam", range: "17-22-[6]", code: "D" },

        { label: "Nyasa", range: "------------------", code: "E" },

        { label: "Dhyaanam", range: "1-3", code: "F" },
        { label: "Dhyaanam", range: "4-8", code: "G" },

        { label: "Shlokam", range: "1-6-[6]",     code: "H" },
        { label: "Shlokam", range: "7-13-[7]",    code: "I" },
        { label: "Shlokam", range: "14-20-[7]",   code: "J" },
        { label: "Shlokam", range: "21-27-[7]",   code: "K" },
        { label: "Shlokam", range: "28-33-[6]",   code: "L" },
        { label: "Shlokam", range: "34-40-[7]",   code: "M" },
        { label: "Shlokam", range: "41-47-[7]",   code: "N" },
        { label: "Shlokam", range: "48-54-[7]",   code: "A" },
        { label: "Shlokam", range: "55-60-[6]",   code: "B" },
        { label: "Shlokam", range: "61-67-[7]",   code: "C" },
        { label: "Shlokam", range: "68-74-[7]",   code: "D" },
        { label: "Shlokam", range: "75-81-[7]",   code: "E" },
        { label: "Shlokam", range: "82-87-[6]",   code: "F" },
        { label: "Shlokam", range: "88-94-[7]",   code: "G" },
        { label: "Shlokam", range: "95-101-[7]",  code: "H" },
        { label: "Shlokam", range: "102-108-[7]", code: "I" },

        { label: "Phalashruti", range: "1-6-[6]",   code: "J" },
        { label: "Phalashruti", range: "7-13-[7]",  code: "K" },
        { label: "Phalashruti", range: "14-19-[6]", code: "L" },
        { label: "Phalashruti", range: "20-26-[7]", code: "M" },
        { label: "Phalashruti", range: "27-33-[7]", code: "N" },

        { label: "KSHAMA PRARTHANA", range: "", code: "N" },
        { label: "Ending Prayer",    range: "", code: "E" }
    ];

    let lines = [];

    lines.push("*Om Namo Narayana*");
    lines.push("----------------------------------------------------------");
    lines.push(
        "Batch Number: " + (batch || "") +
        "        Satsang Date: " + (satsangDate || "") +
        "          Satsang Time: " + (satsangTime || "") + " IST"
    );
    lines.push("----------------------------------------------------------");
    lines.push("");

    segments.forEach(seg => {
        const main = mainNames[mainIndex % mainNames.length];
        const backup = backupNames[backupIndex % backupNames.length];

        mainIndex++;
        backupIndex++;

        let rangePart = seg.range ? (seg.range + "-----") : "";
        let line =
            seg.label + ": " +
            (rangePart ? rangePart : "") +
            seg.code +
            "  -----------  " +
            "[" + backup + "]";

        lines.push(line);
        lines.push("");
    });

    document.getElementById("output").value = lines.join("\n");

    document.getElementById("reallocate-buttons").innerHTML = `
        <button class="btn" onclick="allocateFullVSN(true)">REALLOCATE VSN</button>
        <button class="btn" onclick="allocate108(true)">REALLOCATE 108 SLOKAS</button>
    `;
}

/* PLACEHOLDER FOR 108 SLOKAS */
function allocate108(shuffleMode = false) {
    document.getElementById("output").value =
        "108 Slokas allocation logic will be added.";

    document.getElementById("reallocate-buttons").innerHTML = `
        <button class="btn" onclick="allocateFullVSN(true)">REALLOCATE VSN</button>
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

/* DOWNLOAD OUTPUT */
function downloadOutput() {
    let text = document.getElementById("output").value;
    let blob = new Blob([text], { type: "text/csv" });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "allocation.csv";
    link.click();
}
