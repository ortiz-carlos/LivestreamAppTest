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

  // Load livestream URL
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

  // Score WebSocket
  useEffect(() => {
    const scoreSocket = new WebSocket('ws://localhost:8000/ws/score');
    scoreSocket.onopen = () => setStatus('Connected to live scoreboard');
    scoreSocket.onerror = () => setStatus('WebSocket error');
    scoreSocket.onclose = () => setStatus('Disconnected');
    scoreSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setScore(data);
    };
    return () => scoreSocket.close();
  }, []);

  // Chat WebSocket
  useEffect(() => {
    chatSocketRef.current = new WebSocket('ws://localhost:8000/ws/chat');
    chatSocketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setChatMessages((prev) => [...prev, data]);
    };
    return () => chatSocketRef.current.close();
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && user) {
      chatSocketRef.current.send(
        JSON.stringify({
          username: user?.name || user?.email,
          message: newMessage,
        })
      );
      setNewMessage('');
    }
  };

console.log("Current user:", user);


  return (
    <div className="stream-container">
      {/* TV-style Score Bug */}
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
        {/* Livestream iframe */}
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

        {/* Live Chat */}
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
