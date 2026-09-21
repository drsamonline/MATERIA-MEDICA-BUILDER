import { Router } from 'express';

/**
 * Create remedies router with CRUD operations
 * @param {Database} db - SQLite database instance
 * @returns {Router} Express router
 */
export function createRemediesRouter(db) {
  const router = Router();

  // GET all remedies
  router.get('/', (req, res) => {
    try {
      const remedies = db.prepare('SELECT * FROM remedies ORDER BY name ASC').all();
      res.json(remedies);
    } catch (error) {
      console.error('Error fetching remedies:', error);
      res.status(500).json({ error: 'Failed to fetch remedies' });
    }
  });

  // GET single remedy by ID
  router.get('/:id', (req, res) => {
    try {
      const remedy = db.prepare('SELECT * FROM remedies WHERE id = ?').get(req.params.id);
      if (!remedy) {
        return res.status(404).json({ error: 'Remedy not found' });
      }
      res.json(remedy);
    } catch (error) {
      console.error('Error fetching remedy:', error);
      res.status(500).json({ error: 'Failed to fetch remedy' });
    }
  });

  // POST create new remedy
  router.post('/', (req, res) => {
    try {
      const { name, common_name, source_family, notes } = req.body;
      
      if (!name) {
        return res.status(400).json({ error: 'Remedy name is required' });
      }

      const insert = db.prepare(`
        INSERT INTO remedies (name, common_name, source_family, notes) 
        VALUES (?, ?, ?, ?)
      `);
      
      const result = insert.run(name, common_name || null, source_family || null, notes || null);
      
      const newRemedy = db.prepare('SELECT * FROM remedies WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(newRemedy);
    } catch (error) {
      console.error('Error creating remedy:', error);
      if (error.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Remedy with this name already exists' });
      }
      res.status(500).json({ error: 'Failed to create remedy' });
    }
  });

  // PUT update remedy
  router.put('/:id', (req, res) => {
    try {
      const { name, common_name, source_family, notes } = req.body;
      const { id } = req.params;

      const existing = db.prepare('SELECT * FROM remedies WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Remedy not found' });
      }

      const update = db.prepare(`
        UPDATE remedies 
        SET name = ?, common_name = ?, source_family = ?, notes = ?
        WHERE id = ?
      `);
      
      update.run(name, common_name, source_family, notes, id);
      
      const updated = db.prepare('SELECT * FROM remedies WHERE id = ?').get(id);
      res.json(updated);
    } catch (error) {
      console.error('Error updating remedy:', error);
      res.status(500).json({ error: 'Failed to update remedy' });
    }
  });

  // DELETE remedy
  router.delete('/:id', (req, res) => {
    try {
      const { id } = req.params;
      
      const existing = db.prepare('SELECT * FROM remedies WHERE id = ?').get(id);
      if (!existing) {
        return res.status(404).json({ error: 'Remedy not found' });
      }

      db.prepare('DELETE FROM remedies WHERE id = ?').run(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting remedy:', error);
      res.status(500).json({ error: 'Failed to delete remedy' });
    }
  });

  return router;
}

export default createRemediesRouter;
