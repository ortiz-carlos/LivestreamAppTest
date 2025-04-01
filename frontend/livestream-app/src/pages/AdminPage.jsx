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
  const [homeTeam, setHomeTeam] = useState('Home');
  const [awayTeam, setAwayTeam] = useState('Away');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResponse(null);

    try {
      const res = await axios.post('http://localhost:8000/broadcast', {
        title,
        month: parseInt(month),
        day: parseInt(day),
        time,
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
        points,
      });
      setHome(res.data.home);
      setAway(res.data.away);
    } catch (err) {
      console.error(err);
    }
  };

  const resetScores = async () => {
    await updateScore('home', -home);
    await updateScore('away', -away);
    setHome(0);
    setAway(0);
  };

  const updateTeamNames = async () => {
    try {
      await axios.post('http://localhost:8000/score/team_names', {
        home_name: homeTeam,
        away_name: awayTeam
      });
    } catch (err) {
      console.error('Failed to update team names', err);
    }
  };

  return (
    <div className="admin-container">
      <h1>Create New Broadcast</h1>
      <form onSubmit={handleSubmit} className="admin-form">
        <input
          type="text"
          placeholder="Broadcast Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Month (1–12)"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Day"
          value={day}
          onChange={(e) => setDay(e.target.value)}
          required
        />

        <input
          type="text"
          placeholder="Time (HH:MM 24-hour)"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />

        <button type="submit" className="btn">
          Schedule Broadcast
        </button>
      </form>

      {response && (
        <div className="result">
          <p>
            <strong>Broadcast created!</strong>
          </p>
          <p>
            Watch live:{' '}
            <a href={response.url} target="_blank" rel="noreferrer">
              {response.url}
            </a>
          </p>
        </div>
      )}

      {error && <p className="error">{error}</p>}

      {/* Scoreboard controls section */}
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

        <button className="btn" onClick={resetScores}>
          Reset Scores
        </button>
      </div>
    </div>
  );
};

export default AdminPage;
