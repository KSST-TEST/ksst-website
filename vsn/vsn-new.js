// ============================================================
// VSN ALLOCATION ENGINE - COMPLETE REWRITE
// ============================================================

// ---------- 1. Name cleanup ----------
function cleanName(name) {
    // Replace dots with spaces
    name = name.replace(/\./g, " ");
    // Collapse multiple spaces and trim
    name = name.replace(/\s+/g, " ").trim();
    
    let parts = name.split(" ");
    
    // Case 1: exactly 2 parts, second is single letter -> swap (Latha B -> B Latha)
    if (parts.length === 2 && parts[1].length === 1) {
        parts = [parts[1], parts[0]];
    }
    // Case 2: exactly 3+ parts, last is single letter -> move last to front
    else if (parts.length >= 3 && parts[parts.length - 1].length === 1) {
        const lastPart = parts.pop();
        parts.unshift(lastPart);
    }
    
    return parts.join(" ");
}

// ---------- 2. Classify participants ----------
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

// ---------- 3. Main allocation function ----------
function allocateVSN(params) {
    const { rawNames, satsangNo, historyText, allocationType = 'full' } = params;
    
    const { guruji, ksst, main } = classifyParticipants(rawNames);
    const allocations = [];
    const usedThisSatsang = new Set();
    
    // Pick next person from fair distribution list
    function pickNext(list, segmentKey, avoidPerson = null) {
        // Find person with least history in this segment
        const candidates = list.filter(p => p !== avoidPerson && !usedThisSatsang.has(p));
        if (candidates.length === 0) return null;
        return candidates[0];
    }
    
    // ==================== FIXED SEGMENTS ====================
    if (allocationType === 'full') {
        // Starting Prayer - one person
        if (main.length > 0) {
            const p = pickNext(main, "Starting Prayer");
            if (p) {
                allocations.push({ segment: "Starting Prayer", from: 1, to: 4, name: p });
                usedThisSatsang.add(p);
            }
        }
        
        // Śrī Mahālakṣmī Aṣṭakam - one person (heavy)
        let heavyPerson = null;
        if (main.length > 0) {
            heavyPerson = pickNext(main, "Śrī Mahālakṣmī Aṣṭakam");
            if (heavyPerson) {
                allocations.push({ segment: "Śrī Mahālakṣmī Aṣṭakam", from: 1, to: 11, name: heavyPerson });
                usedThisSatsang.add(heavyPerson);
            }
        }
        
        // Kṣamā Prārthanā & Ending Prayer - one person
        if (main.length > 0) {
            const p = pickNext(main, "Kṣamā Prārthanā & Ending Prayer");
            if (p) {
                allocations.push({ segment: "Kṣamā Prārthanā & Ending Prayer", from: 1, to: 4, name: p });
                usedThisSatsang.add(p);
            }
        }
        
        // Nyāsa - one person
        if (main.length > 0) {
            const p = pickNext(main, "Nyāsa");
            if (p) {
                allocations.push({ segment: "Nyāsa", from: 1, to: 1, name: p });
                usedThisSatsang.add(p);
            }
        }
        
        // Dhyānam 1-3 - one person
        if (main.length > 0) {
            const p = pickNext(main, "Dhyānam");
            if (p) {
                allocations.push({ segment: "Dhyānam", from: 1, to: 3, name: p });
                usedThisSatsang.add(p);
            }
        }
        
        // Dhyānam 5-8 - another person
        if (main.length > 0) {
            const p = pickNext(main, "Dhyānam");
            if (p) {
                allocations.push({ segment: "Dhyānam", from: 5, to: 8, name: p });
                usedThisSatsang.add(p);
            }
        }
        
        // ==================== FAIR DISTRIBUTION ====================
        
        // Poorvāṅga - special handling for Satsang #1
        let poorvangaStart = 1;
        if (Number(satsangNo) === 1) {
            if (guruji.length > 0) {
                allocations.push({ segment: "Poorvāṅga", from: 1, to: 4, name: guruji[0] });
                poorvangaStart = 5;
            }
            if (ksst.length > 0) {
                allocations.push({ segment: "Poorvāṅga", from: 5, to: 8, name: ksst[0] });
                poorvangaStart = 9;
            }
        }
        
        // Distribute remaining Poorvāṅga
        let pFrom = poorvangaStart;
        while (pFrom <= 22 && main.length > 0) {
            const p = pickNext(main, "Poorvāṅga", heavyPerson);
            if (!p) break;
            
            const blockSize = Math.ceil((22 - pFrom + 1) / (main.length - Array.from(usedThisSatsang).filter(x => main.includes(x)).length + 1));
            const to = Math.min(pFrom + Math.max(blockSize, 2) - 1, 22);
            
            allocations.push({ segment: "Poorvāṅga", from: pFrom, to, name: p });
            usedThisSatsang.add(p);
            pFrom = to + 1;
        }
        
        // Reset for Main Ślokam
        usedThisSatsang.clear();
        
        // Main Ślokam - special handling for Satsang #1
        let mainStart = 1;
        if (Number(satsangNo) === 1 && guruji.length > 0) {
            allocations.push({ segment: "Main Ślokam", from: 1, to: 4, name: guruji[0] });
            mainStart = 5;
        }
        
        // Distribute Main Ślokam (min 3-4 slokas per person)
        let mFrom = mainStart;
        let mainRoundRobin = 0;
        while (mFrom <= 108 && main.length > 0) {
            const p = main[mainRoundRobin % main.length];
            mainRoundRobin++;
            
            const blockSize = Math.max(3, Math.ceil((108 - mFrom + 1) / (main.length - mainRoundRobin + 1)));
            const to = Math.min(mFrom + blockSize - 1, 108);
            
            allocations.push({ segment: "Main Ślokam", from: mFrom, to, name: p });
            mFrom = to + 1;
        }
        
        // Phalaśruti - fair distribution
        let phFrom = 1;
        let phRoundRobin = 0;
        while (phFrom <= 33 && main.length > 0) {
            const p = main[phRoundRobin % main.length];
            phRoundRobin++;
            
            const blockSize = Math.max(1, Math.ceil((33 - phFrom + 1) / (main.length - phRoundRobin + 1)));
            const to = Math.min(phFrom + blockSize - 1, 33);
            
            allocations.push({ segment: "Phalaśruti", from: phFrom, to, name: p });
            phFrom = to + 1;
        }
    } 
    else if (allocationType === 'slokam') {
        // Only Main Ślokam allocation
        
        // Starting Prayer - one person
        if (main.length > 0) {
            const p = pickNext(main, "Starting Prayer");
            if (p) {
                allocations.push({ segment: "Starting Prayer", from: 1, to: 4, name: p });
                usedThisSatsang.add(p);
            }
        }
        
        // Kṣamā Prārthanā & Ending Prayer - one person
        if (main.length > 0) {
            const p = pickNext(main, "Kṣamā Prārthanā & Ending Prayer");
            if (p) {
                allocations.push({ segment: "Kṣamā Prārthanā & Ending Prayer", from: 1, to: 4, name: p });
                usedThisSatsang.add(p);
            }
        }
        
        // Main Ślokam only
        let mainStart = 1;
        if (Number(satsangNo) === 1 && guruji.length > 0) {
            allocations.push({ segment: "Main Ślokam", from: 1, to: 4, name: guruji[0] });
            mainStart = 5;
        }
        
        let mFrom = mainStart;
        let mainRoundRobin = 0;
        while (mFrom <= 108 && main.length > 0) {
            const p = main[mainRoundRobin % main.length];
            mainRoundRobin++;
            
            const blockSize = Math.max(3, Math.ceil((108 - mFrom + 1) / (main.length - mainRoundRobin + 1)));
            const to = Math.min(mFrom + blockSize - 1, 108);
            
            allocations.push({ segment: "Main Ślokam", from: mFrom, to, name: p });
            mFrom = to + 1;
        }
    }
    
    return allocations;
}
