/* DOWNLOAD PDF (Option B – Saffron Devotional Header) */
function downloadPDF() {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
    });

    // Extract output lines
    let outputElement = document.getElementById("output");
    if (!outputElement) {
        console.error("Output textarea not found");
        return;
    }
    let output = outputElement.value.split("\n");

    // Header section
    let y = 40;

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("KSST Allocation Report", 40, y);
    y += 25;

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(12);

    let batchEl = document.getElementById("batchNumber");
    let dateEl = document.getElementById("satsangDate");
    let timeEl = document.getElementById("satsangTime");

    doc.text("Batch Number: " + (batchEl ? batchEl.value : ""), 40, y);
    y += 18;
    doc.text("Satsang Date: " + (dateEl ? dateEl.value : ""), 40, y);
    y += 18;
    doc.text("Satsang Time (IST): " + (timeEl ? timeEl.value : ""), 40, y);
    y += 25;

    // Prepare table rows
    let rows = [];

    output.forEach(line => {
        line = line.trim();
        if (!line) return;

        if (line.startsWith("*Om Namo")) return;
        if (line.startsWith("-----")) return;
        if (line.startsWith("Batch Number:")) return;

        // SPECIAL LINES (e.g., STARTING PRAYER : A – [ X ])
        if (line.includes(":") && line.includes("–")) {
            let parts = line.split(":");
            if (parts.length < 2) return;

            let seg = parts[0].trim();
            let right = parts[1].trim();

            let rightParts = right.split("–");
            let main = (rightParts[0] || "").trim();
            let backup = rightParts[1]
                ? rightParts[1].replace("[", "").replace("]", "").trim()
                : "";

            rows.push([seg, "", main, backup]);
            return;
        }

        // NORMAL LINES (e.g., Shlokam – 1-6 - A – [ X ])
        if (line.includes("–")) {
            let parts = line.split("–");
            if (parts.length < 2) return;

            let seg = (parts[0] || "").trim();

            let slokaAndMain = (parts[1] || "").split(" - ");
            let sloka = (slokaAndMain[0] || "").trim();
            let main = (slokaAndMain[1] || "").trim();

            let backup = parts[2]
                ? parts[2].replace("[", "").replace("]", "").trim()
                : "";

            rows.push([seg, sloka, main, backup]);
        }
    });

    // If no rows, avoid empty table
    if (rows.length === 0) {
        console.warn("No rows prepared for PDF table");
        doc.text("No allocation data available.", 40, y);
        doc.save("KSST_Allocation.pdf");
        return;
    }

    // Generate table with saffron header
doc.autoTable({
    startY: y,
    head: [["Segment Name", "Sloka", "Main", "Backup"]],
    body: rows,
    styles: {
        font: "Helvetica",
        fontSize: 9,          // smaller font
        cellPadding: 2,       // tighter rows
        overflow: "linebreak"
    },
    headStyles: {
        fillColor: [255, 153, 51], // saffron
        textColor: 0,
        fontStyle: "bold",
        fontSize: 10
    },
    columnStyles: {
        0: { cellWidth: 120 }, // Segment
        1: { cellWidth: 80 },  // Sloka
        2: { cellWidth: 140 }, // Main
        3: { cellWidth: 80 }   // Backup
    },
    margin: { left: 20, right: 20 }, // narrower margins
    tableWidth: "auto",
    pageBreak: "avoid"
});

    doc.save("KSST_Allocation.pdf");
}
