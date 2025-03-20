const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

const mysql = require('mysql2');

const db = mysql.createPool({
  host: 'localhost',         // ou l’adresse de ton serveur MySQL
  user: 'focusonr_exhib1tUser',    // identifiant MySQL
  password: 'iK+B-dewPdJX', // mot de passe MySQL
  database: 'focusonr_exhib1t'      // nom de la base WP
});

/* 1) Middlewares */
app.use(cors());
// Needed to parse JSON bodies (for POST comments)
app.use(express.json());

/* 2) Paths to our JSON files */
const videosFilePath = path.join(__dirname, 'videos.json');
const commentsFilePath = path.join(__dirname, 'comments.json');

/* 3) Helper functions to load/save videos */
function loadVideos() {
  if (fs.existsSync(videosFilePath)) {
    try {
      const data = fs.readFileSync(videosFilePath, 'utf8');
      return JSON.parse(data); // returns the array of videos
    } catch (err) {
      console.error('Error reading videos.json:', err);
      return [];
    }
  } else {
    return [];
  }
}

function saveVideos(videos) {
  try {
    fs.writeFileSync(videosFilePath, JSON.stringify(videos, null, 2));
  } catch (err) {
    console.error('Error writing videos.json:', err);
  }
}

/* 4) Helper functions to load/save comments */
function loadComments() {
  if (fs.existsSync(commentsFilePath)) {
    try {
      const data = fs.readFileSync(commentsFilePath, 'utf8');
      return JSON.parse(data); // returns an object keyed by videoId
    } catch (err) {
      console.error('Error reading comments.json:', err);
      return {};
    }
  } else {
    return {};
  }
}

function saveComments(comments) {
  try {
    fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2));
  } catch (err) {
    console.error('Error writing comments.json:', err);
  }
}

/* 5) Load initial data into memory */
let videos = loadVideos();
let comments = loadComments();

/* 6) Set up Multer for video uploads */
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

/* 7) Route for uploading a video */
// app.post('/upload', upload.single('video'), (req, res) => {
//   if (!req.file) {
//     return res
//       .status(400)
//       .json({ error: 'No file uploaded or invalid file type.' });
//   }

//   const { description } = req.body;

//   // Create a new video object
//   const newVideo = {
//     id: Date.now(),
//     src: `http://localhost:3001/uploads/${req.file.filename}`,
//     description: description || '',
//   };

//   // Add it to the videos array
//   videos.push(newVideo);

//   // Save to JSON
//   saveVideos(videos);

//   return res.json({
//     message: 'File uploaded successfully',
//     video: newVideo,
//   });
// });


app.post('/upload', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const { description } = req.body;
  const src = `https://ton-domaine.com/uploads/${req.file.filename}`;

  const sql = 'INSERT INTO wp_videos (src, description) VALUES (?, ?)';
  db.query(sql, [src, description || ''], (err, result) => {
    if (err) {
      console.error('MySQL insert error:', err);
      return res.status(500).json({ error: 'DB insert failed' });
    }
    const newVideo = {
      id: result.insertId,
      src,
      description: description || '',
    };
    res.json({ message: 'File uploaded', video: newVideo });
  });
});


/* 8) Serve the "uploads" folder */
app.use('/uploads', express.static(uploadDir));

app.get('/videos', (req, res) => {
  res.json(videos);
});

/* 10) Routes for comments */

// GET comments for a specific video
app.get('/comments/:videoId', (req, res) => {
  const { videoId } = req.params;
  // Return array of comments for this video ID or empty array if none
  const videoComments = comments[videoId] || [];
  res.json(videoComments);
});

// POST a new comment for a specific video
app.post('/comments/:videoId', (req, res) => {
  const { videoId } = req.params;
  const { user, text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Comment text is required.' });
  }

  // If no array for this video, create it
  if (!comments[videoId]) {
    comments[videoId] = [];
  }

  const newComment = {
    id: Date.now(),           // Unique-ish ID
    user: user || 'Anonymous',
    text,
    timestamp: new Date().toISOString(),
  };

  // Push the new comment to the array
  comments[videoId].push(newComment);

  // Save to JSON
  saveComments(comments);

  res.json(newComment);
});

/* 11) Start the server */
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Back-end running on http://localhost:${PORT}`);
});
