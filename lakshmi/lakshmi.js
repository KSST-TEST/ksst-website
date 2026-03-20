// ============================================================
// LAKSHMI ALLOCATION ENGINE - COMPREHENSIVE WITH HISTORY AWARENESS
// ============================================================

let currentLakshmiAllocations = [];

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
        let match = line.match(/^([^:→→\->\(\)]+?)\s+(\d+)\s*[–\-]\s*(\d+)\s*[→→:->]+\s*(.+)$/);
        
        if (!match) {
            match = line.match(/^(.+?)\s+(\d+)\s*[–\-]\s*(\d+)\s*:\s*(.+)$/);
        }
        
        if (!match) {
            match = line.match(/^([^0-9]+?)\s+(\d+)\s*[–\-]\s*(\d+)\s+(.+)$/);
        }

        if (match) {
            const segment = match[1].trim();
            const from = parseInt(match[2]);
            const to = parseInt(match[3]);
            const name = cleanName(match[4].trim());

            if (segment && !isNaN(from) && !isNaN(to) && name) {
                allocations.push({
                    segment,
                    from,
                    to,
                    name
                });
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

// ---------- NAME CLEANUP ----------
function cleanName(name) {
    name = name.replace(/\./g, " ");
    name = name.replace(/\s+/g, " ").trim();
    
    let parts = name.split(" ");
    
    if (parts.length === 2 && parts[1].length === 1) {
        parts = [parts[1], parts[0]];
    }
    else if (parts.length >= 3 && parts[parts.length - 1].length === 1) {
        const lastPart = parts.pop();
        parts.unshift(lastPart);
    }
    
    return parts.join(" ");
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
        
        const { guruji, ksst, main } = classifyParticipants(rawNames);
        
        const allocations = [];
        let globalPersonIndex = 0;  // Track across ALL segments - continuous round-robin
    
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
            
            // 1. STARTING PRAYER (4 slokas) - one person
            const startingPrayerPerson = main.length > 0 ? main[0] : (ksst.length > 0 ? ksst[0] : guruji[0]);
            if (startingPrayerPerson) {
                allocations.push({
                    segment: "Starting Prayer",
                    from: 1,
                    to: 4,
                    name: startingPrayerPerson
                });
            }
            
            // 2. POORVĀṄGA (10 slokas - NOT 22!) - distribute to main participants (starting from main[1], not main[0])
            // main[0] already has Starting Prayer, so Poorvanga should start from main[1] onwards
            const poorvangaParticipants = main.length > 1 ? main.slice(1) : main;
            const poorvangaAllocations = distributeSegment("Poorvāṅga", 10, poorvangaParticipants, 1, 3);
            allocations.push(...poorvangaAllocations);
            
            // 3. NYĀSA (1 portion) - one person
            const nyasaPerson = main.length > 1 ? main[1] : (main.length > 0 ? main[0] : (ksst.length > 0 ? ksst[0] : guruji[0]));
            if (nyasaPerson) {
                allocations.push({
                    segment: "Nyāsa",
                    from: 1,
                    to: 1,
                    name: nyasaPerson
                });
            }
            
            // 4. DHYĀNAM (3 slokas ONLY 1-3, NOT 5-8!) - one person
            const dhyaanamPerson = main.length > 2 ? main[2] : (main.length > 0 ? main[0] : (ksst.length > 0 ? ksst[0] : guruji[0]));
            if (dhyaanamPerson) {
                allocations.push({
                    segment: "Dhyānam",
                    from: 1,
                    to: 3,
                    name: dhyaanamPerson
                });
            }
            
            // 5. MAIN ŚLOKAM (154 slokas - NOT 108!) - distribute to main participants
            const mainSlokamAllocations = distributeSegment("Main Ślokam", 154, main, 2, 4);
            allocations.push(...mainSlokamAllocations);
            
            // 6. PHALAŚRUTI (15 slokas - NOT 33!) - distribute to main participants
            const phalaśrutiAllocations = distributeSegment("Phalaśruti", 15, main, 1, 3);
            allocations.push(...phalaśrutiAllocations);
            
            // 7. KṢAMĀ PRĀRTHANĀ & ENDING PRAYER (4 slokas) - one person
            const endingPrayerPerson = main.length > 3 ? main[3] : (main.length > 0 ? main[0] : (ksst.length > 0 ? ksst[0] : guruji[0]));
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
            "Poorvāṅga",
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
            "Poorvāṅga": { key: "Poorvāṅga", display: "Poorvāṅga" },
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
        
        // Render remaining allocations (Poorvāṅga, Nyāsa, Dhyānam, Main Ślokam, Phalaśruti)
        for (const segment of ["Poorvāṅga", "Nyāsa", "Dhyānam", "Main Ślokam", "Phalaśruti"]) {
            if (!bySegment[segment]) continue;
            
            const allocsInSegment = bySegment[segment];
            const info = segmentInfo[segment];
            
            // Single-item segments
            if (allocsInSegment.length === 1 && ["Nyāsa", "Dhyānam"].includes(segment)) {
                const alloc = allocsInSegment[0];
                let rangeStr;
                if (alloc.segment === "Nyāsa" && alloc.from === alloc.to) {
                    rangeStr = "Full";
                } else {
                    rangeStr = `${alloc.from}–${alloc.to}`;
                }
                lines.push(`${info.display.padEnd(16)} - ${rangeStr.padEnd(8)} ->  ${alloc.name}`);
            } else {
                // Multi-item segments
                for (const alloc of allocsInSegment) {
                    let rangeStr;
                    if (alloc.segment === "Nyāsa" && alloc.from === alloc.to) {
                        rangeStr = "Full";
                    } else if (alloc.from === alloc.to) {
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
        satsangTime: document.getElementById("lakshmi-satsangTime").value
    };
    
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
    const rawNames = document.getElementById("namesInput").value.split('\n').filter(n => n.trim());
    console.log("Raw names:", rawNames);
    
    const historyText = document.getElementById("lakshmi-historyInput").value;
    const metadata = {
        batchNumber: document.getElementById("lakshmi-batchNumber").value,
        satsangNo: document.getElementById("lakshmi-satsangNo").value,
        satsangDate: document.getElementById("lakshmi-satsangDate").value,
        satsangTime: document.getElementById("lakshmi-satsangTime").value
    };
    
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
    runLakshmiAllocateFull();
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
}

// ---------- FILE UPLOAD ----------
function handleLakshmiFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById("lakshmi-fileName").innerText = file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        document.getElementById("lakshmi-historyInput").value = content;
    };
    reader.readAsText(file);
}
