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
  console.log('Starting processAndUpload with files:', files ? files.length : 0);
  console.log('AWS Config:', {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'Set' : 'Not set',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'Set' : 'Not set',
    region: process.env.AWS_REGION,
    bucket: bucket
  });

  if (!files || files.length === 0) {
    throw new Error('No files provided');
  }

  const processedImages = [];

  for (const file of files) {
    try {
      console.log(`Processing file: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`);
      const timestamp = Date.now();
      const cleanFileName = path.basename(file.originalname).replace(/[^a-zA-Z0-9]/g, '');
      const filename = `${timestamp}-${cleanFileName}.webp`;
      const imageUrls = {};

      // Upload sizes in parallel for efficiency
      console.log('Starting parallel uploads for file:', filename);
      const uploads = await Promise.all([
        // Original
        (async () => {
          console.log('Processing original image');
          const buffer = await sharp(file.buffer)
            .webp({ quality: 80 })
            .toBuffer();
          
          const key = `images/original/${filename}`;
          console.log(`Uploading original to S3: ${key}, bucket: ${bucket}`);
          try {
            const uploadResult = await s3.upload({
              Bucket: bucket,
              Key: key,
              Body: buffer,
              ContentType: 'image/webp',
              CacheControl: 'max-age=31536000'
            }).promise();
            console.log('Original upload success:', uploadResult.Location);
            return { type: 'original', key, url: uploadResult.Location };
          } catch (uploadError) {
            console.error('Error uploading original to S3:', uploadError);
            throw uploadError;
          }
        })(),

        // Thumbnail
        (async () => {
          console.log('Processing thumbnail image');
          const buffer = await sharp(file.buffer)
            .resize(imageSettings.dimensions.thumbnail.width, imageSettings.dimensions.thumbnail.height, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .webp({ quality: 80 })
            .toBuffer();
          
          const key = `images/thumbnail/${filename}`;
          console.log(`Uploading thumbnail to S3: ${key}`);
          try {
            const uploadResult = await s3.upload({
              Bucket: bucket,
              Key: key,
              Body: buffer,
              ContentType: 'image/webp',
              CacheControl: 'max-age=31536000'
            }).promise();
            console.log('Thumbnail upload success:', uploadResult.Location);
            return { type: 'thumbnail', key, url: uploadResult.Location };
          } catch (uploadError) {
            console.error('Error uploading thumbnail to S3:', uploadError);
            throw uploadError;
          }
        })(),

        // Medium
        (async () => {
          console.log('Processing medium image');
          const buffer = await sharp(file.buffer)
            .resize(imageSettings.dimensions.medium.width, imageSettings.dimensions.medium.height, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .webp({ quality: 80 })
            .toBuffer();
          
          const key = `images/medium/${filename}`;
          console.log(`Uploading medium to S3: ${key}`);
          try {
            const uploadResult = await s3.upload({
              Bucket: bucket,
              Key: key,
              Body: buffer,
              ContentType: 'image/webp',
              CacheControl: 'max-age=31536000'
            }).promise();
            console.log('Medium upload success:', uploadResult.Location);
            return { type: 'medium', key, url: uploadResult.Location };
          } catch (uploadError) {
            console.error('Error uploading medium to S3:', uploadError);
            throw uploadError;
          }
        })(),

        // Large
        (async () => {
          console.log('Processing large image');
          const buffer = await sharp(file.buffer)
            .resize(imageSettings.dimensions.large.width, imageSettings.dimensions.large.height, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 1 }
            })
            .webp({ quality: 80 })
            .toBuffer();
          
          const key = `images/large/${filename}`;
          console.log(`Uploading large to S3: ${key}`);
          try {
            const uploadResult = await s3.upload({
              Bucket: bucket,
              Key: key,
              Body: buffer,
              ContentType: 'image/webp',
              CacheControl: 'max-age=31536000'
            }).promise();
            console.log('Large upload success:', uploadResult.Location);
            return { type: 'large', key, url: uploadResult.Location };
          } catch (uploadError) {
            console.error('Error uploading large to S3:', uploadError);
            throw uploadError;
          }
        })()
      ]);

      // Assign URLs from parallel uploads
      console.log('All uploads completed, assigning URLs');
      uploads.forEach(({ type, key, url }) => {
        // Always use the returned URL from S3 if available
        if (url) {
          imageUrls[type] = url;
          console.log(`Using S3 returned URL for ${type}: ${url}`);
        } else {
          // Construct URL based on region
          const region = process.env.AWS_REGION;
          // For some regions like us-east-1, the URL format is different
          if (region === 'us-east-1') {
            imageUrls[type] = `https://${bucket}.s3.amazonaws.com/${key}`;
          } else {
            imageUrls[type] = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
          }
          console.log(`Constructed URL for ${type}: ${imageUrls[type]}`);
        }
      });

      processedImages.push(imageUrls);
      console.log('Added image URLs to processed images:', imageUrls);
    } catch (error) {
      console.error('Error processing image:', error);
      console.error('Error details:', error.stack);
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

// Handle single file upload (for advertisements)
async function uploadToS3(file) {
  if (!file) {
    throw new Error('No file provided');
  }

  console.log(`Uploading single file: ${file.originalname}, size: ${file.size}`);
  const timestamp = Date.now();
  const cleanFileName = path.basename(file.originalname).replace(/[^a-zA-Z0-9]/g, '');
  const filename = `${timestamp}-${cleanFileName}.webp`;

  try {
    const buffer = await sharp(file.buffer)
      .webp({ quality: 80 })
      .toBuffer();
    
    const key = `advertisements/${filename}`;
    console.log(`Uploading advertisement image to S3: ${key}, bucket: ${bucket}`);
    
    const uploadResult = await s3.upload({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: 'image/webp',
      CacheControl: 'max-age=31536000'
    }).promise();
    
    console.log('Advertisement image upload success:', uploadResult.Location);
    return uploadResult;
  } catch (error) {
    console.error('Error uploading advertisement image to S3:', error);
    throw error;
  }
}

module.exports = {
  upload,
  processAndUpload,
  setCacheHeaders,
  uploadToS3
};