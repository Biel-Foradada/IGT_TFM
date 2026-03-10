// Simple node js server to run on background to save the files once the IGT task has been finished by the user
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();


app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS']
}));
app.use(express.json({ limit: '50mb' }));

const RESULTS_DIR = '/app/results';
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

app.post('/save', (req, res) => {
  const { filename, content } = req.body;
  const filePath = path.join(RESULTS_DIR, filename);
  
  fs.writeFile(filePath, JSON.stringify(content, null, 2), (err) => {
    if (err) return res.status(500).send('Error saving file');
    res.send('File saved successfully');
  });
});

app.listen(3000, '0.0.0.0', () => console.log('Save-API running on port 3000'));