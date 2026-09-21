import { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Textarea, Badge, Modal, Spinner } from '../components/ui';
import { casesAPI, remediesAPI } from '../utils/api';
import { Plus, Filter, Calendar, User } from 'lucide-react';

const outcomeOptions = [
  { value: '', label: 'All Outcomes' },
  { value: 'Cured', label: 'Cured' },
  { value: 'Improved', label: 'Improved' },
  { value: 'No Change', label: 'No Change' },
  { value: 'Aggravated', label: 'Aggravated' },
  { value: 'Suppressed', label: 'Suppressed' },
];

const outcomeColors = {
  'Cured': 'cured',
  'Improved': 'improved',
  'No Change': 'no-change',
  'Aggravated': 'aggravated',
  'Suppressed': 'suppressed',
};

export default function Cases() {
  const [cases, setCases] = useState([]);
  const [remedies, setRemedies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterOutcome, setFilterOutcome] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCase, setNewCase] = useState({
    patient_initials: '',
    age: '',
    gender: '',
    chief_complaint: '',
    prescribed_remedy_id: '',
    potency: '',
    dosage: '',
    outcome: '',
    follow_up_notes: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (filterOutcome) {
      loadCases({ outcome: filterOutcome });
    } else {
      loadCases();
    }
  }, [filterOutcome]);

  async function loadData() {
    try {
      const [casesData, remediesData] = await Promise.all([
        casesAPI.getAll(),
        remediesAPI.getAll()
      ]);
      setCases(casesData);
      setRemedies(remediesData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadCases(filters = {}) {
    try {
      setLoading(true);
      const data = await casesAPI.getAll(filters);
      setCases(data);
    } catch (err) {
      console.error('Failed to load cases:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateCase(e) {
    e.preventDefault();
    try {
      await casesAPI.create({
        ...newCase,
        prescribed_remedy_id: newCase.prescribed_remedy_id ? parseInt(newCase.prescribed_remedy_id) : null,
        age: newCase.age ? parseInt(newCase.age) : null
      });
      setNewCase({
        patient_initials: '',
        age: '',
        gender: '',
        chief_complaint: '',
        prescribed_remedy_id: '',
        potency: '',
        dosage: '',
        outcome: '',
        follow_up_notes: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowAddModal(false);
      loadData();
    } catch (err) {
      alert('Failed to create case: ' + err.response?.data?.error || err.message);
    }
  }

  const getOutcomeBadgeVariant = (outcome) => {
    return outcomeColors[outcome] || 'default';
  };

  if (loading && cases.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Case Log
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Document and track patient cases and treatment outcomes
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Log Case
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filter:</span>
          </div>
          <Select
            options={outcomeOptions}
            value={filterOutcome}
            onChange={(e) => setFilterOutcome(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
        </div>
      </Card>

      {/* Cases List */}
      <div className="space-y-4">
        {cases.map((caseItem) => (
          <Card key={caseItem.id} className="card-hover">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <User className="w-4 h-4" />
                    <span className="font-semibold">{caseItem.patient_initials}</span>
                  </div>
                  {caseItem.age && (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      Age: {caseItem.age}
                    </span>
                  )}
                  {caseItem.gender && (
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      {caseItem.gender}
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span className="text-sm">{caseItem.date}</span>
                  </div>
                </div>
                
                <p className="text-slate-900 dark:text-white font-medium mb-2">
                  {caseItem.chief_complaint}
                </p>
                
                {caseItem.remedy_name && (
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <Badge variant="default">
                      Rx: {caseItem.remedy_name}
                    </Badge>
                    {caseItem.potency && (
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Potency: {caseItem.potency}
                      </span>
                    )}
                    {caseItem.dosage && (
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Dosage: {caseItem.dosage}
                      </span>
                    )}
                  </div>
                )}
                
                {caseItem.outcome && (
                  <Badge variant={getOutcomeBadgeVariant(caseItem.outcome)} className="mt-2">
                    Outcome: {caseItem.outcome}
                  </Badge>
                )}
                
                {caseItem.follow_up_notes && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <strong>Notes:</strong> {caseItem.follow_up_notes}
                  </p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {cases.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">
            {filterOutcome 
              ? `No cases found with outcome "${filterOutcome}".` 
              : 'No cases logged yet. Click "Log Case" to document your first patient case.'}
          </p>
        </Card>
      )}

      {/* Add Case Modal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Log New Case"
      >
        <form onSubmit={handleCreateCase} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Patient Initials *"
              placeholder="e.g., AB"
              value={newCase.patient_initials}
              onChange={(e) => setNewCase({...newCase, patient_initials: e.target.value.toUpperCase()})}
              required
            />
            <Input
              label="Age"
              type="number"
              placeholder="e.g., 35"
              value={newCase.age}
              onChange={(e) => setNewCase({...newCase, age: e.target.value})}
            />
            <Select
              label="Gender"
              placeholder="Select..."
              options={[
                { value: '', label: 'Select...' },
                { value: 'M', label: 'Male' },
                { value: 'F', label: 'Female' },
                { value: 'Other', label: 'Other' }
              ]}
              value={newCase.gender}
              onChange={(e) => setNewCase({...newCase, gender: e.target.value})}
            />
          </div>
          
          <Textarea
            label="Chief Complaint *"
            placeholder="Describe the main complaint or reason for consultation"
            rows={3}
            value={newCase.chief_complaint}
            onChange={(e) => setNewCase({...newCase, chief_complaint: e.target.value})}
            required
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Prescribed Remedy"
              placeholder="Select remedy..."
              options={[
                { value: '', label: 'Select remedy...' },
                ...remedies.map(r => ({ value: r.id.toString(), label: r.name }))
              ]}
              value={newCase.prescribed_remedy_id}
              onChange={(e) => setNewCase({...newCase, prescribed_remedy_id: e.target.value})}
            />
            <Input
              label="Potency"
              placeholder="e.g., 30C, 200C, LM1"
              value={newCase.potency}
              onChange={(e) => setNewCase({...newCase, potency: e.target.value})}
            />
            <Input
              label="Dosage"
              placeholder="e.g., Twice daily"
              value={newCase.dosage}
              onChange={(e) => setNewCase({...newCase, dosage: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Outcome"
              options={outcomeOptions.filter(o => o.value !== '')}
              placeholder="Select outcome..."
              value={newCase.outcome}
              onChange={(e) => setNewCase({...newCase, outcome: e.target.value})}
            />
            <Input
              label="Date"
              type="date"
              value={newCase.date}
              onChange={(e) => setNewCase({...newCase, date: e.target.value})}
            />
          </div>
          
          <Textarea
            label="Follow-up Notes"
            placeholder="Additional observations, changes, next steps..."
            rows={3}
            value={newCase.follow_up_notes}
            onChange={(e) => setNewCase({...newCase, follow_up_notes: e.target.value})}
          />
          
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} fullWidth>
              Cancel
            </Button>
            <Button type="submit" fullWidth>Save Case</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
