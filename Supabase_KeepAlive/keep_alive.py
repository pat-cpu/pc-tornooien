from datetime import datetime
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


# ------------------------------------------------------------
# INSTELLINGEN
# ------------------------------------------------------------

SUPABASE_URL = "https://eapmskvllusllhyxovuw.supabase.co"

# Vul hier je Publishable key of anon public key in.
SUPABASE_KEY = "sb_publishable_1j3j4uqowVdVcPE7LoMbmg_r3KMrxnY"

# Vul hier een bestaande tabelnaam in.
# Bijvoorbeeld: spelers, tornooien, wedstrijden of clubs
TABELNAAM = "tournaments"


# ------------------------------------------------------------
# LOCATIE LOGBESTAND
# ------------------------------------------------------------

SCRIPT_MAP = Path(__file__).resolve().parent
LOG_BESTAND = SCRIPT_MAP / "keep_alive.log"


def schrijf_log(tekst: str) -> None:
    """Schrijf een regel met datum en uur naar het logbestand."""
    tijdstip = datetime.now().strftime("%d/%m/%Y %H:%M:%S")

    with LOG_BESTAND.open("a", encoding="utf-8") as bestand:
        bestand.write(f"{tijdstip} - {tekst}\n")


def houd_supabase_actief() -> bool:
    """Voer een kleine leesopdracht uit op Supabase."""

    if "VUL_HIER" in SUPABASE_KEY:
        schrijf_log("FOUT: de Supabase-sleutel werd nog niet ingevuld.")
        return False

    if "VUL_HIER" in TABELNAAM:
        schrijf_log("FOUT: de tabelnaam werd nog niet ingevuld.")
        return False

    url = f"{SUPABASE_URL}/rest/v1/{TABELNAAM}?select=*&limit=1"

    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Accept": "application/json",
        "User-Agent": "PC-Tornooien-KeepAlive/1.0",
    }

    request = Request(url, headers=headers, method="GET")

    try:
        with urlopen(request, timeout=30) as antwoord:
            statuscode = antwoord.getcode()

        if statuscode == 200:
            schrijf_log("OK: Supabase-project succesvol bereikt.")
            return True

        schrijf_log(f"FOUT: onverwachte statuscode {statuscode}.")
        return False

    except HTTPError as fout:
        inhoud = fout.read().decode("utf-8", errors="replace")
        schrijf_log(
            f"HTTP-FOUT {fout.code}: {inhoud[:300]}"
        )
        return False

    except URLError as fout:
        schrijf_log(f"VERBINDINGSFOUT: {fout.reason}")
        return False

    except Exception as fout:
        schrijf_log(f"ONVERWACHTE FOUT: {fout}")
        return False


if __name__ == "__main__":
    geslaagd = houd_supabase_actief()

    if geslaagd:
        print("Supabase keep-alive: OK")
    else:
        print("Supabase keep-alive: MISLUKT")