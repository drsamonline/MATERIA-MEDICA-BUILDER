import { Router } from 'express';

/**
 * Create cases router with CRUD operations
 * @param {Database} db - SQLite database instance
 * @returns {Router} Express router
 */
export function createCasesRouter(db) {
  const router = Router();

  // GET all cases (with optional filters)
  router.get('/', (req, res) => {
    try {
      const { outcome, remedy_id, limit } = req.query;
      
      let query = `
        SELECT c.*, r.name as remedy_name 
        FROM cases c 
        LEFT JOIN remedies r ON c.prescribed_remedy_id = r.id 
        ORDER BY c.date DESC, c.created_at DESC
      `;
      
      let cases;
      if (outcome || remedy_id) {
        const conditions = [];
        const params = [];
        
        if (outcome) {
          conditions.push('c.outcome = ?');
          params.push(outcome);
        }
        
        if (remedy_id) {
          conditions.push('c.prescribed_remedy_id = ?');
          params.push(remedy_id);
        }
        
        query = `
          SELECT c.*, r.name as remedy_name 
          FROM cases c 
          LEFT JOIN remedies r ON c.prescribed_remedy_id = r.id 
          WHERE ${conditions.join(' AND ')}
          ORDER BY c.date DESC, c.created_at DESC
        `;
        
        cases = db.prepare(query).all(...params);
      } else {
        cases = db.prepare(query).all();
      }
      
      // Apply limit if specified
      if (limit && !isNaN(parseInt(limit))) {
        cases = cases.slice(0, parseInt(limit));
      }
      
      res.json(cases);
    } catch (error) {
      console.error('Error fetching cases:', error);
      res.status(500).json({ error: 'Failed to fetch cases' });
    }
  });

  // GET single case by ID
  router.get('/:id', (req, res) => {
    try {
      const caseItem = db.prepare(`
        SELECT c.*, r.name as remedy_name 
        FROM cases c 
        LEFT JOIN remedies r ON c.prescribed_remedy_id = r.id 
        WHERE c.id = ?
      `).get(req.params.id);
      
      if (!caseItem) {
        return res.status(404).json({ error: 'Case not found' });
      }
      res.json(caseItem);
    } catch (error) {
      console.error('Error fetching case:', error);
      res.status(500).json({ error: 'Failed to fetch case' });
    }
  });

  // POST create new case
  router.post('/', (req, res) => {
    try {
      const { 
        patient_initials, 
        age, 
        gender, 
        chief_complaint, 
        prescribed_remedy_id, 
        potency, 
        dosage, 
        outcome, 
        follow_up_notes,
        date 
      } = req.body;
      
      if (!patient_initials || !chief_complaint) {
        return res.status(400).json({ error: 'Patient initials and chief complaint are required' });
      }

      const insert = db.prepare(`
        INSERT INTO cases (patient_initials, age, gender, chief_complaint, prescribed_remedy_id, potency, dosage, outcome, follow_up_notes, date) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = insert.run(
        patient_initials,
        age || null,
        gender || null,
        chief_complaint,
        prescribed_remedy_id || null,
        potency || null,
        dosage || null,
        outcome || null,
        follow_up_notes || null,
        date || new Date().toISOString().split('T')[0]
      );
      
      const newCase = db.prepare(`
        SELECT c.*, r.name as remedy_name 
        FROM cases c 
        LEFT JOIN remedies r ON c.prescribed_remedy_id = r.id 
        WHERE c.id = ?
      `).get(result.lastInsertRowid);
      
      res.status(201).json(newCase);
    } catch (error) {
      console.error('Error creating case:', error);
      res.status(500).json({ error: 'Failed to create case' });
    }
  });

  // PUT update case
  router.put('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { 
        patient_initials, 
        age, 
        gender, 
        chief_complaint, 
        prescribed_remedy_id, 
        potency, 
        dosage, 
        outcome, 
        follow_up_notes,
        date 
      } = req.body;

      const existing = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Case not found' });
      }

      const update = db.prepare(`
        UPDATE cases 
        SET patient_initials = ?, age = ?, gender = ?, chief_complaint = ?, 
            prescribed_remedy_id = ?, potency = ?, dosage = ?, outcome = ?, 
            follow_up_notes = ?, date = ?
        WHERE id = ?
      `);
      
      update.run(
        patient_initials,
        age,
        gender,
        chief_complaint,
        prescribed_remedy_id,
        potency,
        dosage,
        outcome,
        follow_up_notes,
        date,
        id
      );
      
      const updated = db.prepare(`
        SELECT c.*, r.name as remedy_name 
        FROM cases c 
        LEFT JOIN remedies r ON c.prescribed_remedy_id = r.id 
        WHERE c.id = ?
      `).get(id);
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating case:', error);
      res.status(500).json({ error: 'Failed to update case' });
    }
  });

  // DELETE case
  router.delete('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const existing = db.prepare('SELECT * FROM cases WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Case not found' });
      }

      db.prepare('DELETE FROM cases WHERE id = ?').run(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting case:', error);
      res.status(500).json({ error: 'Failed to delete case' });
    }
  });

  return router;
}

export default createCasesRouter;
