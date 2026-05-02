from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
from pathlib import Path

# ============================
# Config
# ============================
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "tornooien.json"
APP_DIR = BASE_DIR  # voor index.html

# ============================
# App
# ============================
app = Flask(__name__, static_folder=str(APP_DIR), static_url_path="")

# 🔥 BELANGRIJK: CORS aanzetten
CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},
    supports_credentials=False
)

# ============================
# Helpers
# ============================
def read_data():
    if not DATA_FILE.exists():
        return []

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            raw = json.load(f)

        # Oud formaat: {"app": "...", "tournaments": [...]}
        if isinstance(raw, dict) and isinstance(raw.get("tournaments"), list):
            return raw["tournaments"]

        # Nieuw formaat: [...]
        if isinstance(raw, list):
            return raw

        return []
    except:
        return []

def write_data(data):
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)

    output = {
        "app": "pc-tornooien",
        "version": 2,
        "tournaments": data
    }

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

def normalize_tournament(item):
    if "id" not in item or not item["id"]:
        import uuid
        item["id"] = str(uuid.uuid4())

    item.setdefault("type", "pc")
    return item

def laad_bestaande_tornooien():
    if not DATA_FILE.exists():
        return []

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        return data

    if isinstance(data, dict):
        return data.get("tornooien", [])

    return []

# ============================
# API
# ============================
@app.get("/api/tournaments")
def get_tournaments():
    data = [normalize_tournament(t) for t in read_data()]
    data.sort(key=lambda x: x.get("date_iso", x.get("datum", "")))

    write_data(data)

    return jsonify({
        "app": "pc-tornooien",
        "version": 2,
        "tournaments": data
    })

@app.post("/api/tournaments")
def save_tournaments():
    try:
        payload = request.get_json(force=True)

        if isinstance(payload, dict) and isinstance(payload.get("tournaments"), list):
            data = payload["tournaments"]
        elif isinstance(payload, list):
            data = payload
        elif isinstance(payload, dict):
            data = read_data()
            data.append(payload)
        else:
            return jsonify({"error": "Invalid data"}), 400

        data = [normalize_tournament(t) for t in data if isinstance(t, dict)]
        data.sort(key=lambda x: x.get("date_iso", x.get("datum", "")))

        write_data(data)
        return jsonify({"status": "ok", "count": len(data)})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# ============================
# Frontend (optioneel)
# ============================
@app.get("/")
def index():
    return send_from_directory(APP_DIR, "index.html")

@app.get("/<path:path>")
def static_proxy(path):
    full_path = (APP_DIR / path)

    if full_path.exists():
        return send_from_directory(APP_DIR, path)

    # fallback alleen voor echte pagina's, NIET voor assets
    return send_from_directory(APP_DIR, "index.html")

# ============================
#import
# ============================
import csv

DEFAULTS = {
    "Zomer Oost": {
        "team": "Annie Patrick",
        "uur": "14:30",
        "ronden": 3
    },
    "Zomer West": {
        "team": "Annie Patrick",
        "uur": "14:00",
        "ronden": 3
    },
    "Winter": {
        "team": "Patrick, Annie, Gregory",
        "uur": "14:30",
        "ronden": 3
    }
}
def proper(value):
    if value is None:
        return ""
    return str(value).strip()

@app.route("/api/import_csv", methods=["POST"])
def import_csv():
    file = request.files.get("file")

    if not file:
        return jsonify({"error": "Geen bestand"}), 400

    decoded = file.read().decode("utf-8-sig").splitlines()
    reader = csv.DictReader(decoded, delimiter=";")

    resultaat = []

    for row in reader:
        circuit = proper(row.get("circuit"))
        defaults = DEFAULTS.get(circuit, {})

        tornooi = {
            "datum": proper(row.get("datum")),
            "club": proper(row.get("club")),
            "spel": proper(row.get("spel")),
            "circuit": circuit,
            "team": defaults.get("team"),
            "uur": defaults.get("uur"),
            "ronden": defaults.get("ronden")
        }

        resultaat.append(tornooi)

    bestaande = laad_bestaande_tornooien()

    bestaande_sleutels = set()
    for t in bestaande:
        sleutel = (
            proper(t.get("datum")),
            proper(t.get("club")).lower(),
            proper(t.get("spel")).lower(),
            proper(t.get("circuit")).lower()
        )
        bestaande_sleutels.add(sleutel)

    preview = []

    for tornooi in resultaat:
        sleutel = (
            proper(tornooi.get("datum")),
            proper(tornooi.get("club")).lower(),
            proper(tornooi.get("spel")).lower(),
            proper(tornooi.get("circuit")).lower()
        )

        tornooi["dubbel"] = sleutel in bestaande_sleutels
        preview.append(tornooi)

    return jsonify(preview)














# ============================
# Run lokaal
# ============================
if __name__ == "__main__":
    app.run(debug=True)
