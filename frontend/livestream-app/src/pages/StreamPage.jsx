import React, { useEffect, useState } from 'react';
import '../styles.css';

const StreamPage = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/live_url')
      .then((res) => res.text())
      .then((text) => {
        if (text.includes('youtube.com')) {
          setUrl(text);
        } else {
          setError(text); // show the "No livestream available" message
        }
      })
      .catch((err) => {
        setError('Failed to load livestream.');
        console.error(err);
      });
  }, []);

  return (
    <div className="stream-container">
      <h1>Live Broadcast</h1>
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
