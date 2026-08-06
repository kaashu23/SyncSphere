const express = require('express');
const multer = require('multer');
const ImageKit = require('imagekit');

const router = express.Router();

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const response = await imagekit.upload({
      file: req.file.buffer,
      fileName: `syncsphere_avatar_${Date.now()}_${req.file.originalname}`,
      folder: '/syncsphere',
    });

    res.status(200).json({ url: response.url });
  } catch (error) {
    console.error('ImageKit upload error:', error);
    res.status(500).json({ message: 'Failed to upload image' });
  }
});

module.exports = router;
