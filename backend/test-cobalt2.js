async function testCobalt(url) {
  try {
    const res = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Origin': 'https://cobalt.tools',
        'Referer': 'https://cobalt.tools/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
      },
      body: JSON.stringify({
        url: url,
        filenamePattern: 'classic'
      })
    });

    const data = await res.json();
    console.log(`Success for ${url}:`, data);
  } catch (err) {
    console.error(err.message);
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
