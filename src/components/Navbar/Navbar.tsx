import React from 'react';
import PublishButton from '../PublishButton/PublishButton';
import './Navbar.css';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar__logo">
        {/* Logo / Titre de l'application */}
        <h1>kotkit</h1>
      </div>
      <div className="navbar__actions">
        {/* Bouton pour publier une nouvelle vidéo */}
        <PublishButton onUploadSuccess={() => {}}  />
      </div>
    </nav>
  );
};

export default Navbar;
