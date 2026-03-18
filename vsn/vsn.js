// ============================================================
// VSN ALLOCATION ENGINE (with history + name cleanup)
// ============================================================

// ---------- 1. Name cleanup (your exact rules) ----------

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
    // Case 2: exactly 3 parts, last is single letter -> move last to front (Lalitha Kumari k -> K Lalitha Kumari)
    else if (parts.length === 3 && parts[2].length === 1) {
        parts = [parts[2], parts[0], parts[1]];
    }

    return parts.join(" ");
}

// ---------- 2. Segment model ----------

const SEGMENTS = {
    STARTING_PRAYER: { key: "Starting Prayer", type: "fixed", slokas: 4 },
    MAHALAKSHMI:     { key: "Śrī Mahālakṣmī Aṣṭakam", type: "fixed", slokas: 11 },
    POORVANGA:       { key: "Poorvāṅga", type: "fair", slokas: 22 },
    NYASA:           { key: "Nyāsa", type: "fixed", slokas: 1 },
    DHYANAM_1_3:     { key: "Dhyānam 1–3", type: "fixed", slokas: 3 },
    DHYANAM_5_8:     { key: "Dhyānam 5–8", type: "fixed", slokas: 4 },
    MAIN:            { key: "Main Ślokam", type: "fair", slokas: 108 },
    PHALASHRUTI:     { key: "Phalaśruti", type: "fair", slokas: 33 },
    KSAMA_END:       { key: "Kṣamā Prārthanā & Ending Prayer", type: "fixed", slokas: 4 }
};

// ---------- 3. History parsing ----------
// Expected history format (flexible, but consistent):
// Example lines:
// Poorvāṅga 1–4: B Latha
// Main Ślokam 10–15: K Lalitha Kumari
// Phalaśruti 20–25: Dr Lalitha Kumari

function parseHistory(historyText) {
    const history = {}; // { name: { segmentKey: [ {from,to}, ... ] } }

    if (!historyText) return history;

    const lines = historyText.split(/\r?\n/).map(l => l.trim()).filter(l => l);

    for (const line of lines) {
        const parts = line.split(":");
        if (parts.length < 2) continue;

        const left = parts[0].trim();   // e.g., "Poorvāṅga 1–4"
        const right = parts[1].trim();  // e.g., "B Latha"

        const name = cleanName(right);
        const segMatch = left.match(/^(.+?)\s+(\d+)[–-](\d+)$/); // Segment + range

        if (!segMatch) continue;

        const segLabel = segMatch[1].trim();
        const from = parseInt(segMatch[2], 10);
        const to = parseInt(segMatch[3], 10);

        const segmentKey = mapSegmentLabelToKey(segLabel);
        if (!segmentKey) continue;

        if (!history[name]) history[name] = {};
        if (!history[name][segmentKey]) history[name][segmentKey] = [];
        history[name][segmentKey].push({ from, to });
    }

    return history;
}

function mapSegmentLabelToKey(label) {
    label = label.toLowerCase();

    if (label.startsWith("starting")) return SEGMENTS.STARTING_PRAYER.key;
    if (label.startsWith("śrī mahālakṣmī") || label.startsWith("sri mahalakshmi")) return SEGMENTS.MAHALAKSHMI.key;
    if (label.startsWith("poorvāṅga") || label.startsWith("poorvanga")) return SEGMENTS.POORVANGA.key;
    if (label.startsWith("nyāsa") || label.startsWith("nyasa")) return SEGMENTS.NYASA.key;
    if (label.startsWith("dhyānam 1") || label.startsWith("dhyanam 1")) return SEGMENTS.DHYANAM_1_3.key;
    if (label.startsWith("dhyānam 5") || label.startsWith("dhyanam 5")) return SEGMENTS.DHYANAM_5_8.key;
    if (label.startsWith("main")) return SEGMENTS.MAIN.key;
    if (label.startsWith("phala")) return SEGMENTS.PHALASHRUTI.key;
    if (label.startsWith("kṣamā") || label.startsWith("ksama")) return SEGMENTS.KSAMA_END.key;

    return null;
}

