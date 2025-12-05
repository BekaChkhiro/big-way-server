const { PartModel, PartCreate, PartSearch, PartUpdate } = require('../../models/part');
const { pg: pool } = require('../../../config/db.config');
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
      console.log('============= STARTING PART CREATION =============');
      const uploadMiddleware = promisify(upload.array('images', 10));
      await uploadMiddleware(req, res);

      console.log('Request body keys:', Object.keys(req.body));
      console.log('Raw partData from request:', req.body.partData);
      console.log('Files received:', req.files ? req.files.length : 0);
      
      if (req.files && req.files.length > 0) {
        console.log('Files details:');
        req.files.forEach((file, index) => {
          console.log(`File ${index}: ${file.originalname}, mimetype: ${file.mimetype}, size: ${file.size} bytes`);
        });
      } else {
        console.log('No files received in the request');
      }
      
      let partData;
      try {
        partData = typeof req.body.partData === 'string' 
          ? JSON.parse(req.body.partData) 
          : req.body.partData || {};
      } catch (err) {
        console.error('Error parsing partData:', err);
        throw new Error(`Failed to parse part data: ${err.message}`);
      }
      
      console.log('Parsed partData:', JSON.stringify(partData, null, 2));
      
      // Ensure all numeric fields are actually numbers
      if (partData.category_id) partData.category_id = Number(partData.category_id);
      if (partData.brand_id) partData.brand_id = Number(partData.brand_id);
      if (partData.model_id) partData.model_id = Number(partData.model_id);
      if (partData.price) partData.price = Number(partData.price);
      
      console.log('After conversion - category_id:', partData.category_id, 'type:', typeof partData.category_id);
      console.log('After conversion - brand_id:', partData.brand_id, 'type:', typeof partData.brand_id);
      console.log('After conversion - model_id:', partData.model_id, 'type:', typeof partData.model_id);
      
      // Verify category exists in part_categories table
      const categoryCheck = await pool.query('SELECT * FROM part_categories WHERE id = $1', [partData.category_id]);
      console.log('Category check result:', categoryCheck.rows);
      
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
          console.log('Images to process:', images.length);
          // Use the upload middleware's processAndUpload function to handle AWS S3 uploads
          const awsUploadResults = await processAndUpload(images);
          console.log('AWS upload results count:', awsUploadResults.length);
          console.log('AWS upload results:', JSON.stringify(awsUploadResults, null, 2));
          
          // Format the image URLs for the database
          processedImages = awsUploadResults.map((result, index) => {
            // Parse featuredImageIndex as a number to ensure correct comparison
            const featuredIndex = parseInt(partData.featuredImageIndex, 10);
            // Check if featuredImageIndex is specified and use it to determine primary image
            const isPrimary = !isNaN(featuredIndex) ? 
              index === featuredIndex : 
              index === 0; // Default to first image if not specified
              
            console.log(`Image ${index} isPrimary: ${isPrimary}, featuredIndex: ${featuredIndex}`);
            
            if (!result.original || !result.thumbnail || !result.medium || !result.large) {
              console.error(`Missing image URLs for image ${index}:`, result);
              throw new Error(`Failed to process image ${index}: Missing URL`);  
            }
            
            // Each result directly contains the URLs at the top level
            return {
              image_url: result.original,
              thumbnail_url: result.thumbnail,
              medium_url: result.medium,
              large_url: result.large,
              is_primary: isPrimary
            };
          });
          
          console.log('Processed image count:', processedImages.length);
          console.log('Processed image URLs:', JSON.stringify(processedImages, null, 2));
          
          if (processedImages.length === 0) {
            throw new Error('No images were successfully processed');
          }
        } catch (uploadError) {
          console.error('Error uploading images to AWS S3:', uploadError);
          throw new Error(`Failed to upload images: ${uploadError.message}`);
        }
      }
      
      // Ensure featuredImageIndex is properly passed to the part creation
      if (partData.featuredImageIndex !== undefined) {
        // Make sure it's a number
        partData.featuredImageIndex = parseInt(partData.featuredImageIndex, 10);
        console.log('Using featuredImageIndex:', partData.featuredImageIndex);
      } else {
        console.log('No featuredImageIndex provided, defaulting to 0');
        partData.featuredImageIndex = 0;
      }
      
      // Double-check that we have processed images
      if (processedImages.length === 0 && images && images.length > 0) {
        console.error('No processed images but we had files. This is a critical error.');
        throw new Error('Failed to process images. Please try again.');
      }
      
      // Create the part with AWS S3 image URLs
      console.log('Creating part with processed images:', processedImages.length);
      const part = await PartCreate.create(partData, [], sellerId, processedImages);
      console.log('Part created successfully:', part.id);

      res.status(201).json({
        success: true,
        part
      });
      console.log('============= PART CREATION COMPLETE =============');
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
            // Each result contains the URLs directly
            return {
              image_url: result.original,
              thumbnail_url: result.thumbnail,
              medium_url: result.medium,
              large_url: result.large,
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

  // Increment view count for a part
  async incrementViews(req, res) {
    try {
      const { id } = req.params;
      const viewsCount = await PartModel.incrementViews(id);

      res.status(200).json({
        success: true,
        views_count: viewsCount
      });
    } catch (error) {
      console.error('Error incrementing part views:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Purchase VIP status for a part using balance
  async purchaseVipStatus(req, res) {
    const { partId, vipStatus, days, colorHighlighting, colorHighlightingDays, autoRenewal, autoRenewalDays } = req.body;
    const userId = req.user.id;
    
    console.log('Parts VIP purchase request:', { partId, vipStatus, days, colorHighlighting, colorHighlightingDays, autoRenewal, autoRenewalDays, userId });
    
    // Validate and process days parameter
    const daysNumber = Number(days);
    const validDays = Math.max(1, Math.round(daysNumber));
    
    if (!vipStatus || isNaN(daysNumber) || daysNumber <= 0) {
      console.log('Invalid request parameters:', { vipStatus, days, daysNumber });
      return res.status(400).json({ message: 'Invalid request parameters' });
    }
    
    // Validate VIP status
    const validVipStatuses = ['none', 'vip', 'vip_plus', 'super_vip'];
    if (!validVipStatuses.includes(vipStatus)) {
      return res.status(400).json({ 
        message: `Invalid VIP status. Valid options are: ${validVipStatuses.join(', ')}` 
      });
    }
    
    try {
      // Start database transaction using dedicated client connection
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
      
        // Check if part exists and belongs to user
        const partQuery = `SELECT id, title, seller_id FROM parts WHERE id = $1`;
        const partResult = await client.query(partQuery, [partId]);
        
        if (partResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: 'Part not found' });
        }
        
        const part = partResult.rows[0];
        if (part.seller_id !== userId) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'Part does not belong to user' });
        }
      
      // Get role-based pricing from database
      const VipPricing = require('../../models/VipPricing');
      const userRole = req.user?.role || 'user';
      
      let pricePerDay = 0;
      try {
        // Fetch the price for this specific VIP status and user role for parts category
        const vipPricing = await VipPricing.findByServiceType(vipStatus, userRole, 'parts');
        pricePerDay = vipPricing ? vipPricing.price : 0;
        
        console.log(`Charging user with role ${userRole} price ${pricePerDay} for VIP status ${vipStatus}`);
      } catch (error) {
        console.error('Error fetching VIP pricing:', error);
        // Fall back to role-based default pricing
        const fallbackPrices = {
          'none': 0,
          'vip': userRole === 'dealer' ? 1.5 : userRole === 'autosalon' ? 1.8 : 2,
          'vip_plus': userRole === 'dealer' ? 3.75 : userRole === 'autosalon' ? 4.5 : 5,
          'super_vip': userRole === 'dealer' ? 5.25 : userRole === 'autosalon' ? 6.3 : 7
        };
        pricePerDay = fallbackPrices[vipStatus] || 0;
        console.log(`Using fallback price ${pricePerDay} for role ${userRole} and VIP status ${vipStatus}`);
      }
      
      // Calculate base VIP price
      const baseVipPrice = pricePerDay * validDays;
      
      // Get role-based additional services pricing from database
      let colorHighlightingPrice = 0.5; // Default fallback
      let autoRenewalPrice = 0.5; // Default fallback
      
      try {
        const colorHighlightingPricing = await VipPricing.findByServiceType('color_highlighting', userRole, 'parts');
        const autoRenewalPricing = await VipPricing.findByServiceType('auto_renewal', userRole, 'parts');
        
        if (colorHighlightingPricing) {
          colorHighlightingPrice = colorHighlightingPricing.price;
        }
        if (autoRenewalPricing) {
          autoRenewalPrice = autoRenewalPricing.price;
        }
        
        console.log(`Additional services pricing for role ${userRole}: color highlighting ${colorHighlightingPrice}, auto renewal ${autoRenewalPrice}`);
      } catch (error) {
        console.error('Error fetching additional services pricing:', error);
        // Using fallback prices already set above
      }

      // Calculate additional services cost
      let additionalServicesCost = 0;
      if (colorHighlighting) {
        const colorDays = Number(colorHighlightingDays) || validDays;
        additionalServicesCost += colorHighlightingPrice * colorDays;
      }
      if (autoRenewal) {
        const renewalDays = Number(autoRenewalDays) || validDays;
        additionalServicesCost += autoRenewalPrice * renewalDays;
      }
      
      // Calculate total price
      const totalPrice = baseVipPrice + additionalServicesCost;
      
        // Validate that if VIP status is 'none', at least some additional services are selected
        if (vipStatus === 'none' && additionalServicesCost === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            message: 'At least one service must be selected (VIP package or additional services)' 
          });
        }
      
      console.log('Parts VIP price calculation:', {
        pricePerDay,
        validDays,
        baseVipPrice,
        additionalServicesCost,
        totalPrice
      });
      
        // Check user balance
        const balanceQuery = `SELECT balance, balance::text as balance_text FROM users WHERE id = $1 FOR UPDATE`;
        const balanceResult = await client.query(balanceQuery, [userId]);
        
        if (balanceResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: 'User not found' });
        }
        
        const currentBalance = balanceResult.rows[0].balance;
        
        if (currentBalance < totalPrice) {
          await client.query('ROLLBACK');
          return res.status(400).json({ 
            message: 'Insufficient balance',
            requiredAmount: totalPrice,
            currentBalance: currentBalance
          });
        }
      
      // Deduct from balance
      console.log('BEFORE BALANCE UPDATE:');
      console.log('- User ID:', userId);
      console.log('- Current Balance:', currentBalance);
      console.log('- Amount to Deduct:', totalPrice);
      console.log('- Amount Type:', typeof totalPrice);
      
        const updateBalanceQuery = `UPDATE users SET balance = balance - $1 WHERE id = $2 RETURNING balance`;
        const updateBalanceResult = await client.query(updateBalanceQuery, [totalPrice, userId]);
      
      console.log('UPDATE BALANCE RESULT:');
      console.log('- Rows affected:', updateBalanceResult.rowCount);
      console.log('- Result rows:', updateBalanceResult.rows);
      
      if (updateBalanceResult.rows.length === 0) {
        throw new Error('Failed to update user balance - no rows returned');
      }
      
      const newBalance = updateBalanceResult.rows[0].balance;
      const actualDeduction = currentBalance - newBalance;
      
      console.log('AFTER BALANCE UPDATE:');
      console.log('- New Balance:', newBalance);
      console.log('- Expected Deduction:', totalPrice);
      console.log('- Actual Deduction:', actualDeduction);
      console.log('- Deduction Match:', Math.abs(actualDeduction - totalPrice) < 0.01);
      
      // Calculate expiration date
      const expirationDate = new Date();
      expirationDate.setHours(23, 59, 59, 999);
      expirationDate.setDate(expirationDate.getDate() + validDays);
      
        // Use the same date format as cars (working implementation)
        const formattedExpirationDate = expirationDate.toISOString();
      
      // Update part VIP status using the model method
      let updateResult;
      try {
        console.log('ATTEMPTING VIP STATUS UPDATE...');
        console.log('- Part ID:', partId);
        console.log('- VIP Status:', vipStatus);
        console.log('- Formatted Expiration Date:', formattedExpirationDate);
        
        if (vipStatus !== 'none') {
          updateResult = await PartModel.updateVipStatus(partId, vipStatus, formattedExpirationDate);
          console.log('VIP STATUS UPDATE SUCCESSFUL:', updateResult);
        } else {
          // For 'none' status, just get the part data
          updateResult = {
            id: partId,
            vip_status: 'none',
            vip_expiration_date: null,
            vip_active: false
          };
          console.log('VIP STATUS SET TO NONE:', updateResult);
        }
      } catch (vipError) {
        console.error('VIP STATUS UPDATE FAILED:', vipError);
        console.log('VIP status update error (continuing with transaction recording):', vipError.message);
        // Since VIP update failed, we should rollback the entire transaction
        throw vipError; // This will cause the transaction to rollback
      }
      
      // Update color highlighting settings if color highlighting is enabled
      if (colorHighlighting && colorHighlightingDays > 0) {
        try {
          console.log(`Setting up color highlighting for part ${partId}: ${colorHighlightingDays} days`);
          
          // Calculate color highlighting expiration date
          const colorHighlightingExpirationDate = new Date();
          colorHighlightingExpirationDate.setHours(23, 59, 59, 999);
          colorHighlightingExpirationDate.setDate(colorHighlightingExpirationDate.getDate() + colorHighlightingDays);
          
          const colorHighlightingUpdateQuery = `
            UPDATE parts 
            SET 
              color_highlighting_enabled = $1,
              color_highlighting_expiration_date = $2,
              color_highlighting_total_days = $3,
              color_highlighting_remaining_days = $4
            WHERE id = $5
          `;
          
          await client.query(colorHighlightingUpdateQuery, [
            true, // color_highlighting_enabled
            colorHighlightingExpirationDate.toISOString(), // when color highlighting service expires
            colorHighlightingDays, // total days purchased
            colorHighlightingDays, // remaining days (initially same as total)
            partId
          ]);
          
          console.log(`✓ Color highlighting configured for part ${partId} - ${colorHighlightingDays} days`);
          
        } catch (colorHighlightingError) {
          console.error('Error setting up color highlighting (continuing with VIP purchase):', colorHighlightingError.message);
          // Don't fail the entire purchase if color highlighting setup fails
        }
      }

      // Update auto-renewal settings if auto-renewal is enabled
      if (autoRenewal && autoRenewalDays > 0) {
        try {
          console.log(`Setting up auto-renewal for part ${partId}: ${autoRenewalDays} days`);
          
          // Calculate auto-renewal expiration date
          const autoRenewalExpirationDate = new Date();
          autoRenewalExpirationDate.setHours(23, 59, 59, 999);
          autoRenewalExpirationDate.setDate(autoRenewalExpirationDate.getDate() + autoRenewalDays);
          
          const autoRenewalUpdateQuery = `
            UPDATE parts 
            SET 
              auto_renewal_enabled = $1,
              auto_renewal_days = $2,
              auto_renewal_expiration_date = $3,
              auto_renewal_total_days = $4,
              auto_renewal_remaining_days = $5
            WHERE id = $6
          `;
          
          await client.query(autoRenewalUpdateQuery, [
            true, // auto_renewal_enabled
            autoRenewalDays, // auto_renewal_days (how often to refresh)
            autoRenewalExpirationDate.toISOString(), // when auto-renewal service expires
            autoRenewalDays, // total days purchased
            autoRenewalDays, // remaining days (initially same as total)
            partId
          ]);
          
          console.log(`✓ Auto-renewal configured for part ${partId} - ${autoRenewalDays} days`);
          
        } catch (autoRenewalError) {
          console.error('Error setting up auto-renewal (continuing with VIP purchase):', autoRenewalError.message);
          // Don't fail the entire purchase if auto-renewal setup fails
        }
      }
      
      // Create transaction description
      let transactionDescription = `Part VIP Purchase - Part #${partId}\n`;
      if (vipStatus !== 'none') {
        transactionDescription += `${vipStatus.toUpperCase().replace('_', ' ')} Package (${validDays} day${validDays > 1 ? 's' : ''}): ${baseVipPrice.toFixed(2)} GEL`;
      } else {
        transactionDescription += `Standard Package (no VIP upgrade): ${baseVipPrice.toFixed(2)} GEL`;
      }
      
      if (colorHighlighting || autoRenewal) {
        transactionDescription += `\nAdditional Services:`;
        
        if (colorHighlighting) {
          const colorDays = Number(colorHighlightingDays) || validDays;
          const colorCost = 0.5 * colorDays;
          transactionDescription += `\n• Color Highlighting (${colorDays} day${colorDays > 1 ? 's' : ''}): ${colorCost.toFixed(2)} GEL`;
        }
        
        if (autoRenewal) {
          const renewalDays = Number(autoRenewalDays) || validDays;
          const renewalCost = 0.5 * renewalDays;
          transactionDescription += `\n• Auto Renewal (${renewalDays} day${renewalDays > 1 ? 's' : ''}): ${renewalCost.toFixed(2)} GEL`;
        }
      }
      
      transactionDescription += `\nTotal Amount: ${totalPrice.toFixed(2)} GEL`;
      
      // Record transaction
      console.log('RECORDING TRANSACTION...');
      const transactionQuery = `
        INSERT INTO balance_transactions (user_id, amount, transaction_type, description, status, reference_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
        const transactionResult = await client.query(transactionQuery, [
          userId,
          -totalPrice, // Negative amount for deduction
          'part_vip_purchase',
          transactionDescription,
          'completed',
          partId
        ]);
        console.log('TRANSACTION RECORDED WITH ID:', transactionResult.rows[0]?.id);
        
        // Commit transaction
        console.log('COMMITTING TRANSACTION...');
        await client.query('COMMIT');
        console.log('TRANSACTION COMMITTED SUCCESSFULLY');
        
        // Verify balance after commit
        const verifyBalanceQuery = `SELECT balance FROM users WHERE id = $1`;
        const verifyResult = await client.query(verifyBalanceQuery, [userId]);
        console.log('FINAL BALANCE VERIFICATION:', verifyResult.rows[0]?.balance);
        
        // Verify VIP status was saved
        const verifyVipQuery = `SELECT id, vip_status, vip_expiration_date, vip_active FROM parts WHERE id = $1`;
        const verifyVipResult = await client.query(verifyVipQuery, [partId]);
        console.log('FINAL VIP STATUS VERIFICATION:', verifyVipResult.rows[0]);
      
      // Return success response
      const response = {
        success: true,
        newBalance: newBalance,
        vipStatus: updateResult.vip_status,
        vipExpiration: updateResult.vip_expiration_date,
        message: `Successfully purchased ${vipStatus} status for ${validDays} days`,
        daysRequested: validDays,
        totalPrice: totalPrice,
        deductedAmount: currentBalance - newBalance,
        priceInfo: {
          pricePerDay,
          days: validDays,
          baseVipPrice,
          additionalServicesCost,
          totalPrice
        }
      };
      
        console.log('Parts VIP purchase successful:', response);
        return res.status(200).json(response);
        
      } catch (error) {
        console.error('Transaction error:', error);
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('Error purchasing VIP status for part:', error);
      return res.status(500).json({ message: 'Server error while purchasing VIP status' });
    }
  }
}

module.exports = new PartsController();
