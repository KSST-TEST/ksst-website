// ============================================================
// VSN EXCEL EXPORT
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

function exportToExcel(allocations, metadata = {}) {
    if (!allocations || allocations.length === 0) {
        alert("No allocation available.");
        return;
    }

    const wb = XLSX.utils.book_new();
    const wsData = [];

    // Title row
    wsData.push(["Śrī Viṣṇu Sahasranāma - Satsang Allocation Report"]);
    wsData.push([]);

    // Format date and time
    const formattedDate = formatDateinDDMMYYYY(metadata.satsangDate);
    const formattedTime = metadata.satsangTime ? convertTo12Hour(metadata.satsangTime) + " IST" : '';

    // Header information
    wsData.push([
        `Batch Name: ${metadata.batchNumber || ''}`,
        `Satsang #: ${metadata.satsangNo || '1'}`,
        `Date: ${formattedDate}`,
        `Time: ${formattedTime}`
    ]);
    wsData.push([]);

    // Column headers
    wsData.push(["Segment", "From", "To", "Devotee Name"]);

    // Group allocations by segment for better organization
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

    // Add data rows in segment order
    for (const segment of segmentOrder) {
        if (bySegment[segment]) {
            for (const alloc of bySegment[segment]) {
                wsData.push([
                    alloc.segment,
                    alloc.from,
                    alloc.to === alloc.from ? "Full" : alloc.to,
                    alloc.name
                ]);
            }
        }
    }

    wsData.push([]);
    wsData.push([`Total Allocations: ${allocations.length}`]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws["!cols"] = [
        { wch: 35 },
        { wch: 10 },
        { wch: 10 },
        { wch: 30 }
    ];

    // Set row heights
    ws["!rows"] = [
        { hpt: 20 },  // Title row
        { hpt: 15 },  // Empty row
        { hpt: 18 },  // Header info
        { hpt: 15 },  // Empty row
        { hpt: 18 }   // Column headers
    ];

    // Apply styles
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let R = range.s.r; R <= range.e.r; R++) {
        for (let C = range.s.c; C <= range.e.c; C++) {
            const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = ws[cellRef];
            if (!cell) continue;

            cell.s = {
                font: { name: "Calibri", sz: 11 },
                alignment: { vertical: "center", wrapText: true, horizontal: "left" },
                border: {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" }
                }
            };

            // Title row (row 0)
            if (R === 0) {
                cell.s.fill = { fgColor: { rgb: "4472C4" } };
                cell.s.font.bold = true;
                cell.s.font.color = { rgb: "FFFFFF" };
                cell.s.font.sz = 14;
                cell.s.alignment.horizontal = "center";
            }
            // Header info row (row 2)
            else if (R === 2) {
                cell.s.fill = { fgColor: { rgb: "E7E6E6" } };
                cell.s.font.bold = true;
                cell.s.font.sz = 10;
            }
            // Column header row (row 4)
            else if (R === 4) {
                cell.s.fill = { fgColor: { rgb: "FFF2CC" } };
                cell.s.font.bold = true;
                cell.s.alignment.horizontal = "center";
            }
            // Data rows with alternating colors
            else if (R > 4 && R < range.e.r - 2) {
                if ((R - 5) % 2 === 0) {
                    // White rows
                    cell.s.fill = { fgColor: { rgb: "FFFFFF" } };
                } else {
                    // Light gray rows
                    cell.s.fill = { fgColor: { rgb: "F2F2F2" } };
                }
            }
            // Summary row (last row)
            else if (R === range.e.r) {
                cell.s.fill = { fgColor: { rgb: "E7E6E6" } };
                cell.s.font.bold = true;
            }
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, "VSN Allocation");
    
    // Generate filename with date in dd-mm-yyyy format
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = `${day}-${month}-${year}`;
    const filename = `VSN_Allocation_${dateStr}.xlsx`;
    
    XLSX.writeFile(wb, filename);
}