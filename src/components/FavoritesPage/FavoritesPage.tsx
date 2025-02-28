import React, { useEffect, useState } from 'react';
import VideoCard from '../VideoCard/VideoCard';
import { VideoData } from '../../types';

const FavoritesPage: React.FC = () => {
  const [favoriteVideos, setFavoriteVideos] = useState<VideoData[]>([]);

  useEffect(() => {
    // 1) Récupère la liste de TOUTES les vidéos
    fetch('http://localhost:3001/videos')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch videos');
        return res.json();
      })
      .then((allVideos: VideoData[]) => {
        // 2) Récupère la liste des IDs favoris depuis localStorage
        const storedFavs = localStorage.getItem('favorites');
        const favIds: number[] = storedFavs ? JSON.parse(storedFavs) : [];

        // 3) Filtrer
        const onlyFavs = allVideos.filter((vid) => favIds.includes(vid.id));

        console.log('All videos:', allVideos);
        console.log('favIds:', favIds);
        console.log('onlyFavs:', onlyFavs);

        // 4) Stocker dans le state
        setFavoriteVideos(onlyFavs);
      })
      .catch((err) => console.error(err));
  }, []);

  return (
    <div style={{ padding: '1rem' }}>
      {favoriteVideos.length === 0 ? (
        <p>Aucune vidéo en favoris.</p>
      ) : (
        favoriteVideos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))
      )}
    </div>
  );
};

export default FavoritesPage;
