// client/src/pages/SearchParkingPage.js
import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import ParkingService from "../services/ParkingService";
import MapOverview from "../components/MapOverview";
import LotMapView from "../components/LotView";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import SpotDetails from "../components/SpotDetails";
import GoogleMapsService from "../services/GoogleMapService";
import "./premium-search-parking.css";

const DEFAULT_FILTERS = {
  price: [0, 20],
  covered: "",
  zone: "",
  categories: {
    commuterPremium: false,
    metered: false,
    commuter: false,
    resident: false,
    ada: false,
    reservedMisc: false,
    stateVehiclesOnly: false,
    specialServiceVehiclesOnly: false,
    stateAndSpecialServiceVehicles: false,
    evCharging: false,
  },
};

function SearchParkingPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchedBuilding, setSearchedBuilding] = useState(null);
  const [buildingSuggestions, setBuildingSuggestions] = useState([]);
  const [highlightedSpot, setHighlightedSpot] = useState(null);
  const spotsAbortControllerRef = React.useRef(null);
  const [spotDetailsMap, setSpotDetailsMap] = useState({});
  const [selectedBuildingCoordinates, setSelectedBuildingCoordinates] =
    useState(null);
  const [directionsUrl, setDirectionsUrl] = useState(null);
  const [selectedLotId, setSelectedLotId] = useState(null);
  const location = useLocation();
  const [closestSpots, setClosestSpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDetailSpot, setSelectedDetailSpot] = useState(null);
  const [selectedSpotForReservation, setSelectedSpotForReservation] =
    useState(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [mapCenter, setMapCenter] = useState(undefined);
  const [autoCenter, setAutoCenter] = useState(true);
  const [spotWalkTimes, setSpotWalkTimes] = useState({});

  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  // "Active" filters are only set when you click Apply Filters
  const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);
  const [filteredAvailableSpots, setFilteredAvailableSpots] = useState([]); // Spot objects with spotId


  // Helper to get filter labels for tags
  const getActiveFilterLabels = () => {
    const labels = [];
    if (activeFilters.price[1] !== 20) labels.push(`≤ $${activeFilters.price[1]}`);
    if (activeFilters.covered) labels.push(activeFilters.covered.charAt(0).toUpperCase() + activeFilters.covered.slice(1));
    if (activeFilters.zone) labels.push(activeFilters.zone.charAt(0).toUpperCase() + activeFilters.zone.slice(1));
    Object.entries(activeFilters.categories)
      .filter(([_, checked]) => checked)
      .forEach(([cat]) => {
        labels.push(cat.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()));
      });
    return labels;
  };
  const activeFilterLabels = getActiveFilterLabels();

  // ...existing code...
  const removeFilterTag = async (idx) => {
    let i = 0;
    let newFilters = JSON.parse(JSON.stringify(activeFilters));
    let newDraft = JSON.parse(JSON.stringify(draftFilters));
    // Price
    if (activeFilters.price[1] !== 20) {
      if (i === idx) {
        newFilters.price = [0, 20];
        newDraft.price = [0, 20];
        setDraftFilters(newDraft);
        await applyFiltersAndFetch(newFilters);
        return;
      }
      i++;
    }
    // Covered
    if (activeFilters.covered) {
      if (i === idx) {
        newFilters.covered = "";
        newDraft.covered = "";
        setDraftFilters(newDraft);
        await applyFiltersAndFetch(newFilters);
        return;
      }
      i++;
    }
    // Zone
    if (activeFilters.zone) {
      if (i === idx) {
        newFilters.zone = "";
        newDraft.zone = "";
        setDraftFilters(newDraft);
        await applyFiltersAndFetch(newFilters);
        return;
      }
      i++;
    }
    // Categories
    for (const [cat, checked] of Object.entries(activeFilters.categories)) {
      if (checked) {
        if (i === idx) {
          newFilters.categories[cat] = false;
          newDraft.categories[cat] = false;
          setDraftFilters(newDraft);
          await applyFiltersAndFetch(newFilters);
          return;
        }
        i++;
      }
    }
  };


  useEffect(() => {
    const userType = localStorage.getItem("userType");
    if (userType && ["faculty", "student", "visitor"].includes(userType)) {
      setDraftFilters((f) => ({ ...f, zone: userType }));
      setActiveFilters((f) => ({ ...f, zone: userType }));
    }
  }, []);

  useEffect(() => {
    // On first render, force the URL to reset to '/search-parking'
    if (location.search) {
      navigate("/search-parking", { replace: true });
    }
    // Also reset your state to default values if needed:
    setSearchQuery("");
    setSearchedBuilding(null);
    setBuildingSuggestions([]);
    setClosestSpots([]);
    setSelectedLotId(null);
    setHighlightedSpot(null);
    setDirectionsUrl(null);
    setMapCenter(undefined);
    setAutoCenter(true);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setBuildingSuggestions([]);
      return;
    }
    if (
      searchedBuilding &&
      searchedBuilding.name.toLowerCase() === searchQuery.trim().toLowerCase()
    ) {
      setBuildingSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      ParkingService.searchBuildings(searchQuery)
        .then((data) => {
          setBuildingSuggestions(data);
          console.log("Building suggestions:", data);
        })
        .catch((err) => console.error(err));
    }, 100);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchedBuilding]);

  const applyFiltersAndFetch = async (filtersToApply = draftFilters) => {
    setActiveFilters(filtersToApply);
    console.log(filtersToApply)
    try {
      const spots = await ParkingService.fetchFilteredAvailableSpots(filtersToApply);
      console.log(spots[0])
      setFilteredAvailableSpots(spots);
    } catch (err) {
      setFilteredAvailableSpots([]);
    }
  };

  // Only updates draft filters (UI), not active filters
  const handleFilterClear = () => {
    setDraftFilters(DEFAULT_FILTERS);
  };

  // Copies draft filters to active filters and fetches filtered spots (but does NOT search)
  const handleApplyFilters = async (e) => {
    if (e) e.preventDefault();
    await applyFiltersAndFetch(draftFilters);
  };

  // Remove a filter tag and update active filters (acts as apply)
  const handleRemoveFilterTag = async (idx) => {
    await removeFilterTag(idx);
  };

  const performSearch = async (selectedBuilding = null) => {
    console.log(
      "Performing search with building:",
      searchedBuilding || selectedBuilding
    ); // Log the building used for search
    setClosestSpots([]);
    setLoading(true);
    setIsCollapsed(false);
    setError(null);

    let buildingId = "";
    let buildingToUse = null;

    // If a building is passed (from suggestion click), use it
    if (selectedBuilding) {
      buildingToUse = selectedBuilding;
      buildingId = selectedBuilding.buildingID;
    } else if (searchedBuilding) {
      buildingToUse = searchedBuilding;
      buildingId = searchedBuilding.buildingID;
    } else if (buildingSuggestions.length > 0) {
      // Try to find an exact match first
      const exactMatch = buildingSuggestions.find(
        (b) => b.name.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (exactMatch) {
        buildingToUse = exactMatch;
        buildingId = exactMatch.buildingID;
        setSearchedBuilding(exactMatch);
        setSearchQuery(exactMatch.name);
      } else {
        // Fallback to the first suggestion
        buildingToUse = buildingSuggestions[0];
        buildingId = buildingSuggestions[0].buildingID;
        setSearchedBuilding(buildingSuggestions[0]);
        setSearchQuery(buildingSuggestions[0].name);
      }
    } else {
      setError("No building suggestions found for this query.");
      setLoading(false);
      return;
    }

    // Clear suggestions once search is triggered
    setBuildingSuggestions([]);

    // Recenter if autoCenter is enabled and building has a centroid.
    if (buildingToUse && buildingToUse.centroid) {
      setAutoCenter(true);
      setMapCenter([buildingToUse.centroid.y, buildingToUse.centroid.x]);
    }

    if (spotsAbortControllerRef.current) {
      spotsAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    spotsAbortControllerRef.current = controller;

    let spotIdsToUse = [];
    console.log("yoyo")
    try {
      if (
        activeFilterLabels.length > 0 &&
        filteredAvailableSpots.length > 0
      ) {
        spotIdsToUse = filteredAvailableSpots.map((s) => s.spotId);
        console.log("yo")
      } else {
        console.log("yoyoyo")
        const allAvailableSpots = await ParkingService.fetchAllAvailableSpots();
        spotIdsToUse = allAvailableSpots.map((s) => s.spotId);
      } 
    } catch (err) {
      setError("Failed to load available spots for filtering.");
      setLoading(false);
      return;
    }
    
  

    try {
      navigate(
        getSearchParkingUrl({
          buildingId: buildingToUse.buildingID,
          lotId: selectedLotId || undefined, // Include lotId if present
        })
      );
      const data = await ParkingService.fetchClosestSpots(buildingId, {
        signal: controller.signal, spotIds: spotIdsToUse,
      });
      console.log("Closest spots:", data.spots); // Log closest spots
      setSelectedBuildingCoordinates([
        buildingToUse.centroid.y,
        buildingToUse.centroid.x,
      ]);
      setClosestSpots(data.spots);
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Request aborted for current search.");
        // Do not update error or loading state here.
        return;
      } else {
        setError("Failed to load closest spots");
        console.error(err);
      }
    } finally {
      if (spotsAbortControllerRef.current === controller) {
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    // Only run when closestSpots changes
    if (closestSpots.length > 0) {
      const computedWalkTimes = {};
      closestSpots.forEach((spot) => {
        // Calculate walk time based on the spot's distance (in meters)
        const baseWalkTime = spot.distance / 1.3 / 60; // in minutes
        const minWalkTime = Math.max(1, Math.floor(baseWalkTime));
        const extraRange = Math.floor(spot.distance / 300);
        const maxWalkTime = minWalkTime + 2 + extraRange;

        computedWalkTimes[spot.spotId] = { min: minWalkTime, max: maxWalkTime };
      });
      setSpotWalkTimes(computedWalkTimes);
    }
  }, [closestSpots]);

  const handleSearch = (e) => {
    console.log("Selected building:", e);
    e.preventDefault();
    setBuildingSuggestions([]);
    setAutoCenter(true);
    performSearch();
  };

  const handleSuggestionSelect = (building) => {
    console.log("Selected building:", building);
    setSearchQuery(building.name);
    setSearchedBuilding(building);
    setBuildingSuggestions([]);
    setAutoCenter(true);
    performSearch(building);
  };

  const handleMapMove = (newCenter) => {
    setMapCenter(newCenter);
    setAutoCenter(false);
  };

  const handleReserveSpot = (spotInfo) => {
    setSelectedSpotForReservation(spotInfo);
    navigate(`/reservations/${spotInfo.spotId}`, {
      state: { spotInfo, searchedBuilding },
    });
  };

  const handleRecenter = (lotCoordinates) => {
    if (!lotCoordinates) return;
    console.log("Recentering map to:", lotCoordinates);
    setMapCenter(lotCoordinates);
    setAutoCenter(true);
  };

  const handleGetDirections = (spot) => {
    console.log(
      spot.spotId,
      getSearchParkingUrl({
        buildingId: searchedBuilding?.buildingID,
        spotId: spot.spotId, // include spotId in the URL
        mode: "directions",
      })
    );
    navigate(
      getSearchParkingUrl({
        buildingId: searchedBuilding?.buildingID,
        spotId: spot.spotId, // include spotId in the URL
        mode: "directions",
      })
    );
    const details = spotDetailsMap[spot.spotId];
    if (!details || !details.location) {
      console.error("Missing spot location data");
      return;
    }
    const originLat = details.location.coordinates[1];
    const originLng = details.location.coordinates[0];
    const origin = `${originLat},${originLng}`;
    const destinationCoords =
      selectedBuildingCoordinates || (mapCenter ? mapCenter : null);
    if (!destinationCoords) {
      console.error("Destination coordinates not set.");
      return;
    }
    const destination = `${destinationCoords[0]},${destinationCoords[1]}`;

    const embedUrl = GoogleMapsService.getDirectionsEmbedUrl(
      origin,
      destination,
      "walking"
    );

    setDirectionsUrl(embedUrl);
  };

  useEffect(() => {
    if (!searchedBuilding) {
      setHighlightedSpot(null);
    }
  }, [searchedBuilding]);

  const handleViewSpot = (spotId) => {
    const details = spotDetailsMap[spotId];
    if (!details || !details.location) {
      console.error("Missing spot location data for view");
      return;
    }
    const spotCoords = [
      details.location.coordinates[1],
      details.location.coordinates[0],
    ];
    console.log("Centering on spot:", spotId, "at", spotCoords);
    setMapCenter(spotCoords);
    setAutoCenter(false);
    if (searchedBuilding) {
      setHighlightedSpot(spotId);
    } else {
      setHighlightedSpot(null);
    }
    if (
      !selectedLotId ||
      (details.lot && details.lot.lotId !== selectedLotId)
    ) {
      setSelectedLotId(details.lot.lotId);
    }

    setIsCollapsed(true);

    // Clear directions if present (for example, when in Google Embed mode)
    if (directionsUrl) {
      setDirectionsUrl(null);
    }
    // Optionally, if you maintain a zoom level state in LotMapView,
    // you could trigger a smooth zoom in sequence here.
  };

  const getSearchParkingUrl = (params = {}) => {
    const orderedParams = [];
    if (params.buildingId) {
      orderedParams.push(`buildingId=${encodeURIComponent(params.buildingId)}`);
    }
    if (params.lotId) {
      orderedParams.push(`lotId=${encodeURIComponent(params.lotId)}`);
    }
    if (params.spotId) {
      orderedParams.push(`spotId=${encodeURIComponent(params.spotId)}`);
    }
    if (params.mode) {
      orderedParams.push(`mode=${encodeURIComponent(params.mode)}`);
    }
    // Append any additional parameters
    Object.entries(params).forEach(([key, value]) => {
      if (!["buildingId", "lotId", "spotId", "mode"].includes(key) && value) {
        orderedParams.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        );
      }
    });
    return orderedParams.length
      ? `/search-parking?${orderedParams.join("&")}`
      : "/search-parking";
  };

  const handleLotClick = (lotId) => {
    setSelectedLotId(lotId);
    navigate(
      getSearchParkingUrl({
        buildingId: searchedBuilding ? searchedBuilding.buildingID : "",
        lotId,
      })
    );
  };

  const handleBackFromLot = () => {
    setSelectedLotId(null);
    setAutoCenter(false);
    setDirectionsUrl(null);
    setHighlightedSpot(null);
    navigate(
      getSearchParkingUrl({
        buildingId: searchedBuilding?.buildingID,
      })
    );
  };

  const handleCancelSearch = () => {
    setLoading(false);
    // Abort ongoing closest spots request.
    if (spotsAbortControllerRef.current) {
      spotsAbortControllerRef.current.abort();
      spotsAbortControllerRef.current = null;
    }
    // Clear search query, suggestions, and results.
    setSearchQuery("");
    setBuildingSuggestions([]);
    setClosestSpots([]);
    setSearchedBuilding(null);
    setHighlightedSpot(null);
    // setIsCollapsed(true); // Collapse results panel
    // Optionally, remove focus from the input:
    // document.activeElement.blur();
    if (selectedLotId) {
      // If lot map view is active, remove buildingId but preserve lotId.
      navigate(getSearchParkingUrl({ lotId: selectedLotId }));
    } else {
      navigate(getSearchParkingUrl());
    }
  };



  useEffect(() => {
    closestSpots.forEach((spot) => {
      if (!spotDetailsMap[spot.spotId]) {
        ParkingService.fetchSpotDetails(spot.spotId)
          .then((data) => {
            setSpotDetailsMap((prev) => ({ ...prev, [spot.spotId]: data }));
          })
          .catch((err) =>
            console.error(`Error fetching details for ${spot.spotId}:`, err)
          );
      }
    });
  }, [closestSpots]);

  return (
    <div className="premium-search-page">
      <div className="premium-header">
        <Header />
      </div>

      <div className="search-container">
        {/* Filters Panel */}
        <div className="filters-panel">
          <div className="filters-header">
            <svg
              className="filters-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <h2>Search Filters</h2>
          </div>
          <div className="filters-body">
            {/* Price Slider */}
            <div className="filter-group">
              <label className="filter-label">Price ($/hr)</label>
              <input
                type="range"
                min={0}
                max={20}
                value={draftFilters.price[1]}
                onChange={(e) =>
                  setDraftFilters((f) => ({
                    ...f,
                    price: [0, Number(e.target.value)],
                  }))
                }
              />
              <div>Up to ${draftFilters.price[1]}</div>
            </div>

            {/* Covered/Uncovered */}
            <div className="filter-group">
              <label className="filter-label">Covered / Uncovered</label>
              <select
                className="filter-select"
                value={draftFilters.covered}
                onChange={(e) =>
                  setDraftFilters((f) => ({ ...f, covered: e.target.value }))
                }
              >
                <option value="">All types</option>
                <option value="covered">Covered</option>
                <option value="uncovered">Uncovered</option>
              </select>
            </div>

            {/* Zone */}
            <div className="filter-group">
              <label className="filter-label">Zone</label>
              <select
                className="filter-select"
                value={draftFilters.zone}
                onChange={(e) =>
                  setDraftFilters((f) => ({ ...f, zone: e.target.value }))
                }
              >
                <option value="">All</option>
                <option value="faculty">Faculty</option>
                <option value="student">Student</option>
                <option value="visitor">Visitor</option>
              </select>
            </div>

            {/* Categories */}
            <div className="filter-group">
              <div className="filter-checkbox-group">
                {Object.keys(draftFilters.categories).map((cat) => (
                  <div className="filter-checkbox-item" key={cat}>
                    <input
                      type="checkbox"
                      id={cat}
                      checked={draftFilters.categories[cat]}
                      onChange={(e) =>
                        setDraftFilters((f) => ({
                          ...f,
                          categories: {
                            ...f.categories,
                            [cat]: e.target.checked,
                          },
                        }))
                      }
                    />
                    <label htmlFor={cat}>
                      {cat
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (s) => s.toUpperCase())}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="filter-actions">
              <button className="filter-clear-btn" onClick={handleFilterClear}>
                Clear All
              </button>
              <button className="filter-apply-btn" onClick={handleApplyFilters}>
                Apply Filters
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Search Bar */}
          <div className="search-bar-container">
            <form className="search-bar-wrapper" onSubmit={handleSearch}>
              <div className="premium-search-bar">
                <div className="search-input-wrapper">
                  <input
                    type="text"
                    placeholder="Search by building name or destination..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchedBuilding(null);
                    }}
                    onBlur={() =>
                      setTimeout(() => setBuildingSuggestions([]), 300)
                    }
                    onFocus={() => {
                      if (!searchQuery.trim()) {
                        ParkingService.searchBuildings("")
                          .then((data) => {
                            console.log("Building suggestions on focus:", data);
                            setBuildingSuggestions(data);
                          })
                          .catch((err) => console.error(err));
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="cancel-search-btn"
                      onClick={() => {
                        handleCancelSearch();
                      }}
                    >
                      <svg viewBox="0 0 24 24">
                        <line
                          x1="18"
                          y1="6"
                          x2="6"
                          y2="18"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <line
                          x1="6"
                          y1="6"
                          x2="18"
                          y2="18"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                <button type="submit" className="search-submit-btn">
                  <svg
                    className="search-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  Search
                </button>
              </div>
              {buildingSuggestions.length > 0 && (
              <div className="suggestions">
                {buildingSuggestions.map((building, idx) => (
                  <div
                    key={idx}
                    className="suggestion-item"
                    onClick={() => {
                      handleSuggestionSelect(building);
                      console.log("Suggestion clicked:", building);
                    }}
                  >
                    {building.name}
                  </div>
                ))}
              </div>
            )}
            </form>
            {activeFilterLabels.length > 0 && (
              <div className="active-filters-tags">
                {activeFilterLabels.map((label, idx) => (
                  <span className="filter-tag" key={label}>
                    {label}
                    <button
                      className="remove-tag-btn"
                      type="button"
                      onClick={() => handleRemoveFilterTag(idx)}
                      aria-label={`Remove filter ${label}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Floating Suggestions Overlay */}

          {/* Results and Map */}
          <div className="results-map-container">
            {/* Results Panel */}
            <div className={`results-panel ${isCollapsed ? "collapsed" : ""}`}>
              {loading ? (
                <div className="results-loading">
                  <div className="spinner" />
                  <p>Loading spots...</p>
                </div>
              ) : (
                !isCollapsed && (
                  <div className="results-content">
                    {closestSpots.length > 0 ? (
                      closestSpots.map((spot, index) => {
                        const [lotIdFromSpot, spotNumber] =
                          spot.spotId.split("-");
                        const details = spotDetailsMap[spot.spotId];
                        // Use official lot name from fetched spot details; fallback to lotIdFromSpot if not available.
                        const officialLotName =
                          details && details.lot
                            ? details.lot.officialLotName
                            : lotIdFromSpot;

                        // Walk time using 1.3 m/s:
                        const roundedDistance = parseFloat(
                          spot.distance
                        ).toFixed(2);

                        return (
                          <div key={index} className="spot-card">
                            <div className="spot-card-header">
                              <h3 className="spot-card-title">
                                {officialLotName
                                  .substring(0, 3)
                                  .toLowerCase() === "lot"
                                  ? ""
                                  : "Lot"}{" "}
                                {officialLotName} Spot {spotNumber}
                              </h3>
                              <div className="spot-card-controls">
                                <button
                                  className="spot-card-recenter"
                                  onClick={() =>
                                    handleRecenter([
                                      details.lot.centroid.x,
                                      details.lot.centroid.y,
                                    ])
                                  }
                                  title="Recenter to Lot"
                                >
                                  <img
                                    src={require("../assets/point.png")}
                                    alt="Recenter"
                                  />
                                </button>
                                <button
                                  className="spot-card-show-spot-btn"
                                  onClick={() => {
                                    navigate(
                                      getSearchParkingUrl({
                                        buildingId:
                                          searchedBuilding?.buildingID,
                                        lotId: details.lot.lotId,
                                        highlightedSpot: spot.spotId,
                                      })
                                    );
                                    handleViewSpot(spot.spotId);
                                  }}
                                  title="Show Spot"
                                >
                                  <img
                                    src={require("../assets/focus.png")}
                                    alt="Show Spot"
                                  />
                                </button>
                              </div>
                              <div className="spot-card-subtitle">
                                Distance: {roundedDistance} m
                              </div>
                            </div>
                            <div className="spot-card-body">
                              <div className="spot-detail">
                                <svg
                                  className="spot-detail-icon"
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <polyline points="12 6 12 12 16 14"></polyline>
                                </svg>
                                <span className="spot-detail-label">
                                  Walk Time:
                                </span>
                                <span className="spot-detail-value">
                                  {spotWalkTimes[spot.spotId]?.min}-
                                  {spotWalkTimes[spot.spotId]?.max} minutes
                                </span>
                              </div>
                            </div>
                            <div className="spot-card-footer three-col">
                              <div className="footer-left-col">
                                <button
                                  className="spot-card-btn spot-view-details-btn"
                                  onClick={() => {
                                    // Example: /spot-details?buildingId=...&lotId=...&spotId=...
                                    navigate(
                                      getSearchParkingUrl({
                                        buildingId:
                                          searchedBuilding?.buildingID,
                                        lotId: details.lot.lotId,
                                        spotId: spot.spotId,
                                        mode: "info",
                                      })
                                    );

                                    setSelectedDetailSpot(spot.spotId);
                                  }}
                                >
                                  {/* Using the same icon from SpotDetails (an SVG) */}
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </svg>
                                  View Details
                                </button>
                              </div>

                              <div className="footer-middle-col">
                                <button
                                  className="spot-card-btn spot-reserve-btn"
                                  onClick={() => handleReserveSpot(spot)}
                                >
                                  {/* Using your existing icon (if any) for reserve */}
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <rect
                                      x="9"
                                      y="9"
                                      width="13"
                                      height="13"
                                      rx="2"
                                      ry="2"
                                    ></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                  </svg>
                                  Reserve
                                </button>
                              </div>

                              <div className="footer-right-col">
                                <button
                                  className="spot-card-btn spot-get-directions-btn"
                                  onClick={() => {
                                    handleGetDirections(spot);
                                  }}
                                >
                                  {/* For get directions, use an asset icon */}
                                  <img
                                    src={require("../assets/get-directions.png")}
                                    alt="Get Directions"
                                  />
                                  Get Directions
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="no-results-message">
                        {/* Example SVG icon for no results – replace with your own if needed */}
                        <svg viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" />
                          <line
                            x1="12"
                            y1="7"
                            x2="12"
                            y2="13"
                            stroke="white"
                            strokeWidth="2"
                          />
                          <circle cx="12" cy="16" r="1" fill="white" />
                        </svg>
                        {searchedBuilding === null
                          ? "No buildings searched"
                          : "No spots found"}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>

            {/* Map */}
            <div className="map-container">
              <button
                className="collapse-button"
                onClick={() => {
                  console.log("Toggle clicked, autoCenter:", autoCenter);
                  setIsCollapsed(!isCollapsed);
                }}
                title={isCollapsed ? "Show Results" : "Hide Results"}
              >
                {isCollapsed ? ">>" : "<<"}
              </button>
              {directionsUrl ? (
                <div className="directions-container">
                  <button
                    className="directions-back-btn"
                    onClick={() => {
                      setDirectionsUrl(null);
                      setSelectedLotId(null);
                      setHighlightedSpot(null);
                      navigate(
                        getSearchParkingUrl({
                          buildingId: searchedBuilding?.buildingID,
                        })
                      );
                    }}
                  >
                    Back
                  </button>
                  <iframe
                    title="Google Directions"
                    src={directionsUrl}
                    style={{ border: 0, width: "100%", height: "100%" }}
                    allowFullScreen
                  />
                </div>
              ) : selectedLotId ? (
                <LotMapView
                  lotId={selectedLotId}
                  onBack={handleBackFromLot}
                  highlightedSpot={highlightedSpot}
                />
              ) : (
                <MapOverview
                  onLotClick={handleLotClick}
                  center={mapCenter}
                  resultsOpen={!isCollapsed}
                  autoCenter={autoCenter}
                  onMapMove={handleMapMove}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Spot detail Modal */}
      {selectedDetailSpot && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target.className === "modal-backdrop") {
              setSelectedDetailSpot(null);
              navigate(
                getSearchParkingUrl({
                  buildingId: searchedBuilding?.buildingID,
                  lotId: selectedLotId || undefined,
                })
              );
            }
          }}
        >
          <div className="modal-content">
            <SpotDetails
              spotId={selectedDetailSpot}
              onClose={() => {
                setSelectedDetailSpot(null);
                navigate(
                  getSearchParkingUrl({
                    buildingId: searchedBuilding?.buildingID,
                    lotId: selectedLotId || undefined,
                  })
                );
              }}
              onReserve={handleReserveSpot}
              onGetDirections={(spotData) => {
                handleGetDirections(spotData);
                console.log(spotData.spotId);
                setIsCollapsed(true);
              }}
              minWalkTime={spotWalkTimes[selectedDetailSpot]?.min}
              maxWalkTime={spotWalkTimes[selectedDetailSpot]?.max}  
              // minWalkTime={selectedWalkTimes.minWalkTime}
              // maxWalkTime={selectedWalkTimes.maxWalkTime}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchParkingPage;
