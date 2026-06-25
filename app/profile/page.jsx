'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Engineering');
  
  // Notification states
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [reminders, setReminders] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(false);

  // Password states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserData(user);
        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
        setEmail(user.email || '');
        setDepartment(user.department || 'Engineering');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    if (!userData) return;

    const updatedUser = {
      ...userData,
      firstName,
      lastName,
      email,
      department
    };

    localStorage.setItem('userData', JSON.stringify(updatedUser));
    setUserData(updatedUser);
    alert('Profile information saved successfully!');
    router.refresh();
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match.');
      return;
    }

    alert('Password updated successfully! (Demo simulated)');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (!userData) return null;

  return (
    <div className="flex-1 p-8 md:p-12 bg-neutral-900 max-w-4xl mx-auto w-full space-y-10 animate-fade-in">
      <div>
        <div className="flex items-center gap-2 text-xs font-black tracking-widest text-neutral-500 uppercase mb-2">
          <span>Settings</span>
          <span>/</span>
          <span className="text-blue-500">Profile</span>
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white mb-2">Profile Settings</h1>
        <p className="text-neutral-400 text-sm font-medium">Manage your personal settings, password configuration and notification triggers</p>
      </div>

      <div className="space-y-8">
        {/* Personal Details Form */}
        <section className="bg-neutral-850 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">person</span>
            Personal Information
          </h2>
          
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-neutral-800">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xl font-bold text-white border border-blue-400/20">
                {firstName ? firstName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <span className="inline-block px-3 py-1 text-[10px] font-black tracking-wider bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-md uppercase">
                  ROLE: {userData.role}
                </span>
                <p className="text-xs text-neutral-500 mt-1.5 font-medium">Avatar automatically generated from account username</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm cursor-pointer"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="HR">Human Resources</option>
                  <option value="Operations">Operations</option>
                  <option value="Sales">Sales</option>
                  <option value="QA">Quality Assurance</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-800">
              <button
                type="submit"
                className="px-5 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/15 transition-all cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </form>
        </section>

        {/* Notifications preferences Toggle Switches */}
        <section className="bg-neutral-850 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">notifications</span>
            Notification Preferences
          </h2>
          
          <div className="space-y-5">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/20 transition-all">
              <div>
                <h3 className="text-sm font-bold text-white">Email Notifications</h3>
                <p className="text-xs text-neutral-400 mt-1 font-medium">Receive summary digests regarding collaborative changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={(e) => setEmailNotifs(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/20 transition-all">
              <div>
                <h3 className="text-sm font-bold text-white">Newsletter Reminders</h3>
                <p className="text-xs text-neutral-400 mt-1 font-medium">Receive countdown reminders regarding publishing deadlines</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={reminders}
                  onChange={(e) => setReminders(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-neutral-800/20 transition-all">
              <div>
                <h3 className="text-sm font-bold text-white">System Updates</h3>
                <p className="text-xs text-neutral-400 mt-1 font-medium">Receive announcements regarding feature updates or downtime releases</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={systemUpdates}
                  onChange={(e) => setSystemUpdates(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-400 peer-checked:after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </section>

        {/* Change password security block */}
        <section className="bg-neutral-850 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-xl">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-400">lock</span>
            Security
          </h2>

          <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3.5 focus:border-blue-500 focus:outline-none text-white text-sm"
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3.5 focus:border-blue-500 focus:outline-none text-white text-sm"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3.5 focus:border-blue-500 focus:outline-none text-white text-sm"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/15 transition-all cursor-pointer"
              >
                Update Password
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
