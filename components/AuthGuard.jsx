'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const rolePermissions = {
  owner: ['journal', 'template', 'admin', 'dept-forms', 'preview', 'profile', 'awards-dashboard', 'activity-log', 'team-editor', 'newsletter-editor', 'turbify-form'],
  admin: ['journal', 'template', 'admin', 'dept-forms', 'preview', 'profile', 'awards-dashboard', 'activity-log', 'team-editor', 'newsletter-editor', 'turbify-form'],
  platform: ['dept-forms', 'team-editor'],
  presales: ['dept-forms', 'team-editor'],
  qa: ['dept-forms', 'team-editor'],
  enterprise: ['dept-forms', 'team-editor'],
  sre: ['dept-forms', 'team-editor']
};

export default function AuthGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    authCheck(pathname);
  }, [pathname]);

  function authCheck(url) {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('userData');
    
    // Pages that do not require authentication
    const publicPaths = ['/login'];
    const path = url.split('?')[0];

    if (!token || !storedUser) {
      setAuthorized(false);
      if (!publicPaths.includes(path)) {
        router.push('/login');
      } else {
        setAuthorized(true);
      }
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      const role = user.role;
      const allowed = rolePermissions[role] || [];
      
      if (path === '/login') {
        // Redirect logged-in users away from login
        const defaultPage = ['platform', 'presales', 'qa', 'enterprise', 'sre'].includes(role)
          ? '/dept-forms'
          : '/admin';
        router.push(defaultPage);
        return;
      }

      // Root path handling
      if (path === '/') {
        const defaultPage = ['platform', 'presales', 'qa', 'enterprise', 'sre'].includes(role)
          ? '/dept-forms'
          : '/admin';
        router.push(defaultPage);
        return;
      }

      // Check access permission for current path
      const pageKey = path.substring(1); // remove leading slash
      
      // Allow dynamic path components or check standard ones
      const isAllowed = allowed.some(p => pageKey.startsWith(p)) || pageKey === 'profile';

      if (!isAllowed && !publicPaths.includes(path)) {
        const defaultPage = allowed.length > 0 ? `/${allowed[0]}` : '/login';
        router.push(defaultPage);
      } else {
        setAuthorized(true);
      }
    } catch (e) {
      console.error('Auth check error:', e);
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      router.push('/login');
    }
  }

  return authorized ? <>{children}</> : null;
}
