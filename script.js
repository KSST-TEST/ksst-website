function checkPassword() {
    const pwd = document.getElementById("password-input").value;
    if (pwd === "Vaikuntha") {
        document.getElementById("password-screen").style.display = "none";
        document.getElementById("tool-screen").style.display = "block";
    } else {
        document.getElementById("error-msg").innerText = "Incorrect password.";
    }
}

function allocate() {
    const names = document.getElementById("names-input").value.trim().split("\n");
    let output = "";

    names.forEach((name, i) => {
        output += `${name} → Sloka ${i + 1}\n`;
    });

    document.getElementById("output-box").innerText = output;
}

function copyOutput() {
    navigator.clipboard.writeText(document.getElementById("output-box").innerText);
}

function downloadText() {
    const text = document.getElementById("output-box").innerText;
    const blob = new Blob([text], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "allocation.txt";
    link.click();
}
