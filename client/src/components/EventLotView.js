import React, { useState, useEffect, useRef } from "react";
import ParkingService from "../services/ParkingService";
import PanZoomControls from "./PanZoomControls";
import "./LotView.css";
import "./EventLotView.css";

const EventLotView = ({
  lotId,
  lotDetails,
  onBack,
  selectedSpots,
  onSpotSelection,
  isSelectingForEvent = false,
}) => {
  const [SvgComponent, setSvgComponent] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
  const [svgDimensions, setSvgDimensions] = useState(null);
  const [spotStatusMap, setSpotStatusMap] = useState({});
  const containerRef = useRef(null);

  // Fetch or use provided lotDetails to build spotStatusMap
  useEffect(() => {
    if (!lotDetails) {
      ParkingService.fetchParkingLotDetails(lotId)
        .then((data) => {
          const spotStatus = {};
          data.spots.forEach((spot) => {
            spotStatus[spot.spotId] = {
              status: spot.status,
              type: spot.type,
            };
          });
          setSpotStatusMap(spotStatus);
        })
        .catch((err) => console.error("Error fetching lot details", err));
    } else {
      const spotStatus = {};
      lotDetails.spots.forEach((spot) => {
        spotStatus[spot.spotId] = {
          status: spot.status,
          type: spot.type,
        };
      });
      setSpotStatusMap(spotStatus);
    }
  }, [lotId, lotDetails]);

  // Dynamically import the SVG component for this lot
  const [svgLoadError, setSvgLoadError] = useState(false);
  
    useEffect(() => {
      setSvgLoadError(false); // reset on lotId change
      import(`../assets/svgs/${lotId}.jsx`)
        .then((module) => setSvgComponent(() => module.default))
        .catch((err) => {
          console.error("Error loading SVG for lot", lotId, err);
          setSvgLoadError(true);
        });
    }, [lotId]);

  // Center and scale the SVG on mount and window resize
  useEffect(() => {
    const recalc = () => {
      if (!SvgComponent || !containerRef.current) return;
      const svgElement = document.getElementById("svg-content");
      if (!svgElement) return;
      const svgRect = svgElement.getBoundingClientRect();
      const iw = svgRect.width;
      const ih = svgRect.height;
      const cw = containerRef.current.clientWidth;
      const ch = containerRef.current.clientHeight;
      const newMinScale = Math.max(cw / iw, ch / ih);
      setScale(newMinScale);
      setOffset({
        x: (cw - iw * newMinScale) / 2,
        y: (ch - ih * newMinScale) / 2,
      });
      setSvgDimensions({ width: iw, height: ih });
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [SvgComponent]);

  // Clamp offset so the SVG cannot be panned out of view
  const clampOffset = (off, currentScale) => {
    if (!containerRef.current || !svgDimensions) return off;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const iw = svgDimensions.width;
    const ih = svgDimensions.height;
    const minX = cw - iw * currentScale;
    const minY = ch - ih * currentScale;
    return {
      x: Math.min(0, Math.max(off.x, minX)),
      y: Math.min(0, Math.max(off.y, minY)),
    };
  };

  // Mouse event handlers for panning
  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    setStartDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    const newOffset = {
      x: e.clientX - startDrag.x,
      y: e.clientY - startDrag.y,
    };
    setOffset(clampOffset(newOffset, scale));
  };
  const handleMouseUp = () => {
    setDragging(false);
  };

  // Wheel handler for zooming
  const handleWheel = (e) => {
    e.preventDefault();
    if (!containerRef.current || !svgDimensions) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const iw = svgDimensions.width;
    const ih = svgDimensions.height;
    const newMinScale = Math.max(cw / iw, ch / ih);

    let newScale = scale - e.deltaY * 0.001;
    newScale = Math.min(Math.max(newScale, newMinScale), 3);

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const newOffset = {
      x: offset.x + (1 - newScale / scale) * (mouseX - offset.x),
      y: offset.y + (1 - newScale / scale) * (mouseY - offset.y),
    };

    setScale(newScale);
    setOffset(clampOffset(newOffset, newScale));
  };

  // PanZoomControls handlers
  const zoomStepFactor = 1.1;
  const panStep = 20;
  const handleZoomIn = () => {
    if (!containerRef.current || !svgDimensions) return;
    let newScale = Math.min(scale * zoomStepFactor, 3);
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const centerX = cw / 2;
    const centerY = ch / 2;
    const newOffset = {
      x: offset.x + (1 - newScale / scale) * (centerX - offset.x),
      y: offset.y + (1 - newScale / scale) * (centerY - offset.y),
    };
    setScale(newScale);
    setOffset(clampOffset(newOffset, newScale));
  };
  const handleZoomOut = () => {
    if (!containerRef.current || !svgDimensions) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const newMinScale = Math.max(
      cw / svgDimensions.width,
      ch / svgDimensions.height
    );
    let newScale = Math.max(scale / zoomStepFactor, newMinScale);
    const centerX = cw / 2;
    const centerY = ch / 2;
    const newOffset = {
      x: offset.x + (1 - newScale / scale) * (centerX - offset.x),
      y: offset.y + (1 - newScale / scale) * (centerY - offset.y),
    };
    setScale(newScale);
    setOffset(clampOffset(newOffset, newScale));
  };
  const handlePan = (dx, dy) => {
    setOffset(clampOffset({ x: offset.x + dx, y: offset.y + dy }, scale));
  };
  const handlePanUp = () => handlePan(0, panStep);
  const handlePanDown = () => handlePan(0, -panStep);
  const handlePanLeft = () => handlePan(panStep, 0);
  const handlePanRight = () => handlePan(-panStep, 0);

  // Computed control enablement
  const containerWidth = containerRef.current
    ? containerRef.current.clientWidth
    : 0;
  const containerHeight = containerRef.current
    ? containerRef.current.clientHeight
    : 0;
  const minScale = svgDimensions
    ? Math.max(
        containerWidth / svgDimensions.width,
        containerHeight / svgDimensions.height
      )
    : 0;
  const canZoomIn = scale < 3;
  const canZoomOut = scale > minScale;
  const canPanRight = svgDimensions
    ? offset.x > containerWidth - svgDimensions.width * scale
    : false;
  const canPanLeft = offset.x < 0;
  const canPanDown = svgDimensions
    ? offset.y > containerHeight - svgDimensions.height * scale
    : false;
  const canPanUp = offset.y < 0;

  // Update spot styling and click handlers
  useEffect(() => {
    if (!SvgComponent) return;
    const svgElement = document.getElementById("svg-content");
    if (!svgElement) return;
    const spotElements = svgElement.querySelectorAll(
      '[data-vectornator-layer-name^="Spot"]'
    );

    spotElements.forEach((spot) => {
      const layerName = spot.getAttribute("data-vectornator-layer-name");
      const match = layerName.match(/Spot(\d+)/);
      if (!match) return;
      const num = parseInt(match[1], 10);
      const paddedNum = String(num).padStart(4, "0");
      const spotId = `${lotId}-${paddedNum}`;

      const spotInfo = lotDetails?.spots?.find((s) => s.spotId === spotId);
      const isAvailable = spotInfo?.isAvailableForTime;
      const isSelected = selectedSpots.includes(spotId);

      spot.style.cursor = isAvailable ? "pointer" : "not-allowed";

      if (!isAvailable) {
        // Unavailable spots (reserved for the selected time window)
        spot.style.fill = "#ffcccc";
        spot.onmouseover = null;
        spot.onmouseout = null;
        spot.onclick = null;
      } else if (isSelected) {
        // Selected spots
        spot.style.fill = "#4CAF50";
        spot.onmouseover = () => {
          spot.style.fill = "#388E3C";
        };
        spot.onmouseout = () => {
          spot.style.fill = "#4CAF50";
        };
        if (isSelectingForEvent) {
          spot.onclick = () => onSpotSelection(spotId, false);
        }
      } else {
        // Available spots
        spot.style.fill = "#c4ccd6";
        spot.onmouseover = () => {
          spot.style.fill = "#999999";
        };
        spot.onmouseout = () => {
          spot.style.fill = "#c4ccd6";
        };
        if (isSelectingForEvent) {
          spot.onclick = () => onSpotSelection(spotId, true);
        }
      }
    });
  }, [
    SvgComponent,
    spotStatusMap,
    selectedSpots,
    lotId,
    isSelectingForEvent,
    onSpotSelection,
  ]);

  if (svgLoadError) {
    return (
      <div className="lot-map-view">
        <button className="back-button" onClick={onBack}>
          Back
        </button>
        <div className="no-svg-message">
          <h3>No SVG yet</h3>
          <p>This lot does not have a map SVG uploaded yet.</p>
        </div>
      </div>
    );
  }

if (!SvgComponent) {
  return (
    <div className="lot-map-view">
      <div className="svg-loading">
        <p>Loading SVG...</p>
      </div>
    </div>
  );
}

  return (
    <div className="event-lot-view">
      <button className="back-button" onClick={onBack}>
        Back
      </button>

      <PanZoomControls
        canZoomIn={canZoomIn}
        canZoomOut={canZoomOut}
        canPanUp={canPanUp}
        canPanDown={canPanDown}
        canPanLeft={canPanLeft}
        canPanRight={canPanRight}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onPanUp={handlePanUp}
        onPanDown={handlePanDown}
        onPanLeft={handlePanLeft}
        onPanRight={handlePanRight}
      />

      <div
        className="svg-container"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
          }}
        >
          <SvgComponent id="svg-content" />
        </div>
      </div>
    </div>
  );
};

export default EventLotView;
