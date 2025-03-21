import React from 'react';
import './PanZoomControls.css';

const PanZoomControls = ({
  canZoomIn,
  canZoomOut,
  canPanUp,
  canPanDown,
  canPanLeft,
  canPanRight,
  onZoomIn,
  onZoomOut,
  onPanUp,
  onPanDown,
  onPanLeft,
  onPanRight,
}) => {
  return (
    <>
      {/* Zoom buttons (left side, stacked under Back button) */}
      <div className="zoom-buttons">
        <button onClick={onZoomIn} disabled={!canZoomIn} className={!canZoomIn ? 'disabled' : ''}>
          +
        </button>
        <button onClick={onZoomOut} disabled={!canZoomOut} className={!canZoomOut ? 'disabled' : ''}>
          –
        </button>
      </div>
      {/* Pan arrows on each edge */}
      <button className={`pan-button pan-up ${!canPanUp ? 'disabled' : ''}`} onClick={onPanUp} disabled={!canPanUp}>
        &uarr;
      </button>
      <button className={`pan-button pan-left ${!canPanLeft ? 'disabled' : ''}`} onClick={onPanLeft} disabled={!canPanLeft}>
        &larr;
      </button>
      <button className={`pan-button pan-right ${!canPanRight ? 'disabled' : ''}`} onClick={onPanRight} disabled={!canPanRight}>
        &rarr;
      </button>
      <button className={`pan-button pan-down ${!canPanDown ? 'disabled' : ''}`} onClick={onPanDown} disabled={!canPanDown}>
        &darr;
      </button>
    </>
  );
};

export default PanZoomControls;
