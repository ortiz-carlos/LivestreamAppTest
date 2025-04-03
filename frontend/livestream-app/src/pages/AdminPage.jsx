import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles.css';

// Backend API configuration
const API_BASE_URL = 'http://localhost:8000';
const WS_BASE_URL = 'ws://localhost:8000';

/**
 * AdminPage Component
 * Handles the broadcast management interface including:
 * - Creating new broadcasts
 * - Editing existing broadcasts
 * - Deleting broadcasts
 * - Managing current broadcast and scoreboard
 */
const AdminPage = () => {
  // State for managing broadcasts list and UI modes
  const [broadcasts, setBroadcasts] = useState([]); // List of all scheduled broadcasts
  const [isEditing, setIsEditing] = useState(false); // Controls edit/create form visibility
  const [editingBroadcast, setEditingBroadcast] = useState(null); // Currently edited broadcast
  const [showConfirmDelete, setShowConfirmDelete] = useState(false); // Controls delete confirmation modal

  // Form input states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState(''); // Error message state

  // Scoreboard state management
  const [home, setHome] = useState(0); // Home team score
  const [away, setAway] = useState(0); // Away team score
  const [homeTeam, setHomeTeam] = useState('Home'); // Home team name
  const [awayTeam, setAwayTeam] = useState('Away'); // Away team name
  const [currentBroadcastUrl, setCurrentBroadcastUrl] = useState(''); // Current live URL

  // WebSocket connection
  useEffect(() => {
    // Initialize WebSocket connection for real-time score updates
    const ws = new WebSocket(`${WS_BASE_URL}/ws/score`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setHome(data.home);
      setAway(data.away);
      setHomeTeam(data.home_name);
      setAwayTeam(data.away_name);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Fetch current live URL
    fetchLiveUrl();

    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, []);

  // Fetch broadcasts when component mounts
  useEffect(() => {
    fetchBroadcasts();
  }, []);

  /**
   * Fetches the current live broadcast URL
   */
  const fetchLiveUrl = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/live_url`);
      setCurrentBroadcastUrl(response.data);
    } catch (err) {
      console.error('Failed to fetch live URL:', err);
    }
  };

  /**
   * Fetches all scheduled broadcasts from the server
   */
  const fetchBroadcasts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/broadcasts`);
      setBroadcasts(response.data);
    } catch (err) {
      setError('Failed to fetch broadcasts');
    }
  };

  /**
   * Initializes the create broadcast form
   */
  const handleCreateNew = () => {
    setIsEditing(true);
    setEditingBroadcast(null);
    setTitle('');
    setDate('');
    setTime('');
  };

  /**
   * Initializes the edit broadcast form
   * @param {Object} broadcast - The broadcast to be edited
   */
  const handleEdit = (broadcast) => {
    setIsEditing(true);
    setEditingBroadcast(broadcast);
    setTitle(broadcast.title);
    
    // Parse date from broadcast
    const [year, month, day] = broadcast.date.split('-');
    setDate(`${year}-${month}-${day}`);
    setTime(broadcast.time);
  };

  /**
   * Handles form submission for both create and edit operations
   * @param {Event} e - Form submission event
   */
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const [year, month, day] = date.split('-');
      const broadcastData = {
        title,
        month: parseInt(month),
        day: parseInt(day),
        time
      };

      if (editingBroadcast) {
        await axios.put(`${API_BASE_URL}/broadcast/${editingBroadcast.id}`, broadcastData);
      } else {
        await axios.post(`${API_BASE_URL}/broadcast`, broadcastData);
      }
      setIsEditing(false);
      fetchBroadcasts();
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    }
  };

  /**
   * Handles broadcast deletion
   * @param {string} id - ID of the broadcast to delete
   */
  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/broadcast/${id}`);
      fetchBroadcasts();
      setShowConfirmDelete(false);
    } catch (err) {
      setError('Failed to delete broadcast');
    }
  };

  /**
   * Updates the score for a specified team
   * @param {string} team - 'home' or 'away'
   * @param {number} points - Points to add (positive) or subtract (negative)
   */
  const updateScore = async (team, points) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/score/update`, {
        team,
        points,
      });
      setHome(res.data.home);
      setAway(res.data.away);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Updates team names in the scoreboard
   */
  const updateTeamNames = async () => {
    try {
      await axios.post(`${API_BASE_URL}/score/team_names`, {
        home_name: homeTeam,
        away_name: awayTeam
      });
    } catch (err) {
      console.error('Failed to update team names', err);
    }
  };

  // Conditional Rendering: Edit/Create Form View
  if (isEditing) {
    return (
      <div className="admin-page">
        <div className="edit-broadcast">
          <div className="header">
            <button className="btn back-btn" onClick={() => setIsEditing(false)}>Back</button>
            <h2>{editingBroadcast ? 'Edit Broadcast' : 'Create Broadcast'}</h2>
          </div>
          <form onSubmit={handleSave}>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
            />
            <div className="button-group">
              <button type="submit" className="btn save-btn">Save</button>
              {editingBroadcast && (
                <button 
                  type="button" 
                  className="btn delete-btn"
                  onClick={() => setShowConfirmDelete(true)}
                >
                  Delete
                </button>
              )}
            </div>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  // Main Dashboard View
  return (
    <div className="admin-page">
      {/* Header Section */}
      <div className="welcome-section">
        <h1>Welcome</h1>
        <button className="btn create-btn" onClick={handleCreateNew}>
          Create Broadcast
        </button>
      </div>

      {/* Scheduled Broadcasts List */}
      <div className="scheduled-broadcasts">
        <h2>Scheduled Broadcasts:</h2>
        {broadcasts.map((broadcast) => (
          <div key={broadcast.id} className="broadcast-item">
            <div className="broadcast-info">
              <h3>{broadcast.title}</h3>
              <p>{new Date(broadcast.date + 'T' + broadcast.time).toLocaleString()}</p>
            </div>
            <button className="btn edit-btn" onClick={() => handleEdit(broadcast)}>
              Edit
            </button>
          </div>
        ))}
      </div>

      {/* Current Broadcast Preview */}
      <div className="current-broadcast">
        <h2>Current Broadcast</h2>
        <div className="broadcast-preview">
          <div className="embed-preview">
            {currentBroadcastUrl ? (
              <iframe
                title="Live Stream"
                width="100%"
                height="200"
                src={currentBroadcastUrl}
                frameBorder="0"
                allowFullScreen
              />
            ) : (
              <div className="placeholder">No active broadcast</div>
            )}
          </div>
        </div>
      </div>

      {/* Scoreboard Section */}
      <div className="score-controls">
        <h2>Scoreboard</h2>

        <div className="team-inputs">
          <input
            type="text"
            value={homeTeam}
            onChange={(e) => setHomeTeam(e.target.value)}
            onBlur={updateTeamNames}
            placeholder="Home Team Name"
          />
          <input
            type="text"
            value={awayTeam}
            onChange={(e) => setAwayTeam(e.target.value)}
            onBlur={updateTeamNames}
            placeholder="Away Team Name"
          />
        </div>

        <p style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
          {homeTeam}: {home} | {awayTeam}: {away}
        </p>

        <div className="score-buttons">
          <button onClick={() => updateScore('home', 1)}>+1 {homeTeam}</button>
          <button onClick={() => updateScore('away', 1)}>+1 {awayTeam}</button>
          <button onClick={() => updateScore('home', -1)}>-1 {homeTeam}</button>
          <button onClick={() => updateScore('away', -1)}>-1 {awayTeam}</button>
        </div>

        <button className="btn" onClick={() => {
          updateScore('home', -home);
          updateScore('away', -away);
        }}>
          Reset Scores
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="modal">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this broadcast?</p>
            <div className="button-group">
              <button 
                className="btn delete-btn" 
                onClick={() => handleDelete(editingBroadcast.id)}
              >
                Delete
              </button>
              <button 
                className="btn cancel-btn" 
                onClick={() => setShowConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;