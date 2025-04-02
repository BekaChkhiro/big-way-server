const aws = require('aws-sdk');
require('dotenv').config();

// Log AWS configuration (without sensitive data)
console.log('AWS Config:', {
  accessKeyIdExists: !!process.env.AWS_ACCESS_KEY_ID,
  secretAccessKeyExists: !!process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  bucket: process.env.AWS_BUCKET_NAME
});

const s3 = new aws.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Test S3 connection
s3.listBuckets((err, data) => {
  if (err) {
    console.error('Error connecting to AWS S3:', err);
  } else {
    console.log('Successfully connected to AWS S3');
    console.log('Available buckets:', data.Buckets.map(b => b.Name));
    
    // Check if our bucket exists
    const ourBucket = data.Buckets.find(b => b.Name === process.env.AWS_BUCKET_NAME);
    if (ourBucket) {
      console.log(`Bucket ${process.env.AWS_BUCKET_NAME} exists`);
    } else {
      console.error(`Bucket ${process.env.AWS_BUCKET_NAME} does not exist!`);
    }
  }
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