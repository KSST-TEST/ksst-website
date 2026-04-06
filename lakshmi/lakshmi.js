// ============================================================
// LAKSHMI ALLOCATION ENGINE - COMPREHENSIVE WITH HISTORY AWARENESS
// ============================================================

let currentLakshmiAllocations = [];
let currentLakshmiNames = [];
let currentLakshmiHistoryText = "";

// ---------- HELPER: FORMAT DATE AND TIME ----------
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

// ---------- PARSE HISTORY FROM TEXT/FILE CONTENT ----------
function parseHistory(historyText) {
    if (!historyText || !historyText.trim()) {
        return [];
    }

    const allocations = [];
    const lines = historyText.split(/\r?\n/);

    for (const line of lines) {
        if (!line.trim()) continue;
        
        let segment = "";
        let from = 1, to = 1, name = "";
        
        // Try tab-separated (Excel copy-paste)
        if (line.includes('\t') && !segment) {
            const parts = line.split('\t').map(p => p.trim()).filter(p => p);
            if (parts.length >= 3) {
                segment = parts[0];
                const rangeStr = parts[1];
                if (rangeStr.match(/^\d+[-–]\d+$/)) {
                    const rp = rangeStr.split(/[-–]/);
                    from = parseInt(rp[0]); to = parseInt(rp[1]); name = parts[2];
                } else if (!isNaN(parseInt(parts[1])) && !isNaN(parseInt(parts[2]))) {
                    from = parseInt(parts[1]); to = parseInt(parts[2]); name = parts[3] || "";
                } else {
                    from = parseInt(parts[1]) || 1; to = from; name = parts[2];
                }
            }
        }
        
        // Try comma-separated (CSV)
        if (line.includes(',') && !segment) {
            const parts = line.split(',').map(p => p.trim()).filter(p => p);
            if (parts.length >= 3) {
                segment = parts[0];
                const rangeStr = parts[1];
                if (rangeStr.match(/^\d+[-–]\d+$/)) {
                    const rp = rangeStr.split(/[-–]/);
                    from = parseInt(rp[0]); to = parseInt(rp[1]); name = parts[2];
                } else if (!isNaN(parseInt(parts[1])) && !isNaN(parseInt(parts[2]))) {
                    from = parseInt(parts[1]); to = parseInt(parts[2]); name = parts[3] || "";
                } else {
                    from = parseInt(parts[1]) || 1; to = from; name = parts[2];
                }
            }
        }
        
        let match = line.match(/^([^:→→\->\(\)]+?)\s+(\d+)\s*[–\-]\s*(\d+)\s*[→→:->]+\s*(.+)$/);
        
        if (!match) {
            match = line.match(/^(.+?)\s+(\d+)\s*[–\-]\s*(\d+)\s*:\s*(.+)$/);
        }
        
        if (!match) {
            match = line.match(/^([^0-9]+?)\s+(\d+)\s*[–\-]\s*(\d+)\s+(.+)$/);
        }

        if (match && !segment) {
            segment = match[1].trim();
            from = parseInt(match[2]);
            to = parseInt(match[3]);
            name = match[4].trim();
        }
        
        // Push if valid
        if (segment && !isNaN(from) && !isNaN(to) && name) {
            name = cleanName(name);
            if (name) {
                allocations.push({ segment, from, to, name });
            }
        }
    }

    return allocations;
}

// ---------- BUILD HISTORY MAP FOR FAIRNESS ----------
function buildHistoryMap(allocationHistory) {
    const historyMap = {};

    for (const alloc of allocationHistory) {
        if (!historyMap[alloc.name]) {
            historyMap[alloc.name] = {};
        }

        if (!historyMap[alloc.name][alloc.segment]) {
            historyMap[alloc.name][alloc.segment] = 0;
        }

        historyMap[alloc.name][alloc.segment]++;
    }

    return historyMap;
}

