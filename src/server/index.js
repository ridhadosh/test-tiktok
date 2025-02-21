const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());

// 1) Chemin vers le fichier JSON
const videosFilePath = path.join(__dirname, 'videos.json');

// 2) Fonction pour lire le fichier JSON et charger en mémoire
function loadVideos() {
  if (fs.existsSync(videosFilePath)) {
    try {
      const data = fs.readFileSync(videosFilePath, 'utf8');
      return JSON.parse(data); // renvoie le tableau de vidéos
    } catch (err) {
      console.error('Error reading videos.json:', err);
      return [];
    }
  } else {
    return [];
  }
}

// 3) Fonction pour écrire le tableau de vidéos dans le fichier JSON
function saveVideos(videos) {
  try {
    fs.writeFileSync(videosFilePath, JSON.stringify(videos, null, 2));
  } catch (err) {
    console.error('Error writing videos.json:', err);
  }
}

// 4) On charge en mémoire le tableau de vidéos au démarrage
let videos = loadVideos();

// 5) Prépare Multer pour l’upload
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

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

// 6) Route pour uploader une vidéo
app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded or invalid file type.' });
  }

  // On crée un nouvel objet vidéo
  const newVideo = {
    id: Date.now(),
    src: `http://localhost:3001/uploads/${req.file.filename}`,
  };

  // On l’ajoute au tableau
  videos.push(newVideo);

  // On sauvegarde dans le fichier JSON
  saveVideos(videos);

  return res.json({
    message: 'File uploaded successfully',
    video: newVideo,
  });
});

// 7) Servir le dossier "uploads" pour accéder aux fichiers
app.use('/uploads', express.static(uploadDir));

// 8) Route pour récupérer la liste des vidéos
app.get('/videos', (req, res) => {
  res.json(videos);
});

// 9) Lancement du serveur
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Back-end running on http://localhost:${PORT}`);
});
