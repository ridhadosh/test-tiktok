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
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);

  // Champs existants
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ticketLink, setTicketLink] = useState('');

  // Nouveaux états pour la gestion des groupes
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  useEffect(() => {
    return () => {
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  // Récupération des groupes via l'endpoint REST
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await fetch('https://exhib1t.com/wp-json/tiktok/v1/groups');
        if (response.ok) {
          const data = await response.json();
          setGroups(data);
        } else {
          console.error("Erreur lors de la récupération des groupes");
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchGroups();
  }, []);

  const handlePublish = () => {
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
      }
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Veuillez sélectionner une vidéo!');
      return;
    }
    if (!selectedGroup) {
      alert('Veuillez sélectionner un groupe!');
      return;
    }

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('title', title);
    formData.append('description', description);
    formData.append('ticketLink', ticketLink);
    formData.append('groupId', selectedGroup);

    try {
      const response = await fetch('https://exhib1t.com/wp-json/tiktok/v1/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      console.log('Upload success:', data);

      // Réinitialisation et fermeture de la modale
      setShowModal(false);
      setSelectedFile(null);
      setPreviewURL(null);
      setTitle('');
      setDescription('');
      setTicketLink('');
      setSelectedGroup('');

      onUploadSuccess();
      window.location.reload();

    } catch (error) {
      console.error(error);
      alert('Erreur lors de l\'upload!');
    }
  };

  return (
    <>
      <button className="publish-button" onClick={handlePublish}>
        Publier
      </button>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h2>Publier une vidéo</h2>

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

            {/* Preview vidéo */}
            {previewURL && (
              <video
                src={previewURL}
                className="preview-video"
                controls
                width="100%"
                style={{ marginTop: '1rem' }}
              />
            )}

            {/* Titre */}
            <div className="title-wrapper" style={{ marginTop: '1rem' }}>
              <label htmlFor="videoTitle">Titre :</label>
              <textarea
                id="videoTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Entrez le titre de la vidéo"
                className="video-title-input"
              />
            </div>

            {/* Description */}
            <div className="description-wrapper" style={{ marginTop: '1rem' }}>
              <label htmlFor="videoDescription">Description (facultatif) :</label>
              <textarea
                id="videoDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ajoutez une description à votre vidéo"
              />
            </div>
            
            {/* Lien du billet */}
            <div className="ticket-link-wrapper" style={{ marginTop: '1rem' }}>
              <label htmlFor="ticketLink">Lien du billet (facultatif) :</label>
              <input
                id="ticketLink"
                type="text"
                value={ticketLink}
                onChange={(e) => setTicketLink(e.target.value)}
                placeholder="Ajoutez un lien vers le billet"
                className="ticket-link-input"
              />
            </div>

            {/* Sélection du groupe */}
            <div className="group-selector-wrapper">
              <label htmlFor="groupSelect">Sélectionnez un groupe :</label>
              <select
                id="groupSelect"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
              >
                <option value="">Choisissez un groupe</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>


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
