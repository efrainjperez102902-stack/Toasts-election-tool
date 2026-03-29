(function () {
  function normalizeCountyName(name) {
    return String(name || "")
      .toLowerCase()
      .replace(/^county of /, "")
      .replace(/ county$/, "")
      .replace(/\./g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function defaultVotes(region, locality) {
    if (typeof region.localityVotes === "number" && region.localityVotes > 0) return region.localityVotes;
    if (typeof region.countyVotes === "number" && region.countyVotes > 0) return region.countyVotes;
    if (locality && locality.votes && locality.votes.total) return locality.votes.total;
    if (locality && locality.pop) return locality.pop;
    return 0;
  }

  function setup(options) {
    var state = options.state;
    var countyEntries = [];
    var countyAggregates = {};
    var built = false;

    function buildCountyLayer() {
      if (built) return true;
      if (!window.US_COUNTIES_TOPO || !window.topojson) return false;

      var topo = window.US_COUNTIES_TOPO;
      var allCounties = topojson.feature(topo, topo.objects.counties).features || [];
      var features = allCounties.filter(function (feature) {
        return String(feature.id || "").indexOf(options.stateFipsPrefix) === 0;
      });
      if (!features.length) return false;

      var layerEl = options.countyLayerEl;
      var stageEl = options.mapStageEl;
      layerEl.innerHTML = "";

      var width = layerEl.clientWidth || options.mapShellEl.clientWidth || 480;
      var rect = stageEl.getBoundingClientRect();
      var height = Math.max(Math.round(rect.height || layerEl.clientHeight || 0), options.minHeight || 420);
      var projection = d3.geoMercator().fitExtent([[16, 16], [width - 16, height - 16]], {
        type: "FeatureCollection",
        features: features
      });
      var path = d3.geoPath(projection);
      var svg = d3.select(layerEl).append("svg")
        .attr("viewBox", "0 0 " + width + " " + height)
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("preserveAspectRatio", "xMidYMid meet");

      countyEntries = features.map(function (feature) {
        var name = feature && feature.properties ? feature.properties.name : "";
        var pathEl = svg.append("path")
          .attr("d", path(feature))
          .attr("fill", "#d8cfc0")
          .attr("class", "county-active")
          .attr("data-county-name", name)
          .on("mouseover", function () { showCountyTooltip(name); })
          .on("mousemove", function () { showCountyTooltip(name); })
          .on("mouseleave", hideTooltip);

        return {
          name: name,
          key: normalizeCountyName(name),
          feature: feature,
          path: pathEl
        };
      });

      built = true;
      return true;
    }

    function aggregateCountyResults() {
      var aggregates = {};
      var candidates = options.currentCandidates();

      state.regions.forEach(function (region) {
        if (!region.result) return;
        var locality = options.localityAccessor(region);
        if (!locality) return;
        var countyName = options.countyNameAccessor(locality, region, countyEntries);
        if (!countyName) return;

        var key = normalizeCountyName(countyName);
        if (!aggregates[key]) {
          aggregates[key] = {
            name: countyName,
            units: 0,
            votes: 0,
            population: 0,
            raw: {},
            pct: {}
          };
          candidates.forEach(function (candidate) {
            aggregates[key].raw[candidate.id] = 0;
            aggregates[key].pct[candidate.id] = 0;
          });
        }

        var bucket = aggregates[key];
        var votes = Math.max(0, options.votesAccessor ? options.votesAccessor(region, locality) : defaultVotes(region, locality));
        bucket.units += 1;
        bucket.votes += votes;
        bucket.population += Number(locality.pop) || 0;

        candidates.forEach(function (candidate) {
          bucket.raw[candidate.id] += votes * ((region.result[candidate.id] || 0) / 100);
        });
      });

      Object.keys(aggregates).forEach(function (key) {
        var bucket = aggregates[key];
        var total = 0;
        candidates.forEach(function (candidate) {
          total += bucket.raw[candidate.id] || 0;
        });
        if (total > 0) {
          candidates.forEach(function (candidate) {
            bucket.pct[candidate.id] = (bucket.raw[candidate.id] || 0) / total * 100;
          });
        }
      });

      countyAggregates = aggregates;
      return aggregates;
    }

    function render() {
      if (!buildCountyLayer()) return;
      var aggregates = aggregateCountyResults();

      countyEntries.forEach(function (entry) {
        var aggregate = aggregates[entry.key];
        var color = "#d8cfc0";
        if (aggregate) {
          var winnerId = options.winnerOf(aggregate.pct);
          var winnerPct = aggregate.pct[winnerId] || 0;
          var winner = options.candById(winnerId);
          if (winner) color = options.candidateMapColor(winner.palette.strong, winnerPct);
        }
        entry.path.attr("fill", color).classed("selected", false);
      });
    }

    function hideTooltip() {
      var tt = document.getElementById("map-tooltip");
      if (tt) tt.hidden = true;
    }

    function showCountyTooltip(name) {
      var tt = document.getElementById("map-tooltip");
      if (!tt) return;

      var aggregate = countyAggregates[normalizeCountyName(name)];
      var candidates = options.currentCandidates();

      document.getElementById("tt-title").textContent = name + " County";
      document.getElementById("tt-meta").textContent = aggregate
        ? aggregate.units + " " + options.localityLabel + " · Est. votes: " + Math.round(aggregate.votes).toLocaleString()
        : "No aggregated results yet.";

      document.getElementById("tt-candidates").innerHTML = aggregate
        ? candidates.slice().sort(function (a, b) {
            return (aggregate.pct[b.id] || 0) - (aggregate.pct[a.id] || 0);
          }).map(function (candidate) {
            var pct = (aggregate.pct[candidate.id] || 0).toFixed(1);
            var votes = Math.round(aggregate.raw[candidate.id] || 0).toLocaleString();
            return '<div class="map-tooltip__row">' +
              '<span style="color:' + candidate.palette.strong + ';font-weight:700;">' + options.escapeHtml(candidate.name.split(" ")[0]) + '</span>' +
              '<span style="font-variant-numeric:tabular-nums;">' + pct + '% &nbsp;<span style="color:var(--muted);font-size:0.75rem;">(' + votes + ')</span></span>' +
              '</div>';
          }).join("")
        : "<em>&mdash;</em>";

      tt.hidden = false;
    }

    function refreshLabels(view) {
      if (options.eyebrowEl) {
        options.eyebrowEl.textContent = view === "counties"
          ? (options.countyMapLabel || "County Map")
          : (options.municipalMapLabel || "Municipality Map");
      }
      if (options.statusEl && options.statusEl.getAttribute("data-error") !== "1") {
        options.statusEl.textContent = view === "counties"
          ? countyEntries.length + " counties shown"
          : state.regions.length + " " + options.localityCountLabel + " loaded";
      }
    }

    function setView(view) {
      buildCountyLayer();
      options.municipalLayerEl.hidden = view === "counties";
      options.countyLayerEl.hidden = view !== "counties";
      refreshLabels(view);
      if (view === "counties") render();
    }

    return {
      build: buildCountyLayer,
      render: render,
      setView: setView,
      refreshLabels: refreshLabels,
      hideTooltip: hideTooltip
    };
  }

  window.NewEnglandCountyToggle = {
    setup: setup
  };
})();
