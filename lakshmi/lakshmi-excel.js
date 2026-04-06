// ============================================================
// LAKSHMI EXCEL EXPORT
// ============================================================
// Note: formatDateinDDMMYYYY and convertTo12Hour are defined in lakshmi.js

function exportToExcelLakshmi(allocations, metadata = {}) {
    console.log("exportToExcelLakshmi called with allocations:", allocations);
    console.log("exportToExcelLakshmi metadata:", metadata);
    
    try {
        if (!allocations || allocations.length === 0) {
            console.error("No allocations to export");
            alert("No allocation available. Please run an allocation first.");
            return;
        }

        if (!window.XLSX || !window.XLSX.utils) {
            console.error("XLSX library not loaded");
            alert("Error: XLSX library not loaded. Please refresh the page and try again.");
            return;
        }

        const wb = window.XLSX.utils.book_new();
    
        // Format date and time
        const formattedDate = formatDateinDDMMYYYY(metadata.satsangDate);
        const formattedTime = metadata.satsangTime ? convertTo12Hour(metadata.satsangTime) + " IST" : '';

        // ===== TAB 1: SUMMARY FORMAT =====
        const wsData1 = [];
        wsData1.push(["Sri Lakshmi Sahasra Nama Stotram - Satsang Allocation Report"]);
        wsData1.push([]);
        wsData1.push([
            `Batch Name: ${metadata.batchNumber || ''}`,
            `Satsang #: ${metadata.satsangNo || '1'}`,
            `Date: ${formattedDate}`,
            `Time: ${formattedTime}`
        ]);
        wsData1.push([]);

        // Group allocations by segment
        const segmentOrder = [
            "Starting Prayer",
            "Nyāsa",
            "Dhyānam",
            "Main Ślokam",
            "Phalaśruti",
            "Kṣamā Prārthanā & Ending Prayer"
        ];

        const bySegment = {};
        for (const alloc of allocations) {
            if (!bySegment[alloc.segment]) {
                bySegment[alloc.segment] = [];
            }
            bySegment[alloc.segment].push(alloc);
        }

        // Add fixed single assignments at top
        for (const segment of ["Starting Prayer", "Kṣamā Prārthanā & Ending Prayer"]) {
            if (bySegment[segment] && bySegment[segment].length > 0) {
                const alloc = bySegment[segment][0];
                wsData1.push([segment, alloc.name]);
            }
        }
        
        wsData1.push([]);
        wsData1.push(["Devotee Name", "Segment", "Allocated Slokas"]);

        // Add remaining allocations in detail - skip fixed segments
        const skipSegmentsInDetail = ["Starting Prayer", "Kṣamā Prārthanā & Ending Prayer"];
        for (const segment of segmentOrder) {
            if (!skipSegmentsInDetail.includes(segment) && bySegment[segment]) {
                for (const alloc of bySegment[segment]) {
                    let rangeStr;
                    if (alloc.from === alloc.to) {
                        rangeStr = `${alloc.from}`;
                    } else {
                        rangeStr = `${alloc.from} - ${alloc.to}`;
                    }
                    wsData1.push([
                        alloc.name,
                        segment,
                        rangeStr
                    ]);
                }
            }
        }

        const ws1 = window.XLSX.utils.aoa_to_sheet(wsData1);
        ws1["!cols"] = [{ wch: 25 }, { wch: 28 }, { wch: 18 }];
        applyExcelStyles1(ws1);
        window.XLSX.utils.book_append_sheet(wb, ws1, "Format#1");

        // ===== TAB 2: DETAILED MULTI-COLUMN FORMAT =====
        const wsData2 = [];
        wsData2.push(["Sri Lakshmi Sahasra Nama Stotram - Satsang Allocation Report"]);
        wsData2.push([]);
        wsData2.push([
            `Batch Name: ${metadata.batchNumber || ''}`,
            `Satsang #: ${metadata.satsangNo || '1'}`,
            `Date: ${formattedDate}`,
            `Time: ${formattedTime}`
        ]);
        wsData2.push([]);

        // Header: Single assignments
        for (const segment of ["Starting Prayer", "Kṣamā Prārthanā & Ending Prayer"]) {
            if (bySegment[segment] && bySegment[segment].length > 0) {
                const alloc = bySegment[segment][0];
                wsData2.push([segment, alloc.name]);
            }
        }
        wsData2.push([]);

        // Column headers for multi-segment view
        const colHeaders = ["Devotee Name"];
        
        // Determine max segments needed by checking all devotees' allocation counts
        let maxSegmentsNeeded = 1;
        const devoteeAllocations = {};
        const fixedSegments = ["Starting Prayer", "Kṣamā Prārthanā & Ending Prayer"];
        
        // Define segment order for proper sequencing
        const segmentOrder2 = [
            "Nyāsa",
            "Dhyānam",
            "Main Ślokam",
            "Phalaśruti"
        ];
        
        for (const alloc of allocations) {
            if (!fixedSegments.includes(alloc.segment)) {
                if (!devoteeAllocations[alloc.name]) {
                    devoteeAllocations[alloc.name] = [];
                }
                devoteeAllocations[alloc.name].push(alloc);
            }
        }
        
        // Find the maximum number of segments any devotee has
        for (const allocs of Object.values(devoteeAllocations)) {
            maxSegmentsNeeded = Math.max(maxSegmentsNeeded, allocs.length);
        }
        
        for (let i = 0; i < maxSegmentsNeeded; i++) {
            colHeaders.push("Segment");
            colHeaders.push("Allocated Slokas");
        }
        wsData2.push(colHeaders);

        // Add devotee rows with segment columns
        // Helper: get segment index based on segmentOrder for sorting
        const segmentIndexMap = {};
        segmentOrder2.forEach((seg, idx) => { segmentIndexMap[seg] = idx; });
        
        for (const [devotee, allocs] of Object.entries(devoteeAllocations)) {
            // Sort allocations by segment order first, then by starting sloka within segment
            allocs.sort((a, b) => {
                const segA = segmentIndexMap[a.segment] ?? 999;
                const segB = segmentIndexMap[b.segment] ?? 999;
                if (segA !== segB) return segA - segB;  // Primary: segment order
                return a.from - b.from;  // Secondary: sloka number
            });
            const row = [devotee];
            for (let i = 0; i < maxSegmentsNeeded; i++) {
                if (i < allocs.length) {
                    const alloc = allocs[i];
                    row.push(alloc.segment);
                    let rangeStr;
                    if (alloc.from === alloc.to) {
                        rangeStr = `${alloc.from}`;
                    } else {
                        rangeStr = `${alloc.from} - ${alloc.to}`;
                    }
                    row.push(rangeStr);
                } else {
                    row.push("");
                    row.push("");
                }
            }
            wsData2.push(row);
        }

        // Backup section
        wsData2.push([]);
        wsData2.push(["Back-Up"]);
        wsData2.push(["Segment", "Devotee Name"]);
        for (const segment of ["Nyāsa", "Main Ślokam", "Phalaśruti"]) {
            wsData2.push([segment, ""]);
        }

        const ws2 = window.XLSX.utils.aoa_to_sheet(wsData2);
        // Dynamic column widths based on maxSegmentsNeeded
        const cols = [{ wch: 25 }];  // Devotee name column
        for (let i = 0; i < maxSegmentsNeeded; i++) {
            cols.push({ wch: 20 }, { wch: 14 });  // Segment and Slokas columns
        }
        ws2["!cols"] = cols;
        applyExcelStyles2(ws2);
        window.XLSX.utils.book_append_sheet(wb, ws2, "Format#2");

        // Generate filename with Batch Name and Satsang Date in mm-dd-yyyy format
        const batchName = metadata.batchNumber || 'LSN';
        const satsangDate = new Date(metadata.satsangDate + 'T00:00:00');
        const fileMonth = String(satsangDate.getMonth() + 1).padStart(2, '0');
        const fileDay = String(satsangDate.getDate()).padStart(2, '0');
        const fileYear = satsangDate.getFullYear();
        const fileDateStr = `${fileMonth}-${fileDay}-${fileYear}`;
        const filename = `${batchName}_Satsang_${metadata.satsangNo || '1'}_Allocation_${fileDateStr}.xlsx`;
        
        console.log("Generated filename:", filename);
        console.log("Workbook sheets:", wb.SheetNames);
        window.XLSX.writeFile(wb, filename);
        console.log("Excel file downloaded successfully");
    } catch (err) {
        console.error("Error in exportToExcelLakshmi:", err);
        alert("Error generating Excel file: " + err.message);
    }
}

