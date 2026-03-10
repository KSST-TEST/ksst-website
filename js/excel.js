/* ============================================================
   DOWNLOAD EXCEL (FINAL CLEAN VERSION)
   Uses engine output directly from #output textarea
   ============================================================ */

function downloadExcel(is108 = false) {

    /* STEP 1 — Read output lines */
    let output = document.getElementById("output").value.split("\n");

    /* STEP 2 — Read batch/date/time */
    const batch = (document.getElementById("batchNumber").value || "").trim();

    const dateElem = document.getElementById("satsangDate");
    const satsangDate =
        dateElem.getAttribute("data-formatted") || dateElem.value || "";

    const satsangTime =
        (document.getElementById("satsangTime").value || "").trim();

    let safeDate = satsangDate.replace(/\//g, "-");

    /* STEP 3 — Prepare rows */
    let rows = [];

    // Header rows
    rows.push(["Batch Number", batch]);
    rows.push(["Satsang Date", satsangDate]);
    rows.push(["Satsang Time (IST)", satsangTime]);
    rows.push([]);

    // Table header
    rows.push(["Segment Name", "Assigned Sloka Number", "Main Devotee"]);

    /* STEP 4 — Parse output lines */
    output.forEach(line => {
        line = line.trim();
        if (!line) return;

        if (line.startsWith("*Om Namo")) return;
        if (line.startsWith("-----")) return;
        if (line.startsWith("Batch Number:")) return;

        // SPECIAL LINES (e.g., STARTING PRAYER : A)
        if (line.includes(":") && !line.includes("–")) {
            let parts = line.split(":");
            let seg = parts[0].trim();
            let main = parts[1].trim();

            rows.push([seg, "", main]);
            return;
        }

        // NORMAL LINES (e.g., Shlokam – 1-6 - A)
        if (line.includes("–")) {
            let parts = line.split("–");
            let seg = (parts[0] || "").trim();

            let slokaAndMain = (parts[1] || "").split(" - ");
            let sloka = (slokaAndMain[0] || "").trim();
            let main = (slokaAndMain[1] || "").trim();

            rows.push([seg, sloka, main]);
        }
    });

    /* STEP 5 — Create workbook */
    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.aoa_to_sheet(rows);

    /* STEP 6 — Apply formatting */
    const range = XLSX.utils.decode_range(ws['!ref']);

    for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {

            let cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            let cell = ws[cellRef];
            if (!cell) continue;

            // Base style
            cell.s = {
                font: { name: "Calibri", sz: 11 },
                alignment: { vertical: "center", wrapText: true },
                border: {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                }
            };

            // Highlight Batch/Date/Time rows
            if (R >= 0 && R <= 2) {
                cell.s.fill = { fgColor: { rgb: "FFF2CC" } }; // light yellow
                cell.s.font.bold = true;
            }

            // Table header row (saffron)
            if (R === 4) {
                cell.s.fill = { fgColor: { rgb: "FF9933" } }; // saffron
                cell.s.font = { name: "Calibri", bold: true, color: { rgb: "000000" } };
                cell.s.alignment = { horizontal: "center", vertical: "center", wrapText: true };
            }

            // Alternating row colors
            if (R > 4) {
                if (R % 2 === 0) {
                    cell.s.fill = { fgColor: { rgb: "FFF7E6" } }; // very light saffron
                }
            }
        }
    }

    /* STEP 7 — Auto column width */
    ws['!cols'] = [
        { wch: 25 },
        { wch: 18 },
        { wch: 30 }
    ];

    /* STEP 8 — Auto row height */
    ws['!rows'] = rows.map(() => ({ hpt: 18 }));

    /* STEP 9 — File naming */
    let fileName = is108
        ? `VSN_108_Allocation_${safeDate}.xlsx`
        : `VSN_FullAllocation_${safeDate}.xlsx`;

    XLSX.utils.book_append_sheet(wb, ws, "Allocation");
    XLSX.writeFile(wb, fileName);
}
