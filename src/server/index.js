const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// Tableau en mémoire pour stocker les vidéos (id, src, etc.)
// (En vrai, on utiliserait une base de données)
const videos = [];

// Crée le dossier "uploads" s'il n'existe pas
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configurer Multer pour gérer l'upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // ex: 1676929390000.mp4
  },
});

// Filtrer pour accepter seulement des vidéos
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'video/mp4' ||
    file.mimetype === 'video/ogg' ||
    file.mimetype === 'video/webm' ||
    file.mimetype === 'video/quicktime'
  ) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed!'), false);
  }
};

const upload = multer({ storage, fileFilter });

// 1) Endpoint pour uploader
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
  }

  // Créer un nouvel objet "vidéo"
  const newVideo = {
    id: Date.now(),
    src: `http://localhost:3001/uploads/${req.file.filename}`,
  };

  // On l'ajoute au tableau en mémoire
  videos.push(newVideo);

  // On renvoie la vidéo nouvellement ajoutée
  return res.json({
    message: 'File uploaded successfully',
    video: newVideo,
  });
});

// 2) Servir le dossier "uploads" statiquement (pour lire les vidéos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 3) Endpoint pour récupérer la liste des vidéos
app.get('/videos', (req, res) => {
  // On renvoie simplement le tableau
  res.json(videos);
});

// Démarrer le serveur sur le port 3001
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Back-end running on http://localhost:${PORT}`);
});
