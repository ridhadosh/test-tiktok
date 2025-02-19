import React from 'react';
import './PublishButton.css';

const PublishButton: React.FC = () => {
  const handlePublish = () => {
    // Logique pour publier une vidéo (ou ouvre une modale)
    console.log('Publish button clicked');
  };

  return (
    <button className="publish-button" onClick={handlePublish}>
      Publier
    </button>
  );
};

export default PublishButton;
