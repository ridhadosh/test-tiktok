import React, { useRef, useState, useEffect } from 'react';
import './VideoCard.css';

// A simple global variable to disable comments for *all* videos once user closes.
let globalCommentsDisabled = false;

interface VideoData {
  id: number;
  src: string;
  // any other fields
}

interface VideoCardProps {
  video: VideoData;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControlIcon, setShowControlIcon] = useState<'play' | 'pause' | null>(null);

  // Counters and like state
  const [likes, setLikes] = useState(234);
  const [shares, setShares] = useState(12);
  const [cartAdds, setCartAdds] = useState(8);
  const [isLiked, setIsLiked] = useState(false);

  // Comments
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsCount, setCommentsCount] = useState(0);

  // Is the comment sidebar open for this video?
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  // Local manual override: If the user toggles comments (open/close) for this video,
  // we don’t auto‐open them while it's still in view.
  const [manualOverride, setManualOverride] = useState(false);

  // 1) Fetch comments for this video
  const fetchComments = async () => {
    try {
      const res = await fetch(`http://localhost:3001/comments/${video.id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await res.json();
      setCommentsList(data);
    } catch (err) {
      console.error(err);
    }
  };

  // 2) Update commentsCount whenever commentsList changes
  useEffect(() => {
    setCommentsCount(commentsList.length);
  }, [commentsList]);

  // 3) Intersection Observer for auto‐opening/closing comments
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // If globally disabled or manually overridden, don't auto‐open
          if (!globalCommentsDisabled && !manualOverride && !isCommentOpen) {
            setIsCommentOpen(true);
            fetchComments();
          }
        } else {
          // When scrolled out, close comments and reset manual override
          setIsCommentOpen(false);
          setManualOverride(false);
        }
      },
      { threshold: 0.7 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [manualOverride, isCommentOpen, video.id]);

  // 4) Intersection Observer for video play/pause
  useEffect(() => {
    if (!videoRef.current) return;
    const playObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
          setIsPlaying(true);
        } else {
          videoRef.current?.pause();
          if (videoRef.current) videoRef.current.currentTime = 0;
          setIsPlaying(false);
        }
      },
      { threshold: 0.7 }
    );

    if (videoRef.current) playObserver.observe(videoRef.current);
    return () => {
      if (videoRef.current) playObserver.unobserve(videoRef.current);
    };
  }, []);

  // 5) Play/Pause when user clicks the video
  const handleVideoPress = () => {
    if (!videoRef.current) return;
    // Pause other videos
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

    // Hide icon after 700ms
    setTimeout(() => setShowControlIcon(null), 700);
  };

  // 6) Like/Unlike
  const toggleLike = () => {
    setIsLiked((prev) => {
      const newState = !prev;
      setLikes((l) => (newState ? l + 1 : l - 1));
      return newState;
    });
  };

  // 7) Toggle comment sidebar *manually* (via comment icon)
  const toggleComments = () => {
    setIsCommentOpen((prev) => {
      const newState = !prev;
      // Mark that user manually toggled comments for this video
      setManualOverride(true);

      // If opening, fetch
      if (newState) {
        fetchComments();
      }
      return newState;
    });
  };

  // 8) Close comments (via X button)
  //    Also set a global override so no other videos will auto‐open.
  const handleCloseComments = () => {
    setIsCommentOpen(false);
    setManualOverride(true);      // Keep it closed for this video
    globalCommentsDisabled = true; // Keep it closed for *all* videos
  };

  // 9) Post a new comment
  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`http://localhost:3001/comments/${video.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: 'Anonymous', // or your actual user name
          text: commentText,
        }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      const newComment = await res.json();
      setCommentsList((prev) => [...prev, newComment]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div ref={containerRef} className="video-card">
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

          {/* Clicking this toggles comments manually */}
          <div className="action-container" onClick={toggleComments}>
            <i className="fa fa-comment action-btn"></i>
            <span className="counter">{commentsCount}</span>
          </div>

          <div className="action-container" onClick={() => setShares((prev) => prev + 1)}>
            <i className="fa fa-share action-btn"></i>
            <span className="counter">{shares}</span>
          </div>

          <div className="action-container" onClick={() => setCartAdds((prev) => prev + 1)}>
            <i className="fa fa-shopping-cart action-btn"></i>
            <span className="counter">{cartAdds}</span>
          </div>
        </div>
      </div>

      {/* COMMENT SIDEBAR (outside the video, fixed on the right) */}
      {isCommentOpen && (
        <div className="comment-modal" onClick={() => setIsCommentOpen(false)}>
          <div className="comment-container" onClick={(e) => e.stopPropagation()}>
            <div className="comment-header">
              <h2>Comments</h2>
              <button className="close-btn" onClick={handleCloseComments}>
                ✕
              </button>
            </div>
            <div className="comment-list">
              {commentsList.length === 0 ? (
                <p>🚀 No comments yet. Be the first!</p>
              ) : (
                commentsList.map((comment) => (
                  <div key={comment.id} style={{ marginBottom: '1rem' }}>
                    <strong>{comment.user}</strong>
                    <p>{comment.text}</p>
                  </div>
                ))
              )}
            </div>
            <div className="comment-input">
              <input
                type="text"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button onClick={handleSendComment}>Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