// ---------- SHUFFLE ARRAY ----------
function shuffleArray(array) {
    // Fisher-Yates shuffle algorithm
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ---------- NAME CLEANUP ----------
function cleanName(name) {
    // Remove numericals from start (1., 1), 1)B, etc.)
    name = name.replace(/^[\d\.\)\s]+/, "").trim();
    
    // Replace dots with spaces
    name = name.replace(/\./g, " ");
    
    // Collapse multiple spaces and trim
    name = name.replace(/\s+/g, " ").trim();
    
    let parts = name.split(" ");
    
    // Identify titles, initials, and actual names
    const titleList = ["dr", "mr", "mrs", "ms", "prof"];
    const initials = [];
    const actualNames = [];
    const titles = [];
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        
        if (!part) continue;
        
        const lowerPart = part.toLowerCase();
        
        // Check if it's a title
        if (titleList.includes(lowerPart)) {
            titles.push(lowerPart.toUpperCase());
            continue;
        }
        
        // Check if it's an initial (single letter)
        if (part.length === 1) {
            initials.push(part.toUpperCase());
        } else {
            // It's an actual name - apply title case
            actualNames.push(part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
        }
    }
    
    // Combine: actual names + initials (without spaces between initials) + titles
    let result = actualNames.join(" ");
    
    if (initials.length > 0) {
        result += (result ? " " : "") + initials.join("");
    }
    
    if (titles.length > 0) {
        result += (result ? " " : "") + titles.join(" ");
    }
    
    return result.trim();
}

// ---------- CLASSIFY PARTICIPANTS ----------
function classifyParticipants(rawNames) {
    const cleaned = rawNames.map(n => cleanName(n)).filter(n => n);
    const guruji = [];
    const ksst = [];
    const main = [];
    
    for (const name of cleaned) {
        const lower = name.toLowerCase();
        if (lower.includes("guruji")) {
            guruji.push(name);
        } else if (lower.includes("ksst")) {
            ksst.push(name);
        } else {
            main.push(name);
        }
    }
    
    return { guruji, ksst, main };
}

