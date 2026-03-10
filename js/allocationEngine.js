function loadStothramUI(config) {
    // TODO: Build UI dynamically using config
}

function runAllocation(config, options) {

    // STEP 1 — Read participant names
    let mainRaw = document.getElementById("mainNames").value
        .split("\n")
        .map(x => x.trim())
        .filter(x => x !== "");

    let mainNames = mainRaw.length > 0 ? mainRaw : ["-"];

    console.log("Engine received names:", mainNames);

    // STOP HERE — do NOT add anything else yet.
}
