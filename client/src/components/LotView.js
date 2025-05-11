// client/src/components/LotView.js
import React, { useState, useEffect, useRef } from "react";
import ParkingService from "../services/ParkingService";
import PanZoomControls from "./PanZoomControls";
import "./LotView.css";

const LotMapView = ({ lotId, onBack, highlightedSpot, dateTimeRange }) => {
  const [lotDetails, setLotDetails] = useState(null);
  const [SvgComponent, setSvgComponent] = useState(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });
  const [svgDimensions, setSvgDimensions] = useState(null);
  const containerRef = useRef(null);
  const [lotAvailability, setLotAvailability] = useState(null);


  useEffect(() => {
    ParkingService.fetchParkingLotDetails(lotId)
      .then((data) => setLotDetails(data))
      .catch((err) => console.error("Error fetching lot details", err));
  }, [lotId]);
  useEffect(() => {
    // Fetch lot availability for the selected time window
    const fetchAvailability = async () => {
      const start = encodeURIComponent(dateTimeRange.start);
      const end = encodeURIComponent(dateTimeRange.end);
      const data = await ParkingService.fetchLotAvailability(lotId, dateTimeRange.start, dateTimeRange.end);
      setLotAvailability(data);
    };
    fetchAvailability();
  }, [lotId, dateTimeRange]);


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

  useEffect(() => {
    const recalc = () => {
      if (!SvgComponent || !containerRef.current) return;
      const svgElement = document.getElementById("svg-content");
      if (svgElement) {
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
      }
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [SvgComponent]);

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

  const handleWheel = (e) => {
    e.preventDefault();
    if (!containerRef.current || !svgDimensions) return;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const iw = svgDimensions.width;
    const ih = svgDimensions.height;
    const newMinScale = Math.max(cw / iw, ch / ih);

    let newScale = scale - e.deltaY * 0.001;
    if (newScale < newMinScale) newScale = newMinScale;
    if (newScale > 3) newScale = 3;

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

  const zoomStepFactor = 1.1;
  const panStep = 20;

  const handleZoomIn = () => {
    if (!containerRef.current || !svgDimensions) return;
    let newScale = scale * zoomStepFactor;
    if (newScale > 3) newScale = 3;
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
    let newScale = scale / zoomStepFactor;
    const cw = containerRef.current.clientWidth;
    const ch = containerRef.current.clientHeight;
    const newMinScale = Math.max(
      cw / svgDimensions.width,
      ch / svgDimensions.height
    );
    if (newScale < newMinScale) newScale = newMinScale;
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
    const newOffset = { x: offset.x + dx, y: offset.y + dy };
    setOffset(clampOffset(newOffset, scale));
  };

  const handlePanUp = () => handlePan(0, panStep);
  const handlePanDown = () => handlePan(0, -panStep);
  const handlePanLeft = () => handlePan(panStep, 0);
  const handlePanRight = () => handlePan(-panStep, 0);

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

  useEffect(() => {
    if (!SvgComponent || !lotDetails) return;
    const svgElement = document.getElementById("svg-content");
    if (svgElement) {
      const validLotIds = new Set();
      if (lotDetails.lots && Array.isArray(lotDetails.lots)) {
        lotDetails.lots.forEach((lot) => validLotIds.add(lot.lotId));
      } else if (lotDetails.lotId) {
        validLotIds.add(lotDetails.lotId);
      }
      console.log(validLotIds)

      const spotElements = svgElement.querySelectorAll(
        '[data-vectornator-layer-name^="Spot"]'
      );
      spotElements.forEach((spot) => {
        const layerName = spot.getAttribute("data-vectornator-layer-name"); // e.g., "Spot1"
        
        let currentLotId = lotId;
        const parentGroup = spot.closest("g[data-vectornator-layer-name]");
        if (parentGroup) {
          const groupName = parentGroup.getAttribute(
            "data-vectornator-layer-name"
          );
          // Only use groupName if it exists in our set of valid lot IDs.
          if (validLotIds.has(groupName)) {
            currentLotId = groupName;
          }
        }

        const match = layerName.match(/Spot(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          const paddedNum = String(num).padStart(4, "0");
          // Assuming lotId is available in the parent scope as a prop
          const spotId = `${currentLotId}-${paddedNum}`;
          const spotData =
            lotAvailability?.spots &&
            lotAvailability.spots.find((s) => s.spotId === spotId);

          if (spotData && !spotData.available) {
            spot.style.fill = "#ffcccc";
            spot.onmouseover = () => {
              spot.style.fill = "#cc6666";
            };
            spot.onmouseout = () => {
              spot.style.fill = "#ffcccc";
            };
          } else {
            spot.style.fill = "#c4ccd6";
            spot.onmouseover = () => {
              spot.style.fill = "#999999";
            };
            spot.onmouseout = () => {
              spot.style.fill = "#c4ccd6";
            };
          }
          // If this spot is the highlighted spot, add a glowing class.
          if (spotId === highlightedSpot) {
            spot.classList.add("highlighted-spot");
          } else {
            spot.classList.remove("highlighted-spot");
          }
          // Optional: on click, update highlighted spot.
          spot.onclick = () => {
            console.log("Clicked spot", spotId, spotData);
            // Update the highlighted spot so the glowing effect changes accordingly.
            // setHighlightedSpot(spotId); // if you want the SVG to respond to clicks.
          };
        }
      });
    }
  }, [SvgComponent, lotDetails, lotId, highlightedSpot, lotAvailability]);
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
    <div className="lot-map-view">
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

export default LotMapView;
