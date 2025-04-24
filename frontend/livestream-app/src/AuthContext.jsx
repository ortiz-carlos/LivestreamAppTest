import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { supabase } from './supabaseClient';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchJWTUser = async () => {
      if (token) {
        try {
          const res = await axios.get('http://localhost:8000/me', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          setUser(res.data);
        } catch (err) {
          console.error('JWT token invalid or expired');
          setUser(null);
          setToken('');
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };
    fetchJWTUser();
  }, [token]);

  useEffect(() => {
    const checkSupabaseUser = async () => {
      const { data: { session }} = await supabase.auth.getSession();
  
      if (session?.user) {
        setUser(session.user);
        localStorage.setItem('supabase_session', JSON.stringify(session));
      } else {
        setUser(null);
        localStorage.removeItem('supabase_session');
      }
  
      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user) {
          setUser(session.user);
          localStorage.setItem('supabase_session', JSON.stringify(session));
      
        } else {
          setUser(null);
          localStorage.removeItem('supabase_session');
        }
      });
      
      setLoading(false);
      return () => subscription.unsubscribe();
    };
  
    checkSupabaseUser();
  }, []);
  
  

  const login = (jwt, userData) => {
    setToken(jwt);
    localStorage.setItem('token', jwt);
    setUser(userData);
  };

  const logout = async () => {
    setToken('');
    localStorage.removeItem('token');
    setUser(null);
    await supabase.auth.signOut(); // logs out Supabase users too
  };

  return (
      <AuthContext.Provider value={{ user, token, login, logout, loading }}>

      {children}
    </AuthContext.Provider>
  );
};
