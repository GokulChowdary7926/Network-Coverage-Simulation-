import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Play, Navigation } from 'lucide-react';
import axios from 'axios';
import './Simulation.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    }
  });
  return null;
};

// Component to update map center when location changes
const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
};

const Simulation = ({ socket, simulationProgress }) => {
  const [towers, setTowers] = useState([]);
  const [selectedTowers, setSelectedTowers] = useState([]);
  const [parameters, setParameters] = useState({
    pathLossExponent: 3.0,
    referencePower: -30,
    receiverSensitivity: -100,
    environmentType: 'suburban'
  });
  const [simulationResults, setSimulationResults] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]);
  const [mapZoom, setMapZoom] = useState(11);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    fetchTowers();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        setMapCenter([latitude, longitude]);
        setMapZoom(15);
        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setLocationError('Unable to get your location. Please allow location access.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const fetchTowers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/towers`);
      setTowers(response.data.data);
    } catch (error) {
      console.error('Error fetching towers:', error);
    }
  };

  const runSimulation = async () => {
    setIsRunning(true);
    try {
      // Use user location if available, otherwise use default bounds
      let bounds;
      if (userLocation) {
        // Create bounds around user location (2km radius)
        const offset = 0.018; // ~2km in degrees
        bounds = {
          northEast: { 
            latitude: userLocation.latitude + offset, 
            longitude: userLocation.longitude + offset 
          },
          southWest: { 
            latitude: userLocation.latitude - offset, 
            longitude: userLocation.longitude - offset 
          }
        };
      } else {
        // Default bounds (New York area)
        bounds = {
          northEast: { latitude: 40.8, longitude: -73.9 },
          southWest: { latitude: 40.6, longitude: -74.2 }
        };
      }

      const response = await axios.post(`${API_BASE}/simulations`, {
        name: `Simulation ${new Date().toLocaleString()}`,
        description: `Coverage simulation for ${selectedTowers.length} towers`,
        area: bounds,
        parameters,
        towerIds: selectedTowers,
        gridResolution: 50
      });

      setSimulationResults(response.data.data);
    } catch (error) {
      console.error('Error running simulation:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleMapClick = (e) => {
    // Optional: Add new tower on map click
    console.log('Map clicked at:', e.latlng);
  };

  return (
    <div className="simulation">
      <div className="simulation-header">
        <h1>Network Coverage Simulation</h1>
        <p>Run simulations to analyze network coverage and performance</p>
      </div>

      <div className="simulation-content">
        <div className="simulation-controls">
          <div className="control-panel">
            <div className="simulation-header-controls">
              <h3>Simulation Parameters</h3>
              <button
                className="btn-location-simulation"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                title="Center map on your current location"
              >
                <Navigation size={16} />
                {gettingLocation ? 'Getting...' : '📍 Use My Location'}
              </button>
            </div>
            
            {locationError && (
              <div className="location-error-simulation">
                {locationError}
              </div>
            )}
            
            <div className="parameter-group">
              <label>Environment Type</label>
              <select 
                value={parameters.environmentType}
                onChange={(e) => setParameters(prev => ({
                  ...prev,
                  environmentType: e.target.value,
                  pathLossExponent: e.target.value === 'urban' ? 3.5 : 
                                  e.target.value === 'suburban' ? 3.0 : 2.5
                }))}
              >
                <option value="urban">Urban (n=3.5)</option>
                <option value="suburban">Suburban (n=3.0)</option>
                <option value="rural">Rural (n=2.5)</option>
              </select>
            </div>

            <div className="parameter-group">
              <label>Path Loss Exponent: {parameters.pathLossExponent}</label>
              <input 
                type="range" 
                min="2" 
                max="5" 
                step="0.1"
                value={parameters.pathLossExponent}
                onChange={(e) => setParameters(prev => ({
                  ...prev,
                  pathLossExponent: parseFloat(e.target.value)
                }))}
              />
            </div>

            <div className="parameter-group">
              <label>Reference Power: {parameters.referencePower} dBm</label>
              <input 
                type="range" 
                min="-50" 
                max="-10" 
                step="1"
                value={parameters.referencePower}
                onChange={(e) => setParameters(prev => ({
                  ...prev,
                  referencePower: parseInt(e.target.value)
                }))}
              />
            </div>

            <div className="parameter-group">
              <label>Receiver Sensitivity: {parameters.receiverSensitivity} dBm</label>
              <input 
                type="range" 
                min="-120" 
                max="-80" 
                step="1"
                value={parameters.receiverSensitivity}
                onChange={(e) => setParameters(prev => ({
                  ...prev,
                  receiverSensitivity: parseInt(e.target.value)
                }))}
              />
            </div>

            <div className="tower-selection">
              <h4>Select Towers</h4>
              <div className="tower-list">
                {towers.map(tower => (
                  <div key={tower._id} className="tower-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedTowers.includes(tower._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTowers(prev => [...prev, tower._id]);
                        } else {
                          setSelectedTowers(prev => prev.filter(id => id !== tower._id));
                        }
                      }}
                    />
                    <label>{tower.name} ({tower.network})</label>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="run-button btn-primary"
              onClick={runSimulation}
              disabled={isRunning || selectedTowers.length === 0}
            >
              <Play size={16} />
              {isRunning ? 'Running Simulation...' : 'Run Simulation'}
            </button>

            {simulationProgress && (
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${simulationProgress.progress}%` }}
                ></div>
                <span>{simulationProgress.message}</span>
              </div>
            )}
          </div>

          {simulationResults && (
            <div className="results-panel">
              <h3>Simulation Results</h3>
              <div className="results-grid">
                <div className="result-item">
                  <span>Overall Coverage</span>
                  <strong>{simulationResults.statistics.overallCoverage.toFixed(1)}%</strong>
                </div>
                <div className="result-item">
                  <span>Strong Signal</span>
                  <strong>{simulationResults.statistics.strongCoverage.toFixed(1)}%</strong>
                </div>
                <div className="result-item">
                  <span>Weak Signal</span>
                  <strong>{simulationResults.statistics.weakCoverage.toFixed(1)}%</strong>
                </div>
                <div className="result-item">
                  <span>No Coverage</span>
                  <strong>{simulationResults.statistics.noCoverage.toFixed(1)}%</strong>
                </div>
                <div className="result-item">
                  <span>Coverage Area</span>
                  <strong>{simulationResults.statistics.coverageArea.toFixed(1)} km²</strong>
                </div>
                <div className="result-item">
                  <span>Avg Signal</span>
                  <strong>{simulationResults.statistics.averageSignalStrength.toFixed(1)} dBm</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="simulation-map">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            key={`${mapCenter[0]}-${mapCenter[1]}`}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapUpdater center={mapCenter} zoom={mapZoom} />
            <MapClickHandler onMapClick={handleMapClick} />
            
            {/* User Location Marker */}
            {userLocation && (
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={L.divIcon({
                  className: 'user-location-marker',
                  html: '<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4); position: relative;"><div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 8px; height: 8px; background: white; border-radius: 50%;"></div></div>',
                  iconSize: [24, 24],
                  iconAnchor: [12, 12]
                })}
              >
                <Popup>
                  <div>
                    <h3>📍 Your Current Location</h3>
                    <p><strong>Latitude:</strong> {userLocation.latitude.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> {userLocation.longitude.toFixed(6)}</p>
                    <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                      Simulation will run around this area
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {towers.map(tower => (
              <Marker
                key={tower._id}
                position={[tower.location.latitude, tower.location.longitude]}
              >
                <Popup>
                  <div>
                    <h3>{tower.name}</h3>
                    <p><strong>Network:</strong> {tower.network}</p>
                    <p><strong>Technology:</strong> {tower.technology.join(', ')}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {simulationResults && simulationResults.coverageData && simulationResults.coverageData.slice(0, 1000).map((point, index) => (
              <Circle
                key={index}
                center={[point.latitude, point.longitude]}
                radius={10}
                pathOptions={{
                  color: point.signalBars === 5 ? '#2ecc71' :
                         point.signalBars === 4 ? '#3498db' :
                         point.signalBars === 3 ? '#f1c40f' :
                         point.signalBars === 2 ? '#e67e22' :
                         point.signalBars === 1 ? '#e74c3c' : '#95a5a6',
                  fillColor: point.signalBars === 5 ? '#2ecc71' :
                            point.signalBars === 4 ? '#3498db' :
                            point.signalBars === 3 ? '#f1c40f' :
                            point.signalBars === 2 ? '#e67e22' :
                            point.signalBars === 1 ? '#e74c3c' : '#95a5a6',
                  fillOpacity: 0.6
                }}
              />
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default Simulation;

