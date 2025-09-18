const express = require('express');
const multer = require('multer');
const { handleRecord, handleTrain } = require('../controllers/audioController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Record endpoint (mic upload from frontend)
router.post('/record', upload.single('audio'), handleRecord);

// Training endpoint (save tagged hums)
router.post('/train', handleTrain);

module.exports = router;
