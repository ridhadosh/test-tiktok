import React, { useEffect, useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import VideoCard from '../VideoCard/VideoCard';
import '../VideoFeed/VideoFeed.css';
import { VideoData } from '../../types';

const VideoFeed: React.FC = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [page, setPage] = useState(0);       // Numéro de page actuel
  const [hasMore, setHasMore] = useState(true); // Indique s’il reste des vidéos à charger
  const limit = 10; // Nombre de vidéos par page

  /**
   * Récupère la page courante de vidéos depuis le back-end
   * et les ajoute à la liste existante.
   */
  const fetchVideos = async () => {
    try {
      // On appelle l'endpoint avec page & limit
      const response = await fetch(`http://localhost:3001/videos?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const data: VideoData[] = await response.json();

      // Si on reçoit moins de vidéos que "limit", c'est qu'on est à la fin
      if (data.length < limit) {
        setHasMore(false);
      }

      // On concatène les nouvelles vidéos avec les anciennes
      setVideos((prev) => [...prev, ...data]);
      // On passe à la page suivante pour la prochaine requête
      setPage((prev) => prev + 1);
    } catch (error) {
      console.error('Error fetching videos:', error);
      setHasMore(false);
    }
  };

  /**
   * Charger la première page au montage
   */
  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <InfiniteScroll
      dataLength={videos.length}   // Nombre d’éléments déjà rendus
      next={fetchVideos}           // Fonction pour charger la suite
      hasMore={hasMore}            // Indique s’il reste des vidéos à charger
      loader={<h4>Chargement...</h4>}   // Affiché pendant le chargement
      endMessage={<p>Fin du contenu</p>} // Affiché quand hasMore = false
    >
      <div className="video-feed">
        {videos.map((video) => (
          <VideoCard key={video.id} video={video} />
        ))}
      </div>
    </InfiniteScroll>
  );
};

export default VideoFeed;
