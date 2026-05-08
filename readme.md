Patrick’s PowerShell 7 basislijst
Goed idee — dat is exact hoe je dit bruikbaar maakt 👍
Hier is jouw lijst netjes als **README.md** (copy/paste klaar):

---

````markdown
# 🧰 PowerShell 7 – Persoonlijke Commands (Patrick)

## 📍 Basis navigatie

### Waar ben ik?
```powershell
pwd
````

### Naar een map gaan

```powershell
cd "C:\Users\patri\Documents"
```

---

## 📂 Bestanden & mappen bekijken

### Inhoud van map

```powershell
ls
```

### Alles inclusief submappen

```powershell
Get-ChildItem -Recurse
```

---

## 🔍 Zoeken & filteren

### Laatst gewijzigde bestanden

```powershell
Get-ChildItem "C:\Users\patri\Documents" -Recurse -File |
Sort-Object LastWriteTime -Descending |
Select-Object -First 10
```

### Grootste bestanden

```powershell
Get-ChildItem "C:\Users\patri" -Recurse -File |
Sort-Object Length -Descending |
Select-Object -First 20 Name, Length, FullName
```

### Bestanden groter dan 100MB

```powershell
Get-ChildItem "C:\Users\patri" -Recurse -File |
Where-Object {$_.Length -gt 100MB} |
Sort-Object Length -Descending |
Select-Object Name, Length, FullName
```

---

## 📄 Specifieke bestanden zoeken

### Word bestanden

```powershell
Get-ChildItem -Recurse -Filter *.docx
```

### Excel bestanden

```powershell
Get-ChildItem -Recurse -Filter *.xlsx
```

---

## 🛠️ Bestanden beheren

### Map maken

```powershell
mkdir Testmap
```

### Bestand maken

```powershell
New-Item test.txt
```

### Kopiëren

```powershell
Copy-Item "test.txt" "test_kopie.txt"
```

### Hernoemen

```powershell
Rename-Item "test_kopie.txt" "nieuw.txt"
```

### Verwijderen

```powershell
Remove-Item "nieuw.txt"
```

### Map verwijderen

```powershell
Remove-Item "Testmap" -Recurse
```

---

## ▶️ Scripts uitvoeren

### Script starten

```powershell
.\backup.ps1
```

### Alternatief

```powershell
pwsh -File "C:\Users\patri\Documents\backup.ps1"
```

### Als blokkering komt

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

---

## ❓ Help & zoeken

### Help bekijken

```powershell
Get-Help Get-ChildItem -Examples
```

### Help installeren (Engels)

```powershell
Update-Help -UICulture en-US
```

### Commando zoeken

```powershell
Get-Command *file*
```

---

## 🧹 Extra

### Scherm leegmaken

```powershell
clear
```

---

## 🧠 Belangrijkste concepten

| Doel            | Commando        |
| --------------- | --------------- |
| Navigeren       | `cd`            |
| Mapinhoud       | `ls`            |
| Filteren        | `Where-Object`  |
| Sorteren        | `Sort-Object`   |
| Selecteren      | `Select-Object` |
| Scripts draaien | `.\script.ps1`  |

---

## ⭐ Dagelijkse oefening

```powershell
Get-ChildItem "C:\Users\patri\Documents" -Recurse -File |
Sort-Object LastWriteTime -Descending |
Select-Object -First 10 Name, LastWriteTime, FullName
```

👉 Toont je recentste bestanden
👉 Perfect voor controle & backups

---

## 🚀 Doel

* Sneller werken
* Minder klikken
* Meer automatiseren

```

---

## 👉 Wat nu?

1. Open Kladblok / VS Code  
2. Plak dit  
3. Opslaan als:

```

README_PowerShell.md

```

---

## 😏 Kleine tip (pro-level)
Leg dit in je:

```

C:\Users\patri\Documents\Scripts\

```

Dan heb je altijd je “cheat sheet” bij de hand.

---

Als je wil, maak ik volgende stap:

👉 een **README + script bundel**
- cleanup tool
- backup checker
- logs bekijken

Zeg gewoon:
**“maak pro versie”**  
dan bouwen we jouw eigen toolkit 🔥
```
