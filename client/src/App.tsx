import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import { WebSocketProvider } from './context/WebSocketContext';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <AuthProvider>
      <WebSocketProvider>
        <Router>
          <Layout showBottomNav={!modalOpen}>
            <Routes>
              <Route path="/" element={<Home setModalOpen={setModalOpen} />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/portfolio" element={<div className="p-4 text-white">Portfolio Page Coming Soon</div>} />
              <Route path="/trade" element={<div className="p-4 text-white">Trade Page Coming Soon</div>} />
              <Route path="/history" element={<div className="p-4 text-white">History Page Coming Soon</div>} />
              <Route path="/profile" element={<div className="p-4 text-white">Profile Page Coming Soon</div>} />
            </Routes>
          </Layout>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
