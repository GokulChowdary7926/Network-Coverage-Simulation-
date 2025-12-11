import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Signal, MapPin } from 'lucide-react';
import axios from 'axios';
import './CoverageAnalysis.css';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const CoverageAnalysis = () => {
  const [simulations, setSimulations] = useState([]);
  const [selectedSimulation, setSelectedSimulation] = useState(null);
  const [towers, setTowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [simsRes, towersRes] = await Promise.all([
        axios.get(`${API_BASE}/simulations`),
        axios.get(`${API_BASE}/towers`)
      ]);

      setSimulations(simsRes.data.data);
      setTowers(towersRes.data.data);
      
      if (simsRes.data.data.length > 0) {
        setSelectedSimulation(simsRes.data.data[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analysis...</div>;
  }

  const signalDistribution = selectedSimulation ? [
    { name: 'No Signal', value: selectedSimulation.statistics.noCoverage },
    { name: 'Weak Signal', value: selectedSimulation.statistics.weakCoverage },
    { name: 'Moderate Signal', value: 100 - selectedSimulation.statistics.noCoverage - selectedSimulation.statistics.weakCoverage - selectedSimulation.statistics.strongCoverage },
    { name: 'Strong Signal', value: selectedSimulation.statistics.strongCoverage }
  ] : [];

  const networkComparison = selectedSimulation && selectedSimulation.coverageData ? 
    Object.entries(
      selectedSimulation.coverageData.reduce((acc, point) => {
        acc[point.network] = (acc[point.network] || 0) + 1;
        return acc;
      }, {})
    ).map(([network, count]) => ({ name: network, value: count }))
    : [];

  return (
    <div className="coverage-analysis">
      <div className="analysis-header">
        <h1>Coverage Analysis</h1>
        <p>Detailed analytics and reporting for network coverage simulations</p>
      </div>

      <div className="simulation-selector">
        <label>Select Simulation:</label>
        <select 
          value={selectedSimulation?._id || ''} 
          onChange={(e) => {
            const sim = simulations.find(s => s._id === e.target.value);
            setSelectedSimulation(sim);
          }}
        >
          {simulations.map(sim => (
            <option key={sim._id} value={sim._id}>
              {sim.name} - {new Date(sim.createdAt).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {selectedSimulation && (
        <>
          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">
                <Signal size={24} />
              </div>
              <div className="stat-content">
                <h3>Overall Coverage</h3>
                <p className="stat-number">{selectedSimulation.statistics.overallCoverage.toFixed(1)}%</p>
                <span className="stat-subtitle">Total area covered</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <TrendingUp size={24} />
              </div>
              <div className="stat-content">
                <h3>Strong Signal</h3>
                <p className="stat-number">{selectedSimulation.statistics.strongCoverage.toFixed(1)}%</p>
                <span className="stat-subtitle">4-5 bars coverage</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <MapPin size={24} />
              </div>
              <div className="stat-content">
                <h3>Coverage Area</h3>
                <p className="stat-number">{selectedSimulation.statistics.coverageArea.toFixed(1)} km²</p>
                <span className="stat-subtitle">Total coverage area</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Signal size={24} />
              </div>
              <div className="stat-content">
                <h3>Avg Signal</h3>
                <p className="stat-number">{selectedSimulation.statistics.averageSignalStrength.toFixed(1)} dBm</p>
                <span className="stat-subtitle">Average signal strength</span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Signal Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={signalDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {signalDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>Network Coverage Comparison</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={networkComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Coverage Map */}
          <div className="map-section">
            <h2>Coverage Visualization</h2>
            <div className="map-container">
              <MapContainer
                center={[
                  (selectedSimulation.area.northEast.latitude + selectedSimulation.area.southWest.latitude) / 2,
                  (selectedSimulation.area.northEast.longitude + selectedSimulation.area.southWest.longitude) / 2
                ]}
                zoom={11}
                style={{ height: '500px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {selectedSimulation.towers && selectedSimulation.towers.map(tower => (
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
              </MapContainer>
            </div>
          </div>

          {/* Simulation Details */}
          <div className="details-section">
            <h2>Simulation Details</h2>
            <div className="details-grid">
              <div className="detail-item">
                <strong>Name:</strong> {selectedSimulation.name}
              </div>
              <div className="detail-item">
                <strong>Description:</strong> {selectedSimulation.description || 'N/A'}
              </div>
              <div className="detail-item">
                <strong>Environment:</strong> {selectedSimulation.parameters.environmentType}
              </div>
              <div className="detail-item">
                <strong>Path Loss Exponent:</strong> {selectedSimulation.parameters.pathLossExponent}
              </div>
              <div className="detail-item">
                <strong>Grid Resolution:</strong> {selectedSimulation.gridResolution}
              </div>
              <div className="detail-item">
                <strong>Created:</strong> {new Date(selectedSimulation.createdAt).toLocaleString()}
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedSimulation && simulations.length === 0 && (
        <div className="no-data">
          <p>No simulations available. Please run a simulation first.</p>
        </div>
      )}
    </div>
  );
};

export default CoverageAnalysis;