// ---------- 4. Classify participants ----------

function classifyParticipants(rawNames) {
    const cleaned = rawNames
        .map(n => cleanName(n))
        .filter(n => n);

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

// ---------- 5. Helper: pick next fair devotee ----------

function pickNextFairDevotee(segmentKey, mainList, history, usedThisSatsang, options = {}) {
    const { avoidHeavy, heavyPerson } = options;

    // Build score: lower score = higher priority
    const scores = mainList.map(name => {
        const h = history[name] || {};
        const segHistory = h[segmentKey] || [];
        const count = segHistory.length;

        let score = count;

        // Slight penalty if already used in this satsang
        if (usedThisSatsang.has(name)) score += 0.5;

        // If heavy person and avoidHeavy, increase score
        if (avoidHeavy && heavyPerson && name === heavyPerson) score += 2;

        return { name, score };
    });

    scores.sort((a, b) => a.score - b.score);

    for (const s of scores) {
        if (!usedThisSatsang.has(s.name)) {
            usedThisSatsang.add(s.name);
            return s.name;
        }
    }

    // Fallback (should rarely happen)
    return scores.length ? scores[0].name : null;
}

// ---------- 6. Core allocation ----------

function allocateVSN(params) {
    const {
        rawNames,       // array of strings from textarea
        satsangNo,      // number
        historyText     // string from history textarea
    } = params;

    const history = parseHistory(historyText);
    const { guruji, ksst, main } = classifyParticipants(rawNames);

    const allocations = []; // { segment, from, to, name }

    const usedThisSatsang = new Set();

    // Identify heavy person (Mahālakṣmī Aṣṭakam) later
    let mahalakshmiPerson = null;

    // ---------- Fixed segments ----------

    // Starting Prayer
    if (main.length > 0) {
        const p = pickNextFairDevotee(SEGMENTS.STARTING_PRAYER.key, main, history, usedThisSatsang);
        if (p) {
            allocations.push({
                segment: SEGMENTS.STARTING_PRAYER.key,
                from: 1,
                to: SEGMENTS.STARTING_PRAYER.slokas,
                name: p
            });
        }
    }

    // Śrī Mahālakṣmī Aṣṭakam (heavy)
    if (main.length > 0) {
        mahalakshmiPerson = pickNextFairDevotee(SEGMENTS.MAHALAKSHMI.key, main, history, usedThisSatsang);
        if (mahalakshmiPerson) {
            allocations.push({
                segment: SEGMENTS.MAHALAKSHMI.key,
                from: 1,
                to: SEGMENTS.MAHALAKSHMI.slokas,
                name: mahalakshmiPerson
            });
        }
    }

    // Nyāsa
    if (main.length > 0) {
        const p = pickNextFairDevotee(SEGMENTS.NYASA.key, main, history, usedThisSatsang, {
            avoidHeavy: true,
            heavyPerson: mahalakshmiPerson
        });
        if (p) {
            allocations.push({
                segment: SEGMENTS.NYASA.key,
                from: 1,
                to: 1,
                name: p
            });
        }
    }

    // Dhyānam 1–3
    if (main.length > 0) {
        const p = pickNextFairDevotee(SEGMENTS.DHYANAM_1_3.key, main, history, usedThisSatsang, {
            avoidHeavy: true,
            heavyPerson: mahalakshmiPerson
        });
        if (p) {
            allocations.push({
                segment: SEGMENTS.DHYANAM_1_3.key,
                from: 1,
                to: 3,
                name: p
            });
        }
    }

    // Dhyānam 5–8
    if (main.length > 0) {
        const p = pickNextFairDevotee(SEGMENTS.DHYANAM_5_8.key, main, history, usedThisSatsang, {
            avoidHeavy: true,
            heavyPerson: mahalakshmiPerson
        });
        if (p) {
            allocations.push({
                segment: SEGMENTS.DHYANAM_5_8.key,
                from: 5,
                to: 8,
                name: p
            });
        }
    }

    // Kṣamā Prārthanā & Ending Prayer
    if (main.length > 0) {
        const p = pickNextFairDevotee(SEGMENTS.KSAMA_END.key, main, history, usedThisSatsang, {
            avoidHeavy: true,
            heavyPerson: mahalakshmiPerson
        });
        if (p) {
            allocations.push({
                segment: SEGMENTS.KSAMA_END.key,
                from: 1,
                to: SEGMENTS.KSAMA_END.slokas,
                name: p
            });
        }
    }

    // ---------- Poorvāṅga (with Satsang No# = 1 special) ----------

    let poorvangaStart = 1;

    if (Number(satsangNo) === 1) {
        // Guruji 1–4
        if (guruji.length > 0) {
            allocations.push({
                segment: SEGMENTS.POORVANGA.key,
                from: 1,
                to: 4,
                name: guruji[0]
            });
            poorvangaStart = 5;
        }
        // KSST 5–8
        if (ksst.length > 0) {
            allocations.push({
                segment: SEGMENTS.POORVANGA.key,
                from: 5,
                to: 8,
                name: ksst[0]
            });
            poorvangaStart = 9;
        }
    }

    // Remaining Poorvāṅga fair distribution
    poorvangaStart = Math.max(poorvangaStart, 1);
    let pFrom = poorvangaStart;
    const pEnd = SEGMENTS.POORVANGA.slokas;

    while (pFrom <= pEnd && main.length > 0) {
        const p = pickNextFairDevotee(SEGMENTS.POORVANGA.key, main, history, usedThisSatsang, {
            avoidHeavy: true,
            heavyPerson: mahalakshmiPerson
        });
        if (!p) break;

        // Simple block size: 2–4 slokas
        const blockSize = 3;
        const to = Math.min(pFrom + blockSize - 1, pEnd);

        allocations.push({
            segment: SEGMENTS.POORVANGA.key,
            from: pFrom,
            to,
            name: p
        });

        pFrom = to + 1;
    }

    // ---------- Main Ślokam (with Satsang No# = 1 special) ----------

    let mainStart = 1;

    if (Number(satsangNo) === 1 && guruji.length > 0) {
        allocations.push({
            segment: SEGMENTS.MAIN.key,
            from: 1,
            to: 4,
            name: guruji[0]
        });
        mainStart = 5;
    }

    let mFrom = mainStart;
    const mEnd = SEGMENTS.MAIN.slokas;

    while (mFrom <= mEnd && main.length > 0) {
        const p = pickNextFairDevotee(SEGMENTS.MAIN.key, main, history, usedThisSatsang, {
            avoidHeavy: true,
            heavyPerson: mahalakshmiPerson
        });
        if (!p) break;

        const blockSize = 6; // adjustable
        const to = Math.min(mFrom + blockSize - 1, mEnd);

        allocations.push({
            segment: SEGMENTS.MAIN.key,
            from: mFrom,
            to,
            name: p
        });

        mFrom = to + 1;
    }

    // ---------- Phalaśruti (fair) ----------

    let phFrom = 1;
    const phEnd = SEGMENTS.PHALASHRUTI.slokas;

    while (phFrom <= phEnd && main.length > 0) {
        const p = pickNextFairDevotee(SEGMENTS.PHALASHRUTI.key, main, history, usedThisSatsang, {
            avoidHeavy: true,
            heavyPerson: mahalakshmiPerson
        });
        if (!p) break;

        const blockSize = 4; // adjustable
        const to = Math.min(phFrom + blockSize - 1, phEnd);

        allocations.push({
            segment: SEGMENTS.PHALASHRUTI.key,
            from: phFrom,
            to,
            name: p
        });

        phFrom = to + 1;
    }

    return allocations;
}

// ---------- 7. Hook to UI (example) ----------
// You will call this from vsn.html like:
// const names = textareaNames.value.split(/\r?\n/);
// const satsangNo = document.getElementById("satsangNo").value;
// const historyText = textareaHistory.value;
// const result = allocateVSN({ rawNames: names, satsangNo, historyText });
// Then format result into your output area.