import { Router } from 'express';

/**
 * Create stats router for dashboard analytics
 * @param {Database} db - SQLite database instance
 * @returns {Router} Express router
 */
export function createStatsRouter(db) {
  const router = Router();

  // GET aggregated statistics
  router.get('/', (req, res) => {
    try {
      // Total cases count
      const totalCasesResult = db.prepare('SELECT COUNT(*) as count FROM cases').get();
      const totalCases = totalCasesResult.count;

      // Success rate calculation (Cured + Improved) / Total
      const outcomeCounts = db.prepare(`
        SELECT outcome, COUNT(*) as count 
        FROM cases 
        WHERE outcome IS NOT NULL 
        GROUP BY outcome
      `).all();
      
      const outcomeMap = {};
      let successfulCases = 0;
      
      outcomeCounts.forEach(row => {
        outcomeMap[row.outcome] = row.count;
        if (row.outcome === 'Cured' || row.outcome === 'Improved') {
          successfulCases += row.count;
        }
      });
      
      const successRate = totalCases > 0 
        ? Math.round((successfulCases / totalCases) * 100) 
        : 0;

      // Most used remedy
      const mostUsedRemedy = db.prepare(`
        SELECT r.name, r.id, COUNT(c.id) as usage_count
        FROM cases c
        JOIN remedies r ON c.prescribed_remedy_id = r.id
        GROUP BY c.prescribed_remedy_id
        ORDER BY usage_count DESC
        LIMIT 1
      `).get();

      // Top 5 remedies by usage
      const topRemedies = db.prepare(`
        SELECT r.name, r.id, COUNT(c.id) as usage_count
        FROM cases c
        JOIN remedies r ON c.prescribed_remedy_id = r.id
        GROUP BY c.prescribed_remedy_id
        ORDER BY usage_count DESC
        LIMIT 5
      `).all();

      // Cases by month (last 6 months)
      const casesByMonth = db.prepare(`
        SELECT strftime('%Y-%m', date) as month, COUNT(*) as count
        FROM cases
        WHERE date >= date('now', '-6 months')
        GROUP BY month
        ORDER BY month ASC
      `).all();

      // Outcome distribution for pie chart
      const outcomeDistribution = [
        { name: 'Cured', value: outcomeMap['Cured'] || 0, color: '#10b981' },
        { name: 'Improved', value: outcomeMap['Improved'] || 0, color: '#fbbf24' },
        { name: 'No Change', value: outcomeMap['No Change'] || 0, color: '#6b7280' },
        { name: 'Aggravated', value: outcomeMap['Aggravated'] || 0, color: '#ef4444' },
        { name: 'Suppressed', value: outcomeMap['Suppressed'] || 0, color: '#8b5cf6' }
      ];

      // Total remedies count
      const totalRemediesResult = db.prepare('SELECT COUNT(*) as count FROM remedies').get();
      const totalRemedies = totalRemediesResult.count;

      // Total symptoms count
      const totalSymptomsResult = db.prepare('SELECT COUNT(*) as count FROM symptoms').get();
      const totalSymptoms = totalSymptomsResult.count;

      res.json({
        totalCases,
        totalRemedies,
        totalSymptoms,
        successRate,
        mostUsedRemedy: mostUsedRemedy || null,
        topRemedies,
        outcomeDistribution,
        casesByMonth,
        outcomeCounts: outcomeMap
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  });

  return router;
}

export default createStatsRouter;
