/* ============================================================
   SIMPLE PASSWORD CHECK (FINAL CLEAN VERSION)
   ============================================================ */

function checkPassword() {
    const entered = document.getElementById("pass").value.trim();

    // Simple password check (can be upgraded later)
    if (entered === "Vaikuntha") {

        // Hide login screen
        document.getElementById("password-screen").style.display = "none";

        // Show tool screen
        document.getElementById("tool-screen").style.display = "block";

        // Load default stothram (VSN)
        loadVSN();

    } else {
        alert("Incorrect Password");
    }
}
