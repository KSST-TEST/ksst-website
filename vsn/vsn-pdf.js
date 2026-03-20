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

// Mapping for segment names to English transliterations
const segmentNameMapping = {
    "Starting Prayer": "Starting Prayer",
    "Śrī Mahālakṣmī Aṣṭakam": "Shri Mahalakshmi Ashtakam",
    "Kṣamā Prārthanā & Ending Prayer": "KSHAMA PRARTHANA & ENDING PRAYER",
    "Poorvāṅga": "Poorvangam",
    "Nyāsa": "Nyasyaha",
    "Dhyānam": "Dhyaanam",
    "Main Ślokam": "Main Shlokam",
    "Phalaśruti": "Phalashruti"
};

function getEnglishSegmentName(sanskritName) {
    return segmentNameMapping[sanskritName] || sanskritName;
}

function exportToPDF(allocations, metadata = {}) {
    try {
        if (!allocations || allocations.length === 0) {
            alert("No allocation available.");
            return;
        }

        if (!window.jspdf) {
            alert("Error: jsPDF library not loaded. Please refresh the page and try again.");
            return;
        }

        const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    let yPosition = 40;

    // Main heading
    doc.setFont("Times", "bold");
    doc.setFontSize(16);
    doc.text("*Om Namo Narayana*", 40, yPosition);
    yPosition += 30;

    // Report title
    doc.setFont("Times", "bold");
    doc.setFontSize(14);
    doc.text("Sri Vishnu Sahasranama Stotram - Satsang Allocation Report", 40, yPosition);
    yPosition += 25;

    // Format date and time
    const formattedDate = formatDateinDDMMYYYY(metadata.satsangDate);
    const formattedTime = metadata.satsangTime ? convertTo12Hour(metadata.satsangTime) + " IST" : '';

    // Metadata
    doc.setFont("Times", "normal");
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

    // Build table rows in segment order - UTF-8 safe approach
    const rows = [];
    for (const segment of segmentOrder) {
        if (bySegment[segment]) {
            for (const alloc of bySegment[segment]) {
                let rangeStr;
                if (alloc.segment === "Nyāsa" && alloc.from === alloc.to) {
                    rangeStr = "Full";
                } else if (alloc.from === alloc.to) {
                    rangeStr = `${alloc.from}`;
                } else {
                    rangeStr = `${alloc.from}-${alloc.to}`;
                }
                rows.push([
                    getEnglishSegmentName(alloc.segment),
                    rangeStr,
                    alloc.name
                ]);
            }
        }
    }

    // Table with Unicode support via autoTable
    doc.autoTable({
        startY: yPosition,
        head: [["Segment", "Range", "Devotee Name"]],
        body: rows,
        theme: "grid",
        headStyles: {
            fillColor: [68, 114, 196],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 10,
            halign: "left",
            valign: "middle"
        },
        bodyStyles: {
            fontSize: 9,
            cellPadding: 4,
            textColor: [0, 0, 0],
            valign: "top"
        },
        columnStyles: {
            0: { cellWidth: 100, halign: "left" },
            1: { cellWidth: 60, halign: "center" },
            2: { cellWidth: 120, halign: "left" }
        },
        alternateRowStyles: {
            fillColor: [242, 242, 242]
        },
        margin: { left: 40, right: 40, top: 10, bottom: 10 },
        didDrawPage: function(data) {
            // Handle multi-page documents
        }
    });

    // Improved Footer - better spacing and positioning
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;
    
    // Footer separator line
    doc.setDrawColor(150, 150, 150);
    doc.line(40, pageHeight - 35, pageWidth - 40, pageHeight - 35);
    
    // Organization name
    doc.setFont("Times", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text("Kovai Swamināma Smarana Trust — KSST Satsang Seva", pageWidth / 2, pageHeight - 25, { align: "center" });
    
    // Generation timestamp
    doc.setFont("Times", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 12, { align: "center" });

    // Generate filename with Batch Name and Satsang Date in mm-dd-yyyy format
    const batchName = metadata.batchNumber || 'VSN';
    const satsangDate = new Date(metadata.satsangDate + 'T00:00:00');
    const fileMonth = String(satsangDate.getMonth() + 1).padStart(2, '0');
    const fileDay = String(satsangDate.getDate()).padStart(2, '0');
    const fileYear = satsangDate.getFullYear();
    const fileDateStr = `${fileMonth}-${fileDay}-${fileYear}`;
    const filename = `${batchName}_Satsang_${metadata.satsangNo || '1'}_Allocation_${fileDateStr}.pdf`;

    doc.save(filename);
    } catch (err) {
        console.error("Error in exportToPDF:", err);
        alert("Error generating PDF file: " + err.message);
    }
}