// allocationEngine.js

window.currentStothramConfig = null;
window.lastAllocation = null;

function setCurrentStothram(config) {
    window.currentStothramConfig = config;
    const title = document.getElementById("toolTitle");
    if (title) {
        title.innerText = config.name + " – Allocation Tool";
    }
}

function getDevoteeNames() {
    const raw = document.getElementById("mainNames").value.trim();
    return raw
        .split(/\r?\n/)
        .map(x => x.trim())
        .filter(x => x.length > 0);
}

function getHistoryText() {
    return document.getElementById("historyInput").value.trim();
}

// History format: Segment - Range - Name
function buildHistoryMap(historyText) {
    const map = {};
    if (!historyText) return map;

    const lines = historyText.split(/\r?\n/);
    lines.forEach(line => {
        const parts = line.split("-");
        if (parts.length < 2) return;
        const segLabel = parts[0].trim();
        const name = parts[parts.length - 1].trim();
        if (!name) return;
        if (!map[name]) map[name] = new Set();
        map[name].add(segLabel);
    });
    return map;
}

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

// Pick a Poorvāṅga portion that overlaps 1–10 for KSST
function pickKSSTPoorvangaPortion(poorRanges) {
    for (let i = 0; i < poorRanges.length; i++) {
        const r = poorRanges[i];
        if (r.start <= 10 && r.end >= 1) {
            return i;
        }
    }
    return null;
}

