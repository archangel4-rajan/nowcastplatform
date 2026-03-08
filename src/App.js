import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Features from './pages/Features';
import Solutions from './pages/Solutions';

import About from './pages/About';
import Contact from './pages/Contact';
import AuthCallback from './pages/AuthCallback';
import Dashboard from './pages/Dashboard';
import Marketplace from './pages/Marketplace';
import StrategyDetail from './pages/StrategyDetail';
import CreatorDashboard from './pages/CreatorDashboard';
import CreateStrategy from './pages/CreateStrategy';
import ManagePortfolio from './pages/ManagePortfolio';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/features" element={<Features />} />
              <Route path="/solutions" element={<Solutions />} />

              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
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
