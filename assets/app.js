import {
  pullFromCloud,
  saveTournamentToCloud,
  pushAllToCloud,
  clearCloudAll
} from "./cloud.js";

import {
  getToernooien,
  clearAll,
  writeCache,
  addTournament,
  updateTournament,
  deleteTournament,
  getTournamentById
} from "./store.js";

import {
  escapeHtml as esc,
  norm,
  toDisplayDate,
  todayMidnight,
  statusFromLegacyText,
  STATUS,
  statusLabel
} from "./model.js";


// ============================
// APP VERSION / CACHE RESET
// ============================

const APP_VERSION = "2026-05-03-v1";

if (location.search.includes("reset")) {
  localStorage.clear();
  alert("Cache gewist");
}

const savedVersion = localStorage.getItem("app_version");

if (savedVersion !== APP_VERSION) {
  console.log("Nieuwe versie → cache reset");

  localStorage.clear();
  localStorage.setItem("app_version", APP_VERSION);

  alert("App werd geüpdatet. Data opnieuw geladen.");
}


// ============================
// DEBUG HELPERS
// ============================

window.pushAllToCloud = pushAllToCloud;
window.pullFromCloud = pullFromCloud;
window.getToernooien = getToernooien;
window.clearCloudAll = clearCloudAll;

console.log("UI localStorage check:", getToernooien());

// ============================
// DOM refs
// ============================
const listEl = document.getElementById("list");
const qEl = document.getElementById("q");
const chipsEl = document.getElementById("chips");

const statTotal = document.getElementById("statTotal");
const statVisible = document.getElementById("statVisible");
const statIn = document.getElementById("statIn");
const statNext = document.getElementById("statNext");

const btnAdd = document.getElementById("btnAdd");
const btnExport = document.getElementById("btnExport");
const btnImport = document.getElementById("btnImport");
const btnReset = document.getElementById("btnReset");
const btnClearAll = document.getElementById("btnClearAll");
const btnDownload = document.getElementById("btnDownload");
const btnArchive = document.getElementById("btnArchive");

// Modal edit
const modalEdit = document.getElementById("modalEdit");
const editTitle = document.getElementById("editTitle");
const btnCloseEdit = document.getElementById("btnCloseEdit");
const btnSave = document.getElementById("btnSave");
const btnDelete = document.getElementById("btnDelete");
const btnCalendar = document.getElementById("btnCalendar");

const fDate = document.getElementById("fDate");
const fTime = document.getElementById("fTime");

const fClub = document.getElementById("fClub");
const fClubSel = document.getElementById("fClubSel");
const clubCustomWrap = document.getElementById("clubCustomWrap");

const fSpel = document.getElementById("fSpel");
const fSpelSel = document.getElementById("fSpelSel");
const spelCustomWrap = document.getElementById("spelCustomWrap");

const fStatus = document.getElementById("fStatus");

const fTeam = document.getElementById("fTeam");
const fTeamSel = document.getElementById("fTeamSel");
const teamCustomWrap = document.getElementById("teamCustomWrap");

const fRounds = document.getElementById("fRounds");
const fCategory = document.getElementById("fCategory");
const fNote = document.getElementById("fNote");
const fCircuit = document.getElementById("fCircuit");
const syncStatusEl = document.getElementById("syncStatus");

// Export/Import modal
const modalJSON = document.getElementById("modalJSON");
const jsonTitle = document.getElementById("jsonTitle");
const jsonHint = document.getElementById("jsonHint");
const jsonBox = document.getElementById("jsonBox");
const btnCloseJSON = document.getElementById("btnCloseJSON");
const btnCopyJSON = document.getElementById("btnCopyJSON");
const btnApplyJSON = document.getElementById("btnApplyJSON");

// Toast
const toastEl = document.getElementById("toast");
const toastTextEl = document.getElementById("toastText");
const toastUndoBtn = document.getElementById("toastUndo");
const toastCloseBtn = document.getElementById("toastClose");

// ============================
// App state
// ============================
let DATA = [];
let activeChip = "Komend";
let editingId = null;
let loadError = "";
let listClickBound = false;
let activeCircuit = localStorage.getItem("activeCircuit") || "pc";

const CHIP_ITEMS = ["Komend", "Gespeeld"];

const CLUB_CHOICES_BY_CIRCUIT = {
  pc: [
    "PC Mistral",
    "PC Schorpioen",
    "PC Verbroedering",
    "PC Haeseveld",
    "PC Reinaert",
    "PC Donkmeer",
    "PC Alosta",
    "PC LOBOS",
    "KPC Mistral",
    "KPC Schorpioen",
    "PC Singel, Grimbergen"
  ],

  zomer_oost: [
    "PC Mistral",
    "PC Schorpioen",
    "PC Verbroedering",
    "PC Donkmeer",
    "PC Alosta",
    "PC Reinaert",
    "PC Haeseveld",
    "PC Apollo"
  
  ],

  zomer_west: [
    "PC Gullegem",
    "PC Oostende",
    "PC Gulden Kamer",
    "PC Koksijde",
    "PC Okapi",
    "PC Vuurtoren",
    "PC Nieuwpoort",
    "PC Den Akker",
    "PC De Zeemeermin",
    
  ],

  winter: [
    "PC Mistral",
    "PC Schorpioen",
    "PC Verbroedering",
    "PC Haeseveld",
    "PC Reinaert",
    "PC Donkmeer",
    "PC Alosta",
    "PC LOBOS",
    "KPC Mistral",
    "KPC Schorpioen",
  ]
};

