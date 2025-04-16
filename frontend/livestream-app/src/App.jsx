import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import StreamPage from './pages/StreamPage';
import AdminPage from './pages/AdminPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import PrivateRoute from './components/PrivateRoute';
import { AuthContext } from './AuthContext';
import OAuthCallback from './pages/OAuthCallback';

const App = () => {
  const { loading } = useContext(AuthContext);

  if (loading) return <div>Loading...</div>;

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected routes */}
        <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
        <Route path="/stream" element={<PrivateRoute><StreamPage /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
        <Route path="/oauth/callback" element={<OAuthCallback />} />

        {/* Redirect unknown paths */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
