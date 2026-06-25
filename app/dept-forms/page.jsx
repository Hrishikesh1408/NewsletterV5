'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';

export default function DeptFormsPage() {
  const router = useRouter();
  const [projectId, setProjectId] = useState(null);
  const [userRole, setUserRole] = useState('admin');
  const [loading, setLoading] = useState(true);

  // Form Field States
  const [title, setTitle] = useState('');
  const [intro, setIntro] = useState('');

  // Metrics
  const [storefrontDowntime, setStorefrontDowntime] = useState('0');
  const [globalComponents, setGlobalComponents] = useState('90%');
  const [ecpFunctionality, setEcpFunctionality] = useState('80%');
  const [productionReleases, setProductionReleases] = useState('4+');
  
  // Engineering updates
  const [platform, setPlatform] = useState('');
  const [presales, setPresales] = useState('');
  const [qa, setQa] = useState('');
  const [enterprise, setEnterprise] = useState('');
  const [sre, setSre] = useState('');

  // Business topics
  const [businessTopics, setBusinessTopics] = useState([]);
  const [activities, setActivities] = useState('');

  // Awards & Spotlight
  const [awards, setAwards] = useState([]);
  const [spotlight, setSpotlight] = useState([]);

  // HR updates
  const [joiners, setJoiners] = useState([]);
  const [birthdays, setBirthdays] = useState([]);

  // Notes & Events
  const [events, setEvents] = useState('');
  const [upcomingEventsList, setUpcomingEventsList] = useState([]);
  const [notes, setNotes] = useState('');
  const [ownerNotes, setOwnerNotes] = useState('');

  // Compiled Output HTML & Email Modal
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Newsletter');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Determine role
    const storedUser = localStorage.getItem('userData');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserRole(parsed.role || 'admin');
      } catch (e) {
        console.error(e);
      }
    }

    const cachedProjId = localStorage.getItem('currentProject');
    setProjectId(cachedProjId);

    if (cachedProjId) {
      loadNewsletter(cachedProjId);
    } else {
      setLoading(false);
    }

    const handleProjectChange = () => {
      const newProjId = localStorage.getItem('currentProject');
      setProjectId(newProjId);
      if (newProjId) {
        loadNewsletter(newProjId);
      }
    };

    window.addEventListener('projectChanged', handleProjectChange);
    return () => window.removeEventListener('projectChanged', handleProjectChange);
  }, []);

  const loadNewsletter = async (projId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/newsletters/${projId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        setTitle(data.title || '');
        setIntro(data.intro || '');
        setStorefrontDowntime(data.storefrontDowntime || '0');
        setGlobalComponents(data.globalComponents || '90%');
        setEcpFunctionality(data.ecpFunctionality || '80%');
        setProductionReleases(data.productionReleases || '4+');
        setPlatform(data.platform || '');
        setPresales(data.presales || '');
        setQa(data.qa || '');
        setEnterprise(data.enterprise || '');
        setSre(data.sre || '');
        setActivities(data.activities || '');
        setEvents(data.events || '');
        setUpcomingEventsList(data.upcomingEventsList || []);
        setNotes(data.notes || '');
        setOwnerNotes(data.ownerNotes || '');

        setBusinessTopics(data.businessTopics || []);
        setAwards(data.awards || []);
        setSpotlight(data.spotlight || []);
        setJoiners(data.joiners || []);
        setBirthdays(data.birthdays || []);
        
        if (data.html) {
          setGeneratedHtml(data.html);
        }
      }
    } catch (error) {
      console.error('Failed to load newsletter:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAll = async () => {
    if (!projectId) return;

    setIsSaving(true);
    const token = localStorage.getItem('token');
    const updateData = {
      title,
      intro,
      storefrontDowntime,
      globalComponents,
      ecpFunctionality,
      productionReleases,
      platform,
      presales,
      qa,
      enterprise,
      sre,
      activities,
      businessTopics,
      awards,
      spotlight,
      joiners,
      birthdays,
      events,
      upcomingEventsList,
      notes,
      ownerNotes,
      html: generatedHtml,
      section: 'all'
    };

    try {
      const response = await fetch(`/api/newsletters/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      const result = await response.json();
      if (result.success) {
        alert('Newsletter content saved successfully!');
        if (result.newsletter?.html) {
          localStorage.setItem('newsletter-html', result.newsletter.html);
          setGeneratedHtml(result.newsletter.html);
        }
      } else {
        alert('Failed to save data: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save newsletter');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file, index, listType, fieldName) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/upload/image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        const cdnUrl = result.image;
        if (listType === 'awards') {
          const updated = [...awards];
          updated[index][fieldName] = cdnUrl;
          setAwards(updated);
        } else if (listType === 'spotlight') {
          const updated = [...spotlight];
          updated[index][fieldName] = cdnUrl;
          setSpotlight(updated);
        } else if (listType === 'joiners') {
          const updated = [...joiners];
          updated[index][fieldName] = cdnUrl;
          setJoiners(updated);
        } else if (listType === 'birthdays') {
          const updated = [...birthdays];
          updated[index][fieldName] = cdnUrl;
          setBirthdays(updated);
        }
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (e) {
      alert('Upload failed');
    }
  };

  // HTML compiling template compiler
  const handleGenerateHtml = async () => {
    const token = localStorage.getItem('token');
    const updateData = {
      title, intro, storefrontDowntime, globalComponents, ecpFunctionality,
      productionReleases, platform, presales, qa, enterprise, sre,
      activities, businessTopics, awards, spotlight, joiners, birthdays,
      events, upcomingEventsList, notes, ownerNotes
    };

    try {
      const response = await fetch('/api/newsletters/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      });
      const result = await response.json();
      if (result.success) {
        setGeneratedHtml(result.html);
        localStorage.setItem('newsletter-html', result.html);
        alert('HTML generated and stored locally! Click Preview Mode to see it.');
      } else {
        alert('Failed to generate HTML: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Generate error:', error);
      alert('Failed to generate HTML');
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!generatedHtml) {
      alert('Please compile the HTML output first.');
      return;
    }

    const recipientList = emailRecipients
      .split(/[,\n]/)
      .map(email => email.trim())
      .filter(email => email && email.includes('@'));

    if (recipientList.length === 0) {
      alert('Please enter valid email addresses');
      return;
    }

    setSendingEmail(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          html: generatedHtml,
          subject: emailSubject,
          recipients: recipientList.join(',')
        })
      });

      const result = await response.json();
      if (result.success) {
        if (result.errors && result.errors.length > 0) {
          alert(`${result.message}\n\nDetailed Errors:\n${result.errors.join('\n')}`);
        } else {
          alert(result.message || 'Newsletter emails sent successfully!');
          setShowEmailModal(false);
          setEmailRecipients('');
        }
      } else {
        alert('Failed to send email: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Send email error:', error);
      alert('Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const downloadHTML = () => {
    if (!generatedHtml) {
      alert('Please generate the HTML output first.');
      return;
    }
    const blob = new Blob([generatedHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const showEmailModalForm = () => {
    if (!generatedHtml) {
      alert('Please compile the HTML output first.');
      return;
    }
    setEmailSubject(title || 'Newsletter');
    setShowEmailModal(true);
  };

  if (!projectId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 bg-neutral-900">
        <div className="text-center p-8 bg-neutral-800 border border-neutral-700 rounded-3xl max-w-md shadow-2xl">
          <span className="material-symbols-outlined text-neutral-500 text-5xl mb-4">edit_document</span>
          <h2 className="text-xl font-bold text-white mb-2">No Project Selected</h2>
          <p className="text-neutral-400 text-sm">Please select a newsletter project from the header dropdown to launch the collaborative content editors.</p>
        </div>
      </div>
    );
  }

  // Determine section visibility based on roles
  const canEditAll = ['owner', 'admin'].includes(userRole);
  const showPlatform = canEditAll || userRole === 'platform';
  const showPresales = canEditAll || userRole === 'presales';
  const showQA = canEditAll || userRole === 'qa';
  const showEnterprise = canEditAll || userRole === 'enterprise';
  const showSre = canEditAll || userRole === 'sre';

  return (
    <div className="flex-1 p-8 md:p-12 bg-neutral-900 max-w-6xl mx-auto w-full space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-neutral-500 uppercase mb-2">
            <span>Editor</span>
            <span>/</span>
            <span className="text-blue-500">{title || 'Campaign'}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Newsletter Editor</h1>
          <p className="text-neutral-400 text-sm font-medium">Add monthly content updates. Save or publish to subscribers.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadNewsletter(projectId)}
            className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 transition-all cursor-pointer active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">refresh</span>
            <span>Sync DB</span>
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/15 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            ) : (
              <span className="material-symbols-outlined text-lg">save</span>
            )}
            <span>{isSaving ? 'Saving...' : 'Save Data'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* GENERAL INFO */}
          {canEditAll && (
            <div className="bg-neutral-850 border border-neutral-800/80 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">info</span>
                General Campaign Settings
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Newsletter Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3.5 focus:border-blue-500 focus:outline-none text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Introduction Message</label>
                  <RichTextEditor value={intro} onChange={setIntro} placeholder="Write a warm monthly greeting to subscribers..." />
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-800">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-500">dashboard</span>
                  Dashboard Metrics
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-2">Storefront Downtime</label>
                    <input
                      type="text"
                      value={storefrontDowntime}
                      onChange={(e) => setStorefrontDowntime(e.target.value)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-2">Global Components Done</label>
                    <input
                      type="text"
                      value={globalComponents}
                      onChange={(e) => setGlobalComponents(e.target.value)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-2">ECP Functionality</label>
                    <input
                      type="text"
                      value={ecpFunctionality}
                      onChange={(e) => setEcpFunctionality(e.target.value)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-400 mb-2">Production Releases</label>
                    <input
                      type="text"
                      value={productionReleases}
                      onChange={(e) => setProductionReleases(e.target.value)}
                      className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ENGINEERING UPDATES */}
          {(showPlatform || showPresales || showQA || showEnterprise || showSre) && (
            <div className="bg-neutral-850 border border-neutral-800/80 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">engineering</span>
                Engineering Updates
              </h2>
              <div className="space-y-5">
                {showPlatform && (
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Platform Updates</label>
                    <RichTextEditor value={platform} onChange={setPlatform} placeholder="Platform releases and architecture improvements..." />
                  </div>
                )}
                {showPresales && (
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Pre-Sales Updates</label>
                    <RichTextEditor value={presales} onChange={setPresales} placeholder="Bid status, client conversions and pipelines updates..." />
                  </div>
                )}
                {showQA && (
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Quality Assurance (QA) Updates</label>
                    <RichTextEditor value={qa} onChange={setQa} placeholder="Test automation, regression status, and quality metrics..." />
                  </div>
                )}
                {showEnterprise && (
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Enterprise Updates</label>
                    <RichTextEditor value={enterprise} onChange={setEnterprise} placeholder="Key account deployments and enterprise updates..." />
                  </div>
                )}
                {showSre && (
                  <div>
                    <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Site Reliability (SRE) Updates</label>
                    <RichTextEditor value={sre} onChange={setSre} placeholder="Uptime summaries, latency upgrades and infra scaling..." />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* BUSINESS TEAM UPDATES */}
          {canEditAll && (
            <div className="bg-neutral-850 border border-neutral-800/80 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">trending_up</span>
                  Business Updates
                </h2>
                <button
                  type="button"
                  onClick={() => setBusinessTopics([...businessTopics, { icon: '🚀', category: 'BUSINESS TOPIC', title: 'New Update', content: '', link: '' }])}
                  className="px-3.5 py-1.5 text-xs font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded-xl transition-all border border-blue-500/20"
                >
                  + Add Topic
                </button>
              </div>

              <div className="space-y-6">
                {businessTopics.map((topic, index) => (
                  <div key={index} className="p-5 pt-12 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => setBusinessTopics(businessTopics.filter((_, i) => i !== index))}
                      className="absolute top-4 right-4 text-xs font-bold text-red-400 hover:text-white p-1 rounded-lg"
                    >
                      ✕ Remove
                    </button>
                    <div className="flex gap-4">
                      <div className="w-16">
                        <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Icon</label>
                        <input
                          type="text"
                          value={topic.icon || ''}
                          onChange={(e) => {
                            const updated = [...businessTopics];
                            updated[index].icon = e.target.value;
                            setBusinessTopics(updated);
                          }}
                          placeholder="🚀"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-center text-white text-xs"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Category (Small Header)</label>
                        <input
                          type="text"
                          value={topic.category || ''}
                          onChange={(e) => {
                            const updated = [...businessTopics];
                            updated[index].category = e.target.value;
                            setBusinessTopics(updated);
                          }}
                          placeholder="BUSINESS TOPIC"
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs uppercase"
                        />
                      </div>
                    </div>
                    <div className="max-w-md">
                      <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Main Title (Optional)</label>
                      <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => {
                          const updated = [...businessTopics];
                          updated[index].title = e.target.value;
                          setBusinessTopics(updated);
                        }}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Content</label>
                      <RichTextEditor
                        value={topic.content}
                        onChange={(html) => {
                          const updated = [...businessTopics];
                          updated[index].content = html;
                          setBusinessTopics(updated);
                        }}
                        placeholder="Write details regarding the roadmap updates..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Redirect Link (Optional)</label>
                      <input
                        type="url"
                        value={topic.link || ''}
                        onChange={(e) => {
                          const updated = [...businessTopics];
                          updated[index].link = e.target.value;
                          setBusinessTopics(updated);
                        }}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Team Building Activities</label>
                  <RichTextEditor value={activities} onChange={setActivities} placeholder="Write about team building gatherings, dinners or events..." />
                </div>
              </div>
            </div>
          )}

          {/* AWARDS & SPOTLIGHT */}
          {canEditAll && (
            <div className="bg-neutral-850 border border-neutral-800/80 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
              <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-400">emoji_events</span>
                  Awards & Recognition
                </h2>
                <button
                  type="button"
                  onClick={() => setAwards([...awards, { name: '', type: 'spark', role: '', description: '', photo: '' }])}
                  className="px-3.5 py-1.5 text-xs font-bold text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded-xl transition-all border border-blue-500/20"
                >
                  + Add Award Winner
                </button>
              </div>

              <div className="space-y-6">
                {awards.map((award, index) => (
                  <div key={index} className="p-5 pt-12 bg-neutral-900/40 border border-neutral-800 rounded-2xl space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => setAwards(awards.filter((_, i) => i !== index))}
                      className="absolute top-4 right-4 text-xs font-bold text-red-400 hover:text-white p-1 rounded-lg"
                    >
                      ✕ Remove
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Winner Name</label>
                        <input
                          type="text"
                          value={award.name}
                          onChange={(e) => {
                            const updated = [...awards];
                            updated[index].name = e.target.value;
                            setAwards(updated);
                          }}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                          placeholder="Full Name"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Award Type</label>
                        <select
                          value={award.type}
                          onChange={(e) => {
                            const updated = [...awards];
                            updated[index].type = e.target.value;
                            setAwards(updated);
                          }}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                        >
                          <option value="spark">Spark Award</option>
                          <option value="lodestar">Lodestar Award</option>
                          <option value="performer">Performer of the Month</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Job Title / Role</label>
                        <input
                          type="text"
                          value={award.role}
                          onChange={(e) => {
                            const updated = [...awards];
                            updated[index].role = e.target.value;
                            setAwards(updated);
                          }}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                          placeholder="e.g. Lead QA Engineer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Winner Photo</label>
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e.target.files[0], index, 'awards', 'photo')}
                            className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900/50 p-2 text-white text-xs"
                          />
                        </div>
                        {award.photo && (
                          <div className="mt-3 flex items-center gap-3">
                            <img src={award.photo} alt="Preview" className="w-12 h-12 object-cover rounded-xl border border-neutral-750" />
                            <span className="text-[10px] text-emerald-400 font-bold">✓ Photo loaded successfully</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Award Description / Achievements</label>
                      <RichTextEditor
                        value={award.description}
                        onChange={(html) => {
                          const updated = [...awards];
                          updated[index].description = html;
                          setAwards(updated);
                        }}
                        placeholder="Describe why this winner is selected..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HR UPDATES */}
          {canEditAll && (
            <div className="bg-neutral-850 border border-neutral-800/80 p-6 md:p-8 rounded-3xl space-y-8 shadow-xl">
              <h2 className="text-xl font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">group</span>
                HR Updates
              </h2>

              {/* New Joiners list */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-neutral-300">👋 Welcome New Joiners</h3>
                  <button
                    type="button"
                    onClick={() => setJoiners([...joiners, { name: '', role: '', image: '' }])}
                    className="px-3.5 py-1.5 text-[10px] font-black tracking-wider uppercase text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded-xl transition-all border border-blue-500/20"
                  >
                    + Add Joiner
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {joiners.map((joiner, index) => (
                    <div key={index} className="p-4 pt-10 bg-neutral-900/40 border border-neutral-800 rounded-2xl relative space-y-3">
                      <button
                        type="button"
                        onClick={() => setJoiners(joiners.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 text-[10px] font-bold text-red-400 hover:text-white"
                      >
                        ✕ Remove
                      </button>
                      <input
                        type="text"
                        placeholder="Joiner Name"
                        value={joiner.name}
                        onChange={(e) => {
                          const updated = [...joiners];
                          updated[index].name = e.target.value;
                          setJoiners(updated);
                        }}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Hired Role"
                        value={joiner.role}
                        onChange={(e) => {
                          const updated = [...joiners];
                          updated[index].role = e.target.value;
                          setJoiners(updated);
                        }}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                      />
                      <div className="flex gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e.target.files[0], index, 'joiners', 'image')}
                          className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900/50 p-2 text-white text-xs"
                        />
                      </div>
                      {joiner.image && (
                        <div className="flex items-center gap-2">
                          <img src={joiner.image} alt="Joiner Preview" className="w-10 h-10 rounded-full object-cover border border-neutral-750" />
                          <span className="text-[10px] text-emerald-400 font-bold">✓ Loaded</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Birthdays list */}
              <div className="space-y-4 pt-6 border-t border-neutral-800">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-neutral-300">🎂 Happy Birthday List</h3>
                  <button
                    type="button"
                    onClick={() => setBirthdays([...birthdays, { name: '', date: '', image: '', wishes: '' }])}
                    className="px-3.5 py-1.5 text-[10px] font-black tracking-wider uppercase text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-600 rounded-xl transition-all border border-blue-500/20"
                  >
                    + Add Birthday
                  </button>
                </div>

                <div className="space-y-4">
                  {birthdays.map((bday, index) => (
                    <div key={index} className="p-4 pt-10 bg-neutral-900/40 border border-neutral-800 rounded-2xl relative space-y-3">
                      <button
                        type="button"
                        onClick={() => setBirthdays(birthdays.filter((_, i) => i !== index))}
                        className="absolute top-2 right-2 text-[10px] font-bold text-red-400 hover:text-white"
                      >
                        ✕ Remove
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Name"
                          value={bday.name}
                          onChange={(e) => {
                            const updated = [...birthdays];
                            updated[index].name = e.target.value;
                            setBirthdays(updated);
                          }}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                        />
                        <input
                          type="date"
                          value={bday.date}
                          onChange={(e) => {
                            const updated = [...birthdays];
                            updated[index].date = e.target.value;
                            setBirthdays(updated);
                          }}
                          className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs cursor-pointer"
                        />
                        <div className="flex gap-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(e.target.files[0], index, 'birthdays', 'image')}
                            className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900/50 p-2 text-white text-xs"
                          />
                        </div>
                        {bday.image && (
                          <div className="flex items-center gap-2">
                            <img src={bday.image} alt="Bday Preview" className="w-10 h-10 rounded-full object-cover border border-neutral-750" />
                            <span className="text-[10px] text-emerald-400 font-bold">✓ Loaded</span>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Custom birthday wishes (optional)"
                        value={bday.wishes || ''}
                        onChange={(e) => {
                          const updated = [...birthdays];
                          updated[index].wishes = e.target.value;
                          setBirthdays(updated);
                        }}
                        className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EVENTS & NOTES */}
          {canEditAll && (
            <div className="bg-neutral-850 border border-neutral-800/80 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">event_note</span>
                Campaign Notes & Upcoming Events
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Upcoming Events</label>
                  <div className="space-y-4">
                    {upcomingEventsList.map((event, index) => (
                      <div key={index} className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-3 relative">
                        <button
                          onClick={() => {
                            const updated = [...upcomingEventsList];
                            updated.splice(index, 1);
                            setUpcomingEventsList(updated);
                          }}
                          className="absolute top-4 right-4 text-neutral-500 hover:text-red-400"
                        >
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                        <div className="flex gap-3">
                          <div className="w-16">
                            <label className="block text-xs text-neutral-500 mb-1">Icon</label>
                            <input
                              type="text"
                              value={event.icon || ''}
                              onChange={e => {
                                const updated = [...upcomingEventsList];
                                updated[index].icon = e.target.value;
                                setUpcomingEventsList(updated);
                              }}
                              placeholder="📅"
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm text-center text-white"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-neutral-500 mb-1">Date String</label>
                            <input
                              type="text"
                              value={event.date || ''}
                              onChange={e => {
                                const updated = [...upcomingEventsList];
                                updated[index].date = e.target.value;
                                setUpcomingEventsList(updated);
                              }}
                              placeholder="June 2026"
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs text-neutral-500 mb-1">Event Title</label>
                          <input
                            type="text"
                            value={event.title || ''}
                            onChange={e => {
                              const updated = [...upcomingEventsList];
                              updated[index].title = e.target.value;
                              setUpcomingEventsList(updated);
                            }}
                            placeholder="AI/ML Training Workshop"
                            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-sm text-white"
                          />
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setUpcomingEventsList([...upcomingEventsList, { icon: '📅', title: '', date: '' }])}
                      className="w-full py-3 border border-dashed border-neutral-700 text-neutral-400 rounded-xl hover:bg-neutral-800 hover:text-white transition-colors text-sm font-semibold flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                      Add Event Card
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">General Editor Notes</label>
                  <RichTextEditor value={notes} onChange={setNotes} placeholder="Enter secondary information or acknowledgments..." />
                </div>
              </div>
            </div>
          )}

          {/* COMPILING HTML EXPORT BOX */}
          {canEditAll && (
            <div className="bg-neutral-850 border border-neutral-800/80 p-6 md:p-8 rounded-3xl space-y-6 shadow-xl">
              <h2 className="text-xl font-bold text-white border-b border-neutral-800 pb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-400">code</span>
                Newsletter HTML Compiler
              </h2>

              <div className="space-y-4">
                <textarea
                  value={generatedHtml}
                  readOnly
                  placeholder="Generated HTML output will appear here. Click 'Generate HTML' below..."
                  className="w-full h-80 rounded-2xl border border-neutral-750 bg-neutral-900/40 p-4 focus:outline-none text-xs text-neutral-300 font-mono resize-y"
                />

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleGenerateHtml}
                    className="px-5 py-3 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    Generate HTML
                  </button>
                  <button
                    onClick={() => {
                      if (!generatedHtml) {
                        alert('Generate HTML first.');
                        return;
                      }
                      localStorage.setItem('newsletter-html', generatedHtml);
                      router.push('/preview');
                    }}
                    className="px-5 py-3 text-xs font-bold text-white bg-amber-500 hover:bg-amber-400 rounded-xl shadow-lg shadow-amber-500/10 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    Preview Mode
                  </button>
                  <button
                    onClick={downloadHTML}
                    className="px-5 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/10 cursor-pointer active:scale-[0.98] transition-all"
                  >
                    Download HTML
                  </button>
                  <button
                    onClick={showEmailModalForm}
                    className="px-5 py-3 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-lg shadow-rose-600/10 cursor-pointer active:scale-[0.98] transition-all ml-auto"
                  >
                    Send Email Campaign
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Email Campaign Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-neutral-850 border border-neutral-700 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Send Email Campaign</h3>
            
            <form onSubmit={handleSendEmail} className="space-y-5">
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Subject Header</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3.5 focus:border-blue-500 focus:outline-none text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Recipients List</label>
                <textarea
                  required
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3.5 focus:border-blue-500 focus:outline-none text-white text-sm font-mono"
                  rows="4"
                  placeholder="email1@example.com, email2@example.com"
                />
                <p className="text-[10px] text-neutral-500 mt-1.5 font-semibold">Separate multiple emails using commas or new lines.</p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-neutral-400 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingEmail}
                  className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-600/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55"
                >
                  {sendingEmail ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">send</span>
                      <span>Send Campaign</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
