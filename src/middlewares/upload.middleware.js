const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { s3, bucket, imageSettings } = require('../../config/storage.config');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: imageSettings.maxSize
  },
  fileFilter: (req, file, cb) => {
    if (imageSettings.formats.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'), false);
    }
  }
});

// Process and upload images
const processAndUpload = async (files) => {
  const processedImages = [];

  for (const file of files) {
    const filename = `${Date.now()}-${path.basename(file.originalname)}`;
    const variants = {};

    // Process different sizes
    for (const [size, dimensions] of Object.entries(imageSettings.dimensions)) {
      const processedBuffer = await sharp(file.buffer)
        .resize(dimensions.width, dimensions.height, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 1 }
        })
        .webp({ quality: 80 })
        .toBuffer();

      // Upload to S3
      const key = `images/${size}/${filename}`;
      await s3.upload({
        Bucket: bucket,
        Key: key,
        Body: processedBuffer,
        ContentType: 'image/webp',
        CacheControl: 'max-age=31536000' // 1 year cache
      }).promise();

      variants[size] = `https://${bucket}.s3.amazonaws.com/${key}`;
    }

    processedImages.push({
      original_name: file.originalname,
      ...variants
    });
  }

  return processedImages;
};

// Cache control middleware
const setCacheHeaders = (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=31536000');
    res.set('Expires', new Date(Date.now() + 31536000000).toUTCString());
  }
  next();
};

module.exports = {
  upload,
  processAndUpload,
  setCacheHeaders
};