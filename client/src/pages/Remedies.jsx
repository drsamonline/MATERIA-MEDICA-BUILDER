import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Input, Textarea, Select, Badge, Modal, Spinner } from '../components/ui';
import { remediesAPI, symptomsAPI } from '../utils/api';
import { Plus, Search, Star, Edit2, Trash2, ArrowLeft } from 'lucide-react';

const confidenceOptions = [
  { value: '1', label: '★☆☆☆☆ - Low Confidence' },
  { value: '2', label: '★★☆☆☆ - Somewhat Confident' },
  { value: '3', label: '★★★☆☆ - Moderately Confident' },
  { value: '4', label: '★★★★☆ - Very Confident' },
  { value: '5', label: '★★★★★ - Verified Observation' },
];

export default function Remedies() {
  const { id } = useParams();
  const [remedies, setRemedies] = useState([]);
  const [selectedRemedy, setSelectedRemedy] = useState(null);
  const [symptoms, setSymptoms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSymptomModal, setShowSymptomModal] = useState(false);
  const [newRemedy, setNewRemedy] = useState({ name: '', common_name: '', source_family: '', notes: '' });
  const [newSymptom, setNewSymptom] = useState({ 
    description: '', location: '', sensation: '', modality: '', confidence_level: 3, verified: false 
  });

  useEffect(() => {
    loadRemedies();
  }, []);

  useEffect(() => {
    if (id && remedies.length > 0) {
      const remedy = remedies.find(r => r.id === parseInt(id));
      if (remedy) {
        setSelectedRemedy(remedy);
        loadSymptoms(remedy.id);
      }
    } else if (!id) {
      setSelectedRemedy(null);
    }
  }, [id, remedies]);

  async function loadRemedies() {
    try {
      setLoading(true);
      const data = await remediesAPI.getAll();
      setRemedies(data);
    } catch (err) {
      console.error('Failed to load remedies:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadSymptoms(remedyId) {
    try {
      const data = await symptomsAPI.getAll(remedyId);
      setSymptoms(data);
    } catch (err) {
      console.error('Failed to load symptoms:', err);
    }
  }

  async function handleCreateRemedy(e) {
    e.preventDefault();
    try {
      await remediesAPI.create(newRemedy);
      setNewRemedy({ name: '', common_name: '', source_family: '', notes: '' });
      setShowAddModal(false);
      loadRemedies();
    } catch (err) {
      alert('Failed to create remedy: ' + err.response?.data?.error || err.message);
    }
  }

  async function handleCreateSymptom(e) {
    e.preventDefault();
    try {
      await symptomsAPI.create({ ...newSymptom, remedy_id: selectedRemedy.id });
      setNewSymptom({ description: '', location: '', sensation: '', modality: '', confidence_level: 3, verified: false });
      setShowSymptomModal(false);
      loadSymptoms(selectedRemedy.id);
    } catch (err) {
      alert('Failed to add symptom: ' + err.response?.data?.error || err.message);
    }
  }

  async function handleDeleteSymptom(symptomId) {
    if (!confirm('Are you sure you want to delete this symptom?')) return;
    try {
      await symptomsAPI.delete(symptomId);
      loadSymptoms(selectedRemedy.id);
    } catch (err) {
      alert('Failed to delete symptom');
    }
  }

  const filteredRemedies = remedies.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.common_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  // Detail View
  if (selectedRemedy) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Remedies
        </Button>

        {/* Remedy Info */}
        <Card>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {selectedRemedy.name}
              </h1>
              {selectedRemedy.common_name && (
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Common Name: {selectedRemedy.common_name}
                </p>
              )}
              {selectedRemedy.source_family && (
                <Badge variant="default" className="mt-2">
                  {selectedRemedy.source_family}
                </Badge>
              )}
            </div>
            <Button onClick={() => setShowSymptomModal(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Symptom
            </Button>
          </div>
          
          {selectedRemedy.notes && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-700 dark:text-slate-300">{selectedRemedy.notes}</p>
            </div>
          )}
        </Card>

        {/* Symptoms List */}
        <Card>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Clinical Observations ({symptoms.length})
          </h2>
          
          {symptoms.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">
              No symptoms recorded yet. Click "Add Symptom" to document your first observation.
            </p>
          ) : (
            <div className="space-y-3">
              {symptoms.map((symptom) => (
                <div 
                  key={symptom.id}
                  className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-amber-500">
                          {'★'.repeat(symptom.confidence_level)}{'☆'.repeat(5 - symptom.confidence_level)}
                        </span>
                        {symptom.verified && (
                          <Badge variant="success">Verified</Badge>
                        )}
                      </div>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {symptom.description}
                      </p>
                      {(symptom.location || symptom.sensation || symptom.modality) && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {symptom.location && (
                            <Badge variant="default">Location: {symptom.location}</Badge>
                          )}
                          {symptom.sensation && (
                            <Badge variant="default">Sensation: {symptom.sensation}</Badge>
                          )}
                          {symptom.modality && (
                            <Badge variant="default">Modality: {symptom.modality}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDeleteSymptom(symptom.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Add Symptom Modal */}
        <Modal 
          isOpen={showSymptomModal} 
          onClose={() => setShowSymptomModal(false)}
          title={`Add Symptom - ${selectedRemedy.name}`}
        >
          <form onSubmit={handleCreateSymptom} className="space-y-4">
            <Textarea
              label="Description"
              placeholder="Describe the symptom (e.g., 'Stitching pain in right side')"
              value={newSymptom.description}
              onChange={(e) => setNewSymptom({...newSymptom, description: e.target.value})}
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Location"
                placeholder="e.g., Head, Abdomen"
                value={newSymptom.location}
                onChange={(e) => setNewSymptom({...newSymptom, location: e.target.value})}
              />
              <Input
                label="Sensation"
                placeholder="e.g., Burning, Stitching"
                value={newSymptom.sensation}
                onChange={(e) => setNewSymptom({...newSymptom, sensation: e.target.value})}
              />
              <Input
                label="Modality"
                placeholder="e.g., Worse cold, Better pressure"
                value={newSymptom.modality}
                onChange={(e) => setNewSymptom({...newSymptom, modality: e.target.value})}
              />
            </div>
            <Select
              label="Confidence Level"
              options={confidenceOptions}
              value={newSymptom.confidence_level.toString()}
              onChange={(e) => setNewSymptom({...newSymptom, confidence_level: parseInt(e.target.value)})}
            />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newSymptom.verified}
                onChange={(e) => setNewSymptom({...newSymptom, verified: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Verified observation</span>
            </label>
            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowSymptomModal(false)} fullWidth>
                Cancel
              </Button>
              <Button type="submit" fullWidth>Add Symptom</Button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // List View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Remedies Library
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Browse and document clinical observations for each remedy
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Remedy
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search remedies by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Remedies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRemedies.map((remedy) => (
          <Card 
            key={remedy.id} 
            className="card-hover cursor-pointer"
            onClick={() => window.location.href = `/remedies/${remedy.id}`}
          >
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {remedy.name}
            </h3>
            {remedy.common_name && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {remedy.common_name}
              </p>
            )}
            {remedy.source_family && (
              <Badge variant="default" className="mt-2">
                {remedy.source_family}
              </Badge>
            )}
          </Card>
        ))}
      </div>

      {filteredRemedies.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">
            {searchTerm ? 'No remedies found matching your search.' : 'No remedies yet. Create your first remedy!'}
          </p>
        </Card>
      )}

      {/* Add Remedy Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Add New Remedy"
      >
        <form onSubmit={handleCreateRemedy} className="space-y-4">
          <Input
            label="Remedy Name (Latin)"
            placeholder="e.g., Arnica montana"
            value={newRemedy.name}
            onChange={(e) => setNewRemedy({...newRemedy, name: e.target.value})}
            required
          />
          <Input
            label="Common Name"
            placeholder="e.g., Arnica"
            value={newRemedy.common_name}
            onChange={(e) => setNewRemedy({...newRemedy, common_name: e.target.value})}
          />
          <Input
            label="Source Family"
            placeholder="e.g., Asteraceae, Mineral, Animal"
            value={newRemedy.source_family}
            onChange={(e) => setNewRemedy({...newRemedy, source_family: e.target.value})}
          />
          <Textarea
            label="Notes"
            placeholder="Key characteristics, keynote symptoms, etc."
            rows={4}
            value={newRemedy.notes}
            onChange={(e) => setNewRemedy({...newRemedy, notes: e.target.value})}
          />
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} fullWidth>
              Cancel
            </Button>
            <Button type="submit" fullWidth>Create Remedy</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
