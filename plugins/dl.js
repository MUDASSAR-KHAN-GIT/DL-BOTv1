const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.RAPID_API_KEY; // 🔐 keep safe

function fetchVideo(url) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'POST',
      hostname: 'auto-download-all-in-one.p.rapidapi.com',
      path: '/v1/social/autolink',
      headers: {
        'x-rapidapi-key': API_KEY,
        'x-rapidapi-host': 'auto-download-all-in-one.p.rapidapi.com',
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => data += chunk);

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const videoUrl = json?.medias?.[0]?.url;

          if (!videoUrl) return reject("No video found");

          resolve(videoUrl);
        } catch (e) {
          reject("API error / invalid response");
        }
      });
    });

    req.on('error', reject);

    req.write(JSON.stringify({ url }));
    req.end();
  });
}

function downloadFile(fileUrl, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filePath);

    https.get(fileUrl, (res) => {
      res.pipe(file);

      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', reject);
  });
}

// 🔥 MAIN BOT COMMAND
async function dlCommand(sock, msg, text) {
  try {
    const chatId = msg.key.remoteJid;

    if (!text) {
      return sock.sendMessage(chatId, {
        text: "⚠️ Send a valid TikTok/Instagram link after .dl"
      });
    }

    await sock.sendMessage(chatId, {
      text: "⏳ Processing your media..."
    });

    // 1. get video link
    const videoUrl = await fetchVideo(text);

    // 2. download video locally
    const fileName = `video_${Date.now()}.mp4`;
    const filePath = path.join(__dirname, fileName);

    await downloadFile(videoUrl, filePath);

    // 3. send MP4 directly (no URL shown)
    await sock.sendMessage(chatId, {
      video: fs.readFileSync(filePath),
      caption: "✅ Here is your video"
    });

    // 4. cleanup
    fs.unlinkSync(filePath);

  } catch (err) {
    console.error(err);
    sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Failed to download media"
    });
  }
}

module.exports = dlCommand;