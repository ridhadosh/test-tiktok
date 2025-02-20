import React, { useRef, useState, useEffect } from 'react';
import './VideoCard.css';

interface VideoData {
  id: number;
  src: string;
  title: string;
  productLink?: string;
}

interface VideoCardProps {
  video: VideoData;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- 1) GESTION DU CLIC ---
  const handleVideoPress = () => {
    if (!videoRef.current) return;

    // Pause toutes les autres vidéos
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((vid) => {
      if (vid !== videoRef.current) {
        vid.pause();
      }
    });

    // Lecture / Pause de la vidéo courante
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  // --- 2) OBSERVER SI LA VIDÉO EST VISIBLE (SCROLL / SWIPE) ---
  useEffect(() => {
    if (!videoRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
          setIsPlaying(true);
        } else {
          videoRef.current?.pause();
          if (videoRef.current) {
            videoRef.current.currentTime = 0;
          }
          setIsPlaying(false);
        }        
      },
      {
        threshold: 0.7, // 70% visible pour être considéré "en vue"
      }
    );

    // Observe la balise vidéo
    observer.observe(videoRef.current);

    // Nettoyage : on arrête d'observer quand le composant se démonte
    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  // --- 3) RENDU ---
  return (
    <div className="video-card">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          src={video.src}
          className="video-card__player"
          loop
          onClick={handleVideoPress}
        />
        <div className="video-card__actions">
          <div className="action-btn" onClick={() => console.log('Like')}>
            <i className="fa fa-heart"></i>
          </div>
          <div className="action-btn" onClick={() => console.log('Comment')}>
            <i className="fa fa-comment"></i>
          </div>
          <div className="action-btn" onClick={() => console.log('Share')}>
            <i className="fa fa-share"></i>
          </div>
          <div className="action-btn" onClick={() => console.log('Cart')}>
            <i className="fa fa-shopping-cart"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
