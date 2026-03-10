function loadStothramUI(config) {
    // TODO: build UI (title, buttons, textareas, output area) using config
}

function runAllocation(config, options) {
       let mainRaw = document.getElementById("mainNames").value
        .split("\n").map(x => x.trim()).filter(x => x !== "");

    if (shuffleMode) {
        mainRaw = shuffle(mainRaw);
    }
    const mainNames = mainRaw.length > 0 ? mainRaw : ["-"];
    
    let mainIndex = 0;
   
    let width = dynamicWidth(mainNames);

    const batch = (document.getElementById("batchNumber").value || "").trim();
    const dateElem = document.getElementById("satsangDate");
    const satsangDate = dateElem.getAttribute("data-formatted") || dateElem.value || "";
    const satsangTime = (document.getElementById("satsangTime").value || "").trim();

    const segments = [
        { seg: "Starting Prayer", sloka: "" },

        { seg: "Poorvangam",  sloka: "1-5" },
        { seg: "Poorvangam",  sloka: "6-11" },
        { seg: "Poorvangam",  sloka: "12-16" },
        { seg: "Poorvangam",  sloka: "17-22" },

        { seg: "Nyasa",       sloka: "" },

        { seg: "Dhyaanam",    sloka: "1-3" },
        { seg: "Dhyaanam",    sloka: "4-8" },

        { seg: "Shlokam",     sloka: "1-6" },
        { seg: "Shlokam",     sloka: "7-13" },
        { seg: "Shlokam",     sloka: "14-20" },
        { seg: "Shlokam",     sloka: "21-27" },
        { seg: "Shlokam",     sloka: "28-33" },
        { seg: "Shlokam",     sloka: "34-40" },
        { seg: "Shlokam",     sloka: "41-47" },
        { seg: "Shlokam",     sloka: "48-54" },
        { seg: "Shlokam",     sloka: "55-60" },
        { seg: "Shlokam",     sloka: "61-67" },
        { seg: "Shlokam",     sloka: "68-74" },
        { seg: "Shlokam",     sloka: "75-81" },
        { seg: "Shlokam",     sloka: "82-87" },
        { seg: "Shlokam",     sloka: "88-94" },
        { seg: "Shlokam",     sloka: "95-101" },
        { seg: "Shlokam",     sloka: "102-108" },

        { seg: "Phalashruti", sloka: "1-6" },
        { seg: "Phalashruti", sloka: "7-13" },
        { seg: "Phalashruti", sloka: "14-19" },
        { seg: "Phalashruti", sloka: "20-26" },
        { seg: "Phalashruti", sloka: "27-33" },

        { seg: "KSHAMA PRARTHANA", sloka: "" },
        { seg: "Ending Prayer",    sloka: "" }
    ];

    let lines = [];
    lines.push("*Om Namo Narayana*");
    lines.push("----------------------------------------------------------");
    lines.push(
        "Batch Number: " + (batch || "") +
        "   Satsang Date: " + (satsangDate || "") +
        "   Satsang Time: " + (satsangTime || "") + " IST"
    );
    lines.push("----------------------------------------------------------");
    lines.push("");

    segments.forEach((s) => {
        let main = mainNames[mainIndex % mainNames.length];
   
        if (
            s.seg === "Starting Prayer" ||
            s.seg === "Nyasa" ||
            s.seg === "KSHAMA PRARTHANA" ||
            s.seg === "Ending Prayer"
        ) {
            let label = s.seg.toUpperCase();
            lines.push(`${label} : ${main}`);
            lines.push("");
        } else {
             lines.push(formatLine(s.seg, s.sloka, main, width));
        }
        mainIndex++;

        if (
            (s.seg === "Poorvangam" && s.sloka === "17-22") ||
            (s.seg === "Dhyaanam" && s.sloka === "4-8") ||
            (s.seg === "Shlokam" && s.sloka === "102-108") ||
            (s.seg === "Phalashruti" && s.sloka === "27-33")
        ) {
            lines.push("");
        }
    });

    document.getElementById("output").value = lines.join("\n");

    document.getElementById("reallocate-buttons").innerHTML = `
        <button class="btn" onclick="allocateFullVSN(true)">REALLOCATE FULL VSN</button>
        <button class="btn" onclick="allocate108(true)">REALLOCATE 108 SLOKAS</button>
    `;
}   let mainRaw = document.getElementById("mainNames").value
        .split("\n").map(x => x.trim()).filter(x => x !== "");

    if (shuffleMode) {
        mainRaw = shuffle(mainRaw);
    }
    const mainNames = mainRaw.length > 0 ? mainRaw : ["-"];
    
    let mainIndex = 0;
   
    let width = dynamicWidth(mainNames);

    const batch = (document.getElementById("batchNumber").value || "").trim();
    const dateElem = document.getElementById("satsangDate");
    const satsangDate = dateElem.getAttribute("data-formatted") || dateElem.value || "";
    const satsangTime = (document.getElementById("satsangTime").value || "").trim();

    const segments = [
        { seg: "Starting Prayer", sloka: "" },

        { seg: "Poorvangam",  sloka: "1-5" },
        { seg: "Poorvangam",  sloka: "6-11" },
        { seg: "Poorvangam",  sloka: "12-16" },
        { seg: "Poorvangam",  sloka: "17-22" },

        { seg: "Nyasa",       sloka: "" },

        { seg: "Dhyaanam",    sloka: "1-3" },
        { seg: "Dhyaanam",    sloka: "4-8" },

        { seg: "Shlokam",     sloka: "1-6" },
        { seg: "Shlokam",     sloka: "7-13" },
        { seg: "Shlokam",     sloka: "14-20" },
        { seg: "Shlokam",     sloka: "21-27" },
        { seg: "Shlokam",     sloka: "28-33" },
        { seg: "Shlokam",     sloka: "34-40" },
        { seg: "Shlokam",     sloka: "41-47" },
        { seg: "Shlokam",     sloka: "48-54" },
        { seg: "Shlokam",     sloka: "55-60" },
        { seg: "Shlokam",     sloka: "61-67" },
        { seg: "Shlokam",     sloka: "68-74" },
        { seg: "Shlokam",     sloka: "75-81" },
        { seg: "Shlokam",     sloka: "82-87" },
        { seg: "Shlokam",     sloka: "88-94" },
        { seg: "Shlokam",     sloka: "95-101" },
        { seg: "Shlokam",     sloka: "102-108" },

        { seg: "Phalashruti", sloka: "1-6" },
        { seg: "Phalashruti", sloka: "7-13" },
        { seg: "Phalashruti", sloka: "14-19" },
        { seg: "Phalashruti", sloka: "20-26" },
        { seg: "Phalashruti", sloka: "27-33" },

        { seg: "KSHAMA PRARTHANA", sloka: "" },
        { seg: "Ending Prayer",    sloka: "" }
    ];

    let lines = [];
    lines.push("*Om Namo Narayana*");
    lines.push("----------------------------------------------------------");
    lines.push(
        "Batch Number: " + (batch || "") +
        "   Satsang Date: " + (satsangDate || "") +
        "   Satsang Time: " + (satsangTime || "") + " IST"
    );
    lines.push("----------------------------------------------------------");
    lines.push("");

    segments.forEach((s) => {
        let main = mainNames[mainIndex % mainNames.length];
   
        if (
            s.seg === "Starting Prayer" ||
            s.seg === "Nyasa" ||
            s.seg === "KSHAMA PRARTHANA" ||
            s.seg === "Ending Prayer"
        ) {
            let label = s.seg.toUpperCase();
            lines.push(`${label} : ${main}`);
            lines.push("");
        } else {
             lines.push(formatLine(s.seg, s.sloka, main, width));
        }
        mainIndex++;

        if (
            (s.seg === "Poorvangam" && s.sloka === "17-22") ||
            (s.seg === "Dhyaanam" && s.sloka === "4-8") ||
            (s.seg === "Shlokam" && s.sloka === "102-108") ||
            (s.seg === "Phalashruti" && s.sloka === "27-33")
        ) {
            lines.push("");
        }
    });

    document.getElementById("output").value = lines.join("\n");

    document.getElementById("reallocate-buttons").innerHTML = `
        <button class="btn" onclick="allocateFullVSN(true)">REALLOCATE FULL VSN</button>
        <button class="btn" onclick="allocate108(true)">REALLOCATE 108 SLOKAS</button>
    `;
}
}
