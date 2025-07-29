// Simple test endpoint to debug color highlighting
const express = require('express');
const { pg: pool } = require('./config/db.config');

const app = express();
app.use(express.json());

// Test endpoint to manually test color highlighting
app.post('/test-color-highlighting', async (req, res) => {
  console.log('🧪 Testing color highlighting with request:', req.body);
  
  const { carId, colorHighlightingDays = 7 } = req.body;
  
  if (!carId) {
    return res.status(400).json({ error: 'carId is required' });
  }
  
  try {
    // First check if the car exists
    const carCheck = await pool.query('SELECT id, brand, model FROM cars WHERE id = $1', [carId]);
    
    if (carCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    console.log('✅ Car found:', carCheck.rows[0]);
    
    // Check if color highlighting columns exist
    const columnCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'cars' 
      AND column_name IN ('color_highlighting_enabled', 'color_highlighting_expiration_date', 'color_highlighting_total_days', 'color_highlighting_remaining_days')
    `);
    
    console.log('📋 Color highlighting columns found:', columnCheck.rows.map(row => row.column_name));
    
    if (columnCheck.rows.length < 4) {
      return res.status(500).json({ 
        error: 'Missing color highlighting columns',
        foundColumns: columnCheck.rows.map(row => row.column_name)
      });
    }
    
    // Calculate expiration date
    const expirationDate = new Date();
    expirationDate.setHours(23, 59, 59, 999);
    expirationDate.setDate(expirationDate.getDate() + colorHighlightingDays);
    
    console.log('📅 Expiration date calculated:', expirationDate.toISOString());
    
    // Try to update color highlighting
    const updateQuery = `
      UPDATE cars 
      SET 
        color_highlighting_enabled = $1,
        color_highlighting_expiration_date = $2,
        color_highlighting_total_days = $3,
        color_highlighting_remaining_days = $4
      WHERE id = $5
      RETURNING id, color_highlighting_enabled, color_highlighting_expiration_date, color_highlighting_total_days, color_highlighting_remaining_days
    `;
    
    console.log('🔄 Executing update query...');
    console.log('Parameters:', [true, expirationDate.toISOString(), colorHighlightingDays, colorHighlightingDays, carId]);
    
    const updateResult = await pool.query(updateQuery, [
      true,
      expirationDate.toISOString(),
      colorHighlightingDays,
      colorHighlightingDays,
      carId
    ]);
    
    if (updateResult.rowCount === 0) {
      return res.status(500).json({ error: 'Update failed - no rows affected' });
    }
    
    console.log('✅ Update successful:', updateResult.rows[0]);
    
    // Verify the update by reading the data back
    const verifyQuery = 'SELECT id, color_highlighting_enabled, color_highlighting_expiration_date, color_highlighting_total_days FROM cars WHERE id = $1';
    const verifyResult = await pool.query(verifyQuery, [carId]);
    
    console.log('🔍 Verification query result:', verifyResult.rows[0]);
    
    res.json({
      success: true,
      message: 'Color highlighting updated successfully',
      car: carCheck.rows[0],
      updateResult: updateResult.rows[0],
      verificationResult: verifyResult.rows[0]
    });
    
  } catch (error) {
    console.error('❌ Error testing color highlighting:', error);
    res.status(500).json({ 
      error: 'Test failed', 
      details: error.message,
      stack: error.stack
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🧪 Test server running on port ${PORT}`);
  console.log(`🔗 Test color highlighting: POST http://localhost:${PORT}/test-color-highlighting`);
  console.log('   Body: { "carId": 1, "colorHighlightingDays": 7 }');
});

module.exports = app;