const SPEL_CHOICES = [
  "Doublet gemengd",
  "Doublet Dames",
  "Doublet Heren",
  "Doublet, 1 dame 1 heer",
  "Triplet",
  "Triplet gemengd",
  "Triplet Dames",
  "H/G Triplet kleurentornooi",
  "Kwartetten min 1 dame",
  "Kwartetten min 2 dames",
  "Sextet"
  
];

const TEAM_CHOICES_BASE = ["A", "B", "C", "D"];

// ============================
// Helpers
// ============================
function openGoogleCalendar(item) {
  const date = item.date_iso || "";
  const time = item.time || "14:00";

  const start = date.replaceAll("-", "") + "T" + time.replace(":", "") + "00";
  const end = start;

  const text = encodeURIComponent(item.club + " - " + item.spel);
  const details = encodeURIComponent(item.note || "");

  const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}`;

  window.open(url, "_blank");
}


function ensureArrayData() {
  if (Array.isArray(DATA)) return;
  console.warn("DATA was not an array. Resetting to []. DATA=", DATA);
  DATA = [];
}

function createUuid() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getCircuitLabel(circuit) {
  switch (circuit) {
    case "pc": return "PC";
    case "zomer_oost": return "Zomer Oost";
    case "zomer_west": return "Zomer West";
    case "winter": return "Winter";
    default: return "";
  }
}






function todayLocalISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function setData(next, { error = loadError } = {}) {
  DATA = normalizeList(next);
  loadError = error;
  render();
}

function setSyncStatus(state, text) {
  if (!syncStatusEl) return;
  syncStatusEl.classList.remove("ok", "bad");
  if (state === "ok") syncStatusEl.classList.add("ok");
  if (state === "bad") syncStatusEl.classList.add("bad");
  syncStatusEl.textContent = text;
}

function getCircuitColor(circuit) {
  switch (circuit) {
    case "pc": return "#3b82f6";        // blauw
    case "zomer_oost": return "#16a34a"; // groen
    case "zomer_west": return "#f97316"; // oranje
    case "winter": return "#444";        // donker
    default: return "#999";
  }
}

// ===========================
// Download
// ===========================
function downloadBackup() {
  const payload = {
    app: "pc-tornooien",
    version: 1,
    exported_at: new Date().toISOString(),
    tournaments: DATA.filter(x => !x.deleted)
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `pc-tornooien-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast({ text: "Backup gedownload." });
}

function autoBackupAfterSave() {
  showToast({
    text: 'Opgeslagen. Tik op "Download backup" om een reservekopie te bewaren.'
  });
}

// ============================
// Normalization
// ============================
function stableId({ date_iso, club, spel, time }) {
  return [
    (date_iso || "").slice(0, 10),
    norm(club).toLowerCase(),
    norm(spel).toLowerCase(),
    norm(time).toLowerCase()
  ].join("|");
}

function normalizeItem(x, i = 0) {
  const date_iso = String(x?.date_iso || x?.datum || "").slice(0, 10);
  const club = norm(x?.club || x?.locatie || "");
  const spel = norm(x?.spel || "");
  const time = norm(x?.time || "");

  const status_code = x?.status_code
    ? String(x.status_code)
    : statusFromLegacyText(x?.status);

  const id = String(
    x?.id ||
    `${stableId({ date_iso, club, spel, time }) || "item"}|${i}`
  );

  return {
    ...x,
    id,
    date_iso,
    date: x?.date || toDisplayDate(date_iso),
    club,
    spel,
    time,
    category: norm(x?.category || x?.categorie || ""),
    circuit: mapCircuit(x?.circuit || "pc"),
    rounds: norm(x?.rounds || ""),
    team: norm(x?.team || ""),
    status_code,
    played_at: x?.played_at || "",
    note: norm(x?.note || x?.notities || ""),
    created_at: x?.created_at || "",
    updated_at: x?.updated_at || x?.updatedAt || "",
    updatedAt: x?.updatedAt || x?.updated_at || "",
    deleted: Boolean(x?.deleted)
  };
}

function normalizeList(arr) {
  return (Array.isArray(arr) ? arr : [])
    .map((x, i) => normalizeItem(x, i))
    .filter(x => x.id)
    .sort((a, b) => {
      const d = (a.date_iso || "").localeCompare(b.date_iso || "");
      if (d !== 0) return d;
      return String(a.id).localeCompare(String(b.id));
    });
}

