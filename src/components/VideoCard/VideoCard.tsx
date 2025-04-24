import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './VideoCard.css';
import defaultProfile from '../assets/default-avatar.png';
import { VideoData } from '../../types';

// Variable globale pour désactiver les commentaires sur toutes les vidéos
let globalCommentsDisabled = false;
declare const tiktokRest: { nonce: string };

interface VideoCardProps {
  video: VideoData;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // État de lecture de la vidéo
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControlIcon, setShowControlIcon] = useState<'play' | 'pause' | null>(null);

  // Compteurs et like
  const [likes, setLikes] = useState(video.likes || 0);
  const [shares, setShares] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loadingLike, setLoadingLike] = useState(false);

  // Commentaires
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsCount, setCommentsCount] = useState(0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // NEW STATES: For More menu (and admin status, if needed)
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    fetch('https://exhib1t.com/wp-json/tiktok/v1/whoami-alt', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(user => {
        if (Array.isArray(user.roles) && user.roles.includes('administrator')) {
          setIsAdmin(true);
        }
      })
      .catch(console.error);
  }, []);
  

  /* ------------------------------------------------------------------
     NEW FUNCTION: Delete video (admin only)
  ------------------------------------------------------------------ */
  const handleDeleteVideo = async () => {
    if (!window.confirm('Are you sure you want to delete this video permanently?')) return;
  
    try {
      const res = await fetch(
        `https://exhib1t.com/wp-json/tiktok/v1/videos/${video.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'X-WP-Nonce': (window as any).tiktokRest.nonce,
          },
        }
      );
      if (!res.ok) throw new Error(await res.text());
      alert('Video deleted successfully');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Failed to delete video. You may not have permission.');
    }
  };
  

  const handleCartClick = () => {
    if (video.ticketLink) {
      window.open(video.ticketLink, '_blank');
    } else {
      setIsCartModalOpen(true);
    }
  };

  // État pour la fenêtre de partage
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareLink = video.src;
  const shareOptions = [
    { name: 'Repost', icon: 'fa fa-retweet', link: '#' },
    { name: 'Send to friends', icon: 'fa fa-paper-plane', link: '#' },
    { name: 'Embed', icon: 'fa fa-code', link: '#' },
    { name: 'WhatsApp', icon: 'fa fa-whatsapp', link: 'https://web.whatsapp.com' },
    { name: 'Facebook', icon: 'fa fa-facebook', link: 'https://facebook.com' },
    { name: 'X', icon: 'fa fa-twitter', link: 'https://twitter.com' },
    { name: 'Telegram', icon: 'fa fa-telegram', link: 'https://telegram.org' },
    { name: 'LinkedIn', icon: 'fa fa-linkedin', link: 'https://linkedin.com' },
    { name: 'Reddit', icon: 'fa fa-reddit', link: 'https://reddit.com' },
    { name: 'Pinterest', icon: 'fa fa-pinterest', link: 'https://pinterest.com' },
  ];

  // Favoris
  const [isFavorited, setIsFavorited] = useState(false);

  /* ------------------------------------------------------------------
     1) Charger les commentaires pour cette vidéo
  ------------------------------------------------------------------ */
  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const res = await fetch(`https://exhib1t.com/wp-json/tiktok/v1/comments/${video.id}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setCommentsList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    async function fetchLikeStatus() {
      setLoadingLike(true);
      try {
        const response = await fetch(
          `https://exhib1t.com/wp-json/tiktok/v1/like/status?videoId=${video.id}`,
          { credentials: 'include' }
        );
        if (!response.ok) throw new Error('Network error');
        const data = await response.json();
        // Expecting backend to return { liked: true/false }
        setIsLiked(data.liked);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingLike(false);
      }
    }
    fetchLikeStatus();
  }, [video.id]);

  /* ------------------------------------------------------------------
     2) Mettre à jour le nombre de commentaires quand la liste change
  ------------------------------------------------------------------ */
  useEffect(() => {
    setCommentsCount(commentsList.length);
  }, [commentsList]);

  /* ------------------------------------------------------------------
     3) Intersection Observer pour auto‐ouvrir/fermer la sidebar
  ------------------------------------------------------------------ */
 

  /* ------------------------------------------------------------------
     4) Intersection Observer pour jouer/pauser la vidéo auto
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!videoRef.current) return;
    const playObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        videoRef.current?.play().catch(() => {});
        setIsPlaying(true);
      } else {
        videoRef.current?.pause();
        if (videoRef.current) videoRef.current.currentTime = 0;
        setIsPlaying(false);
      }
    }, { threshold: 0.7 });
    if (videoRef.current) playObserver.observe(videoRef.current);
    return () => {
      if (videoRef.current) playObserver.unobserve(videoRef.current);
    };
  }, []);

  /* ------------------------------------------------------------------
     4.5) Détection format vidéo (vertical/horizontal)
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!videoRef.current) return;
    const videoEl = videoRef.current;
    function handleMetadata() {
      const { videoWidth, videoHeight } = videoEl;
      if (videoHeight > videoWidth) {
        videoEl.classList.add('vertical-video');
        videoEl.classList.remove('horizontal-video');
      } else {
        videoEl.classList.add('horizontal-video');
        videoEl.classList.remove('vertical-video');
      }
    }
    videoEl.addEventListener('loadedmetadata', handleMetadata);
    return () => {
      videoEl.removeEventListener('loadedmetadata', handleMetadata);
    };
  }, []);

  /* ------------------------------------------------------------------
     5) Lecture/Pause au clic
  ------------------------------------------------------------------ */
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
    setTimeout(() => setShowControlIcon(null), 700);
  };

  /* ------------------------------------------------------------------
     6) Like/Unlike – Mise à jour via l'API pour persister en DB
  ------------------------------------------------------------------ */
  const toggleLike = async () => {
    // If already liked, do nothing
    if (isLiked) {
      return;
    }
    setLoadingLike(true);
    try {
      const endpoint = 'https://exhib1t.com/wp-json/tiktok/v1/like';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ videoId: video.id }),
      });
      if (!response.ok) throw new Error('Failed to update like count');
      const data = await response.json();
      // Expect backend to return updated like count and status: { likes: number, liked: true }
      setLikes(data.likes);
      setIsLiked(data.liked);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLike(false);
    }
  };

  /* ------------------------------------------------------------------
     7) Ouvrir/fermer manuellement la sidebar Comments
  ------------------------------------------------------------------ */
  const toggleComments = () => {
    setIsCommentOpen((prev) => {
      const newState = !prev;
      setManualOverride(true);
      if (newState) {
        fetchComments();
      }
      return newState;
    });
  };

  /* ------------------------------------------------------------------
     8) Fermer la sidebar + désactiver global
  ------------------------------------------------------------------ */
  const handleCloseComments = () => {
    setIsCommentOpen(false);
    setManualOverride(true);
    globalCommentsDisabled = true;
  };

  /* ------------------------------------------------------------------
     9) Poster un commentaire
  ------------------------------------------------------------------ */
  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    try {
      const nonce = (window.parent as any).tiktokRest?.nonce || '';
      const res = await fetch(`https://exhib1t.com/wp-json/tiktok/v1/comments/${video.id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-WP-Nonce': nonce
        },
        credentials: 'include',
        body: JSON.stringify({ text: commentText }),
      });
      if (!res.ok) throw new Error('Failed to post comment');
      const newComment = await res.json();
      setCommentsList((prev) => [...prev, newComment]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    }
  };
  

  /* ------------------------------------------------------------------
     -- PARTAGE --
  ------------------------------------------------------------------ */
  const toggleShareModal = () => {
    setIsShareOpen(!isShareOpen);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied!');
    setShares((prev) => prev + 1);
  };

  const handleClickSocial = (url: string) => {
    window.open(url, '_blank');
    setShares((prev) => prev + 1);
  };

  // --------------------------------------------
  // -- FAVORIS --
  // --------------------------------------------
  useEffect(() => {
    const storedFavs = localStorage.getItem('favorites');
    const favIds: number[] = storedFavs ? JSON.parse(storedFavs) : [];
    if (favIds.includes(video.id)) {
      setIsFavorited(true);
    }
  }, [video.id]);

  const toggleFavorite = () => {
    const storedFavs = localStorage.getItem('favorites');
    let favIds: number[] = storedFavs ? JSON.parse(storedFavs) : [];
    if (favIds.includes(video.id)) {
      favIds = favIds.filter((id) => id !== video.id);
      setIsFavorited(false);
    } else {
      favIds.push(video.id);
      setIsFavorited(true);
    }
    localStorage.setItem('favorites', JSON.stringify(favIds));
  };

  return (
    <div ref={containerRef} className="video-card">
      <div className="video-wrapper">
        {/* ─── NAV FLUX / FAVORIS ─── */}
                <div className="video-card__nav">
          {/*
            Use <Link> so React Router handles it (no full page reload),
            and stopPropagation so the click doesn’t hit the video.
          */}
        <Link
            to="/"
          className={`tab ${location.pathname === '/' ? 'tab--active' : ''}`}
          onClick={e => e.stopPropagation()}
          >
            Flux
          </Link>
        <Link
            to="/favorites"
            className={`tab ${location.pathname === '/favorites' ? 'tab--active' : ''}`}
          onClick={e => e.stopPropagation()}
        >
            Favoris
        </Link>
        </div>

        <video
          ref={videoRef}
          src={video.src}
          className="video-card__player"
          loop
          onClick={handleVideoPress}
        />

        {/* Icône Play/Pause au centre */}
        {showControlIcon && (
          <div className="video-status-icon">
            {showControlIcon === 'play' ? <i className="fa fa-play" /> : <i className="fa fa-pause" />}
          </div>
        )}

        {/* Icônes d'actions (Groupe, Like, Comment, Share, Cart, Fav, More) */}
        <div className="video-card__actions">
          <div
            className={`action-container profile-container ${video.group_slug ? 'clickable' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (video.group_slug) {
                window.open(`https://exhib1t.com/groups/${video.group_slug}`, '_blank');
              }
            }}
          >
            <div className="profile-link">
              <img
                src={video.group_avatar_url || defaultProfile}
                alt={video.group_slug ? "Groupe" : "Profil"}
                className="profile-icon"
              />
            </div>
          </div>
          <div className="action-container" onClick={toggleLike}>
            {loadingLike ? (
              <i className="fa fa-spinner fa-spin action-btn"></i>
            ) : (
              <i className={`fa fa-heart action-btn ${isLiked ? 'liked' : ''}`}></i>
            )}
            <span className="counter">{likes}</span>
          </div>
          <div className="action-container" onClick={toggleComments}>
            <i className="fa fa-comment action-btn"></i>
            <span className="counter">{commentsCount}</span>
          </div>
          <div className="action-container" onClick={toggleShareModal}>
            <i className="fa fa-share action-btn"></i>
            <span className="counter">{shares}</span>
          </div>
          <div className="action-container" onClick={handleCartClick}>
            <i className="fa fa-shopping-cart action-btn"></i>
            <span className="counter">Billet</span>
          </div>
          <div className="action-container" onClick={toggleFavorite}>
            <i className={`fa fa-star action-btn ${isFavorited ? 'liked' : ''}`}></i>
            <span className="counter">Fav</span>
          </div>
          <div className="action-container" onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}>
            <i className="fa fa-ellipsis-h action-btn"></i>
            <span className="counter">More</span>
          </div>
        </div>

        {/* Overlay for title and description */}
        {(video.title || video.description) && (
          <div className="video-overlay">
            {video.title && <div className="video-title-overlay">{video.title}</div>}
            {video.description && <div className="video-description-overlay">{video.description}</div>}
          </div>
        )}
      </div>

      {/* Comment sidebar */}
      {isCommentOpen && (
        <div className="comment-modal" onClick={() => setIsCommentOpen(false)}>
          <div className="comment-container" onClick={(e) => e.stopPropagation()}>
            <div className="comment-header">
              <h2>Comments</h2>
              <button className="close-btn" onClick={handleCloseComments}>✕</button>
            </div>
            {loadingComments ? (
              <div className="loading">Loading comments...</div>
            ) : (
              <div className="comment-list">
                {commentsList.length === 0 ? (
                  <p>🚀 Aucun commentaire pour le moment. Soyez le premier!</p>
                ) : (
                  commentsList.map((comment) => (
                    <div key={comment.id} style={{ marginBottom: '1rem' }}>
                      <strong>{comment.user}</strong>
                      <p>{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
            )}
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

      {/* Share modal */}
      {isShareOpen && (
        <div className="share-modal" onClick={() => setIsShareOpen(false)}>
          <div className="share-container" onClick={(e) => e.stopPropagation()}>
            <h2>Share to</h2>
            <div className="share-link-container">
              <input type="text" readOnly value={shareLink} className="share-link" />
              <button className="copy-btn" onClick={handleCopyLink}>Copy</button>
            </div>
            <div className="share-options-grid">
              {shareOptions.map((option) => (
                <div key={option.name} className="share-option" onClick={() => handleClickSocial(option.link)}>
                  <i className={option.icon}></i>
                  <span>{option.name}</span>
                </div>
              ))}
            </div>
            <button className="close-btn" onClick={() => setIsShareOpen(false)}>✕</button>
          </div>
        </div>
      )}

      {/* Cart modal */}
      {isCartModalOpen && (
        <div className="cart-modal" onClick={() => setIsCartModalOpen(false)}>
          <div className="cart-container" onClick={(e) => e.stopPropagation()}>
            <h2>🎟 Billetterie</h2>
            <p>Le lien d'achat des billets n'est pas encore disponible.</p>
            <button className="close-btn" onClick={() => setIsCartModalOpen(false)}>✕</button>
          </div>
        </div>
      )}

      {/* More options modal */}
      {isMoreMenuOpen && (
        <div className="more-modal" onClick={() => setIsMoreMenuOpen(false)}>
          <div className="cart-container" onClick={(e) => e.stopPropagation()}>
            <h4>Options</h4>
            <button className="more-option">
              <i className="fa fa-flag"></i> Report
            </button>
                  {isAdmin && (
             <button className="more-option delete-option" onClick={handleDeleteVideo}>
               <i className="fa fa-trash"></i> Delete Video
             </button>
           )}
            <button className="close-btn" onClick={() => setIsMoreMenuOpen(false)}>
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
