(function () {
  "use strict";

  var mapPublishObserver = null;
  var mapPublishTimer = null;
  var mapPublishForce = false;
  var lastPublishedMarkup = "";

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

  function serializedMapSvg(sourceSvg) {
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

    var viewBox = sourceSvg.viewBox && sourceSvg.viewBox.baseVal ? sourceSvg.viewBox.baseVal : null;
    var rect = sourceSvg.getBoundingClientRect ? sourceSvg.getBoundingClientRect() : { width: 0, height: 0 };
    var width = Math.max(
      1,
      Math.round(rect.width || 0),
      Math.round(Number(sourceSvg.getAttribute("width")) || 0),
      Math.round(viewBox && viewBox.width || 0)
    );
    var height = Math.max(
      1,
      Math.round(rect.height || 0),
      Math.round(Number(sourceSvg.getAttribute("height")) || 0),
      Math.round(viewBox && viewBox.height || 0)
    );

    return {
      markup: markup,
      width: width,
      height: height,
      viewBox: viewBox
        ? [viewBox.x, viewBox.y, viewBox.width, viewBox.height].join(" ")
        : (sourceSvg.getAttribute("viewBox") || "")
    };
  }

  function postEmbeddedMapSnapshot(force) {
    if (!(window.parent && window.parent !== window && typeof window.parent.postMessage === "function")) return;
    var sourceSvg = getVisibleMapSvg();
    if (!sourceSvg) return;

    var serialized = serializedMapSvg(sourceSvg);
    if (!serialized) return;
    if (!force && serialized.markup === lastPublishedMarkup) return;

    lastPublishedMarkup = serialized.markup;
    window.parent.postMessage({
      type: "codex-map-snapshot",
      pagePath: window.location && window.location.pathname
        ? String(window.location.pathname).split(/[\\/]/).pop()
        : "",
      markup: serialized.markup,
      width: serialized.width,
      height: serialized.height,
      viewBox: serialized.viewBox || "",
      mapView: window.state && typeof window.state.mapView === "string" ? window.state.mapView : "",
      atlasRows: currentAtlasRows(),
      entries: currentEntries()
    }, "*");
  }

  function scheduleEmbeddedMapSnapshot(force) {
    if (force) mapPublishForce = true;
    if (mapPublishTimer) return;
    mapPublishTimer = window.setTimeout(function () {
      var shouldForce = mapPublishForce;
      mapPublishTimer = null;
      mapPublishForce = false;
      postEmbeddedMapSnapshot(shouldForce);
    }, force ? 20 : 120);
  }

  function bindEmbeddedMapPublisher() {
    if (!(window.parent && window.parent !== window)) return;

    var mapShell = document.getElementById("map-shell");
    if (!mapShell) return;

    if (mapPublishObserver) mapPublishObserver.disconnect();
    mapPublishObserver = new MutationObserver(function () {
      scheduleEmbeddedMapSnapshot(false);
    });
    mapPublishObserver.observe(mapShell, {
      attributes: true,
      childList: true,
      subtree: true
    });

    scheduleEmbeddedMapSnapshot(true);
    window.setTimeout(function () { scheduleEmbeddedMapSnapshot(true); }, 600);
    window.setTimeout(function () { scheduleEmbeddedMapSnapshot(true); }, 1600);

    if (!window.__codexMapSnapshotListenerBound) {
      window.__codexMapSnapshotListenerBound = true;
      window.addEventListener("message", function (event) {
        var data = event.data;
        if (!data || data.type !== "codex-request-map-snapshot") return;
        scheduleEmbeddedMapSnapshot(true);
      });
    }
  }

  function exportMapSvg() {
    var sourceSvg = getVisibleMapSvg();
    if (!sourceSvg) return;
    var serialized = serializedMapSvg(sourceSvg);
    if (!serialized) return;

    downloadBlob([serialized.markup], "image/svg+xml;charset=utf-8", exportFileName("map", "svg"));
  }

  function exportMapImage() {
    var sourceSvg = getVisibleMapSvg();
    if (!sourceSvg) return;
    var serialized = serializedMapSvg(sourceSvg);
    if (!serialized) return;

    var svgBlob = new Blob([serialized.markup], { type: "image/svg+xml;charset=utf-8" });
    var svgUrl = URL.createObjectURL(svgBlob);
    var img = new Image();

    img.onload = function () {
      var canvas = document.createElement("canvas");
      canvas.width = serialized.width;
      canvas.height = serialized.height;
      var ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(svgUrl);
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);

      if (canvas.toBlob) {
        canvas.toBlob(function (pngBlob) {
          if (!pngBlob) return;
          downloadBlob([pngBlob], "image/png", exportFileName("map", "png"));
        }, "image/png");
        return;
      }

      var dataUrl = canvas.toDataURL("image/png");
      var link = document.createElement("a");
      link.href = dataUrl;
      link.download = exportFileName("map", "png");
      document.body.appendChild(link);
      link.click();
      link.remove();
    };

    img.onerror = function () {
      URL.revokeObjectURL(svgUrl);
    };

    img.src = svgUrl;
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

  function normalizeAtlasToken(value) {
    return String(value == null ? "" : value)
      .toLowerCase()
      .replace(/&/g, " and ")
      .replace(/[.'’`,-]/g, " ")
      .replace(/\s+/g, "");
  }

  function atlasSuffixForKind(kind) {
    switch (cleanUnitKind(kind)) {
      case "county":
        return "county";
      case "parish":
        return "parish";
      case "borough":
        return "borough";
      case "census_area":
        return "censusarea";
      case "city_and_borough":
        return "cityandborough";
      case "municipality":
        return "municipality";
      case "district":
        return "district";
      case "ward":
        return "ward";
      case "city":
        return "city";
      default:
        return "";
    }
  }

  function atlasKeysForUnit(name, kind) {
    var baseKey = normalizeAtlasToken(name);
    var suffix = atlasSuffixForKind(kind);
    var fullKey = baseKey;
    if (suffix && baseKey && fullKey.slice(-suffix.length) !== suffix) {
      fullKey += suffix;
    }
    return {
      baseKey: baseKey,
      fullKey: fullKey
    };
  }

  function pathNodeFromValue(pathValue) {
    if (!pathValue) return null;
    if (typeof pathValue.node === "function") return pathValue.node();
    if (pathValue.nodeType === 1) return pathValue;
    if (pathValue._groups && pathValue._groups[0] && pathValue._groups[0][0]) return pathValue._groups[0][0];
    return null;
  }

  function fillFromPath(pathValue) {
    var node = pathNodeFromValue(pathValue);
    if (!node) return "";
    return node.getAttribute("fill") ||
      (window.getComputedStyle ? window.getComputedStyle(node).fill : "") ||
      "";
  }

  function atlasRowFromRegion(region, entries, forcedKind) {
    var unit = getRegionUnit(region);
    var name = unitName(region);
    var kind = forcedKind || unit.kind;
    var keys = atlasKeysForUnit(name, kind);
    var results = orderedRegionResults(region, entries);
    var winner = results[0] || null;
    var fill = fillFromPath(region.path) || (winner && winner.color) || "#d8cfc0";

    return {
      kind: cleanUnitKind(kind),
      name: name,
      baseKey: keys.baseKey,
      fullKey: keys.fullKey,
      fill: fill,
      totalVotes: totalVotesForRegion(region),
      results: results
    };
  }

  function atlasRowFromPublished(row) {
    if (!row || !row.name) return null;
    var kind = cleanUnitKind(row.kind || "county");
    var keys = atlasKeysForUnit(row.name, kind);
    var results = Array.isArray(row.results) ? row.results.map(function (result) {
      return {
        id: result.id || "",
        name: result.name || "",
        color: result.color || "",
        pct: Number(result.pct || 0),
        votes: result.votes === "" || result.votes == null ? "" : Number(result.votes)
      };
    }).sort(function (a, b) {
      return b.pct - a.pct;
    }) : [];

    return {
      kind: kind,
      name: row.name,
      baseKey: keys.baseKey,
      fullKey: keys.fullKey,
      fill: row.fill || (results[0] && results[0].color) || "#d8cfc0",
      totalVotes: row.totalVotes == null || row.totalVotes === "" ? "" : Math.round(Number(row.totalVotes) || 0),
      results: results
    };
  }

  function currentAtlasRows() {
    var state = window.state || {};
    if (
      state.countyToggle &&
      state.mapView === "counties" &&
      typeof state.countyToggle.getCountyRows === "function"
    ) {
      return state.countyToggle.getCountyRows().map(atlasRowFromPublished).filter(Boolean);
    }

    var entries = currentEntries();
    if (!entries.length) return [];

    var forcedKind = state.countyToggle && state.mapView === "municipalities"
      ? "municipality"
      : "";

    return getRegionCollection().map(function (region) {
      return atlasRowFromRegion(region, entries, forcedKind);
    }).filter(Boolean);
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
    injectStyles();

    if (footer) {
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

      if (!document.getElementById("export-image")) {
        var imageButton = document.createElement("button");
        imageButton.id = "export-image";
        imageButton.type = "button";
        imageButton.className = "button button--ghost";
        imageButton.textContent = "Export Image";
        imageButton.addEventListener("click", exportMapImage);
        actions.appendChild(imageButton);
      }
    }

    bindEmbeddedMapPublisher();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
