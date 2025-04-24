import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

const baseUrl = process.env.REACT_APP_API_URL;

const RegisterPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await axios.post(`${baseUrl}/register`, { email, password, name });
      const res = await axios.post(`${baseUrl}/login`, { email, password });
      const token = res.data.access_token;
      const me = await axios.get(`${baseUrl}/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      login(token, me.data);
      navigate('/home');
    } catch (error) {
      setErr(error.response?.data?.detail || 'Registration failed');
    }
  };

  return (
    <div className="login-container">
      <h2>Register</h2>
      {err && <p className="error">{err}</p>}
      <form onSubmit={handleRegister}>
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Full Name" required />
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" required />
        <button className="btn" type="submit">Create Account</button>
      </form>
    </div>
  );
};

export default RegisterPage;