// ---------- MAIN ALLOCATION FUNCTION ----------
function allocateLakshmi(params) {
    try {
        const { rawNames, satsangNo, historyText = '', allocationType = 'full' } = params;
        
        const historyAllocations = parseHistory(historyText);
        const historyMap = buildHistoryMap(historyAllocations);
        
        const { guruji, ksst, main: mainOriginal } = classifyParticipants(rawNames);
        
        // SHUFFLE main list for randomized sequence, but keep it fixed for entire allocation
        const main = shuffleArray(mainOriginal);
        console.log("Shuffled participant order for round-robin:", main);
        
        const allocations = [];
        let globalPersonIndex = 0;  // Track across ALL segments - continuous round-robin
    
        // Helper: random selection from main list
        function getRandomPerson() {
            if (main.length === 0) return ksst.length > 0 ? ksst[0] : guruji[0];
            const randomIndex = Math.floor(Math.random() * main.length);
            return main[randomIndex];
        }
        
        // Helper: get next person in round-robin from main list
        function getNextPerson() {
            if (main.length === 0) return ksst.length > 0 ? ksst[0] : guruji[0];
            const person = main[globalPersonIndex % main.length];
            globalPersonIndex++;
            return person;
        }
    
        // Helper: distribute segment fairly with global person tracking
        function distributeSegment(segmentName, totalSlokas, participantList, minChunk = 1, maxChunk = 3) {
            const segmentAllocations = [];
            
            if (!participantList || participantList.length === 0) return segmentAllocations;

            const numPeople = participantList.length;
            let slokaIndex = 1;
            
            while (slokaIndex <= totalSlokas) {
                const person = participantList[globalPersonIndex % numPeople];
                const remaining = totalSlokas - slokaIndex + 1;
                const peopleRemaining = numPeople - (globalPersonIndex % numPeople);
                
                let chunkSize;
                if (remaining <= minChunk) {
                    chunkSize = remaining;
                } else if (remaining < peopleRemaining * minChunk) {
                    chunkSize = Math.max(1, Math.min(maxChunk, Math.ceil(remaining / peopleRemaining)));
                } else {
                    chunkSize = Math.min(
                        maxChunk,
                        Math.max(minChunk, Math.ceil(remaining / peopleRemaining))
                    );
                }
                
                chunkSize = Math.min(chunkSize, remaining);
                
                if (chunkSize > 0) {
                    const endSloka = Math.min(slokaIndex + chunkSize - 1, totalSlokas);
                    segmentAllocations.push({
                        segment: segmentName,
                        from: slokaIndex,
                        to: endSloka,
                        name: person
                    });
                    
                    slokaIndex = endSloka + 1;
                }
                
                globalPersonIndex++;  // Continue to next person globally
            }
            
            return segmentAllocations;
        }
    
        // ==================== ALLOCATE FULL ====================
        if (allocationType === 'full') {
            
            // 1. STARTING PRAYER (4 slokas) - RANDOM person (not round-robin)
            const startingPrayerPerson = getRandomPerson();
            if (startingPrayerPerson) {
                allocations.push({
                    segment: "Starting Prayer",
                    from: 1,
                    to: 4,
                    name: startingPrayerPerson
                });
            }
            
            // RESET globalPersonIndex for round-robin sequence starting from Nyāsa
            globalPersonIndex = 0;
            
            // 2. NYĀSA (11 slokas) - KSST always gets 1-6, rest distributed to main
            // Always assign first 6 to KSST, even if KSST not in input
            allocations.push({
                segment: "Nyāsa",
                from: 1,
                to: 6,
                name: ksst.length > 0 ? ksst[0] : "KSST"
            });
            
            // Distribute remaining Nyāsa slokas (7-11) to main participants
            const nyasaAllocations = distributeSegment("Nyāsa", 5, main, 1, 3);
            
            // Adjust allocation ranges to start from sloka 7 (skip 1-6 assigned to KSST)
            if (nyasaAllocations.length > 0) {
                const shiftAmount = 6;  // KSST took 1-6
                for (const alloc of nyasaAllocations) {
                    alloc.from += shiftAmount;
                    alloc.to += shiftAmount;
                }
            }
            allocations.push(...nyasaAllocations);
            
            // 3. DHYĀNAM (4 slokas 1-4) - one person from round-robin
            const dhyaanamPerson = getNextPerson();
            if (dhyaanamPerson) {
                allocations.push({
                    segment: "Dhyānam",
                    from: 1,
                    to: 4,
                    name: dhyaanamPerson
                });
            }
            
            // 4. MAIN ŚLOKAM (154 slokas - NOT 108!) - distribute to main participants with round-robin
            const mainSlokamAllocations = distributeSegment("Main Ślokam", 154, main, 2, 4);
            allocations.push(...mainSlokamAllocations);
            
            // 5. PHALAŚRUTI (15 slokas - NOT 33!) - distribute to main participants with round-robin
            const phalaśrutiAllocations = distributeSegment("Phalaśruti", 15, main, 1, 3);
            allocations.push(...phalaśrutiAllocations);
            
            // 6. KṢAMĀ PRĀRTHANĀ & ENDING PRAYER (4 slokas) - RANDOM person (not hardcoded)
            const endingPrayerPerson = getRandomPerson();
            if (endingPrayerPerson) {
                allocations.push({
                    segment: "Kṣamā Prārthanā & Ending Prayer",
                    from: 1,
                    to: 4,
                    name: endingPrayerPerson
                });
            }
        } 
        // ==================== ALLOCATE ONLY SLOKAM ====================
        else if (allocationType === 'slokam') {
            
            // Starting Prayer
            const startingPrayerPerson = main.length > 0 ? main[0] : (ksst.length > 0 ? ksst[0] : guruji[0]);
            if (startingPrayerPerson) {
                allocations.push({
                    segment: "Starting Prayer",
                    from: 1,
                    to: 4,
                    name: startingPrayerPerson
                });
            }
            
            // Main Ślokam (154 slokas - NOT 108!)
            const mainSlokamAllocations = distributeSegment("Main Ślokam", 154, main, 2, 4);
            allocations.push(...mainSlokamAllocations);
            
            // Ending Prayer
            const endingPrayerPerson = main.length > 1 ? main[1] : (main.length > 0 ? main[0] : (ksst.length > 0 ? ksst[0] : guruji[0]));
            if (endingPrayerPerson) {
                allocations.push({
                    segment: "Kṣamā Prārthanā & Ending Prayer",
                    from: 1,
                    to: 4,
                    name: endingPrayerPerson
                });
            }
        }
        
        return allocations;
    } catch (err) {
        console.error("Error in allocateLakshmi:", err);
        return [];
    }
}