function runAllocation(mode) {
    const config = window.currentStothramConfig;
    if (!config) {
        alert("Please select a stothram from the left panel.");
        return;
    }

    let names = getDevoteeNames();
    if (names.length === 0) {
        alert("Please enter devotee names.");
        return;
    }

    const historyText = getHistoryText();
    const historyMap = buildHistoryMap(historyText);

    const devotees = names.map(n => ({
        name: n,
        load: 0,
        blocked: false
    }));

    function findDevoteeForSegment(segLabel) {
        let best = null;
        let bestScore = Infinity;

        devotees.forEach(d => {
            if (d.blocked) return;

            const histSet = historyMap[d.name] || new Set();
            const hasSeen = histSet.has(segLabel) ? 1 : 0;
            const totalSeen = histSet.size;
            const score = d.load * 100 + hasSeen * 10 + totalSeen;

            if (score < bestScore) {
                bestScore = score;
                best = d;
            }
        });

        return best;
    }

    const allocation = [];
    const fixed = config.fixedSegments;
    const nDev = devotees.length;

    // Ranges

    // Poorvāṅga: enforce minimum block size = 2
    const poorTotal = config.totals.poorvangaEnd - config.totals.poorvangaStart + 1; // 22
    let poorCount = Math.floor(poorTotal / 2); // max number of 2-sloka blocks

    if (nDev < poorCount) {
        // fewer devotees → fewer, larger blocks
        poorCount = nDev;
    }

    const poorRanges = createRanges(
        config.totals.poorvangaStart,
        config.totals.poorvangaEnd,
        poorCount
    );

    const slokaRanges = createRanges(
        config.totals.slokaStart,
        config.totals.slokaEnd,
        nDev
    );
    const phalaRanges = createRanges(
        config.totals.phalashrutiStart,
        config.totals.phalashrutiEnd,
        nDev
    );

    // KSST rule (only for FULL mode): exactly once, Poorvāṅga 1–10 only
    let ksstName = null;
    let ksstPoorIndex = null;
    if (mode === "full") {
        const hasKSST = devotees.some(d => d.name.toUpperCase() === "KSST");
        if (hasKSST) {
            ksstName = devotees.find(d => d.name.toUpperCase() === "KSST").name;
            ksstPoorIndex = pickKSSTPoorvangaPortion(poorRanges);
        }
    }

    // 1. Starting Prayer
    const startSeg = fixed.find(f => f.id === "starting_prayer");
    if (startSeg) {
        const d = findDevoteeForSegment(startSeg.label);
        allocation.push({
            label: startSeg.label,
            range: "",
            name: d ? d.name : "TBD"
        });
        if (d) d.load++;
    }

    // 2. Śrī Mahālakṣmī Aṣṭakam (TBD)
    const mahaSeg = fixed.find(f => f.id === "mahalakshmi_ashtakam");
    if (mahaSeg) {
        allocation.push({
            label: mahaSeg.label,
            range: "",
            name: "TBD"
        });
    }

    if (mode === "full") {
        // 3. Poorvāṅga (with KSST rule)
        const poorvangaPortions = poorRanges.map((r, idx) => ({
            label: "Poorvāṅga",
            range: r.start + "–" + r.end,
            index: idx
        }));

        poorvangaPortions.forEach((p, idx) => {
            let chosenDevotee;

            if (ksstName && ksstPoorIndex === idx) {
                chosenDevotee = devotees.find(d => d.name === ksstName);
                if (chosenDevotee) {
                    chosenDevotee.blocked = true; // KSST used once, then blocked
                }
            } else {
                chosenDevotee = findDevoteeForSegment(p.label);
            }

            allocation.push({
                label: p.label,
                range: p.range,
                name: chosenDevotee ? chosenDevotee.name : "TBD"
            });

            if (chosenDevotee) chosenDevotee.load++;
        });

        // 4. Nyāsa
        const nyasaSeg = fixed.find(f => f.id === "nyasa");
        if (nyasaSeg) {
            const d = findDevoteeForSegment(nyasaSeg.label);
            allocation.push({
                label: nyasaSeg.label,
                range: "",
                name: d ? d.name : "TBD"
            });
            if (d) d.load++;
        }

        // 5. Dhyānam 1–3
        const dh1 = fixed.find(f => f.id === "dhyana_1_3");
        if (dh1) {
            const d = findDevoteeForSegment(dh1.label);
            allocation.push({
                label: dh1.label,
                range: dh1.range || "1–3",
                name: d ? d.name : "TBD"
            });
            if (d) d.load++;
        }

        // 6. Dhyānam 4–8
        const dh2 = fixed.find(f => f.id === "dhyana_4_8");
        if (dh2) {
            const d = findDevoteeForSegment(dh2.label);
            allocation.push({
                label: dh2.label,
                range: dh2.range || "4–8",
                name: d ? d.name : "TBD"
            });
            if (d) d.load++;
        }

        // 7. Main Ślokam portions
        slokaRanges.forEach(r => {
            const segLabel = "Main Ślokam";
            const d = findDevoteeForSegment(segLabel);
            allocation.push({
                label: segLabel,
                range: r.start + "–" + r.end,
                name: d ? d.name : "TBD"
            });
            if (d) d.load++;
        });

        // 8. Phalaśruti portions
        phalaRanges.forEach(r => {
            const segLabel = "Phalaśruti";
            const d = findDevoteeForSegment(segLabel);
            allocation.push({
                label: segLabel,
                range: r.start + "–" + r.end,
                name: d ? d.name : "TBD"
            });
            if (d) d.load++;
        });

    } else if (mode === "108") {

        // 108-ONLY MODE (NO Poorvanga, NO Nyasa, NO Dhyānam, NO Phalaśruti)
        slokaRanges.forEach(r => {
            const segLabel = "Main Ślokam";
            const d = findDevoteeForSegment(segLabel);

            allocation.push({
                label: segLabel,
                range: r.start + "–" + r.end,
                name: d ? d.name : "TBD"
            });

            if (d) d.load++;
        });
    }

    // Last: Kṣamā Prārthanā & Ending Prayer
    const kshSeg = fixed.find(f => f.id === "kshama_ending");
    if (kshSeg) {
        const d = findDevoteeForSegment(kshSeg.label);
        allocation.push({
            label: kshSeg.label,
            range: "",
            name: d ? d.name : "TBD"
        });
        if (d) d.load++;
    }

    window.lastAllocation = allocation;
    document.getElementById("output").value = formatAllocationOutput(allocation);
}

