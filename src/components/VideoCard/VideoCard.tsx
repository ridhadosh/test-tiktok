import React, { useRef, useState } from 'react';
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

  const handleVideoPress = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleLike = () => console.log('Like video ID:', video.id);
  const handleComment = () => console.log('Comment on video ID:', video.id);
  const handleShare = () => console.log('Share video ID:', video.id);
  const handleCart = () => {
    if (video.productLink) {
      window.open(video.productLink, '_blank');
    }
  };

  return (
    <div className="video-card">
      <div className="video-wrapper">
        <video
          ref={videoRef}
          src={video.src}
          className="video-card__player"
          onClick={handleVideoPress}
          loop
        />
        <div className="video-card__actions">
          <div className="action-btn" onClick={handleLike}>
            <i className="fa fa-heart"></i>
          </div>
          <div className="action-btn" onClick={handleComment}>
            <i className="fa fa-comment"></i>
          </div>
          <div className="action-btn" onClick={handleShare}>
            <i className="fa fa-share"></i>
          </div>
          <div className="action-btn" onClick={handleCart}>
            <i className="fa fa-shopping-cart"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
