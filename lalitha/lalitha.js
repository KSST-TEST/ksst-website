// ============================================================
// LALITHA ALLOCATION ENGINE - COMPREHENSIVE WITH HISTORY AWARENESS
// ============================================================

let currentLalithaAllocations = [];

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
function allocateLalitha(params) {
    try {
        const { rawNames, satsangNo, historyText = '', allocationType = 'full' } = params;
        
        const historyAllocations = parseHistory(historyText);
        const historyMap = buildHistoryMap(historyAllocations);
        
        const { guruji, ksst, main } = classifyParticipants(rawNames);
        
        // SORT ALPHABETICALLY
        main.sort();
        
        const allocations = [];
        
        // Helper: Create ranges for fair distribution (similar to VSN)
        function createRanges(start, end, count) {
            const total = end - start + 1;
            if (count <= 0 || total <= 0) return [];

            const base = Math.floor(total / count);
            let remainder = total % count;

            const ranges = [];
            let current = start;

            for (let i = 0; i < count; i++) {
                let size = base + (remainder > 0 ? 1 : 0);
                if (remainder > 0) remainder--;

                const rStart = current;
                const rEnd = current + size - 1;
                ranges.push({ start: rStart, end: rEnd });
                current = rEnd + 1;
            }

            return ranges;
        }
        
        const numParticipants = main.length;
        
        // 1. STARTING PRAYER (4 slokas) - assign to first person (separate from main distribution)
        const startingPrayerPerson = main.length > 0 ? main[0] : (ksst.length > 0 ? ksst[0] : guruji[0]);
        if (startingPrayerPerson) {
            allocations.push({
                segment: "Starting Prayer",
                from: 1,
                to: 4,
                name: startingPrayerPerson
            });
        }
        
        // 2. KṢAMĀ PRĀRTHANĀ & ENDING PRAYER (4 slokas) - assign to second person (separate from main distribution)
        const endingPrayerPerson = main.length > 1 ? main[1] : (main.length > 0 ? main[0] : (ksst.length > 0 ? ksst[0] : guruji[0]));
        if (endingPrayerPerson) {
            allocations.push({
                segment: "Kṣamā Prārthanā & Ending Prayer",
                from: 1,
                to: 4,
                name: endingPrayerPerson
            });
        }
        
        // 3. DHYĀNAM (4 slokas) - SPLIT BETWEEN 2 PEOPLE
        if (main.length > 2) {
            allocations.push({
                segment: "Dhyānam",
                from: 1,
                to: 2,
                name: main[2]
            });
            allocations.push({
                segment: "Dhyānam",
                from: 3,
                to: 4,
                name: main[3]
            });
        } else if (main.length > 1) {
            // Fallback: if less than 4 people, split between available
            allocations.push({
                segment: "Dhyānam",
                from: 1,
                to: 2,
                name: main[2] || main[0]
            });
            allocations.push({
                segment: "Dhyānam",
                from: 3,
                to: 4,
                name: main[3] || main[1]
            });
        }
        
        // 4. MAIN ŚLOKAM (183 slokas) - DISTRIBUTE IN MULTIPLE ROUNDS
        // People 0-3 already have assignments, so distribute among people 4 onwards
        const numMainSlokamParticipants = Math.max(1, numParticipants - 4);
        
        // Determine chunk size per round based on number of participants
        // Goal: reasonable chunks (3-5 slokas per person per round)
        let chunkSizePerRound = 4;
        if (numMainSlokamParticipants <= 15) chunkSizePerRound = 5;
        if (numMainSlokamParticipants <= 10) chunkSizePerRound = 6;
        if (numMainSlokamParticipants <= 5) chunkSizePerRound = 10;
        
        // Calculate number of rounds needed to keep allocations reasonable per person
        const numRounds = Math.ceil(183 / (numMainSlokamParticipants * chunkSizePerRound));
        
        // Distribute slokas across multiple rounds
        // Each round will have roughly equal number of slokas
        for (let round = 1; round <= numRounds; round++) {
            // Calculate which slokas belong to this round
            const roundStartSloka = Math.floor((round - 1) * 183 / numRounds) + 1;
            const roundEndSloka = Math.floor(round * 183 / numRounds);
            
            // Distribute this round's slokas to all participants
            const roundSlokas = roundEndSloka - roundStartSloka + 1;
            const roundRanges = createRanges(roundStartSloka, roundEndSloka, numMainSlokamParticipants);
            
            // Assign ranges to each person in this round
            for (let idx = 0; idx < roundRanges.length && idx < numMainSlokamParticipants; idx++) {
                const personIdx = 4 + idx;
                const range = roundRanges[idx];
                
                allocations.push({
                    segment: "Main Ślokam",
                    from: range.start,
                    to: range.end,
                    name: main[personIdx],
                    round: round
                });
            }
        }
        
        return allocations;
    } catch (err) {
        console.error("Error in allocateLalitha:", err);
        return [];
    }
}

