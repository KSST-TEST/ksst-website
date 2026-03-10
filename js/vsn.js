/* ============================================================
   VSN CONFIGURATION (FINAL CLEAN VERSION)
   Uses the Universal Allocation Engine
   ============================================================ */

const VSN_CONFIG = {
    name: "Shri Vishnu Sahasranamam",

    /* Buttons (standardized for all stotrams) */
    buttons: [
        { label: "Allocate Full", action: "allocateFullVSN" },
        { label: "Allocate Only Slokas", action: "allocate108VSN" }
    ],

    /* FULL VSN SEGMENTS */
    segments_full: [
        { seg: "Starting Prayer", sloka: "" },

        { seg: "Poorvangam",  sloka: "1-5" },
        { seg: "Poorvangam",  sloka: "6-11" },
        { seg: "Poorvangam",  sloka: "12-16" },
        { seg: "Poorvangam",  sloka: "17-22" },

        { seg: "Nyasa", sloka: "" },

        { seg: "Dhyaanam", sloka: "1-3" },
        { seg: "Dhyaanam", sloka: "4-8" },

        { seg: "Shlokam", sloka: "1-6" },
        { seg: "Shlokam", sloka: "7-13" },
        { seg: "Shlokam", sloka: "14-20" },
        { seg: "Shlokam", sloka: "21-27" },
        { seg: "Shlokam", sloka: "28-33" },
        { seg: "Shlokam", sloka: "34-40" },
        { seg: "Shlokam", sloka: "41-47" },
        { seg: "Shlokam", sloka: "48-54" },
        { seg: "Shlokam", sloka: "55-60" },
        { seg: "Shlokam", sloka: "61-67" },
        { seg: "Shlokam", sloka: "68-74" },
        { seg: "Shlokam", sloka: "75-81" },
        { seg: "Shlokam", sloka: "82-87" },
        { seg: "Shlokam", sloka: "88-94" },
        { seg: "Shlokam", sloka: "95-101" },
        { seg: "Shlokam", sloka: "102-108" },

        { seg: "Phalashruti", sloka: "1-6" },
        { seg: "Phalashruti", sloka: "7-13" },
        { seg: "Phalashruti", sloka: "14-19" },
        { seg: "Phalashruti", sloka: "20-26" },
        { seg: "Phalashruti", sloka: "27-33" },

        { seg: "KSHAMA PRARTHANA", sloka: "" },
        { seg: "Ending Prayer", sloka: "" }
    ],

    /* 108 ONLY SEGMENTS */
    segments_108: [
        { seg: "Starting Prayer", sloka: "" },

        { seg: "Shlokam", sloka: "1-6" },
        { seg: "Shlokam", sloka: "7-13" },
        { seg: "Shlokam", sloka: "14-20" },
        { seg: "Shlokam", sloka: "21-27" },
        { seg: "Shlokam", sloka: "28-33" },
        { seg: "Shlokam", sloka: "34-40" },
        { seg: "Shlokam", sloka: "41-47" },
        { seg: "Shlokam", sloka: "48-54" },
        { seg: "Shlokam", sloka: "55-60" },
        { seg: "Shlokam", sloka: "61-67" },
        { seg: "Shlokam", sloka: "68-74" },
        { seg: "Shlokam", sloka: "75-81" },
        { seg: "Shlokam", sloka: "82-87" },
        { seg: "Shlokam", sloka: "88-94" },
        { seg: "Shlokam", sloka: "95-101" },
        { seg: "Shlokam", sloka: "102-108" },

        { seg: "KSHAMA PRARTHANA", sloka: "" },
        { seg: "Ending Prayer",    sloka: "" }
    ]
};


/* ============================================================
   ENGINE HOOKS
   ============================================================ */

function loadVSN() {
    // Future: dynamic UI builder
    // For now, nothing needed here.
}

function allocateFullVSN() {
    runAllocation(VSN_CONFIG, { mode: "full" });
}

function allocate108VSN() {
    runAllocation(VSN_CONFIG, { mode: "108-only" });
}
