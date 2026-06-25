'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // Preview
  const [previewTemplateId, setPreviewTemplateId] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [loadingPreview, setLoadingPreview] = useState(false);
  
  // Custom upload fields
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Turbify Brand Config fields
  const [companyName, setCompanyName] = useState('Turbify');
  const [primaryColor, setPrimaryColor] = useState('#1173d4');
  const [titleFormat, setTitleFormat] = useState('Monthly Newsletter');

  useEffect(() => {
    loadTemplates();
    loadTurbifyConfig();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTemplates(data.templates);
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTurbifyConfig = () => {
    const savedConfig = localStorage.getItem('turbifyConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.companyName) setCompanyName(config.companyName);
        if (config.primaryColor) setPrimaryColor(config.primaryColor);
        if (config.titleFormat) setTitleFormat(config.titleFormat);
      } catch (error) {
        console.error(error);
      }
    }
  };

  const handleSaveConfig = (e) => {
    e.preventDefault();
    const config = {
      template: 'turbify',
      companyName,
      primaryColor,
      titleFormat
    };

    localStorage.setItem('turbifyConfig', JSON.stringify(config));
    localStorage.setItem('selectedTemplate', 'turbify');
    setShowConfigModal(false);
    alert('Turbify template branding configured and selected!');
  };

  const handleUploadTemplate = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select an HTML file to upload.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const htmlContent = event.target.result;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: templateName,
            description: templateDesc,
            html: htmlContent
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            alert('Custom template uploaded and configured successfully!');
            setShowUploadModal(false);
            setTemplateName('');
            setTemplateDesc('');
            setSelectedFile(null);
            loadTemplates();
          } else {
            alert('Failed to upload template: ' + (result.error || 'Unknown error'));
          }
        } else {
          alert('Failed to upload template.');
        }
      } catch (err) {
        console.error('Upload template error:', err);
        alert('An error occurred during template upload.');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Are you sure you want to delete this custom template?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success) {
        loadTemplates();
      } else {
        alert('Failed to delete template');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const selectTemplate = (templateId) => {
    localStorage.setItem('selectedTemplate', templateId);
    alert(`Template "${templateId}" is selected for new newsletter editions!`);
  };

  const previewTemplate = async (templateId) => {
    setPreviewTemplateId(templateId);
    setShowPreviewModal(true);
    setPreviewHtml('');
    setLoadingPreview(true);

    if (templateId === 'turbify') {
      const matched = templates.find(t => t.isDefault && templateId === 'turbify') || templates.find(t => t.name.toLowerCase().includes(templateId));
      if (matched && matched.html) {
        setPreviewHtml(matched.html);
      } else {
        setPreviewHtml('<h3>System template HTML not uploaded yet.</h3>');
      }
      setLoadingPreview(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/templates/${templateId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.template) {
          setPreviewHtml(data.template.html || '<h3>No HTML template layout stored for this config.</h3>');
        }
      }
    } catch (error) {
      console.error('Failed to load template preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 p-8 md:p-12 bg-neutral-900 max-w-7xl mx-auto w-full space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-neutral-500 uppercase mb-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-blue-500">Templates</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Newsletter Templates</h1>
          <p className="text-neutral-400 text-sm font-medium">Design, upload, and configure brand guidelines for newsletter outputs</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/template-config')}
            className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-neutral-800 hover:bg-neutral-700 text-white transition-all border border-neutral-700 active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            <span>Configure Structure</span>
          </button>
          
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/15 active:scale-[0.98] cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">upload</span>
            <span>Upload Template</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search templates..."
          className="w-full rounded-xl border border-neutral-800 bg-neutral-850 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none text-white text-sm placeholder:text-neutral-500 pl-10 pr-4 py-3 transition-all"
        />
        <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500 text-lg">search</span>
      </div>

      {/* Built-in Defaults & Dynamic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Turbify Card */}
        <div className="bg-neutral-850 border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between hover:border-neutral-700 transition-all shadow-lg hover:shadow-xl group">
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">Turbify</h3>
                <p className="text-xs text-neutral-400 font-medium mt-1 leading-relaxed">Standard brand corporate email newsletter template with structured sections.</p>
              </div>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-md">
                System Default
              </span>
            </div>
          </div>
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-neutral-500 border-t border-neutral-800/80 pt-3">
              Built-in default
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => previewTemplate('turbify')}
                className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-750 text-white font-bold text-xs rounded-xl transition-all border border-neutral-750 active:scale-[0.98] cursor-pointer"
              >
                Preview
              </button>
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-3 py-2 bg-neutral-800 hover:bg-neutral-750 text-amber-400 font-bold text-xs rounded-xl transition-all border border-neutral-750 active:scale-[0.98] cursor-pointer"
              >
                Configure
              </button>
              <button
                onClick={() => selectTemplate('turbify')}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/10 active:scale-[0.98] cursor-pointer"
              >
                Select
              </button>
            </div>
          </div>
        </div>



        {/* Custom Uploads Grid */}
        {filteredTemplates.map((template) => (
          <div key={template._id} className="bg-neutral-850 border border-neutral-800 p-6 rounded-2xl flex flex-col justify-between hover:border-neutral-700 transition-all shadow-lg hover:shadow-xl group">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{template.name}</h3>
                  <p className="text-xs text-neutral-400 font-medium mt-1 leading-relaxed">{template.description || 'Custom HTML Layout.'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-md">
                    Custom
                  </span>
                  <button
                    onClick={() => handleDeleteTemplate(template._id)}
                    className="p-1 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-[10px] font-bold text-neutral-500 border-t border-neutral-800/80 pt-3">
                Created: {new Date(template.createdAt).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => previewTemplate(template._id)}
                  className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-750 text-white font-bold text-xs rounded-xl transition-all border border-neutral-750 active:scale-[0.98] cursor-pointer"
                >
                  Preview
                </button>
                <button
                  onClick={() => selectTemplate(template._id)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/10 active:scale-[0.98] cursor-pointer"
                >
                  Select
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal Dialog */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-neutral-850 border border-neutral-700 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Upload Custom Template</h3>
            <form onSubmit={handleUploadTemplate} className="space-y-5">
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Template Name</label>
                <input
                  type="text"
                  required
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm"
                  placeholder="Enter custom layout name"
                />
              </div>
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Description</label>
                <textarea
                  value={templateDesc}
                  onChange={(e) => setTemplateDesc(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm"
                  rows="3"
                  placeholder="Template description"
                />
              </div>
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">HTML Template File</label>
                <input
                  type="file"
                  accept=".html,.htm"
                  required
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full text-xs text-neutral-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:uppercase file:bg-blue-600/20 file:text-blue-400 hover:file:bg-blue-600/30 file:cursor-pointer transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-neutral-400 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/15 transition-all cursor-pointer"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Turbify branding Config Modal Dialog */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-neutral-850 border border-neutral-700 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowConfigModal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Configure Turbify Brand</h3>
            
            <form onSubmit={handleSaveConfig} className="space-y-5">
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm"
                />
              </div>
              
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Primary Color (Hex)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-14 h-11 rounded-xl border border-neutral-750 bg-neutral-900/50 cursor-pointer overflow-hidden p-0.5"
                  />
                  <input
                    type="text"
                    required
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Title Format</label>
                <input
                  type="text"
                  required
                  value={titleFormat}
                  onChange={(e) => setTitleFormat(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-neutral-400 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/15 transition-all cursor-pointer"
                >
                  Apply Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal Dialog */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-neutral-850 border border-neutral-700 rounded-3xl p-6 w-full max-w-4xl shadow-2xl relative flex flex-col h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="text-lg font-bold text-white">Template Preview - {previewTemplateId.toUpperCase()}</h3>
              <button onClick={() => setShowPreviewModal(false)} className="text-neutral-400 hover:text-white p-1 rounded-lg">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="flex-1 bg-white rounded-2xl overflow-hidden mt-4 shadow-inner">
              {loadingPreview ? (
                <div className="w-full h-full flex flex-col justify-center items-center text-neutral-500 font-medium">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
                  <p>Loading template preview...</p>
                </div>
              ) : previewHtml ? (
                <iframe
                  title="Template Preview Render"
                  srcDoc={previewHtml}
                  className="w-full h-full border-0"
                ></iframe>
              ) : (
                <div className="w-full h-full flex flex-col justify-center items-center text-neutral-500 font-medium">
                  <span className="material-symbols-outlined text-4xl text-neutral-400 mb-2">web</span>
                  <p>No preview layout available for this template.</p>
                  <p className="text-xs text-neutral-400 mt-1">Template: {previewTemplateId}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
