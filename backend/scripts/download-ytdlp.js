const fs = require('fs');
const path = require('path');
const axios = require('axios');

const binDir = path.join(__dirname, '..', 'bin');
if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

async function downloadYtdlp() {
  let downloadUrl;
  let filename;

  if (process.platform === 'win32') {
    downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
    filename = 'yt-dlp.exe';
  } else if (process.platform === 'darwin') {
    downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
    filename = 'yt-dlp';
  } else {
    downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
    filename = 'yt-dlp';
  }

  const targetPath = path.join(binDir, filename);
  console.log(`🚀 Starting download of yt-dlp to: ${targetPath}`);

  try {
    const response = await axios({
      method: 'GET',
      url: downloadUrl,
      responseType: 'stream',
      maxRedirects: 5,
      timeout: 300000 // 5 minutes
    });

    const writer = fs.createWriteStream(targetPath);
    
    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      
      let error = null;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      
      writer.on('finish', () => {
        if (!error) {
          if (process.platform !== 'win32') {
            fs.chmodSync(targetPath, '755');
          }
          console.log(`✅ Successfully downloaded yt-dlp! (${fs.statSync(targetPath).size} bytes)`);
          resolve();
        }
      });
    });
  } catch (err) {
    console.error(`❌ Download failed: ${err.message}`);
    if (fs.existsSync(targetPath)) fs.unlinkSync(targetPath);
    process.exit(1);
  }
}

downloadYtdlp();
