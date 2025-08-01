const { pg: db } = require('../../config/db.config');

class TermsModel {
  static async getTerms(language = 'ka') {
    try {
      const query = `
        SELECT 
          id, 
          title_ka, title_en, title_ru,
          content_ka, content_en, content_ru,
          section_order, 
          created_at, 
          updated_at 
        FROM terms_and_conditions 
        ORDER BY section_order ASC
      `;
      const result = await db.query(query);
      
      // Return formatted terms with current language and fallback logic
      return result.rows.map(term => ({
        id: term.id,
        title: term[`title_${language}`] || term.title_ka || term.title_en || term.title_ru || '',
        content: term[`content_${language}`] || term.content_ka || term.content_en || term.content_ru || '',
        title_ka: term.title_ka,
        title_en: term.title_en,
        title_ru: term.title_ru,
        content_ka: term.content_ka,
        content_en: term.content_en,
        content_ru: term.content_ru,
        section_order: term.section_order,
        created_at: term.created_at,
        updated_at: term.updated_at
      }));
    } catch (error) {
      throw new Error('Error fetching terms: ' + error.message);
    }
  }

  static async getTermById(id, language = 'ka') {
    try {
      const query = `
        SELECT 
          id, 
          title_ka, title_en, title_ru,
          content_ka, content_en, content_ru,
          section_order, 
          created_at, 
          updated_at 
        FROM terms_and_conditions 
        WHERE id = $1
      `;
      const result = await db.query(query, [id]);
      const term = result.rows[0];
      
      if (!term) return null;
      
      return {
        id: term.id,
        title: term[`title_${language}`] || term.title_ka || term.title_en || term.title_ru || '',
        content: term[`content_${language}`] || term.content_ka || term.content_en || term.content_ru || '',
        title_ka: term.title_ka,
        title_en: term.title_en,
        title_ru: term.title_ru,
        content_ka: term.content_ka,
        content_en: term.content_en,
        content_ru: term.content_ru,
        section_order: term.section_order,
        created_at: term.created_at,
        updated_at: term.updated_at
      };
    } catch (error) {
      throw new Error('Error fetching term by ID: ' + error.message);
    }
  }

  static async createTerm(termData) {
    try {
      const { 
        title_ka, title_en, title_ru,
        content_ka, content_en, content_ru,
        section_order 
      } = termData;
      
      const query = `
        INSERT INTO terms_and_conditions (
          title_ka, title_en, title_ru,
          content_ka, content_en, content_ru,
          section_order, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING 
          id, 
          title_ka, title_en, title_ru,
          content_ka, content_en, content_ru,
          section_order, created_at, updated_at
      `;
      
      const result = await db.query(query, [
        title_ka, title_en, title_ru,
        content_ka, content_en, content_ru,
        section_order
      ]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error('Error creating term: ' + error.message);
    }
  }

  static async updateTerm(id, termData) {
    try {
      const { 
        title_ka, title_en, title_ru,
        content_ka, content_en, content_ru,
        section_order 
      } = termData;
      
      const query = `
        UPDATE terms_and_conditions 
        SET 
          title_ka = $1, title_en = $2, title_ru = $3,
          content_ka = $4, content_en = $5, content_ru = $6,
          section_order = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING 
          id, 
          title_ka, title_en, title_ru,
          content_ka, content_en, content_ru,
          section_order, created_at, updated_at
      `;
      
      const result = await db.query(query, [
        title_ka, title_en, title_ru,
        content_ka, content_en, content_ru,
        section_order, id
      ]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error('Error updating term: ' + error.message);
    }
  }

  static async deleteTerm(id) {
    try {
      const query = `DELETE FROM terms_and_conditions WHERE id = $1`;
      const result = await db.query(query, [id]);
      return result.rowCount > 0;
    } catch (error) {
      throw new Error('Error deleting term: ' + error.message);
    }
  }
}

module.exports = TermsModel;