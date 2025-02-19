import React from 'react';
import VideoCard from '../VideoCard/VideoCard';
import '../VideoFeed/VideoFeed.css';

interface VideoData {
  id: number;
  src: string;
  title: string;
  productLink?: string;
}

const mockVideos: VideoData[] = [
  {
    id: 1,
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    title: 'Première vidéo',
    productLink: 'https://mon-site.com/produit-1',
  },
  {
    id: 2,
    src: 'https://www.w3schools.com/html/movie.mp4',
    title: 'Deuxième vidéo',
    productLink: 'https://mon-site.com/produit-2',
  },
  // Ajoute plus de vidéos...
];

const VideoFeed: React.FC = () => {
  return (
    <div className="video-feed">
      {mockVideos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}

export default VideoFeed;
