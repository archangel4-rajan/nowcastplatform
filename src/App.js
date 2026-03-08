import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Features from './pages/Features';

import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import StrategyDetail from './pages/StrategyDetail';
import CreatorDashboard from './pages/CreatorDashboard';
import CreateStrategy from './pages/CreateStrategy';
import ManagePortfolio from './pages/ManagePortfolio';
import './App.css';

function HomeRoute() {
  const { user, profile } = useAuth();
  if (user) {
    return <Navigate to={profile?.role === 'creator' ? '/creator' : '/dashboard'} replace />;
  }
  return <Landing />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/features" element={<Features />} />

              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/strategy/:id" element={<StrategyDetail />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/creator"
                element={
                  <ProtectedRoute>
                    <CreatorDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/creator/new"
                element={
                  <ProtectedRoute requireCreator>
                    <CreateStrategy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/creator/edit/:id"
                element={
                  <ProtectedRoute requireCreator>
                    <CreateStrategy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/creator/strategy/:id/portfolio"
                element={
                  <ProtectedRoute requireCreator>
                    <ManagePortfolio />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
