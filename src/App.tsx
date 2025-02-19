import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';
import HomePage from './pages/HomePage';
import Navbar from './components/Navbar/Navbar';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Ajoute ici tes routes pour d'autres pages (ex: profil, détail vidéo, etc.) */}
        </Routes>
      </div>
    </Router>
  );
};

export default App;
