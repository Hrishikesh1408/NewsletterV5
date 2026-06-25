'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function TurbifyFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);

  // Form states
  const [companyName, setCompanyName] = useState('Turbify');
  const [websiteUrl, setWebsiteUrl] = useState('https://www.turbify.com');
  const [companyDescription, setCompanyDescription] = useState('Leading e-commerce platform providing comprehensive solutions for online businesses.');
  const [primaryColor, setPrimaryColor] = useState('#1173d4');
  const [secondaryColor, setSecondaryColor] = useState('#0b63a6');
  const [frequency, setFrequency] = useState('monthly');
  const [senderName, setSenderName] = useState('Turbify Team');
  const [senderEmail, setSenderEmail] = useState('newsletter@turbify.com');
  const [titleFormat, setTitleFormat] = useState('Turbify Newsletter - {month} {year}');
  
  // Section toggles
  const [secEng, setSecEng] = useState(true);
  const [secBiz, setSecBiz] = useState(true);
  const [secAwards, setSecAwards] = useState(true);
  const [secSpotlight, setSecSpotlight] = useState(true);
  const [secHr, setSecHr] = useState(true);
  const [secEvents, setSecEvents] = useState(true);

  // Logo state
  const [logoPreview, setLogoPreview] = useState('');

  // Page header state
  const [headerTitle, setHeaderTitle] = useState('Turbify Template Configuration');

  useEffect(() => {
    // Check auth
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

    // Load initial values
    const pendingProject = localStorage.getItem('pendingProject');
    if (pendingProject) {
      try {
        const projectData = JSON.parse(pendingProject);
        setHeaderTitle(`Configure Turbify Template for "${projectData.name}"`);
      } catch (err) {
        console.error(err);
      }
    }

    const savedConfig = localStorage.getItem('turbifyConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.companyName) setCompanyName(config.companyName);
        if (config.websiteUrl) setWebsiteUrl(config.websiteUrl);
        if (config.companyDescription) setCompanyDescription(config.companyDescription);
        if (config.primaryColor) setPrimaryColor(config.primaryColor);
        if (config.secondaryColor) setSecondaryColor(config.secondaryColor);
        if (config.newsletterFrequency) setFrequency(config.newsletterFrequency);
        if (config.senderName) setSenderName(config.senderName);
        if (config.senderEmail) setSenderEmail(config.senderEmail);
        if (config.titleFormat) setTitleFormat(config.titleFormat);
        
        if (config.sections) {
          setSecEng(!!config.sections.engineering);
          setSecBiz(!!config.sections.business);
          setSecAwards(!!config.sections.awards);
          setSecSpotlight(!!config.sections.spotlight);
          setSecHr(!!config.sections.hr);
          setSecEvents(!!config.sections.events);
        }
        if (config.logo) {
          setLogoPreview(config.logo);
        }
      } catch (error) {
        console.error('Failed to load saved config:', error);
      }
    }
    setLoading(false);
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    const config = {
      template: 'turbify',
      companyName,
      websiteUrl,
      companyDescription,
      primaryColor,
      secondaryColor,
      newsletterFrequency: frequency,
      senderName,
      senderEmail,
      titleFormat,
      logo: logoPreview,
      sections: {
        engineering: secEng,
        business: secBiz,
        awards: secAwards,
        spotlight: secSpotlight,
        hr: secHr,
        events: secEvents
      }
    };

    try {
      localStorage.setItem('turbifyConfig', JSON.stringify(config));

      const pendingProject = localStorage.getItem('pendingProject');
      if (pendingProject) {
        const projectData = JSON.parse(pendingProject);

        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...projectData,
            config: config
          })
        });

        const result = await response.json();
        if (result.success) {
          localStorage.removeItem('pendingProject');
          alert('Project created successfully with Turbify template!');
          router.push('/journal');
        } else {
          alert('Failed to create project: ' + (result.error || 'Unknown error'));
        }
      } else {
        const returnUrl = searchParams.get('return') || '/journal';
        alert('Turbify template configuration saved successfully!');
        router.push(returnUrl);
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      alert('Failed to save configuration');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 md:p-12 bg-neutral-900 max-w-4xl mx-auto w-full space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-neutral-500 uppercase mb-2">
            <span>Templates</span>
            <span>/</span>
            <span className="text-blue-500">Turbify Config</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">{headerTitle}</h1>
          <p className="text-neutral-400 text-sm font-medium">Configure company info, branding, default sections, and logo parameters.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-neutral-850 p-6 md:p-8 border border-neutral-800 rounded-3xl shadow-xl">
        {/* Company info */}
        <section className="space-y-5">
          <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Company Name</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs"
                placeholder="Turbify"
              />
            </div>
            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Website URL</label>
              <input
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs"
                placeholder="https://www.turbify.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Company Description</label>
              <textarea
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs leading-relaxed"
                rows={3}
                placeholder="Enter description..."
              />
            </div>
          </div>
        </section>

        {/* Branding & Design */}
        <section className="space-y-5">
          <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">Branding & Design</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400">Primary Brand Color</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-14 h-11 rounded-xl border border-neutral-700 bg-neutral-900/50 cursor-pointer p-1"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs uppercase"
                  placeholder="#1173d4"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400">Secondary Brand Color</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-14 h-11 rounded-xl border border-neutral-700 bg-neutral-900/50 cursor-pointer p-1"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs uppercase"
                  placeholder="#0b63a6"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400">Logo Upload</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="w-full text-xs text-neutral-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-blue-600/10 file:text-blue-400 file:font-bold hover:file:bg-blue-600 hover:file:text-white file:transition-all file:cursor-pointer"
              />
              {logoPreview && (
                <div className="mt-4 p-4 border border-dashed border-neutral-700 bg-neutral-900/30 rounded-2xl text-center">
                  <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-2">Logo Preview</p>
                  <img src={logoPreview} className="max-h-16 mx-auto object-contain" alt="Logo preview" />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Newsletter Settings */}
        <section className="space-y-5">
          <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">Newsletter Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs cursor-pointer font-bold text-blue-400"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="quarterly">Quarterly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Default Sender Name</label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs"
                placeholder="Turbify Team"
              />
            </div>
            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Default Sender Email</label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs"
                placeholder="newsletter@turbify.com"
              />
            </div>
            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Title Format</label>
              <input
                type="text"
                value={titleFormat}
                onChange={(e) => setTitleFormat(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs"
                placeholder="Turbify Newsletter - {month} {year}"
              />
              <p className="text-[10px] text-neutral-500 font-bold mt-1">Use placeholders: {'{month}'} and {'{year}'}</p>
            </div>
          </div>
        </section>

        {/* Content sections */}
        <section className="space-y-5">
          <h2 className="text-lg font-bold text-white border-b border-neutral-800 pb-3">Default Content Sections</h2>
          <div className="grid grid-cols-1 gap-3">
            {[
              { id: 'eng', title: 'Engineering Updates', desc: 'Platform, Pre-Sales, QA, Enterprise, and SRE updates', state: secEng, setter: setSecEng },
              { id: 'biz', title: 'Business Updates', desc: 'Core initiatives, activities, and strategic directives', state: secBiz, setter: setSecBiz },
              { id: 'awd', title: 'Awards & Recognition', desc: 'Employee spotlight, performers and team recognition', state: secAwards, setter: setSecAwards },
              { id: 'spl', title: 'Monthly Spotlight', desc: 'Team interviews, spotlights and profiles', state: secSpotlight, setter: setSecSpotlight },
              { id: 'hr', title: 'HR Updates', desc: 'New joiners, birthdays and organizational changes', state: secHr, setter: setSecHr },
              { id: 'evt', title: 'Upcoming Events', desc: 'Key deadlines, events and townhalls', state: secEvents, setter: setSecEvents }
            ].map(sec => (
              <div key={sec.id} className="flex items-center justify-between p-4 bg-neutral-900/40 border border-neutral-800 rounded-2xl">
                <div>
                  <h4 className="text-sm font-bold text-white">{sec.title}</h4>
                  <p className="text-xs text-neutral-500 mt-0.5">{sec.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={sec.state}
                    onChange={(e) => sec.setter(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-800 rounded-full peer peer-focus:ring-1 peer-focus:ring-blue-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-neutral-500 peer-checked:after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-800">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-3 text-xs font-bold text-neutral-400 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-xl transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/15 transition-all"
          >
            Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
}

export default function TurbifyFormPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-neutral-900 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <TurbifyFormContent />
    </Suspense>
  );
}
