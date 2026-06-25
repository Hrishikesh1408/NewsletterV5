'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ActivityLogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [allActivity, setAllActivity] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterSection, setFilterSection] = useState('all');

  useEffect(() => {
    // Check auth and role
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('userData');
    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (!['owner', 'admin'].includes(userData.role)) {
        alert('Access denied. Owner/Admin access required.');
        router.push('/journal');
        return;
      }
    } catch (e) {
      console.error(e);
      router.push('/login');
      return;
    }

    loadActivity();
  }, []);

  const loadActivity = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const projects = await response.json();

      let accumulatedLogs = [];

      for (const project of projects) {
        try {
          const newsletterResponse = await fetch(`/api/newsletters/${project._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (newsletterResponse.ok) {
            const newsletterData = await newsletterResponse.json();
            if (newsletterData.changeLog && Array.isArray(newsletterData.changeLog)) {
              newsletterData.changeLog.forEach(log => {
                accumulatedLogs.push({
                  ...log,
                  projectName: project.name,
                  projectId: project._id
                });
              });
            }
          }
        } catch (err) {
          console.error(`Failed to load activity for project ${project._id}:`, err);
        }
      }

      // Sort by timestamp (newest first)
      accumulatedLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAllActivity(accumulatedLogs);
    } catch (error) {
      console.error('Failed to load activity log:', error);
      alert('Error loading activity logs');
    } finally {
      setLoading(false);
    }
  };

  // Filters & Search
  const filteredLogs = allActivity.filter(log => {
    const matchesSearch = 
      (log.userName && log.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.action && log.action.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.projectName && log.projectName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole = filterRole === 'all' || log.userRole === filterRole;
    const matchesSection = filterSection === 'all' || log.section === filterSection;

    return matchesSearch && matchesRole && matchesSection;
  });

  return (
    <div className="flex-1 p-8 md:p-12 bg-neutral-900 max-w-7xl mx-auto w-full space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-neutral-500 uppercase mb-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-blue-500">Activity Log</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">User Activity Log</h1>
          <p className="text-neutral-400 text-sm font-medium">Track all collaboration edits, saves and actions taken across project editions</p>
        </div>

        <button
          onClick={loadActivity}
          className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 transition-all cursor-pointer active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          <span>Refresh Log</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-850 p-5 rounded-2xl border border-neutral-800 shadow-md">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by user, action, project..."
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 pl-10 focus:border-blue-500 focus:outline-none text-white text-xs placeholder:text-neutral-500"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">search</span>
        </div>

        <div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-xs cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="platform">Platform Update Editor</option>
            <option value="presales">Pre-sales Editor</option>
            <option value="qa">QA Editor</option>
            <option value="enterprise">Enterprise Editor</option>
            <option value="sre">SRE Editor</option>
          </select>
        </div>

        <div>
          <select
            value={filterSection}
            onChange={(e) => setFilterSection(e.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-xs cursor-pointer"
          >
            <option value="all">All Sections</option>
            <option value="all-sections">All Newsletter</option>
            <option value="platform">Platform</option>
            <option value="presales">Pre-sales</option>
            <option value="qa">QA</option>
            <option value="enterprise">Enterprise</option>
            <option value="sre">SRE</option>
            <option value="awards">Awards</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs font-bold text-neutral-500 px-2">
          Showing {filteredLogs.length} logs
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-neutral-850 border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-900/40 border-b border-neutral-800 text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Section Edited</th>
                  <th className="px-6 py-4">Action Summary</th>
                  <th className="px-6 py-4">Edition / Project</th>
                  <th className="px-6 py-4 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-sm text-neutral-200">
                {filteredLogs.map((log, index) => (
                  <tr key={`${log.projectId}-${log.timestamp}-${index}`} className="hover:bg-neutral-800/30 transition-all">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-white">
                      {log.userName || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md">
                        {log.userRole || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
                        {log.section || 'all'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-300 max-w-[250px] truncate">
                      {log.action || 'Updated content'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-400 font-medium">
                      {log.projectName || 'Unknown project'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-xs text-neutral-500 font-bold">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {filteredLogs.length === 0 && (
                  <tr>
                    <td colspan={6} className="px-6 py-12 text-center text-neutral-500 font-medium">
                      <span className="material-symbols-outlined text-4xl mb-2 block">history</span>
                      No activity logs found matching current search filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