// ---------- RENDER OUTPUT ----------
function renderLakshmiOutput(allocations, metadata = {}) {
    try {
        console.log("renderLakshmiOutput called with allocations:", allocations);
        console.log("Output element:", document.getElementById("lakshmi-output"));
        
        const lines = [];
        
        // Header
        lines.push("*** Om Shreem Mahalakshmiyei Namaha ***");
        lines.push("");
        lines.push("Sri Lakshmi Sahasra Nama Stotram");
        lines.push("-".repeat(90));
        
        // Metadata
        const formattedDate = formatDateinDDMMYYYY(metadata.satsangDate);
        const formattedTime = metadata.satsangTime ? convertTo12Hour(metadata.satsangTime) + " IST" : '';
        const batchInfo = `Batch Name: ${metadata.batchNumber || ''}              Satsang No#: ${metadata.satsangNo || '1'}     Date: ${formattedDate}     Time: ${formattedTime}`;
        lines.push(batchInfo);
        lines.push("-".repeat(90));
        lines.push("");
        
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
        
        // Segment display info
        const segmentInfo = {
            "Starting Prayer": { key: "Starting Prayer", display: "Starting Prayer" },
            "Nyāsa": { key: "Nyāsa", display: "Nyāsa" },
            "Dhyānam": { key: "Dhyānam", display: "Dhyānam" },
            "Main Ślokam": { key: "Main Ślokam", display: "Main Ślokam" },
            "Phalaśruti": { key: "Phalaśruti", display: "Phalaśruti" },
            "Kṣamā Prārthanā & Ending Prayer": { key: "Kṣamā Prārthanā & Ending Prayer", display: "Kṣamā Prārthanā & Ending Prayer" }
        };
        
        // First, show Starting Prayer and Ending Prayer on separate lines
        if (bySegment["Starting Prayer"]) {
            const alloc = bySegment["Starting Prayer"][0];
            lines.push(`Starting Prayer:   ${alloc.name}`);
        }
        
        if (bySegment["Kṣamā Prārthanā & Ending Prayer"]) {
            const alloc = bySegment["Kṣamā Prārthanā & Ending Prayer"][0];
            lines.push(`Kṣamā Prārthanā & Ending Prayer:   ${alloc.name}`);
        }
        
        lines.push("");
        
        // Render remaining allocations (Nyāsa, Dhyānam, Main Ślokam, Phalaśruti)
        for (const segment of ["Nyāsa", "Dhyānam", "Main Ślokam", "Phalaśruti"]) {
            if (!bySegment[segment]) continue;
            
            const allocsInSegment = bySegment[segment];
            const info = segmentInfo[segment];
            
            // Single-item segments
            if (allocsInSegment.length === 1 && segment === "Dhyānam") {
                const alloc = allocsInSegment[0];
                let rangeStr;
                if (alloc.from === alloc.to) {
                    rangeStr = `${alloc.from}`;
                } else {
                    rangeStr = `${alloc.from}–${alloc.to}`;
                }
                lines.push(`${info.display.padEnd(16)} - ${rangeStr.padEnd(8)} ->  ${alloc.name}`);
            } else {
                // Multi-item segments
                for (const alloc of allocsInSegment) {
                    let rangeStr;
                    if (alloc.from === alloc.to) {
                        rangeStr = `${alloc.from}`;
                    } else {
                        rangeStr = `${alloc.from}–${alloc.to}`;
                    }
                    
                    const segmentPart = info.display.padEnd(16);
                    const rangePart = `– ${rangeStr.padEnd(8)}`;
                    lines.push(`${segmentPart} ${rangePart} -> ${alloc.name}`);
                }
            }
            
            lines.push("");
        }
        
        document.getElementById("lakshmi-output").innerText = lines.join("\n");
    } catch (err) {
        console.error("Error in renderLakshmiOutput:", err);
        document.getElementById("lakshmi-output").innerText = "Error rendering output: " + err.message;
    }
}

// ---------- RUN ALLOCATION ----------
function runLakshmiAllocateFull() {
    console.log("runLakshmiAllocateFull called!");
    const rawNames = document.getElementById("lakshmi-namesInput").value.split('\n').filter(n => n.trim());
    console.log("Raw names:", rawNames);
    
    const historyText = document.getElementById("lakshmi-historyInput").value;
    const metadata = {
        batchNumber: document.getElementById("lakshmi-batchNumber").value,
        satsangNo: document.getElementById("lakshmi-satsangNo").value,
        satsangDate: document.getElementById("lakshmi-satsangDate").value,
        satsangTime: document.getElementById("lakshmi-satsangTime").value,
        allocationType: 'full'
    };
    
    currentLakshmiNames = rawNames;
    currentLakshmiHistoryText = historyText;
    
    console.log("Calling allocateLakshmi...");
    currentLakshmiAllocations = allocateLakshmi({
        rawNames,
        satsangNo: metadata.satsangNo,
        historyText,
        allocationType: 'full'
    });
    
    console.log("Allocations result:", currentLakshmiAllocations);
    console.log("Calling renderLakshmiOutput...");
    renderLakshmiOutput(currentLakshmiAllocations, metadata);
}

