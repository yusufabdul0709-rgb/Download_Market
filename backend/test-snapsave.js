const axios = require('axios');
const cheerio = require('cheerio');

async function testSnapSave(url) {
  try {
    const formData = new URLSearchParams();
    formData.append('q', url);
    formData.append('t', 'media');
    formData.append('lang', 'en');

    const res = await axios.post('https://snapsave.app/action.php?catch=catch', formData, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://snapsave.app/',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log(`Success for ${url}:`, res.data);
  } catch (err) {
    if (err.response) {
      console.error(`Status: ${err.response.status}`, err.response.data);
    } else {
      console.error(err.message);
    }
  }
}

async function run() {
  console.log("\n------- FACEBOOK -------");
  await testSnapSave('https://www.facebook.com/share/v/1EMBKGQFhe');
}

run();