function toMs(value) {
  const ms = Date.parse(value || "");
  return Number.isNaN(ms) ? 0 : ms;
}

function mergeLocalAndCloud(localItems, cloudItems) {
  const map = new Map();

  for (const item of normalizeList(localItems)) {
    if (!item.id) continue;
    map.set(String(item.id), item);
  }

  for (const cloud of normalizeList(cloudItems)) {
    if (!cloud.id) continue;

    const key = String(cloud.id);
    const local = map.get(key);

    if (!local) {
      map.set(key, cloud);
      continue;
    }

    const localMs = toMs(local.updatedAt || local.updated_at);
    const cloudMs = toMs(cloud.updatedAt || cloud.updated_at);

    if (cloudMs > localMs) {
      map.set(key, cloud);
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const d = (a.date_iso || "").localeCompare(b.date_iso || "");
    if (d !== 0) return d;
    return String(a.id).localeCompare(String(b.id));
  });
}

function findLocalNewerThanCloud(localItems, cloudItems) {
  const cloudMap = new Map(
    normalizeList(cloudItems)
      .filter(x => x.id)
      .map(x => [String(x.id), x])
  );

  return normalizeList(localItems).filter(local => {
    if (!local.id) return false;

    const cloud = cloudMap.get(String(local.id));
    if (!cloud) return true;

    const localMs = toMs(local.updatedAt || local.updated_at);
    const cloudMs = toMs(cloud.updatedAt || cloud.updated_at);

    return localMs > cloudMs;
  });
}

function getVisibleData() {
  return (Array.isArray(DATA) ? DATA : []).filter(x => !x.deleted);
}

// ============================
// Dropdown helpers
// ============================
function buildSelectOptions(selEl, choices, selectedValue) {
  if (!selEl) return;

  const normalized = Array.from(
    new Set((choices || []).map(s => norm(s)).filter(Boolean))
  );

  const opts = [
    { v: "", t: "(Kies…)" },
    ...normalized.map(s => ({ v: s, t: s })),
    { v: "__CUSTOM__", t: "(Andere…)" }
  ];

  selEl.innerHTML = opts
    .map(o => `<option value="${esc(o.v)}">${esc(o.t)}</option>`)
    .join("");

  const sv = norm(selectedValue);
  if (!sv) {
    selEl.value = "";
    return;
  }
  if (normalized.includes(sv)) {
    selEl.value = sv;
    return;
  }
  selEl.value = "__CUSTOM__";
}

function wireCustomSelectOnce(selEl, wrapEl, inputEl) {
  if (!selEl || !wrapEl || !inputEl || selEl.dataset.wired === "1") return;

  selEl.dataset.wired = "1";

  function sync() {
    const isCustom = selEl.value === "__CUSTOM__";
    wrapEl.style.display = isCustom ? "block" : "none";

    if (!isCustom) {
      inputEl.value = selEl.value || "";
    } else {
      setTimeout(() => inputEl.focus(), 0);
    }
  }

  selEl.addEventListener("change", sync);
  selEl._syncCustom = sync;
  sync();
}

function getTeamChoicesFromData() {
  const fromData = (Array.isArray(DATA) ? DATA : [])
    .map(x => norm(x.team))
    .filter(Boolean);

  return Array.from(new Set([...TEAM_CHOICES_BASE, ...fromData]))
    .sort((a, b) => a.localeCompare(b, "nl"));
}

function refreshModalSelects() {
  const circuit = fCircuit?.value || "pc";
  const clubChoices = CLUB_CHOICES_BY_CIRCUIT[circuit] || [];

  buildSelectOptions(fClubSel, clubChoices, fClub?.value || "");
  fClubSel?._syncCustom?.();

  buildSelectOptions(fSpelSel, SPEL_CHOICES, fSpel?.value || "");
  fSpelSel?._syncCustom?.();

  buildSelectOptions(fTeamSel, getTeamChoicesFromData(), fTeam?.value || "");
  fTeamSel?._syncCustom?.();
}

// ============================
// Toast
// ============================
let toastTimer = null;
let toastUndoFn = null;

function showToast({ text, undoText = "Ongedaan maken", undoFn = null, ms = 6000 }) {
  if (!toastEl || !toastTextEl || !toastUndoBtn) return;

  if (toastTimer) clearTimeout(toastTimer);
  toastUndoFn = undoFn;

  toastTextEl.textContent = text || "";
  toastUndoBtn.textContent = undoText;
  toastUndoBtn.style.display = undoFn ? "inline-block" : "none";

  toastEl.classList.add("show");
  toastTimer = setTimeout(hideToast, ms);
}

function hideToast() {
  if (!toastEl) return;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = null;
  toastUndoFn = null;
  toastEl.classList.remove("show");
}