// ---------- RENDER OUTPUT ----------
function renderLalithaOutput(allocations, metadata = {}) {
    try {
        console.log("renderLalithaOutput called with allocations:", allocations);
        console.log("Output element:", document.getElementById("lalitha-output"));
        
        const lines = [];
        
        // Header
        lines.push("********Om Sri Lalitha Tripura Sundari Deviyai Namaha********");
        lines.push("");
        lines.push("Sri Lalita Sahasra Nama Stotram");
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
        
        // Segment display info
        const segmentInfo = {
            "Starting Prayer": { key: "Starting Prayer", display: "Starting Prayer" },
            "Dhyānam": { key: "Dhyānam", display: "Dhyānam" },
            "Main Ślokam": { key: "Main Ślokam", display: "Main Ślokam" },
            "Kṣamā Prārthanā & Ending Prayer": { key: "Kṣamā Prārthanā & Ending Prayer", display: "Kṣamā Prārthanā & Ending Prayer" }
        };
        
        // First, show Starting Prayer on separate line
        if (bySegment["Starting Prayer"]) {
            const alloc = bySegment["Starting Prayer"][0];
            lines.push(`Starting Prayer:   ${alloc.name}`);
        }
        
        // Show Kṣamā Prārthanā & Ending Prayer right after Starting Prayer
        if (bySegment["Kṣamā Prārthanā & Ending Prayer"]) {
            const alloc = bySegment["Kṣamā Prārthanā & Ending Prayer"][0];
            lines.push(`Kṣamā Prārthanā & Ending Prayer:   ${alloc.name}`);
        }
        
        lines.push("");
        
        // Show Dhyānam - distributed across all people
        if (bySegment["Dhyānam"]) {
            for (const alloc of bySegment["Dhyānam"]) {
                let rangeStr;
                if (alloc.from === alloc.to) {
                    rangeStr = `${alloc.from}`;
                } else {
                    rangeStr = `${alloc.from}–${alloc.to}`;
                }
                const info = segmentInfo["Dhyānam"];
                const segmentPart = info.display.padEnd(16);
                const rangePart = `– ${rangeStr.padEnd(8)}`;
                lines.push(`${segmentPart} ${rangePart} -> ${alloc.name}`);
            }
        }
        
        lines.push("");
        
        // Show Main Ślokam - distributed across multiple rounds
        if (bySegment["Main Ślokam"]) {
            const mainSlokamAllocs = bySegment["Main Ślokam"];
            
            // Find all unique rounds
            const rounds = new Set();
            for (const alloc of mainSlokamAllocs) {
                if (alloc.round) {
                    rounds.add(alloc.round);
                }
            }
            
            // If we have round info, render by rounds; otherwise render all together
            if (rounds.size > 1) {
                for (let round = 1; round <= Math.max(...rounds); round++) {
                    lines.push(`--- ROUND ${round} ---`);
                    for (const alloc of mainSlokamAllocs) {
                        if (alloc.round === round) {
                            let rangeStr;
                            if (alloc.from === alloc.to) {
                                rangeStr = `${alloc.from}`;
                            } else {
                                rangeStr = `${alloc.from}–${alloc.to}`;
                            }
                            const info = segmentInfo["Main Ślokam"];
                            const segmentPart = info.display.padEnd(16);
                            const rangePart = `– ${rangeStr.padEnd(8)}`;
                            lines.push(`${segmentPart} ${rangePart} -> ${alloc.name}`);
                        }
                    }
                    lines.push("");  // Blank line between rounds
                }
            } else {
                // No round info, just show normally
                for (const alloc of mainSlokamAllocs) {
                    let rangeStr;
                    if (alloc.from === alloc.to) {
                        rangeStr = `${alloc.from}`;
                    } else {
                        rangeStr = `${alloc.from}–${alloc.to}`;
                    }
                    const info = segmentInfo["Main Ślokam"];
                    const segmentPart = info.display.padEnd(16);
                    const rangePart = `– ${rangeStr.padEnd(8)}`;
                    lines.push(`${segmentPart} ${rangePart} -> ${alloc.name}`);
                }
            }
        }
        
        document.getElementById("lalitha-output").innerText = lines.join("\n");
    } catch (err) {
        console.error("Error in renderLalithaOutput:", err);
        document.getElementById("lalitha-output").innerText = "Error rendering output: " + err.message;
    }
}