function applyExcelStyles1(ws) {
    try {
        const ref = ws["!ref"];
        if (!ref) {
            console.warn("No data range worksheet");
            return;
        }
        
        const range = window.XLSX.utils.decode_range(ref);
        
        for (let R = range.s.r; R <= range.e.r; R++) {
            for (let C = range.s.c; C <= range.e.c; C++) {
                const cellRef = window.XLSX.utils.encode_cell({ r: R, c: C });
                
                if (!ws[cellRef]) {
                    ws[cellRef] = { t: "s", v: "" };
                }
                
                const cell = ws[cellRef];
                
                cell.s = {
                    font: { name: "Calibri", sz: 11 },
                    alignment: { vertical: "center", horizontal: "left", wrapText: true },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                };

                // Title row - Dark Blue Bold
                if (R === 0) {
                    cell.s.fill = { fgColor: { rgb: "1F4E78" } };
                    cell.s.font = { name: "Calibri", sz: 14, bold: true, color: { rgb: "FFFFFF" } };
                    cell.s.alignment.horizontal = "center";
                }
                // Metadata row - Light Gray
                else if (R === 2) {
                    cell.s.fill = { fgColor: { rgb: "D9D9D9" } };
                    cell.s.font = { name: "Calibri", sz: 10, bold: true };
                }
                // Empty rows
                else if (R === 3 || R === 4) {
                    cell.s.fill = { fgColor: { rgb: "FFFFFF" } };
                }
                // Column headers - Professional Blue
                else if (R === 5) {
                    cell.s.fill = { fgColor: { rgb: "4472C4" } };
                    cell.s.font = { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } };
                    cell.s.alignment.horizontal = "center";
                }
                // Data rows - alternating white and light blue
                else if (R > 5) {
                    if ((R - 6) % 2 === 0) {
                        cell.s.fill = { fgColor: { rgb: "FFFFFF" } };
                    } else {
                        cell.s.fill = { fgColor: { rgb: "D9E8F5" } };
                    }
                    // Column-specific alignment: Left for names, Center for Segment and Slokas
                    if (C === 0) {
                        cell.s.alignment.horizontal = "left";
                    } else if (C === 1 || C === 2) {
                        cell.s.alignment.horizontal = "center";
                    }
                }
            }
        }
        
        // Set column widths
        if (ws["!cols"]) {
            ws["!cols"][0] = { wch: 25 };
            ws["!cols"][1] = { wch: 28 };
            ws["!cols"][2] = { wch: 18 };
        }
    } catch (err) {
        console.error("Error applying styles:", err);
    }
}

