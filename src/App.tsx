import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import 'font-awesome/css/font-awesome.min.css';
import VideoFeed from './components/VideoFeed/VideoFeed';
import Navbar from './components/Navbar/Navbar';
import FavoritesPage from './components/FavoritesPage/FavoritesPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<VideoFeed />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
