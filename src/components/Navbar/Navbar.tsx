import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import PublishButton from '../PublishButton/PublishButton';
import './Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();

  // On repère si on est sur la page /favorites
  const isFavoritesPage = location.pathname === '/favorites';
  // On repère si on est sur la page d'accueil ( / )
  const isHomePage = location.pathname === '/';

  return (
    <nav className="navbar">
      {/* Section gauche : Logo/titre, clique -> accueil */}
      <div className="navbar__logo">
        <Link to="/" className="navbar__title">
          kotkit
        </Link>
      </div>

      {/* Section milieu : Bouton "Mes Favoris" (seulement sur la home) */}
      {/* <div className="navbar__center">
        {isHomePage && (
          <Link to="/favorites" className="publish-button">
            Mes Favoris
          </Link>
        )}
      </div> */}

      {/* Section droite : Bouton "Publier" (sauf sur la page /favorites) */}
      <div className="navbar__actions">
        {!isFavoritesPage && <PublishButton onUploadSuccess={() => {}} />}
      </div>
    </nav>
  );
};

export default Navbar;
