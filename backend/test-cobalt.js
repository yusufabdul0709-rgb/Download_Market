const axios = require('axios');

async function testCobalt(url) {
  try {
    const res = await axios.post('https://api.cobalt.tools/api/json', {
      url: url,
      vQuality: "1080",
      filenamePattern: "classic"
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Origin': 'https://cobalt.tools',
        'Referer': 'https://cobalt.tools/'
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
  console.log("------- YOUTUBE SHORTS -------");
  await testCobalt('https://youtube.com/shorts/q2Z665Z87kQ');

  console.log("\n------- INSTAGRAM -------");
  await testCobalt('https://www.instagram.com/p/DB1s8v9P08m/');

  console.log("\n------- FACEBOOK -------");
  await testCobalt('https://www.facebook.com/share/v/1EMBKGQFhe');
}

run();
