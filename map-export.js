(function () {
  "use strict";

  function injectStyles() {
    if (document.getElementById("map-export-style")) return;
    var style = document.createElement("style");
    style.id = "map-export-style";
    style.textContent = [
      ".map-footer__actions{margin-top:0.6rem;display:flex;justify-content:flex-end;}",
      ".map-footer__actions .button{padding:0.34rem 0.72rem;font-size:0.78rem;}"
    ].join("");
    document.head.appendChild(style);
  }

  function getVisibleMapSvg() {
    var svgs = Array.prototype.slice.call(document.querySelectorAll("#map-shell svg"));
    if (!svgs.length) return null;
    for (var i = 0; i < svgs.length; i++) {
      if (svgs[i].getClientRects().length > 0) return svgs[i];
    }
    return svgs[0];
  }

  function inlineSvgStyles(sourceSvg, cloneSvg) {
    var sourceNodes = [sourceSvg].concat(Array.prototype.slice.call(sourceSvg.querySelectorAll("*")));
    var cloneNodes = [cloneSvg].concat(Array.prototype.slice.call(cloneSvg.querySelectorAll("*")));
    sourceNodes.forEach(function (node, idx) {
      var cloneNode = cloneNodes[idx];
      if (!cloneNode || cloneNode.nodeType !== 1) return;
      var computed = window.getComputedStyle(node);
      [
        "fill",
        "stroke",
        "stroke-width",
        "stroke-linejoin",
        "stroke-linecap",
        "stroke-dasharray",
        "stroke-dashoffset",
        "opacity",
        "display",
        "visibility",
        "vector-effect",
        "shape-rendering",
        "paint-order",
        "pointer-events"
      ].forEach(function (prop) {
        var value = computed.getPropertyValue(prop);
        if (value) cloneNode.style.setProperty(prop, value);
      });
    });
  }

  function exportBaseName() {
    var base = window.location.pathname.split("/").pop() || document.title || "map";
    return decodeURIComponent(base)
      .replace(/\.html?$/i, "")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase();
  }

  function exportFileName(suffix, ext) {
    var base = exportBaseName() || "map";
    var state = window.state;
    var modeSuffix = "";
    if (state && typeof state.mode === "string" && state.mode) {
      modeSuffix = "-" + state.mode
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
    }
    return base + modeSuffix + "-" + suffix + "." + ext;
  }

  function downloadBlob(parts, type, filename) {
    var blob = new Blob(parts, { type: type });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function exportMapSvg() {
    var sourceSvg = getVisibleMapSvg();
    if (!sourceSvg) return;

    var cloneSvg = sourceSvg.cloneNode(true);
    cloneSvg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    cloneSvg.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");
    cloneSvg.setAttribute("version", "1.1");
    cloneSvg.style.setProperty("background", "none");
    inlineSvgStyles(sourceSvg, cloneSvg);

    var markup = new XMLSerializer().serializeToString(cloneSvg);
    if (!/^<svg[^>]+xmlns=/.test(markup)) {
      markup = markup.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    downloadBlob([markup], "image/svg+xml;charset=utf-8", exportFileName("map", "svg"));
  }

  function currentEntries() {
    var state = window.state;
    if (!state) return [];

    if (Array.isArray(state.parties)) {
      return state.parties.map(function (party) {
        return {
          id: party.key || party.id || party.label || party.name || "",
          name: party.name || party.label || party.key || party.id || "",
          color: party.color || ""
        };
      });
    }

    if (!state.candidates) return [];

    var candidates = null;
    if (Array.isArray(state.candidates)) {
      candidates = state.candidates;
    } else if (state.mode && Array.isArray(state.candidates[state.mode])) {
      candidates = state.candidates[state.mode];
    } else {
      Object.keys(state.candidates).some(function (key) {
        if (Array.isArray(state.candidates[key])) {
          candidates = state.candidates[key];
          return true;
        }
        return false;
      });
    }

    return (candidates || []).map(function (candidate) {
      var palette = candidate.palette || {};
      return {
        id: candidate.id || candidate.key || candidate.name || "",
        name: candidate.name || candidate.label || candidate.id || candidate.key || "",
        color: candidate.color || palette.strong || ""
      };
    });
  }

  function getRegionCollection() {
    var state = window.state;
    if (!state || !Array.isArray(state.regions)) return [];
    return state.regions.filter(function (region) {
      return region && region.result && typeof region.result === "object";
    });
  }

  function getRegionUnit(region) {
    var explicitKeys = [
      "county",
      "municipality",
      "muni",
      "ward",
      "parish",
      "borough",
      "town",
      "city",
      "district",
      "unit"
    ];
    for (var i = 0; i < explicitKeys.length; i++) {
      var explicitKey = explicitKeys[i];
      if (region[explicitKey] && typeof region[explicitKey] === "object") {
        return { kind: explicitKey, data: region[explicitKey] };
      }
    }

    var skipKeys = {
      path: true,
      result: true,
      votes: true,
      override: true,
      feature: true
    };
    var keys = Object.keys(region);
    for (var j = 0; j < keys.length; j++) {
      var key = keys[j];
      if (skipKeys[key]) continue;
      var value = region[key];
      if (value && typeof value === "object" && (value.name || value.shortName || value.label)) {
        return { kind: key, data: value };
      }
    }

    return { kind: "unit", data: region };
  }

  function cleanUnitKind(kind) {
    return String(kind || "unit")
      .replace(/([a-z])([A-Z])/g, "$1_$2")
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .toLowerCase() || "unit";
  }

  function unitName(region) {
    var unit = getRegionUnit(region).data || {};
    return unit.name || unit.shortName || unit.label || unit.id || "";
  }

  function unitId(region) {
    var unit = getRegionUnit(region).data || {};
    return unit.fips || unit.geoid || unit.id || unit.code || unit.key || unit.name || "";
  }

  function unitRegion(region) {
    var unit = getRegionUnit(region).data || {};
    return unit.region || region.region || "";
  }

  function totalVotesForRegion(region) {
    if (typeof region.totalVotes === "number" && isFinite(region.totalVotes)) return Math.round(region.totalVotes);
    if (typeof region.countyVotes === "number" && isFinite(region.countyVotes)) return Math.round(region.countyVotes);
    if (region.votes && typeof region.votes === "object") {
      return Object.keys(region.votes).reduce(function (sum, key) {
        var value = Number(region.votes[key]);
        return sum + (isFinite(value) ? value : 0);
      }, 0);
    }
    return "";
  }

  function derivedVotes(pctMap, totalVotes, entries) {
    if (!totalVotes || !pctMap || !entries.length) return null;
    var votes = {};
    var assigned = 0;
    entries.forEach(function (entry, index) {
      if (index === entries.length - 1) {
        votes[entry.id] = Math.max(0, totalVotes - assigned);
        return;
      }
      var pct = Number(pctMap[entry.id] || 0);
      var value = Math.max(0, Math.round(totalVotes * pct / 100));
      votes[entry.id] = value;
      assigned += value;
    });
    return votes;
  }

  function orderedRegionResults(region, entries) {
    var pctMap = region.result || {};
    var totalVotes = totalVotesForRegion(region);
    var votesMap = region.votes && typeof region.votes === "object"
      ? region.votes
      : derivedVotes(pctMap, totalVotes, entries);

    return entries.map(function (entry) {
      var pct = Number(pctMap[entry.id] || 0);
      var votes = votesMap && votesMap[entry.id] != null ? Number(votesMap[entry.id]) : "";
      return {
        id: entry.id,
        name: entry.name,
        color: entry.color,
        pct: isFinite(pct) ? pct : 0,
        votes: votes !== "" && isFinite(votes) ? votes : ""
      };
    }).sort(function (a, b) {
      return b.pct - a.pct;
    });
  }

  function csvEscape(value) {
    var text = value == null ? "" : String(value);
    if (/[",\r\n]/.test(text)) {
      return '"' + text.replace(/"/g, '""') + '"';
    }
    return text;
  }

  function exportMapCsv() {
    var entries = currentEntries();
    var regions = getRegionCollection();
    if (!entries.length || !regions.length) return;

    var headers = [
      "mode",
      "unit_type",
      "unit_name",
      "unit_id",
      "subregion",
      "winner_id",
      "winner_name",
      "winner_pct",
      "runner_up_id",
      "runner_up_name",
      "runner_up_pct",
      "total_votes"
    ];

    entries.forEach(function (entry) {
      headers.push(entry.name + " pct");
      headers.push(entry.name + " votes");
    });

    var state = window.state || {};
    var mode = typeof state.mode === "string" ? state.mode : "";
    var lines = [headers.map(csvEscape).join(",")];

    regions.forEach(function (region) {
      var results = orderedRegionResults(region, entries);
      var winner = results[0] || {};
      var runnerUp = results[1] || {};
      var row = [
        mode,
        cleanUnitKind(getRegionUnit(region).kind),
        unitName(region),
        unitId(region),
        unitRegion(region),
        winner.id || "",
        winner.name || "",
        winner.pct != null ? winner.pct.toFixed(2) : "",
        runnerUp.id || "",
        runnerUp.name || "",
        runnerUp.pct != null ? runnerUp.pct.toFixed(2) : "",
        totalVotesForRegion(region)
      ];

      results.forEach(function (result) {
        row.push(result.pct != null ? result.pct.toFixed(2) : "");
        row.push(result.votes === "" ? "" : Math.round(result.votes));
      });

      lines.push(row.map(csvEscape).join(","));
    });

    downloadBlob(["\uFEFF", lines.join("\r\n")], "text/csv;charset=utf-8", exportFileName("results", "csv"));
  }

  function init() {
    var footer = document.querySelector(".map-footer");
    if (!footer) return;
    injectStyles();

    var actions = footer.querySelector(".map-footer__actions");
    if (!actions) {
      actions = document.createElement("div");
      actions.className = "map-footer__actions";
      footer.appendChild(actions);
    }

    if (!document.getElementById("export-svg")) {
      var svgButton = document.createElement("button");
      svgButton.id = "export-svg";
      svgButton.type = "button";
      svgButton.className = "button button--ghost";
      svgButton.textContent = "Export SVG";
      svgButton.addEventListener("click", exportMapSvg);
      actions.appendChild(svgButton);
    }

    if (!document.getElementById("export-csv")) {
      var csvButton = document.createElement("button");
      csvButton.id = "export-csv";
      csvButton.type = "button";
      csvButton.className = "button button--ghost";
      csvButton.textContent = "Export CSV";
      csvButton.addEventListener("click", exportMapCsv);
      actions.appendChild(csvButton);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
