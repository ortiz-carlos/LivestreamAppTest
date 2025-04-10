import React from 'react';
import HomePage from './pages/HomePage';
import StreamPage from './pages/StreamPage';
import AdminPage from './pages/AdminPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';


const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route path="/home" element={
          <PrivateRoute><HomePage /></PrivateRoute>
        } />
        <Route path="/stream" element={
          <PrivateRoute><StreamPage /></PrivateRoute>
        } />
        <Route path="/admin" element={
          <PrivateRoute><AdminPage /></PrivateRoute>
        } />

        {/* Catch-all route to redirect unknown paths to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
