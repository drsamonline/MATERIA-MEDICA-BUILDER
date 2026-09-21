/**
 * Materia Medica Builder - Main Application
 * Offline-first PWA for homeopathic practitioners
 */

// ============================================
// DATABASE LAYER (IndexedDB)
// ============================================

const DB_NAME = 'MateriaMedicaDB';
const DB_VERSION = 1;

const dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create Remedies store
        if (!db.objectStoreNames.contains('remedies')) {
            const remedyStore = db.createObjectStore('remedies', { keyPath: 'id', autoIncrement: true });
            remedyStore.createIndex('name', 'name', { unique: false });
            remedyStore.createIndex('common_name', 'common_name', { unique: false });
        }
        
        // Create Symptoms store
        if (!db.objectStoreNames.contains('symptoms')) {
            const symptomStore = db.createObjectStore('symptoms', { keyPath: 'id', autoIncrement: true });
            symptomStore.createIndex('remedy_id', 'remedy_id', { unique: false });
            symptomStore.createIndex('confidence_level', 'confidence_level', { unique: false });
        }
        
        // Create Cases store
        if (!db.objectStoreNames.contains('cases')) {
            const caseStore = db.createObjectStore('cases', { keyPath: 'id', autoIncrement: true });
            caseStore.createIndex('prescribed_remedy_id', 'prescribed_remedy_id', { unique: false });
            caseStore.createIndex('outcome', 'outcome', { unique: false });
            caseStore.createIndex('date', 'date', { unique: false });
        }
    };
});

