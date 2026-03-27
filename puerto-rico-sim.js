window.PR_REVAMP_ACTIVE = true;

(function () {
  "use strict";

  var DATA = window.PR_REVAMP_DATA || {};
  var MUNICIPALITY_ROWS = DATA.municipalities || [];
  var POPULATIONS = DATA.populations || {};
  var AGE_BASE = DATA.adultAgeBase || { y1829: 19.8, y3044: 21.9, y4564: 32.3, y65p: 26.0 };
  var REGION_LABELS = DATA.regionLabels || {
    metro: "Metro San Juan",
    north: "North Coast",
    west: "West",
    central: "Central Valley",
    mountain: "Mountain Interior",
    south: "South Coast",
    east: "East",
    island: "Island Municipalities"
  };

  var AGE_KEYS = ["y1829", "y3044", "y4564", "y65p"];
  var REGION_KEYS = ["metro", "north", "west", "central", "mountain", "south", "east", "island"];
  var REGION_CONTROL_KEYS = {
    metro: "metroMomentum",
    north: "northMomentum",
    west: "westMomentum",
    central: "centralMomentum",
    mountain: "mountainMomentum",
    south: "southMomentum",
    east: "eastMomentum",
    island: "islandMomentum"
  };
  var BASE_VOTER_SHARE = 0.39;
  var DEFAULT_POSITIONS = { ppd: -12, pnp: 34, mvc: -58, pip: -82, pd: 78 };
  var REGION_AGE_BUMPS = {
    metro: { y1829: 2.1, y3044: 1.8, y4564: -1.0, y65p: -2.9 },
    north: { y1829: -0.6, y3044: -0.4, y4564: 0.2, y65p: 0.8 },
    west: { y1829: 0.0, y3044: -0.1, y4564: 0.2, y65p: 0.1 },
    central: { y1829: -0.3, y3044: 0.4, y4564: 0.1, y65p: -0.2 },
    mountain: { y1829: -2.0, y3044: -1.0, y4564: 1.2, y65p: 1.8 },
    south: { y1829: -0.6, y3044: 0.2, y4564: 0.5, y65p: -0.1 },
    east: { y1829: 0.4, y3044: 0.5, y4564: -0.2, y65p: -0.7 },
    island: { y1829: -1.0, y3044: -0.5, y4564: 0.5, y65p: 1.0 }
  };
  var SPECIAL_BUMPS = {
    "san juan": { age: { y1829: 3.6, y3044: 2.5, y4564: -1.8, y65p: -4.3 }, ideology: -10, media: 4.6, turnout: 2.8 },
    "bayamon": { age: { y1829: 1.4, y3044: 1.2, y4564: -0.5, y65p: -2.1 }, ideology: 4, media: 3.8, turnout: 1.8 },
    "carolina": { age: { y1829: 1.9, y3044: 1.2, y4564: -0.3, y65p: -2.4 }, ideology: 0, media: 3.4, turnout: 1.6 },
    "guaynabo": { age: { y1829: 0.4, y3044: 1.4, y4564: 0.5, y65p: -2.3 }, ideology: 10, media: 3.7, turnout: 1.4 },
    "caguas": { age: { y1829: 1.4, y3044: 1.7, y4564: -0.6, y65p: -2.5 }, ideology: -2, media: 3.0, turnout: 1.3 },
    "mayaguez": { age: { y1829: 4.4, y3044: 1.8, y4564: -2.0, y65p: -4.2 }, ideology: -8, media: 2.5, turnout: 0.8 },
    "ponce": { age: { y1829: 1.5, y3044: 1.0, y4564: -0.4, y65p: -2.1 }, ideology: 2, media: 2.9, turnout: 0.9 },
    "rincon": { age: { y1829: -1.1, y3044: 0.2, y4564: 1.1, y65p: 2.1 }, ideology: -4, media: 1.1, turnout: -0.5 },
    "vieques": { age: { y1829: -0.8, y3044: -0.5, y4564: 0.5, y65p: 0.8 }, ideology: -6, media: 0.8, turnout: -0.3 },
    "culebra": { age: { y1829: -1.2, y3044: -0.6, y4564: 0.5, y65p: 1.3 }, ideology: -4, media: 0.4, turnout: -0.4 },
    "jayuya": { age: { y1829: -1.0, y3044: -0.6, y4564: 0.6, y65p: 1.0 }, ideology: -10, media: 0.6, turnout: -0.2 },
    "las marias": { age: { y1829: -1.6, y3044: -0.8, y4564: 0.7, y65p: 1.7 }, ideology: -7, media: 0.4, turnout: -0.4 },
    "maricao": { age: { y1829: -1.8, y3044: -1.0, y4564: 0.8, y65p: 2.0 }, ideology: -9, media: 0.2, turnout: -0.5 },
    "loiza": { age: { y1829: 1.2, y3044: 2.0, y4564: -0.8, y65p: -2.4 }, ideology: -6, media: 1.0, turnout: 0.6 },
    "dorado": { age: { y1829: 0.2, y3044: 1.4, y4564: 0.6, y65p: -2.2 }, ideology: 8, media: 1.8, turnout: 1.0 },
    "aguadilla": { age: { y1829: 0.7, y3044: 0.9, y4564: -0.2, y65p: -1.4 }, ideology: -2, media: 1.6, turnout: 0.5 }
  };
  var PRESET_DELTAS = {
    baseline: { controls: { statewideSwing: 0, turnoutPulse: 0, metroMomentum: 0, northMomentum: 0, westMomentum: 0, centralMomentum: 0, mountainMomentum: 0, southMomentum: 0, eastMomentum: 0, islandMomentum: 0, volatility: 2.5 } },
    "popular-heartland": { controls: { statewideSwing: -2.5, turnoutPulse: 2.5, centralMomentum: 4, mountainMomentum: 4.5, southMomentum: 2.5, volatility: 2.2 }, parties: { ppd: { strength: 8, funding: 4, buzz: 2, age: { y4564: 2, y65p: 3 }, region: { central: 4, mountain: 4, south: 3 } } } },
    "estadista-lock": { controls: { statewideSwing: 5, turnoutPulse: 1, metroMomentum: 4, northMomentum: 3, eastMomentum: 4, volatility: 2.1 }, parties: { pnp: { strength: 10, funding: 6, buzz: 2, region: { metro: 4, north: 3, east: 4 } }, pd: { buzz: 1, region: { east: 1, south: 1 } } } },
    "independence-wave": { controls: { statewideSwing: -7, turnoutPulse: 4, metroMomentum: 2, westMomentum: 5, mountainMomentum: 6, islandMomentum: 3, volatility: 4.5 }, parties: { pip: { strength: 10, funding: 6, buzz: 5, turnout: 3, age: { y1829: 4, y3044: 3 }, region: { west: 5, mountain: 6, island: 4, metro: 2 } }, mvc: { strength: 5, funding: 4, buzz: 4, turnout: 2, age: { y1829: 3, y3044: 2 }, region: { metro: 4, west: 2 } } } },
    "metro-reform": { controls: { statewideSwing: -3, turnoutPulse: 2, metroMomentum: 6, eastMomentum: 2, volatility: 3.4 }, parties: { mvc: { strength: 8, funding: 6, buzz: 5, age: { y1829: 4, y3044: 3 }, region: { metro: 6, east: 2 } }, ppd: { buzz: 1 } } },
    "conservative-surge": { controls: { statewideSwing: 8, turnoutPulse: 2, northMomentum: 2, southMomentum: 3, eastMomentum: 3, volatility: 3.0 }, parties: { pd: { strength: 10, funding: 8, buzz: 3, turnout: 2, age: { y4564: 3, y65p: 5 }, region: { south: 3, east: 3 } }, pnp: { strength: 5, funding: 3, buzz: 1, region: { north: 2, east: 2 } } } }
  };
  var CUSTOM_COLORS = ["#865dff", "#f59e0b", "#0f9b8e", "#dc6b4a", "#b04c85", "#4f7d22"];

  var state = { parties: [], controls: {}, regions: [], selectedId: null, seed: 20260326, customIndex: 0 };
  var MUNICIPALITIES = [];
  var MUNI_BY_KEY = {};
  var tooltipEl = document.getElementById("map-tooltip");
  var ttTitle = document.getElementById("tt-title");
  var ttMeta = document.getElementById("tt-meta");
  var ttCandidates = document.getElementById("tt-candidates");

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function escapeHtml(str) { return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;"); }
  function signed(n, digits) { return (n >= 0 ? "+" : "") + Number(n).toFixed(digits); }
  function repairMojibake(str) {
    return String(str || "").replace(/Ã¡/g, "á").replace(/Ã©/g, "é").replace(/Ã­/g, "í").replace(/Ã³/g, "ó").replace(/Ãº/g, "ú").replace(/Ã±/g, "ñ").replace(/Ã¼/g, "ü");
  }
  function normalizeName(str) { return repairMojibake(str).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, " ").trim().toLowerCase(); }
  function seededRand(seed) { var s = (seed >>> 0) || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hexToRgb(hex) { var c = String(hex || "#000").replace("#", ""); if (c.length === 3) c = c.replace(/(.)/g, "$1$1"); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
  function rgbToHex(r, g, b) { return "#" + [r, g, b].map(function (n) { return clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0"); }).join(""); }
  function mixColor(a, b, t) { var ra = hexToRgb(a), rb = hexToRgb(b); return rgbToHex(ra[0] * (1 - t) + rb[0] * t, ra[1] * (1 - t) + rb[1] * t, ra[2] * (1 - t) + rb[2] * t); }
  function rgba(hex, alpha) { var rgb = hexToRgb(hex); return "rgba(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + "," + alpha + ")"; }
  function ideologyLabel(v) { if (v <= -75) return "Independence left"; if (v <= -40) return "Progressive"; if (v <= -10) return "Center-left"; if (v < 20) return "Centrist"; if (v < 55) return "Center-right"; if (v < 80) return "Conservative"; return "Hard right"; }
  function shortLabel(name) { var words = String(name || "New Party").replace(/[^A-Za-z0-9 ]+/g, " ").trim().split(/\s+/).filter(Boolean); if (!words.length) return "NEW"; if (words.length === 1) return words[0].slice(0, 4).toUpperCase(); return words.slice(0, 4).map(function (w) { return w.charAt(0).toUpperCase(); }).join("").slice(0, 4); }
  function normalizeAgeMix(mix) { var total = 0, out = {}; AGE_KEYS.forEach(function (k) { out[k] = Math.max(5, mix[k] || 0); total += out[k]; }); AGE_KEYS.forEach(function (k) { out[k] = out[k] / total * 100; }); return out; }
  function ensureAgeShape(age) { var out = {}; AGE_KEYS.forEach(function (k) { out[k] = clamp(age && age[k] !== undefined ? age[k] : 0, -12, 12); }); return out; }
  function ensureRegionShape(region) { var out = {}; REGION_KEYS.forEach(function (k) { out[k] = clamp(region && region[k] !== undefined ? region[k] : 0, -12, 12); }); return out; }

  function defaultControls() {
    return { statewideSwing: 0, turnoutPulse: 0, metroMomentum: 0, northMomentum: 0, westMomentum: 0, centralMomentum: 0, mountainMomentum: 0, southMomentum: 0, eastMomentum: 0, islandMomentum: 0, volatility: 2.5 };
  }

  function weightedIdeology(base) {
    var total = 0, weight = 0;
    Object.keys(DEFAULT_POSITIONS).forEach(function (id) { total += (base[id] || 0) * DEFAULT_POSITIONS[id]; weight += base[id] || 0; });
    return weight ? total / weight : 0;
  }

  function deriveMediaWeight(pop, region) {
    var popFactor = clamp((Math.log(Math.max(pop, 2000)) - 9.4) * 1.8, 0, 4.2);
    var regionBoost = region === "metro" ? 1.3 : region === "central" ? 0.5 : region === "west" ? 0.3 : 0;
    return popFactor + regionBoost;
  }

  function deriveTurnoutLean(ageMix, pop, region) {
    var seniorLift = (ageMix.y65p - AGE_BASE.y65p) * 0.18;
    var cityLift = pop > 100000 ? 1.0 : pop < 12000 ? -0.5 : 0;
    var regionLift = region === "metro" ? 0.7 : region === "island" ? -0.3 : 0;
    return seniorLift + cityLift + regionLift;
  }

  function buildMunicipalities() {
    MUNICIPALITIES = MUNICIPALITY_ROWS.map(function (row) {
      var pop = Number(POPULATIONS[row.name] || 20000);
      var special = SPECIAL_BUMPS[normalizeName(row.name)] || {};
      var mix = {};
      AGE_KEYS.forEach(function (key) {
        mix[key] = AGE_BASE[key] + ((REGION_AGE_BUMPS[row.region] || {})[key] || 0) + (((special.age) || {})[key] || 0);
      });
      var age = normalizeAgeMix(mix);
      return {
        name: row.name,
        key: normalizeName(row.name),
        region: row.region,
        base: row.base,
        pop: pop,
        age: age,
        ideology: clamp(weightedIdeology(row.base) + Number(special.ideology || 0), -100, 100),
        mediaWeight: clamp(deriveMediaWeight(pop, row.region) + Number(special.media || 0), 0, 6.5),
        turnoutLean: deriveTurnoutLean(age, pop, row.region) + Number(special.turnout || 0)
      };
    });
    MUNI_BY_KEY = {};
    MUNICIPALITIES.forEach(function (m) { MUNI_BY_KEY[m.key] = m; });
  }

  function makeParty(opts) {
    return {
      key: opts.key,
      label: opts.label || shortLabel(opts.name || opts.key),
      name: opts.name || "Custom Party",
      color: opts.color || "#865dff",
      ideology: clamp(opts.ideology || 0, -100, 100),
      strength: clamp(opts.strength || 0, 0, 100),
      funding: clamp(opts.funding || 0, 0, 100),
      turnout: clamp(opts.turnout || 0, -12, 12),
      buzz: clamp(opts.buzz || 0, -10, 10),
      removable: opts.removable !== false,
      age: ensureAgeShape(opts.age),
      region: ensureRegionShape(opts.region)
    };
  }

  function defaultParties() {
    return [
      makeParty({ key: "ppd", label: "PPD", name: "Popular Democratic Party", color: "#d92a2a", ideology: -12, strength: 82, funding: 68, turnout: 1, buzz: 0, age: { y1829: -2, y3044: 0, y4564: 2, y65p: 4 }, region: { metro: -2, north: 0, west: -1, central: 2, mountain: 4, south: 3, east: 2, island: 0 } }),
      makeParty({ key: "pnp", label: "PNP", name: "New Progressive Party", color: "#1a52c7", ideology: 34, strength: 84, funding: 74, turnout: 1, buzz: 0, age: { y1829: 0, y3044: 2, y4564: 1, y65p: 2 }, region: { metro: 4, north: 3, west: 0, central: 0, mountain: -2, south: 0, east: 3, island: -1 } }),
      makeParty({ key: "mvc", label: "MVC", name: "Movimiento Victoria Ciudadana", color: "#7c3aed", ideology: -58, strength: 54, funding: 38, turnout: 1, buzz: 2, age: { y1829: 6, y3044: 4, y4564: -1, y65p: -4 }, region: { metro: 6, north: 1, west: 4, central: 1, mountain: -1, south: 0, east: 1, island: 3 } }),
      makeParty({ key: "pip", label: "PIP", name: "Puerto Rican Independence Party", color: "#15803d", ideology: -82, strength: 50, funding: 34, turnout: 2, buzz: 1, age: { y1829: 8, y3044: 5, y4564: -2, y65p: -6 }, region: { metro: 4, north: 0, west: 5, central: 2, mountain: 4, south: 2, east: 1, island: 6 } }),
      makeParty({ key: "pd", label: "PD", name: "Proyecto Dignidad", color: "#c2692a", ideology: 78, strength: 34, funding: 24, turnout: 0, buzz: 0, age: { y1829: -2, y3044: -1, y4564: 2, y65p: 6 }, region: { metro: -3, north: 0, west: -2, central: 1, mountain: 1, south: 2, east: 2, island: -2 } })
    ];
  }

  function zeroOverride() {
    var out = {};
    state.parties.forEach(function (party) { out[party.key] = 0; });
    return out;
  }

  function syncOverrideKeys(region) {
    var next = {};
    state.parties.forEach(function (party) { next[party.key] = Number(region.override && region.override[party.key] || 0); });
    region.override = next;
  }

  function syncAllOverrides() {
    state.regions.forEach(syncOverrideKeys);
  }

  function setControlReadouts() {
    Object.keys(state.controls).forEach(function (key) {
      var input = document.getElementById(key);
      var readout = document.getElementById(key + "-value");
      if (input) input.value = state.controls[key];
      if (readout) readout.textContent = Number(state.controls[key]).toFixed(1);
    });
  }

  function addParty() {
    state.customIndex += 1;
    state.parties.push(makeParty({
      key: "custom-" + state.customIndex,
      name: "Custom Party " + state.customIndex,
      label: "NEW",
      color: CUSTOM_COLORS[(state.customIndex - 1) % CUSTOM_COLORS.length],
      ideology: 0,
      strength: 8,
      funding: 8,
      turnout: 0,
      buzz: -1,
      removable: true
    }));
    syncAllOverrides();
    renderPartyList();
    renderRegionPanel();
    simulateAndRender(false);
  }

  function applyPresetDelta(party, delta) {
    if (delta.ideology !== undefined) party.ideology = clamp(party.ideology + delta.ideology, -100, 100);
    if (delta.strength !== undefined) party.strength = clamp(party.strength + delta.strength, 0, 100);
    if (delta.funding !== undefined) party.funding = clamp(party.funding + delta.funding, 0, 100);
    if (delta.turnout !== undefined) party.turnout = clamp(party.turnout + delta.turnout, -12, 12);
    if (delta.buzz !== undefined) party.buzz = clamp(party.buzz + delta.buzz, -10, 10);
    if (delta.age) AGE_KEYS.forEach(function (k) { if (delta.age[k] !== undefined) party.age[k] = clamp(party.age[k] + delta.age[k], -12, 12); });
    if (delta.region) REGION_KEYS.forEach(function (k) { if (delta.region[k] !== undefined) party.region[k] = clamp(party.region[k] + delta.region[k], -12, 12); });
  }

  function applyPreset() {
    var key = document.getElementById("preset-select").value;
    var preset = PRESET_DELTAS[key];
    if (!preset) return;
    state.customIndex = 0;
    state.parties = defaultParties();
    state.controls = defaultControls();
    Object.keys(preset.controls || {}).forEach(function (controlKey) { state.controls[controlKey] = preset.controls[controlKey]; });
    Object.keys(preset.parties || {}).forEach(function (partyKey) {
      var party = state.parties.find(function (item) { return item.key === partyKey; });
      if (party) applyPresetDelta(party, preset.parties[partyKey]);
    });
    setControlReadouts();
    syncAllOverrides();
    renderPartyList();
    renderRegionPanel();
    simulateAndRender(true);
  }

  function resetAll() {
    state.controls = defaultControls();
    state.parties = defaultParties();
    state.customIndex = 0;
    state.selectedId = null;
    state.seed = Math.floor(Math.random() * 1e9);
    state.regions.forEach(function (region) { region.override = zeroOverride(); });
    setControlReadouts();
    renderPartyList();
    renderRegionPanel();
    simulateAndRender(false);
  }

  function previewSwatches(color) {
    return [mixColor(color, "#ffffff", 0.7), mixColor(color, "#ffffff", 0.35), mixColor(color, "#000000", 0.08)];
  }

  function rangeField(label, party, value, min, max, step, display, attrs) {
    return '<label class="party-field"><span class="party-field__row"><span>' + escapeHtml(label) + '</span><span>' + escapeHtml(display) + '</span></span><input type="range" data-party="' + escapeHtml(party.key) + '" ' + attrs + ' min="' + min + '" max="' + max + '" step="' + step + '" value="' + value + '"></label>';
  }

  function renderPartyList() {
    var list = document.getElementById("party-list");
    var open = {};
    list.querySelectorAll("details[data-open-key][open]").forEach(function (el) { open[el.getAttribute("data-open-key")] = true; });
    list.innerHTML = state.parties.map(function (party) {
      var remove = party.removable ? '<button class="party-remove" type="button" data-remove-party="' + escapeHtml(party.key) + '" title="Remove party">&times;</button>' : "";
      return '<article class="party-card" data-party-card="' + escapeHtml(party.key) + '">' +
        '<div class="party-card__top"><div><div class="party-palette-preview">' + previewSwatches(party.color).map(function (shade) { return '<span style="background:' + shade + ';"></span>'; }).join("") + '</div><strong class="party-name-display" style="color:' + party.color + ';">' + escapeHtml(party.name) + '</strong><div class="party-meta-display" style="color:var(--muted);font-size:0.78rem;">' + escapeHtml(ideologyLabel(party.ideology)) + '</div></div>' + remove + '</div>' +
        '<div class="party-fields">' +
        '<label class="party-field"><span>Party Name</span><input type="text" data-party="' + escapeHtml(party.key) + '" data-field="name" value="' + escapeHtml(party.name) + '"></label>' +
        '<label class="party-field party-field--color"><span>Party Color</span><input type="color" data-party="' + escapeHtml(party.key) + '" data-field="color" value="' + escapeHtml(party.color) + '"></label>' +
        rangeField("Ideology", party, party.ideology, -100, 100, 1, ideologyLabel(party.ideology), 'data-field="ideology"') +
        rangeField("Party Strength", party, party.strength, 0, 100, 1, String(party.strength), 'data-field="strength"') +
        rangeField("Funding", party, party.funding, 0, 100, 1, String(party.funding), 'data-field="funding"') +
        rangeField("Turnout Pull", party, party.turnout, -12, 12, 1, signed(party.turnout, 0), 'data-field="turnout"') +
        rangeField("Buzz", party, party.buzz, -10, 10, 1, signed(party.buzz, 0), 'data-field="buzz"') +
        '<details class="party-section" data-open-key="age-' + escapeHtml(party.key) + '"><summary class="party-section__head">Age Support</summary><div class="party-section__body">' +
        AGE_KEYS.map(function (key) { return rangeField(key === "y65p" ? "65+" : AGE_KEYS.indexOf(key) === 0 ? "18-29" : AGE_KEYS.indexOf(key) === 1 ? "30-44" : "45-64", party, party.age[key], -12, 12, 1, signed(party.age[key], 0), 'data-age="' + key + '"'); }).join("") +
        '</div></details>' +
        '<details class="party-section" data-open-key="reg-' + escapeHtml(party.key) + '"><summary class="party-section__head">Regional Strength</summary><div class="party-section__body">' +
        REGION_KEYS.map(function (key) { return rangeField(REGION_LABELS[key], party, party.region[key], -12, 12, 1, signed(party.region[key], 0), 'data-region="' + key + '"'); }).join("") +
        '</div></details></div></article>';
    }).join("");
    list.querySelectorAll("details[data-open-key]").forEach(function (el) { if (open[el.getAttribute("data-open-key")]) el.open = true; });
  }

  function updatePartyCardHeader(party) {
    var card = document.querySelector('[data-party-card="' + party.key + '"]');
    if (!card) return;
    var preview = card.querySelector(".party-palette-preview");
    if (preview) preview.innerHTML = previewSwatches(party.color).map(function (shade) { return '<span style="background:' + shade + ';"></span>'; }).join("");
    var nameEl = card.querySelector(".party-name-display");
    var metaEl = card.querySelector(".party-meta-display");
    if (nameEl) { nameEl.textContent = party.name; nameEl.style.color = party.color; }
    if (metaEl) metaEl.textContent = ideologyLabel(party.ideology);
  }

  function orderRegionResults(region) {
    return state.parties.map(function (party) {
      return {
        party: party,
        pct: region.result ? (region.result[party.key] || 0) : (region.muni.base[party.key] || 0),
        votes: region.resultVotes ? (region.resultVotes[party.key] || 0) : 0
      };
    }).sort(function (a, b) { return b.pct - a.pct; });
  }

  function summarizeVotes() {
    var totals = {}, totalVotes = 0;
    state.parties.forEach(function (party) { totals[party.key] = 0; });
    state.regions.forEach(function (region) {
      if (!region.resultVotes) return;
      state.parties.forEach(function (party) { totals[party.key] += region.resultVotes[party.key] || 0; });
    });
    totalVotes = state.parties.reduce(function (sum, party) { return sum + totals[party.key]; }, 0);
    return state.parties.map(function (party) {
      return { party: party, votes: totals[party.key] || 0, pct: totalVotes ? (totals[party.key] || 0) / totalVotes * 100 : 0 };
    }).sort(function (a, b) { return b.votes - a.votes; });
  }

  function fillForShare(color, share) {
    if (share < 20) return "#d8cfc0";
    var scale = [mixColor(color, "#ffffff", 0.82), mixColor(color, "#ffffff", 0.74), mixColor(color, "#ffffff", 0.64), mixColor(color, "#ffffff", 0.54), mixColor(color, "#ffffff", 0.42), mixColor(color, "#ffffff", 0.28), mixColor(color, "#ffffff", 0.16), mixColor(color, "#000000", 0.04)];
    if (share >= 90) return scale[7];
    if (share >= 80) return scale[6];
    if (share >= 70) return scale[5];
    if (share >= 60) return scale[4];
    if (share >= 50) return scale[3];
    if (share >= 40) return scale[2];
    if (share >= 30) return scale[1];
    return scale[0];
  }

  function polar(cx, cy, r, angle) { return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]; }
  function slicePath(cx, cy, r, a0, a1) {
    var sweep = a1 - a0;
    if (sweep >= Math.PI * 2 - 0.001) return "M " + (cx + r) + "," + cy + " A " + r + "," + r + " 0 1 1 " + (cx + r - 0.001) + "," + cy + " Z";
    var start = polar(cx, cy, r, a0), end = polar(cx, cy, r, a1);
    return "M " + cx + "," + cy + " L " + start[0] + "," + start[1] + " A " + r + "," + r + " 0 " + (sweep > Math.PI ? 1 : 0) + " 1 " + end[0] + "," + end[1] + " Z";
  }

  function updateVoteStrip(shares) {
    document.getElementById("vote-strip-labels").innerHTML = shares.map(function (entry) { return '<span style="color:' + entry.party.color + ';font-weight:700;">' + escapeHtml(entry.party.label) + ' ' + entry.pct.toFixed(1) + '%</span>'; }).join("");
    document.getElementById("vote-strip").innerHTML = shares.map(function (entry) { return '<div class="vote-strip__seg" style="width:' + entry.pct.toFixed(2) + '%;background:' + entry.party.color + ';"></div>'; }).join("");
  }

  function updatePie(shares) {
    var container = document.getElementById("pie-container");
    if (!shares.length) { container.innerHTML = ""; return; }
    var angle = -Math.PI / 2, cx = 104, cy = 104, r = 82;
    var arcs = shares.map(function (entry) {
      var sweep = Math.PI * 2 * (entry.pct / 100);
      var path = '<path class="vote-pie__slice" d="' + slicePath(cx, cy, r, angle, angle + sweep) + '" fill="' + entry.party.color + '" data-pie-name="' + escapeHtml(entry.party.name) + '" data-pie-share="' + entry.pct.toFixed(1) + '%" data-pie-detail="' + entry.votes.toLocaleString() + ' votes" tabindex="0"><title>' + escapeHtml(entry.party.name + ": " + entry.pct.toFixed(1) + "%") + '</title></path>';
      angle += sweep;
      return path;
    }).join("");
    container.innerHTML = '<div class="vote-pie-wrap"><div class="vote-pie" id="vote-pie" data-default-name="' + escapeHtml(shares[0].party.name) + '" data-default-share="' + shares[0].pct.toFixed(1) + '%" data-default-detail="' + shares[0].votes.toLocaleString() + ' votes"><svg class="vote-pie__svg" viewBox="0 0 208 208">' + arcs + '</svg></div><div class="vote-pie__readout"><span class="vote-pie__eyebrow" id="pie-eyebrow">' + shares[0].votes.toLocaleString() + ' votes</span><strong class="vote-pie__label" id="pie-label">' + escapeHtml(shares[0].party.name) + '</strong><span class="vote-pie__share" id="pie-share">' + shares[0].pct.toFixed(1) + '%</span></div></div>';
    var pie = document.getElementById("vote-pie");
    pie.querySelectorAll("[data-pie-name]").forEach(function (slice) {
      function show() { document.getElementById("pie-eyebrow").textContent = slice.getAttribute("data-pie-detail") || ""; document.getElementById("pie-label").textContent = slice.getAttribute("data-pie-name") || ""; document.getElementById("pie-share").textContent = slice.getAttribute("data-pie-share") || ""; }
      function reset() { document.getElementById("pie-eyebrow").textContent = pie.getAttribute("data-default-detail") || ""; document.getElementById("pie-label").textContent = pie.getAttribute("data-default-name") || ""; document.getElementById("pie-share").textContent = pie.getAttribute("data-default-share") || ""; }
      slice.addEventListener("mouseover", show); slice.addEventListener("focus", show); slice.addEventListener("mouseleave", reset); slice.addEventListener("blur", reset);
    });
  }

  function renderSummary() {
    var shares = summarizeVotes();
    var leader = shares[0], runnerUp = shares[1];
    if (!leader) return;
    document.getElementById("winner-headline").textContent = runnerUp && Math.abs(leader.pct - runnerUp.pct) < 0.15 ? "Puerto Rico is effectively tied" : leader.party.name + " leads Puerto Rico";
    document.getElementById("winner-subline").textContent = runnerUp ? "Projected islandwide margin: " + Math.abs(leader.pct - runnerUp.pct).toFixed(1) + " points, " + leader.votes.toLocaleString() + " to " + runnerUp.votes.toLocaleString() + "." : leader.votes.toLocaleString() + " modeled votes projected.";
    document.getElementById("score-grid").innerHTML = shares.map(function (entry) {
      return '<article class="score-card" style="background:linear-gradient(135deg,' + rgba(entry.party.color, 0.12) + ',rgba(255,255,255,0.82));border-color:' + rgba(entry.party.color, 0.24) + ';"><p class="score-card__label">' + escapeHtml(entry.party.label + " · " + ideologyLabel(entry.party.ideology)) + '</p><p class="score-card__value" style="color:' + entry.party.color + ';">' + entry.votes.toLocaleString() + '</p><div class="score-card__sub">' + entry.pct.toFixed(1) + '% projected popular vote</div></article>';
    }).join("");
    updateVoteStrip(shares);
    updatePie(shares);
  }

  function renderMap() {
    state.regions.forEach(function (region) {
      var ordered = orderRegionResults(region), winner = ordered[0];
      if (!winner || !region.path) return;
      region.path.attr("fill", fillForShare(winner.party.color, winner.pct)).classed("selected", state.selectedId === region.index);
    });
  }

  function renderCloseRaces() {
    document.getElementById("close-races").innerHTML = state.regions.map(function (region) {
      var ordered = orderRegionResults(region), winner = ordered[0], runnerUp = ordered[1], margin = winner && runnerUp ? winner.pct - runnerUp.pct : 100;
      return { name: region.muni.name, winner: winner && winner.party, margin: margin };
    }).sort(function (a, b) { return a.margin - b.margin; }).slice(0, 8).map(function (item) {
      return item.winner ? '<div class="race-item"><span class="race-item__swatch" style="background:' + item.winner.color + ';"></span><span class="race-item__name">' + escapeHtml(item.name) + '</span><span class="race-item__margin">' + escapeHtml(item.winner.label) + ' +' + item.margin.toFixed(1) + '%</span></div>' : '';
    }).join("");
  }

  function renderRegionPanel() {
    var panel = document.getElementById("region-panel");
    var title = document.getElementById("region-title");
    var summary = document.getElementById("region-summary");
    var breakdown = document.getElementById("region-breakdown");
    var actions = document.getElementById("region-actions");
    if (state.selectedId === null || !state.regions[state.selectedId]) {
      panel.classList.add("is-hidden");
      title.textContent = "—";
      summary.textContent = "Click a municipality on the map.";
      if (breakdown) breakdown.innerHTML = "";
      actions.innerHTML = "";
      return;
    }
    var region = state.regions[state.selectedId];
    var ordered = orderRegionResults(region), winner = ordered[0], runnerUp = ordered[1];
    panel.classList.remove("is-hidden");
    title.textContent = region.muni.name;
    summary.textContent = REGION_LABELS[region.muni.region] + " | Pop. " + region.muni.pop.toLocaleString() + " | Vote pool " + region.votePool.toLocaleString() + (winner && runnerUp ? " | " + winner.party.label + " +" + (winner.pct - runnerUp.pct).toFixed(1) + "%" : "");
    if (breakdown) breakdown.innerHTML = ordered.map(function (entry) { return '<div class="race-item"><span class="race-item__swatch" style="background:' + entry.party.color + ';"></span><span class="race-item__name">' + escapeHtml(entry.party.name) + '</span><span class="race-item__margin">' + entry.votes.toLocaleString() + ' | ' + entry.pct.toFixed(1) + '%</span></div>'; }).join("");
    actions.innerHTML = state.parties.map(function (party) { return '<button class="button" type="button" data-boost-party="' + escapeHtml(party.key) + '" style="background:' + rgba(party.color, 0.12) + ';border-color:' + rgba(party.color, 0.24) + ';color:' + party.color + ';">Boost ' + escapeHtml(party.label) + '</button>'; }).join("") + '<button class="button button--ghost" type="button" id="clear-region-override">Reset</button>';
    actions.querySelectorAll("[data-boost-party]").forEach(function (button) { button.addEventListener("click", function () { nudgeSelected(button.getAttribute("data-boost-party"), 4); }); });
    var clear = document.getElementById("clear-region-override"); if (clear) clear.addEventListener("click", clearSelectedOverride);
  }

  function showTooltip(event, region) {
    var ordered = orderRegionResults(region);
    ttTitle.textContent = region.muni.name;
    ttMeta.textContent = REGION_LABELS[region.muni.region] + " | Pop. " + region.muni.pop.toLocaleString() + " | Vote pool " + region.votePool.toLocaleString();
    ttCandidates.innerHTML = ordered.map(function (entry) { return '<div class="candidate-line"><span class="candidate-line__swatch" style="background:' + entry.party.color + ';"></span><span>' + escapeHtml(entry.party.label) + '</span><span class="candidate-line__pct">' + entry.votes.toLocaleString() + ' · ' + entry.pct.toFixed(1) + '%</span></div>'; }).join("");
    tooltipEl.hidden = false;
    moveTooltip(event);
  }

  function moveTooltip(event) {
    if (!tooltipEl || tooltipEl.hidden) return;
    var stage = document.querySelector(".map-stage"), rect = stage.getBoundingClientRect();
    var x = event.clientX - rect.left + 8, y = event.clientY - rect.top + 8, w = tooltipEl.offsetWidth || 250, h = tooltipEl.offsetHeight || 160;
    if (x + w + 8 > rect.width) x = event.clientX - rect.left - w - 8;
    if (y + h + 8 > rect.height) y = event.clientY - rect.top - h - 8;
    tooltipEl.style.left = Math.max(6, x) + "px";
    tooltipEl.style.top = Math.max(6, y) + "px";
  }

  function hideTooltip() { if (tooltipEl) tooltipEl.hidden = true; }

  function nudgeSelected(partyKey, amount) {
    if (state.selectedId === null) return;
    var region = state.regions[state.selectedId];
    syncOverrideKeys(region);
    region.override[partyKey] = clamp((region.override[partyKey] || 0) + amount, -24, 24);
    var others = state.parties.filter(function (party) { return party.key !== partyKey; });
    if (others.length) others.forEach(function (party) { region.override[party.key] = clamp((region.override[party.key] || 0) - amount / others.length, -24, 24); });
    simulateAndRender(false);
  }

  function clearSelectedOverride() {
    if (state.selectedId === null) return;
    state.regions[state.selectedId].override = zeroOverride();
    simulateAndRender(false);
  }

  function simulateAndRender(reroll) {
    if (!state.regions.length) return;
    if (reroll) state.seed = Math.floor(Math.random() * 1e9);
    var rand = seededRand(state.seed);
    state.regions.forEach(function (region) {
      var mood = region.muni.ideology + state.controls.statewideSwing + (state.controls[REGION_CONTROL_KEYS[region.muni.region]] || 0);
      var raw = {}, totalRaw = 0;
      syncOverrideKeys(region);
      state.parties.forEach(function (party) {
        var baseShare = region.muni.base[party.key] || 0;
        var fit = Math.max(0, 8 - Math.abs(party.ideology - mood) / 12);
        var ageBonus = AGE_KEYS.reduce(function (sum, key) { return sum + region.muni.age[key] * party.age[key]; }, 0) / 100;
        var strength = (party.strength - 50) * 0.12;
        var funding = (party.funding - 50) * (0.04 + region.muni.mediaWeight * 0.02);
        var buzz = party.buzz * (0.55 + region.muni.age.y1829 / 85 + region.muni.age.y3044 / 170);
        var outsider = !baseShare ? -1.5 + (party.strength - 35) * 0.05 + (party.funding - 35) * 0.04 : 0;
        var noise = (rand() * 2 - 1) * state.controls.volatility * 0.55;
        raw[party.key] = Math.max(0.02, baseShare * 1.08 + fit + ageBonus * 0.65 + (party.region[region.muni.region] || 0) + strength + funding + buzz + outsider + (region.override[party.key] || 0) + noise);
        totalRaw += raw[party.key];
      });
      var turnoutPull = 0;
      state.parties.forEach(function (party) { turnoutPull += (raw[party.key] / totalRaw) * party.turnout; });
      var turnoutRate = clamp(BASE_VOTER_SHARE * (1 + state.controls.turnoutPulse / 45 + region.muni.turnoutLean / 18 + turnoutPull / 35), 0.18, 0.62);
      var votePool = Math.max(320, Math.round(region.muni.pop * turnoutRate));
      var runningVotes = 0;
      region.result = {};
      region.resultVotes = {};
      state.parties.forEach(function (party, idx) {
        var pct = totalRaw ? raw[party.key] / totalRaw * 100 : 0;
        region.result[party.key] = pct;
        region.resultVotes[party.key] = idx === state.parties.length - 1 ? votePool - runningVotes : Math.floor(votePool * pct / 100);
        if (idx !== state.parties.length - 1) runningVotes += region.resultVotes[party.key];
      });
      region.votePool = votePool;
    });
    renderMap();
    renderSummary();
    renderCloseRaces();
    renderRegionPanel();
  }

  function loadMap() {
    if (!window.PR_GEO || !window.PR_GEO.features) {
      document.getElementById("map-status").textContent = "Puerto Rico municipality geometry was not found.";
      return;
    }
    var shell = document.getElementById("map-shell");
    var width = shell.clientWidth || 760;
    var height = shell.clientHeight || 620;
    var projection = d3.geoMercator().fitExtent([[14, 14], [width - 14, height - 14]], window.PR_GEO);
    var pathGen = d3.geoPath().projection(projection);
    shell.innerHTML = "";
    var svg = d3.select(shell).append("svg").attr("viewBox", "0 0 " + width + " " + height).attr("width", "100%").attr("height", "100%").attr("preserveAspectRatio", "xMidYMid meet");
    state.regions = window.PR_GEO.features.map(function (feature, index) {
      var name = repairMojibake(feature.properties && feature.properties.NAME ? feature.properties.NAME : "Municipality");
      var muni = MUNI_BY_KEY[normalizeName(name)] || { name: name, key: normalizeName(name), region: "central", base: { ppd: 33, pnp: 32, mvc: 14, pip: 13, pd: 8 }, pop: 20000, age: normalizeAgeMix(AGE_BASE), ideology: -4, mediaWeight: 1.2, turnoutLean: 0 };
      var region = { feature: feature, muni: muni, index: index, path: null, override: zeroOverride(), result: null, resultVotes: null, votePool: 0 };
      region.path = svg.append("path").datum(feature).attr("d", pathGen).attr("fill", "#d8cfc0").on("mouseenter", function (event) { showTooltip(event, region); }).on("mousemove", function (event) { moveTooltip(event); }).on("mouseleave", hideTooltip).on("click", function () { state.selectedId = state.selectedId === index ? null : index; renderMap(); renderRegionPanel(); });
      return region;
    });
    document.getElementById("map-status").innerHTML = '<span class="map-status__headline">78 municipalities loaded.</span><span class="map-status__line">Popular-vote model uses municipality population, islandwide age structure, and regional party strength.</span>';
    simulateAndRender(false);
  }

  function bindUI() {
    document.getElementById("apply-preset").addEventListener("click", applyPreset);
    document.getElementById("reroll-button").addEventListener("click", function () { simulateAndRender(true); });
    document.getElementById("reset-button").addEventListener("click", resetAll);
    document.getElementById("reset-parties").addEventListener("click", function () { state.customIndex = 0; state.parties = defaultParties(); syncAllOverrides(); renderPartyList(); renderRegionPanel(); simulateAndRender(false); });
    document.getElementById("add-party").addEventListener("click", addParty);
    Object.keys(defaultControls()).forEach(function (key) {
      var input = document.getElementById(key);
      if (!input) return;
      input.addEventListener("input", function () {
        state.controls[key] = Number(input.value);
        var readout = document.getElementById(key + "-value");
        if (readout) readout.textContent = Number(state.controls[key]).toFixed(1);
        simulateAndRender(false);
      });
    });
    var partyList = document.getElementById("party-list");
    partyList.addEventListener("click", function (event) {
      var remove = event.target.closest("[data-remove-party]");
      if (!remove || state.parties.length <= 1) return;
      state.parties = state.parties.filter(function (party) { return party.key !== remove.getAttribute("data-remove-party"); });
      syncAllOverrides();
      renderPartyList();
      renderRegionPanel();
      simulateAndRender(false);
    });
    partyList.addEventListener("input", function (event) {
      var el = event.target;
      var party = el && el.getAttribute("data-party") ? state.parties.find(function (item) { return item.key === el.getAttribute("data-party"); }) : null;
      if (!party) return;
      var row = el.previousElementSibling;
      var valueEl = row ? row.querySelector("span:last-child") : null;
      if (el.getAttribute("data-field") === "name") { party.name = el.value || "Custom Party"; party.label = shortLabel(party.name); updatePartyCardHeader(party); renderRegionPanel(); simulateAndRender(false); return; }
      if (el.getAttribute("data-field") === "color") { party.color = el.value || party.color; updatePartyCardHeader(party); renderRegionPanel(); simulateAndRender(false); return; }
      if (el.getAttribute("data-field") === "ideology") { party.ideology = clamp(Number(el.value), -100, 100); if (valueEl) valueEl.textContent = ideologyLabel(party.ideology); updatePartyCardHeader(party); simulateAndRender(false); return; }
      if (el.getAttribute("data-field") === "strength") { party.strength = clamp(Number(el.value), 0, 100); if (valueEl) valueEl.textContent = String(party.strength); simulateAndRender(false); return; }
      if (el.getAttribute("data-field") === "funding") { party.funding = clamp(Number(el.value), 0, 100); if (valueEl) valueEl.textContent = String(party.funding); simulateAndRender(false); return; }
      if (el.getAttribute("data-field") === "turnout") { party.turnout = clamp(Number(el.value), -12, 12); if (valueEl) valueEl.textContent = signed(party.turnout, 0); simulateAndRender(false); return; }
      if (el.getAttribute("data-field") === "buzz") { party.buzz = clamp(Number(el.value), -10, 10); if (valueEl) valueEl.textContent = signed(party.buzz, 0); simulateAndRender(false); return; }
      if (el.getAttribute("data-age")) { party.age[el.getAttribute("data-age")] = clamp(Number(el.value), -12, 12); if (valueEl) valueEl.textContent = signed(party.age[el.getAttribute("data-age")], 0); simulateAndRender(false); return; }
      if (el.getAttribute("data-region")) { party.region[el.getAttribute("data-region")] = clamp(Number(el.value), -12, 12); if (valueEl) valueEl.textContent = signed(party.region[el.getAttribute("data-region")], 0); simulateAndRender(false); }
    });
  }

  buildMunicipalities();
  state.controls = defaultControls();
  state.parties = defaultParties();
  setControlReadouts();
  renderPartyList();
  bindUI();
  loadMap();
}());
