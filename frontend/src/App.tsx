import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import SimpleDashboard from './components/SimpleDashboard';
import EnhancedDashboard from './components/EnhancedDashboard';
import Dashboard from './components/Dashboard';
import StationDetail from './pages/StationDetail';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<EnhancedDashboard />} />
            <Route path="/debug" element={<SimpleDashboard />} />
            <Route path="/classic" element={<><Navigation /><Dashboard /></>} />
            <Route path="/station/:id" element={<><Navigation /><StationDetail /></>} />
            <Route path="/reports" element={<><Navigation /><Reports /></>} />
            <Route path="/settings" element={<><Navigation /><Settings /></>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
