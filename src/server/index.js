/**
 * index.js (Node) – exemple simplifié
 * N.B. : On a supprimé la logique d’upload,
 *        puisque vous utilisez maintenant l’endpoint WP (/wp-json/tiktok/v1/upload)
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2');

const app = express();
app.use(cors({
  origin: 'https://exhib1t.com/final-version-carrousel/',  
  credentials: true                // Allow cookies/credentials
}));
app.use(express.json());

// Connexion MySQL (vers la base WordPress)
const db = mysql.createPool({
  host: 'localhost',
  user: 'focusonr_exhib1tUser',
  password: 'iK+B-dewPdJX',
  database: 'focusonr_exhib1t'
});

/**
 * 1) /videos : lit la table wp_videos
 
app.get('/videos', (req, res) => {
  const sql = 'SELECT * FROM wp_videos';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('MySQL error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    // results est un tableau d’objets { id, src, description }
    res.json(results);
  });
});
*/

//this one includes the ticket (I commented yours)
app.get('/videos', (req, res) => {
  const sql = 'SELECT id, src, description, ticket_link FROM wp_videos'; // Ajout de ticket_link
  db.query(sql, (err, results) => {
    if (err) {
      console.error('MySQL error:', err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json(results);
  });
});



/**
 * 2) Gérer les commentaires (si vous voulez les garder côté Node)
 *
 * Exemples : GET /comments/:videoId, POST /comments/:videoId
 * (À adapter à votre usage)
 */

// Simplicité : on charge/stocke en JSON local. À vous de voir si vous
// préférez stocker en MySQL, etc.
const commentsFilePath = path.join(__dirname, 'comments.json');

function loadComments() {
  if (fs.existsSync(commentsFilePath)) {
    try {
      const data = fs.readFileSync(commentsFilePath, 'utf8');
      return JSON.parse(data);
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

// Charger en mémoire
let comments = loadComments();

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

  if (!comments[videoId]) {
    comments[videoId] = [];
  }

  const newComment = {
    id: Date.now(),
    user: user || 'Anonymous',
    text,
    timestamp: new Date().toISOString(),
  };

  comments[videoId].push(newComment);
  saveComments(comments);

  res.json(newComment);
});

/**
 * 3) Plus de route /upload ici, car c’est WP qui gère l’upload
 *    => On commente ou on supprime la logique
 */

// // app.post('/upload', ...) => Supprimé ou commenté

/**
 * 4) Start server
 */
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Back-end running on http://localhost:${PORT}`);
});
