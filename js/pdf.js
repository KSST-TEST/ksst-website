/* ============================================================
   DOWNLOAD PDF (FINAL CLEAN VERSION)
   Uses engine output directly from #output textarea
   ============================================================ */

function downloadPDF(is108 = false) {
    const { jsPDF } = window.jspdf;

    /* STEP 1 — Read batch/date/time */
    const batch = document.getElementById("batchNumber").value || "";

    const dateElem = document.getElementById("satsangDate");
    const satsangDate =
        dateElem.getAttribute("data-formatted") || dateElem.value || "";

    const satsangTime =
        document.getElementById("satsangTime").value || "";

    const safeDate = satsangDate.replace(/\//g, "-");

    /* STEP 2 — Read output lines */
    let output = document.getElementById("output").value.split("\n");

    /* STEP 3 — Load watermark images */
    let ksstLogo = new Image();
    let omLogo = new Image();

    ksstLogo.src = "images/ksst-logo.png";
    omLogo.src = "images/om.png";

    /* STEP 4 — Wait for images to load */
    ksstLogo.onload = () => {
        omLogo.onload = () => {

            let doc = new jsPDF({
                orientation: "portrait",
                unit: "pt",
                format: "a4"
            });

            /* HEADER */
            doc.setFont("Calibri", "bold");
            doc.setFontSize(16);
            doc.text("Hari Om Namo Narayana", 40, 40);

            // Watermark images
            doc.addImage(ksstLogo, "PNG", 40, 20, 50, 50);  // left
            doc.addImage(omLogo, "PNG", 500, 20, 50, 50);   // right

            let y = 90;

            doc.setFont("Calibri", "bold");
            doc.setFontSize(14);
            doc.text("Satsang Allocation", 40, y);
            y += 25;

            doc.setFont("Calibri", "normal");
            doc.setFontSize(12);

            doc.text("Batch Number: " + batch, 40, y); y += 18;
            doc.text("Satsang Date: " + satsangDate, 40, y); y += 18;
            doc.text("Satsang Time (IST): " + satsangTime, 40, y); y += 25;

            /* STEP 5 — Prepare table rows */
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

            /* STEP 6 — TABLE */
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

            /* FOOTER */
            doc.setFont("Calibri", "italic");
            doc.setFontSize(11);
            doc.text("KSST Satsang Seva", 40, 820);

            /* STEP 7 — File naming */
            let fileName = is108
                ? `VSN_108_Allocation_${safeDate}.pdf`
                : `VSN_FullAllocation_${safeDate}.pdf`;

            doc.save(fileName);
        };
    };
}
