// ============================================================
// LALITHA ALLOCATION ENGINE - COMPREHENSIVE WITH HISTORY AWARENESS
// ============================================================

let currentLalithaAllocations = [];
let currentLalithaNames = [];
let currentLalithaHistoryText = "";

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
function allocateLalitha(params) {
    try {
        const { rawNames, satsangNo, historyText = '', allocationType = 'full' } = params;
        
        const historyAllocations = parseHistory(historyText);
        const historyMap = buildHistoryMap(historyAllocations);
        
        const { guruji, ksst, main } = classifyParticipants(rawNames);
        
        const allocations = [];
        
        // **FAIRNESS-AWARE ROUND-ROBIN ALLOCATION WITH MULTIPLE ROUNDS**
        // Keep sequence in original order (Person 1, Person 2, ..., Person N)
        const roundRobinSequence = [...main]; // Keep in original input order
        
        if (roundRobinSequence.length === 0) {
            return allocations; // No allocations if no main participants
        }
        
        // Helper: Random selection from array
        function randomSelect(arr) {
            if (arr.length === 0) return null;
            return arr[Math.floor(Math.random() * arr.length)];
        }
        
        // Build fairness tracking map: only for core segments (Nyāsa, Dhyānam, Main Ślokam)
        // Starting Prayer and Ending Prayer are NOT counted in fairness
        const fairnessMap = {};
        for (const person of roundRobinSequence) {
            fairnessMap[person] = 0;
        }

        // 1. STARTING PRAYER - Random from main participants
        let startingPrayerPerson = null;
        if (roundRobinSequence.length > 0) {
            startingPrayerPerson = randomSelect(roundRobinSequence);
            allocations.push({
                segment: "Starting Prayer",
                from: 1,
                to: 4,
                name: startingPrayerPerson
            });
            // DO NOT add to fairnessMap - Starting Prayer doesn't count
        }
        
        // 2. KṢAMĀ PRĀRTHANĀ & ENDING PRAYER - Random from DIFFERENT person
        if (roundRobinSequence.length > 1) {
            let endingPrayerPerson = null;
            let attempts = 0;
            
            // Keep selecting until we get someone different from Starting Prayer person
            do {
                endingPrayerPerson = randomSelect(roundRobinSequence);
                attempts++;
            } while (endingPrayerPerson === startingPrayerPerson && attempts < 100);
            
            allocations.push({
                segment: "Kṣamā Prārthanā & Ending Prayer",
                from: 1,
                to: 4,
                name: endingPrayerPerson
            });
            // DO NOT add to fairnessMap - Ending Prayer doesn't count
        } else if (roundRobinSequence.length > 0) {
            // Only one person: assign to someone different if possible
            allocations.push({
                segment: "Kṣamā Prārthanā & Ending Prayer",
                from: 1,
                to: 4,
                name: roundRobinSequence[0]
            });
        }
        
        // 3. NYĀSA - Person 1 (first in round-robin)
        const nyasaPerson = roundRobinSequence[0];
        allocations.push({
            segment: "Nyāsa",
            from: 1,
            to: 1,
            name: nyasaPerson
        });
        fairnessMap[nyasaPerson] += 1;
        
        // 4. DHYĀNAM - Person 2 and 3 (second and third in round-robin)
        if (roundRobinSequence.length > 1) {
            const person = roundRobinSequence[1];
            allocations.push({
                segment: "Dhyānam",
                from: 1,
                to: 2,
                name: person
            });
            fairnessMap[person] += 2;
        }
        
        if (roundRobinSequence.length > 2) {
            const person = roundRobinSequence[2];
            allocations.push({
                segment: "Dhyānam",
                from: 3,
                to: 4,
                name: person
            });
            fairnessMap[person] += 2;
        }
        
        // 5. MAIN ŚLOKAM 1-5 - Always KSST (if KSST is in input names)
        const ksst_name = ksst.length > 0 ? ksst[0] : "KSST";
        allocations.push({
            segment: "Main Ślokam",
            from: 1,
            to: 5,
            name: ksst_name,
            round: 0  // Special round for KSST
        });
        
        // 6. MAIN ŚLOKAM 6-182 - Fairness-aware allocation with multiple rounds
        const startSloka = 6;
        const endSloka = 182;
        const totalSlokas = endSloka - startSloka + 1; // 177 slokas
        const numPeople = roundRobinSequence.length;
        
        // Calculate target slokas per person for fair distribution
        const targetPerPerson = totalSlokas / numPeople; // 177/13 ≈ 13.6
        
        // Use a fairness-based approach: track cumulative and distribute evenly
        let currentSloka = startSloka;
        let currentRound = 1;
        
        while (currentSloka <= endSloka) {
            // Find person with lowest current fairness score
            let minFairness = Infinity;
            let nextPersonIdx = 0;
            
            for (let i = 0; i < numPeople; i++) {
                const person = roundRobinSequence[i];
                const fairness = fairnessMap[person];
                
                // Prefer people with lower total allocations (more fair)
                if (fairness < minFairness) {
                    minFairness = fairness;
                    nextPersonIdx = i;
                }
            }
            
            const person = roundRobinSequence[nextPersonIdx];
            const remaining = endSloka - currentSloka + 1;
            
            // Calculate optimal chunk size
            const peopleRemaining = numPeople; // Always consider all people
            const fairnessDeficit = targetPerPerson - fairnessMap[person];
            
            // Give more to people who are below target, less to those above
            let chunkSize;
            if (fairnessDeficit > 2) {
                // Well below target: give them 6
                chunkSize = Math.min(6, remaining);
            } else if (fairnessDeficit > 0) {
                // Below target: give them 5-6
                chunkSize = Math.min(5, remaining);
            } else if (fairnessDeficit > -1) {
                // Near target: give them 5
                chunkSize = Math.min(5, remaining);
            } else {
                // Above target: give them less, but not too little
                chunkSize = Math.min(Math.max(1, Math.floor(remaining / peopleRemaining)), 4);
            }
            
            // Ensure we don't leave odd remnants (avoid 1-2 remaining at end)
            if (remaining - chunkSize === 1 && chunkSize > 1) {
                chunkSize--; // Save 1 extra for next person
            }
            if (remaining - chunkSize === 2 && chunkSize > 2) {
                chunkSize--; // Save 2 extra for next people
            }
            
            chunkSize = Math.min(chunkSize, remaining);
            
            if (chunkSize > 0) {
                const rangeEnd = Math.min(currentSloka + chunkSize - 1, endSloka);
                allocations.push({
                    segment: "Main Ślokam",
                    from: currentSloka,
                    to: rangeEnd,
                    name: person,
                    round: currentRound
                });
                
                currentSloka = rangeEnd + 1;
                fairnessMap[person] += chunkSize;
            }
            
            // Check if we've gone through all people (completed a round)
            const timesAllocated = {};
            for (const alloc of allocations) {
                if (alloc.segment === "Main Ślokam" && alloc.round === currentRound) {
                    timesAllocated[alloc.name] = (timesAllocated[alloc.name] || 0) + 1;
                }
            }
            if (Object.keys(timesAllocated).length === numPeople) {
                currentRound++;
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
            "Nyāsa",
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
            "Nyāsa": { key: "Nyāsa", display: "Nyāsa" },
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
        
        // Show Nyāsa - one person
        if (bySegment["Nyāsa"]) {
            const alloc = bySegment["Nyāsa"][0];
            let rangeStr;
            if (alloc.from === alloc.to) {
                rangeStr = "Full";
            } else {
                rangeStr = `${alloc.from}–${alloc.to}`;
            }
            const info = segmentInfo["Nyāsa"];
            const segmentPart = info.display.padEnd(16);
            const rangePart = `– ${rangeStr.padEnd(8)}`;
            lines.push(`${segmentPart} ${rangePart} -> ${alloc.name}`);
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
        
        // Show Main Ślokam - KSST first, then distributed across multiple rounds
        if (bySegment["Main Ślokam"]) {
            const mainSlokamAllocs = bySegment["Main Ślokam"];
            
            // Separate KSST from the rest
            const ksst_alloc = mainSlokamAllocs.find(a => a.name === "KSST");
            const round_allocs = mainSlokamAllocs.filter(a => a.name !== "KSST");
            
            // Show KSST first
            if (ksst_alloc) {
                let rangeStr;
                if (ksst_alloc.from === ksst_alloc.to) {
                    rangeStr = `${ksst_alloc.from}`;
                } else {
                    rangeStr = `${ksst_alloc.from}–${ksst_alloc.to}`;
                }
                const info = segmentInfo["Main Ślokam"];
                const segmentPart = info.display.padEnd(16);
                const rangePart = `– ${rangeStr.padEnd(8)}`;
                lines.push(`${segmentPart} ${rangePart} -> ${ksst_alloc.name}`);
            }
            
            lines.push("");
            
            // Find all unique rounds from the remaining allocations
            const rounds = new Set();
            for (const alloc of round_allocs) {
                if (alloc.round) {
                    rounds.add(alloc.round);
                }
            }
            
            // Show all allocations WITHOUT round headers (cleaner output)
            for (const alloc of round_allocs) {
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
        
        document.getElementById("lalitha-output").innerText = lines.join("\n");
    } catch (err) {
        console.error("Error in renderLalithaOutput:", err);
        document.getElementById("lalitha-output").innerText = "Error rendering output: " + err.message;
    }
}

// ---------- RUN ALLOCATION ----------
function runLalithaAllocateFull() {
    console.log("runLalithaAllocateFull called!");
    const rawNames = [...new Set(document.getElementById("lalitha-namesInput").value.split('\n').filter(n => n.trim()))];
    console.log("Raw names:", rawNames);
    
    const historyText = document.getElementById("lalitha-historyInput").value;
    const metadata = {
        batchNumber: document.getElementById("lalitha-batchNumber").value,
        satsangNo: document.getElementById("lalitha-satsangNo").value,
        satsangDate: document.getElementById("lalitha-satsangDate").value,
        satsangTime: document.getElementById("lalitha-satsangTime").value,
        allocationType: 'full'
    };
    
    currentLalithaNames = rawNames;
    currentLalithaHistoryText = historyText;
    
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
    const rawNames = [...new Set(document.getElementById("lalitha-namesInput").value.split('\n').filter(n => n.trim()))];
    console.log("Raw names:", rawNames);
    
    const historyText = document.getElementById("lalitha-historyInput").value;
    const metadata = {
        batchNumber: document.getElementById("lalitha-batchNumber").value,
        satsangNo: document.getElementById("lalitha-satsangNo").value,
        satsangDate: document.getElementById("lalitha-satsangDate").value,
        satsangTime: document.getElementById("lalitha-satsangTime").value,
        allocationType: 'slokam'
    };
    
    currentLalithaNames = rawNames;
    currentLalithaHistoryText = historyText;
    
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
    if (currentLalithaAllocations.length === 0) {
        alert("Please run an allocation first.");
        return;
    }
    if (currentLalithaNames.length === 0) {
        alert("No names stored for re-allocation.");
        return;
    }

    try {
        const metadata = {
            batchNumber: document.getElementById("lalitha-batchNumber").value,
            satsangNo: document.getElementById("lalitha-satsangNo").value,
            satsangDate: document.getElementById("lalitha-satsangDate").value,
            satsangTime: document.getElementById("lalitha-satsangTime").value,
            allocationType: document.getElementById("lalitha-batchNumber").dataset.allocationType || 'full'
        };

        console.log("Re-allocating with stored names...");
        currentLalithaAllocations = allocateLalitha({
            rawNames: currentLalithaNames,
            satsangNo: metadata.satsangNo,
            historyText: currentLalithaHistoryText,
            allocationType: metadata.allocationType
        });

        console.log("Re-allocations returned:", currentLalithaAllocations);
        renderLalithaOutput(currentLalithaAllocations, metadata);
    } catch (err) {
        console.error("Error in reLalithaAllocate:", err);
        alert("Error: " + err.message);
    }
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
    currentLalithaNames = [];
    currentLalithaHistoryText = "";
}

// ---------- FILE UPLOAD ----------
function handleLalithaFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById("lalitha-fileName").innerText = file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        // Check if it's an Excel file
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            try {
                // Parse Excel file
                const workbook = XLSX.read(content, { type: 'array' });
                const historyText = extractHistoryFromExcelLalitha(workbook);
                document.getElementById("lalitha-historyInput").value = historyText;
            } catch (err) {
                console.error("Error parsing Excel file:", err);
                alert("Error parsing Excel file: " + err.message);
            }
        } else {
            // Text file - use as is
            document.getElementById("lalitha-historyInput").value = content;
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
function extractHistoryFromExcelLalitha(workbook) {
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
