const aws = require('aws-sdk');
require('dotenv').config();

// Log AWS configuration (without sensitive data)
console.log('AWS Config:', {
  accessKeyIdExists: !!process.env.AWS_ACCESS_KEY_ID,
  secretAccessKeyExists: !!process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_BUCKET_NAME
});

console.log('AWS Environment Variables:', {
  AWS_ACCESS_KEY_ID_length: process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.length : 0,
  AWS_SECRET_ACCESS_KEY_length: process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY.length : 0,
  AWS_REGION: process.env.AWS_REGION,
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME
});

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Test S3 connection
console.log('Testing S3 connection...');
s3.listBuckets((err, data) => {
  if (err) {
    console.error('Error connecting to AWS S3:', err);
    console.error('AWS S3 connection error details:', {
      code: err.code,
      message: err.message,
      region: process.env.AWS_REGION,
      requestId: err.requestId,
      time: new Date().toISOString()
    });
  } else {
    console.log('Successfully connected to AWS S3');
    console.log('Available buckets:', data.Buckets.map(b => b.Name));
    
    // Check if our bucket exists
    const ourBucket = data.Buckets.find(b => b.Name === process.env.AWS_BUCKET_NAME);
    if (ourBucket) {
      console.log(`Bucket ${process.env.AWS_BUCKET_NAME} exists`);
    } else {
      console.error(`Bucket ${process.env.AWS_BUCKET_NAME} does not exist!`);
      console.error('Available buckets are:', data.Buckets.map(b => b.Name).join(', '));
    }
  }
});

module.exports = {
  s3,
  bucket: process.env.AWS_BUCKET_NAME,
  imageSettings: {
    formats: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 10 * 1024 * 1024, // 10MB
    dimensions: {
      thumbnail: { width: 200, height: 150 },
      medium: { width: 800, height: 600 },
      large: { width: 1920, height: 1080 }
    }
  }
};