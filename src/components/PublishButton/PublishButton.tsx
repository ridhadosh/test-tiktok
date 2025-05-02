// src/components/PublishButton/PublishButton.tsx
import React, { useState, useEffect } from 'react';
import './PublishButton.css';

interface Group {
  id: number;
  name: string;
  slug: string;
}

interface PublishButtonProps {
  onUploadSuccess: () => void;
}

const PublishButton: React.FC<PublishButtonProps> = ({ onUploadSuccess }) => {
  // ─── Tous les hooks déclarés en haut ───────────────────────────────────
  const [isAdmin, setIsAdmin] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ticketLink, setTicketLink] = useState('');

  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  const canUpload = !!selectedFile && !!selectedGroup && ticketLink.trim().length > 0;

  // ─── Effet : quiami-alt pour récupérer roles ─────────────────────────
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

  // ─── Effet : nettoyage de l’URL preview ───────────────────────────────
  useEffect(() => {
    return () => {
      if (previewURL) URL.revokeObjectURL(previewURL);
    };
  }, [previewURL]);

  // ─── Effet : récupération des groupes ────────────────────────────────
  useEffect(() => {
    fetch('https://exhib1t.com/wp-json/tiktok/v1/groups', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(data => setGroups(data))
      .catch(err => console.error('Erreur fetch groups:', err));
  }, []);

  // ─── Handlers ────────────────────────────────────────────────────────
  const handlePublish = () => setShowModal(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    if (previewURL) URL.revokeObjectURL(previewURL);
    setPreviewURL(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return alert('Veuillez sélectionner une vidéo !');
    if (!selectedGroup) return alert('Veuillez sélectionner un groupe !');
    if (!ticketLink) return alert('Veuillez entrer un lien de billet !');
  
    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('ticketLink', ticketLink);
    formData.append('groupId', selectedGroup);
  
    try {
      const response = await fetch(
        'https://exhib1t.com/wp-json/tiktok/v1/upload',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'X-WP-Nonce': window.tiktokRest.nonce,
          },
          body: formData,
        }
      );
      if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
      await response.json();
  
      setShowModal(false);
      setSelectedFile(null);
      setPreviewURL(null);
      setTitle('');
      setDescription('');
      setTicketLink('');
      setSelectedGroup('');
      onUploadSuccess();
      window.location.reload();
    } catch (err) {
      console.error('Erreur upload:', err);
      alert('Erreur lors de l’upload !');
    }
  };
  

  // ─── Si pas admin, on renvoie juste null ──────────────────────────────
  if (!isAdmin) {
    return null;
  }

  // ─── JSX ─────────────────────────────────────────────────────────────
  return (
    <>
      <button className="publish-button" onClick={handlePublish}>
        Ajouter Vidéo
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Ajouter Une Vidéo</h2>

            {/* Sélection de fichier */}
            <div className="file-input-wrapper">
              <label htmlFor="videoFile" className="choose-file-btn">
                Choisir un fichier
              </label>
              <input
                id="videoFile"
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {selectedFile && <span className="file-name">{selectedFile.name}</span>}
            </div>

            {/* Aperçu */}
            {previewURL && (
              <video src={previewURL} controls className="preview-video" width="100%" />
            )}

            {/* Titre */}
            <div className="title-wrapper">
              <label htmlFor="videoTitle">Titre :</label>
              <textarea
                id="videoTitle"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Entrez le titre"
                className="video-title-input"
              />
            </div>

            {/* Description */}
            <div className="description-wrapper">
              <label htmlFor="videoDescription">Description :</label>
              <textarea
                id="videoDescription"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ajoutez une description (facultatif)"
              />
            </div>

            {/* Lien billet */}
            <div className="ticket-link-wrapper">
              <label htmlFor="ticketLink">Lien billet :</label>
              <input
                id="ticketLink"
                type="text"
                value={ticketLink}
                onChange={e => setTicketLink(e.target.value)}
                placeholder="Lien (facultatif)"
                className="ticket-link-input"
              />
            </div>

            {/* Sélection du groupe */}
            <div className="group-selector-wrapper">
              <label htmlFor="groupSelect">Groupe :</label>
              <select
                id="groupSelect"
                value={selectedGroup}
                onChange={e => setSelectedGroup(e.target.value)}
              >
                <option value="">Choisissez un groupe</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Boutons Annuler / Upload */}
            <div className="button-row">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>
                Annuler
              </button>
              <button className="upload-btn" onClick={handleUpload}>
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PublishButton;
