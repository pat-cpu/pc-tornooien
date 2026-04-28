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
# Run lokaal
# ============================
if __name__ == "__main__":
    app.run(debug=True)
