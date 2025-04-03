import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // user info
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  // Load user from token
  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await axios.get('http://localhost:8000/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setUser(res.data);
        } catch (err) {
          console.error('Token invalid or expired');
          setUser(null);
          setToken('');
          localStorage.removeItem('token');
        }
      }
    };
    fetchUser();
  }, [token]);

  const login = (jwt, userData) => {
    setToken(jwt);
    localStorage.setItem('token', jwt);
    setUser(userData);
  };

  const logout = () => {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
