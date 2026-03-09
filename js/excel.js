/* DOWNLOAD EXCEL */
function downloadExcel() {
    let output = document.getElementById("output").value.split("\n");

    const batch = (document.getElementById("batchNumber").value || "").trim();
    const dateElem = document.getElementById("satsangDate");
    const satsangDate = dateElem.getAttribute("data-formatted") || dateElem.value || "";
    const satsangTime = (document.getElementById("satsangTime").value || "").trim();

    let rows = [];

    rows.push(["Batch Number", batch]);
    rows.push(["Satsang Date", satsangDate]);
    rows.push(["Satsang Time (IST)", satsangTime]);
    rows.push([]);

    rows.push(["Segment Name", "Assigned Sloka Number", "Main Devotee", "Backup Chanter"]);

    output.forEach(line => {
        line = line.trim();
        if (!line) return;

        if (line.startsWith("*Om Namo")) return;
        if (line.startsWith("-----")) return;
        if (line.startsWith("Batch Number:")) return;

        // SPECIAL LINES
        if (line.includes(":") && line.includes("–")) {
            let parts = line.split(":");
            let seg = parts[0].trim();
            let right = parts[1].trim();

            let rightParts = right.split("–");
            let main = rightParts[0].trim();
            let backup = (rightParts[1] || "").replace("[", "").replace("]", "").trim();

            rows.push([seg, "", main, backup]);
            return;
        }

        // NORMAL LINES
        if (line.includes("–")) {
            let parts = line.split("–");

            let seg = parts[0].trim();

            let slokaAndMain = parts[1].split(" - ");
            let sloka = (slokaAndMain[0] || "").trim();
            let main = (slokaAndMain[1] || "").trim();

            let backup = (parts[2] || "").replace("[", "").replace("]", "").trim();

            rows.push([seg, sloka, main, backup]);
        }
    });

    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Allocation");
    XLSX.writeFile(wb, "KSST_Allocation.xlsx");
}


