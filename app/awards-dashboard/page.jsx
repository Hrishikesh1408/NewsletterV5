'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AwardsDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [allAwards, setAllAwards] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

    loadAwards();
  }, []);

  const loadAwards = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch projects');
      const projects = await response.json();

      let accumulatedAwards = [];

      for (const project of projects) {
        try {
          const newsletterResponse = await fetch(`/api/newsletters/${project._id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (newsletterResponse.ok) {
            const newsletterData = await newsletterResponse.json();
            if (newsletterData.awards && Array.isArray(newsletterData.awards)) {
              newsletterData.awards.forEach(award => {
                accumulatedAwards.push({
                  ...award,
                  projectName: project.name,
                  projectId: project._id
                });
              });
            }
          }
        } catch (err) {
          console.error(`Failed to load awards for project ${project._id}:`, err);
        }
      }

      setAllAwards(accumulatedAwards);
    } catch (error) {
      console.error('Failed to load awards:', error);
      alert('Error loading awards');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAward = async (projectId, awardId, field, value) => {
    setSavingId(awardId);
    try {
      const token = localStorage.getItem('token');
      
      // Update local state first
      setAllAwards(prev =>
        prev.map(a => (a.projectId === projectId && a.id === awardId ? { ...a, [field]: value } : a))
      );

      // Fetch current newsletter
      const response = await fetch(`/api/newsletters/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to retrieve newsletter data');
      const data = await response.json();

      if (data.awards) {
        const index = data.awards.findIndex(a => a.id === awardId);
        if (index !== -1) {
          data.awards[index][field] = value;
        } else {
          throw new Error('Award not found in newsletter');
        }
      }

      // Save updated awards list
      const saveResponse = await fetch(`/api/newsletters/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ awards: data.awards, section: 'awards' })
      });

      if (!saveResponse.ok) throw new Error('Failed to update newsletter award');
    } catch (error) {
      console.error('Failed to update award:', error);
      alert('Failed to update award');
      loadAwards(); // reload to sync back with DB
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteAward = async (projectId, awardId) => {
    if (!confirm('Are you sure you want to delete this award entry?')) return;

    try {
      const token = localStorage.getItem('token');
      
      // Fetch current newsletter
      const response = await fetch(`/api/newsletters/${projectId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to retrieve newsletter');
      const data = await response.json();

      // Remove the award
      let updatedAwards = [];
      if (data.awards) {
        updatedAwards = data.awards.filter(a => a.id !== awardId);
      }

      // Save back to DB
      const saveResponse = await fetch(`/api/newsletters/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ awards: updatedAwards, section: 'awards' })
      });

      if (saveResponse.ok) {
        setAllAwards(prev => prev.filter(a => !(a.projectId === projectId && a.id === awardId)));
      } else {
        throw new Error('Failed to save updated awards');
      }
    } catch (error) {
      console.error('Failed to delete award:', error);
      alert('Failed to delete award');
    }
  };

  // Filter and Search logic
  const filteredAwards = allAwards.filter(award => {
    const matchesSearch = 
      (award.name && award.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (award.description && award.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (award.projectName && award.projectName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || award.type === filterType;
    const matchesDept = filterDept === 'all' || award.department === filterDept;

    return matchesSearch && matchesType && matchesDept;
  });

  return (
    <div className="flex-1 p-8 md:p-12 bg-neutral-900 max-w-7xl mx-auto w-full space-y-10 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-neutral-500 uppercase mb-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-blue-500">Awards</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Awards Dashboard</h1>
          <p className="text-neutral-400 text-sm font-medium">Review and edit all employee spotlight and monthly team award submissions</p>
        </div>

        <button
          onClick={loadAwards}
          className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 transition-all cursor-pointer active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-neutral-850 p-5 rounded-2xl border border-neutral-800 shadow-md">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by winner, desc or edition..."
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 pl-10 focus:border-blue-500 focus:outline-none text-white text-xs placeholder:text-neutral-500"
          />
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-lg">search</span>
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-xs cursor-pointer"
          >
            <option value="all">All Award Types</option>
            <option value="spark">Spark Award</option>
            <option value="lodestar">Lodestar</option>
            <option value="performer">Performer of the Month</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-xs cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="platform">Platform Updates</option>
            <option value="presales">Pre-Sales</option>
            <option value="qa">QA</option>
            <option value="enterprise">Enterprise</option>
            <option value="sre">SRE</option>
          </select>
        </div>

        <div className="flex items-center justify-end text-xs font-bold text-neutral-500 px-2">
          Showing {filteredAwards.length} of {allAwards.length} entries
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
                  <th className="px-6 py-4">Winner Name</th>
                  <th className="px-6 py-4">Award Type</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Department / Edition</th>
                  <th className="px-6 py-4">Submitted By</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 text-sm text-neutral-200">
                {filteredAwards.map((award) => (
                  <tr key={`${award.projectId}-${award.id}`} className="hover:bg-neutral-800/30 transition-all group">
                    <td className="px-6 py-4 whitespace-nowrap max-w-[180px]">
                      <input
                        type="text"
                        value={award.name || ''}
                        onChange={(e) => handleUpdateAward(award.projectId, award.id, 'name', e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:outline-none rounded-xl px-3 py-2 text-white text-xs w-full font-bold"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={award.type || ''}
                        onChange={(e) => handleUpdateAward(award.projectId, award.id, 'type', e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:outline-none rounded-xl px-3 py-2 text-white text-xs cursor-pointer font-bold text-blue-400"
                      >
                        <option value="spark">Spark Award</option>
                        <option value="lodestar">Lodestar</option>
                        <option value="performer">Performer of the Month</option>
                        <option value="other">Other</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 min-w-[280px]">
                      <textarea
                        value={award.description || ''}
                        onChange={(e) => handleUpdateAward(award.projectId, award.id, 'description', e.target.value)}
                        className="bg-neutral-900 border border-neutral-800 focus:border-blue-500 focus:outline-none rounded-xl px-3 py-2 text-white text-xs w-full min-h-[60px] resize-y leading-relaxed"
                        rows={2}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap space-y-2">
                      <div>
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md">
                          {award.department || 'unknown'}
                        </span>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-bold max-w-[150px] truncate">
                        {award.projectName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-neutral-400 font-bold">
                      {award.submittedBy || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-3">
                        {savingId === award.id && (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                        )}
                        <button
                          onClick={() => handleDeleteAward(award.projectId, award.id)}
                          className="flex items-center justify-center h-8 w-8 rounded-lg text-neutral-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAwards.length === 0 && (
                  <tr>
                    <td colspan={6} className="px-6 py-12 text-center text-neutral-500 font-medium">
                      <span className="material-symbols-outlined text-4xl mb-2 block">emoji_events</span>
                      No award submissions found matching filters
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
