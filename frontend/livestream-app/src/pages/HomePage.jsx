import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import '../styles.css';

const HomePage = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <nav>
        <div className="logo">LiveStream</div>
        <ul>
          <li><Link to="/home">Home</Link></li>
          <li><Link to="/stream">Stream</Link></li>
          <li><Link to="/admin">Admin</Link></li>
          {user && (
            <li>
              <button className="btn" onClick={handleLogout} style={{ marginLeft: '10px' }}>
                Log Out
              </button>
            </li>
          )}
        </ul>
      </nav>

      <header className="hero">
        <div className="overlay">
          <h1>Welcome to StampedeStream</h1>
          <p>Home of CMU Club Women's Rugby Livestreaming.</p>
          <Link to="/stream" className="btn">Watch Now</Link>
        </div>
      </header>

      <section className="about">
        <h2>About The Team</h2>
        <p>Find out more about the team, including the roster and schedule here!</p>
        <a
          href="https://cmumavericks.com/sports/womens-rugby"
          className="btn"
          target="_blank"
          rel="noreferrer"
        >
          CMU Club Women's Rugby Page
        </a>
      </section>

      <footer>
        <p>&copy; 2025 StampedeStream. All Rights Reserved.</p>
      </footer>
    </>
  );
};

export default HomePage;
