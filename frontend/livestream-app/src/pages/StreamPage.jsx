import React, { useEffect, useState } from 'react';
import '../styles.css';

const StreamPage = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [score, setScore] = useState({
    home: 0,
    away: 0,
    home_name: 'Home',
    away_name: 'Away'
  });
  const [status, setStatus] = useState("Connecting...");

  // Fetch the livestream URL
  useEffect(() => {
    fetch('http://localhost:8000/live_url')
      .then((res) => res.text())
      .then((text) => {
        if (text.includes('youtube.com')) {
          setUrl(text);
        } else {
          setError(text);
        }
      })
      .catch((err) => {
        setError('Failed to load livestream.');
        console.error(err);
      });
  }, []);

  // Connect to WebSocket
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8000/ws/score");

    socket.onopen = () => setStatus("Connected to live scoreboard");
    socket.onerror = () => setStatus("WebSocket error");
    socket.onclose = () => setStatus("Disconnected");

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setScore(data);
    };

    return () => socket.close();
  }, []);

  return (
    <div className="stream-container">
      {/* TV-style Score Bug Overlay */}
      <div className="score-bug">
        <div className="team">
          <span className="team-name">{score.home_name}</span>
          <span className="score">{score.home}</span>
        </div>
        <div className="team">
          <span className="team-name">{score.away_name}</span>
          <span className="score">{score.away}</span>
        </div>
      </div>

      <h1>Live Broadcast</h1>
      <p>{status}</p>

      {url ? (
        <iframe
          width="100%"
          height="500"
          src={url}
          title="YouTube Livestream"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      ) : (
        <p>{error || 'Loading stream...'}</p>
      )}
    </div>
  );
};

export default StreamPage;