function runLakshmiAllocateSlokam() {
    console.log("runLakshmiAllocateSlokam called!");
    const rawNames = document.getElementById("lakshmi-namesInput").value.split('\n').filter(n => n.trim());
    console.log("Raw names:", rawNames);
    
    const historyText = document.getElementById("lakshmi-historyInput").value;
    const metadata = {
        batchNumber: document.getElementById("lakshmi-batchNumber").value,
        satsangNo: document.getElementById("lakshmi-satsangNo").value,
        satsangDate: document.getElementById("lakshmi-satsangDate").value,
        satsangTime: document.getElementById("lakshmi-satsangTime").value,
        allocationType: 'slokam'
    };
    
    currentLakshmiNames = rawNames;
    currentLakshmiHistoryText = historyText;
    
    console.log("Calling allocateLakshmi...");
    currentLakshmiAllocations = allocateLakshmi({
        rawNames,
        satsangNo: metadata.satsangNo,
        historyText,
        allocationType: 'slokam'
    });
    
    console.log("Allocations result:", currentLakshmiAllocations);
    console.log("Calling renderLakshmiOutput...");
    renderLakshmiOutput(currentLakshmiAllocations, metadata);
}

function reLakshmiAllocate() {
    if (currentLakshmiAllocations.length === 0) {
        alert("Please run an allocation first.");
        return;
    }
    if (currentLakshmiNames.length === 0) {
        alert("No names stored for re-allocation.");
        return;
    }

    try {
        const metadata = {
            batchNumber: document.getElementById("lakshmi-batchNumber").value,
            satsangNo: document.getElementById("lakshmi-satsangNo").value,
            satsangDate: document.getElementById("lakshmi-satsangDate").value,
            satsangTime: document.getElementById("lakshmi-satsangTime").value,
            allocationType: document.getElementById("lakshmi-batchNumber").dataset.allocationType || 'full'
        };

        console.log("Re-allocating with stored names...");
        currentLakshmiAllocations = allocateLakshmi({
            rawNames: currentLakshmiNames,
            satsangNo: metadata.satsangNo,
            historyText: currentLakshmiHistoryText,
            allocationType: metadata.allocationType
        });

        console.log("Re-allocations returned:", currentLakshmiAllocations);
        renderLakshmiOutput(currentLakshmiAllocations, metadata);
    } catch (err) {
        console.error("Error in reLakshmiAllocate:", err);
        alert("Error: " + err.message);
    }
}

// ---------- COPY OUTPUT ----------
function copyLakshmiOutput(button) {
    const output = document.getElementById("lakshmi-output").innerText;
    navigator.clipboard.writeText(output).then(() => {
        const originalText = button.innerText;
        button.innerText = "Copied!";
        setTimeout(() => button.innerText = originalText, 2000);
    });
}

// ---------- EXPORT FUNCTIONS ----------
function onLakshmiExportExcel() {
    console.log("onLakshmiExportExcel called");
    console.log("currentLakshmiAllocations:", currentLakshmiAllocations);
    
    const metadata = {
        batchNumber: document.getElementById("lakshmi-batchNumber").value,
        satsangNo: document.getElementById("lakshmi-satsangNo").value,
        satsangDate: document.getElementById("lakshmi-satsangDate").value,
        satsangTime: document.getElementById("lakshmi-satsangTime").value
    };
    console.log("metadata:", metadata);
    
    if (!currentLakshmiAllocations || currentLakshmiAllocations.length === 0) {
        console.error("No allocations to export");
        alert("Please run an allocation first.");
        return;
    }
    
    if (typeof exportToExcelLakshmi !== 'function') {
        console.error("exportToExcelLakshmi function not found!");
        alert("Error: Excel export function not loaded. Please refresh the page.");
        return;
    }
    
    try {
        console.log("Calling exportToExcelLakshmi...");
        exportToExcelLakshmi(currentLakshmiAllocations, metadata);
        console.log("Excel export completed");
    } catch (err) {
        console.error("Error calling exportToExcelLakshmi:", err);
        alert("Error: " + err.message);
    }
}

