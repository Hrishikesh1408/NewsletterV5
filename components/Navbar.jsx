'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const rolePermissions = {
  owner: ['journal', 'template', 'admin', 'dept-forms', 'preview', 'profile', 'awards-dashboard', 'activity-log', 'team-editor', 'newsletter-editor', 'turbify-form'],
  admin: ['journal', 'template', 'admin', 'dept-forms', 'preview', 'profile', 'awards-dashboard', 'activity-log', 'team-editor', 'newsletter-editor', 'turbify-form'],
  platform: ['dept-forms', 'team-editor'],
  presales: ['dept-forms', 'team-editor'],
  qa: ['dept-forms', 'team-editor'],
  enterprise: ['dept-forms', 'team-editor'],
  sre: ['dept-forms', 'team-editor']
};

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('userData');
    if (!token || !storedUser) {
      if (pathname !== '/login') {
        router.push('/login');
      }
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUserData(parsedUser);
      loadProjects(token);
    } catch (e) {
      console.error(e);
      router.push('/login');
    }

    // Sync project selections
    const handleProjectChange = () => {
      const cachedProjId = localStorage.getItem('currentProject');
      if (cachedProjId && projects.length > 0) {
        const found = projects.find(p => p._id === cachedProjId);
        if (found) setCurrentProject(found);
      }
    };

    window.addEventListener('projectChanged', handleProjectChange);
    return () => window.removeEventListener('projectChanged', handleProjectChange);
  }, [pathname, projects.length]);

  const loadProjects = async (token) => {
    try {
      const res = await fetch('/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
        
        // Auto-select current project
        const cachedProjId = localStorage.getItem('currentProject');
        if (cachedProjId) {
          const found = data.find(p => p._id === cachedProjId);
          if (found) setCurrentProject(found);
        } else if (data.length > 0) {
          localStorage.setItem('currentProject', data[0]._id);
          setCurrentProject(data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load projects:', error);
    }
  };

  const handleProjectSelect = (proj) => {
    localStorage.setItem('currentProject', proj._id);
    setCurrentProject(proj);
    setShowProjectDropdown(false);
    window.dispatchEvent(new CustomEvent('projectChanged', { detail: { projectId: proj._id } }));
    router.refresh();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('currentProject');
    router.push('/login');
  };

  if (pathname === '/login' || !userData) return null;

  const allowedPages = rolePermissions[userData.role] || [];
  const isTeamRole = ['platform', 'presales', 'qa', 'enterprise', 'sre'].includes(userData.role);
  
  const navItems = [
    { name: 'Journal', path: '/journal', key: 'journal', icon: 'folder' },
    { name: 'Templates', path: '/template', key: 'template', icon: 'description' },
    { name: 'Dashboard', path: '/admin', key: 'admin', icon: 'dashboard' },
    { 
      name: 'Editor', 
      path: isTeamRole ? '/team-editor' : '/dept-forms', 
      key: isTeamRole ? 'team-editor' : 'dept-forms', 
      icon: 'edit' 
    },
    { name: 'Preview', path: '/preview', key: 'preview', icon: 'preview' }
  ].filter(item => allowedPages.includes(item.key));

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-neutral-700 bg-neutral-900/80 px-6 py-4 backdrop-blur-md sticky top-0 z-40">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
          <span className="text-white text-xl font-black tracking-wider bg-gradient-to-r from-blue-500 to-indigo-500 px-3 py-1.5 rounded-lg shadow-md shadow-blue-500/20">
            TURBIFY
          </span>
        </Link>
        
        <nav className="hidden md:flex items-center gap-1.5 bg-neutral-800/60 rounded-xl p-1 border border-neutral-700/50">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.key}
                href={item.path}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/15'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-700/60'
                }`}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* Project Selector */}
        <div className="relative">
          <button
            onClick={() => setShowProjectDropdown(!showProjectDropdown)}
            className="flex items-center gap-2 px-3 py-2 bg-neutral-800/90 border border-neutral-700 rounded-xl text-sm font-semibold text-white hover:bg-neutral-700 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-blue-400 text-lg">layers</span>
            <div className="text-left leading-none max-w-[120px] truncate">
              <div className="text-[10px] text-neutral-400 font-medium">Project</div>
              <div className="font-bold text-white truncate text-xs mt-0.5">
                {currentProject ? currentProject.name : 'Select Project'}
              </div>
            </div>
            <span className="material-symbols-outlined text-neutral-400 text-sm">expand_more</span>
          </button>

          {showProjectDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-neutral-700 bg-neutral-800 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2 text-xs font-bold text-neutral-400 border-b border-neutral-700 mb-1">
                SELECT COLLABORATIVE PROJECT
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {projects.map((proj) => (
                  <button
                    key={proj._id}
                    onClick={() => handleProjectSelect(proj)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex flex-col ${
                      currentProject?._id === proj._id
                        ? 'bg-blue-600/10 border border-blue-500/30 text-white'
                        : 'hover:bg-neutral-700/60 text-neutral-300'
                    }`}
                  >
                    <span className="font-bold text-sm">{proj.name}</span>
                    <span className="text-xs text-neutral-400 mt-0.5 truncate max-w-full">
                      {proj.description || 'No description'}
                    </span>
                  </button>
                ))}
                {projects.length === 0 && (
                  <div className="px-3 py-4 text-center text-sm text-neutral-500">
                    No projects available.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 font-bold text-white hover:shadow-lg hover:shadow-blue-500/20 transition-all cursor-pointer border border-blue-400/20"
          >
            {userData.firstName ? userData.firstName.charAt(0).toUpperCase() : 'U'}
          </button>

          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-neutral-700 bg-neutral-800 p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2.5 border-b border-neutral-700 mb-1">
                <p className="text-sm font-bold text-white">{userData.firstName} {userData.lastName || ''}</p>
                <p className="text-xs text-neutral-400 truncate mt-0.5">{userData.email}</p>
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-black tracking-wider bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-md uppercase">
                  {userData.role}
                </span>
              </div>
              <Link
                href="/profile"
                onClick={() => setShowProfileDropdown(false)}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-sm text-neutral-300 hover:bg-neutral-700/60 hover:text-white transition-all"
              >
                <span className="material-symbols-outlined text-base">settings</span>
                Profile Settings
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full text-left px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
              >
                <span className="material-symbols-outlined text-base">logout</span>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
