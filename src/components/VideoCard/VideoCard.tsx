import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './VideoCard.css';
import defaultProfile from '../assets/default-avatar.png';
import { VideoData } from '../../types';

// pour désactiver globalement les commentaires
let globalCommentsDisabled = false;

interface VideoCardProps {
  video: VideoData & { userLiked: boolean };
  isAdmin: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, isAdmin }) => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ─── Lecture / pause ───────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControlIcon, setShowControlIcon] = useState<'play' | 'pause' | null>(null);

  // ─── Like / partages ────────────────────────────────────────────────
  const [likes, setLikes] = useState(video.likes || 0);
  const [isLiked, setIsLiked] = useState(video.userLiked);
  const [loadingLike, setLoadingLike] = useState(false);
  const [shares, setShares] = useState(0);

  // ─── Commentaires ─────────────────────────────────────────────────
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsCount, setCommentsCount] = useState(0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);

  // ─── Billetterie ──────────────────────────────────────────────────
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  // ─── More menu ────────────────────────────────────────────────────
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // ─── Partage ──────────────────────────────────────────────────────
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

  // ─── Favoris ───────────────────────────────────────────────────────
  const [isFavorited, setIsFavorited] = useState(false);

  /* ------------------------------------------------------------------
     1) Charger les commentaires pour cette vidéo
  ------------------------------------------------------------------ */
  const fetchComments = async () => {
    if (globalCommentsDisabled) return;
    setLoadingComments(true);
    try {
      const res = await fetch(
        `https://exhib1t.com/wp-json/tiktok/v1/comments/${video.id}`
      );
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setCommentsList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComments(false);
    }
  };

  /* ------------------------------------------------------------------
     2) Mettre à jour le nombre de commentaires quand la liste change
  ------------------------------------------------------------------ */
  useEffect(() => {
    setCommentsCount(commentsList.length);
  }, [commentsList]);

  /* ------------------------------------------------------------------
     3) Intersection Observer pour auto‐play/pause
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!videoRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
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
    observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  /* ------------------------------------------------------------------
     4) Format vidéo (vertical/horizontal)
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!videoRef.current) return;
    const videoEl = videoRef.current;
    const onMeta = () => {
      const { videoWidth, videoHeight } = videoEl;
      if (videoHeight > videoWidth) {
        videoEl.classList.add('vertical-video');
        videoEl.classList.remove('horizontal-video');
      } else {
        videoEl.classList.add('horizontal-video');
        videoEl.classList.remove('vertical-video');
      }
    };
    videoEl.addEventListener('loadedmetadata', onMeta);
    return () => videoEl.removeEventListener('loadedmetadata', onMeta);
  }, []);

  /* ------------------------------------------------------------------
     5) Lecture/pause au clic
  ------------------------------------------------------------------ */
  const handleVideoPress = () => {
    if (!videoRef.current) return;
    document.querySelectorAll('video').forEach(v => {
      if (v !== videoRef.current) v.pause();
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
     6) Like / Unlike
  ------------------------------------------------------------------ */
  const toggleLike = async () => {
    if (isLiked) return;
    setLoadingLike(true);
    try {
      const res = await fetch('https://exhib1t.com/wp-json/tiktok/v1/like', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id }),
      });
      if (!res.ok) throw new Error('Failed to update like');
      const data = await res.json();
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
    setIsCommentOpen(prev => {
      const next = !prev;
      setManualOverride(true);
      if (next) fetchComments();
      return next;
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
      const res = await fetch(
        `https://exhib1t.com/wp-json/tiktok/v1/comments/${video.id}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: commentText }),
        }
      );
      if (!res.ok) throw new Error('Failed to post comment');
      const newC = await res.json();
      setCommentsList(prev => [...prev, newC]);
      setCommentText('');
    } catch (err) {
      console.error(err);
    }
  };

  /* ------------------------------------------------------------------
     Suppression de la vidéo (admin only)
  ------------------------------------------------------------------ */
  const handleDeleteVideo = async () => {
    if (!window.confirm('Supprimer définitivement cette vidéo ?')) return;
    try {
      const res = await fetch(
        `https://exhib1t.com/wp-json/tiktok/v1/videos/${video.id}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );
      if (!res.ok) throw new Error(await res.text());
      alert('Vidéo supprimée');
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Échec de la suppression');
    }
  };

  /* ------------------------------------------------------------------
     Billetterie et Favoris
  ------------------------------------------------------------------ */
  const handleCartClick = () => {
    if (video.ticketLink) window.open(video.ticketLink, '_blank');
    else setIsCartModalOpen(true);
  };

  useEffect(() => {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]') as number[];
    setIsFavorited(favs.includes(video.id));
  }, [video.id]);

  const toggleFavorite = () => {
    let favs = JSON.parse(localStorage.getItem('favorites') || '[]') as number[];
    if (favs.includes(video.id)) {
      favs = favs.filter(id => id !== video.id);
      setIsFavorited(false);
    } else {
      favs.push(video.id);
      setIsFavorited(true);
    }
    localStorage.setItem('favorites', JSON.stringify(favs));
  };

  const toggleShareModal = () => setIsShareOpen(open => !open);
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Lien copié !');
    setShares(s => s + 1);
  };
  const handleClickSocial = (url: string) => {
    window.open(url, '_blank');
    setShares(s => s + 1);
  };

  return (
    <div ref={containerRef} className="video-card">
      <div className="video-wrapper">
        {/* Nav Flux / Favoris */}
        <div className="video-card__nav">
          <Link to="/" className={`tab ${location.pathname === '/' ? 'tab--active' : ''}`} onClick={e => e.stopPropagation()}>
            Flux
          </Link>
          <Link to="/favorites" className={`tab ${location.pathname === '/favorites' ? 'tab--active' : ''}`} onClick={e => e.stopPropagation()}>
            Favoris
          </Link>
        </div>

        {/* Vidéo */}
        <video
          ref={videoRef}
          src={video.src}
          className="video-card__player"
          loop
          muted
          playsInline
          controls={false}
          onClick={handleVideoPress}
        />
        {showControlIcon && (
          <div className="video-status-icon">
            {showControlIcon === 'play' ? <i className="fa fa-play" /> : <i className="fa fa-pause" />}
          </div>
        )}

        {/* Icônes d'actions (Groupe, Like, Comment, Share, Cart, Fav, More) */}
        <div className="video-card__actions">
          <div className={`action-container profile-container ${video.group_slug ? 'clickable' : ''}`} onClick={e => {
              e.stopPropagation();
              if (video.group_slug) window.open(`https://exhib1t.com/groups/${video.group_slug}`, '_blank');
            }}>
            <img src={video.group_avatar_url || defaultProfile} alt="Groupe" className="profile-icon" />
          </div>
          <div className="action-container" onClick={toggleLike}>
            {loadingLike
              ? <i className="fa fa-spinner fa-spin action-btn"></i>
              : <i className={`fa fa-heart action-btn ${isLiked ? 'liked' : ''}`}></i>
            }
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
          <div className="action-container" onClick={() => setIsMoreMenuOpen(o => !o)}>
            <i className="fa fa-ellipsis-h action-btn"></i>
            <span className="counter">More</span>
          </div>
        </div>

        {/* Titre / description */}
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

      {isMoreMenuOpen && (
        <div className="more-modal" onClick={() => setIsMoreMenuOpen(false)}>
          <div className="cart-container" onClick={e => e.stopPropagation()}>
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
