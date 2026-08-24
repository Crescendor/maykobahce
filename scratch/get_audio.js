const { execSync } = require('child_process');
const fs = require('fs');

console.log('Extracting direct audio URL...');
const output = execSync('scratch\\yt-dlp.exe -g https://www.youtube.com/watch?v=NBQbekrHnsY').toString().trim().split('\n');
const audioUrl = output[output.length - 1].trim();

console.log('Downloading farewell_song.webm via curl.exe --http1.1 ...');
execSync(`curl.exe --http1.1 -s -L -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" "${audioUrl}" -o public/assets/farewell_song.webm`);

const size = fs.statSync('public/assets/farewell_song.webm').size;
console.log(`GREAT SUCCESS! Downloaded farewell_song.webm. File size: ${size} bytes`);
