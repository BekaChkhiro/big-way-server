const aws = require('aws-sdk');
require('dotenv').config();

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

module.exports = {
  s3,
  bucket: process.env.AWS_BUCKET_NAME,
  imageSettings: {
    formats: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    dimensions: {
      thumbnail: { width: 200, height: 150 },
      medium: { width: 800, height: 600 },
      large: { width: 1920, height: 1080 }
    }
  }
};