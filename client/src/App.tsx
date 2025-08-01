import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import History from './pages/History';
import Loans from './pages/Loans';
import DCA from './pages/DCA';
import AdminHome from './pages/admin/AdminHome';
import AdminUsers from './pages/admin/AdminUsers';
import AdminHistory from './pages/admin/AdminHistory';
import AdminSettings from './pages/admin/AdminSettings';
import { WebSocketProvider } from './context/WebSocketContext';
import { AuthProvider } from './context/AuthContext';
import WebSocketAuthenticator from './components/WebSocketAuthenticator';
import './App.css';

function App() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <AuthProvider>
      <WebSocketProvider>
        <WebSocketAuthenticator />
        <Router>
          <Routes>
            {/* User Routes */}
            <Route path="/" element={<Layout showBottomNav={!modalOpen}><Home setModalOpen={setModalOpen} /></Layout>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/loans" element={<Layout showBottomNav={!modalOpen}><Loans /></Layout>} />
            <Route path="/dca" element={<Layout showBottomNav={!modalOpen}><DCA /></Layout>} />
            <Route path="/portfolio" element={<Layout showBottomNav={!modalOpen}><div className="p-4 text-white">Portfolio Page Coming Soon</div></Layout>} />
            <Route path="/trade" element={<Layout showBottomNav={!modalOpen}><div className="p-4 text-white">Trade Page Coming Soon</div></Layout>} />
            <Route path="/history" element={<Layout showBottomNav={!modalOpen}><History /></Layout>} />
            <Route path="/profile" element={<Layout showBottomNav={!modalOpen}><div className="p-4 text-white">Profile Page Coming Soon</div></Layout>} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout><AdminHome /></AdminLayout>} />
            <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
            <Route path="/admin/history" element={<AdminLayout><AdminHistory /></AdminLayout>} />
            <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
          </Routes>
        </Router>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
