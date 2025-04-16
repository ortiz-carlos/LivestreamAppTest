import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const LoginPage = () => {
  const { user, login, loading } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/home');
    }
  }, [user, loading, navigate]);
  


  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8000/login', { email, password });
      const token = res.data.access_token;

      const me = await axios.get('http://localhost:8000/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      login(token, me.data);
      navigate('/home');
    } catch (error) {
      setErr('Invalid credentials');
    }
  };

  const handleGoogleLogin = async () => {
    const { error, url } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/oauth/callback'
      }
    });
  
    if (error) {
      setErr('Google login failed');
      console.error('Google login error:', error.message);
      return;
    }
  
    if (url) {
      window.location.assign(url);
    }
  };
  
  
  
  return (
    <div className="login-container">
      <h2>Login</h2>
      {err && <p className="error">{err}</p>}
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button className="btn" type="submit">Log In</button>
      </form>
      <p>Don't have an account? <Link to="/register">Sign up</Link></p>

      <div style={{ marginTop: '20px' }}>
        <p>or</p>
        <button className="btn" onClick={handleGoogleLogin}>
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default LoginPage;
