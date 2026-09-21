import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path - store in /data directory at project root
const dbPath = join(__dirname, '..', 'data', 'materia-medica.db');

/**
 * Initialize the SQLite database with required tables
 * @returns {Database} The database instance
 */
export function initDatabase() {
  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create Remedies table
  db.exec(`
    CREATE TABLE IF NOT EXISTS remedies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      common_name TEXT,
      source_family TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Create Symptoms table
  db.exec(`
    CREATE TABLE IF NOT EXISTS symptoms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      remedy_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      location TEXT,
      sensation TEXT,
      modality TEXT,
      confidence_level INTEGER CHECK(confidence_level >= 1 AND confidence_level <= 5) DEFAULT 3,
      verified BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (remedy_id) REFERENCES remedies(id) ON DELETE CASCADE
    )
  `);
  
  // Create Cases table
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_initials TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      chief_complaint TEXT NOT NULL,
      prescribed_remedy_id INTEGER,
      potency TEXT,
      dosage TEXT,
      outcome TEXT CHECK(outcome IN ('Cured', 'Improved', 'No Change', 'Aggravated', 'Suppressed')),
      follow_up_notes TEXT,
      date DATE DEFAULT CURRENT_DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (prescribed_remedy_id) REFERENCES remedies(id) ON DELETE SET NULL
    )
  `);
  
  // Insert some sample remedies if table is empty
  const remedyCount = db.prepare('SELECT COUNT(*) as count FROM remedies').get();
  if (remedyCount.count === 0) {
    const insertRemedy = db.prepare(`
      INSERT INTO remedies (name, common_name, source_family, notes) 
      VALUES (?, ?, ?, ?)
    `);
    
    const sampleRemedies = [
      ['Arnica montana', 'Arnica', 'Asteraceae', 'First remedy for trauma, bruises, and shock. Keynote: Sore, lame feeling.'],
      ['Belladonna', 'Deadly Nightshade', 'Solanaceae', 'Sudden intense symptoms. Flushed face, dilated pupils, throbbing pain.'],
      ['Nux vomica', 'Poison Nut', 'Loganiaceae', 'For overindulgence, irritability, and digestive issues. Type A personality.'],
      ['Pulsatilla', 'Windflower', 'Ranunculaceae', 'Changeable symptoms, weepy, desires consolation. Worse warmth, better open air.'],
      ['Sulphur', 'Brimstone', 'Mineral', 'Hot-blooded, philosophical, messy. Skin conditions, burning sensations.'],
      ['Calcarea carbonica', 'Calcium Carbonate', 'Mineral', 'Oversensitive to cold, anxious, methodical. Strong desire for eggs.'],
      ['Lycopodium', 'Club Moss', 'Lycopodiaceae', 'Digestive issues, lack of confidence, anticipatory anxiety. Better warm drinks.'],
      ['Sepia', 'Cuttlefish Ink', 'Animal', 'Indifferent to family, dragging sensation, worse before menses.'],
      ['Natrum muriaticum', 'Sodium Chloride', 'Mineral', 'Grief, reserved, craves salt. Headaches from sun exposure.'],
      ['Phosphorus', 'Phosphorus', 'Mineral', 'Sympathetic, fearful, bleeding tendencies. Thirst for cold drinks.']
    ];
    
    const insertMany = db.transaction((remedies) => {
      for (const remedy of remedies) {
        insertRemedy.run(...remedy);
      }
    });
    
    insertMany(sampleRemedies);
    console.log('✓ Sample remedies inserted');
  }
  
  return db;
}

export default initDatabase;
