import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Case-insensitive file resolver middleware
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }

  // Handle root
  if (req.path === '/' || req.path === '/index.html') {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }

  const decodedPath = decodeURIComponent(req.path);
  const targetPath = path.join(__dirname, decodedPath);

  // Exact file exists
  if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
    return next();
  }

  // Case-insensitive match in the parent directory
  const dir = path.dirname(targetPath);
  const base = path.basename(targetPath).toLowerCase();

  if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
    try {
      const files = fs.readdirSync(dir);
      const matched = files.find(f => f.toLowerCase() === base);
      if (matched) {
        return res.sendFile(path.join(dir, matched));
      }
    } catch (err) {
      // Proceed to next middleware on error
    }
  }

  next();
});

// Serve static assets from project root
app.use(express.static(__dirname));

// Fallback to index.html for any unhandled HTML/page route
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`TikZ Diagram Generator running at http://${HOST}:${PORT}`);
});
