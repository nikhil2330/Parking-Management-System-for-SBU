// client/src/components/LotMapView.js
import React, { useState, useEffect, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import './lotMapView.css';

const LotMapView = ({ lotId, onBack }) => {
  const [svgString, setSvgString] = useState('');
  const svgRef = useRef(null);

  // 1) Fetch the raw SVG from public/assets/svgs/{lotId}.svg
  useEffect(() => {
    fetch(`/assets/svgs/${lotId}.svg`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load SVG for lotId=${lotId}, status=${res.status}`);
        }
        return res.text();
      })
      .then((text) => setSvgString(text))
      .catch((err) => console.error('Error loading SVG:', err));
  }, [lotId]);

  // 2) Once the SVG is actually in the DOM, attach click handlers to Spot elements
  useEffect(() => {
    if (!svgString) return; // No SVG yet
    if (!svgRef.current) return; // The DOM ref might not exist yet

    // Query the final rendered <svg> in the DOM
    const spotElements = svgRef.current.querySelectorAll('[vectornator\\:layerName^="Spot"]');
    spotElements.forEach((el) => {
      el.style.fill = '#c4ccd6';
      el.style.cursor = 'pointer';

      // Define a handler
      const handleClick = (e) => {
        e.stopPropagation();
        const layerName = el.getAttribute('vectornator:layerName');
        console.log('Spot clicked:', layerName);
        // You can do something like open a modal or fetch spot details
      };

      // Attach event
      el.addEventListener('click', handleClick);

      // Cleanup on unmount
      return () => el.removeEventListener('click', handleClick);
    });
  }, [svgString]);

  // 3) If we haven’t loaded the SVG yet, show a placeholder
  if (!svgString) {
    return (
      <div className="zoomed-map-view">
        <button className="back-button" onClick={onBack}>← Back</button>
        <div>Loading parking lot details...</div>
      </div>
    );
  }

  // 4) Extract the viewBox from the raw SVG if it exists; fallback to "0 0 481 462"
  let viewBox = '0 0 481 462';
  {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.documentElement;
    const vb = svgEl.getAttribute('viewBox');
    if (vb) viewBox = vb;
  }

  return (
    <div className="zoomed-map-view">
      <button className="back-button" onClick={onBack}>← Back</button>

      <TransformWrapper
        // Try auto-centering the content at an appropriate scale
        centerContent={true}
        minScale={0.5}
        maxScale={5}
        initialScale={1}
        doubleClick={{ disabled: true }}
        // If you want to automatically fit the map, you can also do:
        // onInit={(transform) => transform.centerView()}
      >
        <TransformComponent>
          <svg
            ref={svgRef}
            // Fill the container
            style={{ width: '100%', height: '100%', display: 'block' }}
            preserveAspectRatio="xMidYMid meet"
            viewBox={viewBox}
            // Insert the entire <path>/<g> content
            dangerouslySetInnerHTML={{ __html: svgString }}
          />
        </TransformComponent>
      </TransformWrapper>
    </div>
  );
};

export default LotMapView;
