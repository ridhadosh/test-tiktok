import React, { useState } from 'react';
import './PublishButton.css';

interface PublishButtonProps {
  onUploadSuccess: () => void; // callback à appeler après succès
}

const PublishButton: React.FC<PublishButtonProps> = ({ onUploadSuccess }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handlePublish = () => {
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a video file first!');
      return;
    }
  
    const formData = new FormData();
    formData.append('video', selectedFile);
  
    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');
  
      const data = await response.json();
      console.log('Upload success:', data);
  
      // Fermer la modale et vider le fichier
      setShowModal(false);
      setSelectedFile(null);
  
      // Appeler le callback pour rafraîchir la liste
      onUploadSuccess();
  
      // Recharger la page pour afficher la nouvelle vidéo
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Something went wrong during upload!');
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

            {/* Wrapper pour le "Choose File" + nom du fichier */}
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
              {/* Si un fichier est sélectionné, on affiche son nom */}
              {selectedFile && (
                <span className="file-name">{selectedFile.name}</span>
              )}
            </div>

            {/* Boutons Upload et Annuler */}
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
