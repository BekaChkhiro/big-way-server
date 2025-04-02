require('dotenv').config();
const aws = require('aws-sdk');

console.log('Checking AWS configuration...');
console.log('AWS Environment Variables:', {
  AWS_ACCESS_KEY_ID_length: process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.length : 0,
  AWS_SECRET_ACCESS_KEY_length: process.env.AWS_SECRET_ACCESS_KEY ? process.env.AWS_SECRET_ACCESS_KEY.length : 0,
  AWS_REGION: process.env.AWS_REGION,
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME
});

// Initialize S3 client
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
      
      // Try to list objects in the bucket
      console.log(`Listing objects in bucket ${process.env.AWS_BUCKET_NAME}...`);
      s3.listObjects({ Bucket: process.env.AWS_BUCKET_NAME }, (err, data) => {
        if (err) {
          console.error(`Error listing objects in bucket ${process.env.AWS_BUCKET_NAME}:`, err);
        } else {
          console.log(`Objects in bucket ${process.env.AWS_BUCKET_NAME}:`, 
            data.Contents.length > 0 
              ? data.Contents.map(obj => obj.Key).slice(0, 10) 
              : 'No objects found'
          );
        }
      });
    } else {
      console.error(`Bucket ${process.env.AWS_BUCKET_NAME} does not exist!`);
      console.error('Available buckets are:', data.Buckets.map(b => b.Name).join(', '));
    }
  }
});

// Test uploading a small file to S3
const testUpload = () => {
  console.log('Testing file upload to S3...');
  const testData = Buffer.from('This is a test file for AWS S3 upload', 'utf8');
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `test/test-file-${Date.now()}.txt`,
    Body: testData,
    ContentType: 'text/plain'
  };
  
  s3.upload(params, (err, data) => {
    if (err) {
      console.error('Error uploading test file to S3:', err);
    } else {
      console.log('Successfully uploaded test file to S3:', data.Location);
    }
  });
};

// Run test upload after 2 seconds (after bucket check)
setTimeout(testUpload, 2000);
