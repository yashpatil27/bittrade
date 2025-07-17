import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import './App.css';

function App() {
  const [modalOpen, setModalOpen] = React.useState(false);

  return (
    <Router>
      <Layout showBottomNav={!modalOpen}>
        <Routes>
          <Route path="/" element={<Home setModalOpen={setModalOpen} />} />
          <Route path="/portfolio" element={<div className="p-4 text-white">Portfolio Page Coming Soon</div>} />
          <Route path="/trade" element={<div className="p-4 text-white">Trade Page Coming Soon</div>} />
          <Route path="/history" element={<div className="p-4 text-white">History Page Coming Soon</div>} />
          <Route path="/profile" element={<div className="p-4 text-white">Profile Page Coming Soon</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
