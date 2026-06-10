import React, { useState } from 'react';
import { MapPin, Info, Crosshair } from 'lucide-react';

const InteractiveMap = ({ problems = [], isNearbyOnly, userLocation, onPinClick }) => {
  const [hoveredProblem, setHoveredProblem] = useState(null);

  // Fallback to Delhi if no user location detected yet
  const centerLat = userLocation?.lat || 28.6139;
  const centerLng = userLocation?.lng || 77.2090;

  const width = 600;
  const height = 260;
  const centerSvgX = width / 2;
  const centerSvgY = height / 2;

  // Projection logic
  const getCoordinates = (prob) => {
    const lat = prob.location?.lat;
    const lng = prob.location?.lng;

    if (lat === undefined || lng === undefined) return null;

    if (isNearbyOnly) {
      // Nearby local radar projection (Delhi-centric or user-centric)
      // Scale so that 0.05 degrees difference ~ 120 pixels
      const scale = 2400;
      const dx = (lng - centerLng) * scale;
      const dy = (centerLat - lat) * scale; // Inverted Y-axis in SVG

      const x = centerSvgX + dx;
      const y = centerSvgY + dy;

      // Filter out if outside visible map canvas
      if (x < 10 || x > width - 10 || y < 10 || y > height - 10) return null;
      return { x, y };
    } else {
      // Global projection
      // Map lng (-180 to 180) to x (20 to width-20)
      const x = ((lng + 180) / 360) * (width - 40) + 20;
      // Map lat (-90 to 90) to y (height-20 to 20)
      const y = (1 - (lat + 90) / 180) * (height - 40) + 20;
      return { x, y };
    }
  };

  const getPinColor = (category) => {
    switch (category) {
      case 'Emergency': return 'var(--accent-emergency)';
      case 'NGO Assistance': return 'var(--accent-success)';
      case 'Student Support': return 'var(--accent-student)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="card-glass map-widget-container">
      <div className="map-header">
        <h3 className="card-title">
          <MapPin size={18} style={{ color: 'var(--secondary)' }} />
          {isNearbyOnly ? 'Nearby Safety Radar' : 'Global Help Coordinates'}
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          <Crosshair size={12} />
          <span>{isNearbyOnly ? '15km Proximity Radius' : 'Global Coordinates'}</span>
        </div>
      </div>

      <div className="map-canvas-container">
        <svg className="svg-map-element">
          {/* Background grid lines for cyber-radar aesthetic */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" className="map-grid-lines" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {isNearbyOnly ? (
            // Proximity concentric radar circles
            <>
              <circle cx={centerSvgX} cy={centerSvgY} r="60" fill="none" stroke="var(--primary-glow)" strokeWidth="1" strokeDasharray="4,4" />
              <circle cx={centerSvgX} cy={centerSvgY} r="120" fill="none" stroke="var(--primary-glow)" strokeWidth="1" strokeDasharray="6,6" />
              
              {/* User Center Pulse */}
              <circle cx={centerSvgX} cy={centerSvgY} r="6" fill="var(--secondary)" />
              <circle cx={centerSvgX} cy={centerSvgY} r="14" fill="none" stroke="var(--secondary)" strokeWidth="2" className="map-pin-pulse" />
            </>
          ) : (
            // Stylized cyber-world dots representing grid countries in background
            <>
              {/* North America approximation */}
              <path d="M 60 60 Q 110 50 140 80 T 110 120 Z" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" />
              {/* Eurasia/Asia approximation */}
              <path d="M 320 40 Q 420 50 480 90 T 360 140 Z" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" />
              {/* Africa approximation */}
              <path d="M 280 130 Q 330 140 310 200 T 260 150 Z" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" />
            </>
          )}

          {/* Render Active Problem Pins */}
          {problems.map((prob) => {
            const coords = getCoordinates(prob);
            if (!coords) return null;

            const isHovered = hoveredProblem?._id === prob._id || hoveredProblem?.id === prob.id;
            const color = getPinColor(prob.category);

            return (
              <g 
                key={prob._id || prob.id}
                className="map-pin"
                transform={`translate(${coords.x}, ${coords.y})`}
                onMouseEnter={() => setHoveredProblem(prob)}
                onMouseLeave={() => setHoveredProblem(null)}
                onClick={() => onPinClick(prob._id || prob.id)}
              >
                {/* Ping shadow/glow circle */}
                <circle 
                  cx="0" 
                  cy="0" 
                  r={isHovered ? 12 : 6} 
                  fill={color} 
                  opacity={isHovered ? 0.35 : 0.15} 
                  className={prob.status === 'Active' ? 'map-pin-pulse' : ''}
                />
                {/* Core Pin Dot */}
                <circle 
                  cx="0" 
                  cy="0" 
                  r={isHovered ? 6 : 4} 
                  fill={color} 
                  stroke="#ffffff" 
                  strokeWidth="1"
                />
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredProblem && (
          <div className="map-tooltip">
            <div style={{ fontWeight: 700, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span 
                style={{ 
                  display: 'inline-block', 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: getPinColor(hoveredProblem.category) 
                }}
              />
              {hoveredProblem.category}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
              {hoveredProblem.title}
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              Status: <span style={{ color: hoveredProblem.status === 'Resolved' ? 'var(--accent-success)' : '#a78bfa' }}>{hoveredProblem.status}</span>
            </div>
          </div>
        )}

        {/* Locating feedback overlay */}
        {isNearbyOnly && !userLocation && (
          <div className="map-no-location">
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Awaiting Geolocation Access</p>
              <p style={{ fontSize: '0.75rem' }}>Allow browser location access to scan nearby community needs, or check the global map view.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteractiveMap;