function reallocateFromLast(lastAllocation) {
    const fixedLabels = [
        "Starting Prayer",
        "Śrī Mahālakṣmī Aṣṭakam",
        "Nyāsa",
        "Dhyānam",
        "Kṣamā Prārthanā & Ending Prayer"
    ];

    const fixed = [];
    const flexible = [];

    lastAllocation.forEach(item => {
        if (fixedLabels.includes(item.label)) {
            fixed.push(item);
        } else {
            flexible.push(item);
        }
    });

    const names = flexible.map(x => x.name);
    for (let i = names.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [names[i], names[j]] = [names[j], names[i]];
    }

    const newFlexible = flexible.map((item, idx) => ({
        label: item.label,
        range: item.range,
        name: names[idx]
    }));

    const combined = [];
    lastAllocation.forEach(item => {
        const idx = flexible.findIndex(
            f => f.label === item.label && f.range === item.range
        );
        if (idx === -1) {
            combined.push(item);
        } else {
            combined.push(newFlexible[idx]);
        }
    });

    return combined;
}

// FINAL OUTPUT FORMAT with header + gaps after Poorvāṅga, Dhyānam, Main Ślokam, Phalaśruti
function formatAllocationOutput(allocation) {
    const lines = [];

    // HEADER SECTION
    const batch = (document.getElementById("batchNumber")?.value || "").trim() || "—";
    const date = (document.getElementById("satsangDate")?.value || "").trim() || "—";
    const time = (document.getElementById("satsangTime")?.value || "").trim() || "—";

    lines.push("*Om Namo Narayana*");
    lines.push("-----------------------------------------------------------------------");
    lines.push(`Batch Name: ${batch}   Satsang Date: ${date}   Satsang Time: ${time} IST`);
    lines.push("-----------------------------------------------------------------------");
    lines.push("");

    const singleColonLabels = [
        "Starting Prayer",
        "Śrī Mahālakṣmī Aṣṭakam",
        "Nyāsa",
        "Kṣamā Prārthanā & Ending Prayer"
    ];

    // Group by label type
    const poorvanga = allocation.filter(a => a.label === "Poorvāṅga");
    const dhyanam = allocation.filter(a => a.label === "Dhyānam");
    const mainSlokam = allocation.filter(a => a.label === "Main Ślokam");
    const phala = allocation.filter(a => a.label === "Phalaśruti");
    const others = allocation.filter(a =>
        !["Poorvāṅga", "Dhyānam", "Main Ślokam", "Phalaśruti"].includes(a.label)
    );

    function pushItem(item) {
        if (singleColonLabels.includes(item.label)) {
            lines.push(`${item.label}:   ${item.name}`);
            lines.push("");
        } else {
            const rangePart = item.range ? ` - ${item.range}` : "";
            lines.push(`${item.label}${rangePart} -> ${item.name}`);
        }
    }

    // 1. Starting Prayer, Mahalakshmi
    others
        .filter(o =>
            ["Starting Prayer", "Śrī Mahālakṣmī Aṣṭakam"].includes(o.label)
        )
        .forEach(pushItem);

    // 2. Poorvāṅga block
    poorvanga.forEach(pushItem);
    if (poorvanga.length) lines.push("");

    // 3. Nyāsa
    others.filter(o => o.label === "Nyāsa").forEach(pushItem);

    // 4. Dhyānam block
    dhyanam.forEach(pushItem);
    if (dhyanam.length) lines.push("");

    // 5. Main Ślokam block
    mainSlokam.forEach(pushItem);
    if (mainSlokam.length) lines.push("");

    // 6. Phalaśruti block
    phala.forEach(pushItem);
    if (phala.length) lines.push("");

    // 7. Kṣamā Prārthanā & Ending Prayer
    others
        .filter(o => o.label === "Kṣamā Prārthanā & Ending Prayer")
        .forEach(pushItem);

    return lines.join("\n");
}