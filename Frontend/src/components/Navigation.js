import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, TowerControl, Play, BarChart3 } from 'lucide-react';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navigation">
      <div className="nav-content">
        <div className="nav-logo">
          <TowerControl size={24} />
          <span>Network Coverage</span>
        </div>
        <ul className="nav-links">
          <li>
            <Link to="/" className={isActive('/')}>
              <Home size={18} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link to="/towers" className={isActive('/towers')}>
              <TowerControl size={18} />
              Towers
            </Link>
          </li>
          <li>
            <Link to="/simulation" className={isActive('/simulation')}>
              <Play size={18} />
              Simulation
            </Link>
          </li>
          <li>
            <Link to="/analysis" className={isActive('/analysis')}>
              <BarChart3 size={18} />
              Analysis
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navigation;


