'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JournalPage() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create / Edit modal states
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState('turbify');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));

  const months = [
    { value: '01', name: 'January' },
    { value: '02', name: 'February' },
    { value: '03', name: 'March' },
    { value: '04', name: 'April' },
    { value: '05', name: 'May' },
    { value: '06', name: 'June' },
    { value: '07', name: 'July' },
    { value: '08', name: 'August' },
    { value: '09', name: 'September' },
    { value: '10', name: 'October' },
    { value: '11', name: 'November' },
    { value: '12', name: 'December' }
  ];

  const getMonthName = (m) => {
    const found = months.find(item => item.value === m);
    return found ? found.name : m;
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditId(null);
    setName('');
    setDescription('');
    setTemplate('turbify');
    setMonth(String(new Date().getMonth() + 1).padStart(2, '0'));
    setYear(String(new Date().getFullYear()));
    setShowModal(true);
  };

  const openEditModal = (proj) => {
    setEditId(proj._id);
    setName(proj.name);
    setDescription(proj.description || '');
    setTemplate(proj.template || 'turbify');
    setMonth(proj.month || '01');
    setYear(proj.year || String(new Date().getFullYear()));
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !template || !month || !year) return;

    const token = localStorage.getItem('token');
    const url = editId ? `/api/projects/${editId}` : '/api/projects';
    const method = editId ? 'PUT' : 'POST';
    const body = editId 
      ? JSON.stringify({ name, description }) 
      : JSON.stringify({ name, description, template, month, year });

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body
      });
      const result = await response.json();

      if (result.success) {
        if (!editId) {
          localStorage.setItem('currentProject', result.project._id);
          window.dispatchEvent(new CustomEvent('projectChanged', { detail: { projectId: result.project._id } }));
        }
        setShowModal(false);
        loadProjects();
        if (!editId && template === 'turbify') {
          router.push('/dept-forms');
        }
      } else {
        alert('Failed to save journal entry: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Error saving journal entry');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this journal entry? All related content will be lost.')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        // Clear selection if current project is deleted
        if (localStorage.getItem('currentProject') === id) {
          localStorage.removeItem('currentProject');
        }
        loadProjects();
      } else {
        alert('Failed to delete entry');
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const openProject = (id) => {
    localStorage.setItem('currentProject', id);
    window.dispatchEvent(new CustomEvent('projectChanged', { detail: { projectId: id } }));
    router.push('/dept-forms');
  };

  const viewAdmin = (id) => {
    localStorage.setItem('currentProject', id);
    window.dispatchEvent(new CustomEvent('projectChanged', { detail: { projectId: id } }));
    router.push('/admin');
  };

  const filteredProjects = projects.filter(proj => 
    proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const years = Array.from({ length: 8 }, (_, i) => String(new Date().getFullYear() - 2 + i));

  return (
    <div className="flex-1 p-8 md:p-12 bg-neutral-900 max-w-7xl mx-auto w-full space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-neutral-500 uppercase mb-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-blue-500">Journal</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Newsletter Journal</h1>
          <p className="text-neutral-400 text-sm font-medium">Create and organize your monthly collaborative newsletter editions</p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/15 active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          <span>New Entry</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search journal entries..."
          className="w-full rounded-xl border border-neutral-800 bg-neutral-850 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-white text-sm placeholder:text-neutral-500 pl-10 pr-4 py-3 transition-all"
        />
        <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 text-lg">search</span>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div key={project._id} className="bg-neutral-850 border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between hover:border-neutral-700 transition-all shadow-lg hover:shadow-xl group">
              <div>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-white leading-tight group-hover:text-blue-400 transition-colors">{project.name}</h3>
                    <p className="text-xs text-neutral-400 font-medium mt-1 leading-relaxed line-clamp-2">{project.description || 'No description provided.'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(project)}
                      className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(project._id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md">
                    {project.template || 'turbify'}
                  </span>
                  {project.month && project.year && (
                    <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
                      {getMonthName(project.month)} {project.year}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-[10px] font-bold text-neutral-500 flex justify-between border-t border-neutral-800/80 pt-3">
                  <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                  {project.lastModified && <span>Updated: {new Date(project.lastModified).toLocaleDateString()}</span>}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openProject(project._id)}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/10 active:scale-[0.98] cursor-pointer"
                  >
                    Open Editor
                  </button>
                  <button
                    onClick={() => viewAdmin(project._id)}
                    className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs rounded-xl transition-all border border-neutral-700 active:scale-[0.98] cursor-pointer"
                  >
                    Admin
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredProjects.length === 0 && (
            <div className="col-span-full text-center py-20 bg-neutral-850/50 rounded-3xl border border-dashed border-neutral-800">
              <span className="material-symbols-outlined text-neutral-500 text-6xl mb-4">folder_open</span>
              <h3 className="text-lg font-bold text-white mb-2">No entries yet</h3>
              <p className="text-neutral-400 text-sm mb-6 max-w-sm mx-auto">Start collaborative writing by setting up a monthly newsletter entry first.</p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-blue-600/15 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">add</span>
                Create Entry
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-neutral-850 border border-neutral-700 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-xl font-bold text-white mb-6">
              {editId ? 'Edit Journal Entry' : 'Create New Entry'}
            </h3>
            
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Entry Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-white text-sm"
                  placeholder="e.g., June 2026 Edition"
                />
              </div>

              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-white text-sm"
                  rows="3"
                  placeholder="Summary of this newsletter (optional)"
                />
              </div>

              {!editId && (
                <>
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Template</label>
                    <select
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm cursor-pointer"
                    >
                      <option value="turbify">Turbify - Standard corporate newsletter</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Month</label>
                      <select
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm cursor-pointer"
                      >
                        {months.map(m => (
                          <option key={m.value} value={m.value}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Year</label>
                      <select
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm cursor-pointer"
                      >
                        {years.map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-neutral-400 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/15 transition-all cursor-pointer"
                >
                  {editId ? 'Save Changes' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
