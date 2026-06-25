'use client';

import { useState, useEffect } from 'react';

export default function PreviewPage() {
  const [projectId, setProjectId] = useState(null);
  const [html, setHtml] = useState('');
  const [viewMode, setViewMode] = useState('desktop');
  const [loading, setLoading] = useState(true);

  // Email modal
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Newsletter');
  const [emailRecipients, setEmailRecipients] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  useEffect(() => {
    const cachedProjId = localStorage.getItem('currentProject');
    setProjectId(cachedProjId);

    if (cachedProjId) {
      loadPreview(cachedProjId);
    } else {
      setLoading(false);
    }

    const handleProjectChange = () => {
      const newProjId = localStorage.getItem('currentProject');
      setProjectId(newProjId);
      if (newProjId) {
        loadPreview(newProjId);
      }
    };

    window.addEventListener('projectChanged', handleProjectChange);
    return () => window.removeEventListener('projectChanged', handleProjectChange);
  }, []);

  const loadPreview = async (projId) => {
    setLoading(true);
    // Try localStorage first
    const savedHTML = localStorage.getItem('newsletter-html');
    if (savedHTML) {
      setHtml(savedHTML);
      setLoading(false);
      return;
    }

    // Fallback to fetch from API
    await fetchFromApi(projId);
  };

  const fetchFromApi = async (projId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/newsletters/${projId}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.html) {
          setHtml(result.html);
          localStorage.setItem('newsletter-html', result.html);
        }
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForceRefresh = async () => {
    if (!projectId) return;
    setLoading(true);
    localStorage.removeItem('newsletter-html');
    await fetchFromApi(projectId);
  };

  const handleDownload = () => {
    if (!html) {
      alert('No newsletter content to download.');
      return;
    }

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailSubject || !emailRecipients) {
      alert('Please fill in both subject and recipients');
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
          html: html,
          subject: emailSubject,
          recipients: recipientList.join(',')
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(result.message || 'Newsletter emails sent successfully!');
        setShowEmailModal(false);
        setEmailRecipients('');
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

  if (!projectId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 bg-neutral-900">
        <div className="text-center p-8 bg-neutral-800 border border-neutral-700 rounded-3xl max-w-md shadow-2xl">
          <span className="material-symbols-outlined text-neutral-500 text-5xl mb-4">preview</span>
          <h2 className="text-xl font-bold text-white mb-2">No Active Project</h2>
          <p className="text-neutral-400 text-sm">Please select a newsletter project from the header dropdown to preview its content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 md:p-12 bg-neutral-900 max-w-5xl mx-auto w-full space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-neutral-500 uppercase mb-2">
            <span>Campaigns</span>
            <span>/</span>
            <span className="text-blue-500">Preview</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Newsletter Preview</h1>
          <p className="text-neutral-400 text-sm font-medium">Review desktop and mobile viewport displays before launching email deliveries</p>
        </div>

        <div className="flex items-center gap-2 bg-neutral-800 p-1 rounded-xl border border-neutral-700/60">
          <button
            onClick={() => setViewMode('desktop')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'desktop' ? 'bg-neutral-750 text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">desktop_windows</span>
            <span>Desktop</span>
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'mobile' ? 'bg-neutral-750 text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-sm">phone_iphone</span>
            <span>Mobile</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="flex flex-col rounded-3xl border border-neutral-800 bg-neutral-850 overflow-hidden shadow-2xl">
          <div className="p-6 bg-neutral-900/40 flex justify-center items-center overflow-x-auto min-h-[60vh]">
            <div
              className={`w-full transition-all duration-300 bg-white rounded-2xl shadow-inner border border-neutral-850 overflow-hidden ${
                viewMode === 'mobile' ? 'max-w-[375px] h-[640px]' : 'w-full h-[640px]'
              }`}
            >
              {html ? (
                <iframe
                  title="Newsletter Render"
                  srcDoc={html}
                  className="w-full h-full border-0"
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col justify-center items-center text-neutral-400 p-6 text-center">
                  <span className="material-symbols-outlined text-5xl mb-4 text-neutral-500">wysiwyg</span>
                  <h3 className="font-bold text-neutral-300">No content loaded</h3>
                  <p className="text-xs text-neutral-500 mt-1 max-w-xs leading-relaxed">Save your content in the editor and click "Generate HTML" to preview output pages here.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 p-5 bg-neutral-850 border-t border-neutral-800">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-neutral-800 hover:bg-neutral-750 text-white border border-neutral-700 transition-all cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">download</span>
              <span>Download HTML</span>
            </button>
            <button
              onClick={handleForceRefresh}
              className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-neutral-800 hover:bg-neutral-750 text-amber-400 border border-neutral-700 transition-all cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">refresh</span>
              <span>Force Refresh</span>
            </button>
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/15 cursor-pointer active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              <span>Send Email</span>
            </button>
          </div>
        </div>
      )}

      {/* Email Delivery Modal Dialog */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-neutral-850 border border-neutral-700 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setShowEmailModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Send Newsletter</h3>
            
            <form onSubmit={handleSendEmail} className="space-y-5">
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Email Subject</label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3.5 focus:border-blue-500 focus:outline-none text-white text-sm"
                  placeholder="Newsletter Subject"
                />
              </div>

              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Recipients List</label>
                <textarea
                  required
                  value={emailRecipients}
                  onChange={(e) => setEmailRecipients(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3.5 focus:border-blue-500 focus:outline-none text-white text-sm font-mono"
                  rows="5"
                  placeholder="name1@example.com, name2@example.com"
                />
                <p className="text-[10px] text-neutral-500 mt-1.5 font-semibold leading-relaxed">
                  Enter email addresses separated by commas or new lines. Emails will be personalized automatically.
                </p>
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
                  className="flex-1 py-3 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-lg shadow-red-600/15 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-55 disabled:pointer-events-none"
                >
                  {sendingEmail ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">mail</span>
                      <span>Send Newsletter</span>
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
