/* Global state */
let ROWS = [];     // all rows from CSV/XLSX
let PICKED = [];   // selected rows
let PRESETS = [];  // local presets

/* Column header mapping */
const columnMap = {
  name: ["Nazwa produktu","Nazwa Produktu","nazwa_produktu","Nazwa"],
  form: ["Postać farmaceutyczna","Postac farmaceutyczna","Postać","postac"],
  strength: ["Moc","Dawka","moc"],
  pack: ["Wielkość opakowania","Wielkosc opakowania","Wielkość","opakowanie"],
  route: ["Droga podania","droga_podania"],
  mah: ["Podmiot odpowiedzialny","podmiot_odpowiedzialny"],
  ean: ["EAN","Kod EAN","ean"]
};

const EL = (id) => document.getElementById(id);
const normalize = (h) => (h || "").trim().replace(/\s+/g, " ");

function mapRow(raw) {
  const get = (keys) => {
    for (const k of keys) {
      const hit = Object.keys(raw).find(hdr => normalize(hdr).toLowerCase() === k.toLowerCase());
      if (hit) return String(raw[hit]).trim();
    }
    return undefined;
  };
  return {
    name: get(columnMap.name) || "",
    form: get(columnMap.form) || "",
    strength: get(columnMap.strength) || "",
    pack: get(columnMap.pack) || "",
    route: get(columnMap.route) || "",
    mah: get(columnMap.mah) || "",
    ean: get(columnMap.ean) || ""
  };
}

/* Load presets */
try { PRESETS = JSON.parse(localStorage.getItem("rpl-presets") || "[]"); } catch {}
function savePresets() { localStorage.setItem("rpl-presets", JSON.stringify(PRESETS)); }
function renderPresets() {
  const wrap = EL("presets");
  wrap.innerHTML = "";
  if (PRESETS.length === 0) { wrap.innerHTML = '<div class="muted">Brak zapisanych presetów.</div>'; return; }
  PRESETS.forEach(p => {
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `<div><strong>${p.label}</strong></div>
      <div style="display:flex; gap:8px;">
        <button class="secondary" data-id="${p.id}" data-action="load">Załaduj</button>
        <button class="ghost" data-id="${p.id}" data-action="delete">Usuń</button>
      </div>`;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      const id = b.getAttribute("data-id");
      const act = b.getAttribute("data-action");
      const i = PRESETS.findIndex(x => x.id === id);
      if (i === -1) return;
      if (act === "load") {
        // clone preset items so further edits don't mutate the saved preset
        PICKED = (PRESETS[i].items || []).map(r => ({ ...r }));
        renderPicked();
      }
      if (act === "delete") { PRESETS.splice(i,1); savePresets(); renderPresets(); }
    };
  });
}

/* File handling */
EL("fileInput").addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  loadFromFile(file);
});

async function loadFromFile(file) {
  EL("status").textContent = "Wczytywanie…";
  if (file.name.endsWith(".xlsx")) {
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { raw: false });
    ROWS = json.map(mapRow).filter(r => r.name);
    EL("status").textContent = `Załadowano wierszy: ${ROWS.length}`;
    rebuildNameIndex();
  } else {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        ROWS = res.data.map(mapRow).filter(r => r.name);
        EL("status").textContent = `Załadowano wierszy: ${ROWS.length}`;
        rebuildNameIndex();
      },
      error: (err) => EL("status").textContent = "Błąd: " + err.message
    });
  }
}

EL("btnLoadRepo").addEventListener("click", async () => {
  const info = EL("loadInfo");
  info.textContent = "Pobieranie data/rpl.csv…";
  try {
    const res = await fetch("./data/rpl.csv", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status + " " + res.statusText);
    const text = await res.text();
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => {
        ROWS = r.data.map(mapRow).filter(r => r.name);
        EL("status").textContent = `Załadowano wierszy: ${ROWS.length}`;
        rebuildNameIndex();
        info.textContent = "Gotowe.";
      },
      error: (err) => { info.textContent = "Błąd parsowania: " + err.message; }
    });
  } catch (e) {
    info.textContent = "Błąd pobierania: " + e.message + " (czy workflow pobrał już CSV?)";
  }
});

/* Search + pick */
const Q = EL("q");
const SUG = EL("suggestions");
const STRENGTH = EL("strength");
const PACK = EL("pack");
let NAME_INDEX = [];

function rebuildNameIndex() {
  const set = new Set(ROWS.map(r => r.name).filter(Boolean));
  NAME_INDEX = Array.from(set).sort((a,b) => a.localeCompare(b));
}

