// ============================================================
// VSN PDF EXPORT
// ============================================================

function formatDateinDDMMYYYY(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
}

function convertTo12Hour(timeString) {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

function exportToPDF(allocations, metadata = {}) {
    if (!allocations || allocations.length === 0) {
        alert("No allocation available.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    let yPosition = 40;

    // Main heading
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("*Om Namo Narayana*", 40, yPosition);
    yPosition += 30;

    // Report title
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Śrī Viṣṇu Sahasranāma - Satsang Allocation Report", 40, yPosition);
    yPosition += 25;

    // Format date and time
    const formattedDate = formatDateinDDMMYYYY(metadata.satsangDate);
    const formattedTime = metadata.satsangTime ? convertTo12Hour(metadata.satsangTime) + " IST" : '';

    // Metadata
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    const batchInfo = `Batch Name: ${metadata.batchNumber || ''}    |    Satsang #: ${metadata.satsangNo || '1'}    |    Date: ${formattedDate}    |    Time: ${formattedTime}`;
    doc.text(batchInfo, 40, yPosition);
    yPosition += 20;

    // Separator line
    doc.setDrawColor(100, 100, 100);
    doc.line(40, yPosition, 560, yPosition);
    yPosition += 15;

    // Group allocations by segment
    const segmentOrder = [
        "Starting Prayer",
        "Śrī Mahālakṣmī Aṣṭakam",
        "Kṣamā Prārthanā & Ending Prayer",
        "Poorvāṅga",
        "Nyāsa",
        "Dhyānam",
        "Main Ślokam",
        "Phalaśruti"
    ];

    const bySegment = {};
    for (const alloc of allocations) {
        if (!bySegment[alloc.segment]) {
            bySegment[alloc.segment] = [];
        }
        bySegment[alloc.segment].push(alloc);
    }

    // Build table rows in segment order
    const rows = [];
    for (const segment of segmentOrder) {
        if (bySegment[segment]) {
            for (const alloc of bySegment[segment]) {
                const rangeStr = alloc.from === alloc.to ? "Full" : `${alloc.from}-${alloc.to}`;
                rows.push([
                    alloc.segment,
                    rangeStr,
                    alloc.name
                ]);
            }
        }
    }

    // Table
    doc.autoTable({
        startY: yPosition,
        head: [["Segment", "Range", "Devotee Name"]],
        body: rows,
        theme: "grid",
        headStyles: {
            fillColor: [68, 114, 196],  // Blue header
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 11,
            halign: "center"
        },
        bodyStyles: {
            font: "Helvetica",
            fontSize: 10,
            cellPadding: 5,
            textColor: [0, 0, 0]
        },
        columnStyles: {
            0: { cellWidth: 120 },
            1: { cellWidth: 80, halign: "center" },
            2: { cellWidth: 150, halign: "left" }
        },
        alternateRowStyles: {
            fillColor: [242, 242, 242]
        },
        margin: { left: 40, right: 40, top: 10, bottom: 10 }
    });

    // Summary
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`Total Allocations: ${allocations.length}`, 40, finalY);

    // Footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFont("Helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Kovai Swamināma Smarana Trust — KSST Satsang Seva", 40, pageHeight - 20);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 40, pageHeight - 10);

    // Generate filename with date in dd-mm-yyyy format
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    const filename = `VSN_Allocation_${dateStr}.pdf`;

    doc.save(filename);
}