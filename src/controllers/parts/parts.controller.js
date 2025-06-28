const { PartModel, PartCreate, PartSearch, PartUpdate } = require('../../models/part');
const pool = require('../../../config/db.config');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { promisify } = require('util');
const sharp = require('sharp');
const { upload, processAndUpload } = require('../../middlewares/upload.middleware');

// Helper function to check if a file exists
async function fileExists(filePath) {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

// We're now using the upload middleware imported from upload.middleware.js
// which uses multer.memoryStorage() and handles AWS S3 uploads

class PartsController {
  // Create a new part
  async create(req, res) {
    try {
      const uploadMiddleware = promisify(upload.array('images', 10));
      await uploadMiddleware(req, res);

      console.log('Request body:', req.body);
      console.log('Raw partData from request:', req.body.partData);
      
      let partData;
      try {
        partData = typeof req.body.partData === 'string' 
          ? JSON.parse(req.body.partData) 
          : req.body.partData || {};
      } catch (err) {
        console.error('Error parsing partData:', err);
        throw new Error(`Failed to parse part data: ${err.message}`);
      }
      
      console.log('Parsed partData:', partData);
      
      // Ensure all numeric fields are actually numbers
      if (partData.category_id) partData.category_id = Number(partData.category_id);
      if (partData.brand_id) partData.brand_id = Number(partData.brand_id);
      if (partData.model_id) partData.model_id = Number(partData.model_id);
      if (partData.price) partData.price = Number(partData.price);
      
      const images = req.files;
      console.log(`Number of images received: ${images ? images.length : 0}`);
      
      const sellerId = req.user.id;
      console.log(`Seller ID: ${sellerId}`);
      console.log(`Creating part with data:`, JSON.stringify(partData, null, 2));
      
      let processedImages = [];
      
      // Upload images to AWS S3 if there are any
      if (images && images.length > 0) {
        try {
          console.log('Uploading images to AWS S3...');
          // Use the upload middleware's processAndUpload function to handle AWS S3 uploads
          const awsUploadResults = await processAndUpload(images);
          console.log('AWS upload results:', awsUploadResults);
          
          // Format the image URLs for the database
          processedImages = awsUploadResults.map((result, index) => {
            // Each result directly contains the URLs at the top level
            return {
              image_url: result.original,
              thumbnail_url: result.thumbnail,
              medium_url: result.medium,
              large_url: result.large,
              is_primary: index === 0 // First image is primary
            };
          });
          
          console.log('Processed image URLs:', processedImages);
        } catch (uploadError) {
          console.error('Error uploading images to AWS S3:', uploadError);
          throw new Error(`Failed to upload images: ${uploadError.message}`);
        }
      }
      
      // Create the part with AWS S3 image URLs
      console.log('Creating part with processed images:', processedImages);
      const part = await PartCreate.create(partData, [], sellerId, processedImages);

      res.status(201).json({
        success: true,
        part
      });
    } catch (error) {
      console.error('Error creating part:', error);
      // Use req.body.partData instead of undefined partData
      console.error('Error details:', req.body.partData ? JSON.stringify(JSON.parse(req.body.partData), null, 2) : 'No part data');
      res.status(400).json({
        success: false,
        message: error.message,
        details: error.stack,
        partData: req.body.partData
      });
    }
  }

  // Get a single part
  async getById(req, res) {
    try {
      const { id } = req.params;
      const part = await PartModel.findById(id);

      if (!part) {
        return res.status(404).json({
          success: false,
          message: 'Part not found'
        });
      }

      res.status(200).json({
        success: true,
        part
      });
    } catch (error) {
      console.error('Error getting part:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all parts with filtering
  async search(req, res) {
    try {
      const filters = {
        ...req.query,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };

      // Convert string IDs to numbers
      if (filters.brand_id) filters.brand_id = parseInt(filters.brand_id);
      if (filters.model_id) filters.model_id = parseInt(filters.model_id);
      if (filters.category_id) filters.category_id = parseInt(filters.category_id);
      if (filters.minPrice) filters.minPrice = parseFloat(filters.minPrice);
      if (filters.maxPrice) filters.maxPrice = parseFloat(filters.maxPrice);
      
      const result = await PartSearch.search(filters);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error searching parts:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update a part
  async update(req, res) {
    try {
      const { id } = req.params;
      const uploadMiddleware = promisify(upload.array('images', 10));
      await uploadMiddleware(req, res);

      let partData;
      try {
        partData = typeof req.body.partData === 'string' 
          ? JSON.parse(req.body.partData) 
          : req.body.partData || {};
      } catch (err) {
        console.error('Error parsing partData:', err);
        throw new Error(`Failed to parse part data: ${err.message}`);
      }
      
      console.log('Parsed partData for update:', partData);
      
      // Ensure all numeric fields are actually numbers
      if (partData.category_id) partData.category_id = Number(partData.category_id);
      if (partData.brand_id) partData.brand_id = Number(partData.brand_id);
      if (partData.model_id) partData.model_id = Number(partData.model_id);
      if (partData.price) partData.price = Number(partData.price);
      
      const images = req.files;
      console.log(`Number of images received for update: ${images ? images.length : 0}`);
      
      // Check if user is authorized to update the part
      const part = await PartModel.findById(id);
      
      if (!part) {
        return res.status(404).json({
          success: false,
          message: 'Part not found'
        });
      }
      
      // Only allow update if user is the seller or an admin
      if (part.seller_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this part'
        });
      }

      let processedImages = [];
      
      // Upload new images to AWS S3 if any
      if (images && images.length > 0) {
        try {
          console.log('Uploading new images to AWS S3 for part update...');
          // Use the upload middleware's processAndUpload function to handle AWS S3 uploads
          const awsUploadResults = await processAndUpload(images);
          console.log('AWS upload results for update:', awsUploadResults);
          
          // Format the image URLs for the database
          processedImages = awsUploadResults.map((result, index) => {
            // Each result has urls for different sizes
            return {
              image_url: result.urls.original,
              thumbnail_url: result.urls.thumbnail,
              medium_url: result.urls.medium,
              large_url: result.urls.large,
              is_primary: false // New images are not primary by default
            };
          });
          
          console.log('Processed new image URLs for update:', processedImages);
        } catch (uploadError) {
          console.error('Error uploading images to AWS S3 during update:', uploadError);
          throw new Error(`Failed to upload images: ${uploadError.message}`);
        }
      }

      const updatedPart = await PartUpdate.update(id, partData, [], processedImages);
      
      res.status(200).json({
        success: true,
        part: updatedPart
      });
    } catch (error) {
      console.error('Error updating part:', error);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete a part
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      // Check if user is authorized to delete the part
      const part = await PartModel.findById(id);
      
      if (!part) {
        return res.status(404).json({
          success: false,
          message: 'Part not found'
        });
      }
      
      // Only allow delete if user is the seller or an admin
      if (part.seller_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to delete this part'
        });
      }
      
      await PartModel.delete(id);
      
      // Delete part images from the filesystem
      const baseDir = path.join(__dirname, '../../../uploads/parts', id.toString());
      try {
        await fs.rm(baseDir, { recursive: true, force: true });
      } catch (err) {
        console.error('Error deleting part images directory:', err);
        // Continue even if image deletion fails
      }

      res.status(200).json({
        success: true,
        message: 'Part deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting part:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Set an image as primary
  async setImageAsPrimary(req, res) {
    try {
      const { partId, imageId } = req.params;
      
      // Check if user is authorized
      const part = await PartModel.findById(partId);
      
      if (!part) {
        return res.status(404).json({
          success: false,
          message: 'Part not found'
        });
      }
      
      // Only allow update if user is the seller or an admin
      if (part.seller_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this part'
        });
      }
      
      const updatedImage = await PartUpdate.setImageAsPrimary(partId, imageId);
      
      res.status(200).json({
        success: true,
        image: updatedImage
      });
    } catch (error) {
      console.error('Error setting image as primary:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete an image
  async deleteImage(req, res) {
    try {
      const { partId, imageId } = req.params;
      
      // Check if user is authorized
      const part = await PartModel.findById(partId);
      
      if (!part) {
        return res.status(404).json({
          success: false,
          message: 'Part not found'
        });
      }
      
      // Only allow update if user is the seller or an admin
      if (part.seller_id !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this part'
        });
      }
      
      const deletedImage = await PartUpdate.deleteImage(partId, imageId);
      
      // If the image is stored on S3, delete it from there
      if (deletedImage && deletedImage.image_url && deletedImage.image_url.includes('amazonaws.com')) {
        try {
          const { s3, bucket } = require('../../../config/storage.config');
          
          // Extract the S3 key from the URL
          // URL format is usually: https://bucket-name.s3.region.amazonaws.com/path/to/file
          const getS3KeyFromUrl = (url) => {
            // Extract everything after the amazonaws.com/
            const urlParts = url.split('amazonaws.com/');
            if (urlParts.length > 1) {
              return urlParts[1];
            }
            return null;
          };
          
          // Delete original image
          if (deletedImage.image_url) {
            const originalKey = getS3KeyFromUrl(deletedImage.image_url);
            if (originalKey) {
              await s3.deleteObject({ Bucket: bucket, Key: originalKey }).promise();
              console.log(`Deleted original image from S3: ${originalKey}`);
            }
          }
          
          // Delete thumbnail
          if (deletedImage.thumbnail_url) {
            const thumbnailKey = getS3KeyFromUrl(deletedImage.thumbnail_url);
            if (thumbnailKey) {
              await s3.deleteObject({ Bucket: bucket, Key: thumbnailKey }).promise();
              console.log(`Deleted thumbnail image from S3: ${thumbnailKey}`);
            }
          }
          
          // Delete medium image
          if (deletedImage.medium_url) {
            const mediumKey = getS3KeyFromUrl(deletedImage.medium_url);
            if (mediumKey) {
              await s3.deleteObject({ Bucket: bucket, Key: mediumKey }).promise();
              console.log(`Deleted medium image from S3: ${mediumKey}`);
            }
          }
          
          // Delete large image
          if (deletedImage.large_url) {
            const largeKey = getS3KeyFromUrl(deletedImage.large_url);
            if (largeKey) {
              await s3.deleteObject({ Bucket: bucket, Key: largeKey }).promise();
              console.log(`Deleted large image from S3: ${largeKey}`);
            }
          }
          
        } catch (err) {
          console.error('Error deleting image from S3:', err);
          // Continue even if S3 deletion fails
        }
      } else {
        // Fallback for local files (legacy support)
        try {
          const baseDir = path.join(__dirname, '../../../uploads/parts', partId.toString());
          const filename = path.basename(deletedImage.image_url);
          
          await fs.unlink(path.join(baseDir, filename)).catch(err => console.log('File not found:', err.message));
          await fs.unlink(path.join(baseDir, 'thumbnails', filename)).catch(err => console.log('Thumbnail not found:', err.message));
          await fs.unlink(path.join(baseDir, 'medium', filename)).catch(err => console.log('Medium not found:', err.message));
          await fs.unlink(path.join(baseDir, 'large', filename)).catch(err => console.log('Large not found:', err.message));
        } catch (err) {
          console.error('Error deleting local image files:', err);
          // Continue even if local file deletion fails
        }
      }
      
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting image:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get parts for a specific seller
  async getByUserId(req, res) {
    try {
      const { userId } = req.params;
      
      const filters = {
        ...req.query,
        sellerId: userId,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10
      };
      
      const result = await PartSearch.search(filters);
      
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error getting user parts:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get brands
  async getBrands(req, res) {
    try {
      const brands = await PartModel.getBrands();
      res.status(200).json({
        success: true,
        brands
      });
    } catch (error) {
      console.error('Error getting brands:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get models for a specific brand
  async getModelsByBrand(req, res) {
    try {
      const { brandId } = req.params;
      const models = await PartModel.getModelsByBrand(brandId);
      res.status(200).json({
        success: true,
        models
      });
    } catch (error) {
      console.error('Error getting models by brand:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  
  // Get categories
  async getCategories(req, res) {
    try {
      const categories = await PartModel.getCategories();
      res.status(200).json({
        success: true,
        categories
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all part categories
  async getPartCategories(req, res) {
    try {
      const categories = await PartModel.getPartCategories();
      res.status(200).json({
        success: true,
        categories
      });
    } catch (error) {
      console.error('Error getting part categories:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PartsController();
