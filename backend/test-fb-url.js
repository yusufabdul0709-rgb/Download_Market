const axios = require('axios');

async function check() {
  try {
    const res = await axios.get('https://www.facebook.com/share/p/8xL1dJpXJ7hG4N5A/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;'
      }
    });
    const data = res.data;
    
    // Look for canonical
    const match = data.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
    if (match) {
      console.log("FOUND canonical:", match[1]);
    } else {
      console.log("NOT FOUND canonical");
      // Look for any facebook.com URL in the html
      let matches = data.match(/https:\/\/(www\.)?facebook\.com[^"'\s]+/g);
      if(matches && matches.length > 0) {
          // get unique long ones
          matches = [...new Set(matches)].filter(m => m.length > 50);
          console.log("Found some urls: ", matches.slice(0, 5));
      }
    }
  } catch(e) {
    console.error(e.message);
  }
}
check();
