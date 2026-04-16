function buildYtdlpArgs(url, type) {
  const args = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    '--dump-json', // We only want JSON metadata/formats, not downloading the file
    '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    '--extractor-args', 'youtube:player_client=android,web,default',
    '--add-header', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    '--add-header', 'Accept-Language: en-US,en;q=0.5',
    '--referer', 'https://www.youtube.com/',
  ];

  args.push(url);
  return args;
}

function selectFormat(formats, type) {
  if (!formats || formats.length === 0) return [];

  if (type === 'audio') {
    // Select best audio
    const audioFormats = formats.filter(f => f.acodec !== 'none' && f.vcodec === 'none');
    if (audioFormats.length > 0) {
      const bestAudio = audioFormats.sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
      return [{
        url: bestAudio.url,
        quality: 'audio',
        format: bestAudio.ext || 'm4a'
      }];
    }
  }

  // Pre-merged video/audio (progressive) or highest video resolution
  const videoFormats = formats.filter(f => f.vcodec !== 'none' && f.acodec !== 'none');
  
  // Sort descending by height
  videoFormats.sort((a, b) => (b.height || 0) - (a.height || 0));

  const result = [];
  
  // High quality (1080p if available, else best)
  if (videoFormats.length > 0) {
    const best = videoFormats[0];
    result.push({
      url: best.url,
      quality: best.height ? `${best.height}p` : 'best',
      format: best.ext || 'mp4'
    });
    
    // Maybe try to find a 720p version
    const p720 = videoFormats.find(f => f.height === 720);
    if (p720 && p720.format_id !== best.format_id) {
      result.push({
        url: p720.url,
        quality: '720p',
        format: p720.ext || 'mp4'
      });
    }
  } else {
    // Fallback: If no pre-merged formats found, just use the 'best' standalone formats 
    // note: In a direct URL API, you can't easily merge video+audio on the client out of two streams.
    // So we just return the direct URL from 'url' property of the unified root or best video.
  }

  // Fallback for flat videos (like instagram/facebook)
  if (result.length === 0) {
     const fallback = formats[0];
     if (fallback.url) {
       result.push({
         url: fallback.url,
         quality: fallback.height ? `${fallback.height}p` : 'best',
         format: fallback.ext || 'mp4'
       });
     }
  }

  return result;
}

module.exports = { buildYtdlpArgs, selectFormat };
