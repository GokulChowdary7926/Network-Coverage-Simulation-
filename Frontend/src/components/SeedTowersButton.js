import React, { useState } from 'react';
import { MapPin, Loader } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const SeedTowersButton = ({ onTowersSeeded }) => {
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState(null);

  const seedTowersAtLocation = async () => {
    if (!navigator.geolocation) {
      setMessage('Geolocation is not supported by your browser');
      return;
    }

    setSeeding(true);
    setMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          // Call backend API to seed towers
          const response = await axios.post(`${API_BASE}/towers/seed-location`, {
            latitude,
            longitude
          });

          if (response.data.success) {
            setMessage(`✅ ${response.data.count} demo towers placed around your location!`);
            if (onTowersSeeded) {
              onTowersSeeded();
            }
            // Refresh page after 2 seconds to show new towers
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          }
        } catch (error) {
          console.error('Error seeding towers:', error);
          setMessage('Error placing towers. Please try again.');
        } finally {
          setSeeding(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        setMessage('Unable to get your location. Please allow location access.');
        setSeeding(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <button
        className="btn-seed-towers"
        onClick={seedTowersAtLocation}
        disabled={seeding}
        title="Place demo towers around your current location"
      >
        {seeding ? (
          <>
            <Loader size={16} className="spinning" />
            Placing Towers...
          </>
        ) : (
          <>
            <MapPin size={16} />
            Place Demo Towers at My Location
          </>
        )}
      </button>
      {message && (
        <div className={`seed-message ${message.includes('✅') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default SeedTowersButton;