const db = {
    async getAll(storeName) {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    async getById(storeName, id) {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    async add(storeName, item) {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.add(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    async update(storeName, item) {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    },
    
    async delete(storeName, id) {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    async getByIndex(storeName, indexName, value) {
        const db = await dbPromise;
        return new Promise((resolve, reject) => {
            const tx = db.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
};

// ============================================
// SAMPLE DATA
// ============================================

const sampleRemedies = [
    { name: 'Arnica montana', common_name: 'Mountain Tobacco', source_family: 'Asteraceae', notes: 'The great injury remedy. For trauma, bruises, and soreness.' },
    { name: 'Belladonna', common_name: 'Deadly Nightshade', source_family: 'Solanaceae', notes: 'Sudden intense symptoms. Heat, redness, throbbing.' },
    { name: 'Nux vomica', common_name: 'Poison Nut', source_family: 'Loganiaceae', notes: 'For overindulgence, irritability, digestive issues.' },
    { name: 'Pulsatilla nigricans', common_name: 'Windflower', source_family: 'Ranunculaceae', notes: 'Changeable symptoms, weepy disposition, worse in warmth.' },
    { name: 'Sulphur', common_name: 'Brimstone', source_family: 'Mineral', notes: 'The king of antipsorics. Skin conditions, burning sensations.' },
    { name: 'Calcarea carbonica', common_name: 'Calcium Carbonate', source_family: 'Mineral', notes: 'For chilly, anxious, overweight individuals.' },
    { name: 'Lycopodium clavatum', common_name: 'Club Moss', source_family: 'Lycopodiaceae', notes: 'Digestive issues, lack of confidence, worse 4-8pm.' },
    { name: 'Phosphorus', common_name: 'Phosphorus', source_family: 'Mineral', notes: 'Sympathetic, fearful, bleeding tendencies.' },
    { name: 'Silicea terra', common_name: 'Silica', source_family: 'Mineral', notes: 'For weak connective tissue, slow healing, obstinacy.' },
    { name: 'Natrum muriaticum', common_name: 'Sodium Chloride', source_family: 'Mineral', notes: 'Grief, reserved nature, headaches, skin conditions.' }
];

const sampleSymptoms = [
    { remedy_id: 1, description: 'Sore, bruised feeling all over', location: 'General', sensation: 'Sore, bruised', modality: 'Worse from touch, motion', confidence_level: 5, verified: true },
    { remedy_id: 1, description: 'Fear of being touched after injury', location: 'Mind', sensation: 'Anxiety', modality: 'Worse from approach', confidence_level: 4, verified: true },
    { remedy_id: 2, description: 'Sudden high fever with hot head', location: 'Head', sensation: 'Heat, throbbing', modality: 'Worse from jarring, light', confidence_level: 5, verified: true },
    { remedy_id: 2, description: 'Dilated pupils with sensitivity to light', location: 'Eyes', sensation: 'Photophobia', modality: 'Worse from light', confidence_level: 4, verified: true },
    { remedy_id: 3, description: 'Morning nausea with empty retching', location: 'Stomach', sensation: 'Nausea', modality: 'Better from eating', confidence_level: 4, verified: true },
    { remedy_id: 3, description: 'Irritable, impatient, easily angered', location: 'Mind', sensation: 'Irritability', modality: 'Worse morning, from consolation', confidence_level: 5, verified: true },
    { remedy_id: 4, description: 'Tearful, desires consolation', location: 'Mind', sensation: 'Sadness', modality: 'Better from consolation', confidence_level: 5, verified: true },
    { remedy_id: 4, description: 'Symptoms change rapidly', location: 'General', sensation: 'Variable', modality: 'Worse in warm room', confidence_level: 4, verified: true },
    { remedy_id: 5, description: 'Burning pains relieved by heat', location: 'General', sensation: 'Burning', modality: 'Better from hot applications', confidence_level: 4, verified: true },
    { remedy_id: 5, description: 'Offensive discharges', location: 'Skin', sensation: 'Itching', modality: 'Worse from washing', confidence_level: 4, verified: true }
];

const sampleCases = [
    { patient_initials: 'AB', age: 35, gender: 'F', chief_complaint: 'Severe bruising after fall', prescribed_remedy_id: 1, potency: '30C', dosage: 'Every 4 hours x 3 doses', outcome: 'Cured', follow_up_notes: 'Complete resolution within 2 days', date: '2024-01-15' },
    { patient_initials: 'CD', age: 42, gender: 'M', chief_complaint: 'Sudden fever 103°F', prescribed_remedy_id: 2, potency: '200C', dosage: 'Single dose', outcome: 'Cured', follow_up_notes: 'Fever broke within 6 hours', date: '2024-01-20' },
    { patient_initials: 'EF', age: 28, gender: 'M', chief_complaint: 'Chronic indigestion, irritability', prescribed_remedy_id: 3, potency: '30C', dosage: 'Twice daily x 2 weeks', outcome: 'Improved', follow_up_notes: '70% improvement in digestion', date: '2024-02-01' },
    { patient_initials: 'GH', age: 31, gender: 'F', chief_complaint: 'Emotional distress, weepiness', prescribed_remedy_id: 4, potency: '30C', dosage: 'Daily x 1 week', outcome: 'Cured', follow_up_notes: 'Mood stabilized, less tearful', date: '2024-02-10' },
    { patient_initials: 'IJ', age: 55, gender: 'M', chief_complaint: 'Chronic eczema with burning', prescribed_remedy_id: 5, potency: '200C', dosage: 'Weekly x 4 weeks', outcome: 'Improved', follow_up_notes: 'Reduced itching, some healing', date: '2024-02-15' },
    { patient_initials: 'KL', age: 45, gender: 'F', chief_complaint: 'Recurrent headaches', prescribed_remedy_id: 10, potency: '30C', dosage: 'As needed', outcome: 'No Change', follow_up_notes: 'No significant improvement', date: '2024-02-20' },
    { patient_initials: 'MN', age: 38, gender: 'M', chief_complaint: 'Anxiety with palpitations', prescribed_remedy_id: 8, potency: '30C', dosage: 'Twice daily x 2 weeks', outcome: 'Improved', follow_up_notes: 'Reduced anxiety episodes', date: '2024-03-01' },
    { patient_initials: 'OP', age: 52, gender: 'F', chief_complaint: 'Slow healing wounds', prescribed_remedy_id: 9, potency: '30C', dosage: 'Daily x 3 weeks', outcome: 'Cured', follow_up_notes: 'Healing time reduced significantly', date: '2024-03-10' }
];

// ============================================
// STATE MANAGEMENT
// ============================================

let currentState = {
    remedies: [],
    symptoms: [],
    cases: [],
    currentPage: 'dashboard',
    selectedRemedy: null,
    theme: 'light'
};

// ============================================
// THEME MANAGEMENT
// ============================================

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    currentState.theme = savedTheme;
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
}

function toggleTheme() {
    currentState.theme = currentState.theme === 'dark' ? 'light' : 'dark';
    applyTheme(currentState.theme);
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.textContent = message;
    toast.classList.remove('translate-x-full');
    
    setTimeout(() => {
        toast.classList.add('translate-x-full');
    }, duration);
}

// ============================================
// MODAL MANAGEMENT
// ============================================

function showModal(content) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
        <div class="modal">
            ${content}
            <button class="btn btn-secondary mt-4 w-full" onclick="this.closest('.modal-overlay').remove()">Close</button>
        </div>
    `;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// ============================================
// PAGE RENDERERS
// ============================================

async function renderDashboard() {
    const totalCases = currentState.cases.length;
    const curedCases = currentState.cases.filter(c => c.outcome === 'Cured').length;
    const successRate = totalCases > 0 ? Math.round((curedCases / totalCases) * 100) : 0;
    
    // Count remedy usage
    const remedyCounts = {};
    currentState.cases.forEach(c => {
        remedyCounts[c.prescribed_remedy_id] = (remedyCounts[c.prescribed_remedy_id] || 0) + 1;
    });
    
    const mostUsedRemedyId = Object.keys(remedyCounts).sort((a, b) => remedyCounts[b] - remedyCounts[a])[0];
    const mostUsedRemedy = mostUsedRemedyId ? currentState.remediess.find(r => r.id == mostUsedRemedyId) : null;
    
    // Outcome distribution
    const outcomes = { Cured: 0, Improved: 0, 'No Change': 0, Aggravated: 0, Suppressed: 0 };
    currentState.cases.forEach(c => outcomes[c.outcome] = (outcomes[c.outcome] || 0) + 1);
    
    // Top 5 remedies
    const topRemedies = Object.entries(remedyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => {
            const remedy = currentState.remedies.find(r => r.id == id);
            return { name: remedy ? remedy.name : 'Unknown', count };
        });
    
    // Cases over time (last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const casesByMonth = {};
    currentState.cases.forEach(c => {
        const month = new Date(c.date).getMonth();
        casesByMonth[month] = (casesByMonth[month] || 0) + 1;
    });
    const currentYear = new Date().getFullYear();
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: months[i],
        count: casesByMonth[i] || 0
    }));
    
    return `
        <div class="page-content">
            <h2 class="text-2xl font-bold mb-6">Dashboard Overview</h2>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${totalCases}</div>
                    <div class="stat-label">Total Cases</div>
                </div>
                <div class="stat-card secondary">
                    <div class="stat-value">${successRate}%</div>
                    <div class="stat-label">Success Rate</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-value">${mostUsedRemedy ? mostUsedRemedy.name.split(' ')[0] : 'N/A'}</div>
                    <div class="stat-label">Most Used Remedy</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);">
                    <div class="stat-value">${currentState.remedies.length}</div>
                    <div class="stat-label">Remedies in Library</div>
                </div>
            </div>
            
            <div class="charts-grid">
                <div class="chart-container">
                    <h3 class="font-semibold mb-4 text-lg">Outcome Distribution</h3>
                    <canvas id="outcomeChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3 class="font-semibold mb-4 text-lg">Top 5 Remedies</h3>
                    <canvas id="topRemediesChart"></canvas>
                </div>
                <div class="chart-container" style="grid-column: 1 / -1;">
                    <h3 class="font-semibold mb-4 text-lg">Cases Over Time (${currentYear})</h3>
                    <canvas id="timelineChart" height="80"></canvas>
                </div>
            </div>
            
            <div class="mt-6">
                <h3 class="font-semibold mb-4 text-lg">Recent Cases</h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Complaint</th>
                                <th>Remedy</th>
                                <th>Outcome</th>
                                <th>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${currentState.cases.slice(-5).reverse().map(c => {
                                const remedy = currentState.remedies.find(r => r.id === c.prescribed_remedy_id);
                                return `
                                    <tr>
                                        <td>${c.patient_initials}, ${c.age}${c.gender}</td>
                                        <td>${c.chief_complaint}</td>
                                        <td>${remedy ? remedy.name : 'Unknown'}</td>
                                        <td><span class="badge badge-${c.outcome.toLowerCase().replace(' ', '-')}">${c.outcome}</span></td>
                                        <td>${c.date}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

async function renderRemedies() {
    const searchParams = new URLSearchParams(window.location.search);
    const searchTerm = searchParams.get('search') || '';
    
    const filteredRemedies = searchTerm 
        ? currentState.remedies.filter(r => 
            r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.common_name.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : currentState.remedies;
    
    return `
        <div class="page-content">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 class="text-2xl font-bold">Remedies Library</h2>
                <button class="btn btn-primary" onclick="showAddRemedyModal()">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Remedy
                </button>
            </div>
            
            <div class="mb-6">
                <input type="text" class="input-field" placeholder="Search remedies..." 
                    value="${searchTerm}" onchange="window.location.href='?search='+this.value" 
                    onkeyup="if(event.key==='Enter') window.location.href='?search='+this.value">
            </div>
            
            ${filteredRemedies.length === 0 ? `
                <div class="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"/>
                    </svg>
                    <h3>No remedies found</h3>
                    <p>Add your first remedy to get started</p>
                </div>
            ` : `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${filteredRemedies.map(r => {
                        const symptomCount = currentState.symptoms.filter(s => s.remedy_id === r.id).length;
                        return `
                            <div class="card cursor-pointer hover:shadow-lg transition-shadow" onclick="showRemedyDetail(${r.id})">
                                <div class="flex justify-between items-start mb-2">
                                    <h3 class="font-bold text-lg">${r.name}</h3>
                                    <span class="badge badge-no-change">${symptomCount} symptoms</span>
                                </div>
                                <p class="text-sm text-slate-500 dark:text-slate-400 mb-2">${r.common_name}</p>
                                <p class="text-xs text-slate-400 dark:text-slate-500 mb-3">${r.source_family}</p>
                                <p class="text-sm line-clamp-2">${r.notes}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            `}
        </div>
    `;
}

async function renderCases() {
    const searchParams = new URLSearchParams(window.location.search);
    const filterOutcome = searchParams.get('outcome') || '';
    
    const filteredCases = filterOutcome
        ? currentState.cases.filter(c => c.outcome === filterOutcome)
        : currentState.cases;
    
    return `
        <div class="page-content">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 class="text-2xl font-bold">Case Logger</h2>
                <button class="btn btn-primary" onclick="showAddCaseModal()">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Log New Case
                </button>
            </div>
            
            <div class="mb-6 flex gap-2 flex-wrap">
                <button class="btn btn-secondary ${!filterOutcome ? 'bg-primary-600 text-white' : ''}" 
                    onclick="window.location.href='?page=cases'">All</button>
                <button class="btn btn-secondary ${filterOutcome === 'Cured' ? 'bg-primary-600 text-white' : ''}" 
                    onclick="window.location.href='?page=cases&outcome=Cured'">Cured</button>
                <button class="btn btn-secondary ${filterOutcome === 'Improved' ? 'bg-primary-600 text-white' : ''}" 
                    onclick="window.location.href='?page=cases&outcome=Improved'">Improved</button>
                <button class="btn btn-secondary ${filterOutcome === 'No Change' ? 'bg-primary-600 text-white' : ''}" 
                    onclick="window.location.href='?page=cases&outcome=No Change'">No Change</button>
                <button class="btn btn-secondary ${filterOutcome === 'Aggravated' ? 'bg-primary-600 text-white' : ''}" 
                    onclick="window.location.href='?page=cases&outcome=Aggravated'">Aggravated</button>
            </div>
            
            ${filteredCases.length === 0 ? `
                <div class="empty-state">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <h3>No cases logged yet</h3>
                    <p>Start documenting your clinical observations</p>
                </div>
            ` : `
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Patient</th>
                                <th>Age/Sex</th>
                                <th>Chief Complaint</th>
                                <th>Remedy</th>
                                <th>Potency</th>
                                <th>Outcome</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${filteredCases.map(c => {
                                const remedy = currentState.remedies.find(r => r.id === c.prescribed_remedy_id);
                                return `
                                    <tr>
                                        <td>${c.patient_initials}</td>
                                        <td>${c.age}/${c.gender}</td>
                                        <td>${c.chief_complaint}</td>
                                        <td>${remedy ? remedy.name : 'Unknown'}</td>
                                        <td>${c.potency}</td>
                                        <td><span class="badge badge-${c.outcome.toLowerCase().replace(' ', '-')}">${c.outcome}</span></td>
                                        <td>${c.date}</td>
                                        <td>
                                            <button class="text-primary-600 hover:text-primary-700 mr-2" onclick="showCaseDetail(${c.id})">View</button>
                                            <button class="text-red-600 hover:text-red-700" onclick="deleteCase(${c.id})">Delete</button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        </div>
    `;
}

async function renderSettings() {
    return `
        <div class="page-content">
            <h2 class="text-2xl font-bold mb-6">Settings</h2>
            
            <div class="space-y-6 max-w-2xl">
                <div class="card">
                    <h3 class="font-semibold text-lg mb-4">Appearance</h3>
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="font-medium">Dark Mode</p>
                            <p class="text-sm text-slate-500 dark:text-slate-400">Toggle between light and dark themes</p>
                        </div>
                        <button id="settingsThemeToggle" class="btn btn-primary" onclick="toggleTheme()">
                            ${currentState.theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
                        </button>
                    </div>
                </div>
                
                <div class="card">
                    <h3 class="font-semibold text-lg mb-4">Data Management</h3>
                    <div class="space-y-4">
                        <div>
                            <p class="font-medium mb-2">Export Data</p>
                            <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">Download all your data as a JSON file for backup or analysis</p>
                            <button class="btn btn-secondary" onclick="exportData()">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                                </svg>
                                Export JSON
                            </button>
                        </div>
                        
                        <div>
                            <p class="font-medium mb-2">Import Data</p>
                            <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">Restore data from a previously exported JSON file</p>
                            <input type="file" id="importFile" accept=".json" class="input-field mb-3" onchange="importData(this)">
                        </div>
                        
                        <div>
                            <p class="font-medium text-red-600 mb-2">Danger Zone</p>
                            <p class="text-sm text-slate-500 dark:text-slate-400 mb-3">Permanently delete all data from local storage</p>
                            <button class="btn btn-danger" onclick="clearAllData()">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                </svg>
                                Clear All Data
                            </button>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h3 class="font-semibold text-lg mb-4">About</h3>
                    <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <strong>Materia Medica Builder</strong> v1.0.0
                    </p>
                    <p class="text-sm text-slate-600 dark:text-slate-400">
                        A personal research tool for homeopathic practitioners to document clinical cases, 
                        track remedy outcomes, and build a custom, evidence-based Materia Medica from their own observations.
                    </p>
                    <p class="text-sm text-slate-600 dark:text-slate-400 mt-3">
                        This is an offline-first Progressive Web App (PWA). All data is stored locally in your browser 
                        using IndexedDB and never leaves your device.
                    </p>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// MODAL FORMS
// ============================================

function showAddRemedyModal() {
    showModal(`
        <h3 class="text-xl font-bold mb-4">Add New Remedy</h3>
        <form onsubmit="addRemedy(event)" class="space-y-4">
            <div>
                <label class="input-label">Remedy Name *</label>
                <input type="text" name="name" class="input-field" required placeholder="e.g., Arnica montana">
            </div>
            <div>
                <label class="input-label">Common Name</label>
                <input type="text" name="common_name" class="input-field" placeholder="e.g., Mountain Tobacco">
            </div>
            <div>
                <label class="input-label">Source Family</label>
                <input type="text" name="source_family" class="input-field" placeholder="e.g., Asteraceae">
            </div>
            <div>
                <label class="input-label">Notes</label>
                <textarea name="notes" class="input-field" rows="3" placeholder="Key characteristics and indications"></textarea>
            </div>
            <button type="submit" class="btn btn-primary w-full">Save Remedy</button>
        </form>
    `);
}

function showAddCaseModal() {
    const remedyOptions = currentState.remedies.map(r => 
        `<option value="${r.id}">${r.name}</option>`
    ).join('');
    
    showModal(`
        <h3 class="text-xl font-bold mb-4">Log New Case</h3>
        <form onsubmit="addCase(event)" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="input-label">Patient Initials *</label>
                    <input type="text" name="patient_initials" class="input-field" required placeholder="AB" maxlength="5">
                </div>
                <div>
                    <label class="input-label">Age *</label>
                    <input type="number" name="age" class="input-field" required min="0" max="120">
                </div>
            </div>
            <div>
                <label class="input-label">Gender *</label>
                <select name="gender" class="input-field" required>
                    <option value="">Select...</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                </select>
            </div>
            <div>
                <label class="input-label">Chief Complaint *</label>
                <input type="text" name="chief_complaint" class="input-field" required placeholder="Main symptom or condition">
            </div>
            <div>
                <label class="input-label">Prescribed Remedy *</label>
                <select name="prescribed_remedy_id" class="input-field" required>
                    <option value="">Select remedy...</option>
                    ${remedyOptions}
                </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="input-label">Potency *</label>
                    <input type="text" name="potency" class="input-field" required placeholder="30C, 200C, etc.">
                </div>
                <div>
                    <label class="input-label">Date *</label>
                    <input type="date" name="date" class="input-field" required value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div>
                <label class="input-label">Dosage</label>
                <input type="text" name="dosage" class="input-field" placeholder="e.g., Twice daily x 2 weeks">
            </div>
            <div>
                <label class="input-label">Outcome *</label>
                <select name="outcome" class="input-field" required>
                    <option value="">Select...</option>
                    <option value="Cured">Cured</option>
                    <option value="Improved">Improved</option>
                    <option value="No Change">No Change</option>
                    <option value="Aggravated">Aggravated</option>
                    <option value="Suppressed">Suppressed</option>
                </select>
            </div>
            <div>
                <label class="input-label">Follow-up Notes</label>
                <textarea name="follow_up_notes" class="input-field" rows="3" placeholder="Observations and results"></textarea>
            </div>
            <button type="submit" class="btn btn-primary w-full">Save Case</button>
        </form>
    `);
}

function showRemedyDetail(remedyId) {
    const remedy = currentState.remedies.find(r => r.id === remedyId);
    if (!remedy) return;
    
    const symptoms = currentState.symptoms
        .filter(s => s.remedy_id === remedyId)
        .sort((a, b) => b.confidence_level - a.confidence_level);
    
    const symptomList = symptoms.length > 0 
        ? symptoms.map(s => `
            <div class="border-l-4 border-primary-500 pl-4 py-2 mb-3">
                <div class="flex justify-between items-start">
                    <p class="font-medium">${s.description}</p>
                    <div class="star-rating">
                        ${Array.from({length: 5}, (_, i) => 
                            `<svg class="w-4 h-4 star ${i < s.confidence_level ? 'filled' : ''}" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                            </svg>`
                        ).join('')}
                    </div>
                </div>
                <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    <strong>Location:</strong> ${s.location} | 
                    <strong>Sensation:</strong> ${s.sensation} | 
                    <strong>Modality:</strong> ${s.modality}
                </p>
            </div>
          `).join('')
        : '<p class="text-slate-500 dark:text-slate-400 italic">No symptoms recorded yet.</p>';
    
    showModal(`
        <div class="max-h-[70vh] overflow-y-auto">
            <h3 class="text-xl font-bold mb-2">${remedy.name}</h3>
            <p class="text-slate-500 dark:text-slate-400 mb-3">${remedy.common_name} • ${remedy.source_family}</p>
            <p class="mb-4">${remedy.notes}</p>
            
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-semibold text-lg">Clinical Observations (${symptoms.length})</h4>
                <button class="btn btn-primary text-sm" onclick="showAddSymptomModal(${remedyId})">
                    Add Symptom
                </button>
            </div>
            
            ${symptomList}
        </div>
    `);
}

function showAddSymptomModal(remedyId) {
    // Close existing modal first
    document.querySelector('.modal-overlay')?.remove();
    
    const remedy = currentState.remedies.find(r => r.id === remedyId);
    
    showModal(`
        <h3 class="text-xl font-bold mb-4">Add Symptom to ${remedy.name}</h3>
        <form onsubmit="addSymptom(event, ${remedyId})" class="space-y-4">
            <div>
                <label class="input-label">Description *</label>
                <input type="text" name="description" class="input-field" required placeholder="e.g., Burning pain in stomach">
            </div>
            <div>
                <label class="input-label">Location *</label>
                <input type="text" name="location" class="input-field" required placeholder="e.g., Stomach, Head, Mind">
            </div>
            <div>
                <label class="input-label">Sensation *</label>
                <input type="text" name="sensation" class="input-field" required placeholder="e.g., Burning, Throbbing, Stabbing">
            </div>
            <div>
                <label class="input-label">Modality *</label>
                <input type="text" name="modality" class="input-field" required placeholder="e.g., Worse from cold, Better from pressure">
            </div>
            <div>
                <label class="input-label">Confidence Level (1-5) *</label>
                <div class="flex gap-2 my-2">
                    ${Array.from({length: 5}, (_, i) => `
                        <input type="radio" name="confidence_level" value="${i+1}" id="conf${i+1}" class="hidden" ${i === 3 ? 'checked' : ''}>
                        <label for="conf${i+1}" class="star ${i <= 3 ? 'filled' : ''}" style="cursor:pointer;font-size:1.5rem;">★</label>
                    `).join('')}
                </div>
            </div>
            <div>
                <label class="flex items-center gap-2">
                    <input type="checkbox" name="verified" checked class="w-5 h-5">
                    <span>Verified observation</span>
                </label>
            </div>
            <button type="submit" class="btn btn-primary w-full">Save Symptom</button>
        </form>
    `);
}

function showCaseDetail(caseId) {
    const caseData = currentState.cases.find(c => c.id === caseId);
    if (!caseData) return;
    
    const remedy = currentState.remedies.find(r => r.id === caseData.prescribed_remedy_id);
    
    showModal(`
        <h3 class="text-xl font-bold mb-4">Case Details</h3>
        <div class="space-y-3">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Patient</p>
                    <p class="font-medium">${caseData.patient_initials}, ${caseData.age}yo ${caseData.gender === 'M' ? 'Male' : caseData.gender === 'F' ? 'Female' : 'Other'}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Date</p>
                    <p class="font-medium">${caseData.date}</p>
                </div>
            </div>
            <div>
                <p class="text-sm text-slate-500 dark:text-slate-400">Chief Complaint</p>
                <p class="font-medium">${caseData.chief_complaint}</p>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Remedy</p>
                    <p class="font-medium">${remedy ? remedy.name : 'Unknown'}</p>
                </div>
                <div>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Potency</p>
                    <p class="font-medium">${caseData.potency}</p>
                </div>
            </div>
            <div>
                <p class="text-sm text-slate-500 dark:text-slate-400">Dosage</p>
                <p class="font-medium">${caseData.dosage || 'Not specified'}</p>
            </div>
            <div>
                <p class="text-sm text-slate-500 dark:text-slate-400">Outcome</p>
                <p><span class="badge badge-${caseData.outcome.toLowerCase().replace(' ', '-')}">${caseData.outcome}</span></p>
            </div>
            <div>
                <p class="text-sm text-slate-500 dark:text-slate-400">Follow-up Notes</p>
                <p class="font-medium">${caseData.follow_up_notes || 'None'}</p>
            </div>
        </div>
    `);
}

// ============================================
// DATA OPERATIONS
// ============================================

async function addRemedy(event) {
    event.preventDefault();
    const form = event.target;
    
    const newRemedy = {
        name: form.name.value,
        common_name: form.common_name.value,
        source_family: form.source_family.value,
        notes: form.notes.value,
        created_at: new Date().toISOString()
    };
    
    await db.add('remedies', newRemedy);
    await loadData();
    showToast('Remedy added successfully!');
    form.closest('.modal-overlay').remove();
    renderCurrentPage();
}

async function addSymptom(event, remedyId) {
    event.preventDefault();
    const form = event.target;
    
    const confidenceRadios = form.querySelectorAll('input[name="confidence_level"]');
    let confidenceLevel = 3;
    confidenceRadios.forEach(radio => {
        if (radio.checked) confidenceLevel = parseInt(radio.value);
    });
    
    const newSymptom = {
        remedy_id: remedyId,
        description: form.description.value,
        location: form.location.value,
        sensation: form.sensation.value,
        modality: form.modality.value,
        confidence_level: confidenceLevel,
        verified: form.verified.checked
    };
    
    await db.add('symptoms', newSymptom);
    await loadData();
    showToast('Symptom added successfully!');
    form.closest('.modal-overlay').remove();
    showRemedyDetail(remedyId);
}

async function addCase(event) {
    event.preventDefault();
    const form = event.target;
    
    const newCase = {
        patient_initials: form.patient_initials.value,
        age: parseInt(form.age.value),
        gender: form.gender.value,
        chief_complaint: form.chief_complaint.value,
        prescribed_remedy_id: parseInt(form.prescribed_remedy_id.value),
        potency: form.potency.value,
        dosage: form.dosage.value,
        outcome: form.outcome.value,
        follow_up_notes: form.follow_up_notes.value,
        date: form.date.value
    };
    
    await db.add('cases', newCase);
    await loadData();
    showToast('Case logged successfully!');
    form.closest('.modal-overlay').remove();
    renderCurrentPage();
}

async function deleteCase(caseId) {
    if (!confirm('Are you sure you want to delete this case?')) return;
    
    await db.delete('cases', caseId);
    await loadData();
    showToast('Case deleted successfully!');
    renderCurrentPage();
}

async function exportData() {
    const data = {
        remedies: currentState.remedies,
        symptoms: currentState.symptoms,
        cases: currentState.cases,
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `materia-medica-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Data exported successfully!');
}

async function importData(input) {
    const file = input.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!data.remedies || !data.cases) {
            throw new Error('Invalid backup file format');
        }
        
        // Clear existing data
        const remedies = await db.getAll('remedies');
        for (const r of remedies) await db.delete('remedies', r.id);
        
        const symptoms = await db.getAll('symptoms');
        for (const s of symptoms) await db.delete('symptoms', s.id);
        
        const cases = await db.getAll('cases');
        for (const c of cases) await db.delete('cases', c.id);
        
        // Import new data
        for (const remedy of data.remedies) {
            await db.add('remedies', remedy);
        }
        
        for (const symptom of data.symptoms || []) {
            await db.add('symptoms', symptom);
        }
        
        for (const caseData of data.cases) {
            await db.add('cases', caseData);
        }
        
        await loadData();
        showToast('Data imported successfully!');
        renderCurrentPage();
    } catch (error) {
        showToast('Error importing data: ' + error.message);
    }
}

async function clearAllData() {
    if (!confirm('WARNING: This will permanently delete ALL your data. This cannot be undone. Are you absolutely sure?')) return;
    if (!confirm('Really sure? Consider exporting your data first!')) return;
    
    const remedies = await db.getAll('remedies');
    for (const r of remedies) await db.delete('remedies', r.id);
    
    const symptoms = await db.getAll('symptoms');
    for (const s of symptoms) await db.delete('symptoms', s.id);
    
    const cases = await db.getAll('cases');
    for (const c of cases) await db.delete('cases', c.id);
    
    await loadData();
    showToast('All data cleared');
    renderCurrentPage();
}

// ============================================
// DATA LOADING & INITIALIZATION
// ============================================

async function loadData() {
    currentState.remedies = await db.getAll('remedies');
    currentState.symptoms = await db.getAll('symptoms');
    currentState.cases = await db.getAll('cases');
}

async function initializeData() {
    const existingRemedies = await db.getAll('remedies');
    
    if (existingRemedies.length === 0) {
        // Seed initial data
        for (const remedy of sampleRemedies) {
            const id = await db.add('remedies', {
                ...remedy,
                created_at: new Date().toISOString()
            });
            
            // Add associated symptoms
            const remedySymptoms = sampleSymptoms.filter(s => s.remedy_id === id);
            for (const symptom of remedySymptoms) {
                await db.add('symptoms', { ...symptom, remedy_id: id });
            }
        }
        
        // Add sample cases
        for (const caseData of sampleCases) {
            await db.add('cases', caseData);
        }
    }
    
    await loadData();
}

// ============================================
// NAVIGATION & ROUTING
// ============================================

let charts = {};

function destroyCharts() {
    Object.values(charts).forEach(chart => chart.destroy());
    charts = {};
}

async function renderCurrentPage() {
    const content = document.getElementById('content');
    content.innerHTML = '<div class="flex justify-center py-12"><div class="spinner"></div></div>';
    
    destroyCharts();
    
    let html;
    switch (currentState.currentPage) {
        case 'dashboard':
            html = await renderDashboard();
            break;
        case 'remedies':
            html = await renderRemedies();
            break;
        case 'cases':
            html = await renderCases();
            break;
        case 'settings':
            html = await renderSettings();
            break;
        default:
            html = await renderDashboard();
    }
    
    content.innerHTML = html;
    
    // Initialize charts if on dashboard
    if (currentState.currentPage === 'dashboard') {
        setTimeout(initCharts, 100);
    }
    
    // Update navigation state
    document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
        const isActive = btn.dataset.page === currentState.currentPage;
        btn.classList.toggle('active', isActive);
        if (btn.classList.contains('nav-btn')) {
            btn.classList.toggle('bg-primary-600', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('bg-slate-200', !isActive);
            btn.classList.toggle('dark:bg-slate-700', !isActive);
        } else {
            btn.classList.toggle('text-primary-600', isActive);
            btn.classList.toggle('dark:text-primary-400', isActive);
            btn.classList.toggle('text-slate-500', !isActive);
            btn.classList.toggle('dark:text-slate-400', !isActive);
        }
    });
}

function navigateTo(page) {
    currentState.currentPage = page;
    window.history.pushState({ page }, '', `?page=${page}`);
    renderCurrentPage();
}

function handleNavigation(e) {
    const btn = e.target.closest('[data-page]');
    if (!btn) return;
    
    const page = btn.dataset.page;
    navigateTo(page);
}

// ============================================
// CHART INITIALIZATION
// ============================================

function initCharts() {
    const outcomeCtx = document.getElementById('outcomeChart');
    const topRemediesCtx = document.getElementById('topRemediesChart');
    const timelineCtx = document.getElementById('timelineChart');
    
    if (!outcomeCtx || !topRemediesCtx || !timelineCtx) return;
    
    // Calculate outcome distribution
    const outcomes = { Cured: 0, Improved: 0, 'No Change': 0, Aggravated: 0, Suppressed: 0 };
    currentState.cases.forEach(c => {
        if (outcomes.hasOwnProperty(c.outcome)) {
            outcomes[c.outcome]++;
        }
    });
    
    // Outcome Pie Chart
    charts.outcome = new Chart(outcomeCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(outcomes),
            datasets: [{
                data: Object.values(outcomes),
                backgroundColor: ['#22c55e', '#eab308', '#6366f1', '#ef4444', '#9ca3af'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569'
                    }
                }
            }
        }
    });
    
    // Top Remedies Bar Chart
    const remedyCounts = {};
    currentState.cases.forEach(c => {
        remedyCounts[c.prescribed_remedy_id] = (remedyCounts[c.prescribed_remedy_id] || 0) + 1;
    });
    
    const topRemedies = Object.entries(remedyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => {
            const remedy = currentState.remedies.find(r => r.id == id);
            return { name: remedy ? remedy.name.split(' ')[0] : 'Unknown', count };
        });
    
    charts.topRemedies = new Chart(topRemediesCtx, {
        type: 'bar',
        data: {
            labels: topRemedies.map(r => r.name),
            datasets: [{
                label: 'Cases',
                data: topRemedies.map(r => r.count),
                backgroundColor: '#0d9488',
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569'
                    },
                    grid: {
                        color: document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0'
                    }
                },
                x: {
                    ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
    
    // Timeline Line Chart
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const casesByMonth = {};
    currentState.cases.forEach(c => {
        const month = new Date(c.date).getMonth();
        casesByMonth[month] = (casesByMonth[month] || 0) + 1;
    });
    const monthlyData = months.map((_, i) => casesByMonth[i] || 0);
    
    charts.timeline = new Chart(timelineCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Cases',
                data: monthlyData,
                borderColor: '#0d9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569'
                    },
                    grid: {
                        color: document.documentElement.classList.contains('dark') ? '#334155' : '#e2e8f0'
                    }
                },
                x: {
                    ticks: {
                        color: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#475569'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ============================================
// EVENT LISTENERS & INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize theme
    initTheme();
    
    // Theme toggle button
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Navigation
    document.getElementById('desktopNav').addEventListener('click', handleNavigation);
    document.getElementById('mobileNav').addEventListener('click', handleNavigation);
    
    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
        if (e.state && e.state.page) {
            currentState.currentPage = e.state.page;
            renderCurrentPage();
        }
    });
    
    // Initialize database and load data
    await initializeData();
    
    // Get initial page from URL
    const params = new URLSearchParams(window.location.search);
    const initialPage = params.get('page') || 'dashboard';
    currentState.currentPage = initialPage;
    
    // Render initial page
    await renderCurrentPage();
    
    console.log('Materia Medica Builder initialized successfully!');
});

// Make functions globally available
window.showAddRemedyModal = showAddRemedyModal;
window.showAddCaseModal = showAddCaseModal;
window.showRemedyDetail = showRemedyDetail;
window.showAddSymptomModal = showAddSymptomModal;
window.showCaseDetail = showCaseDetail;
window.deleteCase = deleteCase;
window.exportData = exportData;
window.importData = importData;
window.clearAllData = clearAllData;
window.toggleTheme = toggleTheme;
