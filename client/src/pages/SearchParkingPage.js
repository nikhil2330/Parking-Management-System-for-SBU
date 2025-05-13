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
import dayjs from "dayjs";


const DEFAULT_FILTERS = {
  price: [0, 20],
  covered: "",
  zone: "",
  categories: {
    facultyStaff: false,
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
const CATEGORY_LABELS = {
  facultyStaff: "Faculty & Staff",
  commuterPremium: "Commuter Premium",
  metered: "Metered",
  commuter: "Commuter",
  resident: "Resident",
  ada: "Accessible",
  reservedMisc: "Reserved (Misc)",
  stateVehiclesOnly: "State Vehicles Only",
  specialServiceVehiclesOnly: "Special Service Vehicles Only",
  stateAndSpecialServiceVehicles: "State & Special Service Vehicles",
  evCharging: "Electric Vehicle",
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
  const [reservationType, setReservationType] = useState("hourly");

// Hourly
function getNextHourDate() {
  const now = new Date();
  now.setMinutes(0, 0, 0);
  now.setHours(now.getHours() + 1);
  return now;
}
function formatDateForInput(date) {
  const pad = (n) => n.toString().padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes())
  );
}
const defaultStart = getNextHourDate();
const defaultEnd = new Date(defaultStart);
defaultEnd.setHours(defaultEnd.getHours() + 1);
const [dateTimeRange, setDateTimeRange] = useState({
  start: formatDateForInput(defaultStart),
  end: formatDateForInput(defaultEnd),
});

// Daily
const [dailyStartTime, setDailyStartTime] = useState(dayjs().hour(8).minute(0).format("HH:mm"));
const [dailyEndTime, setDailyEndTime] = useState(dayjs().hour(12).minute(0).format("HH:mm"));
const [dailyDateRange, setDailyDateRange] = useState({
  start: dayjs().add(1, "day").format("YYYY-MM-DD"),
  end: dayjs().add(1, "day").format("YYYY-MM-DD"),
});

// Semester
const [semester, setSemester] = useState("summer");
const SEMESTER_BOUNDS = {
  summer: { start: "2025-05-20T00:00", end: "2025-08-10T23:59" },
  fall: { start: "2025-08-20T00:00", end: "2025-12-20T23:59" },
  winter: { start: "2026-01-01T00:00", end: "2025-01-28T23:59" },
};
  const [spotWalkTimes, setSpotWalkTimes] = useState({});
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS);
  // "Active" filters are only set when you click Apply Filters
  const [activeFilters, setActiveFilters] = useState(DEFAULT_FILTERS);

  const [appliedDateTimeRange, setAppliedDateTimeRange] = useState({
    start: formatDateForInput(defaultStart),
    end: formatDateForInput(defaultEnd),
  });

  const handleDateTimeRangeChange = (field, value) => {
    setDateTimeRange((prev) => {
      const updated = { ...prev, [field]: value };
      setAppliedDateTimeRange(updated); // Immediately apply
      return updated;
    });
  };

  const handleApplyDateTimeRange = () => {
    setAppliedDateTimeRange({ ...dateTimeRange });
    // Optionally, trigger a search or update map here
  };

  // Helper to get filter labels for tags
  const getActiveFilterLabels = () => {
    const labels = [];
    if (activeFilters.price[1] !== 20) labels.push(`≤ $${activeFilters.price[1]}`);
    if (activeFilters.covered) labels.push(activeFilters.covered.charAt(0).toUpperCase() + activeFilters.covered.slice(1));
    if (activeFilters.zone) labels.push(activeFilters.zone.charAt(0).toUpperCase() + activeFilters.zone.slice(1));
    Object.entries(activeFilters.categories)
      .filter(([_, checked]) => checked)
      .forEach(([cat]) => {
        labels.push(CATEGORY_LABELS[cat] || cat.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()));
      });
    return labels;
  };
  const activeFilterLabels = getActiveFilterLabels();


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

  function isValidDateTimeRange(range) {
    if (!range || !range.start || !range.end) return false;
    const start = new Date(range.start);
    const end = new Date(range.end);
    return (
      !isNaN(start.getTime()) &&
      !isNaN(end.getTime()) &&
      end > start
    );
  }

  // Only updates draft filters (UI), not active filters
  const handleFilterClear = () => {
    setDraftFilters(DEFAULT_FILTERS);
    setActiveFilters(DEFAULT_FILTERS);
  };

  // Copies draft filters to active filters and fetches filtered spots (but does NOT search)
  const handleApplyFilters = async (e) => {
    if (e) e.preventDefault();
    setActiveFilters(draftFilters);
    // Optionally, trigger a search here:
    // performSearch();
  };

  // Remove a filter tag and update active filters (acts as apply)
  const handleRemoveFilterTag = async (idx) => {
    let i = 0;
    let newFilters = JSON.parse(JSON.stringify(activeFilters));
    let newDraft = JSON.parse(JSON.stringify(draftFilters));
    // Price
    if (activeFilters.price[1] !== 20) {
      if (i === idx) {
        newFilters.price = [0, 20];
        newDraft.price = [0, 20];
        setDraftFilters(newDraft);
        setActiveFilters(newFilters);
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
        setActiveFilters(newFilters);
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
        setActiveFilters(newFilters);
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
          setActiveFilters(newFilters);
          return;
        }
        i++;
      }
    }
  };

  const performSearch = async (selectedBuilding = null) => {
    console.log(
      "Performing search with building:",
      searchedBuilding || selectedBuilding
    );
    setClosestSpots([]);
    setLoading(true);
    setIsCollapsed(false);
    setError(null);

    let buildingId = "";
    let buildingToUse = null;

    // Determine which building to use
    if (selectedBuilding) {
      buildingToUse = selectedBuilding;
      buildingId = selectedBuilding.buildingID;
    } else if (searchedBuilding) {
      buildingToUse = searchedBuilding;
      buildingId = searchedBuilding.buildingID;
    } else if (buildingSuggestions.length > 0) {
      const exactMatch = buildingSuggestions.find(
        (b) => b.name.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (exactMatch) {
        buildingToUse = exactMatch;
        buildingId = exactMatch.buildingID;
        setSearchedBuilding(exactMatch);
        setSearchQuery(exactMatch.name);
      } else {
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

    setBuildingSuggestions([]);

    // Recenter map if building has centroid
    if (buildingToUse && buildingToUse.centroid) {
      setAutoCenter(true);
      setMapCenter([buildingToUse.centroid.y, buildingToUse.centroid.x]);
    }

    // Abort previous search if any
    if (spotsAbortControllerRef.current) {
      spotsAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    spotsAbortControllerRef.current = controller;

    try {
      navigate(
        getSearchParkingUrl({
          buildingId: buildingToUse.buildingID,
          lotId: selectedLotId || undefined,
        })
      );
      /* work out the start / end pair based on reservationType */
      let searchStart, searchEnd;
      if (reservationType === "hourly") {
        searchStart = dateTimeRange.start;
        searchEnd = dateTimeRange.end;
      } else if (reservationType === "daily") {
        searchStart = `${dailyDateRange.start}T${dailyStartTime}`;
        searchEnd = `${dailyDateRange.end}T${dailyEndTime}`;
      } else if (reservationType === "semester") {
        searchStart = SEMESTER_BOUNDS[semester].start;
        searchEnd = SEMESTER_BOUNDS[semester].end;
      }
      const data = await ParkingService.fetchClosestSpots(
        buildingId,
        activeFilters,
        searchStart,
        searchEnd,
        { signal: controller.signal }
      );
      console.log("Closest spots:", data.spots);
      setSelectedBuildingCoordinates([
        buildingToUse.centroid.y,
        buildingToUse.centroid.x,
      ]);
      setClosestSpots(data.spots);
    } catch (err) {
      if (err.name === "CanceledError" || err.name === "AbortError") {
        console.log("Request aborted for current search.");
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

  // Inside handleReserveSpot function in SearchParkingPage.js

const handleReserveSpot = (spotInfo) => {
  setSelectedSpotForReservation(spotInfo);
  
  // Prepare the correct parameters based on reservation type
  const navigationState = {
    spotInfo,
    searchedBuilding,
    startTime: appliedDateTimeRange.start,
    endTime: appliedDateTimeRange.end,
    reservationType,
  };
  
  // Add type-specific parameters
  if (reservationType === 'daily') {
    navigationState.dailyParams = {
      dateRange: dailyDateRange,
      startTime: dailyStartTime,
      endTime: dailyEndTime,
    };
  } else if (reservationType === 'semester') {
    navigationState.semester = semester;
  }
  
  navigate(`/reservations/${spotInfo.spotId}`, { state: navigationState });
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
        <div className="filters-sidebar">
          {/* Reservation Type Toggle */}
          <div className="reservation-type-toggle">
            <button
              type="button"
              className={`reservation-type-toggle-btn${
                reservationType === "hourly" ? " active" : ""
              }`}
              onClick={() => setReservationType("hourly")}
              aria-pressed={reservationType === "hourly"}
            >
              Hourly
            </button>
            <button
              type="button"
              className={`reservation-type-toggle-btn${
                reservationType === "daily" ? " active" : ""
              }`}
              onClick={() => setReservationType("daily")}
              aria-pressed={reservationType === "daily"}
            >
              Daily
            </button>
            <button
              type="button"
              className={`reservation-type-toggle-btn${
                reservationType === "semester" ? " active" : ""
              }`}
              onClick={() => setReservationType("semester")}
              aria-pressed={reservationType === "semester"}
            >
              Semester
            </button>
          </div>

          {/* Hourly */}
          {reservationType === "hourly" && (
  <div className="reservation-datetime-bar vertical">
    <div className="reservation-datetime-row">
      <label className="reservation-datetime-label inline" htmlFor="searchStartTime">
        Start
      </label>
      <input
        className="reservation-datetime-input"
        type="datetime-local"
        id="searchStartTime"
        value={dateTimeRange.start}
        onChange={(e) =>
          setDateTimeRange((prev) => ({
            ...prev,
            start: e.target.value,
          }))
        }
        max={dateTimeRange.end}
      />
    </div>
    <div className="reservation-datetime-row">
      <label className="reservation-datetime-label inline" htmlFor="searchEndTime">
        End
      </label>
      <input
        className="reservation-datetime-input"
        type="datetime-local"
        id="searchEndTime"
        value={dateTimeRange.end}
        onChange={(e) =>
          setDateTimeRange((prev) => ({
            ...prev,
            end: e.target.value,
          }))
        }
        min={dateTimeRange.start}
      />
    </div>
  </div>
)}

{/* Daily */}
{reservationType === "daily" && (
  <div className="daily-inputs-container">
    <div className="daily-input-row">
      <label className="daily-input-label">Start</label>
      <div className="daily-input-group">
        <input
          className="daily-date-input"
          type="date"
          value={dailyDateRange.start}
          max={dailyDateRange.end}
          onChange={(e) =>
            setDailyDateRange((r) => ({ ...r, start: e.target.value }))
          }
        />
        <input
          className="daily-time-input"
          type="time"
          value={dailyStartTime}
          onChange={(e) => setDailyStartTime(e.target.value)}
        />
      </div>
    </div>
    <div className="daily-input-row">
      <label className="daily-input-label">End</label>
      <div className="daily-input-group">
        <input
          className="daily-date-input"
          type="date"
          value={dailyDateRange.end}
          min={dailyDateRange.start}
          onChange={(e) =>
            setDailyDateRange((r) => ({ ...r, end: e.target.value }))
          }
        />
        <input
          className="daily-time-input"
          type="time"
          value={dailyEndTime}
          onChange={(e) => setDailyEndTime(e.target.value)}
        />
      </div>
    </div>
    <div className="daily-helper-text">
      <span>Maximum: 15 Days</span>
    </div>
  </div>
)}

{/* Semester */}
{reservationType === "semester" && (
  <div className="reservation-datetime-bar vertical">
    <div className="reservation-datetime-row">
      <label className="reservation-datetime-label inline">Semester</label>
      <select
        className="reservation-datetime-input semester"
        value={semester}
        onChange={(e) => setSemester(e.target.value)}
      >
        <option value="spring">Spring (Jan 20 – May 15)</option>
        <option value="summer">Summer (May 20 – Aug 10)</option>
        <option value="fall">Fall (Aug 20 – Dec 20)</option>
      </select>
    </div>
  </div>
)}
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
                      <label htmlFor={cat}>{CATEGORY_LABELS[cat] || cat}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="filter-actions">
                <button
                  className="filter-clear-btn"
                  onClick={handleFilterClear}
                >
                  Clear All
                </button>
                <button
                  className="filter-apply-btn"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </button>
              </div>
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
                        const svgExists = details?.lot?.svgExists === true;

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
                                    if (svgExists === false) return;
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
                                  title={svgExists ? "Show Spot" : "No SVG yet"}
                                  disabled={!svgExists}
                                  style={{
                                    opacity: svgExists ? 1 : 0.5,
                                    pointerEvents: svgExists ? "auto" : "none",
                                    cursor: svgExists
                                      ? "pointer"
                                      : "not-allowed",
                                  }}
                                >
                                  <img
                                    src={require("../assets/focus.png")}
                                    alt="Show Spot"
                                    style={{
                                      filter: svgExists
                                        ? "none"
                                        : "grayscale(100%)",
                                    }}
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
                isValidDateTimeRange(appliedDateTimeRange) ? (
                  <LotMapView
                    lotId={selectedLotId}
                    onBack={handleBackFromLot}
                    highlightedSpot={highlightedSpot}
                    dateTimeRange={appliedDateTimeRange}
                  />
                ) : (
                  <div
                    className="error-message"
                    style={{ color: "red", margin: "1rem" }}
                  >
                    Please select a valid start and end time before viewing lot
                    details.
                  </div>
                )
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
              dateTimeRange={appliedDateTimeRange}
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