import React from 'react';
import './LoadingScreen.css';

function LoadingScreen() {
  return (
    <div className="premium-loader">
      <div className="loader-content">
        <div className="loader-title">P4SBU</div>
        <div className="loader-subtitle">Loading your parking experience</div>
        
        <div className="loader-scene">
          <div className="loader-road">
            <div className="loader-road-line"></div>
          </div>
          
          <div className="loader-car">
            <div className="loader-car-body">
              <div className="loader-car-roof"></div>
              <div className="loader-car-window"></div>
              <div className="loader-car-headlight"></div>
              <div className="loader-car-taillight"></div>
            </div>
            <div className="loader-car-wheel loader-car-wheel-front"></div>
            <div className="loader-car-wheel loader-car-wheel-back"></div>
            <div className="loader-car-shadow"></div>
          </div>
          
          <div className="loader-lights">
            <div className="loader-light light-1"></div>
            <div className="loader-light light-2"></div>
            <div className="loader-light light-3"></div>
          </div>
        </div>
        
        <div className="loader-progress">
          <div className="loader-progress-bar"></div>
        </div>
      </div>
    </div>
  );
}

export default LoadingScreen;