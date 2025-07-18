const { pg: pool } = require('../../../config/db.config');

const TABLE = 'advertisements';

async function getAllAdvertisements() {
  const result = await pool.query(`SELECT * FROM ${TABLE} ORDER BY created_at DESC`);
  return result.rows;
}

async function getActiveAdvertisements() {
  const currentDate = new Date().toISOString().split('T')[0];
  const result = await pool.query(
    `SELECT * FROM ${TABLE} 
     WHERE is_active = true 
     AND start_date <= $1 
     AND end_date >= $1 
     ORDER BY created_at DESC`,
    [currentDate]
  );
  return result.rows;
}

async function getActiveAdvertisementsByPlacement(placement) {
  const currentDate = new Date().toISOString().split('T')[0];
  const result = await pool.query(
    `SELECT * FROM ${TABLE} 
     WHERE is_active = true 
     AND placement = $1 
     AND start_date <= $2 
     AND end_date >= $2 
     ORDER BY created_at DESC`,
    [placement, currentDate]
  );
  return result.rows;
}

async function getAdvertisementById(id) {
  const result = await pool.query(`SELECT * FROM ${TABLE} WHERE id = $1`, [id]);
  return result.rows[0];
}

async function createAdvertisement(advertisementData) {
  const { title, image_url, link_url, placement, start_date, end_date, is_active } = advertisementData;
  
  const result = await pool.query(
    `INSERT INTO ${TABLE} (title, image_url, link_url, placement, start_date, end_date, is_active, impressions, clicks) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0, 0) RETURNING id`,
    [title, image_url, link_url, placement, start_date, end_date, is_active]
  );
  
  const id = result.rows[0].id;
  return getAdvertisementById(id);
}

async function updateAdvertisement(id, advertisementData) {
  const { title, image_url, link_url, placement, start_date, end_date, is_active } = advertisementData;
  
  await pool.query(
    `UPDATE ${TABLE} 
     SET title = $1, 
         image_url = $2, 
         link_url = $3, 
         placement = $4, 
         start_date = $5, 
         end_date = $6, 
         is_active = $7,
         updated_at = NOW()
     WHERE id = $8`,
    [title, image_url, link_url, placement, start_date, end_date, is_active, id]
  );
  
  return getAdvertisementById(id);
}

async function deleteAdvertisement(id) {
  await pool.query(`DELETE FROM ${TABLE} WHERE id = $1`, [id]);
  return true;
}

async function recordImpression(id) {
  await pool.query(
    `UPDATE ${TABLE} SET impressions = impressions + 1 WHERE id = $1`,
    [id]
  );
  return true;
}

async function recordClick(id) {
  await pool.query(
    `UPDATE ${TABLE} SET clicks = clicks + 1 WHERE id = $1`,
    [id]
  );
  return true;
}

async function getAdvertisementAnalytics(id) {
  const result = await pool.query(
    `SELECT id, title, placement, impressions, clicks, 
     CASE 
       WHEN impressions > 0 THEN ROUND((clicks::numeric / impressions::numeric) * 100, 2)
       ELSE 0
     END as ctr 
     FROM ${TABLE} 
     WHERE id = $1`,
    [id]
  );
  return result.rows[0];
}

async function getAllAdvertisementsAnalytics() {
  const result = await pool.query(
    `SELECT id, title, placement, impressions, clicks, 
     CASE 
       WHEN impressions > 0 THEN ROUND((clicks::numeric / impressions::numeric) * 100, 2)
       ELSE 0
     END as ctr,
     start_date, end_date, is_active 
     FROM ${TABLE} 
     ORDER BY created_at DESC`
  );
  return result.rows;
}

module.exports = {
  getAllAdvertisements,
  getActiveAdvertisements,
  getActiveAdvertisementsByPlacement,
  getAdvertisementById,
  createAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  recordImpression,
  recordClick,
  getAdvertisementAnalytics,
  getAllAdvertisementsAnalytics
};
