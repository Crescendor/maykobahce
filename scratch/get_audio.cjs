const { execSync } = require('child_process');
const fs = require('fs');

console.log('Extracting direct audio URL...');
const output = execSync('scratch\\yt-dlp.exe -g https://www.youtube.com/watch?v=NBQbekrHnsY').toString().trim().split('\n');
const audioUrl = output[output.length - 1].trim();

const urlObj = new URL(audioUrl);
const host = urlObj.hostname;

console.log(`Downloading farewell_song.webm from host ${host}...`);
const cmd = `curl.exe -k -L --http1.1 -H "Host: ${host}" -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" -H "Referer: https://www.youtube.com/" "${audioUrl}" -o public/assets/farewell_song.webm`;

try {
  execSync(cmd);
  const size = fs.statSync('public/assets/farewell_song.webm').size;
  console.log(`GREAT SUCCESS! Downloaded farewell_song.webm. File size: ${size} bytes`);
} catch (e) {
  console.error('Curl failed:', e.message);
}
