$input = "C:\Users\patri\iCloudDrive\08_PETANQUE\pc-tornooien\data\tornooien_2026.csv"
$output = "C:\Users\patri\iCloudDrive\08_PETANQUE\pc-tornooien\data\tornooien_2026_clean.csv"

Get-Content $input |
Where-Object { $_.Trim() -ne "" -and $_ -notmatch "^;+$" } |
Set-Content $output -Encoding UTF8

Write-Host "CSV opgeschoond en opgeslagen als:" $output