toastUndoBtn?.addEventListener("click", () => {
  const fn = toastUndoFn;
  hideToast();
  if (fn) fn();
});

toastCloseBtn?.addEventListener("click", hideToast);

// ============================
// Filtering
// ============================
function matchesFilter(item, filterName) {
  if (filterName === "Alles") return true;

  const today = todayMidnight();
  const d = new Date(`${item.date_iso || ""}T00:00:00`);
  const hasValidDate = !Number.isNaN(d.getTime());
  const isPast = hasValidDate && d < today;
  const statusCode = item.status_code || STATUS.PLANNED;

  switch (filterName) {
    case "Komend":
      return hasValidDate && !isPast && statusCode !== STATUS.PLAYED;
    case "Ingeschreven":
      return statusCode === STATUS.REGISTERED;
    case "Betaald":
      return statusCode === STATUS.PAID;
    case "Gespeeld":
      return isPast || statusCode === STATUS.PLAYED;
    default:
      return true;
  }
}

function matchesChip(item) {
  return matchesFilter(item, activeChip);
}

function matchesQuery(item, q) {
  if (!q) return true;

  const hay = [
    item.date,
    item.club,
    item.spel,
    item.category,
    item.time,
    item.rounds,
    item.team,
    item.note
  ].join(" ").toLowerCase();

  return hay.includes(q.toLowerCase());
}

// ============================
// Rendering
// ============================
function renderChips() {
  if (!chipsEl) return;

  if (!CHIP_ITEMS.includes(activeChip)) activeChip = "Komend";

  chipsEl.innerHTML = CHIP_ITEMS.map(label => {
  let cls = "chip";
  const key = label.trim().toLowerCase();

  if (key === "komend") cls += " chip-komend";
  if (key === "gespeeld") cls += " chip-gespeeld";

  if (label === activeChip) cls += " active";

  return `<button class="${cls}" data-chip="${esc(label)}">${esc(label)}</button>`;
}).join("");

  chipsEl.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      activeChip = btn.getAttribute("data-chip");
      render();
    });
  });
}

function actionButtons(item) {
  return `
    <div class="cardActions">
      <button class="btn ghost" data-act="edit" data-id="${esc(item.id)}">✏️ Bewerken</button>
    </div>
  `;
}

function card(item) {
  const badges = [];

  if (item.status_code) {
    badges.push(
      `<span class="badge badge-status">${esc(statusLabel(item.status_code))}</span>`
    );
  }

  if (item.category) {
    badges.push(`<span class="badge">${esc(item.category)}</span>`);
  }

  const meta = [
    ["Spelvorm", item.spel || "—"],
    ["Uur", item.time || "—"],
    ["Ronden", item.rounds || "—"],
    ["Team", item.team || "—"]
  ].map(([k, v]) => `
    <div class="item">
      <div class="label">${esc(k)}</div>
      <div class="value">${esc(v)}</div>
    </div>
  `).join("");

  const note = item.note ? `<div class="note">${esc(item.note)}</div>` : "";

  return `
    <article class="card" style="border-left: 6px solid ${getCircuitColor(item.circuit)}">
      <div class="row">
        <div>
          <div class="date">${esc(item.date)}</div>
          <div class="club">${esc(item.club || "—")}</div>
        </div>
        <div class="badges">${badges.join("")}</div>
      </div>
      <div class="meta">${meta}</div>
      ${note}
      ${actionButtons(item)}
    </article>
  `;
}
const CIRCUIT_LABELS = {
  pc: "PC Tornooien",
  zomer_oost: "Zomer Circuit Oost-Vlaanderen",
  zomer_west: "Zomer Circuit West-Vlaanderen",
  winter: "Wintercompetities"
};

const CIRCUIT_ORDER = ["pc", "zomer_oost", "zomer_west", "winter"];

function renderGroupedCards(items) {
  return CIRCUIT_ORDER.map(circuit => {
    const group = items
      .filter(x => (x.circuit || "pc") === circuit)
      .sort((a, b) => (a.date_iso || "").localeCompare(b.date_iso || ""));

    if (!group.length) return "";

    return `
      <section class="circuitGroup">
        <h2 class="circuitTitle">${esc(CIRCUIT_LABELS[circuit])}</h2>
        ${group.map(card).join("")}
      </section>
    `;
  }).join("");
}

function renderCircuitTabs() {
  const baseData = getVisibleData();

  const dataForTabs = baseData.filter(matchesChip);

  const countFor = (key) => {
    if (key === "alles") {
      return dataForTabs.length;
    }

    return dataForTabs.filter(x => (x.circuit || "pc") === key).length;
  };

  const tabs = [
    { key: "alles", label: "Alle circuits" },
    { key: "pc", label: "PC" },
    { key: "zomer_oost", label: "Zomer Oost" },
    { key: "zomer_west", label: "Zomer West" },
    { key: "winter", label: "Winter" }
  ];

  const container = document.getElementById("circuitTabs");
  if (!container) return;

  container.innerHTML = tabs.map(t => {
    const cls = t.key === activeCircuit ? "chip active" : "chip";
    return `<button class="${cls}" data-circuit="${t.key}">
      ${esc(t.label)} (${countFor(t.key)})
    </button>`;
  }).join("");

  container.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCircuit = btn.getAttribute("data-circuit");
      localStorage.setItem("activeCircuit", activeCircuit);
      render();
    });
  });
}