function applyExcelStyles2(ws) {
    try {
        const range = window.XLSX.utils.decode_range(ws["!ref"] || "A1");
        for (let R = range.s.r; R <= range.e.r; R++) {
            for (let C = range.s.c; C <= range.e.c; C++) {
                const cellRef = window.XLSX.utils.encode_cell({ r: R, c: C });
                
                if (!ws[cellRef]) {
                    ws[cellRef] = { v: "", t: "s" };
                }

                ws[cellRef].s = {
                    font: { name: "Calibri", sz: 11 },
                    alignment: { vertical: "center", horizontal: "left", wrapText: true },
                    border: {
                        top: { style: "thin", color: { rgb: "000000" } },
                        bottom: { style: "thin", color: { rgb: "000000" } },
                        left: { style: "thin", color: { rgb: "000000" } },
                        right: { style: "thin", color: { rgb: "000000" } }
                    }
                };

                // Title row - Dark Blue Bold
                if (R === 0) {
                    ws[cellRef].s.fill = { fgColor: { rgb: "1F4E78" } };
                    ws[cellRef].s.font = { name: "Calibri", sz: 14, bold: true, color: { rgb: "FFFFFF" } };
                    ws[cellRef].s.alignment.horizontal = "center";
                }
                // Meta rows - Light Gray
                else if (R === 2) {
                    ws[cellRef].s.fill = { fgColor: { rgb: "D9D9D9" } };
                    ws[cellRef].s.font = { name: "Calibri", sz: 10, bold: true };
                }
                // Empty rows
                else if (R === 3 || R === 4 || R === 5) {
                    ws[cellRef].s.fill = { fgColor: { rgb: "FFFFFF" } };
                }
                // Column headers - Professional Blue
                else if (R === 6) {
                    ws[cellRef].s.fill = { fgColor: { rgb: "4472C4" } };
                    ws[cellRef].s.font = { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } };
                    ws[cellRef].s.alignment.horizontal = "center";
                }
                // Data rows - alternating white and light blue
                else if (R > 6) {
                    if ((R - 7) % 2 === 0) {
                        ws[cellRef].s.fill = { fgColor: { rgb: "FFFFFF" } };
                    } else {
                        ws[cellRef].s.fill = { fgColor: { rgb: "D9E8F5" } };
                    }
                    // Left align names, center align for numbers and sloka ranges
                    if (C === 0) {
                        ws[cellRef].s.alignment.horizontal = "left";
                    } else {
                        ws[cellRef].s.alignment.horizontal = "center";
                    }
                }
            }
        }
    } catch (err) {
        console.error("Error applying styles:", err);
    }
}
