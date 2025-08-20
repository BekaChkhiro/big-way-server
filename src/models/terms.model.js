const { pg: db } = require('../../config/db.config');

class TermsModel {
  static async getTerms(lang = 'ka') {
    try {
      const query = `
        SELECT 
          id, 
          title_ka, 
          title_en, 
          title_ru,
          content_ka, 
          content_en, 
          content_ru,
          section_order, 
          created_at, 
          updated_at,
          -- Dynamic title and content based on language
          CASE 
            WHEN $1 = 'en' AND title_en IS NOT NULL THEN title_en
            WHEN $1 = 'ru' AND title_ru IS NOT NULL THEN title_ru
            ELSE title_ka
          END as title,
          CASE 
            WHEN $1 = 'en' AND content_en IS NOT NULL THEN content_en
            WHEN $1 = 'ru' AND content_ru IS NOT NULL THEN content_ru
            ELSE content_ka
          END as content
        FROM terms_and_conditions 
        ORDER BY section_order ASC
      `;
      const result = await db.query(query, [lang]);
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching terms: ' + error.message);
    }
  }

  static async getTermById(id, lang = 'ka') {
    try {
      const query = `
        SELECT 
          id, 
          title_ka, 
          title_en, 
          title_ru,
          content_ka, 
          content_en, 
          content_ru,
          section_order, 
          created_at, 
          updated_at,
          -- Dynamic title and content based on language
          CASE 
            WHEN $2 = 'en' AND title_en IS NOT NULL THEN title_en
            WHEN $2 = 'ru' AND title_ru IS NOT NULL THEN title_ru
            ELSE title_ka
          END as title,
          CASE 
            WHEN $2 = 'en' AND content_en IS NOT NULL THEN content_en
            WHEN $2 = 'ru' AND content_ru IS NOT NULL THEN content_ru
            ELSE content_ka
          END as content
        FROM terms_and_conditions 
        WHERE id = $1
      `;
      const result = await db.query(query, [id, lang]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error fetching term by ID: ' + error.message);
    }
  }

  static async createTerm(termData) {
    try {
      const { title_ka, title_en, title_ru, content_ka, content_en, content_ru, section_order } = termData;
      const query = `
        INSERT INTO terms_and_conditions (
          title_ka, title_en, title_ru, 
          content_ka, content_en, content_ru, 
          section_order, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
        RETURNING 
          id, title_ka, title_en, title_ru, 
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
      const { title_ka, title_en, title_ru, content_ka, content_en, content_ru, section_order } = termData;
      const query = `
        UPDATE terms_and_conditions 
        SET 
          title_ka = $1, title_en = $2, title_ru = $3, 
          content_ka = $4, content_en = $5, content_ru = $6, 
          section_order = $7, updated_at = NOW()
        WHERE id = $8
        RETURNING 
          id, title_ka, title_en, title_ru, 
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