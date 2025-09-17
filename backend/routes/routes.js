const express = require('express');
const router = express.Router();
const { recordAudio, matchFingerprint, trainSample, getHistory } = require('../controllers/controller');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/record', upload.single('audio'), recordAudio);
router.post('/match', matchFingerprint);
router.post('/train', trainSample);
router.get('/history', getHistory);

module.exports = router;
