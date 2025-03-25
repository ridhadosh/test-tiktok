import React, { useEffect, useState } from 'react';
import VideoCard from '../VideoCard/VideoCard';
import '../VideoFeed/VideoFeed.css';
import { VideoData } from '../../types';

const VideoFeed: React.FC = () => {
  // On stocke la liste des vidéos dans un state
  const [videos, setVideos] = useState<VideoData[]>([]);

  // Fonction pour récupérer la liste des vidéos depuis le back-end
  const fetchVideos = async () => {
    try {
      // Remplace l’URL par ton adresse (avec ou sans proxy)
      const response = await fetch('https://exhib1t.com/wp-json/tiktok/v1/videos');
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      const data = await response.json();
      setVideos(data);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  // Appel au montage du composant pour charger les vidéos
  useEffect(() => {
    fetchVideos();
  }, []);

  // Callback pour rafraîchir la liste après upload (si on place PublishButton ici)
  const handleUploadSuccess = () => {
    fetchVideos();
  };

  return (
    <div className="video-feed">

      {/* 
        Optionnel : si tu veux le bouton ici, tu l’ajoutes
        <PublishButton onUploadSuccess={handleUploadSuccess} />
      */}
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
};

export default VideoFeed;