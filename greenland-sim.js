window.PR_REVAMP_ACTIVE = true;
(function () {
  "use strict";

  var REGION_LABELS = {
    north: "Far North / Avannaata",
    disko: "Disko Bay / Qeqertalik",
    central: "Central West / Qeqqata",
    capital: "Capital / East / Sermersooq",
    south: "South / Kujalleq"
  };
  var PALETTE_OPTIONS = ["#7f3fbf", "#0f766e", "#c97b00", "#bd1e51", "#0ea5e9", "#4f772d"];
  var DEFAULT_CONTROLS = {
    islandMood: 0,
    turnoutPulse: 0,
    northCurrent: 0,
    diskoCurrent: 0,
    centralCurrent: 0,
    capitalCurrent: 0,
    southCurrent: 0,
    volatility: 2
  };

  function makeParty(o) {
    return {
      key: o.key,
      label: o.label,
      name: o.name,
      color: o.color,
      ideology: o.ideology || 0,
      strength: o.strength == null ? 50 : o.strength,
      funding: o.funding == null ? 50 : o.funding,
      turnout: o.turnout || 0,
      buzz: o.buzz || 0,
      removable: !!o.removable,
      isBase: o.isBase !== false,
      age: {
        y1829: o.age && o.age.y1829 || 0,
        y3044: o.age && o.age.y3044 || 0,
        y4564: o.age && o.age.y4564 || 0,
        y65p: o.age && o.age.y65p || 0
      },
      region: {
        north: o.region && o.region.north || 0,
        disko: o.region && o.region.disko || 0,
        central: o.region && o.region.central || 0,
        capital: o.region && o.region.capital || 0,
        south: o.region && o.region.south || 0
      }
    };
  }

  function makeDefaultParties() {
    return [
      makeParty({
        key: "dem", label: "DEM", name: "Demokraatit", color: "#2365d1",
        ideology: -12, strength: 57, funding: 63, turnout: 2, buzz: 4,
        age: { y1829: 6, y3044: 5, y4564: -1, y65p: -5 },
        region: { north: 1, disko: 1, central: 0, capital: 6, south: 2 }
      }),
      makeParty({
        key: "sia", label: "SIU", name: "Siumut", color: "#d2353f",
        ideology: 18, strength: 59, funding: 58, turnout: 2, buzz: 1,
        age: { y1829: -2, y3044: 1, y4564: 3, y65p: 3 },
        region: { north: 3, disko: 5, central: 3, capital: 0, south: 4 }
      }),
      makeParty({
        key: "ia", label: "IA", name: "Inuit Ataqatigiit", color: "#2b8a57",
        ideology: 38, strength: 54, funding: 50, turnout: 1, buzz: 0,
        age: { y1829: 4, y3044: 3, y4564: -1, y65p: -3 },
        region: { north: -1, disko: 0, central: -1, capital: 6, south: 1 }
      }),
      makeParty({
        key: "nal", label: "NAL", name: "Naleraq", color: "#8e3bb8",
        ideology: 80, strength: 49, funding: 42, turnout: 3, buzz: 3,
        age: { y1829: 2, y3044: 1, y4564: 2, y65p: -1 },
        region: { north: 8, disko: 2, central: 7, capital: -4, south: -3 }
      }),
      makeParty({
        key: "ata", label: "ATA", name: "Atassut", color: "#de8b23",
        ideology: -62, strength: 34, funding: 34, turnout: -1, buzz: -2,
        age: { y1829: -4, y3044: -2, y4564: 1, y65p: 4 },
        region: { north: 2, disko: 2, central: 1, capital: -2, south: -1 }
      }),
      makeParty({
        key: "qul", label: "QUL", name: "Qulleq", color: "#4f6f52",
        ideology: 64, strength: 18, funding: 16, turnout: 0, buzz: 1,
        age: { y1829: 0, y3044: 1, y4564: 2, y65p: -1 },
        region: { north: 0, disko: 0, central: 1, capital: -3, south: 3 }
      })
    ];
  }

  var MUNICIPALITIES = [
    {
      name: "Avannaata",
      region: "north",
      population: 10846,
      registered: 8013,
      validVotes: 4823,
      axis: 28,
      age: { y1829: 19, y3044: 25, y4564: 36, y65p: 20 },
      baseVotes: { sia: 1755, dem: 1245, nal: 838, ata: 546, ia: 414, qul: 25 }
    },
    {
      name: "Kujalleq",
      region: "south",
      population: 6145,
      registered: 4567,
      validVotes: 2753,
      axis: 2,
      age: { y1829: 16, y3044: 22, y4564: 34, y65p: 28 },
      baseVotes: { dem: 1089, sia: 831, ia: 619, ata: 129, qul: 65, nal: 20 }
    },
    {
      name: "Qeqertalik",
      region: "disko",
      population: 6058,
      registered: 4430,
      validVotes: 2517,
      axis: 10,
      age: { y1829: 17, y3044: 23, y4564: 36, y65p: 24 },
      baseVotes: { sia: 995, dem: 672, ia: 455, ata: 213, nal: 182 }
    },
    {
      name: "Qeqqata",
      region: "central",
      population: 9204,
      registered: 6633,
      validVotes: 3671,
      axis: 24,
      age: { y1829: 21, y3044: 27, y4564: 35, y65p: 17 },
      baseVotes: { sia: 1231, nal: 871, dem: 781, ia: 408, ata: 298, qul: 82 }
    },
    {
      name: "Sermersooq",
      region: "capital",
      population: 24382,
      registered: 17792,
      validVotes: 7686,
      axis: -16,
      age: { y1829: 26, y3044: 31, y4564: 29, y65p: 14 },
      baseVotes: { ia: 2767, sia: 2511, dem: 1665, nal: 498, ata: 202, qul: 43 }
    }
  ];

  var PRESETS = {
    baseline: { controls: { islandMood: 0, turnoutPulse: 0, northCurrent: 0, diskoCurrent: 0, centralCurrent: 0, capitalCurrent: 0, southCurrent: 0, volatility: 2 } },
    "demokraatit-surge": { controls: { islandMood: -5, turnoutPulse: 3, northCurrent: -2, diskoCurrent: -1, centralCurrent: -3, capitalCurrent: -7, southCurrent: -3, volatility: 2.5 } },
    "ia-comeback": { controls: { islandMood: 6, turnoutPulse: 4, northCurrent: 2, diskoCurrent: 3, centralCurrent: 1, capitalCurrent: 8, southCurrent: 2, volatility: 3.5 } },
    "siumut-machine": { controls: { islandMood: 4, turnoutPulse: 1, northCurrent: 4, diskoCurrent: 6, centralCurrent: 4, capitalCurrent: -1, southCurrent: 7, volatility: 2 } },
    "naleraq-breakthrough": { controls: { islandMood: 14, turnoutPulse: 2, northCurrent: 10, diskoCurrent: 4, centralCurrent: 9, capitalCurrent: -8, southCurrent: -6, volatility: 4 } },
    "quiet-cycle": { controls: { islandMood: 0, turnoutPulse: -8, northCurrent: 0, diskoCurrent: 0, centralCurrent: 0, capitalCurrent: 0, southCurrent: 0, volatility: 0.8 } }
  };

  var state = {
    parties: makeDefaultParties(),
    nextPartyId: 1,
    regions: [],
    selectedId: null,
    seed: 20250326,
    controls: cloneControls(DEFAULT_CONTROLS)
  };

  var svg = null;
  var projection = null;
  var pathGen = null;
  var tooltipEl = null;
  var ttTitle = null;
  var ttMeta = null;
  var ttCands = null;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    tooltipEl = document.getElementById("map-tooltip");
    ttTitle = document.getElementById("tt-title");
    ttMeta = document.getElementById("tt-meta");
    ttCands = document.getElementById("tt-candidates");
    syncControls();
    renderPartyPanel();
    renderBoostButtons();
    renderScoreGrid();
    renderVoteStrip();
    bindControls();
    buildMap();
  }

  function cloneControls(src) {
    var out = {};
    Object.keys(src).forEach(function (k) { out[k] = src[k]; });
    return out;
  }
  function seededRand(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967295;
    };
  }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function signedStr(v, digits) {
    var n = Number(v);
    var d = digits == null ? 0 : digits;
    return (n >= 0 ? "+" : "") + n.toFixed(d);
  }
  function hexToRgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }
  function rgbToHex(r, g, b) {
    return "#" + [r, g, b].map(function (v) { return Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0"); }).join("");
  }
  function partyShades(color) {
    var c = hexToRgb(color);
    return [
      rgbToHex(c[0] * 0.22 + 236 * 0.78, c[1] * 0.22 + 227 * 0.78, c[2] * 0.22 + 214 * 0.78),
      rgbToHex(c[0] * 0.55 + 236 * 0.45, c[1] * 0.55 + 227 * 0.45, c[2] * 0.55 + 214 * 0.45),
      color,
      rgbToHex(c[0] * 0.62, c[1] * 0.62, c[2] * 0.62)
    ];
  }
  function escapeHtml(str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;");
  }
  function ideologyLabel(v) {
    if (v <= -60) return "Unionist / status quo";
    if (v <= -20) return "Moderate unionist";
    if (v < 20) return "Pragmatic autonomy";
    if (v < 60) return "Autonomist";
    return "Rapid independence";
  }
  function zeroOverride() {
    var out = {};
    state.parties.forEach(function (p) { out[p.key] = 0; });
    return out;
  }
  function getRegionCurrent(region) {
    return region === "north" ? state.controls.northCurrent :
      region === "disko" ? state.controls.diskoCurrent :
      region === "central" ? state.controls.centralCurrent :
      region === "capital" ? state.controls.capitalCurrent :
      state.controls.southCurrent;
  }
  function rangeDisplay(field, value) {
    if (field === "ideology") return ideologyLabel(value);
    if (field === "strength" || field === "funding") return String(Math.round(value));
    return signedStr(value, 0);
  }
  function setControlReadout(key, value) {
    var el = document.getElementById(key + "-value");
    if (!el) return;
    el.textContent = key === "volatility" ? Number(value).toFixed(1) : signedStr(value, 0);
  }
  function syncControls() {
    Object.keys(DEFAULT_CONTROLS).forEach(function (key) {
      var input = document.getElementById(key);
      if (input) input.value = state.controls[key];
      setControlReadout(key, state.controls[key]);
    });
  }

  function bindControls() {
    Object.keys(DEFAULT_CONTROLS).forEach(function (key) {
      var input = document.getElementById(key);
      if (!input) return;
      input.addEventListener("input", function () {
        state.controls[key] = Number(input.value);
        setControlReadout(key, state.controls[key]);
        if (state.regions.length) simulateAndRender(false);
      });
    });

    document.getElementById("apply-preset").addEventListener("click", function () {
      var key = document.getElementById("preset-select").value;
      if (!key || !PRESETS[key]) return;
      state.controls = cloneControls(DEFAULT_CONTROLS);
      Object.keys(PRESETS[key].controls).forEach(function (ctrlKey) { state.controls[ctrlKey] = PRESETS[key].controls[ctrlKey]; });
      syncControls();
      if (state.regions.length) simulateAndRender(true);
    });
    document.getElementById("reroll-button").addEventListener("click", function () { if (state.regions.length) simulateAndRender(true); });
    document.getElementById("reset-button").addEventListener("click", function () {
      state.controls = cloneControls(DEFAULT_CONTROLS);
      state.parties = makeDefaultParties();
      state.nextPartyId = 1;
      state.regions.forEach(function (r) { r.override = zeroOverride(); });
      state.selectedId = null;
      document.getElementById("region-panel").classList.add("is-hidden");
      syncControls();
      renderPartyPanel();
      renderBoostButtons();
      renderScoreGrid();
      renderVoteStrip();
      if (state.regions.length) simulateAndRender(true);
    });
    document.getElementById("add-party").addEventListener("click", addParty);
    document.getElementById("reset-parties").addEventListener("click", function () {
      state.parties = makeDefaultParties();
      state.nextPartyId = 1;
      state.regions.forEach(function (r) { r.override = zeroOverride(); });
      renderPartyPanel();
      renderBoostButtons();
      renderScoreGrid();
      renderVoteStrip();
      if (state.regions.length) simulateAndRender(false);
    });
    document.getElementById("party-list").addEventListener("click", handlePartyListClick);
    document.getElementById("party-list").addEventListener("input", handlePartyListInput);
    document.getElementById("party-list").addEventListener("change", handlePartyListChange);
  }

  function addParty() {
    var idx = state.nextPartyId++;
    var color = PALETTE_OPTIONS[(idx - 1) % PALETTE_OPTIONS.length];
    var party = makeParty({
      key: "custom" + idx,
      label: "C" + idx,
      name: "Custom Party " + idx,
      color: color,
      ideology: 0,
      strength: 14,
      funding: 12,
      turnout: 0,
      buzz: 0,
      removable: true,
      isBase: false
    });
    state.parties.push(party);
    state.regions.forEach(function (r) { r.override[party.key] = 0; });
    renderPartyPanel();
    renderBoostButtons();
    renderScoreGrid();
    renderVoteStrip();
    if (state.regions.length) simulateAndRender(false);
  }

  function handlePartyListClick(event) {
    var btn = event.target.closest(".party-remove");
    if (!btn) return;
    var key = btn.getAttribute("data-key");
    var party = state.parties.find(function (p) { return p.key === key; });
    if (!party || !party.removable) return;
    state.parties = state.parties.filter(function (p) { return p.key !== key; });
    state.regions.forEach(function (r) {
      delete r.override[key];
      if (r.result) delete r.result[key];
    });
    renderPartyPanel();
    renderBoostButtons();
    renderScoreGrid();
    renderVoteStrip();
    if (state.regions.length) simulateAndRender(false);
  }

  function handlePartyListInput(event) {
    var el = event.target;
    var key = el.getAttribute("data-key");
    if (!key) return;
    var party = state.parties.find(function (p) { return p.key === key; });
    if (!party) return;
    var field = el.getAttribute("data-field");
    var ageKey = el.getAttribute("data-age");
    var regionKey = el.getAttribute("data-region");
    var value = el.type === "range" ? Number(el.value) : el.value;

    if (field) {
      party[field] = value;
      if (field === "color") {
        refreshPartyCardColor(party);
        return;
      } else if (field === "name") {
        var nameEl = document.querySelector('.party-card[data-key="' + party.key + '"] .party-name-display');
        if (nameEl) nameEl.textContent = party.name;
        renderScoreGrid();
      } else if (field === "label" || field === "ideology") {
        var labelEl = document.querySelector('.party-card[data-key="' + party.key + '"] .party-label-display');
        if (labelEl) labelEl.textContent = party.label + " • " + ideologyLabel(party.ideology);
      }
    } else if (ageKey) {
      party.age[ageKey] = value;
    } else if (regionKey) {
      party.region[regionKey] = value;
    }

    if (el.type === "range") {
      var holder = el.closest(".party-field");
      var live = holder ? holder.querySelector("[data-live]") : null;
      if (live) live.textContent = rangeDisplay(field || ageKey || regionKey, value);
    }
    if (state.regions.length) simulateAndRender(false);
  }

  function handlePartyListChange(event) {
    var el = event.target;
    if (el.type !== "color") return;
    var key = el.getAttribute("data-key");
    if (!key) return;
    var party = state.parties.find(function (p) { return p.key === key; });
    if (!party) return;
    party.color = el.value;
    refreshPartyCardColor(party);
    renderBoostButtons();
    renderScoreGrid();
    renderVoteStrip();
    if (state.regions.length) simulateAndRender(false);
  }

  function refreshPartyCardColor(party) {
    var card = document.querySelector('.party-card[data-key="' + party.key + '"]');
    if (!card) return;
    var shades = partyShades(party.color);
    card.style.borderLeftColor = party.color;
    var nameEl = card.querySelector(".party-name-display");
    if (nameEl) nameEl.style.color = party.color;
    var preview = card.querySelectorAll(".party-palette-preview span");
    preview.forEach(function (swatch, index) {
      swatch.style.background = shades[index] || party.color;
    });
  }

  function tfld(label, field, val, key, maxLen) {
    return '<label class="party-field"><span>' + escapeHtml(label) + '</span>' +
      '<input type="text" data-key="' + escapeHtml(key) + '" data-field="' + escapeHtml(field) + '"' +
      (maxLen ? ' maxlength="' + maxLen + '"' : '') +
      ' value="' + escapeHtml(val) + '"></label>';
  }
  function rfld(label, field, val, min, max, step, disp, key) {
    return '<label class="party-field"><span class="party-field__row"><span>' + escapeHtml(label) + '</span>' +
      '<span data-live="1">' + escapeHtml(String(disp)) + '</span></span>' +
      '<input type="range" data-key="' + escapeHtml(key) + '" data-field="' + escapeHtml(field) + '" min="' + min + '" max="' + max + '" step="' + step + '" value="' + val + '"></label>';
  }
  function gfld(label, attr, name, val, key) {
    return '<label class="party-field"><span class="party-field__row"><span>' + escapeHtml(label) + '</span>' +
      '<span data-live="1">' + escapeHtml(signedStr(val, 0)) + '</span></span>' +
      '<input type="range" data-key="' + escapeHtml(key) + '" ' + attr + '="' + escapeHtml(name) + '" min="-20" max="20" step="1" value="' + val + '"></label>';
  }
  function detailSection(sectionKey, partyKey, title, body) {
    return '<details class="party-section" data-open-key="' + escapeHtml(sectionKey + "-" + partyKey) + '">' +
      '<summary class="party-section__head">' + escapeHtml(title) + '</summary>' +
      '<div class="party-section__body">' + body + '</div></details>';
  }

  function renderPartyPanel() {
    var container = document.getElementById("party-list");
    var open = {};
    container.querySelectorAll("details[data-open-key][open]").forEach(function (d) { open[d.getAttribute("data-open-key")] = true; });

    container.innerHTML = state.parties.map(function (p) {
      var shades = partyShades(p.color);
      var removeBtn = p.removable ? '<button class="party-remove" data-key="' + escapeHtml(p.key) + '" type="button" title="Remove party">&times;</button>' : "";
      var ageSec = detailSection("age", p.key, "Age Support",
        gfld("18-29", "data-age", "y1829", p.age.y1829, p.key) +
        gfld("30-44", "data-age", "y3044", p.age.y3044, p.key) +
        gfld("45-64", "data-age", "y4564", p.age.y4564, p.key) +
        gfld("65+", "data-age", "y65p", p.age.y65p, p.key));
      var regSec = detailSection("region", p.key, "Regional Strength",
        gfld(REGION_LABELS.north, "data-region", "north", p.region.north, p.key) +
        gfld(REGION_LABELS.disko, "data-region", "disko", p.region.disko, p.key) +
        gfld(REGION_LABELS.central, "data-region", "central", p.region.central, p.key) +
        gfld(REGION_LABELS.capital, "data-region", "capital", p.region.capital, p.key) +
        gfld(REGION_LABELS.south, "data-region", "south", p.region.south, p.key));
      return [
        '<article class="party-card" data-key="' + escapeHtml(p.key) + '" style="border-left:4px solid ' + p.color + ';">',
        '<div class="party-card__top"><div>',
        '<div class="party-palette-preview">' + shades.map(function (s) { return '<span style="background:' + s + '"></span>'; }).join("") + '</div>',
        '<strong class="party-name-display" style="color:' + p.color + ';">' + escapeHtml(p.name) + '</strong>',
        '<div class="party-label-display" style="font-size:0.78rem;color:var(--muted);margin-top:0.18rem;">' + escapeHtml(p.label + " • " + ideologyLabel(p.ideology)) + '</div>',
        '</div>' + removeBtn + '</div>',
        '<div class="party-fields">',
        tfld("Label", "label", p.label, p.key, 8),
        tfld("Name", "name", p.name, p.key),
        rfld("Ideology", "ideology", p.ideology, -100, 100, 1, ideologyLabel(p.ideology), p.key),
        rfld("Party Strength", "strength", p.strength, 0, 100, 1, p.strength, p.key),
        rfld("Funding", "funding", p.funding, 0, 100, 1, p.funding, p.key),
        rfld("Turnout Pull", "turnout", p.turnout, -20, 20, 1, signedStr(p.turnout, 0), p.key),
        rfld("Buzz", "buzz", p.buzz, -20, 20, 1, signedStr(p.buzz, 0), p.key),
        '<label class="party-field party-field--color"><span>Color</span><input type="color" data-key="' + escapeHtml(p.key) + '" data-field="color" value="' + p.color + '"></label>',
        ageSec,
        regSec,
        '</div></article>'
      ].join("");
    }).join("");

    container.querySelectorAll("details[data-open-key]").forEach(function (d) {
      if (open[d.getAttribute("data-open-key")]) d.open = true;
    });
  }

  function formatInt(value) {
    return Math.round(value).toLocaleString("en-US");
  }

  function renderScoreGrid() {
    var grid = document.getElementById("score-grid");
    if (!grid) return;
    grid.innerHTML = state.parties.map(function (p) {
      var shades = partyShades(p.color);
      return [
        '<div class="score-card" style="background:linear-gradient(135deg,' + shades[0] + ',rgba(255,255,255,0.72));border-color:' + shades[1] + ';">',
        '<p class="score-card__label" id="' + escapeHtml(p.key) + '-label" style="color:' + p.color + ';">' + escapeHtml(p.label) + '</p>',
        '<p class="score-card__value" id="' + escapeHtml(p.key) + '-count" style="color:' + p.color + ';">0</p>',
        '<p class="score-card__sub" id="' + escapeHtml(p.key) + '-sub">' + escapeHtml(p.name) + '</p>',
        '</div>'
      ].join("");
    }).join("");
  }

  function renderVoteStrip() {
    var labelsEl = document.getElementById("vote-strip-labels");
    var stripEl = document.getElementById("vote-strip");
    if (!labelsEl || !stripEl) return;
    var width = state.parties.length ? (100 / state.parties.length).toFixed(1) : "0";
    labelsEl.innerHTML = state.parties.map(function (p) {
      return '<span id="' + escapeHtml(p.key) + '-pct-label" style="color:' + p.color + ';font-weight:700;">' + escapeHtml(p.label) + ' 0.0%</span>';
    }).join("");
    stripEl.innerHTML = state.parties.map(function (p) {
      return '<div class="vote-strip__seg" id="strip-' + escapeHtml(p.key) + '" style="background:' + p.color + ';width:' + width + '%;"></div>';
    }).join("");
  }

  function renderBoostButtons() {
    var container = document.getElementById("region-actions");
    if (!container) return;
    container.innerHTML = state.parties.map(function (p) {
      var shades = partyShades(p.color);
      return '<button id="boost-' + escapeHtml(p.key) + '" class="button" style="font-size:0.82rem;background:' + shades[0] + ';border-color:' + shades[1] + ';color:' + p.color + ';">+' + escapeHtml(p.label) + '</button>';
    }).join("") + '<button id="reset-region" class="button button--ghost" style="font-size:0.82rem;">Reset</button>';
    bindBoostButtons();
  }

  function bindBoostButtons() {
    state.parties.forEach(function (p) {
      var btn = document.getElementById("boost-" + p.key);
      if (!btn) return;
      btn.addEventListener("click", function () { nudgeSelected(p.key, 4); });
    });
    var reset = document.getElementById("reset-region");
    if (reset) reset.addEventListener("click", clearSelectedOverride);
  }

  function buildMap() {
    if (!window.GREENLAND_TOPO || !window.topojson || !window.d3) {
      document.getElementById("map-status").textContent = "Greenland map data is missing.";
      return;
    }

    var topoObject = window.GREENLAND_TOPO.objects && window.GREENLAND_TOPO.objects.GRLADM1gbOpen;
    if (!topoObject) {
      document.getElementById("map-status").textContent = "Greenland municipality layer not found.";
      return;
    }

    var featureCollection = topojson.feature(window.GREENLAND_TOPO, topoObject);
    var shell = document.getElementById("map-shell");
    var W = 780;
    var H = 520;
    var activeFeatures = featureCollection.features.filter(function (feature) {
      return feature.properties.shapeName !== "Northeast Greenland National Park";
    });

    // A Greenland-tuned conic projection reads closer to published election maps
    // than a plain mercator fit and keeps the island looking tall and upright.
    // Fit against the full island geometry so the inactive national-park side
    // still stays inside the map frame.
    projection = d3.geoConicEqualArea()
      .rotate([42, 0])
      .center([0, 72])
      .parallels([60, 83])
      .fitExtent([[96, 16], [W - 96, H - 16]], {
        type: "FeatureCollection",
        features: featureCollection.features
      });
    pathGen = d3.geoPath().projection(projection);

    svg = d3.select(shell)
      .append("svg")
      .attr("viewBox", "0 0 " + W + " " + H)
      .attr("aria-label", "Greenland municipality map");

    var muniByName = {};
    MUNICIPALITIES.forEach(function (muni) {
      muniByName[muni.name.toLowerCase()] = muni;
    });

    state.regions = featureCollection.features.map(function (feature) {
      var shapeName = String(feature.properties.shapeName || "").trim();
      var isPark = shapeName === "Northeast Greenland National Park";
      return {
        feature: feature,
        muni: isPark ? null : muniByName[shapeName.toLowerCase()] || null,
        override: zeroOverride(),
        result: null,
        votes: null,
        totalVotes: 0,
        winner: null,
        margin: 0,
        inactive: isPark,
        path: null
      };
    });

    var group = svg.append("g");
    state.regions.forEach(function (region, idx) {
      var node = group.append("path")
        .datum(region.feature)
        .attr("d", pathGen)
        .attr("fill", region.inactive ? "#d9d1c6" : "#e2d7c7")
        .attr("opacity", region.inactive ? 0.9 : 1);
      region.path = node;

      if (region.inactive || !region.muni) {
        node.style("cursor", "default");
        return;
      }

      node
        .on("mouseenter", function (event) { showTooltip(event, region); })
        .on("mousemove", function (event) { moveTooltip(event); })
        .on("mouseleave", hideTooltip)
        .on("click", function () { selectRegion(idx); });
    });

    document.getElementById("map-status").innerHTML =
      '<span class="map-status__headline">5 municipalities loaded</span>' +
      '<span class="map-status__line">Northeast Greenland National Park is shown as inactive land.</span>';

    simulateAndRender(true);
  }

  function simulateAndRender(reroll) {
    if (!state.regions.length) return;
    if (reroll) state.seed = Math.floor(Math.random() * 1000000000);
    var rand = seededRand(state.seed);

    state.regions.forEach(function (region) {
      if (region.inactive || !region.muni) return;

      var muni = region.muni;
      var localAxis = muni.axis + state.controls.islandMood + getRegionCurrent(muni.region);
      var turnoutScale = clamp(1 + (state.controls.turnoutPulse / 100), 0.58, 1.35);
      var totalVotes = Math.max(500, Math.round(muni.validVotes * turnoutScale));
      var weighted = {};

      state.parties.forEach(function (party) {
        var base = muni.baseVotes[party.key];
        if (base == null) base = Math.max(10, totalVotes * 0.01);

        var ideologyDistance = Math.abs(localAxis - party.ideology);
        var ideologyFactor = clamp(1.5 - ideologyDistance / 130, 0.28, 1.48);
        var strengthFactor = 0.48 + party.strength / 100 * 1.02;
        var fundingFactor = 0.55 + party.funding / 100 * 0.92;
        var turnoutFactor = clamp(1 + party.turnout / 55, 0.55, 1.45);
        var buzzFactor = clamp(1 + party.buzz / 60, 0.55, 1.45);
        var ageAdj =
          muni.age.y1829 * party.age.y1829 +
          muni.age.y3044 * party.age.y3044 +
          muni.age.y4564 * party.age.y4564 +
          muni.age.y65p * party.age.y65p;
        var ageFactor = clamp(1 + ageAdj / 3200, 0.6, 1.52);
        var regionFactor = clamp(1 + (party.region[muni.region] || 0) / 45, 0.56, 1.55);
        var overrideFactor = clamp(1 + (region.override[party.key] || 0) / 40, 0.5, 1.7);
        var noiseFactor = clamp(1 + ((rand() * 2 - 1) * state.controls.volatility / 28), 0.72, 1.28);

        weighted[party.key] = Math.max(0.1, base * ideologyFactor * strengthFactor * fundingFactor * turnoutFactor * buzzFactor * ageFactor * regionFactor * overrideFactor * noiseFactor);
      });

      var sum = state.parties.reduce(function (acc, party) {
        return acc + weighted[party.key];
      }, 0);

      region.result = {};
      region.votes = {};
      var assignedVotes = 0;
      state.parties.forEach(function (party, index) {
        var share = sum ? weighted[party.key] / sum : 0;
        var votes = index === state.parties.length - 1
          ? Math.max(0, totalVotes - assignedVotes)
          : Math.round(totalVotes * share);
        assignedVotes += votes;
        region.votes[party.key] = votes;
        region.result[party.key] = totalVotes ? votes / totalVotes * 100 : 0;
      });
      region.totalVotes = totalVotes;

      var ordered = state.parties.map(function (party) {
        return { key: party.key, pct: region.result[party.key] || 0 };
      }).sort(function (a, b) { return b.pct - a.pct; });
      region.winner = ordered[0] ? ordered[0].key : null;
      region.margin = ordered.length > 1 ? ordered[0].pct - ordered[1].pct : 0;
    });

    renderMap();
    renderScores();
    renderCloseRaces();
    if (state.selectedId !== null) renderRegionPanel(state.selectedId);
  }

  function partyColorForMap(partyKey, margin) {
    var party = state.parties.find(function (entry) { return entry.key === partyKey; });
    if (!party) return "#d9d1c6";
    var shades = partyShades(party.color);
    if (margin < 4) return shades[0];
    if (margin < 10) return shades[1];
    if (margin < 20) return shades[2];
    return shades[3];
  }

  function renderMap() {
    state.regions.forEach(function (region, idx) {
      if (!region.path) return;
      if (region.inactive || !region.result) {
        region.path
          .attr("fill", "#d9d1c6")
          .classed("selected", false);
        return;
      }
      region.path
        .attr("fill", partyColorForMap(region.winner, region.margin))
        .classed("selected", state.selectedId === idx);
    });
  }

  function describePieSlice(cx, cy, radius, startAngle, endAngle) {
    var sweep = endAngle - startAngle;
    if (sweep >= Math.PI * 2 - 0.0001) {
      return ["M", cx, cy - radius, "A", radius, radius, 0, 1, 1, cx - 0.01, cy - radius, "L", cx, cy, "Z"].join(" ");
    }
    var start = polarToCartesian(cx, cy, radius, startAngle);
    var end = polarToCartesian(cx, cy, radius, endAngle);
    return ["M", cx, cy, "L", start.x.toFixed(2), start.y.toFixed(2), "A", radius, radius, 0, sweep > Math.PI ? 1 : 0, 1, end.x.toFixed(2), end.y.toFixed(2), "Z"].join(" ");
  }

  function polarToCartesian(cx, cy, radius, angle) {
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  }

  function renderVotePie(partyShares) {
    var size = 208;
    var cx = 104;
    var cy = 104;
    var radius = 82;
    var angle = -Math.PI / 2;
    var leader = partyShares[0] || null;
    var defaultName = leader ? leader.party.label : "-";
    var defaultShare = leader ? leader.pct.toFixed(1) + "%" : "-";
    var defaultDetail = leader ? leader.party.name : "Hover a slice";

    var slices = partyShares.map(function (entry) {
      var sweep = (entry.pct / 100) * Math.PI * 2;
      var endAngle = angle + sweep;
      var d = describePieSlice(cx, cy, radius, angle, endAngle);
      angle = endAngle;
      var aria = entry.party.label + ": " + entry.pct.toFixed(1) + "%";
      return '<path class="vote-pie__slice" d="' + d + '" fill="' + entry.party.color + '"' +
        ' data-pie-name="' + escapeHtml(entry.party.label) + '"' +
        ' data-pie-share="' + entry.pct.toFixed(1) + '%"' +
        ' data-pie-detail="' + escapeHtml(entry.party.name) + '"' +
        ' tabindex="0" aria-label="' + escapeHtml(aria) + '"><title>' + escapeHtml(aria) + '</title></path>';
    }).join("");

    return '<div class="vote-pie-wrap">' +
      '<div class="vote-pie" id="vote-pie"' +
      ' data-default-name="' + escapeHtml(defaultName) + '"' +
      ' data-default-share="' + escapeHtml(defaultShare) + '"' +
      ' data-default-detail="' + escapeHtml(defaultDetail) + '">' +
      '<svg class="vote-pie__svg" viewBox="0 0 ' + size + ' ' + size + '" aria-label="Popular vote pie chart">' + slices + '</svg>' +
      '</div>' +
      '<div class="vote-pie__readout">' +
      '<span class="vote-pie__eyebrow" id="pie-eyebrow">' + escapeHtml(defaultDetail) + '</span>' +
      '<strong class="vote-pie__label" id="pie-label">' + escapeHtml(defaultName) + '</strong>' +
      '<span class="vote-pie__share" id="pie-share">' + escapeHtml(defaultShare) + '</span>' +
      '</div>' +
      '</div>';
  }

  function updatePie(partyShares) {
    var container = document.getElementById("pie-container");
    if (!container) return;
    container.innerHTML = renderVotePie(partyShares);
    var pie = container.querySelector(".vote-pie");
    if (!pie) return;
    pie.addEventListener("mouseover", function (event) {
      var slice = event.target.closest("[data-pie-name]");
      if (!slice) return;
      document.getElementById("pie-eyebrow").textContent = slice.getAttribute("data-pie-detail") || "";
      document.getElementById("pie-label").textContent = slice.getAttribute("data-pie-name") || "";
      document.getElementById("pie-share").textContent = slice.getAttribute("data-pie-share") || "";
    });
    pie.addEventListener("mouseleave", function () {
      document.getElementById("pie-eyebrow").textContent = pie.getAttribute("data-default-detail") || "";
      document.getElementById("pie-label").textContent = pie.getAttribute("data-default-name") || "";
      document.getElementById("pie-share").textContent = pie.getAttribute("data-default-share") || "";
    });
  }

  function renderScores() {
    var totals = {};
    var totalVotes = 0;
    state.parties.forEach(function (party) { totals[party.key] = 0; });

    state.regions.forEach(function (region) {
      if (region.inactive || !region.votes) return;
      totalVotes += region.totalVotes || 0;
      state.parties.forEach(function (party) {
        totals[party.key] += region.votes[party.key] || 0;
      });
    });

    var partyShares = state.parties.map(function (party) {
      return {
        party: party,
        votes: totals[party.key],
        pct: totalVotes ? totals[party.key] / totalVotes * 100 : 0
      };
    }).sort(function (a, b) {
      return b.votes - a.votes;
    });

    updatePie(partyShares);

    state.parties.forEach(function (party) {
      var labelEl = document.getElementById(party.key + "-label");
      var valueEl = document.getElementById(party.key + "-count");
      var subEl = document.getElementById(party.key + "-sub");
      var stripEl = document.getElementById("strip-" + party.key);
      var pctLabel = document.getElementById(party.key + "-pct-label");
      var pct = totalVotes ? totals[party.key] / totalVotes * 100 : 0;
      if (labelEl) {
        labelEl.textContent = party.label;
        labelEl.style.color = party.color;
      }
      if (valueEl) {
        valueEl.textContent = formatInt(totals[party.key]);
        valueEl.style.color = party.color;
      }
      if (subEl) subEl.textContent = party.name + " - " + pct.toFixed(1) + "%";
      if (stripEl) {
        stripEl.style.width = pct.toFixed(1) + "%";
        stripEl.style.background = party.color;
      }
      if (pctLabel) {
        pctLabel.textContent = party.label + " " + pct.toFixed(1) + "%";
        pctLabel.style.color = party.color;
      }
    });

    var leader = partyShares[0] || null;
    var runnerUp = partyShares[1] || null;
    var headline = document.getElementById("winner-headline");
    var subline = document.getElementById("winner-subline");
    var banner = document.getElementById("winner-banner");

    if (!leader) {
      if (headline) headline.textContent = "No projection";
      if (subline) subline.textContent = "Waiting for municipality results.";
      if (banner) banner.textContent = "Waiting for projection.";
      return;
    }

    var margin = runnerUp ? leader.pct - runnerUp.pct : leader.pct;
    if (headline) headline.textContent = leader.party.name + " leads Greenland";
    if (subline) {
      subline.textContent = formatInt(leader.votes) + " votes (" + leader.pct.toFixed(1) + "%), ahead by " + margin.toFixed(1) + " points.";
    }
    if (banner) {
      var rgb = hexToRgb(leader.party.color);
      banner.textContent = leader.party.label + " leads the islandwide popular vote with " + leader.pct.toFixed(1) + "%";
      banner.style.background = "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0.12)";
      banner.style.color = rgbToHex(rgb[0] * 0.45, rgb[1] * 0.45, rgb[2] * 0.45);
      banner.style.border = "1px solid rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ",0.25)";
      banner.className = "winner-banner";
    }

    var status = document.getElementById("map-status");
    if (status) {
      status.innerHTML =
        '<span class="map-status__headline">5 municipalities loaded</span>' +
        '<span class="map-status__line">Projected turnout: ' + formatInt(totalVotes) + ' valid votes islandwide.</span>' +
        '<span class="map-status__breakdown">' +
        partyShares.slice(0, 3).map(function (entry) {
          return '<span class="map-status__chip"><span class="map-status__dot" style="background:' + entry.party.color + ';"></span>' +
            escapeHtml(entry.party.label) + ' ' + entry.pct.toFixed(1) + '%</span>';
        }).join("") +
        '</span>';
    }
  }

  function renderCloseRaces() {
    var container = document.getElementById("close-races");
    if (!container) return;
    var rows = state.regions.filter(function (region) {
      return !region.inactive && region.result;
    }).map(function (region) {
      var ordered = state.parties.map(function (party) {
        return { key: party.key, pct: region.result[party.key] || 0 };
      }).sort(function (a, b) { return b.pct - a.pct; });
      return {
        name: region.muni.name,
        winner: ordered[0] ? ordered[0].key : null,
        margin: ordered.length > 1 ? ordered[0].pct - ordered[1].pct : 0
      };
    }).sort(function (a, b) {
      return a.margin - b.margin;
    }).slice(0, 5);

    container.innerHTML = rows.map(function (row) {
      var party = state.parties.find(function (entry) { return entry.key === row.winner; });
      if (!party) return "";
      return '<div class="race-item">' +
        '<span class="race-item__swatch" style="background:' + party.color + ';"></span>' +
        '<span class="race-item__name">' + escapeHtml(row.name) + '</span>' +
        '<span class="race-item__margin">' + escapeHtml(party.label) + ' +' + row.margin.toFixed(1) + '%</span>' +
        '</div>';
    }).join("");
  }

  function selectRegion(index) {
    var region = state.regions[index];
    if (!region || region.inactive || !region.muni) return;
    state.selectedId = state.selectedId === index ? null : index;
    renderMap();
    if (state.selectedId === null) {
      document.getElementById("region-panel").classList.add("is-hidden");
      return;
    }
    document.getElementById("region-panel").classList.remove("is-hidden");
    renderRegionPanel(state.selectedId);
  }

  function renderRegionPanel(index) {
    var region = state.regions[index];
    if (!region || !region.muni || !region.result) return;
    var ordered = state.parties.map(function (party) {
      return { party: party, pct: region.result[party.key] || 0, votes: region.votes[party.key] || 0 };
    }).sort(function (a, b) { return b.votes - a.votes; });
    var leader = ordered[0];
    var runnerUp = ordered[1];
    var hasOverride = Object.keys(region.override).some(function (key) { return (region.override[key] || 0) !== 0; });

    document.getElementById("region-title").textContent = region.muni.name;
    document.getElementById("region-summary").textContent =
      leader.party.label + " leads by " + (runnerUp ? (leader.pct - runnerUp.pct).toFixed(1) : leader.pct.toFixed(1)) +
      " points in " + REGION_LABELS[region.muni.region] +
      " - " + formatInt(region.totalVotes) + " projected votes" +
      (hasOverride ? " - local override active" : "");

    document.getElementById("region-breakdown").innerHTML = ordered.map(function (entry) {
      return '<div class="race-item">' +
        '<span class="race-item__swatch" style="background:' + entry.party.color + ';"></span>' +
        '<span class="race-item__name">' + escapeHtml(entry.party.name) + '</span>' +
        '<span class="race-item__margin">' + formatInt(entry.votes) + ' • ' + entry.pct.toFixed(1) + '%</span>' +
        '</div>';
    }).join("");
  }

  function nudgeSelected(partyKey, points) {
    if (state.selectedId === null) return;
    var region = state.regions[state.selectedId];
    if (!region || !region.override) return;
    region.override[partyKey] = clamp((region.override[partyKey] || 0) + points, -25, 25);
    var others = state.parties.map(function (party) { return party.key; }).filter(function (key) { return key !== partyKey; });
    others.forEach(function (key) {
      region.override[key] = clamp((region.override[key] || 0) - points / Math.max(1, others.length), -25, 25);
    });
    simulateAndRender(false);
  }

  function clearSelectedOverride() {
    if (state.selectedId === null) return;
    state.regions[state.selectedId].override = zeroOverride();
    simulateAndRender(false);
  }

  function candidateLine(name, pct, votes, color) {
    return '<div class="candidate-line">' +
      '<span class="candidate-line__swatch" style="background:' + color + ';"></span>' +
      '<span>' + escapeHtml(name) + '</span>' +
      '<span class="candidate-line__pct">' + pct.toFixed(1) + '% • ' + formatInt(votes) + '</span>' +
      '</div>';
  }

  function showTooltip(event, region) {
    if (!tooltipEl || !region || !region.muni || !region.result) return;
    ttTitle.textContent = region.muni.name;
    ttMeta.textContent = REGION_LABELS[region.muni.region] + " • " + formatInt(region.totalVotes) + " votes";
    var ordered = state.parties.map(function (party) {
      return { party: party, pct: region.result[party.key] || 0, votes: region.votes[party.key] || 0 };
    }).sort(function (a, b) { return b.votes - a.votes; });
    ttCands.innerHTML = ordered.map(function (entry) {
      return candidateLine(entry.party.label, entry.pct, entry.votes, entry.party.color);
    }).join("");
    tooltipEl.removeAttribute("hidden");
    moveTooltip(event);
  }

  function moveTooltip(event) {
    if (!tooltipEl) return;
    var stage = document.querySelector(".map-stage");
    if (!stage) return;
    var rect = stage.getBoundingClientRect();
    var x = event.clientX - rect.left + 8;
    var y = event.clientY - rect.top + 8;
    if (x + 270 > rect.width) x = event.clientX - rect.left - 258;
    if (y + 150 > rect.height) y = event.clientY - rect.top - 142;
    tooltipEl.style.left = x + "px";
    tooltipEl.style.top = y + "px";
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.setAttribute("hidden", "");
  }

}());
