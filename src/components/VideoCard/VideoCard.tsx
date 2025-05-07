import React, { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './VideoCard.css';
import defaultProfile from '../assets/default-avatar.png';
import { VideoData } from '../../types';

// pour désactiver globalement les commentaires
let globalCommentsDisabled = false;

interface VideoCardProps {
  video: VideoData;
  isAdmin?: boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, isAdmin }) => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // ─── Lecture / pause ───────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControlIcon, setShowControlIcon] = useState<'play' | 'pause' | null>(null);

  // ─── Like / partages ────────────────────────────────────────────────
  const [isLiked, setIsLiked] = useState(video.userLiked);
  const [likes , setLikes ] = useState(video.likes);  
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
    {
      name: 'WhatsApp',
      icon: 'fa fa-whatsapp',
      link: `https://api.whatsapp.com/send?text=${shareLink}`,
    },
    {
      name: 'Facebook',
      icon: 'fa fa-facebook',
      link: `https://www.facebook.com/sharer/sharer.php?u=${shareLink}`,
    },
    {
      name: 'X',
      icon: 'fa fa-twitter',
      link: `https://twitter.com/intent/tweet?url=${shareLink}`,
    },
    {
      name: 'Telegram',
      icon: 'fa fa-telegram',
      link: `https://t.me/share/url?url=${shareLink}`,
    },
    {
      name: 'LinkedIn',
      icon: 'fa fa-linkedin',
      link: `https://www.linkedin.com/sharing/share-offsite/?url=${shareLink}`,
    },
    {
      name: 'Reddit',
      icon: 'fa fa-reddit',
      link: `https://www.reddit.com/submit?url=${shareLink}`,
    },
    {
      name: 'Pinterest',
      icon: 'fa fa-pinterest',
      link: `https://pinterest.com/pin/create/button/?url=${shareLink}`,
    },
  ];

  // formatage relatif/absolu du timestamp
  const formatTimestamp = (ts: string) => {
    const then = new Date(ts).getTime();
    const now = Date.now();
    const diffMs = now - then;
    const diffH = diffMs / 3600000;
    if (diffMs < 1000 * 60 * 60) {
      const mins = Math.floor(diffMs / (1000 * 60));
      return `${mins}m`;
    }
    if (diffH < 24) {
      const h = Math.floor(diffH);
      return `${h}h`;
    }
    const diffD = diffH / 24;
    if (diffD < 7) {
      const d = Math.floor(diffD);
      return `${d}j`;
    }
    return ts.slice(0, 10);
  };
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

          setIsCommentOpen(false);
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
    setLoadingLike(true);
  
    // pick the right route
    const path = isLiked
      ? 'https://exhib1t.com/wp-json/tiktok/v1/unlike'
      : 'https://exhib1t.com/wp-json/tiktok/v1/like';
  
    try {
      const res = await fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-WP-Nonce': window.tiktokRest.nonce,    // ← add this
        },
        body: JSON.stringify({ videoId: video.id }),
      });
  
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
  
      const data = await res.json();
      setLikes(data.likes);
      setIsLiked(data.liked);
    } catch (err) {
      console.error('Failed to update like', err);
      alert('Erreur lors de la mise à jour du like');
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
    setLoadingComments(true);
  
    try {
      const res = await fetch(
        `https://exhib1t.com/wp-json/tiktok/v1/comments/${video.id}`,
        {
          method: 'POST',
          credentials: 'include',                 // send WP cookies
          headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': window.tiktokRest.nonce, // send your nonce
          },
          body: JSON.stringify({ text: commentText }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newC = await res.json();
      setCommentsList(prev => [...prev, newC]);
      setCommentText('');
    } catch (err) {
      console.error('Failed to post comment', err);
      alert("Échec de l'envoi du commentaire");
    } finally {
      setLoadingComments(false);
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
          headers: {
            'X-WP-Nonce': window.tiktokRest.nonce,
          },
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

  const toggleShareModal = () => setIsShareOpen(o => !o);
  const handleClickSocial = (url: string) => {
    window.open(url, '_blank', 'noopener');
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
          loop
          playsInline
          webkit-playsinline="true"
          x5-playsinline="true"
          controls={false}
          onClick={handleVideoPress}
          className="video-card__player"
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
          {isAdmin && (
            <div className="action-container" onClick={handleDeleteVideo}>
              <i className="fa fa-trash action-btn delete-btn"/>
            </div>
          )}
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
              <h2>Commentaire</h2>
              <button className="close-btn" onClick={handleCloseComments}>✕</button>
            </div>
            {loadingComments ? (
              <div className="loading">Chargement des commentaires...</div>
            ) : (
              <div className="comment-list">
                {commentsList.length === 0 ? (
                  <p>🚀 Aucun commentaire pour le moment. Soyez le premier!</p>
                ) : (
                  commentsList.map((comment) => (
                    <div key={comment.id} className="comment-item">
                      <div className="comment-header-row">
                        <strong>{comment.user}</strong>
                        <span className="comment-time">{formatTimestamp(comment.timestamp)}</span>
                      </div>
                      <p>{comment.text}</p>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className="comment-input">
              <input
                type="text"
                placeholder="Laisser un commentaire..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button onClick={handleSendComment}>Envoyé</button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {isShareOpen && (
        <div className="share-modal" onClick={() => setIsShareOpen(false)}>
          <div className="share-container" onClick={e => e.stopPropagation()}>
            <h2>Partager la vidéo</h2>
            {/* --- Aperçu (mini‐carrousel) --- */}
            <div className="share-carousel">
              <video
                src={video.src}
                controls
                className="share-video-preview"
              />
            </div>
            {/* --- Options de partage --- */}
            <div className="share-options-grid">
              {shareOptions.map(opt => (
                <div
                  key={opt.name}
                  className="share-option"
                  onClick={() => handleClickSocial(opt.link)}
                >
                  <i className={opt.icon}></i>
                  <span>{opt.name}</span>
                </div>
              ))}
            </div>
            <button className="close-btn" onClick={() => setIsShareOpen(false)}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCard;
