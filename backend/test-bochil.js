const { youtubedl, youtubedlv2, instagramdl, instagramdlv2, facebookdl, facebookdlv2 } = require('@bochilteam/scraper');

async function test() {
  try {
    console.log("------- YOUTUBE SHORTS -------");
    const ytRes = await youtubedl('https://youtube.com/shorts/q2Z665Z87kQ').catch(() => youtubedlv2('https://youtube.com/shorts/q2Z665Z87kQ'));
    console.log('YouTube:', JSON.stringify(ytRes, null, 2));
  } catch (e) {
    console.error('YT Error:', e.message);
  }

  try {
    console.log("\n------- INSTAGRAM -------");
    const igRes = await instagramdl('https://www.instagram.com/p/DB1s8v9P08m/').catch(() => instagramdlv2('https://www.instagram.com/p/DB1s8v9P08m/'));
    console.log('Instagram:', JSON.stringify(igRes, null, 2));
  } catch (e) {
    console.error('IG Error:', e.message);
  }

  try {
    console.log("\n------- FACEBOOK -------");
    const fbRes = await facebookdl('https://www.facebook.com/share/v/1EMBKGQFhe').catch(() => facebookdlv2('https://www.facebook.com/share/v/1EMBKGQFhe'));
    console.log('Facebook:', JSON.stringify(fbRes, null, 2));
  } catch (e) {
    console.error('FB Error:', e.message);
  }
}

test();
