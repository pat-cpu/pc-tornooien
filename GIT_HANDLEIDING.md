# 🧰 Git & PowerShell Cheatsheet
### Patrick Geys

---

# 📌 Git Basis

## Status controleren
```bash
git status
```

## Wijzigingen opslaan
```bash
git add .
git commit -m "update"
git push origin main
```

---

# 🔄 Syncen vóór push

## Veilige methode
```bash
git pull --rebase origin main
git push origin main
```

## Rebase oplossen
```bash
git rebase --continue
```

## Rebase stoppen
```bash
git rebase --abort
```

---

# 🌿 Mijn Workflow (DEV → MAIN)

## Werken in DEV
```bash
git checkout dev

git add .
git commit -m "wijziging"
git push origin dev
```

## DEV naar MAIN brengen
```bash
git checkout main
git merge dev
git push origin main
```

---

# 📂 Bestanden & Mappen

## Alles tonen
```powershell
Get-ChildItem -Recurse
```

## Korte versie
```powershell
ls -Recurse
```

## Boomstructuur tonen
```powershell
tree /F
```

---

# 🐍 Python

## Flask-CORS installeren
```bash
python -m pip install flask-cors
```

---

# ⚡ Mijn Basisregel

✅ Eerst testen in `dev`  
✅ Daarna pas naar `main`  
❌ Nooit rechtstreeks rommelen in `main`

---

# 📁 Handige locatie

```text
C:\Users\patri\Documenten\
```

---

# 😎 Gouden Regel

> Git vergeet niets…  
> behalve wanneer ge vergeet te committen ☺
############################################

Tijdens werken
git push origin dev

Wanneer alles perfect werkt
git push origin main

Dan weet je:

“Dit is mijn officiële werkende versie.”

#############################################

🟢 nieuw
🟡 aangepast
🔴 verwijderd