# Materia Medica Builder

A **offline-first Progressive Web App (PWA)** for homeopathic practitioners to document clinical cases, track remedy outcomes, and build a custom, evidence-based Materia Medica from their own observations.

## Features

### 📊 Dashboard
- **Statistics Cards**: Total cases, success rate percentage, most used remedy, remedies in library
- **Outcome Distribution Chart**: Visual pie chart showing Cured vs Improved vs No Change vs Aggravated vs Suppressed
- **Top Remedies Chart**: Bar chart of the 5 most frequently prescribed remedies
- **Timeline Chart**: Line graph showing cases over time throughout the year
- **Recent Cases Table**: Quick view of the last 5 logged cases

### 🧪 Remedies Library
- **Searchable List**: Find remedies by name or common name
- **Remedy Cards**: Display remedy name, common name, source family, and notes
- **Detail View**: Click any remedy to see associated symptoms sorted by confidence level
- **Add Symptoms**: Record clinical observations with location, sensation, modality, and confidence rating (1-5 stars)
- **Add New Remedies**: Expand your personal materia medica

### 📋 Case Logger
- **Patient Information**: Initials, age, gender
- **Case Details**: Chief complaint, prescribed remedy, potency, dosage
- **Outcome Tracking**: Cured, Improved, No Change, Aggravated, or Suppressed
- **Follow-up Notes**: Document results and observations
- **Filter by Outcome**: Quickly view cases by their outcome status
- **View/Delete Cases**: Manage your case history

### ⚙️ Settings
- **Dark/Light Mode**: Toggle between themes (respects system preference)
- **Export Data**: Download all your data as JSON for backup
- **Import Data**: Restore from a previously exported backup
- **Clear All Data**: Permanently delete all local data

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), no framework dependencies
- **Styling**: Tailwind CSS (via CDN for simplicity)
- **Charts**: Chart.js (via CDN)
- **Database**: IndexedDB (browser-native, offline storage)
- **PWA**: Service Worker for offline functionality
- **Icons**: Inline SVG (Lucide-style)

## Installation & Usage

### Option 1: Local Server (Recommended)

```bash
# Navigate to the project directory
cd /workspace

# Start a simple HTTP server (Python 3)
python3 -m http.server 8080

# Or use Node.js if available
npx serve .

# Open in browser
# http://localhost:8080
```

### Option 2: Direct File Access

Simply open `index.html` in your browser. Note: Some browsers may restrict IndexedDB when accessing via `file://` protocol. For best results, use a local server.

### Option 3: Deploy to Static Hosting

Upload all files to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

The app will work immediately with full offline capabilities.

## PWA Features

Once loaded, the app can be:
- **Installed** on your device (Add to Home Screen)
- **Used offline** - all functionality works without internet
- **Added to desktop** as a standalone application

### Install on Mobile
1. Open the app in Chrome (Android) or Safari (iOS)
2. Tap the menu (⋮ or Share button)
3. Select "Add to Home Screen" or "Install App"

### Install on Desktop
1. Open the app in Chrome, Edge, or Firefox
2. Look for the install icon in the address bar
3. Click "Install"

## Data Storage

All data is stored **locally** in your browser using IndexedDB:
- ✅ Never leaves your device
- ✅ No server required
- ✅ Works offline
- ✅ Private and secure

**Important**: Clear your browser data = lose your data. Always export backups regularly!

## Database Schema

### Remedies
```javascript
{
  id: number (auto-increment),
  name: string,
  common_name: string,
  source_family: string,
  notes: string,
  created_at: ISO date string
}
```

### Symptoms
```javascript
{
  id: number (auto-increment),
  remedy_id: number (FK),
  description: string,
  location: string,
  sensation: string,
  modality: string,
  confidence_level: number (1-5),
  verified: boolean
}
```

### Cases
```javascript
{
  id: number (auto-increment),
  patient_initials: string,
  age: number,
  gender: string (M/F/O),
  chief_complaint: string,
  prescribed_remedy_id: number (FK),
  potency: string,
  dosage: string,
  outcome: string (Cured/Improved/No Change/Aggravated/Suppressed),
  follow_up_notes: string,
  date: ISO date string
}
```

## Sample Data

On first load, the app includes:
- **10 Common Remedies**: Arnica, Belladonna, Nux vomica, Pulsatilla, Sulphur, Calcarea carb, Lycopodium, Phosphorus, Silicea, Natrum mur
- **10 Sample Symptoms**: Clinical observations for various remedies
- **8 Sample Cases**: Example patient cases with different outcomes

## Responsive Design

- **Desktop**: Sidebar navigation, multi-column layouts
- **Tablet**: Adaptive grid layouts
- **Mobile**: Bottom tab navigation, single-column layouts
- **Touch-friendly**: All interactive elements minimum 44px height

## Color Scheme

- **Primary**: Teal (#0d9488) - calming, professional medical aesthetic
- **Secondary**: Indigo (#4f46e5) - accent color
- **Neutral**: Slate grays - clean, readable text
- **Semantic Colors**:
  - Green: Cured
  - Yellow: Improved
  - Blue: No Change
  - Red: Aggravated
  - Gray: Suppressed

## Browser Support

Works in all modern browsers with IndexedDB support:
- ✅ Chrome/Edge (best support)
- ✅ Firefox
- ✅ Safari (iOS 10+)
- ✅ Opera

## Privacy & Security

- **No authentication**: This is a personal local tool
- **No cloud sync**: All data stays on your device
- **No analytics**: No tracking code
- **No external API calls**: After initial load, completely offline

## Backup & Restore

### Export
1. Go to Settings
2. Click "Export JSON"
3. Save the downloaded file securely

### Import
1. Go to Settings
2. Click "Choose File" under Import Data
3. Select your previously exported JSON file
4. Confirm the import (this will replace all current data)

## Development

### File Structure
```
/workspace/
├── index.html          # Main HTML file
├── manifest.json       # PWA manifest
├── sw.js              # Service Worker
├── css/
│   └── styles.css     # Custom styles
├── js/
│   └── app.js         # Main application logic
└── icons/
    ├── icon-192.png   # PWA icon (192x192)
    └── icon-512.png   # PWA icon (512x512)
```

### Making Changes

1. Edit `js/app.js` for functionality
2. Edit `css/styles.css` for custom styles
3. Edit `index.html` for structure
4. Update `manifest.json` for PWA settings

## Troubleshooting

### App not loading
- Ensure you're using a modern browser
- Try clearing browser cache
- Check browser console for errors (F12)

### Data not persisting
- Make sure cookies/local storage are enabled
- Don't use private/incognito mode
- Check if browser is set to clear data on close

### PWA not installing
- Must be served over HTTPS (or localhost)
- Service worker must be registered successfully
- Check browser console for PWA errors

## License

This is a personal tool provided as-is for educational and research purposes.

## Version

**v1.0.0** - Initial release

---

Built with ❤️ for homeopathic practitioners worldwide.
