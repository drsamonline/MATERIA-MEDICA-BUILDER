import { Router } from 'express';

/**
 * Create symptoms router with CRUD operations
 * @param {Database} db - SQLite database instance
 * @returns {Router} Express router
 */
export function createSymptomsRouter(db) {
  const router = Router();

  // GET all symptoms (optionally filtered by remedy_id)
  router.get('/', (req, res) => {
    try {
      const { remedy_id } = req.query;
      
      let query = `
        SELECT s.*, r.name as remedy_name 
        FROM symptoms s 
        JOIN remedies r ON s.remedy_id = r.id 
        ORDER BY s.confidence_level DESC, s.created_at DESC
      `;
      
      let symptoms;
      if (remedy_id) {
        query = `
          SELECT s.*, r.name as remedy_name 
          FROM symptoms s 
          JOIN remedies r ON s.remedy_id = r.id 
          WHERE s.remedy_id = ?
          ORDER BY s.confidence_level DESC, s.created_at DESC
        `;
        symptoms = db.prepare(query).all(remedy_id);
      } else {
        symptoms = db.prepare(query).all();
      }
      
      res.json(symptoms);
    } catch (error) {
      console.error('Error fetching symptoms:', error);
      res.status(500).json({ error: 'Failed to fetch symptoms' });
    }
  });

  // GET single symptom by ID
  router.get('/:id', (req, res) => {
    try {
      const symptom = db.prepare(`
        SELECT s.*, r.name as remedy_name 
        FROM symptoms s 
        JOIN remedies r ON s.remedy_id = r.id 
        WHERE s.id = ?
      `).get(req.params.id);
      
      if (!symptom) {
        return res.status(404).json({ error: 'Symptom not found' });
      }
      res.json(symptom);
    } catch (error) {
      console.error('Error fetching symptom:', error);
      res.status(500).json({ error: 'Failed to fetch symptom' });
    }
  });

  // POST create new symptom
  router.post('/', (req, res) => {
    try {
      const { remedy_id, description, location, sensation, modality, confidence_level, verified } = req.body;
      
      if (!remedy_id || !description) {
        return res.status(400).json({ error: 'Remedy ID and description are required' });
      }

      const insert = db.prepare(`
        INSERT INTO symptoms (remedy_id, description, location, sensation, modality, confidence_level, verified) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      const result = insert.run(
        remedy_id,
        description,
        location || null,
        sensation || null,
        modality || null,
        confidence_level || 3,
        verified ? 1 : 0
      );
      
      const newSymptom = db.prepare(`
        SELECT s.*, r.name as remedy_name 
        FROM symptoms s 
        JOIN remedies r ON s.remedy_id = r.id 
        WHERE s.id = ?
      `).get(result.lastInsertRowid);
      
      res.status(201).json(newSymptom);
    } catch (error) {
      console.error('Error creating symptom:', error);
      res.status(500).json({ error: 'Failed to create symptom' });
    }
  });

  // PUT update symptom
  router.put('/:id', (req, res) => {
    try {
      const { id } = req.params;
      const { description, location, sensation, modality, confidence_level, verified } = req.body;

      const existing = db.prepare('SELECT * FROM symptoms WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Symptom not found' });
      }

      const update = db.prepare(`
        UPDATE symptoms 
        SET description = ?, location = ?, sensation = ?, modality = ?, 
            confidence_level = ?, verified = ?
        WHERE id = ?
      `);
      
      update.run(
        description,
        location,
        sensation,
        modality,
        confidence_level,
        verified ? 1 : 0,
        id
      );
      
      const updated = db.prepare(`
        SELECT s.*, r.name as remedy_name 
        FROM symptoms s 
        JOIN remedies r ON s.remedy_id = r.id 
        WHERE s.id = ?
      `).get(id);
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating symptom:', error);
      res.status(500).json({ error: 'Failed to update symptom' });
    }
  });

  // DELETE symptom
  router.delete('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const existing = db.prepare('SELECT * FROM symptoms WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Symptom not found' });
      }

      db.prepare('DELETE FROM symptoms WHERE id = ?').run(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting symptom:', error);
      res.status(500).json({ error: 'Failed to delete symptom' });
    }
  });

  return router;
}

export default createSymptomsRouter;
