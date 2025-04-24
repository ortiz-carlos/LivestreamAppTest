import React, { useEffect, useState, useRef, useContext } from 'react';
import '../styles.css';
import { AuthContext } from '../AuthContext';

const StreamPage = () => {
  const { user } = useContext(AuthContext);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [score, setScore] = useState({
    home: 0,
    away: 0,
    home_name: 'Home',
    away_name: 'Away',
  });
  const [status, setStatus] = useState('Connecting...');

  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatSocketRef = useRef(null);

  const API_URL = process.env.REACT_APP_BACKEND_URL;
  const WS_URL = process.env.REACT_APP_WS_URL;

  // Fetch livestream URL
  useEffect(() => {
    fetch(`${API_URL}/live_url`)
      .then((res) => res.text())
      .then((text) => {
        if (text.includes('youtube.com') || text.includes('embed')) {
          setUrl(text);
        } else {
          setError('No livestream is currently available.');
        }
      })
      .catch((err) => {
        setError('Failed to load livestream.');
        console.error(err);
      });
  }, [API_URL]);

  // Scoreboard WebSocket
  useEffect(() => {
    const scoreSocket = new WebSocket(`${WS_URL}/ws/score`);

    scoreSocket.onopen = () => setStatus('Connected to live scoreboard');
    scoreSocket.onerror = () => setStatus('WebSocket error');
    scoreSocket.onclose = () => setStatus('Disconnected');
    scoreSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setScore(data);
    };

    return () => scoreSocket.close();
  }, [WS_URL]);

  // Chat WebSocket
  useEffect(() => {
    const socket = new WebSocket(`${WS_URL}/ws/chat`);
    chatSocketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setChatMessages((prev) => [...prev, data]);
    };

    socket.onerror = (err) => {
      console.error("Chat WebSocket error:", err);
    };

    return () => socket.close();
  }, [WS_URL]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (chatSocketRef.current?.readyState !== WebSocket.OPEN) {
      console.error('WebSocket not connected');
      return;
    }

    if (newMessage.trim() && user) {
      chatSocketRef.current.send(
        JSON.stringify({
          username: user?.name || user?.email || 'Anonymous',
          message: newMessage,
        })
      );
      setNewMessage('');
    }
  };

  return (
    <div className="stream-container">
      {/* Score Bug */}
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

      <div className="stream-chat-layout">
        {/* Stream Video */}
        <div className="stream-video">
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

        {/* Chat Box */}
        <div className="chat-box">
          <h3>Live Chat</h3>
          <div className="chat-messages">
            {chatMessages.map((msg, i) => (
              <p key={i}>
                <strong>{msg.username}:</strong> {msg.message}
              </p>
            ))}
          </div>
          <form onSubmit={handleSendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              required
            />
            <button type="submit" className="btn">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StreamPage;
