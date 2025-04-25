import React from 'react';
import { useLocation } from 'react-router-dom';
import PublishButton from '../PublishButton/PublishButton';
import './Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isFavoritesPage = location.pathname === '/favorites';

  return (
    <nav className="navbar">
      <div className="navbar__center">
        {!isFavoritesPage && <PublishButton onUploadSuccess={() => {}} />}
      </div>
    </nav>
  );
};

export default Navbar;
