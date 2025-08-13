import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoadingScreen from './components/PageLoadingScreen';
import { WebSocketProvider } from './context/WebSocketContext';
import { AuthProvider } from './context/AuthContext';
import { PriceProvider } from './context/PriceContext';
import { PortfolioProvider } from './context/PortfolioContext';
import WebSocketAuthenticator from './components/WebSocketAuthenticator';
import './App.css';

// Import core pages directly to prevent double loading with auth
import Home from './pages/Home';
import History from './pages/History';
import Loans from './pages/Loans';
import DCA from './pages/DCA';

// Lazy load other page components for code splitting
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));

// Lazy load admin pages (only loaded when admin routes are accessed)
const AdminHome = React.lazy(() => import('./pages/admin/AdminHome'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminHistory = React.lazy(() => import('./pages/admin/AdminHistory'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));


function App() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <AuthProvider>
      <WebSocketProvider>
        <PriceProvider>
          <PortfolioProvider>
            <WebSocketAuthenticator />
            <Router>
          <Suspense fallback={<PageLoadingScreen />}>
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
            <Route path="/history" element={
              <ProtectedRoute>
                <Layout showBottomNav={!modalOpen}>
                  <History />
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
          </Suspense>
            </Router>
          </PortfolioProvider>
        </PriceProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
