function parseOutputText(outputText) {
    const lines = outputText.split(/\r?\n/).filter(l => l.trim().length > 0);
    return lines.map(line => {
        const parts = line.split("-");
        if (parts.length < 2) {
            return { label: line.trim(), range: "", name: "" };
        }
        const label = parts[0].trim();
        const range = parts.length === 3 ? parts[1].trim() : "";
        const name = parts[parts.length - 1].trim();
        return { label, range, name };
    });
}

function detectModeFromOutput(parsed) {
    const hasSloka = parsed.some(r => r.label === "Ślokam");
    const hasPoor = parsed.some(r => r.label === "Poorvāṅga");
    const hasPhala = parsed.some(r => r.label === "Phalaśruti");
    if (hasSloka && hasPoor && hasPhala) return "FULL";
    if (hasSloka && !hasPoor && !hasPhala) return "SLOKA_ONLY";
    return "OTHER";
}

function downloadExcelFromText(outputText) {
    const rows = parseOutputText(outputText);
    const mode = detectModeFromOutput(rows);

    const header = ["Segment", "Sloka Range", "Assigned To"];
    const data = [header];

    rows.forEach(r => {
        data.push([r.label, r.range || "", r.name]);
    });

    const ws_data = data;
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, "Allocation");

    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const fileName = "KSST_Allocation_" + mode + "_" + dateStr + ".xlsx";

    XLSX.writeFile(wb, fileName);
}