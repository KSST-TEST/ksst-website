/* PASSWORD CHECK */
function checkPassword() {
    if (document.getElementById("pass").value === "Vaikuntha") {
        document.getElementById("password-screen").style.display = "none";
        document.getElementById("tool-screen").style.display = "block";
        loadVSN();
    } else {
        alert("Incorrect Password");
    }
}
