/* ============================================================
   LALITHA SAHASRANAMAM CONFIG (PLACEHOLDER)
   Allocation logic will be added once coordinator provides details.
   ============================================================ */

const LALITHA_CONFIG = {
    name: "Shri Lalitha Sahasranamam",

    /* Standardized buttons (same as VSN) */
    buttons: [
        { label: "Allocate Full", action: "allocateFullLalitha" },
        { label: "Allocate Only Slokas", action: "allocateSlokasLalitha" }
    ],

    /* ============================================================
       SEGMENTS PLACEHOLDER
       ------------------------------------------------------------
       Once coordinator provides:
       - Segment names
       - Sloka ranges
       - Special segments
       - Grouping rules
       - Output structure
       We will fill these arrays.
       ============================================================ */

    segments_full: [
        // Example placeholder:
        // { seg: "Invocation", sloka: "" },
        // { seg: "Section 1", sloka: "1-10" },
        // { seg: "Section 2", sloka: "11-20" },
        // ...
    ],

    segments_slokas_only: [
        // Example placeholder:
        // { seg: "Slokam", sloka: "1-10" },
        // { seg: "Slokam", sloka: "11-20" },
        // ...
    ]
};


/* ============================================================
   ENGINE HOOKS (PLACEHOLDER)
   ============================================================ */

function loadLalitha() {
    // Future: dynamic UI builder
    // For now, nothing needed here.
}

function allocateFullLalitha() {
    alert("Full Lalitha Sahasranamam allocation will be added once coordinator provides segment details.");
}

function allocateSlokasLalitha() {
    alert("Lalitha Slokas-only allocation will be added once coordinator provides segment details.");
}
