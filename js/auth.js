/* ============================================================
   SIMPLE PASSWORD CHECK (FINAL CLEAN VERSION)
   ============================================================ */

function checkPassword() {
    const entered = document.getElementById("pass").value.trim();

    if (entered === "Vaikuntha") {
        document.getElementById("password-screen").style.display = "none";
        document.getElementById("tool-screen").style.display = "block";
    } else {
        alert("Incorrect Password");
    }
}
