import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, MapPin, Search, RotateCcw } from 'lucide-react';
import axios from 'axios';
import LocationMap from './LocationMap';
import './TowerManagement.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const TowerManagement = () => {
  const [towers, setTowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTower, setEditingTower] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filters, setFilters] = useState({
    network: '',
    status: '',
    technology: ''
  });

  const [newTower, setNewTower] = useState({
    towerId: '',
    name: '',
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: ''
    },
    network: 'telco1',
    technology: ['4G'],
    parameters: {
      referencePower: -30,
      pathLossExponent: 3.0,
      frequency: 2100,
      antennaHeight: 30,
      transmitterPower: 20,
      antennaGain: 10
    },
    capacity: 1000,
    coverageRadius: 5000,
    status: 'active'
  });

  useEffect(() => {
    fetchTowers();
    
    // Check if coordinates are in URL (from Dashboard place tower feature)
    const urlParams = new URLSearchParams(window.location.search);
    const placeCoords = urlParams.get('place');
    
    if (placeCoords) {
      const [lat, lng] = placeCoords.split(',').map(parseFloat);
      if (!isNaN(lat) && !isNaN(lng)) {
        // Set coordinates and open form
        setNewTower(prev => ({
          ...prev,
          location: {
            latitude: lat,
            longitude: lng,
            address: ''
          }
        }));
        setLocationSearch(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        setShowForm(true);
        
        // Get address for the location
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
          .then(res => res.json())
          .then(data => {
            if (data && data.display_name) {
              setNewTower(prev => ({
                ...prev,
                location: {
                  ...prev.location,
                  address: data.display_name
                }
              }));
              setLocationSearch(data.display_name);
            }
          })
          .catch(err => console.error('Error getting address:', err));
        
        // Clean URL
        window.history.replaceState({}, '', '/towers');
      }
    }
  }, [filters]);

  const fetchTowers = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.network) params.append('network', filters.network);
      if (filters.status) params.append('status', filters.status);
      if (filters.technology) params.append('technology', filters.technology);

      const response = await axios.get(`${API_BASE}/towers?${params}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      setTowers(response.data.data);
    } catch (error) {
      console.error('Error fetching towers:', error);
      if (error.message === 'Network Error' || error.code === 'ECONNREFUSED') {
        console.error('Backend server is not running. Please start it with: cd Backend && npm run dev');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!newTower.towerId || !newTower.name) {
      alert('Please fill in Tower ID and Name');
      return;
    }

    if (!newTower.location.latitude || !newTower.location.longitude) {
      alert('Please provide valid latitude and longitude');
      return;
    }

    try {
      if (editingTower) {
        const response = await axios.put(`${API_BASE}/towers/${editingTower._id}`, newTower, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.data.success) {
          alert('Tower updated successfully!');
        }
      } else {
        const response = await axios.post(`${API_BASE}/towers`, newTower, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.data.success) {
          alert('Tower created successfully!');
        }
      }
      setShowForm(false);
      resetForm();
      fetchTowers();
    } catch (error) {
      console.error('Error saving tower:', error);
      
      let errorMessage = 'Network Error';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.error || error.response.data?.message || `Server Error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please make sure the backend is running on http://localhost:5001';
      } else {
        // Something else happened
        errorMessage = error.message || 'An unexpected error occurred';
      }
      
      alert(`Error: ${errorMessage}`);
    }
  };


  const handleDelete = async (towerId) => {
    if (window.confirm('Are you sure you want to delete this tower?')) {
      try {
        await axios.delete(`${API_BASE}/towers/${towerId}`);
        fetchTowers();
      } catch (error) {
        console.error('Error deleting tower:', error);
        alert('Error deleting tower. Please check the console for details.');
      }
    }
  };

  const handleEdit = (tower) => {
    setEditingTower(tower);
    setNewTower(tower);
    setLocationSearch(tower.location.address || '');
    setSearchResults([]);
    setShowForm(true);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Update tower location
        setNewTower(prev => ({
          ...prev,
          location: {
            ...prev.location,
            latitude: latitude,
            longitude: longitude
          }
        }));

        // Try to get address using reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data && data.display_name) {
            setNewTower(prev => ({
              ...prev,
              location: {
                ...prev.location,
                address: data.display_name
              }
            }));
            setLocationSearch(data.display_name);
          }
        } catch (error) {
          console.log('Could not fetch address:', error);
          // Address fetch failed, but location is still set
        }

        setGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Unable to get your location. ';
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out.';
            break;
          default:
            errorMessage += 'An unknown error occurred.';
            break;
        }
        
        alert(errorMessage);
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const searchLocation = async (query = null) => {
    const searchQuery = query || locationSearch;
    
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    setSearchingLocation(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setSearchResults(data);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching location:', error);
      setSearchResults([]);
    } finally {
      setSearchingLocation(false);
    }
  };

  const selectLocation = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const address = result.display_name;

    setNewTower(prev => ({
      ...prev,
      location: {
        latitude: lat,
        longitude: lng,
        address: address
      }
    }));

    setLocationSearch(address);
    setSearchResults([]);
  };

  useEffect(() => {
    let timeoutId;
    if (locationSearch.length >= 3) {
      timeoutId = setTimeout(() => {
        const query = locationSearch;
        if (query.trim() && query.length >= 3) {
          setSearchingLocation(true);
          fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
          )
            .then(response => response.json())
            .then(data => {
              if (data && data.length > 0) {
                setSearchResults(data);
              } else {
                setSearchResults([]);
              }
            })
            .catch(error => {
              console.error('Error searching location:', error);
              setSearchResults([]);
            })
            .finally(() => {
              setSearchingLocation(false);
            });
        }
      }, 500);
    } else {
      setSearchResults([]);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [locationSearch]);

  const handleLocationSearch = (e) => {
    setLocationSearch(e.target.value);
  };

  const handleLocationSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchLocation();
    }
  };

  const resetForm = () => {
    setNewTower({
      towerId: '',
      name: '',
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: ''
      },
      network: 'telco1',
      technology: ['4G'],
      parameters: {
        referencePower: -30,
        pathLossExponent: 3.0,
        frequency: 2100,
        antennaHeight: 30,
        transmitterPower: 20,
        antennaGain: 10
      },
      capacity: 1000,
      coverageRadius: 5000,
      status: 'active'
    });
    setLocationSearch('');
    setSearchResults([]);
    setEditingTower(null);
  };

  if (loading) {
    return <div className="loading">Loading towers...</div>;
  }

  return (
    <div className="tower-management">
      <div className="tower-header">
        <div>
          <h1>Tower Management</h1>
          <p>Manage and monitor all cell towers in the network</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          <Plus size={16} />
          Add New Tower
        </button>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Network</label>
          <select 
            value={filters.network}
            onChange={(e) => setFilters(prev => ({ ...prev, network: e.target.value }))}
          >
            <option value="">All Networks</option>
            <option value="telco1">Telco A</option>
            <option value="telco2">Telco B</option>
            <option value="telco3">Telco C</option>
            <option value="multi">Multi</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Status</label>
          <select 
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Technology</label>
          <select 
            value={filters.technology}
            onChange={(e) => setFilters(prev => ({ ...prev, technology: e.target.value }))}
          >
            <option value="">All Technologies</option>
            <option value="2G">2G</option>
            <option value="3G">3G</option>
            <option value="4G">4G</option>
            <option value="5G">5G</option>
          </select>
        </div>
      </div>

      {/* Towers Grid */}
      <div className="towers-grid">
        {towers.map(tower => (
          <div key={tower._id} className="tower-card">
            <div className="tower-card-header">
              <h3>{tower.name}</h3>
              <span className={`status ${tower.status}`}>{tower.status}</span>
            </div>
            
            <div className="tower-details">
              <p><strong>ID:</strong> {tower.towerId}</p>
              <p><strong>Network:</strong> {tower.network}</p>
              <p><strong>Technology:</strong> {tower.technology.join(', ')}</p>
              <p><strong>Location:</strong> {tower.location.latitude.toFixed(4)}, {tower.location.longitude.toFixed(4)}</p>
              <p><strong>Capacity:</strong> {tower.capacity} users</p>
              <p><strong>Coverage Radius:</strong> {tower.coverageRadius} m</p>
            </div>

            <div className="tower-parameters">
              <h4>Parameters</h4>
              <p>P₀: {tower.parameters.referencePower} dBm</p>
              <p>Path Loss: {tower.parameters.pathLossExponent}</p>
              <p>Frequency: {tower.parameters.frequency} MHz</p>
            </div>

            <div className="tower-actions">
              <button 
                className="btn-edit"
                onClick={() => handleEdit(tower)}
              >
                <Edit size={14} />
                Edit
              </button>
              <button 
                className="btn-delete"
                onClick={() => handleDelete(tower._id)}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingTower(null); resetForm(); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTower ? 'Edit Tower' : 'Add New Tower'}</h2>
              <button
                type="button"
                className="btn-reset btn-reset-header"
                onClick={resetForm}
                title="Reset Form"
              >
                <RotateCcw size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Tower ID</label>
                  <input
                    type="text"
                    value={newTower.towerId}
                    onChange={(e) => setNewTower(prev => ({ ...prev, towerId: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={newTower.name}
                    onChange={(e) => setNewTower(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Network</label>
                  <select
                    value={newTower.network}
                    onChange={(e) => setNewTower(prev => ({ ...prev, network: e.target.value }))}
                  >
                    <option value="telco1">Telco A</option>
                    <option value="telco2">Telco B</option>
                    <option value="telco3">Telco C</option>
                    <option value="multi">Multi</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={newTower.status}
                    onChange={(e) => setNewTower(prev => ({ ...prev, status: e.target.value }))}
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="form-group location-group">
                  <div className="location-header">
                    <label>Location</label>
                    <div className="location-buttons">
                      <button
                        type="button"
                        className="btn-location"
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                      >
                        <MapPin size={16} />
                        {gettingLocation ? 'Getting...' : 'Use My Location'}
                      </button>
                      <button
                        type="button"
                        className="btn-reset"
                        onClick={resetForm}
                        title="Reset Form"
                      >
                        <RotateCcw size={16} />
                        Reset
                      </button>
                    </div>
                  </div>
                  
                  <div className="location-search-container">
                    <div className="search-input-wrapper">
                      <Search size={18} className="search-icon" />
                      <input
                        type="text"
                        className="location-search-input"
                        placeholder="Search location (e.g., New York, Times Square, 10001)"
                        value={locationSearch}
                        onChange={handleLocationSearch}
                        onKeyPress={handleLocationSearchKeyPress}
                      />
                      {searchingLocation && (
                        <span className="search-loading">Searching...</span>
                      )}
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="search-results">
                        {searchResults.map((result, index) => (
                          <div
                            key={index}
                            className="search-result-item"
                            onClick={() => selectLocation(result)}
                          >
                            <MapPin size={14} />
                            <div className="result-details">
                              <div className="result-name">{result.display_name}</div>
                              <div className="result-coords">
                                {parseFloat(result.lat).toFixed(4)}, {parseFloat(result.lon).toFixed(4)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newTower.location.latitude}
                    onChange={(e) => {
                      const lat = parseFloat(e.target.value);
                      setNewTower(prev => ({
                        ...prev,
                        location: { ...prev.location, latitude: lat }
                      }));
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={newTower.location.longitude}
                    onChange={(e) => {
                      const lng = parseFloat(e.target.value);
                      setNewTower(prev => ({
                        ...prev,
                        location: { ...prev.location, longitude: lng }
                      }));
                    }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    value={newTower.location.address}
                    onChange={(e) => setNewTower(prev => ({
                      ...prev,
                      location: { ...prev.location, address: e.target.value }
                    }))}
                  />
                </div>

                <div className="form-group location-map-group">
                  <label>Location Preview</label>
                  <LocationMap
                    latitude={newTower.location.latitude}
                    longitude={newTower.location.longitude}
                    address={newTower.location.address}
                  />
                  <p className="map-help-text">
                    Map shows your selected location. Use "Use My Location" or search to update.
                  </p>
                </div>

                <div className="form-group">
                  <label>Technologies</label>
                  <div className="checkbox-group">
                    {['2G', '3G', '4G', '5G'].map(tech => (
                      <label key={tech}>
                        <input
                          type="checkbox"
                          checked={newTower.technology.includes(tech)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTower(prev => ({
                                ...prev,
                                technology: [...prev.technology, tech]
                              }));
                            } else {
                              setNewTower(prev => ({
                                ...prev,
                                technology: prev.technology.filter(t => t !== tech)
                              }));
                            }
                          }}
                        />
                        {tech}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-reset"
                  onClick={resetForm}
                  title="Reset all fields"
                >
                  <RotateCcw size={16} />
                  Reset
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowForm(false); setEditingTower(null); resetForm(); }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingTower ? 'Update Tower' : 'Add Tower'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TowerManagement;

