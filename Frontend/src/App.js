import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { io } from 'socket.io-client';
import Dashboard from './components/Dashboard';
import TowerManagement from './components/TowerManagement';
import Simulation from './components/Simulation';
import CoverageAnalysis from './components/CoverageAnalysis';
import Navigation from './components/Navigation';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [simulationProgress, setSimulationProgress] = useState(null);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5001');
    setSocket(newSocket);

    newSocket.on('simulation-progress', (data) => {
      setSimulationProgress(data);
    });

    return () => newSocket.close();
  }, []);

  return (
    <Router>
      <div className="App">
        <Navigation />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/towers" element={<TowerManagement />} />
            <Route 
              path="/simulation" 
              element={
                <Simulation 
                  socket={socket} 
                  simulationProgress={simulationProgress} 
                />
              } 
            />
            <Route path="/analysis" element={<CoverageAnalysis />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;

