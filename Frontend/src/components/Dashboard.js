import React, { useState, useEffect, Fragment } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Signal, TowerControl, Map, BarChart3, MapPin, Navigation, Loader, X } from 'lucide-react';
import axios from 'axios';
import './Dashboard.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Component to update map center when location changes (only programmatically)
const MapUpdater = ({ center, zoom, skipUpdate = false }) => {
  const map = useMap();
  
  useEffect(() => {
    if (skipUpdate || !center || !center[0] || !center[1]) return;
    
    // Only update if center actually changed (not from user interaction)
    const currentCenter = map.getCenter();
    const centerChanged = Math.abs(currentCenter.lat - center[0]) > 0.0001 || 
                          Math.abs(currentCenter.lng - center[1]) > 0.0001;
    
    if (centerChanged) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map, skipUpdate]);
  
  return null;
};

// Component to handle map clicks for placing towers
const MapClickHandler = ({ onMapClick, enabled }) => {
  const map = useMap();
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleClick = (e) => {
      onMapClick(e.latlng);
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onMapClick, enabled]);
  
  return null;
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [towers, setTowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]);
  const [mapZoom, setMapZoom] = useState(11);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [seedingTowers, setSeedingTowers] = useState(false);
  const [seedMessage, setSeedMessage] = useState(null);
  const [placeTowerMode, setPlaceTowerMode] = useState(false);
  const [clickedLocation, setClickedLocation] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Get user location automatically when component loads
    getCurrentLocation();
  }, []);

  // Re-fetch location when user clicks the button
  const handleLocationClick = () => {
    getCurrentLocation();
  };

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
        setMapZoom(15); // Zoom in closer when showing user location
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

  const fetchDashboardData = async () => {
    try {
      const [statsRes, towersRes] = await Promise.all([
        axios.get(`${API_BASE}/coverage/statistics`),
        axios.get(`${API_BASE}/towers?limit=200`) // Fetch up to 200 towers to show all
      ]);

      setStats(statsRes.data.data);
      // Get all towers from response
      const allTowers = towersRes.data.data || [];
      setTowers(allTowers);
      
      // Log how many towers were fetched
      console.log(`✅ Dashboard: Fetched ${allTowers.length} towers (Total available: ${towersRes.data.total || allTowers.length})`);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClickForTower = (latlng) => {
    if (!placeTowerMode) return;
    
    // Set clicked location without moving the map
    const clickedLat = latlng.lat;
    const clickedLng = latlng.lng;
    
    setClickedLocation({
      latitude: clickedLat,
      longitude: clickedLng
    });
    
    // Navigate to Towers page with coordinates in URL
    const coords = `${clickedLat.toFixed(6)},${clickedLng.toFixed(6)}`;
    window.location.href = `/towers?place=${coords}`;
    
    setPlaceTowerMode(false);
  };

  const seedTowersAtLocation = async () => {
    if (!userLocation) {
      setLocationError('Please get your location first');
      return;
    }

    // Ask user if they want to clear existing towers
    const clearExisting = window.confirm(
      'Place 120 demo towers with signal visualization?\n\n' +
      'Click OK to clear all towers and add 120 new ones.\n' +
      'Click Cancel to keep existing towers and add 120 new ones.\n\n' +
      'Signal coverage circles will be shown on the map!'
    );

    setSeedingTowers(true);
    setSeedMessage(null);

    try {
      const response = await axios.post(`${API_BASE}/towers/seed-location`, {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        clearExisting: clearExisting
      });

      if (response.data.success) {
        const message = response.data.cleared
          ? `✅ ${response.data.count} demo towers placed (existing towers cleared). Refreshing map...`
          : `✅ ${response.data.count} demo towers added (existing towers kept). Refreshing map...`;
        setSeedMessage(message);
        // Refresh data after 1.5 seconds to show all towers
        setTimeout(() => {
          fetchDashboardData();
          setSeedMessage(`✅ ${response.data.count} towers now displayed on map with signal coverage!`);
        }, 1500);
      }
    } catch (error) {
      console.error('Error seeding towers:', error);
      setSeedMessage('Error placing towers. Please try again.');
    } finally {
      setSeedingTowers(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const networkData = stats ? [
    { name: 'Telco A', towers: stats.networks.telco1 },
    { name: 'Telco B', towers: stats.networks.telco2 },
    { name: 'Telco C', towers: stats.networks.telco3 },
    { name: 'Multi', towers: stats.networks.multi }
  ] : [];

  const techData = stats ? [
    { name: '2G', towers: stats.technologies['2G'] },
    { name: '3G', towers: stats.technologies['3G'] },
    { name: '4G', towers: stats.technologies['4G'] },
    { name: '5G', towers: stats.technologies['5G'] }
  ] : [];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Network Coverage Dashboard</h1>
        <p>Real-time monitoring and analysis of mobile network coverage</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <TowerControl size={24} />
          </div>
          <div className="stat-content">
            <h3>Total Towers</h3>
            <p className="stat-number">{stats?.totalTowers || 0}</p>
            <span className="stat-subtitle">Active: {stats?.activeTowers || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Signal size={24} />
          </div>
          <div className="stat-content">
            <h3>Network Coverage</h3>
            <p className="stat-number">{stats?.totalTowers ? '95%' : '0%'}</p>
            <span className="stat-subtitle">Overall coverage</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <h3>Technologies</h3>
            <p className="stat-number">4</p>
            <span className="stat-subtitle">2G to 5G</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Map size={24} />
          </div>
          <div className="stat-content">
            <h3>Coverage Area</h3>
            <p className="stat-number">~250 km²</p>
            <span className="stat-subtitle">Metro area</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="map-section">
          <div className="map-header">
            <h2>Network Coverage Map</h2>
            <div className="map-header-buttons">
              <button
                className="btn-location-dashboard"
                onClick={handleLocationClick}
                disabled={gettingLocation}
                title="Center map on your current location"
              >
                <Navigation size={16} />
                {gettingLocation ? 'Getting Location...' : '📍 Use My Location'}
              </button>
              <button
                className="btn-seed-towers"
                onClick={seedTowersAtLocation}
                disabled={seedingTowers || !userLocation}
                title="Place 120 demo towers with signal visualization around your current location"
              >
                {seedingTowers ? (
                  <>
                    <Loader size={16} className="spinning" />
                    Placing 120 Towers...
                  </>
                ) : (
                  <>
                    <MapPin size={16} />
                    Place 120 Towers
                  </>
                )}
              </button>
              <button
                className={`btn-place-tower ${placeTowerMode ? 'active' : ''}`}
                onClick={() => setPlaceTowerMode(!placeTowerMode)}
                title="Click on map to place a tower at exact location"
              >
                {placeTowerMode ? (
                  <>
                    <X size={16} />
                    Cancel
                  </>
                ) : (
                  <>
                    <MapPin size={16} />
                    Place Tower
                  </>
                )}
              </button>
            </div>
          </div>
          {locationError && (
            <div className="location-error">
              {locationError}
            </div>
          )}
          {seedMessage && (
            <div className={`seed-message ${seedMessage.includes('✅') ? 'success' : 'error'}`}>
              {seedMessage}
            </div>
          )}
          <div className="map-container" style={{ position: 'relative' }}>
            {placeTowerMode && (
              <div className="place-mode-indicator">
                🎯 Click on map to place tower at exact location
              </div>
            )}
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '400px', width: '100%' }}
              key={`${mapCenter[0]}-${mapCenter[1]}`}
              scrollWheelZoom={true}
              doubleClickZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <MapUpdater center={mapCenter} zoom={mapZoom} skipUpdate={placeTowerMode} />
              <MapClickHandler onMapClick={handleMapClickForTower} enabled={placeTowerMode} />
              
              {/* Clicked Location Marker (when in place mode) */}
              {clickedLocation && placeTowerMode && (
                <Marker
                  position={[clickedLocation.latitude, clickedLocation.longitude]}
                  icon={L.divIcon({
                    className: 'tower-place-marker',
                    html: '<div style="background-color: #3b82f6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>',
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                  })}
                >
                  <Popup>
                    <div>
                      <h3>📍 Tower Placement</h3>
                      <p><strong>Lat:</strong> {clickedLocation.latitude.toFixed(6)}</p>
                      <p><strong>Lng:</strong> {clickedLocation.longitude.toFixed(6)}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {/* User Location Marker - Red Circle */}
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
                        This is where you are right now
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}

              {/* Tower Markers with Signal Coverage Circles */}
              {towers.map(tower => {
                // Calculate coverage radius in meters
                const coverageRadiusMeters = tower.coverageRadius || 5000;
                
                // Determine signal strength color based on tower parameters
                const getSignalColor = (tower) => {
                  if (tower.technology.includes('5G')) return '#00ff00'; // Green for 5G
                  if (tower.technology.includes('4G')) return '#00bfff'; // Blue for 4G
                  if (tower.technology.includes('3G')) return '#ffa500'; // Orange for 3G
                  return '#ffff00'; // Yellow for 2G
                };
                
                const signalColor = getSignalColor(tower);
                
                return (
                  <Fragment key={tower._id}>
                    {/* Signal Coverage Circle - Outer (weak signal) */}
                    <Circle
                      center={[tower.location.latitude, tower.location.longitude]}
                      radius={coverageRadiusMeters}
                      pathOptions={{
                        color: signalColor,
                        fillColor: signalColor,
                        fillOpacity: 0.1,
                        weight: 2,
                        opacity: 0.3
                      }}
                    />
                    {/* Signal Coverage Circle - Middle (medium signal) */}
                    <Circle
                      center={[tower.location.latitude, tower.location.longitude]}
                      radius={coverageRadiusMeters * 0.7}
                      pathOptions={{
                        color: signalColor,
                        fillColor: signalColor,
                        fillOpacity: 0.2,
                        weight: 2,
                        opacity: 0.5
                      }}
                    />
                    {/* Signal Coverage Circle - Inner (strong signal) */}
                    <Circle
                      center={[tower.location.latitude, tower.location.longitude]}
                      radius={coverageRadiusMeters * 0.4}
                      pathOptions={{
                        color: signalColor,
                        fillColor: signalColor,
                        fillOpacity: 0.3,
                        weight: 2,
                        opacity: 0.7
                      }}
                    />
                    {/* Tower Marker */}
                    <Marker
                      position={[tower.location.latitude, tower.location.longitude]}
                    >
                      <Popup>
                        <div>
                          <h3>{tower.name}</h3>
                          <p><strong>Network:</strong> {tower.network}</p>
                          <p><strong>Technology:</strong> {tower.technology.join(', ')}</p>
                          <p><strong>Status:</strong> {tower.status}</p>
                          <p><strong>Coverage Radius:</strong> {(coverageRadiusMeters / 1000).toFixed(1)} km</p>
                          <p><strong>Signal Strength:</strong> {tower.parameters?.referencePower || -30} dBm</p>
                        </div>
                      </Popup>
                    </Marker>
                  </Fragment>
                );
              })}
            </MapContainer>
          </div>
        </div>

        <div className="charts-section">
          <div className="chart-container">
            <h3>Towers by Network</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={networkData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="towers" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-container">
            <h3>Towers by Technology</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={techData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="towers" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

