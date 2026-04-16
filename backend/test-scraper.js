const { ytmp4, igdl, Facebook } = require('ruhend-scraper');

async function test() {
  try {
    console.log("------- YOUTUBE SHORTS -------");
    const ytParams = { url: 'https://youtube.com/shorts/q2Z665Z87kQ' }; // sample short
    // Actually the ytmp4 function might just take string. Let's try.
    const ytRes = await ytmp4('https://youtube.com/shorts/q2Z665Z87kQ');
    console.log('YouTube:', JSON.stringify(ytRes, null, 2));
  } catch (e) {
    console.error('YT Error:', e.message);
  }

  try {
    console.log("\n------- INSTAGRAM -------");
    const igRes = await igdl('https://www.instagram.com/p/DB1s8v9P08m/');
    console.log('Instagram:', JSON.stringify(igRes, null, 2));
  } catch (e) {
    console.error('IG Error:', e.message);
  }

  try {
    console.log("\n------- FACEBOOK -------");
    const fbRes = await Facebook('https://www.facebook.com/share/v/1EMBKGQFhe');
    console.log('Facebook:', JSON.stringify(fbRes, null, 2));
  } catch (e) {
    console.error('FB Error:', e.message);
  }
}

test();
