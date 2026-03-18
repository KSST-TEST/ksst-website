// ============================================================
// VSN EXCEL EXPORT
// ============================================================

function exportVSNExcel() {
    const output = document.getElementById("output").value.trim();
    if (!output) {
        alert("No allocation available.");
        return;
    }

    const wb = XLSX.utils.book_new();
    const wsData = [];

    // Header row
    wsData.push(["Segment", "From", "To", "Devotee"]);

    // Parse output lines
    const lines = output.split(/\r?\n/);
    for (const line of lines) {
        const match = line.match(/^(.*)\s+(\d+)[–-](\d+):\s+(.*)$/);
        if (!match) continue;

        const segment = match[1].trim();
        const from = match[2];
        const to = match[3];
        const name = match[4];

        wsData.push([segment, from, to, name]);
    }

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws["!cols"] = [
        { wch: 35 },
        { wch: 8 },
        { wch: 8 },
        { wch: 30 }
    ];

    // Apply styles
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[cellRef];
            if (!cell) continue;

            cell.s = {
                font: { name: "Calibri", sz: 12 },
                alignment: { vertical: "center", wrapText: true },
                border: {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" }
                }
            };

            // Header row
            if (R === 0) {
                cell.s.fill = {
                    fgColor: { rgb: "FFF2CC" } // saffron-like
                };
                cell.s.font.bold = true;
                cell.s.alignment.horizontal = "center";
            }
            // Alternating rows
            else if (R % 2 === 1) {
                cell.s.fill = { fgColor: { rgb: "FFF9E6" } };
            }
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, "VSN Allocation");
    XLSX.writeFile(wb, "VSN_Allocation.xlsx");
}