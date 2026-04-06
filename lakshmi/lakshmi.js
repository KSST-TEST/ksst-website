// ============================================================
// LAKSHMI ALLOCATION ENGINE - COMPREHENSIVE WITH HISTORY AWARENESS
// ============================================================

let currentLakshmiAllocations = [];
let currentLakshmiNames = [];
let currentLakshmiHistoryText = "";
let currentLakshmiMetadata = {
    batchNumber: '',
    satsangNo: '1',
    satsangDate: '',
    satsangTime: '',
    allocationType: 'full'
};

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
        
        const { guruji, ksst, main: mainParticipants } = classifyParticipants(rawNames);
        
        const allocations = [];
        if (mainParticipants.length === 0) return allocations;
        
        // Keep round-robin sequence in original order (no shuffling)
        // KSST is NOT part of round-robin
        const roundRobinSequence = [...mainParticipants];
        const numPeople = roundRobinSequence.length;
        
        // Helper: Random selection from array
        function randomSelect(arr) {
            if (arr.length === 0) return null;
            return arr[Math.floor(Math.random() * arr.length)];
        }
        
        // Randomly decide: KSST gets Nyāsa 1-6 or Main Ślokam 1-5
        const ksst_gets_nyasa = Math.random() < 0.5;
        
        // ==================== ALLOCATE FULL ====================
        if (allocationType === 'full') {
            
            // Build fairness tracking map for main participants only (KSST excluded)
            const fairnessMap = {};
            for (const person of roundRobinSequence) {
                fairnessMap[person] = 0;
            }
            
            // 1. STARTING PRAYER (4 slokas) - Random person, NOT counted in fairness
            let startingPrayerPerson = randomSelect(roundRobinSequence);
            allocations.push({
                segment: "Starting Prayer",
                from: 1,
                to: 4,
                name: startingPrayerPerson
            });
            
            // 2. ENDING PRAYER (4 slokas) - Different random person, NOT counted in fairness
            let endingPrayerPerson = null;
            let attempts = 0;
            if (numPeople > 1) {
                do {
                    endingPrayerPerson = randomSelect(roundRobinSequence);
                    attempts++;
                } while (endingPrayerPerson === startingPrayerPerson && attempts < 100);
            } else {
                endingPrayerPerson = roundRobinSequence[0];
            }
            
            allocations.push({
                segment: "Kṣamā Prārthanā & Ending Prayer",
                from: 1,
                to: 4,
                name: endingPrayerPerson
            });
            
            // 3. KSST ALLOCATION - Either Nyāsa 1-6 or Main Ślokam 1-5 (randomly chosen)
            if (ksst_gets_nyasa) {
                // KSST gets Nyāsa 1-6
                allocations.push({
                    segment: "Nyāsa",
                    from: 1,
                    to: 6,
                    name: "KSST"
                });
            } else {
                // KSST gets Main Ślokam 1-5
                allocations.push({
                    segment: "Main Ślokam",
                    from: 1,
                    to: 5,
                    name: "KSST"
                });
            }
            
            // 4-7. NYĀSA, DHYĀNAM, MAIN ŚLOKAM, PHALAŚRUTI - Fairness-aware round-robin
            // Determine what segments and ranges need to be allocated to main participants
            
            let currentPersonIdx = 0;
            
            if (ksst_gets_nyasa) {
                // KSST has Nyāsa 1-6, so main participants get 7-11
                const segmentsToAllocate = [
                    { segment: "Nyāsa", from: 7, to: 11, totalCount: 5 },
                    { segment: "Dhyānam", from: 1, to: 4, totalCount: 4 },
                    { segment: "Main Ślokam", from: 1, to: 154, totalCount: 154 },
                    { segment: "Phalaśruti", from: 1, to: 15, totalCount: 15 }
                ];
                
                for (const segConfig of segmentsToAllocate) {
                    let currentSloka = segConfig.from;
                    const endSloka = segConfig.to;
                    
                    while (currentSloka <= endSloka) {
                        const person = roundRobinSequence[currentPersonIdx % numPeople];
                        const remaining = endSloka - currentSloka + 1;
                        
                        // Fairness-based chunk sizing
                        const targetPerPerson = segConfig.totalCount / numPeople;
                        const fairnessDeficit = targetPerPerson - fairnessMap[person];
                        
                        let chunkSize;
                        if (fairnessDeficit > 3) {
                            chunkSize = Math.min(6, remaining);
                        } else if (fairnessDeficit > 0) {
                            chunkSize = Math.min(5, remaining);
                        } else if (fairnessDeficit > -2) {
                            chunkSize = Math.min(4, remaining);
                        } else {
                            chunkSize = Math.min(Math.max(1, Math.floor(remaining / numPeople)), 3);
                        }
                        
                        // Avoid odd remnants
                        if (remaining - chunkSize === 1 && chunkSize > 1) chunkSize--;
                        if (remaining - chunkSize === 2 && chunkSize > 2) chunkSize--;
                        
                        chunkSize = Math.min(chunkSize, remaining);
                        
                        if (chunkSize > 0) {
                            const rangeEnd = Math.min(currentSloka + chunkSize - 1, endSloka);
                            allocations.push({
                                segment: segConfig.segment,
                                from: currentSloka,
                                to: rangeEnd,
                                name: person
                            });
                            
                            fairnessMap[person] += chunkSize;
                            currentSloka = rangeEnd + 1;
                        }
                        
                        currentPersonIdx++;
                    }
                }
            } else {
                // KSST has Main Ślokam 1-5, so main participants get from 6-154
                const segmentsToAllocate = [
                    { segment: "Nyāsa", from: 1, to: 11, totalCount: 11 },
                    { segment: "Dhyānam", from: 1, to: 4, totalCount: 4 },
                    { segment: "Main Ślokam", from: 6, to: 154, totalCount: 149 },
                    { segment: "Phalaśruti", from: 1, to: 15, totalCount: 15 }
                ];
                
                for (const segConfig of segmentsToAllocate) {
                    let currentSloka = segConfig.from;
                    const endSloka = segConfig.to;
                    
                    while (currentSloka <= endSloka) {
                        const person = roundRobinSequence[currentPersonIdx % numPeople];
                        const remaining = endSloka - currentSloka + 1;
                        
                        // Fairness-based chunk sizing
                        const targetPerPerson = segConfig.totalCount / numPeople;
                        const fairnessDeficit = targetPerPerson - fairnessMap[person];
                        
                        let chunkSize;
                        if (fairnessDeficit > 3) {
                            chunkSize = Math.min(6, remaining);
                        } else if (fairnessDeficit > 0) {
                            chunkSize = Math.min(5, remaining);
                        } else if (fairnessDeficit > -2) {
                            chunkSize = Math.min(4, remaining);
                        } else {
                            chunkSize = Math.min(Math.max(1, Math.floor(remaining / numPeople)), 3);
                        }
                        
                        // Avoid odd remnants
                        if (remaining - chunkSize === 1 && chunkSize > 1) chunkSize--;
                        if (remaining - chunkSize === 2 && chunkSize > 2) chunkSize--;
                        
                        chunkSize = Math.min(chunkSize, remaining);
                        
                        if (chunkSize > 0) {
                            const rangeEnd = Math.min(currentSloka + chunkSize - 1, endSloka);
                            allocations.push({
                                segment: segConfig.segment,
                                from: currentSloka,
                                to: rangeEnd,
                                name: person
                            });
                            
                            fairnessMap[person] += chunkSize;
                            currentSloka = rangeEnd + 1;
                        }
                        
                        currentPersonIdx++;
                    }
                }
            }
        } 
        // ==================== ALLOCATE ONLY SLOKAM ====================
        else if (allocationType === 'slokam') {
            
            // Start Prayer
            let startingPrayerPerson = randomSelect(roundRobinSequence);
            allocations.push({
                segment: "Starting Prayer",
                from: 1,
                to: 4,
                name: startingPrayerPerson
            });
            
            // Ending Prayer (different person)
            let endingPrayerPerson = null;
            let attempts = 0;
            if (numPeople > 1) {
                do {
                    endingPrayerPerson = randomSelect(roundRobinSequence);
                    attempts++;
                } while (endingPrayerPerson === startingPrayerPerson && attempts < 100);
            } else {
                endingPrayerPerson = roundRobinSequence[0];
            }
            
            allocations.push({
                segment: "Kṣamā Prārthanā & Ending Prayer",
                from: 1,
                to: 4,
                name: endingPrayerPerson
            });
            
            // KSST ALWAYS gets Main Ślokam 1-5 in slokam mode
            allocations.push({
                segment: "Main Ślokam",
                from: 1,
                to: 5,
                name: "KSST"
            });
            
            // Main Ślokam 6-154 - Fairness-aware round-robin
            const fairnessMap = {};
            for (const person of roundRobinSequence) {
                fairnessMap[person] = 0;
            }
            
            const mainSlokamTotal = 149; // 154 - 5 (KSST allocation)
            const targetPerPerson = mainSlokamTotal / numPeople;
            
            let currentSloka = 6;
            let currentPersonIdx = 0;
            
            while (currentSloka <= 154) {
                const person = roundRobinSequence[currentPersonIdx % numPeople];
                const remaining = 154 - currentSloka + 1;
                const fairnessDeficit = targetPerPerson - fairnessMap[person];
                
                let chunkSize;
                if (fairnessDeficit > 3) {
                    chunkSize = Math.min(6, remaining);
                } else if (fairnessDeficit > 0) {
                    chunkSize = Math.min(5, remaining);
                } else if (fairnessDeficit > -2) {
                    chunkSize = Math.min(4, remaining);
                } else {
                    chunkSize = Math.min(Math.max(1, Math.floor(remaining / numPeople)), 3);
                }
                
                // Avoid odd remnants
                if (remaining - chunkSize === 1 && chunkSize > 1) chunkSize--;
                if (remaining - chunkSize === 2 && chunkSize > 2) chunkSize--;
                
                chunkSize = Math.min(chunkSize, remaining);
                
                if (chunkSize > 0) {
                    const rangeEnd = Math.min(currentSloka + chunkSize - 1, 154);
                    allocations.push({
                        segment: "Main Ślokam",
                        from: currentSloka,
                        to: rangeEnd,
                        name: person
                    });
                    
                    fairnessMap[person] += chunkSize;
                    currentSloka = rangeEnd + 1;
                }
                
                currentPersonIdx++;
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
        
        const lines = [];
        
        // Header
        lines.push("*** Om Shreem Mahalakshmiyei Namaha ***");
        lines.push("");
        lines.push("Sri Lakshmi Sahasra Nama Stotram");
        lines.push("-".repeat(90));
        
        // Metadata - aligned format
        const formattedDate = formatDateinDDMMYYYY(metadata.satsangDate);
        const formattedTime = metadata.satsangTime ? convertTo12Hour(metadata.satsangTime) + " IST" : '';
        const batchStr = (metadata.batchNumber || '').padEnd(18);
        const satsangStr = `Satsang No#: ${metadata.satsangNo || '1'}`.padEnd(18);
        const dateStr = `Date: ${formattedDate}`.padEnd(20);
        const timeStr = `Time: ${formattedTime}`;
        lines.push(`Batch Name: ${batchStr} ${satsangStr} ${dateStr} ${timeStr}`);
        lines.push("-".repeat(90));
        lines.push("");
        
        // Get allocation type from metadata
        const allocationType = metadata.allocationType || 'full';
        
        // Group allocations by segment
        const bySegment = {};
        for (const alloc of allocations) {
            if (!bySegment[alloc.segment]) {
                bySegment[alloc.segment] = [];
            }
            bySegment[alloc.segment].push(alloc);
        }
        
        // 1. STARTING PRAYER - show on single line with colon
        if (bySegment["Starting Prayer"]) {
            const alloc = bySegment["Starting Prayer"][0];
            lines.push(`Starting Prayer:   ${alloc.name}`);
        }
        
        // 2. ENDING PRAYER - show on single line
        if (bySegment["Kṣamā Prārthanā & Ending Prayer"]) {
            const alloc = bySegment["Kṣamā Prārthanā & Ending Prayer"][0];
            lines.push(`Kṣamā Prārthanā & Ending Prayer:   ${alloc.name}`);
        }
        
        lines.push("");
        
        // ALLOCATE FULL - show all segments
        if (allocationType === 'full') {
            
            // 3. NYĀSA
            if (bySegment["Nyāsa"]) {
                for (const alloc of bySegment["Nyāsa"]) {
                    let rangeStr;
                    if (alloc.from === alloc.to) {
                        rangeStr = `${alloc.from}`;
                    } else {
                        rangeStr = `${alloc.from}–${alloc.to}`;
                    }
                    lines.push(`Nyāsa – ${rangeStr} -> ${alloc.name}`);
                }
                lines.push("");
            }
            
            // 4. DHYĀNAM
            if (bySegment["Dhyānam"]) {
                for (const alloc of bySegment["Dhyānam"]) {
                    let rangeStr;
                    if (alloc.from === alloc.to) {
                        rangeStr = `${alloc.from}`;
                    } else {
                        rangeStr = `${alloc.from}–${alloc.to}`;
                    }
                    lines.push(`Dhyānam – ${rangeStr} -> ${alloc.name}`);
                }
                lines.push("");
            }
        }
        
        // 5. MAIN ŚLOKAM - separate KSST from others
        if (bySegment["Main Ślokam"]) {
            const mainSlokamAllocs = bySegment["Main Ślokam"];
            
            // Separate KSST from the rest
            const ksst_alloc = mainSlokamAllocs.find(a => a.name === "KSST");
            const round_allocs = mainSlokamAllocs.filter(a => a.name !== "KSST");
            
            // Show KSST first if present
            if (ksst_alloc) {
                let rangeStr;
                if (ksst_alloc.from === ksst_alloc.to) {
                    rangeStr = `${ksst_alloc.from}`;
                } else {
                    rangeStr = `${ksst_alloc.from}–${ksst_alloc.to}`;
                }
                lines.push(`Main Ślokam – ${rangeStr} -> ${ksst_alloc.name}`);
            }
            
            // Show all other allocations WITHOUT round headers
            for (const alloc of round_allocs) {
                let rangeStr;
                if (alloc.from === alloc.to) {
                    rangeStr = `${alloc.from}`;
                } else {
                    rangeStr = `${alloc.from}–${alloc.to}`;
                }
                lines.push(`Main Ślokam – ${rangeStr} -> ${alloc.name}`);
            }
        }
        
        lines.push("");
        
        // PHALAŚRUTI - only show in FULL allocation mode
        if (allocationType === 'full' && bySegment["Phalaśruti"]) {
            for (const alloc of bySegment["Phalaśruti"]) {
                let rangeStr;
                if (alloc.from === alloc.to) {
                    rangeStr = `${alloc.from}`;
                } else {
                    rangeStr = `${alloc.from}–${alloc.to}`;
                }
                lines.push(`Phalaśruti – ${rangeStr} -> ${alloc.name}`);
            }
        }
        
        // Display output
        const outputDiv = document.getElementById("lakshmi-output");
        if (outputDiv) {
            outputDiv.textContent = lines.join("\n");
        }
        
        console.log("Rendered output lines:", lines.length);
        
        return lines.join("\n");
    } catch (err) {
        console.error("Error in renderLakshmiOutput:", err);
        return "Error rendering output.";
    }
}

// ---------- RUN ALLOCATION ----------
function runLakshmiAllocateFull() {
    console.log("runLakshmiAllocateFull called!");
    const rawNames = [...new Set(document.getElementById("lakshmi-namesInput").value.split('\n').filter(n => n.trim()))];
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
    currentLakshmiMetadata = metadata;
    
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
    const rawNames = [...new Set(document.getElementById("lakshmi-namesInput").value.split('\n').filter(n => n.trim()))];
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
    currentLakshmiMetadata = metadata;
    
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
        const metadata = currentLakshmiMetadata;

        console.log("Re-allocating with stored names and allocationType:", metadata.allocationType);
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
    
    const metadata = currentLakshmiMetadata;
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
    const metadata = currentLakshmiMetadata;
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