Q.addEventListener("input", () => {
  const q = Q.value.trim().toLowerCase();
  if (!q) { SUG.style.display = "none"; return; }
  const opts = NAME_INDEX.filter(n => n.toLowerCase().includes(q)).slice(0, 50);
  SUG.innerHTML = opts.map(n => `<div class="list-item" data-name="${n}">${n}</div>`).join("");
  SUG.style.display = opts.length ? "block" : "none";
  SUG.querySelectorAll(".list-item").forEach(div => {
    div.onclick = () => { pickName(div.getAttribute("data-name")); };
  });
});

let CURRENT_NAME = null;
let CURRENT_MATCHES = [];

function pickName(name) {
  CURRENT_NAME = name;
  Q.value = name;
  SUG.style.display = "none";
  CURRENT_MATCHES = ROWS.filter(r => r.name === name);
  const strengths = Array.from(new Set(CURRENT_MATCHES.map(r => r.strength).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
  const packs = Array.from(new Set(CURRENT_MATCHES.map(r => r.pack).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
  STRENGTH.innerHTML = '<option value="">—</option>' + strengths.map(s => `<option>${s}</option>`).join("");
  PACK.innerHTML = '<option value="">—</option>' + packs.map(p => `<option>${p}</option>`).join("");
}

function currentMatch() {
  let m = CURRENT_MATCHES;
  const s = STRENGTH.value;
  const p = PACK.value;
  if (s) m = m.filter(r => r.strength === s);
  if (p) m = m.filter(r => r.pack === p);
  return m[0];
}

EL("btnAdd").addEventListener("click", () => {
  const m = currentMatch();
  if (!m) { alert("Wybierz nazwę, a następnie moc i/lub opakowanie."); return; }
  const exists = PICKED.find(p => p.name===m.name && p.strength===m.strength && p.pack===m.pack);
  if (exists) return;
  PICKED.push(m);
  renderPicked();
});

EL("btnClear").addEventListener("click", () => { PICKED = []; renderPicked(); });

function renderPicked() {
  const wrap = EL("picked");
  wrap.innerHTML = "";
  if (PICKED.length === 0) { wrap.innerHTML = '<div class="muted">Brak pozycji.</div>'; return; }
  PICKED.forEach((r, i) => {
    const row = document.createElement("div");
    row.className = "list-item";
    row.innerHTML = `<div class="muted">
      <span class="badge">${r.name}</span>
      ${r.form?` <span class="badge">${r.form}</span>`:""}
      ${r.strength?` <span class="badge">${r.strength}</span>`:""}
      ${r.pack?` <span class="badge">${r.pack}</span>`:""}
      ${r.route?` <span class="badge">${r.route}</span>`:""}
    </div>
    <button class="ghost" data-i="${i}">Usuń</button>`;
    wrap.appendChild(row);
  });
  wrap.querySelectorAll("button").forEach(b => {
    b.onclick = () => { const i = +b.getAttribute("data-i"); PICKED.splice(i,1); renderPicked(); };
  });
}

/* Presets */
EL("btnSavePreset").addEventListener("click", () => {
  if (PICKED.length === 0) { alert("Dodaj najpierw pozycje."); return; }
  const label = prompt("Nazwa presetu");
  if (!label) return;
  // store a copy of picked items to avoid later mutations affecting the preset
  PRESETS.push({ id: crypto.randomUUID(), label, items: PICKED.map(r => ({ ...r })) });
  savePresets(); renderPresets();
});

renderPresets();

/* PDF */
EL("btnPdf").addEventListener("click", () => {
  if (PICKED.length === 0) { alert("Brak pozycji."); return; }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  let y = margin;

  doc.setFont("helvetica","bold"); doc.setFontSize(16);
  doc.text("Zestawienie wybranych produktów leczniczych (RPL)", margin, y); y += 22;
  doc.setFont("helvetica","normal"); doc.setFontSize(10);
  doc.text("Wygenerowano: " + new Date().toLocaleString(), margin, y); y += 16;

  const headers = ["Nazwa","Postać","Moc","Opak.","Droga","Podmiot","EAN"];
  const widths = [160,90,60,80,60,120,60];

  const drawRow = (cells, bold=false) => {
    let x = margin;
    if (y > 780) { doc.addPage(); y = margin; }
    doc.setFont("helvetica", bold?"bold":"normal");
    cells.forEach((c,i) => {
      const w = widths[i];
      const t = (c||"")+"";
      doc.text(t.length>60 ? t.slice(0,57)+"…" : t, x, y);
      x += w;
    });
    y += 16;
  };

  drawRow(headers, true);
  PICKED.forEach(r => drawRow([r.name, r.form, r.strength, r.pack, r.route, r.mah, r.ean]));

  doc.save("zestawienie_RPL.pdf");
});