function render() {
  ensureArrayData();

  console.log("RENDER DATA:", DATA);
  console.log("listEl:", listEl);

  if (!listEl) {
    console.error("listEl niet gevonden");
    return;
  }

  renderChips();
  renderCircuitTabs();

  const q = (qEl?.value || "").trim();
  const visibleData = getVisibleData();
  const filtered = visibleData
    .filter(matchesChip)
    .filter(x => matchesQuery(x, q))
    .filter(x => {
      if (activeCircuit === "alles") return true;
      return (x.circuit || "pc") === activeCircuit;
    });

  if (!filtered.length) {
    if (loadError && !DATA.length) {
      listEl.innerHTML = `<div class="empty">Fout bij laden: ${esc(loadError)}</div>`;
    } else {
      listEl.innerHTML = `<div class="empty">Geen resultaten.</div>`;
    }
  } else {
    listEl.innerHTML = renderGroupedCards(filtered);
  }

  const today0 = todayMidnight();

  const upcoming = visibleData.filter(x => {
    const d = new Date(`${x.date_iso || ""}T00:00:00`);
    return !Number.isNaN(d.getTime()) && d >= today0;
  });

  if (statTotal) statTotal.textContent = upcoming.length;
  if (statVisible) statVisible.textContent = filtered.length;
  if (statIn) statIn.textContent = "—";

  const next = upcoming
    .map(x => ({ ...x, d: new Date(`${x.date_iso || ""}T00:00:00`) }))
    .sort((a, b) => a.d - b.d)[0];

  if (statNext) statNext.textContent = next ? next.date : "—";

  console.log("Aantal gerenderde kaarten:", filtered.length);
}

// ============================
// Data loading / saving
// ============================

function mergeByNewest(localItems, cloudItems) {
  const map = new Map();

  [...localItems, ...cloudItems].forEach(item => {
    if (!item?.id) return;

    const id = String(item.id);
    const existing = map.get(id);

    const itemTime = new Date(item.updatedAt || item.updated_at || 0).getTime();
    const existingTime = existing
      ? new Date(existing.updatedAt || existing.updated_at || 0).getTime()
      : -1;

    if (!existing || itemTime >= existingTime) {
      map.set(id, item);
    }
  });

  return Array.from(map.values());
}



async function loadFromCloudOnStart() {
  try {
    const localItems = normalizeList(getToernooien());
    const cloudItems = normalizeList(await pullFromCloud());

    console.log("local:", localItems.length);
    console.log("cloud:", cloudItems.length);

    const merged = normalizeList(mergeByNewest(localItems, cloudItems));

    DATA = merged.filter(x => !x.deleted);
    loadError = "";

    writeCache(merged);
    render();

    setSyncStatus("ok", `● sync ok (${DATA.length})`);
  } catch (e) {
    console.error("loadFromCloudOnStart fout:", e);

    const cached = normalizeList(getToernooien());

    DATA = cached.filter(x => !x.deleted);
    loadError = e?.message || String(e);

    render();

    if (cached.length) {
      setSyncStatus("bad", "● offline, cache actief");
    } else {
      setSyncStatus("bad", "● cloud lezen mislukt");
    }
  }
}
async function importAllTournaments(arr) {
  await clearAll();
  // await clearCloudAll();

  for (const item of normalizeList(arr)) {
    await addTournament(item);
  }

  const localNow = normalizeList(getToernooien());
  setData(localNow, { error: "" });
  render();

  // await pushAllToCloud(localNow);
  setSyncStatus("bad", "● lokaal geïmporteerd, nog NIET naar cloud");
}
function formToItemBase() {
  return {
    id: editingId || createUuid(),
    date_iso: fDate?.value || "",
    date: toDisplayDate(fDate?.value || ""),
    time: fTime?.value || "",
    club: fClub?.value || "",
    spel: fSpel?.value || "",
    category: fCategory?.value === "AC" ? "AllCat" : (fCategory?.value || ""),
    circuit: fCircuit?.value || "pc",
    rounds: fRounds?.value || "",
    status_code: fStatus?.value || "planned",
    team: fTeam?.value || "",
    note: fNote?.value || ""
  };
}

