const API_BASE = 'http://localhost:3000/api';

const api = {
  // Authentication
  async login(credentials) {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  // Projects
  async getProjects() {
    const response = await fetch(`${API_BASE}/projects`);
    return response.json();
  },

  async createProject(data) {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    
    // Auto-select the newly created project
    if (result.success && result.project) {
      localStorage.setItem('currentProject', result.project._id);
    }
    
    return result;
  },

  async updateProject(id, data) {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async deleteProject(id) {
    const response = await fetch(`${API_BASE}/projects/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Newsletter data
  async loadData() {
    const projectId = localStorage.getItem('currentProject');
    if (!projectId) return {};
    
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const response = await fetch(`${API_BASE}/newsletters/${projectId}`, { headers });
    const data = await response.json();
    
    // Ensure spotlight entries have all required fields
    if (data.spotlight) {
      data.spotlight = data.spotlight.map(person => ({
        name: person.name || '',
        role: person.role || '',
        tenure: person.tenure || '',
        project: person.project || '',
        tech: person.tech || '',
        quote: person.quote || '',
        facts: person.facts || '',
        growth: person.growth || '',
        reason: person.reason || '',
        photo: person.photo || ''
      }));
    }
    
    return data;
  },

  async saveData(data) {
    const projectId = localStorage.getItem('currentProject');
    if (!projectId) return;
    
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    // Ensure spotlight data includes all fields
    if (data.spotlight) {
      data.spotlight = data.spotlight.map(person => ({
        name: person.name || '',
        role: person.role || '',
        tenure: person.tenure || '',
        project: person.project || '',
        tech: person.tech || '',
        quote: person.quote || '',
        facts: person.facts || '',
        growth: person.growth || '',
        reason: person.reason || '',
        photo: person.photo || ''
      }));
    }
    
    if (data.birthdays) {
      data.birthdays = data.birthdays.map(birthday => ({
        name: birthday.name || '',
        date: birthday.date || '',
        image: birthday.image || '',
        wishes: birthday.wishes || ''
      }));
    }
    
    const response = await fetch(`${API_BASE}/newsletters/${projectId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    return response.json();
  },

  async generateHTML() {
    const projectId = localStorage.getItem('currentProject');
    if (!projectId) return { html: null };
    
    const response = await fetch(`${API_BASE}/newsletters/${projectId}/generate`, {
      method: 'POST'
    });
    return response.json();
  },

  // Admin functions
  async getStatus() {
    const projectId = localStorage.getItem('currentProject');
    if (!projectId) return {};
    
    const response = await fetch(`${API_BASE}/admin/status/${projectId}`);
    return response.json();
  },

  async getChanges() {
    const projectId = localStorage.getItem('currentProject');
    if (!projectId) return [];
    
    const response = await fetch(`${API_BASE}/admin/changes/${projectId}`);
    return response.json();
  },

  async trackChange(section, status) {
    const projectId = localStorage.getItem('currentProject');
    if (!projectId) return;
    
    const response = await fetch(`${API_BASE}/admin/track-change`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, section, status })
    });
    return response.json();
  },

  async updateStatus(statusUpdate) {
    const projectId = localStorage.getItem('currentProject');
    if (!projectId) return { success: false };
    
    const response = await fetch(`${API_BASE}/admin/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, ...statusUpdate })
    });
    return response.json();
  },

  // Helper to get current project
  getCurrentProject() {
    return localStorage.getItem('currentProject');
  },

  // Helper to set current project
  setCurrentProject(projectId) {
    localStorage.setItem('currentProject', projectId);
    // Trigger project change event
    window.dispatchEvent(new CustomEvent('projectChanged', { 
      detail: { projectId } 
    }));
  },

  // Template configuration
  async saveTemplateConfig(config) {
    const projectId = localStorage.getItem('currentProject');
    if (!projectId) return { success: false };
    
    const response = await fetch(`${API_BASE}/projects/${projectId}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return response.json();
  },

  async getTemplateConfig() {
    const projectId = localStorage.getItem('currentProject');
    if (!projectId) return {};
    
    const response = await fetch(`${API_BASE}/projects/${projectId}/config`);
    return response.json();
  }
};

// Make api available globally
if (typeof window !== 'undefined') {
  window.api = api;
}