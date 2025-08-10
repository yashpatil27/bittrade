import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import { WebSocketProvider } from './context/WebSocketContext';
import { AuthProvider } from './context/AuthContext';
import { BalanceProvider } from './context/BalanceContext';
import { TransactionProvider } from './context/TransactionContext';
import { PriceProvider } from './context/PriceContext';
import { DCAPlansProvider } from './context/DCAPlansContext';
import WebSocketAuthenticator from './components/WebSocketAuthenticator';
import './App.css';

// Lazy load page components for code splitting
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const History = React.lazy(() => import('./pages/History'));
const Loans = React.lazy(() => import('./pages/Loans'));
const DCA = React.lazy(() => import('./pages/DCA'));

// Lazy load admin pages (only loaded when admin routes are accessed)
const AdminHome = React.lazy(() => import('./pages/admin/AdminHome'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminHistory = React.lazy(() => import('./pages/admin/AdminHistory'));
const AdminSettings = React.lazy(() => import('./pages/admin/AdminSettings'));

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
      <p className="text-gray-400 text-sm">Loading...</p>
    </div>
  </div>
);

function App() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <AuthProvider>
      <WebSocketProvider>
        <PriceProvider>
          <BalanceProvider>
            <TransactionProvider>
              <DCAPlansProvider>
                <WebSocketAuthenticator />
              <Router>
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
              </Router>
              </DCAPlansProvider>
            </TransactionProvider>
          </BalanceProvider>
        </PriceProvider>
      </WebSocketProvider>
    </AuthProvider>
  );
}

export default App;