// ============================
// Modal Add/Edit
// ============================
function openAdd() {
  editingId = null;
  if (editTitle) editTitle.textContent = "Tornooi toevoegen";

  if (fDate) fDate.value = todayLocalISO();
  if (fStatus) fStatus.value = "planned";
  if (fTime) fTime.value = "";
  if (fClub) fClub.value = "";
  if (fSpel) fSpel.value = "";
  if (fTeam) fTeam.value = "";
  if (fRounds) fRounds.value = "";
  if (fCategory) fCategory.value = "50+";
  if (fCircuit) fCircuit.value = "pc";
  if (fNote) fNote.value = "";

  refreshModalSelects();

  if (btnDelete) btnDelete.style.display = "none";
  if (btnCalendar) btnCalendar.style.display = "none";
  modalEdit?.classList.add("show");
}

function openEdit(id) {
  ensureArrayData();
  const item = DATA.find(x => String(x.id) === String(id));
  if (!item) return;

  editingId = item.id;
  if (editTitle) editTitle.textContent = "Tornooi bewerken";

  if (fDate) fDate.value = item.date_iso || "";
  if (fStatus) fStatus.value = item.status_code || "planned";
  if (fTime) fTime.value = item.time || "";
  if (fClub) fClub.value = item.club || "";
  if (fSpel) fSpel.value = item.spel || "";
  if (fTeam) fTeam.value = item.team || "";
  if (fRounds) fRounds.value = item.rounds || "";
  if (fCircuit) fCircuit.value = item.circuit || "pc";

  const cat = (item.category || "").trim();
  const normalizedCat =
    cat === "AC" ||
      cat.toLowerCase() === "all categorieen" ||
      cat.toLowerCase() === "alle categorieen"
      ? "AllCat"
      : cat;

  const finalCat = normalizedCat === "" || normalizedCat === "leeg"
    ? "50+"
    : normalizedCat;

  if (fCategory) fCategory.value = finalCat;
  if (fNote) fNote.value = item.note || "";

  refreshModalSelects();

  if (btnDelete) btnDelete.style.display = "inline-block";
  if (btnCalendar) btnCalendar.style.display = "inline-block";
  modalEdit?.classList.add("show");
}

function closeEdit() {
  modalEdit?.classList.remove("show");
}

async function saveFromModal() {
  if (!fDate?.value) {
    alert("Datum is verplicht.");
    return;
  }

  const item = normalizeItem(formToItemBase(), Date.now());

  try {
    let savedLocal;

    if (editingId) {
      const existing = await getTournamentById(editingId);

      if (!existing) {
        throw new Error("Bestaand tornooi niet gevonden.");
      }

      savedLocal = await updateTournament(editingId, {
        ...existing,
        ...item
      });
    } else {
      savedLocal = await addTournament(item);
    }

    const localNow = normalizeList(getToernooien());
    setData(localNow, { error: "" });

    await saveTournamentToCloud(savedLocal);
    setSyncStatus("ok", "● cloud opgeslagen");

    closeEdit();
    autoBackupAfterSave();
  } catch (e) {
    console.error("saveFromModal fout:", e);
    setSyncStatus("bad", "● cloud opslaan mislukt");
    alert("Opslaan mislukt: " + (e?.message || e));
  }
}

async function deleteFromModal() {
  if (!editingId) return;

  const removed = DATA.find(x => String(x.id) === String(editingId));
  if (!removed) return;

  try {
    const deletedLocal = await deleteTournament(editingId);

    const localNow = normalizeList(getToernooien());
    setData(localNow, { error: "" });

    await saveTournamentToCloud(deletedLocal);
    setSyncStatus("ok", "● verwijderd uit cloud");

    closeEdit();
    autoBackupAfterSave();

    showToast({
      text: "Tornooi verwijderd.",
      undoFn: async () => {
        try {
          const restored = await updateTournament(removed.id, {
            ...removed,
            deleted: false
          });

          const afterUndo = normalizeList(getToernooien());
          setData(afterUndo, { error: "" });

          await saveTournamentToCloud(restored);
          setSyncStatus("ok", "● herstel naar cloud opgeslagen");
        } catch (e) {
          console.error("undo delete fout:", e);
          setSyncStatus("bad", "● herstel naar cloud mislukt");
          alert("Herstel mislukt: " + (e?.message || e));
        }
      }
    });
  } catch (e) {
    console.error("deleteFromModal fout:", e);
    setSyncStatus("bad", "● verwijderen in cloud mislukt");
    alert("Verwijderen mislukt: " + (e?.message || e));
  }
}

// ============================
// Export / Import
// ============================
function getExportData() {
  return (Array.isArray(DATA) ? DATA : []).filter(x => !x.deleted);
}

