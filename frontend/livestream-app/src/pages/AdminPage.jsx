import React, { useState } from 'react';
import axios from 'axios';
import '../styles.css';

const AdminPage = () => {
  const [title, setTitle] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [time, setTime] = useState('');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');

  const [home, setHome] = useState(0);
  const [away, setAway] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResponse(null);

    try {
      const res = await axios.post('http://localhost:8000/broadcast', {
        title,
        month: parseInt(month),
        day: parseInt(day),
        time
      });

      setResponse(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    }
  };

  const updateScore = async (team, points) => {
    try {
      const res = await axios.post('http://localhost:8000/score/update', {
        team,
        points
      });
      setHome(res.data.home);
      setAway(res.data.away);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="admin-container">
      <h1>Create New Broadcast</h1>
      <form onSubmit={handleSubmit} className="admin-form">
        <input type="text" placeholder="Broadcast Title" value={title} onChange={(e) => setTitle(e.target.value)} required />

        <input type="number" placeholder="Month (1–12)" value={month} onChange={(e) => setMonth(e.target.value)} required />

        <input type="number" placeholder="Day" value={day} onChange={(e) => setDay(e.target.value)} required />

        <input type="text" placeholder="Time (HH:MM 24-hour)" value={time} onChange={(e) => setTime(e.target.value)} required />

        <button type="submit" className="btn">Schedule Broadcast</button>
      </form>

      {response && (
        <div className="result">
          <p><strong>Broadcast created!</strong></p>
          <p>Watch live: <a href={response.url} target="_blank" rel="noreferrer">{response.url}</a></p>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {/* Scoreboard controls section */}
      <div className="score-controls">
        <h2>Scoreboard</h2>
        <p>Home: {home} | Away: {away}</p>
        <button onClick={() => updateScore("home", 1)}>+1 Home</button>
        <button onClick={() => updateScore("away", 1)}>+1 Away</button>
        <button onClick={() => updateScore("home", -1)}>-1 Home</button>
        <button onClick={() => updateScore("away", -1)}>-1 Away</button>
      </div>
    </div>
  );
};

export default AdminPage;
