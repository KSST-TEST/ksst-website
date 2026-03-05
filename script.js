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

/* FORMAT LINE (FINAL FORMAT) */
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

    const segments = [
        { seg: "Starting Prayer", sloka: "" },

        { seg: "Poorvangam", sloka: "1-5-[5]" },
        { seg: "Prathama", sloka: "6-10-[5]" },
        { seg: "Dwitiya", sloka: "11-15-[5]" },
        { seg: "Trithiya", sloka: "16-20-[5]" },
        { seg: "Chaturtha", sloka: "21-25-[5]" },
        { seg: "Panchama", sloka: "26-30-[5]" },
        { seg: "Shashta", sloka: "31-35-[5]" },
        { seg: "Saptama", sloka: "36-40-[5]" },
        { seg: "Ashtama", sloka: "41-45-[5]" },
        { seg: "Navama", sloka: "46-50-[5]" },
        { seg: "Dashama", sloka: "51-55-[5]" },
        { seg: "Ekadashi", sloka: "56-60-[5]" },
        { seg: "Dwadashi", sloka: "61-65-[5]" },
        { seg: "Trayodashi", sloka: "66-70-[5]" },
        { seg: "Chaturdashi", sloka: "71-75-[5]" },
        { seg: "Purnima", sloka: "76-80-[5]" },

        { seg: "Kshama Prarthana", sloka: "" },
        { seg: "Ending Prayer", sloka: "" }
    ];

    let lines = [];
    lines.push("*Om Namo Narayana*");
    lines.push("");

    segments.forEach(s => {
        let main = mainNames[mainIndex % mainNames.length];
        let backup = backupNames[backupIndex % backupNames.length];

        lines.push(formatLine(s.seg, s.sloka, main, backup, width));

        mainIndex++;
        backupIndex++;
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

    const segments = [
        { seg: "Starting Prayer", sloka: "" },
        { seg: "Shlokam", sloka: "1-6-[6]" },
        { seg: "Shlokam", sloka: "7-13-[7]" },
        { seg: "Shlokam", sloka: "14-20-[7]" },
        { seg: "Shlokam", sloka: "21-27-[7]" },
        { seg: "Shlokam", sloka: "28-33-[6]" },
        { seg: "Shlokam", sloka: "34-40-[7]" },
        { seg: "Shlokam", sloka: "41-47-[7]" },
        { seg: "Shlokam", sloka: "48-54-[7]" },
        { seg: "Shlokam", sloka: "55-60-[6]" },
        { seg: "Shlokam", sloka: "61-67-[7]" },
        { seg: "Shlokam", sloka: "68-74-[7]" },
        { seg: "Shlokam", sloka: "75-81-[7]" },
        { seg: "Shlokam", sloka: "82-87-[6]" },
        { seg: "Shlokam", sloka: "88-94-[7]" },
        { seg: "Shlokam", sloka: "95-101-[7]" },
        { seg: "Shlokam", sloka: "102-108-[7]" },
        { seg: "Kshama Prarthana", sloka: "" },
        { seg: "Ending Prayer", sloka: "" }
    ];

    let lines = [];
    lines.push("*Om Namo Narayana*");
    lines.push("");

    segments.forEach(s => {
        let main = mainNames[mainIndex % mainNames.length];
        let backup = backupNames[backupIndex % backupNames.length];

        lines.push(formatLine(s.seg, s.sloka, main, backup, width));

        mainIndex++;
        backupIndex++;
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

/* DOWNLOAD EXCEL */
function downloadExcel() {
    let output = document.getElementById("output").value.split("\n");

    let rows = [["Segment Name", "Assigned Sloka Number", "Main Devotee", "Backup Chanter"]];

    output.forEach(line => {
        if (line.includes("–")) {
            let parts = line.split("–");
            let seg = parts[0].trim();
            let sloka = parts[1].split("-")[0].trim();
            let main = parts[1].split("-")[1].trim();
            let backup = parts[2].replace("[", "").replace("]", "").trim();
            rows.push([seg, sloka, main, backup]);
        }
    });

    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Allocation");
    XLSX.writeFile(wb, "KSST_Allocation.xlsx");
}

/* DOWNLOAD PDF */
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF();

    doc.setFontSize(12);
    doc.text("KSST Allocation Report", 14, 15);

    let y = 30;
    let lines = document.getElementById("output").value.split("\n");

    lines.forEach(line => {
        doc.text(line, 14, y);
        y += 7;
    });

    doc.save("KSST_Allocation.pdf");
}
