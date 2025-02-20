import React, { useRef, useState, useEffect } from 'react';
import './VideoCard.css';
import { VideoData } from '../../types';


interface VideoCardProps {
  video: VideoData;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControlIcon, setShowControlIcon] = useState<'play' | 'pause' | null>(null);

  // États pour les compteurs
  const [likes, setLikes] = useState(234);
  const [comments, setComments] = useState(57);
  const [shares, setShares] = useState(12);
  const [cartAdds, setCartAdds] = useState(8);

  // État pour savoir si l’utilisateur a liké
  const [isLiked, setIsLiked] = useState(false);

  // État pour gérer l'ouverture du modal de commentaires
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  const handleVideoPress = () => {
    if (!videoRef.current) return;
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((vid) => {
      if (vid !== videoRef.current) vid.pause();
    });

    if (isPlaying) {
      videoRef.current.pause();
      setShowControlIcon('pause');
    } else {
      videoRef.current.play();
      setShowControlIcon('play');
    }
    setIsPlaying(!isPlaying);

    setTimeout(() => {
      setShowControlIcon(null);
    }, 700);
  };

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
      { threshold: 0.7 }
    );

    observer.observe(videoRef.current);
  }, []);

  // Fonction pour gérer le like/unlike
  const toggleLike = () => {
    if (isLiked) {
      setLikes(likes - 1);
    } else {
      setLikes(likes + 1);
    }
    setIsLiked(!isLiked);
  };

  // Fonction pour ouvrir et fermer le modal de commentaires
  const toggleComments = () => {
    setIsCommentOpen(!isCommentOpen);
  };

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

        {showControlIcon && (
          <div className="video-status-icon">
            {showControlIcon === 'play' ? (
              <i className="fa fa-play" />
            ) : (
              <i className="fa fa-pause" />
            )}
          </div>
        )}

        <div className="video-card__actions">
          <div className="action-container" onClick={toggleLike}>
            <i className={`fa fa-heart action-btn ${isLiked ? 'liked' : ''}`}></i>
            <span className="counter">{likes}</span>
          </div>
          <div className="action-container" onClick={toggleComments}>
            <i className="fa fa-comment action-btn"></i>
            <span className="counter">{comments}</span>
          </div>
          <div className="action-container" onClick={() => setShares(shares + 1)}>
            <i className="fa fa-share action-btn"></i>
            <span className="counter">{shares}</span>
          </div>
          <div className="action-container" onClick={() => setCartAdds(cartAdds + 1)}>
            <i className="fa fa-shopping-cart action-btn"></i>
            <span className="counter">{cartAdds}</span>
          </div>
        </div>
      </div>

      {/* COMMENT MODAL */}
      {isCommentOpen && (
        <div className="comment-modal" onClick={toggleComments}>
          <div className="comment-container" onClick={(e) => e.stopPropagation()}>
            <div className="comment-header">
              <h2>Comments</h2>
              <button className="close-btn" onClick={toggleComments}>✕</button>
            </div>
            <div className="comment-list">
              <p>🚀 No comments yet. Be the first!</p>
            </div>
            <div className="comment-input">
              <input type="text" placeholder="Write a comment..." />
              <button>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
