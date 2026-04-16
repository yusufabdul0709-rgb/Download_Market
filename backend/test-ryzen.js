const axios = require('axios');

async function testRyzen(url, type) {
  try {
    let endpoint = '';
    if (type === 'yt') endpoint = `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`;
    if (type === 'ig') endpoint = `https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`;
    if (type === 'fb') endpoint = `https://api.ryzendesu.vip/api/downloader/fbdl?url=${encodeURIComponent(url)}`;

    const res = await axios.get(endpoint, {
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log(`Success for ${url}:`, JSON.stringify(res.data, null, 2));
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
  await testRyzen('https://youtube.com/shorts/q2Z665Z87kQ', 'yt');

  console.log("\n------- INSTAGRAM -------");
  await testRyzen('https://www.instagram.com/p/DB1s8v9P08m/', 'ig');

  console.log("\n------- FACEBOOK -------");
  await testRyzen('https://www.facebook.com/share/v/1EMBKGQFhe', 'fb');
}

run();
