const { exec } = require('child_process');
const axios = require('axios');

exports.generateFingerprint = (audioBuffer) => {
    return new Promise((resolve, reject) => {
        // Save temp file
        const fs = require('fs');
        const tmpFile = 'temp.wav';
        fs.writeFileSync(tmpFile, audioBuffer);

        exec(`fpcalc -raw -length 15 ${tmpFile}`, (err, stdout) => {
            fs.unlinkSync(tmpFile);
            if (err) return reject(err);
            const match = stdout.match(/FINGERPRINT=(.*)/);
            if (match) resolve(match[1]);
            else reject('Fingerprint failed');
        });
    });
};

exports.queryAcoustID = async (fingerprint) => {
    const key = process.env.ACOUSTID_KEY;
    try {
        const res = await axios.get('https://api.acoustid.org/v2/lookup', {
            params: {
                client: key,
                meta: 'recordings+releasegroups',
                fingerprint: fingerprint,
                duration: 15
            }
        });
        return res.data;
    } catch (err) {
        console.error('AcoustID lookup failed:', err);
        return null;
    }
};
