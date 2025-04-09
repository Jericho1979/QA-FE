const express = require('express');
const router = express.Router();
const pool = require('../db'); // Database connection pool
const { requireAuth, requireRole } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

/**
 * Get all teacher grades
 * GET /api/teacher-grades
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('GET /api/teacher-grades - Fetching all teacher grades');
    const query = `
      SELECT tg.id, tg.teacher_id, tg.qa_evaluator, tg.grade, tg.evaluation_ids, 
             to_char(tg.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
             to_char(tg.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
      FROM teacher_grades tg
      ORDER BY tg.updated_at DESC
    `;
    
    const { rows } = await pool.query(query);
    console.log(`Found ${rows.length} teacher grades`);
    
    res.json(rows);
  } catch (error) {
    console.error('Error fetching teacher grades:', error);
    
    // Check if the error is related to the table not existing
    if (error.message && error.message.includes('relation "teacher_grades" does not exist')) {
      console.log('Table "teacher_grades" does not exist - returning empty array');
      // Return empty array instead of an error
      return res.json([]);
    }
    
    res.status(500).json({ error: 'Failed to fetch teacher grades' });
  }
});

/**
 * Get teacher grade by teacher ID
 * GET /api/teacher-grades/:teacherId
 */
router.get('/:teacherId', requireAuth, async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log(`GET /api/teacher-grades/${teacherId} - Fetching grade for specific teacher`);
    
    const query = `
      SELECT tg.id, tg.teacher_id, tg.qa_evaluator, tg.grade, tg.evaluation_ids,
             to_char(tg.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
             to_char(tg.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
      FROM teacher_grades tg
      WHERE tg.teacher_id = $1
    `;
    
    const { rows } = await pool.query(query, [teacherId]);
    
    if (rows.length === 0) {
      console.log(`No grade found for teacher ${teacherId}`);
      return res.status(404).json({ error: 'Teacher grade not found' });
    }
    
    console.log(`Successfully fetched grade for teacher ${teacherId}`);
    res.json(rows[0]);
  } catch (error) {
    console.error(`Error fetching grade for teacher ${req.params.teacherId}:`, error);
    
    // Check if the error is related to the table not existing
    if (error.message && error.message.includes('relation "teacher_grades" does not exist')) {
      console.log('Table "teacher_grades" does not exist - returning 404');
      return res.status(404).json({ error: 'Teacher grade not found (table does not exist)' });
    }
    
    res.status(500).json({ error: 'Failed to fetch teacher grade' });
  }
});

/**
 * Create or update teacher grade
 * POST /api/teacher-grades
 */
router.post('/', requireAuth, requireRole('admin', 'qa'), async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('POST /api/teacher-grades - Creating/updating teacher grade');
    
    const { teacher_id, grade, qa_evaluator, evaluation_ids } = req.body;
    
    if (!teacher_id || !grade || !qa_evaluator) {
      console.log('Missing required fields in teacher grade creation');
      return res.status(400).json({ 
        error: 'Missing required fields: teacher_id, grade, and qa_evaluator are required' 
      });
    }
    
    // Check if a grade already exists for this teacher
    const checkQuery = 'SELECT id FROM teacher_grades WHERE teacher_id = $1';
    const checkResult = await client.query(checkQuery, [teacher_id]);
    
    let result;
    
    if (checkResult.rows.length > 0) {
      console.log(`Updating existing grade for teacher ${teacher_id}`);
      // Update existing grade
      const updateQuery = `
        UPDATE teacher_grades 
        SET grade = $1, 
            qa_evaluator = $2, 
            evaluation_ids = $3,
            updated_at = NOW()
        WHERE teacher_id = $4
        RETURNING id, teacher_id, qa_evaluator, grade, evaluation_ids,
                  to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
                  to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
      `;
      
      result = await client.query(updateQuery, [
        grade, 
        qa_evaluator,
        evaluation_ids || null,
        teacher_id
      ]);
    } else {
      console.log(`Creating new grade for teacher ${teacher_id}`);
      // Insert new grade
      const insertQuery = `
        INSERT INTO teacher_grades (teacher_id, grade, qa_evaluator, evaluation_ids, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, teacher_id, qa_evaluator, grade, evaluation_ids,
                  to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
                  to_char(updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
      `;
      
      result = await client.query(insertQuery, [
        teacher_id, 
        grade, 
        qa_evaluator,
        evaluation_ids || null
      ]);
    }
    
    await client.query('COMMIT');
    console.log(`Successfully saved grade for teacher ${teacher_id}`);
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saving teacher grade:', error);
    
    // Check if the error is related to the table not existing
    if (error.message && error.message.includes('relation "teacher_grades" does not exist')) {
      console.log('Table "teacher_grades" does not exist - informing client');
      return res.status(500).json({ 
        error: 'Failed to save teacher grade - table does not exist',
        tableExists: false
      });
    }
    
    res.status(500).json({ error: 'Failed to save teacher grade' });
  } finally {
    client.release();
  }
});

/**
 * Delete teacher grade
 * DELETE /api/teacher-grades/:teacherId
 */
router.delete('/:teacherId', requireAuth, requireRole('admin', 'qa'), async (req, res) => {
  try {
    const { teacherId } = req.params;
    console.log(`DELETE /api/teacher-grades/${teacherId} - Deleting teacher grade`);
    
    const query = 'DELETE FROM teacher_grades WHERE teacher_id = $1 RETURNING id';
    const result = await pool.query(query, [teacherId]);
    
    if (result.rows.length === 0) {
      console.log(`No grade found to delete for teacher ${teacherId}`);
      return res.status(404).json({ error: 'Teacher grade not found' });
    }
    
    console.log(`Successfully deleted grade for teacher ${teacherId}`);
    res.json({ message: 'Teacher grade deleted successfully' });
  } catch (error) {
    console.error(`Error deleting grade for teacher ${req.params.teacherId}:`, error);
    
    // Check if the error is related to the table not existing
    if (error.message && error.message.includes('relation "teacher_grades" does not exist')) {
      console.log('Table "teacher_grades" does not exist - returning 404');
      return res.status(404).json({ 
        error: 'Teacher grade not found (table does not exist)',
        tableExists: false
      });
    }
    
    res.status(500).json({ error: 'Failed to delete teacher grade' });
  }
});

/**
 * Create table if it doesn't exist
 * POST /api/teacher-grades/create-table
 * Requires admin role
 */
router.post('/create-table', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    console.log('POST /api/teacher-grades/create-table - Creating teacher_grades table if it doesn\'t exist');
    
    // Read the migration SQL file
    const sqlFilePath = path.join(__dirname, '../db/migrations/create_teacher_grades_table.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    console.log('Teacher grades table created or confirmed to exist');
    res.json({ success: true, message: 'Teacher grades table created or already exists' });
  } catch (error) {
    console.error('Error creating teacher_grades table:', error);
    res.status(500).json({ 
      error: 'Failed to create teacher_grades table',
      details: error.message
    });
  }
});

module.exports = router; 