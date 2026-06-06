import React, { useState, useEffect, useRef } from 'react';

export default function VRRCountdownMonitor() {
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStop, setSelectedStop] = useState(null);
  const [departures, setDepartures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(new Date());
  const searchTimeoutRef = useRef(null);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Search for stops
  const handleSearch = (value) => {
    setSearchInput(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        // VRR OpenService Location Search
        const params = new URLSearchParams({
          outputFormat: 'rapidJSON',
          version: '10.4.18.18',
          type_dm: 'stop',
          name_dm: value,
          mode: 'direct'
        });

        const response = await fetch(
          `https://openservice-test.vrr.de/openservice/XML_STOPFINDER?${params}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) throw new Error('API Error');
        const data = await response.json();
        
        const stops = data.stopFinder?.stops || [];
        setSuggestions(stops.slice(0, 10));
      } catch (err) {
        console.error('Search error:', err);
        setError('Haltestellen-Suche fehlgeschlagen');
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // Fetch departures
  const fetchDepartures = async (stopId, stopName) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        outputFormat: 'rapidJSON',
        version: '10.4.18.18',
        place_dm: stopName,
        type_dm: 'stop',
        name_dm: stopName,
        mode: 'direct'
      });

      const response = await fetch(
        `https://openservice-test.vrr.de/openservice/XML_DM_REQUEST?${params}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('API Error');
      const data = await response.json();

      const stops = data.departureBoard?.stops || [];
      if (stops.length > 0) {
        const departureBoardStops = stops[0]?.departures || [];
        setDepartures(departureBoardStops.slice(0, 2));
      } else {
        setError('Keine Abfahrten gefunden');
      }
    } catch (err) {
      console.error('Departure error:', err);
      setError('Fehler beim Abrufen der Abfahrten');
    } finally {
      setLoading(false);
    }
  };

  const selectStop = (stop) => {
    setSelectedStop(stop);
    setSuggestions([]);
    setSearchInput(stop.name || '');
    fetchDepartures(stop.id, stop.name);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '30px' }}>🚌 VRR Abfahrtsmonitor</h1>

      {/* Search Input */}
      <div style={{ marginBottom: '30px', position: 'relative' }}>
        <input
          type="text"
          placeholder="Haltestelle suchen..."
          value={searchInput}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '2px solid #ddd',
            borderRadius: '8px',
            boxSizing: 'border-box'
          }}
        />

        {/* Autocomplete Dropdown */}
        {suggestions.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              backgroundColor: '#fff',
              border: '2px solid #ddd',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              maxHeight: '300px',
              overflowY: 'auto',
              zIndex: 10
            }}
          >
            {suggestions.map((stop, idx) => (
              <div
                key={idx}
                onClick={() => selectStop(stop)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid #eee',
                  hover: { backgroundColor: '#f5f5f5' }
                }}
                onMouseEnter={(e) => (e.target.style.backgroundColor = '#f5f5f5')}
                onMouseLeave={(e) => (e.target.style.backgroundColor = 'transparent')}
              >
                {stop.name}
              </div>
            ))}
          </div>
        )}

        {loading && <p style={{ marginTop: '8px', color: '#666' }}>🔄 Wird geladen...</p>}
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#ffe0e0', color: '#c00', borderRadius: '6px', marginBottom: '20px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Departures */}
      {selectedStop && departures.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {departures.map((dep, idx) => (
            <CountdownRing key={idx} departure={dep} now={now} index={idx + 1} />
          ))}
        </div>
      )}

      {selectedStop && departures.length === 0 && !loading && (
        <p style={{ color: '#999', fontSize: '16px' }}>Keine Abfahrten verfügbar</p>
      )}
    </div>
  );
}

function CountdownRing({ departure, now, index }) {
  // Parse departure time
  const depTime = new Date(`${departure.dateTime?.date} ${departure.dateTime?.time}`);
  const secondsLeft = Math.max(0, Math.floor((depTime - now) / 1000));
  const minutesLeft = Math.floor(secondsLeft / 60);
  const secondsDisplay = secondsLeft % 60;

  // Progress: 0 = now, 1 = 30 minutes
  const maxSeconds = 30 * 60;
  const progress = Math.min(1, secondsLeft / maxSeconds);

  // Color based on time remaining
  let ringColor = '#10b981'; // Green: > 15 min
  if (minutesLeft <= 5) ringColor = '#ef4444'; // Red: <= 5 min
  else if (minutesLeft <= 10) ringColor = '#f59e0b'; // Yellow/Orange: <= 10 min

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div
      style={{
        backgroundColor: '#f9fafb',
        padding: '24px',
        borderRadius: '12px',
        border: '2px solid #e5e7eb',
        textAlign: 'center'
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
        Verbindung {index}
      </h3>

      {/* SVG Circle Progress */}
      <svg width="200" height="200" style={{ marginBottom: '20px' }}>
        {/* Background circle */}
        <circle cx="100" cy="100" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />

        {/* Progress circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.3s ease',
            transform: 'rotate(-90deg)',
            transformOrigin: '100px 100px'
          }}
        />

        {/* Time in center */}
        <text
          x="100"
          y="100"
          textAnchor="middle"
          dominantBaseline="middle"
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: ringColor,
            fill: ringColor
          }}
        >
          {minutesLeft}:{String(secondsDisplay).padStart(2, '0')}
        </text>
      </svg>

      {/* Departure Details */}
      <div style={{ marginTop: '20px', textAlign: 'left' }}>
        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>🚊 Linie</span>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#000', marginTop: '4px' }}>
            {departure.servingLine?.symbol || 'N/A'}
          </div>
        </div>

        <div style={{ marginBottom: '12px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>📍 Ziel</span>
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#000', marginTop: '4px' }}>
            {departure.servingLine?.direction || 'Unbekannt'}
          </div>
        </div>

        {departure.platform && (
          <div>
            <span style={{ fontSize: '14px', color: '#666' }}>🚪 Bahnsteig</span>
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: ringColor, marginTop: '4px' }}>
              {departure.platform}
            </div>
          </div>
        )}

        <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#fff', borderRadius: '6px', fontSize: '14px', color: '#666' }}>
          Abfahrt: <strong>{departure.dateTime?.time}</strong>
        </div>
      </div>
    </div>
  );
}
