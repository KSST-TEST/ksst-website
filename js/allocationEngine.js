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

function applyKSSTRuleOnPoorvangaPortions(poorvangaPortions, names) {
    const result = {
        hasKSST: false,
        ksstName: null,
        forcedIndex: null
    };

    const idx = names.findIndex(n => n.toUpperCase() === "KSST");
    if (idx === -1) return result;

    result.hasKSST = true;
    result.ksstName = names[idx];

    const limit = Math.min(6, poorvangaPortions.length);
    if (limit > 0) {
        result.forcedIndex = 0; // first portion within first 6
    }

    return result;
}

function runAllocation(slokasOnly) {
    const config = window.currentStothramConfig;
    if (!config) {
        alert("Please select a stothram first.");
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
        load: 0
    }));

    function findDevoteeForSegment(segLabel) {
        let best = null;
        let bestScore = Infinity;

        devotees.forEach(d => {
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

    // 1. Fixed segments (except Dhyānam ranges handled explicitly)
    const fixed = config.fixedSegments;

    // Starting Prayer
    const startSeg = fixed.find(f => f.id === "starting_prayer");
    if (startSeg) {
        const d = findDevoteeForSegment(startSeg.label);
        if (d) {
            allocation.push({
                label: startSeg.label,
                range: "",
                name: d.name
            });
            d.load++;
        }
    }

    // Mahalakshmi Ashtakam – TBD
    const mahaSeg = fixed.find(f => f.id === "mahalakshmi_ashtakam");
    if (mahaSeg) {
        allocation.push({
            label: mahaSeg.label,
            range: "",
            name: "TBD"
        });
    }

    // Nyāsa
    const nyasaSeg = fixed.find(f => f.id === "nyasa");
    if (nyasaSeg) {
        const d = findDevoteeForSegment(nyasaSeg.label);
        if (d) {
            allocation.push({
                label: nyasaSeg.label,
                range: "",
                name: d.name
            });
            d.load++;
        }
    }

    // Dhyānam 1–3
    const dh1 = fixed.find(f => f.id === "dhyana_1_3");
    if (dh1) {
        const d = findDevoteeForSegment(dh1.label);
        if (d) {
            allocation.push({
                label: dh1.label,
                range: dh1.range || "1–3",
                name: d.name
            });
            d.load++;
        }
    }

    // Dhyānam 4–8
    const dh2 = fixed.find(f => f.id === "dhyana_4_8");
    if (dh2) {
        const d = findDevoteeForSegment(dh2.label);
        if (d) {
            allocation.push({
                label: dh2.label,
                range: dh2.range || "4–8",
                name: d.name
            });
            d.load++;
        }
    }

    // 2. Major segments: Poorvāṅga, Ślokam, Phalaśruti
    const nDev = devotees.length;

    const poorRanges = createRanges(
        config.totals.poorvangaStart,
        config.totals.poorvangaEnd,
        nDev
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

    const poorvangaPortions = poorRanges.map((r, idx) => ({
        label: "Poorvāṅga",
        range: r.start + "–" + r.end,
        index: idx
    }));

    const ksstRule = applyKSSTRuleOnPoorvangaPortions(poorvangaPortions, names);

    // Assign Poorvāṅga
    poorvangaPortions.forEach((p, idx) => {
        let chosenDevotee;
        if (ksstRule.hasKSST && ksstRule.forcedIndex === idx) {
            chosenDevotee = devotees.find(d => d.name === ksstRule.ksstName);
        } else {
            chosenDevotee = findDevoteeForSegment(p.label);
        }
        if (chosenDevotee) {
            allocation.push({
                label: p.label,
                range: p.range,
                name: chosenDevotee.name
            });
            chosenDevotee.load++;
        } else {
            allocation.push({
                label: p.label,
                range: p.range,
                name: "TBD"
            });
        }
    });

    if (!slokasOnly) {
        // Ślokam + Phalaśruti
        slokaRanges.forEach(r => {
            const segLabel = "Ślokam";
            const d = findDevoteeForSegment(segLabel);
            if (d) {
                allocation.push({
                    label: segLabel,
                    range: r.start + "–" + r.end,
                    name: d.name
                });
                d.load++;
            } else {
                allocation.push({
                    label: segLabel,
                    range: r.start + "–" + r.end,
                    name: "TBD"
                });
            }
        });

        phalaRanges.forEach(r => {
            const segLabel = "Phalaśruti";
            const d = findDevoteeForSegment(segLabel);
            if (d) {
                allocation.push({
                    label: segLabel,
                    range: r.start + "–" + r.end,
                    name: d.name
                });
                d.load++;
            } else {
                allocation.push({
                    label: segLabel,
                    range: r.start + "–" + r.end,
                    name: "TBD"
                });
            }
        });
    } else {
        // Only Ślokam
        slokaRanges.forEach(r => {
            const segLabel = "Ślokam";
            const d = findDevoteeForSegment(segLabel);
            if (d) {
                allocation.push({
                    label: segLabel,
                    range: r.start + "–" + r.end,
                    name: d.name
                });
                d.load++;
            } else {
                allocation.push({
                    label: segLabel,
                    range: r.start + "–" + r.end,
                    name: "TBD"
                });
            }
        });
    }

    // 3. Closing: Kṣamā Prārthanā & Ending Prayer
    const kshSeg = fixed.find(f => f.id === "kshama_ending");
    if (kshSeg) {
        const d = findDevoteeForSegment(kshSeg.label);
        if (d) {
            allocation.push({
                label: kshSeg.label,
                range: "",
                name: d.name
            });
            d.load++;
        } else {
            allocation.push({
                label: kshSeg.label,
                range: "",
                name: "TBD"
            });
        }
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

function formatAllocationOutput(allocation) {
    return allocation
        .map(item => {
            const rangePart = item.range ? " - " + item.range : " - ";
            return item.label + rangePart + " - " + item.name;
        })
        .join("\n");
}