function onLakshmiExportPDF() {
    const metadata = {
        batchNumber: document.getElementById("lakshmi-batchNumber").value,
        satsangNo: document.getElementById("lakshmi-satsangNo").value,
        satsangDate: document.getElementById("lakshmi-satsangDate").value,
        satsangTime: document.getElementById("lakshmi-satsangTime").value
    };
    exportToPDFLakshmi(currentLakshmiAllocations, metadata);
}

// ---------- CLEAR FUNCTIONS ----------
function clearLakshmiNames() {
    document.getElementById("lakshmi-namesInput").value = "";
}

function clearLakshmiHistory() {
    document.getElementById("lakshmi-historyInput").value = "";
    document.getElementById("lakshmi-fileInput").value = "";
    document.getElementById("lakshmi-fileName").innerText = "No file chosen";
}

function clearLakshmiAllFields() {
    document.getElementById("lakshmi-batchNumber").value = "";
    document.getElementById("lakshmi-satsangNo").value = "";
    document.getElementById("lakshmi-satsangDate").value = "";
    document.getElementById("lakshmi-satsangTime").value = "";
    document.getElementById("lakshmi-namesInput").value = "";
    document.getElementById("lakshmi-historyInput").value = "";
    document.getElementById("lakshmi-fileInput").value = "";
    document.getElementById("lakshmi-fileName").innerText = "No file chosen";
    document.getElementById("lakshmi-output").innerText = "";
    currentLakshmiAllocations = [];
    currentLakshmiNames = [];
    currentLakshmiHistoryText = "";
}

// ---------- FILE UPLOAD ----------
function handleLakshmiFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById("lakshmi-fileName").innerText = file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        // Check if it's an Excel file
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            try {
                // Parse Excel file
                const workbook = XLSX.read(content, { type: 'array' });
                const historyText = extractHistoryFromExcelLakshmi(workbook);
                document.getElementById("lakshmi-historyInput").value = historyText;
            } catch (err) {
                console.error("Error parsing Excel file:", err);
                alert("Error parsing Excel file: " + err.message);
            }
        } else {
            // Text file - use as is
            document.getElementById("lakshmi-historyInput").value = content;
        }
    };
    
    // For Excel files, read as ArrayBuffer; for text files, read as Text
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}

// Helper: Extract history from Excel workbook (all sheets)
function extractHistoryFromExcelLakshmi(workbook) {
    const lines = [];
    
    // Iterate through all sheets
    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`Processing sheet: ${sheetName}, rows: ${data.length}`);
        
        // Parse each row looking for allocation patterns
        for (const row of data) {
            if (!row || row.length < 2) continue;
            
            // Try to extract: Segment, From-To, Name
            // Expected formats: [Segment, Range, Name] or similar variations
            let segment = "";
            let rangeStr = "";
            let name = "";
            
            // Try common column orders
            if (row.length >= 3) {
                // Format: [Segment, Range, Name]
                if (typeof row[0] === 'string' && typeof row[1] === 'string' && typeof row[2] === 'string') {
                    segment = row[0].trim();
                    rangeStr = row[1].trim();
                    name = row[2].trim();
                }
                // Format: [Segment, Range, Name] with numbers
                else if (typeof row[0] === 'string' && (typeof row[1] === 'number' || typeof row[1] === 'string')) {
                    segment = row[0].trim();
                    rangeStr = String(row[1]).trim();
                    name = typeof row[2] !== 'undefined' ? String(row[2]).trim() : "";
                }
            } else if (row.length === 2) {
                // Format: ["Segment 1-5", Name]
                const firstCol = String(row[0]).trim();
                name = String(row[1]).trim();
                
                // Try to extract segment and range from first column
                const match = firstCol.match(/^(.+?)\s+(\d+)\s*[–\-]\s*(\d+)$/);
                if (match) {
                    segment = match[1];
                    rangeStr = `${match[2]}-${match[3]}`;
                } else {
                    segment = firstCol;
                }
            }
            
            // Parse range (e.g., "1-5" or "1")
            let from = 1, to = 1;
            if (rangeStr) {
                const rangeParts = rangeStr.split(/[–\-]/);
                from = parseInt(rangeParts[0]) || 1;
                to = parseInt(rangeParts[rangeParts.length - 1]) || from;
            }
            
            // Clean name
            name = cleanName(name);
            
            // Add to output if valid
            if (segment && name && !isNaN(from) && !isNaN(to)) {
                lines.push(`${segment} ${from}-${to} → ${name}`);
            }
        }
    }
    
    return lines.join('\n');
}
