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

      // On ferme la modale et on clear le fichier
      setShowModal(false);
      setSelectedFile(null);

      // 1) Appeler le callback pour que le parent rafraîchisse le carrousel
      onUploadSuccess();
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
          <div className="modal-content">
            <h2>Publier une vidéo</h2>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
            />
            <button onClick={handleUpload}>Upload</button>
            <button onClick={() => setShowModal(false)}>Annuler</button>
          </div>
        </div>
      )}
    </>
  );
};

export default PublishButton;
