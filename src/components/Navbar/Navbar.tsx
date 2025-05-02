import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PublishButton from '../PublishButton/PublishButton';
import './Navbar.css';

const Navbar: React.FC = () => {
  const location = useLocation();
  const isFavoritesPage = location.pathname === '/favorites';

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('https://exhib1t.com/wp-json/tiktok/v1/whoami-alt', {
      credentials: 'include',
      headers: { 'X-WP-Nonce': window.tiktokRest.nonce },
    })
      .then(res => res.json())
      .then(user => {
        const ok = Array.isArray(user.roles) && user.roles.includes('administrator');
        setIsAdmin(ok);
      })
      .catch(() => setIsAdmin(false));
  }, []);

  if (!isAdmin) return null;

  return (
    <nav className="navbar">
      <div className="navbar__center">
        {!isFavoritesPage && <PublishButton onUploadSuccess={() => {}} />}
      </div>
    </nav>
  );
};

export default Navbar;
