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

        if (match && !segment) {
            segment = match[1].trim();
            from = parseInt(match[2]);
            to = parseInt(match[3]);
            name = match[4].trim();
        }
        
        // Push if valid (from either tab/CSV or text match)
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

// ---------- SEGMENT NORMALIZATION FOR HISTORY MATCH ----------
function normalizeSegmentKey(segmentName) {
    if (!segmentName) return "";
    return segmentName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function getSegmentHistoryCount(person, segmentName, historyMap) {
    const personHistory = historyMap[person] || {};
    const targetSegment = normalizeSegmentKey(segmentName);
    let count = 0;

    for (const [histSegment, times] of Object.entries(personHistory)) {
        if (normalizeSegmentKey(histSegment) === targetSegment) {
            count += times;
        }
    }

    return count;
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

function orderParticipantsForRoundRobin(participants, historyMap) {
    const shuffled = shuffleArray(participants);

    // Decide sequence once using history, then keep strict round-robin unchanged.
    const scored = shuffled.map((person, idx) => {
        const mainRepeats = getSegmentHistoryCount(person, "Main Ślokam", historyMap);
        const dhyanamRepeats = getSegmentHistoryCount(person, "Dhyānam", historyMap);
        const nyasaRepeats = getSegmentHistoryCount(person, "Nyāsa", historyMap);

        const score = (mainRepeats * 100) + (dhyanamRepeats * 20) + (nyasaRepeats * 10);
        return { person, score, idx };
    });

    scored.sort((a, b) => a.score - b.score || a.idx - b.idx);
    return scored.map(s => s.person);
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
        
        const { guruji, ksst, main: mainOriginal } = classifyParticipants(rawNames);
        
        // Decide sequence once, then keep round-robin continuous and unchanged.
        const main = historyAllocations.length > 0
            ? orderParticipantsForRoundRobin(mainOriginal, historyMap)
            : shuffleArray(mainOriginal);
        console.log("Classified participants:", { guruji, ksst, main });
        console.log("Round-robin participant sequence:", main);
        
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
            
            // 2. ŚRĪ MAHĀLAKṢMĪ AṢṬAKAM (11 slokas) - RANDOM person (not round-robin, HEAVY)
            const heavyPerson = getRandomPerson();
            if (heavyPerson) {
                allocations.push({
                    segment: "Śrī Mahālakṣmī Aṣṭakam",
                    from: 1,
                    to: 11,
                    name: heavyPerson
                });
            }
            
            // 3. KṢAMĀ PRĀRTHANĀ & ENDING PRAYER (4 slokas) - RANDOM person (not round-robin)
            const endingPrayerPerson = getRandomPerson();
            if (endingPrayerPerson) {
                allocations.push({
                    segment: "Kṣamā Prārthanā & Ending Prayer",
                    from: 1,
                    to: 4,
                    name: endingPrayerPerson
                });
            }
            
            // RESET globalPersonIndex for round-robin sequence starting from Poorvanga
            globalPersonIndex = 0;
            
            // 4. POORVĀṄGA (22 slokas) - with KSST priority
            // KSST ALWAYS gets Poorvanga 1-4, even if not in input list
            const ksst_for_poorvanga = ksst.length > 0 ? ksst[0] : "KSST";
            allocations.push({
                segment: "Poorvāṅga",
                from: 1,
                to: 4,
                name: ksst_for_poorvanga
            });
            
            // Distribute remaining Poorvanga slokas (5-22) to main participants
            // Call with 18 (not 22) because KSST already took 1-4
            const poorvangaAllocations = distributeSegment("Poorvāṅga", 18, main, 1, 3);
            
            // Shift all allocations to start from sloka 5 (since KSST took 1-4)
            if (poorvangaAllocations.length > 0) {
                const shiftAmount = 4;  // KSST took 1-4, so shift by 4
                for (const alloc of poorvangaAllocations) {
                    alloc.from += shiftAmount;
                    alloc.to += shiftAmount;
                }
            }
            
            allocations.push(...poorvangaAllocations);
            
            // 5. NYĀSA (1 portion) - one person from round-robin
            const nyasaPerson = getNextPerson();
            if (nyasaPerson) {
                allocations.push({
                    segment: "Nyāsa",
                    from: 1,
                    to: 1,
                    name: nyasaPerson
                });
            }
            
            // 6. DHYĀNAM (1-3 slokas and 4-8 slokas) - two people from round-robin
            const dhyanamPerson1 = getNextPerson();
            if (dhyanamPerson1) {
                allocations.push({
                    segment: "Dhyānam",
                    from: 1,
                    to: 3,
                    name: dhyanamPerson1
                });
            }
            
            const dhyanamPerson2 = getNextPerson();
            if (dhyanamPerson2) {
                allocations.push({
                    segment: "Dhyānam",
                    from: 4,
                    to: 8,
                    name: dhyanamPerson2
                });
            }
            
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
let currentNames = [];
let currentHistoryText = "";

// Global variable to store current metadata
let currentMetadata = {
    batchNumber: '',
    satsangNo: '1',
    satsangDate: '',
    satsangTime: ''
};

function runAllocateFull() {
    try {
        const rawNames = [...new Set(document.getElementById("vsn-namesInput").value
            .split(/\r?\n/)
            .map(x => x.trim())
            .filter(x => x))];

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

        // Store metadata and input for re-allocation
        currentNames = rawNames;
        currentHistoryText = historyText;
        currentMetadata = { batchNumber, satsangNo, satsangDate, satsangTime, allocationType: 'full' };

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
        const rawNames = [...new Set(document.getElementById("vsn-namesInput").value
            .split(/\r?\n/)
            .map(x => x.trim())
            .filter(x => x))];

        if (rawNames.length === 0) {
            alert("Please enter at least one devotee name.");
            return;
        }

        const batchNumber = document.getElementById("vsn-batchNumber").value.trim();
        const satsangNo = document.getElementById("vsn-satsangNo").value.trim() || "1";
        const satsangDate = document.getElementById("vsn-satsangDate").value.trim();
        const satsangTime = document.getElementById("vsn-satsangTime").value.trim();
        const historyText = document.getElementById("vsn-historyInput").value;

        // Store metadata and input for re-allocation
        currentNames = rawNames;
        currentHistoryText = historyText;
        currentMetadata = { batchNumber, satsangNo, satsangDate, satsangTime, allocationType: 'slokam' };

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
    if (currentNames.length === 0) {
        alert("No names stored for re-allocation.");
        return;
    }

    try {
        // Use the stored allocation type from previous allocation
        const allocationType = currentMetadata.allocationType || 'full';

        console.log("Re-allocating with stored names...");
        currentAllocations = allocateVSN({
            rawNames: currentNames,
            satsangNo: currentMetadata.satsangNo,
            historyText: currentHistoryText,
            allocationType: allocationType
        });

        console.log("Re-allocations returned:", currentAllocations);

        renderVSNOutput(currentAllocations, currentMetadata);
    } catch (err) {
        console.error("Error in reAllocate:", err);
        alert("Error: " + err.message);
    }
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
    currentNames = [];
    currentHistoryText = "";
}

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById("vsn-fileName").innerText = file.name;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        
        // Check if it's an Excel file
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            try {
                // Parse Excel file
                const workbook = XLSX.read(content, { type: 'array' });
                const historyText = extractHistoryFromExcel(workbook);
                // Store the history text but don't display it (to avoid confusion)
                document.getElementById("vsn-historyInput").value = historyText;
            } catch (err) {
                console.error("Error parsing Excel file:", err);
                alert("Error parsing Excel file: " + err.message);
            }
        } else {
            // Text file - store the content
            document.getElementById("vsn-historyInput").value = content;
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
function extractHistoryFromExcel(workbook) {
    const lines = [];

    function isPlaceholder(value) {
        const v = String(value || '').trim().toLowerCase();
        return !v || v === 't' || v === '-' || v === 'na' || v === 'n/a';
    }

    function isRangeToken(value) {
        const v = String(value || '').trim();
        if (!v) return false;
        if (/^full$/i.test(v)) return true;
        if (/^\d+$/.test(v)) return true;
        return /^\d+\s*[–\-]\s*\d+$/.test(v);
    }

    function parseRangeToken(value) {
        const v = String(value || '').trim();
        if (/^full$/i.test(v)) return { from: 1, to: 1 };
        if (/^\d+$/.test(v)) {
            const n = parseInt(v, 10);
            return { from: n, to: n };
        }
        const m = v.match(/^(\d+)\s*[–\-]\s*(\d+)$/);
        if (m) {
            return { from: parseInt(m[1], 10), to: parseInt(m[2], 10) };
        }
        return null;
    }

    function isLikelySegment(value) {
        const key = normalizeSegmentKey(value);
        if (!key) return false;
        return key.includes('poorvanga') ||
            key.includes('nyasa') ||
            key.includes('dhyanam') ||
            key.includes('main slokam') ||
            key.includes('phalasruti') ||
            key.includes('starting prayer') ||
            key.includes('ending prayer') ||
            key.includes('mahalkshmi astakam') ||
            key.includes('mahalakshmi astakam') ||
            key.includes('ksama prarthana');
    }
    
    // Iterate through all sheets
    for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        console.log(`Processing sheet: ${sheetName}, rows: ${data.length}`);
        
        // Parse each row looking for allocation patterns
        for (const row of data) {
            if (!row || row.length < 2) continue;

            // Try to extract: Segment, Range, Name
            let segment = "";
            let rangeStr = "";
            let name = "";

            const c0 = row.length > 0 ? String(row[0] || '').trim() : '';
            const c1 = row.length > 1 ? String(row[1] || '').trim() : '';
            const c2 = row.length > 2 ? String(row[2] || '').trim() : '';

            // Skip metadata/header rows.
            const rowText = [c0, c1, c2].join(' ').toLowerCase();
            if (rowText.includes('satsang#') || rowText.includes('date:') || rowText.includes('time:')) continue;
            if (normalizeSegmentKey(c0) === 'devotees' && normalizeSegmentKey(c1) === 'segment') continue;

            // Format A: [Segment, Range, Name]
            if (isLikelySegment(c0) && isRangeToken(c1) && !isPlaceholder(c2)) {
                segment = c0;
                rangeStr = c1;
                name = c2;
            }
            // Format B: [Name, Segment, Range]
            else if (!isPlaceholder(c0) && isLikelySegment(c1) && isRangeToken(c2)) {
                segment = c1;
                rangeStr = c2;
                name = c0;
            }
            // Format C: [Segment, '', Name] for single-block segments
            else if (isLikelySegment(c0) && isPlaceholder(c1) && !isPlaceholder(c2)) {
                segment = c0;
                rangeStr = '1-1';
                name = c2;
            }
            // Format D: ["Segment 1-5", Name]
            else if (row.length === 2 && !isPlaceholder(c1)) {
                const match = c0.match(/^(.+?)\s+(\d+)\s*[–\-]\s*(\d+)$/);
                if (match) {
                    segment = match[1].trim();
                    rangeStr = `${match[2]}-${match[3]}`;
                    name = c1;
                }
            }

            const range = parseRangeToken(rangeStr || '1-1');
            if (!range) continue;

            let from = range.from;
            let to = range.to;

            // Clean name
            name = cleanName(name);

            // Add to output if valid
            if (segment && name && !isPlaceholder(name) && !isNaN(from) && !isNaN(to)) {
                lines.push(`${segment} ${from}-${to} → ${name}`);
            }
        }
    }
    
    return lines.join('\n');
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