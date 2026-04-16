const btch = require('btch-downloader');

async function testBtch() {
  try {
    console.log("------- YOUTUBE SHORTS -------");
    const ytRes = await btch.youtube('https://youtube.com/shorts/q2Z665Z87kQ');
    console.log('YouTube:', JSON.stringify(ytRes, null, 2));
  } catch (e) {
    console.error('YT Error:', e.message);
  }

  try {
    console.log("\n------- INSTAGRAM -------");
    const igRes = await btch.igdl('https://www.instagram.com/p/DB1s8v9P08m/');
    console.log('Instagram:', JSON.stringify(igRes, null, 2));
  } catch (e) {
    console.error('IG Error:', e.message);
  }

  try {
    console.log("\n------- FACEBOOK -------");
    const fbRes = await btch.fbdown('https://www.facebook.com/share/v/1EMBKGQFhe');
    console.log('Facebook:', JSON.stringify(fbRes, null, 2));
  } catch (e) {
    console.error('FB Error:', e.message);
  }
}

testBtch();
