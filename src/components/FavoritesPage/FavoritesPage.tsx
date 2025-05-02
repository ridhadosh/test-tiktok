import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VideoCard from '../VideoCard/VideoCard';
import { VideoData } from '../../types';
import './FavoritesPage.css';

const FavoritesPage: React.FC = () => {
  const [favoriteVideos, setFavoriteVideos] = useState<VideoData[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('https://exhib1t.com/wp-json/tiktok/v1/videos')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch videos');
        return res.json();
      })
      .then((allVideos: VideoData[]) => {
        const storedFavs = localStorage.getItem('favorites');
        const favIds: number[] = storedFavs ? JSON.parse(storedFavs) : [];
        const onlyFavs = allVideos.filter((vid) => favIds.includes(vid.id));
        setFavoriteVideos(onlyFavs);
      })
      .catch((err) => console.error(err));
  }, []);

  if (favoriteVideos.length === 0) {
    return (
      <div className="favorites-empty">
        <p className="favorites-empty__message">
          🚀 Vous n'avez aucune vidéo en favoris pour le moment.
        </p>
        <button
          className="favorites-empty__back-btn"
          onClick={() => navigate(-1)}
        >
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div className="video-feed">
      {favoriteVideos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
};

export default FavoritesPage;
