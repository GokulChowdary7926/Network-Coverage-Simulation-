import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Component to update map center when location changes
const MapUpdater = ({ center }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);
  
  return null;
};

const LocationMap = ({ latitude, longitude, address }) => {
  // Validate coordinates
  const isValidLat = latitude && !isNaN(latitude) && latitude >= -90 && latitude <= 90;
  const isValidLng = longitude && !isNaN(longitude) && longitude >= -180 && longitude <= 180;
  
  const position = (isValidLat && isValidLng) 
    ? [parseFloat(latitude), parseFloat(longitude)] 
    : [40.7128, -74.0060];
  
  return (
    <div className="location-map-container">
      <MapContainer
        center={position}
        zoom={isValidLat && isValidLng ? 15 : 11}
        style={{ height: '300px', width: '100%', borderRadius: '8px' }}
        key={`${latitude}-${longitude}`}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MapUpdater center={position} />
        {isValidLat && isValidLng && (
          <Marker position={position}>
            <Popup>
              <div>
                <strong>📍 Selected Location</strong>
                {address && <p style={{ margin: '0.5rem 0' }}>{address}</p>}
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>Lat:</strong> {parseFloat(latitude).toFixed(6)}
                </p>
                <p style={{ margin: '0.25rem 0', fontSize: '0.9rem' }}>
                  <strong>Lng:</strong> {parseFloat(longitude).toFixed(6)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LocationMap;

