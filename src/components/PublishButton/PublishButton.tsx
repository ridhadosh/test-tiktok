import React, { useState, useEffect } from 'react';
import './PublishButton.css';

interface PublishButtonProps {
  onUploadSuccess: () => void;
}

const PublishButton: React.FC<PublishButtonProps> = ({ onUploadSuccess }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  // Clean up the object URL whenever previewURL changes or on unmount
  useEffect(() => {
    return () => {
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
      }
    };
  }, [previewURL]);

  const handlePublish = () => {
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      // Revoke the old preview URL if it exists, then create a new one
      if (previewURL) {
        URL.revokeObjectURL(previewURL);
      }
      setPreviewURL(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a video file first!');
      return;
    }

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('description', description);

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      console.log('Upload success:', data);

      setShowModal(false);
      setSelectedFile(null);
      setPreviewURL(null);
      setDescription('');

      onUploadSuccess();
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

            {/* File input */}
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
              {selectedFile && (
                <span className="file-name">{selectedFile.name}</span>
              )}
            </div>

            {/* Video preview */}
            {previewURL && (
              <video
                src={previewURL}
                className="preview-video"
                controls
                width="100%"
                style={{ marginTop: '1rem' }}
              />
            )}

            {/* Description input */}
            <div className="description-wrapper" style={{ marginTop: '1rem' }}>
              <label htmlFor="videoDescription">Description (facultatif):</label>
              <textarea
                id="videoDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ajoutez une description à votre vidéo"
              />
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
