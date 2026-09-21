import { useState } from 'react';
import { Card, Button } from '../components/ui';
import { useTheme } from '../hooks/useTheme';
import { casesAPI, remediesAPI, symptomsAPI } from '../utils/api';
import { Download, Moon, Sun, Database } from 'lucide-react';

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    try {
      setExporting(true);
      
      // Fetch all data
      const [cases, remedies, symptoms] = await Promise.all([
        casesAPI.getAll(),
        remediesAPI.getAll(),
        symptomsAPI.getAll()
      ]);
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        data: {
          cases,
          remedies,
          symptoms
        }
      };
      
      // Create download blob
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `materia-medica-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Data exported successfully!');
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data: ' + err.message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Customize your application preferences and manage data
        </p>
      </div>

      {/* Appearance */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Appearance
          </h2>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <div className="flex items-center gap-3">
            {isDark ? (
              <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            ) : (
              <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            )}
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Currently using {isDark ? 'dark' : 'light'} theme
              </p>
            </div>
          </div>
          <Button onClick={toggleTheme} variant="outline">
            Toggle Theme
          </Button>
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <Download className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Data Management
          </h2>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <h3 className="font-medium text-slate-900 dark:text-white mb-2">
              Export All Data
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Download a complete backup of your cases, remedies, and symptom observations in JSON format. 
              This is useful for backing up your data or migrating to another device.
            </p>
            <Button 
              onClick={handleExport} 
              disabled={exporting}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? 'Exporting...' : 'Export Data (JSON)'}
            </Button>
          </div>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Data Storage Information
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Your data is stored locally in an SQLite database at <code className="bg-blue-100 dark:bg-blue-800 px-2 py-0.5 rounded">/data/materia-medica.db</code>. 
              No data is sent to external servers. Regular exports are recommended for backup purposes.
            </p>
          </div>
        </div>
      </Card>

      {/* About */}
      <Card>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          About Materia Medica Builder
        </h2>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <p>
            <strong>Version:</strong> 1.0.0
          </p>
          <p>
            A personal research tool for homeopathic practitioners to document clinical cases, 
            track remedy outcomes, and build a custom, evidence-based Materia Medica from 
            their own observations.
          </p>
          <p className="pt-2">
            Built with React, Node.js, Express, and SQLite. Designed for offline-first usage 
            with local data storage.
          </p>
        </div>
      </Card>
    </div>
  );
}
