import React, { useEffect, useState } from 'react';
import VideoCard from '../VideoCard/VideoCard';
import '../VideoFeed/VideoFeed.css';
import { VideoData } from '../../types';

interface VideoDataWithLike extends VideoData {
  userLiked: boolean;
}

const VideoFeed: React.FC = () => {
  const [videos, setVideos] = useState<VideoDataWithLike[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // charge à la fois le statut admin et la liste des vidéos + userLiked
  const loadFeed = async () => {
    try {
      const [userRes, videosRes] = await Promise.all([
        fetch('https://exhib1t.com/wp-json/tiktok/v1/whoami-alt', {
          credentials: 'include',
        }),
        fetch(
          `https://exhib1t.com/wp-json/tiktok/v1/videos?withLiked=true&time=${Date.now()}`,
          {
            credentials: 'include',
            cache: 'no-store',
          }
        ),
      ]);

      if (!userRes.ok) throw new Error('Échec du chargement du user');
      if (!videosRes.ok) throw new Error('Échec du chargement des vidéos');

      const user = await userRes.json();
      setIsAdmin(
        Array.isArray(user.roles) && user.roles.includes('administrator')
      );

      const data: VideoDataWithLike[] = await videosRes.json();
      setVideos(data);
    } catch (err) {
      console.error('Erreur loadFeed:', err);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  // si tu intègres PublishButton ici, tu peux rafraîchir tout le feed
  const handleUploadSuccess = () => {
    loadFeed();
  };

  return (
    <div className="video-feed">
      {/* 
        Si tu veux afficher le bouton de publication ici, 
        décommente la ligne suivante et importe ton PublishButton 
      */}
      {/* <PublishButton onUploadSuccess={handleUploadSuccess} /> */}

      {videos.map(video => (
        <VideoCard
          key={video.id}
          video={video}
          isAdmin={isAdmin}
        />
      ))}
    </div>
  );
};

export default VideoFeed;