// ---------- RUN ALLOCATION ----------
function runLalithaAllocateFull() {
    console.log("runLalithaAllocateFull called!");
    const rawNames = document.getElementById("lalitha-namesInput").value.split('\n').filter(n => n.trim());
    console.log("Raw names:", rawNames);
    
    const historyText = document.getElementById("lalitha-historyInput").value;
    const metadata = {
        batchNumber: document.getElementById("lalitha-batchNumber").value,
        satsangNo: document.getElementById("lalitha-satsangNo").value,
        satsangDate: document.getElementById("lalitha-satsangDate").value,
        satsangTime: document.getElementById("lalitha-satsangTime").value
    };
    
    console.log("Calling allocateLalitha...");
    currentLalithaAllocations = allocateLalitha({
        rawNames,
        satsangNo: metadata.satsangNo,
        historyText,
        allocationType: 'full'
    });
    
    console.log("Allocations result:", currentLalithaAllocations);
    console.log("Calling renderLalithaOutput...");
    renderLalithaOutput(currentLalithaAllocations, metadata);
}

function runLalithaAllocateSlokam() {
    console.log("runLalithaAllocateSlokam called!");
    const rawNames = document.getElementById("lalitha-namesInput").value.split('\n').filter(n => n.trim());
    console.log("Raw names:", rawNames);
    
    const historyText = document.getElementById("lalitha-historyInput").value;
    const metadata = {
        batchNumber: document.getElementById("lalitha-batchNumber").value,
        satsangNo: document.getElementById("lalitha-satsangNo").value,
        satsangDate: document.getElementById("lalitha-satsangDate").value,
        satsangTime: document.getElementById("lalitha-satsangTime").value
    };
    
    console.log("Calling allocateLalitha...");
    currentLalithaAllocations = allocateLalitha({
        rawNames,
        satsangNo: metadata.satsangNo,
        historyText,
        allocationType: 'slokam'
    });
    
    console.log("Allocations result:", currentLalithaAllocations);
    console.log("Calling renderLalithaOutput...");
    renderLalithaOutput(currentLalithaAllocations, metadata);
}

function reLalithaAllocate() {
    runLalithaAllocateFull();
}

// ---------- COPY OUTPUT ----------
function copyLalithaOutput(button) {
    const output = document.getElementById("lalitha-output").innerText;
    navigator.clipboard.writeText(output).then(() => {
        const originalText = button.innerText;
        button.innerText = "Copied!";
        setTimeout(() => button.innerText = originalText, 2000);
    });
}

// ---------- EXPORT FUNCTIONS ----------
function onLalithaExportExcel() {
    console.log("onLalithaExportExcel called");
    console.log("currentLalithaAllocations:", currentLalithaAllocations);
    
    const metadata = {
        batchNumber: document.getElementById("lalitha-batchNumber").value,
        satsangNo: document.getElementById("lalitha-satsangNo").value,
        satsangDate: document.getElementById("lalitha-satsangDate").value,
        satsangTime: document.getElementById("lalitha-satsangTime").value
    };
    console.log("metadata:", metadata);
    
    if (!currentLalithaAllocations || currentLalithaAllocations.length === 0) {
        console.error("No allocations to export");
        alert("Please run an allocation first.");
        return;
    }
    
    if (typeof exportToExcelLalitha !== 'function') {
        console.error("exportToExcelLalitha function not found!");
        alert("Error: Excel export function not loaded. Please refresh the page.");
        return;
    }
    
    try {
        console.log("Calling exportToExcelLalitha...");
        exportToExcelLalitha(currentLalithaAllocations, metadata);
        console.log("Excel export completed");
    } catch (err) {
        console.error("Error calling exportToExcelLalitha:", err);
        alert("Error: " + err.message);
    }
}

function onLalithaExportPDF() {
    const metadata = {
        batchNumber: document.getElementById("lalitha-batchNumber").value,
        satsangNo: document.getElementById("lalitha-satsangNo").value,
        satsangDate: document.getElementById("lalitha-satsangDate").value,
        satsangTime: document.getElementById("lalitha-satsangTime").value
    };
    exportToPDFLalitha(currentLalithaAllocations, metadata);
}

// ---------- CLEAR FUNCTIONS ----------
function clearLalithaNames() {
    document.getElementById("lalitha-namesInput").value = "";
}

function clearLalithaHistory() {
    document.getElementById("lalitha-historyInput").value = "";
    document.getElementById("lalitha-fileInput").value = "";
    document.getElementById("lalitha-fileName").innerText = "No file chosen";
}

function clearLalithaAllFields() {
    document.getElementById("lalitha-batchNumber").value = "";
    document.getElementById("lalitha-satsangNo").value = "";
    document.getElementById("lalitha-satsangDate").value = "";
    document.getElementById("lalitha-satsangTime").value = "";
    document.getElementById("lalitha-namesInput").value = "";
    document.getElementById("lalitha-historyInput").value = "";
    document.getElementById("lalitha-fileInput").value = "";
    document.getElementById("lalitha-fileName").innerText = "No file chosen";
    document.getElementById("lalitha-output").innerText = "";
    currentLalithaAllocations = [];
}

// ---------- FILE UPLOAD ----------
function handleLalithaFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById("lalitha-fileName").innerText = file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        document.getElementById("lalitha-historyInput").value = content;
    };
    reader.readAsText(file);
}
