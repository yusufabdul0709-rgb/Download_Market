const axios = require('axios');

async function testWuk(url) {
  try {
    const res = await axios.post('https://co.wuk.sh/api/json', {
      url: url,
      vQuality: "1080",
    }, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
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
  await testWuk('https://youtube.com/shorts/q2Z665Z87kQ');

  console.log("\n------- INSTAGRAM -------");
  await testWuk('https://www.instagram.com/p/DB1s8v9P08m/');

  console.log("\n------- FACEBOOK -------");
  await testWuk('https://www.facebook.com/share/v/1EMBKGQFhe');
}

run();
