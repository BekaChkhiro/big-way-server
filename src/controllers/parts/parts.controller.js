const { PartModel, PartCreate, PartSearch, PartUpdate } = require('../../models/part');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { promisify } = require('util');
const sharp = require('sharp');

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const uploadDir = path.join(__dirname, '../../../uploads/parts');
      
      // Check if directory exists, create it if it doesn't
      try {
        await fs.access(uploadDir);
      } catch (error) {
        await fs.mkdir(uploadDir, { recursive: true });
      }
      
      cb(null, uploadDir);
    } catch (error) {
      cb(error, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF|webp|WEBP)$/)) {
    req.fileValidationError = 'Only image files are allowed!';
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

class PartsController {
  // Create a new part
  async create(req, res) {
    try {
      const uploadMiddleware = promisify(upload.array('images', 10));
      await uploadMiddleware(req, res);

      const partData = JSON.parse(req.body.partData || '{}');
      const images = req.files;
      const sellerId = req.user.id;
      
      // Create the upload directories for processed images
      const baseDir = path.join(__dirname, '../../../uploads/parts');
      const processedImages = [];
      
      // Only process images if there are any
      if (images && images.length > 0) {
        // Process the uploaded images (create thumbnails, etc.)
        for (const image of images) {
          const filename = path.basename(image.path);
          const partUploadDir = path.join(baseDir, 'temp'); // Temporary directory
          
          // Create directories if they don't exist
          await fs.mkdir(partUploadDir, { recursive: true });
          await fs.mkdir(path.join(partUploadDir, 'thumbnails'), { recursive: true });
          await fs.mkdir(path.join(partUploadDir, 'medium'), { recursive: true });
          await fs.mkdir(path.join(partUploadDir, 'large'), { recursive: true });
          
          // Process the images
          const imageBuffer = await fs.readFile(image.path);
          
          // Create thumbnail
          await sharp(imageBuffer)
            .resize(150, 150, { fit: 'inside' })
            .toFile(path.join(partUploadDir, 'thumbnails', filename));
          
          // Create medium size
          await sharp(imageBuffer)
            .resize(600, 600, { fit: 'inside' })
            .toFile(path.join(partUploadDir, 'medium', filename));
          
          // Create large size
          await sharp(imageBuffer)
            .resize(1200, 1200, { fit: 'inside' })
            .toFile(path.join(partUploadDir, 'large', filename));
          
          // Add to processed images
          processedImages.push({
            image_url: `/uploads/parts/temp/${filename}`,
            thumbnail_url: `/uploads/parts/temp/thumbnails/${filename}`,
            medium_url: `/uploads/parts/temp/medium/${filename}`,
            large_url: `/uploads/parts/temp/large/${filename}`
          });
        }
      }
      
      const part = await PartCreate.create(partData, images, sellerId, processedImages);
      
      // Move images from temp directory to part's directory
      if (part && part.id && images && images.length > 0) {
        const partUploadDir = path.join(baseDir, part.id.toString());
        
        // Create directories if they don't exist
        await fs.mkdir(partUploadDir, { recursive: true });
        await fs.mkdir(path.join(partUploadDir, 'thumbnails'), { recursive: true });
        await fs.mkdir(path.join(partUploadDir, 'medium'), { recursive: true });
        await fs.mkdir(path.join(partUploadDir, 'large'), { recursive: true });
        
        // Move files from temp to part directory
        for (const image of processedImages) {
          const filename = path.basename(image.image_url);
          
          await fs.rename(
            path.join(baseDir, 'temp', filename),
            path.join(partUploadDir, filename)
          );
          
          await fs.rename(
            path.join(baseDir, 'temp', 'thumbnails', filename),
            path.join(partUploadDir, 'thumbnails', filename)
          );
          
          await fs.rename(
            path.join(baseDir, 'temp', 'medium', filename),
            path.join(partUploadDir, 'medium', filename)
          );
          
          await fs.rename(
            path.join(baseDir, 'temp', 'large', filename),
            path.join(partUploadDir, 'large', filename)
          );
        }
      }

      res.status(201).json({
        success: true,
        part
      });
    } catch (error) {
      console.error('Error creating part:', error);
      res.status(400).json({
        success: false,
        message: error.message
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

      const partData = JSON.parse(req.body.partData || '{}');
      const images = req.files;
      
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

      // Process images if any
      const processedImages = [];
      
      if (images && images.length > 0) {
        const baseDir = path.join(__dirname, '../../../uploads/parts');
        const partUploadDir = path.join(baseDir, id.toString());
        
        // Create directories if they don't exist
        await fs.mkdir(partUploadDir, { recursive: true });
        await fs.mkdir(path.join(partUploadDir, 'thumbnails'), { recursive: true });
        await fs.mkdir(path.join(partUploadDir, 'medium'), { recursive: true });
        await fs.mkdir(path.join(partUploadDir, 'large'), { recursive: true });
        
        // Process the uploaded images
        for (const image of images) {
          const filename = path.basename(image.path);
          
          // Process the images
          const imageBuffer = await fs.readFile(image.path);
          
          // Create thumbnail
          await sharp(imageBuffer)
            .resize(150, 150, { fit: 'inside' })
            .toFile(path.join(partUploadDir, 'thumbnails', filename));
          
          // Create medium size
          await sharp(imageBuffer)
            .resize(600, 600, { fit: 'inside' })
            .toFile(path.join(partUploadDir, 'medium', filename));
          
          // Create large size
          await sharp(imageBuffer)
            .resize(1200, 1200, { fit: 'inside' })
            .toFile(path.join(partUploadDir, 'large', filename));
          
          // Add to processed images
          processedImages.push({
            image_url: `/uploads/parts/${id}/${filename}`,
            thumbnail_url: `/uploads/parts/${id}/thumbnails/${filename}`,
            medium_url: `/uploads/parts/${id}/medium/${filename}`,
            large_url: `/uploads/parts/${id}/large/${filename}`
          });
        }
      }

      const updatedPart = await PartUpdate.update(id, partData, images, processedImages);
      
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
      
      // Delete the file from filesystem
      try {
        const baseDir = path.join(__dirname, '../../../uploads/parts', partId.toString());
        const filename = path.basename(deletedImage.image_url);
        
        await fs.unlink(path.join(baseDir, filename));
        await fs.unlink(path.join(baseDir, 'thumbnails', filename));
        await fs.unlink(path.join(baseDir, 'medium', filename));
        await fs.unlink(path.join(baseDir, 'large', filename));
      } catch (err) {
        console.error('Error deleting image files:', err);
        // Continue even if file deletion fails
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
