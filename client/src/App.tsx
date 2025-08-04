import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
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
import { BalanceProvider } from './context/BalanceContext';
import { TransactionProvider } from './context/TransactionContext';
import WebSocketAuthenticator from './components/WebSocketAuthenticator';
import './App.css';

function App() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <AuthProvider>
      <WebSocketProvider>
        <BalanceProvider>
          <TransactionProvider>
            <WebSocketAuthenticator />
            <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected User Routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout showBottomNav={!modalOpen}>
                  <Home setModalOpen={setModalOpen} />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/loans" element={
              <ProtectedRoute>
                <Layout showBottomNav={!modalOpen}>
                  <Loans />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/dca" element={
              <ProtectedRoute>
                <Layout showBottomNav={!modalOpen}>
                  <DCA />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/portfolio" element={
              <ProtectedRoute>
                <Layout showBottomNav={!modalOpen}>
                  <div className="p-4 text-white">Portfolio Page Coming Soon</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/trade" element={
              <ProtectedRoute>
                <Layout showBottomNav={!modalOpen}>
                  <div className="p-4 text-white">Trade Page Coming Soon</div>
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/history" element={
              <ProtectedRoute>
                <Layout showBottomNav={!modalOpen}>
                  <History />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout showBottomNav={!modalOpen}>
                  <div className="p-4 text-white">Profile Page Coming Soon</div>
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Protected Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminHome />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminUsers />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/history" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminHistory />
                </AdminLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute>
                <AdminLayout>
                  <AdminSettings />
                </AdminLayout>
              </ProtectedRoute>
            } />
          </Routes>
            </Router>
          </TransactionProvider>
        </BalanceProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