function openJSON(mode) {
  if (!modalJSON) return;

  modalJSON.classList.add("show");

  if (mode === "export") {
    if (jsonTitle) jsonTitle.textContent = "Export (alles)";
    if (jsonHint) jsonHint.textContent = "Kopieer dit als backup.";

    if (jsonBox) {
      jsonBox.value = JSON.stringify(
        {
          app: "pc-tornooien",
          version: 1,
          exported_at: new Date().toISOString(),
          tournaments: getExportData()
        },
        null,
        2
      );
    }

    if (btnApplyJSON) btnApplyJSON.style.display = "none";
  } else {
    if (jsonTitle) jsonTitle.textContent = "Import (alles)";
    if (jsonHint) jsonHint.textContent = "Plak hier je export. Dit vervangt je lijst.";
    if (jsonBox) jsonBox.value = "";
    if (btnApplyJSON) btnApplyJSON.style.display = "inline-block";
  }

  jsonBox?.focus();
}

function closeJSON() {
  modalJSON?.classList.remove("show");
}

async function copyJSON() {
  const text = jsonBox?.value || "";

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      jsonBox?.focus();
      jsonBox?.select();
      document.execCommand("copy");
    }

    alert("Gekopieerd.");
  } catch (e) {
    console.error("copyJSON fout:", e);

    try {
      jsonBox?.focus();
      jsonBox?.select();
      document.execCommand("copy");
      alert("Gekopieerd.");
    } catch (err) {
      console.error("Fallback copy mislukt:", err);
      alert("Kopiëren mislukt.");
    }
  }
}

async function applyJSON() {
  try {
    const raw = jsonBox?.value?.trim() || "";
    if (!raw) {
      throw new Error("Geen JSON ingevoerd");
    }

    let arr;

    if (raw.includes(";") && raw.includes("\n")) {
      const regels = raw.split(/\r?\n/).filter(r => r.trim());
      const headers = regels[0].split(";").map(h => h.trim());

      arr = regels.slice(1).map(regel => {
        const waarden = regel.split(";").map(v => v.trim());
        const obj = {};

        headers.forEach((h, i) => {
          obj[h] = waarden[i] || "";
        });

        return obj;
      });

    } else {
      const payload = JSON.parse(raw);
      arr = Array.isArray(payload) ? payload : payload?.tournaments;
    }

        if (!Array.isArray(arr)) {
      throw new Error("Geen lijst gevonden");
    }

      
    const voorbeeld = arr
      .slice(0, 20)
      .map(t => `${t.date || t.datum || "?"} - ${t.club || "?"} - ${t.name || t.naam || "?"} - ${t.circuit || "?"}`)
      .join("\n");

    const extra = arr.length > 20
      ? `\n\n... en nog ${arr.length - 20} extra tornooien`
      : "";

    const akkoord = confirm(
      `Je staat op het punt ${arr.length} tornooi(en) te importeren:\n\n${voorbeeld}${extra}\n\nWil je deze echt toevoegen?`
    );

    if (!akkoord) {
      setSyncStatus("bad", "● import geannuleerd");
      alert("Import geannuleerd. Er is niets toegevoegd.");
      return;
    }

    await importAllTournaments(arr);

    closeJSON();
    setSyncStatus("ok", "● import naar cloud opgeslagen");
    autoBackupAfterSave();
    alert('Import OK. Tik nu op "Download backup".');

  } catch (e) {
    console.error("applyJSON fout:", e);
    setSyncStatus("bad", "● import mislukt");
    alert("Import mislukt: " + (e?.message || e));
  }
}
// ============================
// Clear
// ============================
async function clearEverything() {
  const code = prompt('Typ RESET om alles te wissen:');

if (code !== "RESET") {
  alert("Reset geannuleerd. Er is niets gewist.");
  return;
}

if (!confirm("⚠️ Zeker? Alles wordt lokaal én in de cloud gewist.")) return;

  try {
    await clearAll();
    writeCache([]);

    DATA = [];
    loadError = "";
    render();

    await clearCloudAll();

    setSyncStatus("ok", "● lokaal + cloud leeggemaakt");
    showToast({ text: "Alles gewist." });
  } catch (e) {
    console.error("clearEverything fout:", e);
    setSyncStatus("bad", "● cloud leegmaken mislukt");
    alert("Wissen mislukt: " + (e?.message || e));
  }
}

// ============================
// Event delegation
// ============================
function bindListClicksOnce() {
  if (listClickBound || !listEl) return;
  listClickBound = true;

  listEl.addEventListener("click", (e) => {
    const target = e.target instanceof Element ? e.target : null;
    const btn = target?.closest("button[data-act]");
    if (!btn) return;

    const act = btn.getAttribute("data-act");
    const id = btn.getAttribute("data-id");

    if (act === "edit" && id) {
      openEdit(id);
    }
  });
}

// ============================
// Wire events + init
// ============================
qEl?.addEventListener("input", render);

btnAdd?.addEventListener("click", openAdd);
btnExport?.addEventListener("click", () => openJSON("export"));
btnImport?.addEventListener("click", () => openJSON("import"));
btnReset?.addEventListener("click", clearEverything);
btnDownload?.addEventListener("click", downloadBackup);

btnCloseEdit?.addEventListener("click", closeEdit);
btnSave?.addEventListener("click", saveFromModal);
btnDelete?.addEventListener("click", deleteFromModal);

