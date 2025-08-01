const TermsModel = require('../models/terms.model');

class TermsController {
  static async getTerms(req, res) {
    try {
      const { lang } = req.query;
      const language = lang || 'ka'; // Default to Georgian
      const terms = await TermsModel.getTerms(language);
      res.status(200).json({
        success: true,
        data: terms
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching terms and conditions',
        error: error.message
      });
    }
  }

  static async getTermById(req, res) {
    try {
      const { id } = req.params;
      const { lang } = req.query;
      const language = lang || 'ka'; // Default to Georgian
      const term = await TermsModel.getTermById(id, language);
      
      if (!term) {
        return res.status(404).json({
          success: false,
          message: 'Term not found'
        });
      }

      res.status(200).json({
        success: true,
        data: term
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error fetching term',
        error: error.message
      });
    }
  }

  static async createTerm(req, res) {
    try {
      const { 
        title_ka, title_en, title_ru,
        content_ka, content_en, content_ru,
        section_order 
      } = req.body;

      if (!title_ka) {
        return res.status(400).json({
          success: false,
          message: 'Georgian title are required'
        });
      }

      const newTerm = await TermsModel.createTerm({
        title_ka,
        title_en: title_en || null,
        title_ru: title_ru || null,
        content_ka,
        content_en: content_en || null,
        content_ru: content_ru || null,
        section_order: section_order || 0
      });

      res.status(201).json({
        success: true,
        data: newTerm,
        message: 'Term created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error creating term',
        error: error.message
      });
    }
  }

  static async updateTerm(req, res) {
    try {
      const { id } = req.params;
      const { 
        title_ka, title_en, title_ru,
        content_ka, content_en, content_ru,
        section_order 
      } = req.body;

      if (!title_ka) {
        return res.status(400).json({
          success: false,
          message: 'Georgian title are required'
        });
      }

      const updatedTerm = await TermsModel.updateTerm(id, {
        title_ka,
        title_en: title_en || null,
        title_ru: title_ru || null,
        content_ka,
        content_en: content_en || null,
        content_ru: content_ru || null,
        section_order
      });

      if (!updatedTerm) {
        return res.status(404).json({
          success: false,
          message: 'Term not found'
        });
      }

      res.status(200).json({
        success: true,
        data: updatedTerm,
        message: 'Term updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error updating term',
        error: error.message
      });
    }
  }

  static async deleteTerm(req, res) {
    try {
      const { id } = req.params;
      const deleted = await TermsModel.deleteTerm(id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Term not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Term deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error deleting term',
        error: error.message
      });
    }
  }
}

module.exports = TermsController;