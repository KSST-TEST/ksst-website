/* DOWNLOAD PDF */
function downloadPDF(is108 = false) {
    const { jsPDF } = window.jspdf;
    let doc = new jsPDF({
        orientation: "portrait",
        unit: "pt",
        format: "a4"
    });

    // Extract output lines
    let outputElement = document.getElementById("output");
    if (!outputElement) return;
    let output = outputElement.value.split("\n");

    const batch = document.getElementById("batchNumber").value || "";
    const dateElem = document.getElementById("satsangDate");
    const satsangDate = dateElem.getAttribute("data-formatted") || dateElem.value || "";
    const satsangTime = document.getElementById("satsangTime").value || "";

    let safeDate = satsangDate.replace(/\//g, "-");

    // HEADER
    doc.setFont("Calibri", "bold");
    doc.setFontSize(16);
    doc.text("Hari Om Namo Narayana", 40, 40);

    // WATERMARK placeholders (images will be added after upload)
    // doc.addImage(ksstLogo, "PNG", 40, 20, 50, 50);
    // doc.addImage(omSymbol, "PNG", 500, 20, 50, 50);

    let y = 80;

    doc.setFont("Calibri", "bold");
    doc.setFontSize(14);
    doc.text("KSST Allocation Report", 40, y);
    y += 25;

    doc.setFont("Calibri", "normal");
    doc.setFontSize(12);

    doc.text("Batch Number: " + batch, 40, y); y += 18;
    doc.text("Satsang Date: " + satsangDate, 40, y); y += 18;
    doc.text("Satsang Time (IST): " + satsangTime, 40, y); y += 25;

    // Prepare table rows
    let rows = [];

    output.forEach(line => {
        line = line.trim();
        if (!line) return;

        if (line.startsWith("*Om Namo")) return;
        if (line.startsWith("-----")) return;
        if (line.startsWith("Batch Number:")) return;

        // SPECIAL LINES
        if (line.includes(":") && !line.includes("–")) {
            let parts = line.split(":");
            let seg = parts[0].trim();
            let main = parts[1].trim();
            rows.push([seg, "", main]);
            return;
        }

        // NORMAL LINES
        if (line.includes("–")) {
            let parts = line.split("–");
            let seg = parts[0].trim();

            let slokaAndMain = parts[1].split(" - ");
            let sloka = slokaAndMain[0].trim();
            let main = slokaAndMain[1].trim();

            rows.push([seg, sloka, main]);
        }
    });

    // Table
    doc.autoTable({
        startY: y,
        head: [["Segment Name", "Sloka", "Main"]],
        body: rows,
        styles: {
            font: "Calibri",
            fontSize: 10,
            cellPadding: 3
        },
        headStyles: {
            fillColor: [255, 153, 51], // saffron
            textColor: 0,
            fontStyle: "bold"
        },
        margin: { left: 20, right: 20 }
    });

    // FOOTER
    doc.setFont("Calibri", "italic");
    doc.setFontSize(11);
    doc.text("KSST Satsang Seva", 40, 820);

    // File naming
    let fileName = is108
        ? `VSN_108_Allocation_${safeDate}.pdf`
        : `VSN_FullAllocation_${safeDate}.pdf`;

    doc.save(fileName);
}
