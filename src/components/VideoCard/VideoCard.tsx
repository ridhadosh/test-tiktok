import React, { useRef, useState, useEffect } from 'react';
import './VideoCard.css';
import defaultProfile from '../assets/default-avatar.png';
import { VideoData } from '../../types';

// Variable globale pour désactiver les commentaires sur toutes les vidéos
let globalCommentsDisabled = false;

interface VideoCardProps {
  video: VideoData; // video: { id, src, description?, etc. }
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // État de lecture de la vidéo
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControlIcon, setShowControlIcon] = useState<'play' | 'pause' | null>(null);

  // Compteurs
  const [likes, setLikes] = useState(0);
  const [shares, setShares] = useState(0);
  const [cartAdds, setCartAdds] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // Commentaires
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentsCount, setCommentsCount] = useState(0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [manualOverride, setManualOverride] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);


  const handleCartClick = () => {
    setIsCartModalOpen(true);
  };
  

  // État pour la fenêtre de partage
  const [isShareOpen, setIsShareOpen] = useState(false);
  const shareLink = `http://localhost:3001/uploads/${video.id}`;
  const shareOptions = [
    { name: 'Repost',         icon: 'fa fa-retweet',      link: '#' },
    { name: 'Send to friends',icon: 'fa fa-paper-plane',  link: '#' },
    { name: 'Embed',          icon: 'fa fa-code',         link: '#' },
    { name: 'WhatsApp',       icon: 'fa fa-whatsapp',     link: 'https://web.whatsapp.com' },
    { name: 'Facebook',       icon: 'fa fa-facebook',     link: 'https://facebook.com' },
    { name: 'X',              icon: 'fa fa-twitter',      link: 'https://twitter.com' },
    { name: 'Telegram',       icon: 'fa fa-telegram',     link: 'https://telegram.org' },
    { name: 'LinkedIn',       icon: 'fa fa-linkedin',     link: 'https://linkedin.com' },
    { name: 'Reddit',         icon: 'fa fa-reddit',       link: 'https://reddit.com' },
    { name: 'Pinterest',      icon: 'fa fa-pinterest',    link: 'https://pinterest.com' },
  ];

  // Favoris
  const [isFavorited, setIsFavorited] = useState(false);

  /* ------------------------------------------------------------------
     1) Charger les commentaires pour cette vidéo
  ------------------------------------------------------------------ */
  const fetchComments = async () => {
    try {
      const res = await fetch(`http://localhost:3001/comments/${video.id}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setCommentsList(data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ------------------------------------------------------------------
     2) Mettre à jour le nombre de commentaires quand la liste change
  ------------------------------------------------------------------ */
  useEffect(() => {
    setCommentsCount(commentsList.length);
  }, [commentsList]);

  /* ------------------------------------------------------------------
     3) Intersection Observer pour auto‐ouvrir/fermer la sidebar
  ------------------------------------------------------------------ */
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!globalCommentsDisabled && !manualOverride && !isCommentOpen) {
          setIsCommentOpen(true);
          fetchComments();
        }
      } else {
        setIsCommentOpen(false);
        setManualOverride(false);
      }
    }, { threshold: 0.7 });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      if (containerRef.current) observer.unobserve(containerRef.current);
    };
  }, [manualOverride, isCommentOpen, video.id]);

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
    // Mettre en pause les autres vidéos
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((vid) => {
      if (vid !== videoRef.current) vid.pause();
    });

    // Lecture/pause
    if (isPlaying) {
      videoRef.current.pause();
      setShowControlIcon('pause');
    } else {
      videoRef.current.play();
      setShowControlIcon('play');
    }
    setIsPlaying(!isPlaying);

    // Icône disparaît après 700ms
    setTimeout(() => setShowControlIcon(null), 700);
  };

  /* ------------------------------------------------------------------
     6) Like/Unlike
  ------------------------------------------------------------------ */
  const toggleLike = () => {
    setIsLiked((prev) => {
      const newState = !prev;
      setLikes((l) => (newState ? l + 0.5 : l - 0.5));
      return newState;
    });
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
      const res = await fetch(`http://localhost:3001/comments/${video.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: 'Anonymous', text: commentText }),
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
    setShares((prev) => prev + 1); // 🔥 Incrémente uniquement après copie
  };
  
  const handleClickSocial = (url: string) => {
    window.open(url, '_blank');
    setShares((prev) => prev + 1); // 🔥 Incrémente uniquement après un vrai clic
  };


  // --------------------------------------------
  // -- FAVORIS --
  // --------------------------------------------

  // Au montage, vérifier si cette vidéo est déjà dans les favoris (stockés en localStorage)
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
      // Retirer des favoris
      favIds = favIds.filter((id) => id !== video.id);
      setIsFavorited(false);
    } else {
      // Ajouter
      favIds.push(video.id);
      setIsFavorited(true);
    }
    localStorage.setItem('favorites', JSON.stringify(favIds));
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

        {/* Icône Play/Pause au centre */}
        {showControlIcon && (
          <div className="video-status-icon">
            {showControlIcon === 'play'
              ? <i className="fa fa-play" />
              : <i className="fa fa-pause" />
            }
          </div>
        )}

        {/* Les icônes (Profil, Like, Comment, Share, Cart, Fav) */}
        <div className="video-card__actions">
          {/* Profil */}
          <div className="action-container profile-container" onClick={() => setIsProfileModalOpen(true)}>
          <img
            src={defaultProfile}
            alt="Profil"
            className="profile-icon"
          />
        </div>
          <div className="action-container" onClick={toggleLike}>
            <i className={`fa fa-heart action-btn ${isLiked ? 'liked' : ''}`}></i>
            <span className="counter">{likes}</span>
          </div>

          {/* Comment */}
          <div className="action-container" onClick={toggleComments}>
            <i className="fa fa-comment action-btn"></i>
            <span className="counter">{commentsCount}</span>
          </div>

          {/* Share */}
          <div className="action-container" onClick={toggleShareModal}>
            <i className="fa fa-share action-btn"></i>
            <span className="counter">{shares}</span>
          </div>

            <div className="action-container" onClick={handleCartClick}>
            <i className="fa fa-shopping-cart action-btn"></i>
            <span className="counter">{cartAdds}</span>
          </div>

          {/* Favoris */}
          <div className="action-container" onClick={toggleFavorite}>
            <i className={`fa fa-star action-btn ${isFavorited ? 'liked' : ''}`}></i>
            <span className="counter">Fav</span>
          </div>
        </div>

         {/* Description overlay */}
        {video.description && (
          <div className="video-description-overlay">
            {video.description}
          </div>
        )}
      </div>

        {/* ------------------- MODALE DU PROFIL ------------------- */}
      {isProfileModalOpen && (
        <div className="cart-modal" onClick={() => setIsProfileModalOpen(false)}>
          <div className="cart-container" onClick={(e) => e.stopPropagation()}>
            <h2>👤 Profil Utilisateur</h2>
            <p>Ici il faut ouvrir le profile d'utilisateur</p>
            <button className="close-btn" onClick={() => setIsProfileModalOpen(false)}>✕</button>
          </div>
        </div>
      )}


      {/* ------------------- SIDEBAR DE COMMENTAIRES ------------------- */}
      {isCommentOpen && (
        <div className="comment-modal" onClick={() => setIsCommentOpen(false)}>
          <div className="comment-container" onClick={(e) => e.stopPropagation()}>
            <div className="comment-header">
              <h2>Comments</h2>
              <button className="close-btn" onClick={handleCloseComments}>✕</button>
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

      {/* Modale de partage */}
      {isShareOpen && (
        <div className="share-modal" onClick={() => setIsShareOpen(false)}>
          <div className="share-container" onClick={(e) => e.stopPropagation()}>
            <h2>Share to</h2>
            <div className="share-link-container">
              <input
                type="text"
                readOnly
                value={shareLink}
                className="share-link"
              />
              <button className="copy-btn" onClick={handleCopyLink}>Copy</button>
            </div>
            <div className="share-options-grid">
              {shareOptions.map((option) => (
                <div
                  key={option.name}
                  className="share-option"
                  onClick={() => handleClickSocial(option.link)}
                >
                  <i className={option.icon}></i>
                  <span>{option.name}</span>
                </div>
              ))}
            </div>
            <button className="close-btn" onClick={() => setIsShareOpen(false)}>
              ✕
            </button>
          </div>
        </div>
      )}
          {/* ------------------- MODALE DU PANIER ------------------- */}
    {isCartModalOpen && (
      <div className="cart-modal" onClick={() => setIsCartModalOpen(false)}>
        <div className="cart-container" onClick={(e) => e.stopPropagation()}>
          <h2>🎟 Ajouter au panier</h2>
          <p>Ici il faut mettre la route vers le billet</p>
          <button className="close-btn" onClick={() => setIsCartModalOpen(false)}>✕</button>
        </div>
      </div>
    )}
    </div>
  );
};

export default VideoCard;
