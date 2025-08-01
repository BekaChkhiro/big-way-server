/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
exports.shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  // Add language-specific columns to terms_and_conditions table
  pgm.addColumn('terms_and_conditions', {
    title_en: {
      type: 'varchar(500)',
      notNull: false
    },
    title_ru: {
      type: 'varchar(500)', 
      notNull: false
    },
    content_en: {
      type: 'text',
      notNull: false
    },
    content_ru: {
      type: 'text',
      notNull: false
    }
  });

  // Rename existing columns to be language-specific (Georgian)
  pgm.renameColumn('terms_and_conditions', 'title', 'title_ka');
  pgm.renameColumn('terms_and_conditions', 'content', 'content_ka');
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  // Rename columns back to original names
  pgm.renameColumn('terms_and_conditions', 'title_ka', 'title');
  pgm.renameColumn('terms_and_conditions', 'content_ka', 'content');

  // Drop language-specific columns
  pgm.dropColumn('terms_and_conditions', 'title_en', {
    ifExists: true
  });
  pgm.dropColumn('terms_and_conditions', 'title_ru', {
    ifExists: true
  });
  pgm.dropColumn('terms_and_conditions', 'content_en', {
    ifExists: true
  });
  pgm.dropColumn('terms_and_conditions', 'content_ru', {
    ifExists: true
  });
};