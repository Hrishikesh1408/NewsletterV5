'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState(null);
  const [sectionStatus, setSectionStatus] = useState({});
  const [activitiesLog, setActivitiesLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const sections = ['Engineering', 'Business', 'Awards', 'Spotlight', 'HR Updates', 'Events', 'Notes', 'Images'];

  useEffect(() => {
    const cachedProjId = localStorage.getItem('currentProject');
    setProjectId(cachedProjId);

    if (cachedProjId) {
      loadData(cachedProjId);
    } else {
      setLoading(false);
    }

    const handleProjectChange = () => {
      const newProjId = localStorage.getItem('currentProject');
      setProjectId(newProjId);
      if (newProjId) {
        loadData(newProjId);
      }
    };

    window.addEventListener('projectChanged', handleProjectChange);
    return () => window.removeEventListener('projectChanged', handleProjectChange);
  }, []);

  const loadData = async (projId) => {
    setLoading(true);
    const token = localStorage.getItem('token');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      // Fetch status
      const statusRes = await fetch(`/api/admin/status/${projId}`, { headers });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSectionStatus(statusData);
      }

      // Fetch changes
      const changesRes = await fetch(`/api/admin/changes/${projId}`, { headers });
      if (changesRes.ok) {
        const changesData = await changesRes.json();
        setActivitiesLog(changesData);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadNewsletter = async () => {
    if (!projectId) {
      alert('Please select a project first.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/newsletters/${projectId}/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (!result.html) {
        alert('No generated newsletter found for this project. Save data in the Editor and click Generate HTML first.');
        return;
      }
      
      const blob = new Blob([result.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newsletter.html';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download newsletter:', error);
      alert('Error downloading newsletter.');
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400';
      case 'in-progress':
        return 'bg-amber-500/10 border border-amber-500/30 text-amber-400';
      default:
        return 'bg-rose-500/10 border border-rose-500/30 text-rose-400';
    }
  };

  const getStatusText = (status) => {
    if (!status) return 'Not Started';
    return status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!projectId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 bg-neutral-900">
        <div className="text-center p-8 bg-neutral-800 border border-neutral-700 rounded-3xl max-w-md shadow-2xl">
          <span className="material-symbols-outlined text-neutral-500 text-5xl mb-4">folder_open</span>
          <h2 className="text-xl font-bold text-white mb-2">No Project Selected</h2>
          <p className="text-neutral-400 text-sm">Please select a newsletter project from the navigation header dropdown to view its dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 md:p-12 bg-neutral-900 max-w-7xl mx-auto w-full space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-neutral-500 uppercase mb-2">
            <span>Admin</span>
            <span>/</span>
            <span className="text-blue-500">Dashboard</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Admin Dashboard</h1>
          <p className="text-neutral-400 text-sm font-medium">Manage your newsletter systems and track contribution statuses</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/preview')}
            className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-neutral-800 hover:bg-neutral-700 text-white transition-all border border-neutral-700 active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">preview</span>
            <span>Preview Newsletter</span>
          </button>
          <button
            onClick={downloadNewsletter}
            className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/15 active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span>Download HTML</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Section Status Checklist Grid */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400">check_circle</span>
              Section Status
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sections.map((sect) => {
                const sectData = sectionStatus[sect] || { status: 'not-started', progress: 0 };
                return (
                  <div key={sect} className="bg-neutral-850 border border-neutral-800/80 p-5 rounded-2xl flex flex-col justify-between hover:border-neutral-700 transition-all shadow-lg hover:shadow-xl">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-sm text-neutral-300">{sect}</h3>
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusBadgeClass(sectData.status)}`}>
                        {getStatusText(sectData.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold text-neutral-400">
                        <span>Progress</span>
                        <span>{sectData.progress}%</span>
                      </div>
                      <div className="w-full bg-neutral-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            sectData.status === 'completed' ? 'bg-emerald-500' :
                            sectData.status === 'in-progress' ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`}
                          style={{ width: `${sectData.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Activity Log & Quick Access Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* User Activities Log */}
            <section className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">history</span>
                User Activities Log
              </h2>
              
              <div className="bg-neutral-850 border border-neutral-800/80 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-800/60 border-b border-neutral-700/50">
                      <tr>
                        <th className="px-6 py-4.5 text-left text-xs font-bold text-neutral-400 uppercase tracking-widest">Section</th>
                        <th className="px-6 py-4.5 text-left text-xs font-bold text-neutral-400 uppercase tracking-widest">Last Modified</th>
                        <th className="px-6 py-4.5 text-left text-xs font-bold text-neutral-400 uppercase tracking-widest">Status</th>
                        <th className="px-6 py-4.5 text-right text-xs font-bold text-neutral-400 uppercase tracking-widest">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-850 bg-neutral-900/10">
                      {activitiesLog.map((log, index) => (
                        <tr key={index} className="hover:bg-neutral-800/20 transition-all">
                          <td className="px-6 py-4 text-sm font-bold text-white">{log.section}</td>
                          <td className="px-6 py-4 text-xs text-neutral-400 font-medium">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${getStatusBadgeClass(log.status)}`}>
                              {getStatusText(log.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => router.push('/dept-forms')}
                              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                      {activitiesLog.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-6 py-10 text-center text-sm font-semibold text-neutral-500">
                            No modifications logged for the active project.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            {/* Quick Access Sidebar */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">offline_pin</span>
                Quick Access
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                <div
                  onClick={() => router.push('/dept-forms')}
                  className="flex items-start gap-4 rounded-2xl border border-neutral-850 hover:border-neutral-750 bg-neutral-850 p-5 hover:bg-neutral-800/60 transition-all cursor-pointer group"
                >
                  <div className="bg-indigo-500/10 text-indigo-400 p-2.5 rounded-xl border border-indigo-500/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">edit_document</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Newsletter Editor</h3>
                    <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed">Update newsletter contents, business updates, new joiners, and awards.</p>
                  </div>
                </div>

                <div
                  onClick={() => router.push('/preview')}
                  className="flex items-start gap-4 rounded-2xl border border-neutral-850 hover:border-neutral-750 bg-neutral-850 p-5 hover:bg-neutral-800/60 transition-all cursor-pointer group"
                >
                  <div className="bg-teal-500/10 text-teal-400 p-2.5 rounded-xl border border-teal-500/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">preview</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Preview Newsletter</h3>
                    <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed">View generated templates, check layout structures and image displays.</p>
                  </div>
                </div>

                <div
                  onClick={() => router.push('/awards-dashboard')}
                  className="flex items-start gap-4 rounded-2xl border border-neutral-850 hover:border-neutral-750 bg-neutral-850 p-5 hover:bg-neutral-800/60 transition-all cursor-pointer group"
                >
                  <div className="bg-rose-500/10 text-rose-400 p-2.5 rounded-xl border border-rose-500/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">emoji_events</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Awards Dashboard</h3>
                    <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed">Review, update, and manage nominations across all departments.</p>
                  </div>
                </div>

                <div
                  onClick={() => router.push('/activity-log')}
                  className="flex items-start gap-4 rounded-2xl border border-neutral-850 hover:border-neutral-750 bg-neutral-850 p-5 hover:bg-neutral-800/60 transition-all cursor-pointer group"
                >
                  <div className="bg-blue-500/10 text-blue-400 p-2.5 rounded-xl border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">history</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Full Activity Logs</h3>
                    <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed">Track comprehensive system actions, modification history, and audits.</p>
                  </div>
                </div>

                <div
                  onClick={downloadNewsletter}
                  className="flex items-start gap-4 rounded-2xl border border-neutral-850 hover:border-neutral-750 bg-neutral-850 p-5 hover:bg-neutral-800/60 transition-all cursor-pointer group"
                >
                  <div className="bg-amber-500/10 text-amber-400 p-2.5 rounded-xl border border-amber-500/20 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-lg">download</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Export HTML Output</h3>
                    <p className="text-xs text-neutral-400 mt-1 font-medium leading-relaxed">Compile template details and trigger standard `.html` down-link assets.</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
