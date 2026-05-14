Git Workflow voor pc-tornooien
Standaard workflow om wijzigingen veilig op GitHub en online te krijgen.

1. Eerst ophalen van GitHub
git pull --rebase origin main

Waarom:
- haalt nieuwste online versie binnen
- zet jouw wijzigingen erboven
- voorkomt bijna alle merge-conflicten
2. Controleer wat gewijzigd is
git status
3. Alles toevoegen
git add .
4. Commit maken
git commit -m "Korte beschrijving"

Voorbeeld:
git commit -m "iPhone layout verbeterd"
5. Naar GitHub sturen
git push origin main
Belangrijkste fout die je had
Je deed eerst committen vóór pull --rebase.
Daardoor had jij lokale commits terwijl GitHub ook nieuwe commits had.
Git moest dan conflicten oplossen.
Beste veilige routine
Bij starten:
git pull --rebase origin main

Bij klaar:
git add .
git commit -m "omschrijving"
git push origin main
Gouden regel
ALTIJD eerst pullen vóór committen
