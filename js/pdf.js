function downloadPDFFromText(outputText) {
    const rows = parseOutputText(outputText);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Hari Om Namo Narayana", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("KSST Satsang Seva – Allocation", pageWidth / 2, 22, { align: "center" });

    const tableData = rows.map(r => [r.label, r.range || "", r.name]);

    doc.autoTable({
        head: [["Segment", "Sloka Range", "Assigned To"]],
        body: tableData,
        startY: 30,
        styles: {
            fontSize: 10
        },
        headStyles: {
            fillColor: [230, 126, 34],
            textColor: 255
        }
    });

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const mode = detectModeFromOutput(rows);
    const fileName = "KSST_Allocation_" + mode + "_" + dateStr + ".pdf";

    doc.setFontSize(10);
    doc.text("KSST Satsang Seva", pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });

    doc.save(fileName);
}
