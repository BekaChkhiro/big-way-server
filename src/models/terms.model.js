const { pg: db } = require('../../config/db.config');

class TermsModel {
  static async getTerms() {
    try {
      const query = `
        SELECT id, title, content, section_order, created_at, updated_at 
        FROM terms_and_conditions 
        ORDER BY section_order ASC
      `;
      const result = await db.query(query);
      return result.rows;
    } catch (error) {
      throw new Error('Error fetching terms: ' + error.message);
    }
  }

  static async getTermById(id) {
    try {
      const query = `
        SELECT id, title, content, section_order, created_at, updated_at 
        FROM terms_and_conditions 
        WHERE id = $1
      `;
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error fetching term by ID: ' + error.message);
    }
  }

  static async createTerm(termData) {
    try {
      const { title, content, section_order } = termData;
      const query = `
        INSERT INTO terms_and_conditions (title, content, section_order, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING id, title, content, section_order, created_at, updated_at
      `;
      const result = await db.query(query, [title, content, section_order]);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error creating term: ' + error.message);
    }
  }

  static async updateTerm(id, termData) {
    try {
      const { title, content, section_order } = termData;
      const query = `
        UPDATE terms_and_conditions 
        SET title = $1, content = $2, section_order = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING id, title, content, section_order, created_at, updated_at
      `;
      const result = await db.query(query, [title, content, section_order, id]);
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