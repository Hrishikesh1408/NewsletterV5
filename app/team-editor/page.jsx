'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';

const sectionConfig = {
  platform: { title: '🚀 Platform Updates', label: 'Platform Updates:', field: 'platform' },
  presales: { title: '🔐 Pre-Sales Updates', label: 'Pre-Sales Updates:', field: 'presales' },
  qa: { title: '🧪 Quality Assurance Updates', label: 'QA Updates:', field: 'qa' },
  enterprise: { title: '🏢 Enterprise Solutions Updates', label: 'Enterprise Updates:', field: 'enterprise' },
  sre: { title: '🛠 Site Reliability Engineering Updates', label: 'SRE Updates:', field: 'sre' }
};

export default function TeamEditorPage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);

  // Content states
  const [content, setContent] = useState('');
  const [awards, setAwards] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('userData');
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUserData(parsedUser);

      if (!parsedUser.role || !sectionConfig[parsedUser.role]) {
        alert('Access denied. Team editor role required.');
        router.push('/login');
        return;
      }

      loadProjects(token, parsedUser.role);
    } catch (e) {
      console.error(e);
      router.push('/login');
    }
  }, []);

  useEffect(() => {
    if (projectId) {
      loadContent(projectId);
    }
  }, [projectId]);

  // Listen to global project changes from Navbar
  useEffect(() => {
    const handleProjectChange = () => {
      const cachedProjId = localStorage.getItem('currentProject');
      if (cachedProjId && cachedProjId !== projectId) {
        setProjectId(cachedProjId);
      }
    };

    window.addEventListener('projectChanged', handleProjectChange);
    return () => window.removeEventListener('projectChanged', handleProjectChange);
  }, [projectId]);

  const loadProjects = async (token, role) => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);

        const cachedProjId = localStorage.getItem('currentProject');
        if (cachedProjId) {
          const found = data.find(p => p._id === cachedProjId);
          if (found) {
            setProjectId(cachedProjId);
            return;
          }
        }
        
        if (data.length > 0) {
          // Open project selection modal if none selected
          setShowProjectModal(true);
        } else {
          alert('No collaborative projects available. Please contact an administrator.');
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const loadContent = async (projId) => {
    if (!projId || !userData) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/newsletters/${projId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        const roleField = sectionConfig[userData.role].field;
        setContent(data[roleField] || '');

        // Load awards matching this user's department
        if (data.awards && Array.isArray(data.awards)) {
          const deptAwards = data.awards.filter(award => award.department === userData.role);
          setAwards(deptAwards);
        } else {
          setAwards([]);
        }
      }
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectProject = (id) => {
    localStorage.setItem('currentProject', id);
    setProjectId(id);
    setShowProjectModal(false);
    window.dispatchEvent(new CustomEvent('projectChanged', { detail: { projectId: id } }));
  };

  const addAward = () => {
    const newAward = {
      id: Date.now(),
      name: '',
      type: 'spark',
      description: '',
      submittedBy: userData.firstName || userData.email,
      department: userData.role
    };
    setAwards([...awards, newAward]);
  };

  const updateAward = (id, field, value) => {
    setAwards(prev => prev.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const removeAward = (id) => {
    setAwards(prev => prev.filter(a => a.id !== id));
  };

  const handleSave = async () => {
    if (!projectId || !userData) return;
    setSaving(true);

    const token = localStorage.getItem('token');
    const roleField = sectionConfig[userData.role].field;

    const payload = {
      [roleField]: content,
      awards: awards,
      section: userData.role
    };

    try {
      const res = await fetch(`/api/newsletters/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Updates saved successfully!');
        setPreviewOpen(false);
      } else {
        const err = await res.json();
        alert('Failed to save updates: ' + (err.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to save content:', error);
      alert('Error saving updates');
    } finally {
      setSaving(false);
    }
  };

  if (!userData) return null;

  const config = sectionConfig[userData.role];

  return (
    <div className="flex-1 p-8 md:p-12 bg-neutral-900 max-w-5xl mx-auto w-full space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-neutral-500 uppercase mb-2">
            <span>Editor</span>
            <span>/</span>
            <span className="text-blue-500">Department Entry</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">{config.title}</h1>
          <p className="text-neutral-400 text-sm font-medium">Add updates and submit awards for your department's newsletter section.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadContent(projectId)}
            disabled={!projectId}
            className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 transition-all cursor-pointer disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg animate-hover-rotate">refresh</span>
            <span>Sync</span>
          </button>
          <button
            onClick={handleSave}
            disabled={!projectId || saving}
            className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/15 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <span className="material-symbols-outlined text-lg">save</span>
            )}
            <span>{saving ? 'Saving...' : 'Save Updates'}</span>
          </button>
        </div>
      </div>

      {showProjectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-neutral-850 border border-neutral-700 rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4">Select Collaborative Project</h3>
            <p className="text-neutral-400 text-sm mb-6">Choose which newsletter project edition you would like to edit updates for:</p>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {projects.map((p) => (
                <button
                  key={p._id}
                  onClick={() => selectProject(p._id)}
                  className="w-full text-left p-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-750 hover:bg-neutral-800 rounded-2xl transition-all"
                >
                  <div className="font-bold text-white text-sm">{p.name}</div>
                  <div className="text-xs text-neutral-400 mt-1 truncate">{p.description || 'No description'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {!projectId ? (
        <div className="text-center py-20 bg-neutral-850 rounded-3xl border border-neutral-800/60 shadow-xl">
          <span className="material-symbols-outlined text-neutral-500 text-5xl mb-4">layers</span>
          <h2 className="text-lg font-bold text-white mb-2">No Project Selected</h2>
          <p className="text-neutral-400 text-sm max-w-sm mx-auto">Please choose a newsletter project from the header dropdown to begin collaborative editing.</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Updates Editor */}
          <div className="bg-neutral-850 border border-neutral-800/80 p-6 md:p-8 rounded-3xl space-y-4 shadow-xl">
            <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">
              {config.label} Content
            </label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder={`Write your department's updates, achievements and deliverables...`}
            />
            <div className="flex justify-between items-center pt-2">
              <span className="text-[10px] text-neutral-500 font-bold">Rich HTML format supported.</span>
              <button
                type="button"
                onClick={() => setPreviewOpen(!previewOpen)}
                className="text-xs font-bold text-blue-400 hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                {previewOpen ? 'Hide Preview' : 'Show Preview'}
              </button>
            </div>

            {previewOpen && (
              <div className="mt-4 p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl text-sm leading-relaxed text-neutral-300">
                <h4 className="text-xs font-black text-neutral-400 uppercase tracking-wider mb-3 pb-1 border-b border-neutral-800">Section Content Preview</h4>
                {content.trim() && content !== '<p><br></p>' ? (
                  <div className="prose prose-invert" dangerouslySetInnerHTML={{ __html: content }} />
                ) : (
                  <em className="text-neutral-500 text-xs">No content entered yet.</em>
                )}
              </div>
            )}
          </div>

          {/* Department Awards */}
          <div className="bg-neutral-850 border border-neutral-800/80 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">emoji_events</span>
                  🏆 Department Awards
                </h2>
                <p className="text-xs text-neutral-400 mt-1">Nominate/recognize performers or teams within your division</p>
              </div>
              <button
                type="button"
                onClick={addAward}
                className="px-4 py-2 text-xs font-bold bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white rounded-xl transition-all"
              >
                + Add Award
              </button>
            </div>

            <div className="space-y-4">
              {awards.map((award) => (
                <div key={award.id} className="p-5 bg-neutral-900/40 border border-neutral-800 rounded-2xl relative space-y-4">
                  <button
                    type="button"
                    onClick={() => removeAward(award.id)}
                    className="absolute top-4 right-4 text-xs font-bold text-red-400 hover:text-white p-1"
                  >
                    ✕ Remove
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black tracking-wider uppercase text-neutral-400 mb-2">Winner Name</label>
                      <input
                        type="text"
                        value={award.name}
                        onChange={(e) => updateAward(award.id, 'name', e.target.value)}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs"
                        placeholder="Employee or Team Name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black tracking-wider uppercase text-neutral-400 mb-2">Award Category</label>
                      <select
                        value={award.type}
                        onChange={(e) => updateAward(award.id, 'type', e.target.value)}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs cursor-pointer"
                      >
                        <option value="spark">Spark Award</option>
                        <option value="lodestar">Lodestar</option>
                        <option value="performer">Performer of the Month</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black tracking-wider uppercase text-neutral-400 mb-2">Award Description / Reason</label>
                    <textarea
                      value={award.description}
                      onChange={(e) => updateAward(award.id, 'description', e.target.value)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs leading-relaxed"
                      rows={2}
                      placeholder="Why is this person/team receiving this recognition?"
                    />
                  </div>
                </div>
              ))}

              {awards.length === 0 && (
                <div className="text-center py-6 text-neutral-500 text-xs">
                  No awards nominated by your department for this edition yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
