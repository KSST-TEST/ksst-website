// ============================================================
// VSN ALLOCATION ENGINE - COMPREHENSIVE WITH HISTORY AWARENESS
// ============================================================

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
        // Pattern 1: "Segment: from-to → Name" or "Segment: from-to -> Name"
        // Pattern 2: "Segment from-to: Name"
        // Pattern 3: "Segment (from-to): Name"
        let match = line.match(/^([^:→→\->\(\)]+?)\s+(\d+)\s*[–\-]\s*(\d+)\s*[→→:->]+\s*(.+)$/);
        
        if (!match) {
            // Try alternative format: "Segment from-to Name" (colon separated)
            match = line.match(/^(.+?)\s+(\d+)\s*[–\-]\s*(\d+)\s*:\s*(.+)$/);
        }
        
        if (!match) {
            // Try "Segment 1-5 Name" without separator
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
    // Returns: { personName: { segment: count, segment: count, ... }, ... }
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

// ---------- SCORE PERSON FOR SEGMENT (FAIRNESS) ----------
function scorePersonForSegment(person, segment, historyMap, totalSatsangs) {
    const personHistory = historyMap[person] || {};
    const timesAllocated = personHistory[segment] || 0;

    // Threshold: after 15 satsangs, allow repeats if unavoidable
    const SATSANG_THRESHOLD = 15;
    const allowRepeats = totalSatsangs >= SATSANG_THRESHOLD;

    // Score formula: lower is better (higher priority)
    // If person never did segment: score = 0 (highest priority)
    // If person did segment N times: score = N
    // If beyond threshold and person has done segment: still penalize but less strict
    let score = timesAllocated * 100;

    // If beyond threshold, reduce penalty to allow repeats
    if (allowRepeats && timesAllocated > 0) {
        score = timesAllocated * 10; // Much lower penalty, allowing repeats
    }

    return {
        person,
        score,
        timesAllocated,
        allowRepeats
    };
}

// ---------- ANALYZE FAIRNESS INSIGHTS ----------
function analyzeHistoryFairness(historyText, currentAllocations) {
    if (!historyText || !historyText.trim()) {
        return {
            hasPastAllocations: false,
            insights: []
        };
    }

    const historyAllocations = parseHistory(historyText);
    const historyMap = buildHistoryMap(historyAllocations);
    
    const insights = [];
    const warnings = [];

    // Check if anyone is being re-allocated to a segment too soon
    for (const currentAlloc of currentAllocations) {
        const personHistory = historyMap[currentAlloc.name] || {};
        const timesDone = personHistory[currentAlloc.segment] || 0;

        if (timesDone > 0) {
            warnings.push({
                person: currentAlloc.name,
                segment: currentAlloc.segment,
                timesDone,
                message: `⚠️ ${currentAlloc.name} was previously allocated to ${currentAlloc.segment} (${timesDone} time(s))`
            });
        } else {
            insights.push({
                person: currentAlloc.name,
                segment: currentAlloc.segment,
                message: `✓ ${currentAlloc.name} is new to ${currentAlloc.segment}`
            });
        }
    }

    // Summary statistics
    const totalHistoryCount = historyAllocations.length;
    const uniquePeopleInHistory = new Set(historyAllocations.map(h => h.name)).size;

    return {
        hasPastAllocations: historyAllocations.length > 0,
        insights,
        warnings,
        summary: {
            totalPastAllocations: totalHistoryCount,
            uniquePeoplePastAllocations: uniquePeopleInHistory,
            estimatedSatsangs: Math.ceil(totalHistoryCount / 8)
        }
    };
}

// ---------- NAME CLEANUP ----------
function cleanName(name) {
    // Replace dots with spaces
    name = name.replace(/\./g, " ");
    // Collapse multiple spaces
    name = name.replace(/\s+/g, " ").trim();
    
    let parts = name.split(" ");
    
    // Case 1: Exactly 2 parts, second is single letter → swap
    if (parts.length === 2 && parts[1].length === 1) {
        parts = [parts[1], parts[0]];
    }
    // Case 2: 3+ parts, last is single letter → move to front
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

// ---------- MAIN ALLOCATION FUNCTION WITH HISTORY ----------
function allocateVSN(params) {
    try {
        console.log("allocateVSN called with:", params);
        
        const { rawNames, satsangNo, historyText = '', allocationType = 'full' } = params;
        
        console.log("Processing names:", rawNames);
        
        // Parse history from text
        const historyAllocations = parseHistory(historyText);
        const historyMap = buildHistoryMap(historyAllocations);
        const totalSatsangs = Math.max(1, historyAllocations.length / 8);
        
        const { guruji, ksst, main } = classifyParticipants(rawNames);
        console.log("Classified participants:", { guruji, ksst, main });
        
        const allocations = [];
        let globalPersonIndex = 0;  // Track across ALL segments - continuous round-robin
    
        // Helper: distribute segment fairly across ALL people with flexible chunk sizes
        function distributeSegment(segmentName, totalSlokas, participantList, minChunk = 4, maxChunk = 8) {
            const segmentAllocations = [];
            
            if (!participantList || participantList.length === 0) return segmentAllocations;

            const numPeople = participantList.length;
            let slokaIndex = 1;  // Start from sloka 1
            
            while (slokaIndex <= totalSlokas) {
                const person = participantList[globalPersonIndex % numPeople];
                const remaining = totalSlokas - slokaIndex + 1;
                const peopleRemaining = numPeople - (globalPersonIndex % numPeople);
                
                // Calculate chunk size fairness
                let chunkSize;
                if (remaining <= minChunk) {
                    // Last person can take the remaining
                    chunkSize = remaining;
                } else if (remaining < peopleRemaining * minChunk) {
                    // We have fewer slokas than needed for everyone to get minChunk
                    // So give at least 1 to the next person
                    chunkSize = Math.max(1, Math.min(maxChunk, Math.ceil(remaining / peopleRemaining)));
                } else {
                    // Normal case: ensure fair distribution
                    chunkSize = Math.min(
                        maxChunk,
                        Math.max(minChunk, Math.ceil(remaining / peopleRemaining))
                    );
                }
                
                chunkSize = Math.min(chunkSize, remaining);  // Don't exceed remaining
                
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
            
            // 2. ŚRĪ MAHĀLAKṢMĪ AṢṬAKAM (11 slokas) - one person (HEAVY)
            const heavyPerson = main.length > 1 ? main[1] : (main.length > 0 ? main[0] : (ksst.length > 0 ? ksst[0] : guruji[0]));
            if (heavyPerson) {
                allocations.push({
                    segment: "Śrī Mahālakṣmī Aṣṭakam",
                    from: 1,
                    to: 11,
                    name: heavyPerson
                });
            }
            
            // 3. KṢAMĀ PRĀRTHANĀ & ENDING PRAYER (4 slokas) - one person
            const endingPrayerPerson = main.length > 2 ? main[2] : (main.length > 0 ? main[0] : (ksst.length > 0 ? ksst[0] : guruji[0]));
            if (endingPrayerPerson) {
                allocations.push({
                    segment: "Kṣamā Prārthanā & Ending Prayer",
                    from: 1,
                    to: 4,
                    name: endingPrayerPerson
                });
            }
            
            // 4. NYĀSA (1 portion) - one person
            const nyasaPerson = main.length > 3 ? main[3] : main[0];
            if (nyasaPerson) {
                allocations.push({
                    segment: "Nyāsa",
                    from: 1,
                    to: 1,
                    name: nyasaPerson
                });
            }
            
            // 5. DHYĀNAM (1-3 slokas and 5-8 slokas) - two people
            if (main.length > 0) {
                allocations.push({
                    segment: "Dhyānam",
                    from: 1,
                    to: 3,
                    name: main[0]
                });
                if (main.length > 1) {
                    allocations.push({
                        segment: "Dhyānam",
                        from: 5,
                        to: 8,
                        name: main[1]
                    });
                } else {
                    allocations.push({
                        segment: "Dhyānam",
                        from: 5,
                        to: 8,
                        name: main[0]
                    });
                }
            }
            
            // 6. POORVĀṄGA (22 slokas) - with KSST priority
            // KSST always gets Poorvanga 1-4 (or 1-6 if specified)
            let poorvangaStart = 1;
            if (ksst.length > 0) {
                // Assign KSST Poorvanga 1-4
                allocations.push({
                    segment: "Poorvāṅga",
                    from: 1,
                    to: 4,
                    name: ksst[0]
                });
                poorvangaStart = 5;  // Rest starts from sloka 5
            }
            
            // Distribute remaining Poorvanga slokas to main participants
            // (slokas 5-22 if KSST exists, else 1-22)
            const poorvangaAllocations = distributeSegment("Poorvāṅga", 22, main, 1, 3);
            
            // Adjust allocation ranges if KSST took 1-4
            if (ksst.length > 0 && poorvangaAllocations.length > 0) {
                // Shift all allocations: if they start at 1, shift to 5; scale remaining
                const shiftAmount = poorvangaStart - 1;
                for (const alloc of poorvangaAllocations) {
                    alloc.from += shiftAmount;
                    alloc.to += shiftAmount;
                }
            }
            
            allocations.push(...poorvangaAllocations);
            
            // 7. MAIN ŚLOKAM (108 slokas) - distribute to ALL main participants (3-4 per assignment)
            const mainSlokamAllocations = distributeSegment("Main Ślokam", 108, main, 3, 4);
            allocations.push(...mainSlokamAllocations);
            
            // 8. PHALAŚRUTI (33 slokas) - distribute to ALL main participants (1-4 per assignment)
            const phalaśrutiAllocations = distributeSegment("Phalaśruti", 33, main, 1, 4);
            allocations.push(...phalaśrutiAllocations);
        } 
        // ==================== ALLOCATE ONLY SLOKAM ====================
        else if (allocationType === 'slokam') {
            
            // Starting Prayer
            if (main.length > 0) {
                allocations.push({
                    segment: "Starting Prayer",
                    from: 1,
                    to: 4,
                    name: main[0]
                });
            }
            
            // Kṣamā Prārthanā & Ending Prayer
            if (main.length > 0) {
                allocations.push({
                    segment: "Kṣamā Prārthanā & Ending Prayer",
                    from: 1,
                    to: 4,
                    name: main[main.length > 1 ? 1 : 0]
                });
            }
            
            // Main Ślokam ONLY - distribute to ALL main participants (3-4 per assignment)
            const mainSlokamAllocations = distributeSegment("Main Ślokam", 108, main, 3, 4);
            allocations.push(...mainSlokamAllocations);
        }
        
        console.log("allocateVSN finishing, allocations count:", allocations.length);
        console.log("Final allocations:", allocations);
        return allocations;
    } catch (err) {
        console.error("Error in allocateVSN:", err);
        throw err;
    }
}

// ========================================================
// UI HANDLER FUNCTIONS (moved from inline script in HTML)
// ========================================================

// Global variable to store current allocations
let currentAllocations = [];

// Global variable to store current metadata
let currentMetadata = {
    batchNumber: '',
    satsangNo: '1',
    satsangDate: '',
    satsangTime: ''
};

function runAllocateFull() {
    try {
        const rawNames = document.getElementById("vsn-namesInput").value
            .split(/\r?\n/)
            .map(x => x.trim())
            .filter(x => x);

        console.log("Raw names:", rawNames);

        if (rawNames.length === 0) {
            alert("Please enter at least one devotee name.");
            return;
        }

        const batchNumber = document.getElementById("vsn-batchNumber").value.trim();
        const satsangNo = document.getElementById("vsn-satsangNo").value.trim() || "1";
        const satsangDate = document.getElementById("vsn-satsangDate").value.trim();
        const satsangTime = document.getElementById("vsn-satsangTime").value.trim();
        const historyText = document.getElementById("vsn-historyInput").value;

        // Store metadata for export functions
        currentMetadata = { batchNumber, satsangNo, satsangDate, satsangTime };

        console.log("Calling allocateVSN...");
        currentAllocations = allocateVSN({
            rawNames,
            satsangNo,
            historyText,
            allocationType: 'full'
        });

        console.log("Allocations returned:", currentAllocations);

        renderVSNOutput(currentAllocations, {
            batchNumber,
            satsangNo,
            satsangDate,
            satsangTime
        });
    } catch (err) {
        console.error("Error in runAllocateFull:", err);
        alert("Error: " + err.message);
    }
}

function runAllocateSlokam() {
    try {
        const rawNames = document.getElementById("vsn-namesInput").value
            .split(/\r?\n/)
            .map(x => x.trim())
            .filter(x => x);

        if (rawNames.length === 0) {
            alert("Please enter at least one devotee name.");
            return;
        }

        const batchNumber = document.getElementById("vsn-batchNumber").value.trim();
        const satsangNo = document.getElementById("vsn-satsangNo").value.trim() || "1";
        const satsangDate = document.getElementById("vsn-satsangDate").value.trim();
        const satsangTime = document.getElementById("vsn-satsangTime").value.trim();
        const historyText = document.getElementById("vsn-historyInput").value;

        // Store metadata for export functions
        currentMetadata = { batchNumber, satsangNo, satsangDate, satsangTime };

        console.log("Calling allocateVSN (slokam mode)...");
        currentAllocations = allocateVSN({
            rawNames,
            satsangNo,
            historyText,
            allocationType: 'slokam'
        });

        console.log("Allocations returned:", currentAllocations);

        renderVSNOutput(currentAllocations, {
            batchNumber,
            satsangNo,
            satsangDate,
            satsangTime,
            isSlokamOnly: true
        });
    } catch (err) {
        console.error("Error in runAllocateSlokam:", err);
        alert("Error: " + err.message);
    }
}

function reAllocate() {
    if (currentAllocations.length === 0) {
        alert("Please run an allocation first.");
        return;
    }
    alert("ReAllocate feature will be implemented next.");
}

function renderVSNOutput(list, metadata = {}) {
    try {
        const lines = [];
        
        // Debug: log what we received
        console.log("renderVSNOutput called with:", { list, metadata });
        
        if (!list || list.length === 0) {
            console.warn("Warning: List is empty or null");
            document.getElementById("vsn-output").innerText = "No allocations generated. Please check input names.";
            return;
        }
        
        // Header format
        lines.push("*Om Namo Narayana*");
        lines.push("-".repeat(82));
        
        // Format date and time
        const formattedDate = formatDateinDDMMYYYY(metadata.satsangDate);
        const formattedTime = metadata.satsangTime ? convertTo12Hour(metadata.satsangTime) + " IST" : '';
        
        // Batch Name line - show actual user input
        const batchStr = `${metadata.batchNumber || ''}`.padEnd(20);
        const satsangStr = `Satsang No#: ${metadata.satsangNo || '1'}`.padEnd(18);
        const dateStr = `Date: ${formattedDate}`.padEnd(20);
        const timeStr = `Time: ${formattedTime}`;
        lines.push(`Batch Name: ${batchStr} ${satsangStr} ${dateStr} ${timeStr}`);
        
        lines.push("-".repeat(82));
        lines.push("");
        
        // Group allocations by segment
        const bySegment = {};
        for (const alloc of list) {
            if (!bySegment[alloc.segment]) {
                bySegment[alloc.segment] = [];
            }
            bySegment[alloc.segment].push(alloc);
        }
        
        // Define segment order and display order
        const segmentOrder = [
            { key: "Starting Prayer", display: "Starting Prayer" },
            { key: "Śrī Mahālakṣmī Aṣṭakam", display: "Śrī Mahālakṣmī Aṣṭakam" },
            { key: "Kṣamā Prārthanā & Ending Prayer", display: "Kṣamā Prārthanā & Ending Prayer" },
            { key: "Poorvāṅga", display: "Poorvāṅga" },
            { key: "Nyāsa", display: "Nyāsa" },
            { key: "Dhyānam", display: "Dhyānam" },
            { key: "Main Ślokam", display: "Main Ślokam" },
            { key: "Phalaśruti", display: "Phalaśruti" }
        ];
        
        // Output in order
        for (const segmentInfo of segmentOrder) {
            if (bySegment[segmentInfo.key]) {
                const allocsInSegment = bySegment[segmentInfo.key];
                
                // For single-item segments (Starting Prayer, Āṣṭakam, Ending Prayer), show on one line with colon
                if (allocsInSegment.length === 1 && ["Starting Prayer", "Śrī Mahālakṣmī Aṣṭakam", "Kṣamā Prārthanā & Ending Prayer"].includes(segmentInfo.key)) {
                    const alloc = allocsInSegment[0];
                    lines.push(`${segmentInfo.display}:   ${alloc.name}`);
                    // Add blank lines after Ending Prayer for spacing
                    if (segmentInfo.key === "Kṣamā Prārthanā & Ending Prayer") {
                        lines.push("");
                        lines.push("");
                    }
                } else {
                    // For multi-item segments, show segment header then each allocation
                    for (const alloc of allocsInSegment) {
                        let rangeStr;
                        if (alloc.segment === "Nyāsa" && alloc.from === alloc.to) {
                            rangeStr = "Full";
                        } else if (alloc.from === alloc.to) {
                            rangeStr = `${alloc.from}`;
                        } else {
                            rangeStr = `${alloc.from}–${alloc.to}`;
                        }
                        
                        // Format: "Segment   - Range     ->  Name"
                        const segmentPart = segmentInfo.display.padEnd(16);
                        const rangePart = `- ${rangeStr.padEnd(8)}`;
                        lines.push(`${segmentPart} ${rangePart} ->  ${alloc.name}`);
                    }
                    lines.push("");
                }
            }
        }
        
        document.getElementById("vsn-output").innerText = lines.join("\n");
    } catch (err) {
        console.error("Error in renderVSNOutput:", err);
        document.getElementById("vsn-output").innerText = "Error rendering output: " + err.message;
    }
}

function clearNames() {
    document.getElementById("vsn-namesInput").value = "";
}

function clearHistory() {
    document.getElementById("vsn-historyInput").value = "";
    document.getElementById("vsn-fileInput").value = "";
    document.getElementById("vsn-fileName").innerText = "No file chosen";
}

function clearAllFields() {
    document.getElementById("vsn-batchNumber").value = "";
    document.getElementById("vsn-satsangNo").value = "";
    document.getElementById("vsn-satsangDate").value = "";
    document.getElementById("vsn-satsangTime").value = "";
    document.getElementById("vsn-namesInput").value = "";
    document.getElementById("vsn-historyInput").value = "";
    document.getElementById("vsn-fileInput").value = "";
    document.getElementById("vsn-fileName").innerText = "No file chosen";
    document.getElementById("vsn-output").innerText = "";
    currentAllocations = [];
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById("vsn-fileName").innerText = file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        document.getElementById("vsn-historyInput").value = content;
    };
    reader.readAsText(file);
}

function exportVSNExcel() {
    console.log("exportVSNExcel called");
    console.log("currentAllocations:", currentAllocations);
    console.log("currentMetadata:", currentMetadata);
    console.log("typeof exportToExcel:", typeof exportToExcel);
    
    if (!currentAllocations || currentAllocations.length === 0) {
        alert("Please run an allocation first.");
        return;
    }
    
    if (typeof exportToExcel !== 'function') {
        console.error("exportToExcel function not found!");
        alert("Error: Excel export function not loaded. Please refresh the page.");
        return;
    }
    
    try {
        console.log("Calling exportToExcel...");
        exportToExcel(currentAllocations, currentMetadata);
        console.log("Excel export completed");
    } catch (err) {
        console.error("Error calling exportToExcel:", err);
        alert("Error: " + err.message);
    }
}

function exportVSNPDF() {
    console.log("exportVSNPDF called");
    console.log("currentAllocations:", currentAllocations);
    console.log("currentMetadata:", currentMetadata);
    
    if (currentAllocations.length === 0) {
        alert("Please run an allocation first.");
        return;
    }
    
    try {
        exportToPDF(currentAllocations, currentMetadata);
        console.log("PDF export completed");
    } catch (err) {
        console.error("Error calling exportToPDF:", err);
        alert("Error: " + err.message);
    }
}

function copyOutput(button) {
    const outputElement = document.getElementById("vsn-output");
    const outputText = outputElement.innerText;
    
    if (!outputText || outputText.trim() === "") {
        alert("No allocation output to copy. Please run an allocation first.");
        return;
    }
    
    const originalText = button.innerText;
    
    // Copy to clipboard
    navigator.clipboard.writeText(outputText).then(() => {
        // Show success feedback
        button.innerText = "✓ Copied!";
        setTimeout(() => {
            button.innerText = originalText;
        }, 2000);
    }).catch(() => {
        // Fallback: select text manually
        try {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(outputElement);
            selection.removeAllRanges();
            selection.addRange(range);
            document.execCommand('copy');
            button.innerText = "✓ Copied!";
            setTimeout(() => {
                button.innerText = originalText;
            }, 2000);
        } catch (e) {
            alert("Failed to copy. Please try again or use manual selection.");
        }
    });
}