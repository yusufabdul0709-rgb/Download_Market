const ytdl = require('@distube/ytdl-core');
const igdl = require('@sasmeee/igdl');
const fbdown = require('fb-downloader-scrapper');

async function testAll() {
  try {
    console.log("------- YOUTUBE SHORTS -------");
    const ytInfo = await ytdl.getInfo('https://youtube.com/shorts/q2Z665Z87kQ');
    console.log('YouTube Title:', ytInfo.videoDetails.title);
    // Find format
    const format = ytdl.chooseFormat(ytInfo.formats, { quality: 'highest' });
    console.log('YouTube Format:', format.url.substring(0, 50) + "...");
  } catch (e) {
    console.error('YT Error:', e.message);
  }

  try {
    console.log("\n------- INSTAGRAM -------");
    const igRes = await igdl('https://www.instagram.com/p/DB1s8v9P08m/');
    console.log('Instagram Length:', igRes.length);
    if (igRes.length > 0) console.log('Instagram First URL:', igRes[0].download_link.substring(0, 50) + "...");
  } catch (e) {
    console.error('IG Error:', e.message);
  }

  try {
    console.log("\n------- FACEBOOK -------");
    const fbRes = await fbdown('https://www.facebook.com/share/v/1EMBKGQFhe');
    console.log('Facebook Success:', !!fbRes.success);
    if (fbRes.success) console.log('Facebook HD:', fbRes.download[0].url.substring(0, 50) + "...");
  } catch (e) {
    console.error('FB Error:', e.message);
  }
}

testAll();
