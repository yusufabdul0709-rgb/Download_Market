const fs = require('fs');
const path = require('path');
const https = require('https');

const binDir = path.join(__dirname, '..', 'bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

// OS-specific yt-dlp binary link
let downloadUrl;
let filename;

if (process.platform === 'win32') {
  downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
  filename = 'yt-dlp.exe';
} else if (process.platform === 'darwin') {
  downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
  filename = 'yt-dlp';
} else {
  // Linux
  downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
  filename = 'yt-dlp';
}

const targetPath = path.join(binDir, filename);

console.log(`Downloading latest yt-dlp from GitHub...`);

const file = fs.createWriteStream(targetPath);

https.get(downloadUrl, (response) => {
  // Handle redirects
  if (response.statusCode === 301 || response.statusCode === 302) {
    https.get(response.headers.location, (res2) => {
      res2.pipe(file);
      file.on('finish', () => {
        file.close();
        if (process.platform !== 'win32') {
           fs.chmodSync(targetPath, '755');
        }
        console.log(`Successfully downloaded yt-dlp to ${targetPath}`);
      });
    });
  } else {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      if (process.platform !== 'win32') {
         fs.chmodSync(targetPath, '755');
      }
      console.log(`Successfully downloaded yt-dlp to ${targetPath}`);
    });
  }
}).on('error', (err) => {
  fs.unlink(targetPath, () => {});
  console.error(`Failed to download yt-dlp: ${err.message}`);
});
