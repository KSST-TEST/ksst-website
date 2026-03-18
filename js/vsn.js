/* ============================================================
   VSN CONFIGURATION (DYNAMIC SMART MODEL)
   ============================================================ */

function loadVSN() {
    const config = {
        name: "Śrī Viṣṇu Sahasranāma",

        totals: {
            poorvangaStart: 1,
            poorvangaEnd: 22,
            slokaStart: 1,
            slokaEnd: 108,
            phalashrutiStart: 1,
            phalashrutiEnd: 33
        },

        fixedSegments: [
            { id: "starting_prayer", label: "Starting Prayer", type: "fixed" },
            { id: "mahalakshmi_ashtakam", label: "Śrī Mahālakṣmī Aṣṭakam", type: "tbd" },
            { id: "nyasa", label: "Nyāsa", type: "fixed" },
            { id: "dhyana_1_3", label: "Dhyānam", type: "fixed", range: "1–3" },
            { id: "dhyana_4_8", label: "Dhyānam", type: "fixed", range: "4–8" },
            { id: "kshama_ending", label: "Kṣamā Prārthanā & Ending Prayer", type: "fixed" }
        ]
    };

    // Tell the engine which stothram is active
    setCurrentStothram(config);

    // Update the title in your UI
    const title = document.getElementById("toolTitle");
    if (title) {
        title.innerText = "Śrī Viṣṇu Sahasranāma – Allocation Tool";
    }
}