modalEdit?.addEventListener("click", (e) => {
  if (e.target === modalEdit) closeEdit();
});

btnCloseJSON?.addEventListener("click", closeJSON);
btnCopyJSON?.addEventListener("click", copyJSON);
btnApplyJSON?.addEventListener("click", applyJSON);

modalJSON?.addEventListener("click", (e) => {
  if (e.target === modalJSON) closeJSON();
});

wireCustomSelectOnce(fClubSel, clubCustomWrap, fClub);
wireCustomSelectOnce(fSpelSel, spelCustomWrap, fSpel);
wireCustomSelectOnce(fTeamSel, teamCustomWrap, fTeam);

fCircuit?.addEventListener("change", () => {
  refreshModalSelects();
});

// Overbodige HTML-elementen voorlopig verbergen
if (btnClearAll) btnClearAll.style.display = "none";
if (btnArchive) btnArchive.style.display = "none";

const statusField = fStatus?.closest(".field");
if (statusField) {
  statusField.style.display = "none";
}
//===============
// KALENDEREVENT
//===============
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#btnCalendar");
  if (!btn) return;

  alert("Agenda knop werkt");

  const item = editingId
    ? DATA.find(x => String(x.id) === String(editingId))
    : normalizeItem(formToItemBase(), Date.now());

  if (!item) {
    alert("Geen tornooi gevonden");
    return;
  }

  openGoogleCalendar(item);
});

// init
(async () => {
  bindListClicksOnce();

  try {
    const cached = normalizeList(getToernooien());

    if (cached.length) {
      DATA = cached.filter(x => !x.deleted);
      loadError = "";
      render();
      setSyncStatus("ok", "● cache geladen");
    } else {
      DATA = [];
      render();
    }

    await loadFromCloudOnStart();
  } catch (e) {
    console.error("init fout:", e);
    setSyncStatus("bad", "● init mislukt");
  }
})();

document.addEventListener("visibilitychange", async () => {
  if (document.visibilityState !== "visible") return;

  try {
    await loadFromCloudOnStart();
  } catch (e) {
    console.error("visibility sync fout:", e);
  }
});

// CSV IMPORT
document.getElementById("btnCsvImport")?.addEventListener("click", () => {
  document.getElementById("csvInput")?.click();
});

document.getElementById("csvInput")?.addEventListener("change", handleCSV);

function mapCircuit(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase()
    .replaceAll(" ", "_");

  if (v.includes("zomer_oost")) return "zomer_oost";
  if (v.includes("zomer_west")) return "zomer_west";
  if (v.includes("winter")) return "winter";
  if (v.includes("pc")) return "pc";

  return "pc";
}

function csvDateToIso(value) {
  const v = String(value || "").trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

  const m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const dag = m[1].padStart(2, "0");
    const maand = m[2].padStart(2, "0");
    const jaar = m[3];
    return `${jaar}-${maand}-${dag}`;
  }

  return v;
}

async function handleCSV(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function(e) {
    const text = e.target.result.trim();
    const lines = text.split(/\r?\n/).filter(Boolean);

    let aantal = 0;
    let overgeslagen = 0;

    for (const line of lines.slice(1)) {
      const cols = line.split(";").map(x => x.trim());

      if (cols.length < 4) {
        console.warn("CSV-regel overgeslagen:", line);
        overgeslagen++;
        continue;
      }

      const [
        datum,
        club,
        spel,
        circuit,
        uur,
        ronden,
        team,
        categorie,
        notitie
      ] = cols;

      if (!datum || !club) {
        console.warn("CSV-regel zonder datum of club overgeslagen:", line);
        overgeslagen++;
        continue;
      }

      const isoDatum = csvDateToIso(datum);
      const spelNaam = spel || "petanque";
      const uurNorm = uur || "";
      const circuitNorm = mapCircuit(circuit);

      const id = stableId({
        date_iso: isoDatum,
        club,
        spel: spelNaam,
        time: uurNorm
      });

      const bestaat = getToernooien().some(t =>
        !t.deleted && String(t.id) === String(id)
      );

      if (bestaat) {
        console.warn("Bestaat al:", club, isoDatum, spelNaam, uurNorm);
        overgeslagen++;
        continue;
      }

      const item = normalizeItem({
        id,
        date_iso: isoDatum,
        date: isoDatum,
        club,
        spel: spelNaam,
        circuit: circuitNorm,
        status_code: "planned",
        time: uurNorm,
        rounds: ronden || "",
        team: team || "",
        category: categorie || "50+",
        note: notitie || "",
        updatedAt: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted: false
      }, 0);

      await addTournament(item);
      aantal++;
    }

    setData(getToernooien(), { error: "" });
    render();

    event.target.value = "";

    alert(`${aantal} tornooien geïmporteerd 👍\n${overgeslagen} overgeslagen`);
  };

  reader.readAsText(file);
}