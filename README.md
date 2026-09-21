# Materia Medica Builder

A personal research tool for homeopathic practitioners to document clinical cases, track remedy outcomes, and build a custom, evidence-based Materia Medica from their own observations.

## Features

- **Dashboard**: Visual analytics with charts showing treatment outcomes, top remedies, and case trends
- **Remedies Library**: Browse, search, and document clinical observations for each remedy with confidence ratings
- **Case Logger**: Document patient cases with detailed information including chief complaint, prescribed remedy, potency, dosage, and outcomes
- **Settings**: Dark/Light mode toggle and data export functionality
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Local Storage**: All data stored locally in SQLite database - no cloud dependencies

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router
- Recharts (analytics)
- Lucide React (icons)
- Axios (API client)

### Backend
- Node.js + Express.js
- SQLite (better-sqlite3)
- RESTful API

## Project Structure

```
materia-medica-builder/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── utils/          # Utilities and API client
│   │   └── App.jsx         # Main app component
│   ├── package.json
│   └── vite.config.js
├── server/                 # Express backend
│   ├── routes/             # API route handlers
│   ├── db.js               # Database initialization
│   ├── index.js            # Server entry point
│   └── package.json
├── data/                   # SQLite database storage
├── package.json            # Root package.json (workspaces)
└── README.md
```

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. Clone or navigate to the project directory:
```bash
cd materia-medica-builder
```

2. Install all dependencies:
```bash
npm install
```

This will install dependencies for both the client and server workspaces.

## Running the Application

### Development Mode

Run both client and server concurrently:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Server (port 3001)
npm run server

# Terminal 2 - Client (port 3000)
npm run client
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Production Build

```bash
npm run build
```

## API Endpoints

### Remedies
- `GET /api/remedies` - List all remedies
- `GET /api/remedies/:id` - Get single remedy
- `POST /api/remedies` - Create new remedy
- `PUT /api/remedies/:id` - Update remedy
- `DELETE /api/remedies/:id` - Delete remedy

### Symptoms
- `GET /api/symptoms?remedy_id=X` - List symptoms (optionally filtered by remedy)
- `GET /api/symptoms/:id` - Get single symptom
- `POST /api/symptoms` - Create new symptom observation
- `PUT /api/symptoms/:id` - Update symptom
- `DELETE /api/symptoms/:id` - Delete symptom

### Cases
- `GET /api/cases?outcome=X&remedy_id=Y` - List cases with optional filters
- `GET /api/cases/:id` - Get single case
- `POST /api/cases` - Create new case log
- `PUT /api/cases/:id` - Update case
- `DELETE /api/cases/:id` - Delete case

### Statistics
- `GET /api/stats` - Get aggregated statistics for dashboard

## Database Schema

### Remedies Table
- `id` - Primary key
- `name` - Latin name (unique)
- `common_name` - Common name
- `source_family` - Source family (plant, mineral, animal)
- `notes` - General notes about the remedy
- `created_at` - Timestamp

### Symptoms Table
- `id` - Primary key
- `remedy_id` - Foreign key to remedies
- `description` - Symptom description
- `location` - Body location
- `sensation` - Type of sensation
- `modality` - Conditions that affect the symptom
- `confidence_level` - 1-5 rating
- `verified` - Boolean flag
- `created_at` - Timestamp

### Cases Table
- `id` - Primary key
- `patient_initials` - Patient identifier
- `age` - Patient age
- `gender` - Patient gender
- `chief_complaint` - Main complaint
- `prescribed_remedy_id` - Foreign key to remedies
- `potency` - Remedy potency
- `dosage` - Dosage instructions
- `outcome` - Treatment outcome (Cured, Improved, No Change, Aggravated, Suppressed)
- `follow_up_notes` - Additional notes
- `date` - Case date
- `created_at` - Timestamp

## Data Export

Use the Settings page to export all your data as a JSON file. This creates a complete backup of your cases, remedies, and symptom observations.

## Sample Data

The application comes pre-loaded with 10 common homeopathic remedies:
- Arnica montana
- Belladonna
- Nux vomica
- Pulsatilla
- Sulphur
- Calcarea carbonica
- Lycopodium
- Sepia
- Natrum muriaticum
- Phosphorus

## Design Features

- **Mobile-First**: Optimized for use on phones and tablets during consultations
- **Dark Mode**: Built-in theme toggle for comfortable viewing in any lighting
- **Touch-Friendly**: Large touch targets (minimum 44px) for easy mobile input
- **Fast Performance**: Instant load times with optimistic UI updates
- **Professional Aesthetic**: Clean, modern medical-themed design

## License

MIT License - Free for personal and commercial use.

## Support

For issues or questions, please check the documentation or review the source code comments.
