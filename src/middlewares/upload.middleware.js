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
  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }

  const processedImages = [];

  for (const file of files) {
    try {
      const timestamp = Date.now();
      const cleanFileName = path.basename(file.originalname).replace(/[^a-zA-Z0-9]/g, '');
      const filename = `${timestamp}-${cleanFileName}.webp`;
      const imageUrls = {};

      // Upload sizes in parallel for efficiency
      const uploads = await Promise.all([
        // Original
        (async () => {
          const buffer = await sharp(file.buffer)
            .webp({ quality: 80 })
            .toBuffer();
          
          const key = `images/original/${filename}`;
          await s3.upload({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: 'image/webp',
            CacheControl: 'max-age=31536000'
          }).promise();
          
          return { type: 'original', key };
        })(),

        // Thumbnail
        (async () => {
          const buffer = await sharp(file.buffer)
            .resize(imageSettings.dimensions.thumbnail.width, imageSettings.dimensions.thumbnail.height, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .webp({ quality: 80 })
            .toBuffer();
          
          const key = `images/thumbnail/${filename}`;
          await s3.upload({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: 'image/webp',
            CacheControl: 'max-age=31536000'
          }).promise();
          
          return { type: 'thumbnail', key };
        })(),

        // Medium
        (async () => {
          const buffer = await sharp(file.buffer)
            .resize(imageSettings.dimensions.medium.width, imageSettings.dimensions.medium.height, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .webp({ quality: 80 })
            .toBuffer();
          
          const key = `images/medium/${filename}`;
          await s3.upload({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: 'image/webp',
            CacheControl: 'max-age=31536000'
          }).promise();
          
          return { type: 'medium', key };
        })(),

        // Large
        (async () => {
          const buffer = await sharp(file.buffer)
            .resize(imageSettings.dimensions.large.width, imageSettings.dimensions.large.height, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .webp({ quality: 80 })
            .toBuffer();
          
          const key = `images/large/${filename}`;
          await s3.upload({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: 'image/webp',
            CacheControl: 'max-age=31536000'
          }).promise();
          
          return { type: 'large', key };
        })()
      ]);

      // Assign URLs from parallel uploads
      uploads.forEach(({ type, key }) => {
        imageUrls[type] = `https://${bucket}.s3.amazonaws.com/${key}`;
      });

      processedImages.push(imageUrls);
    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Failed to process image ${file.originalname}: ${error.message}`);
    }
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