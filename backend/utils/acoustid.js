const { exec } = require('child_process');
const axios = require('axios');

async function identifySong(filePath) {
  return new Promise((resolve, reject) => {
    exec(`fpcalc -json "${filePath}"`, async (err, stdout) => {
      if (err) return reject(err);
      try {
        const data = JSON.parse(stdout);
        const { fingerprint, duration } = data;
        const res = await axios.get('https://api.acoustid.org/v2/lookup', {
          params: {
            client: process.env.ACOUSTID_KEY,
            fingerprint,
            duration,
            meta: 'recordings+releasegroups+compress'
          }
        });
        resolve(res.data);
      } catch (e) {
        reject(e);
      }
    });
  });
}

module.exports = { identifySong };
