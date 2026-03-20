# Parse Excel XML manually
$basePath = "C:\Users\rlsug\Downloads\VSN_Satsang_extracted\xl"

# Read shared strings
$ssXml = [xml](Get-Content "$basePath\sharedStrings.xml")
$sharedStrings = @()
foreach ($si in $ssXml.sst.si) {
    if ($si.t) {
        $sharedStrings += $si.t
    } else {
        $text = ""
        foreach ($r in $si.r) {
            $text += $r.t
        }
        $sharedStrings += $text
    }
}

Write-Host "Found $($sharedStrings.Count) shared strings`n"

# Parse Sheet 1
Write-Host "=" * 100
Write-Host "TAB 1: Format#1 Header Layout"
Write-Host "=" * 100

$sheet1Xml = [xml](Get-Content "$basePath\worksheets\sheet1.xml")
$rows = $sheet1Xml.worksheet.sheetData.row

Write-Host "Total rows: $($rows.Count)`n"
Write-Host "Content (first 20 rows):"
for ($i = 0; $i -lt [Math]::Min(20, $rows.Count); $i++) {
    $row = $rows[$i]
    $cells = if ($row.c -is [array]) { $row.c } else { @($row.c) }
    $values = @()
    foreach ($cell in $cells) {
        if ($cell.v) {
            $val = $cell.v
            # Check if it's a string reference
            if ($val -match '^\d+$' -and [int]$val -lt $sharedStrings.Count) {
                $values += $sharedStrings[[int]$val]
            } else {
                $values += $val
            }
        } else {
            $values += ""
        }
    }
    Write-Host ("Row $($i+1): " + ($values -join " | "))
}

# Parse Sheet 2
Write-Host "`n" + "=" * 100
Write-Host "TAB 2: Format#2 Detailed Allocation Layout"
Write-Host "=" * 100

$sheet2Xml = [xml](Get-Content "$basePath\worksheets\sheet2.xml")
$rows2 = $sheet2Xml.worksheet.sheetData.row

Write-Host "Total rows: $($rows2.Count)`n"
Write-Host "Content (all rows):"
for ($i = 0; $i -lt $rows2.Count; $i++) {
    $row = $rows2[$i]
    $cells = if ($row.c -is [array]) { $row.c } else { @($row.c) }
    $values = @()
    foreach ($cell in $cells) {
        if ($cell.v) {
            $val = $cell.v
            if ($val -match '^\d+$' -and [int]$val -lt $sharedStrings.Count) {
                $values += $sharedStrings[[int]$val]
            } else {
                $values += $val
            }
        } else {
            $values += ""
        }
    }
    Write-Host ("Row $($i+1): " + ($values -join " | "))
}
