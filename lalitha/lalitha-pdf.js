// ============================================================
// LALITHA PDF EXPORT
// ============================================================
// Note: formatDateinDDMMYYYY and convertTo12Hour are defined in lalitha.js

// Mapping for segment names to English transliterations - Lalitha specific
const lalithaSegmentNameMapping = {
    "Starting Prayer": "Starting Prayer",
    "Dhyānam": "Dhyaanam",
    "Main Ślokam": "Main Shlokam",
    "Kṣamā Prārthanā & Ending Prayer": "KSHAMA PRARTHANA & ENDING PRAYER"
};

function getEnglishSegmentName(sanskritName) {
    return lalithaSegmentNameMapping[sanskritName] || sanskritName;
}

function exportToPDFLalitha(allocations, metadata = {}) {
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
        doc.text("********Om Sri Lalitha Tripura Sundari Deviyai Namaha********", 40, yPosition);
        yPosition += 30;

        // Report title
        doc.setFont("Times", "bold");
        doc.setFontSize(14);
        doc.text("Sri Lalita Sahasra Nama Stotram - Satsang Allocation Report", 40, yPosition);
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
            "Dhyānam",
            "Main Ślokam",
            "Kṣamā Prārthanā & Ending Prayer"
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
                // Special handling for Main Ślokam to group by rounds
                if (segment === "Main Ślokam") {
                    const allocsByRound = {};
                    for (const alloc of bySegment[segment]) {
                        const round = alloc.round || 1;
                        if (!allocsByRound[round]) {
                            allocsByRound[round] = [];
                        }
                        allocsByRound[round].push(alloc);
                    }
                    
                    // Add round headers and allocations
                    for (const round of Object.keys(allocsByRound).sort((a, b) => parseInt(a) - parseInt(b))) {
                        rows.push([`${getEnglishSegmentName(segment)} - ROUND ${round}`, "", ""]);
                        for (const alloc of allocsByRound[round]) {
                            let rangeStr;
                            if (alloc.from === alloc.to) {
                                rangeStr = `${alloc.from}`;
                            } else {
                                rangeStr = `${alloc.from}-${alloc.to}`;
                            }
                            rows.push([
                                "",
                                rangeStr,
                                alloc.name
                            ]);
                        }
                    }
                } else {
                    // Other segments: no round information
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
            margin: { left: 40, right: 40, top: 10, bottom: 30 },
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
        doc.setFontSize(10);
        doc.text("Kovai Swamināma Smarana Trust", 40, pageHeight - 25);
        
        // Generation info
        doc.setFont("Times", "normal");
        doc.setFontSize(8);
        const now = new Date();
        const dateTimeStr = `Generated on ${formatDateinDDMMYYYY(now.toISOString().split('T')[0])} at ${convertTo12Hour(now.toTimeString().slice(0, 5))}`;
        doc.text(dateTimeStr, 40, pageHeight - 15);

        // Save PDF
        const filename = `${metadata.batchNumber || 'Lalitha'}_Satsang_${metadata.satsangNo || '1'}.pdf`;
        doc.save(filename);
        console.log("PDF exported successfully:", filename);
    } catch (err) {
        console.error("Error in exportToPDFLalitha:", err);
        alert("Error generating PDF: " + err.message);
    }
}
