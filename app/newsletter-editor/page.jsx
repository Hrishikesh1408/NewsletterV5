'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import RichTextEditor from '@/components/RichTextEditor';

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [newsletterId, setNewsletterId] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [currentTemplateId, setCurrentTemplateId] = useState('');
  
  // Newsletter content states
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('');
  const [dynamicContent, setDynamicContent] = useState({});
  const [customSections, setCustomSections] = useState([]);
  const [legacyFields, setLegacyFields] = useState({});
  
  // Flattened active template sections
  const [templateSections, setTemplateSections] = useState([]);

  useEffect(() => {
    const id = searchParams.get('id');
    setNewsletterId(id);
  }, [searchParams]);

  useEffect(() => {
    if (newsletterId) {
      initializeEditor();
    }
  }, [newsletterId]);

  const initializeEditor = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // 1. Fetch available templates
      const templateRes = await fetch('/api/templates', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const templateData = await templateRes.json();
      let templates = [];
      if (templateData.success) {
        templates = templateData.templates || [];
        setAvailableTemplates(templates);
      }

      // 2. Fetch or create newsletter
      if (newsletterId === 'new') {
        await createNewNewsletter(token, templates);
      } else {
        await loadExistingNewsletter(token, newsletterId, templates);
      }
    } catch (error) {
      console.error('Failed to initialize editor:', error);
      alert('Error initializing editor');
    } finally {
      setLoading(false);
    }
  };

  const createNewNewsletter = async (token, templates) => {
    try {
      const activeProjId = localStorage.getItem('currentProject');
      const res = await fetch('/api/newsletters/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'New Edition',
          projectId: activeProjId || null
        })
      });

      if (!res.ok) throw new Error('Failed to create new newsletter');
      const data = await res.json();
      
      router.replace(`/newsletter-editor?id=${data._id}`);
      setNewsletterId(data._id);
      setTitle(data.title || 'New Edition');
      setProjectId(data.projectId || '');
      setDynamicContent({});
      setCustomSections([]);

      // Load default template configuration
      const defaultTemplate = templates.find(t => t.isDefault) || templates[0];
      if (defaultTemplate) {
        setCurrentTemplateId(defaultTemplate._id);
        setTemplateSections(flattenSections(defaultTemplate.sections));
      }
    } catch (error) {
      console.error('Failed to create newsletter:', error);
      alert('Failed to initialize a new newsletter instance');
    }
  };

  const loadExistingNewsletter = async (token, id, templates) => {
    try {
      const response = await fetch(`/api/newsletters/newsletter/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 404) {
          await createNewNewsletter(token, templates);
          return;
        }
        throw new Error('Newsletter not found');
      }
      const data = await response.json();
      
      setTitle(data.title || 'Newsletter Edition');
      setProjectId(data.projectId || '');
      setDynamicContent(data.dynamicContent || {});
      setCustomSections(data.customSections || []);

      // Load template configuration
      const matchedTemplate = templates.find(t => t._id === data.templateId) || templates.find(t => t.isDefault) || templates[0];
      if (matchedTemplate) {
        setCurrentTemplateId(matchedTemplate._id);
        setTemplateSections(flattenSections(matchedTemplate.sections));
      }

      // Collect legacy fields
      const legacy = {};
      Object.keys(data).forEach(field => {
        if (['_id', 'title', 'dynamicContent', 'customSections', 'templateId', 'projectId', 'changeLog', 'createdAt', '__v'].includes(field)) return;
        legacy[field] = data[field];
      });
      setLegacyFields(legacy);
    } catch (error) {
      console.error('Failed to load newsletter data:', error);
      alert('Error loading newsletter');
    }
  };

  const flattenSections = (sections, level = 0) => {
    let flattened = [];
    sections.forEach(section => {
      if (section.enabled) {
        flattened.push({ ...section, level });
        if (section.children) {
          flattened = flattened.concat(flattenSections(section.children, level + 1));
        }
      }
    });
    return flattened;
  };

  const handleTemplateSwitch = (templateId) => {
    setCurrentTemplateId(templateId);
    const matched = availableTemplates.find(t => t._id === templateId);
    if (matched) {
      setTemplateSections(flattenSections(matched.sections));
    }
  };

  const addCustomSection = () => {
    const titlePrompt = prompt('Enter custom section title:');
    if (!titlePrompt) return;

    const newSection = {
      id: 'custom-' + Date.now(),
      title: titlePrompt,
      color: '#3b82f6',
      content: ''
    };
    setCustomSections([...customSections, newSection]);
  };

  const removeCustomSection = (sectionId) => {
    if (!confirm('Are you sure you want to remove this custom section?')) return;
    setCustomSections(customSections.filter(s => s.id !== sectionId));
    setDynamicContent(prev => {
      const copy = { ...prev };
      delete copy[sectionId];
      return copy;
    });
  };

  const updateDynamicContent = (sectionId, value) => {
    setDynamicContent(prev => ({
      ...prev,
      [sectionId]: value
    }));
  };

  const updateCustomSectionContent = (sectionId, value) => {
    setCustomSections(prev => prev.map(s => s.id === sectionId ? { ...s, content: value } : s));
  };

  const handleSave = async () => {
    if (!newsletterId) return;
    setSaving(true);

    const token = localStorage.getItem('token');

    const updatePayload = {
      title,
      templateId: currentTemplateId,
      dynamicContent,
      customSections: customSections.map(s => ({
        id: s.id,
        title: s.title,
        color: s.color,
        content: s.content
      })),
      ...legacyFields
    };

    try {
      const response = await fetch(`/api/newsletters/newsletter/${newsletterId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.html) {
          localStorage.setItem('newsletter-html', data.html);
        }
        alert('Newsletter saved successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save newsletter');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-900 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 md:p-12 bg-neutral-900 max-w-5xl mx-auto w-full space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-neutral-500 uppercase mb-2">
            <span>Editor</span>
            <span>/</span>
            <span className="text-blue-500">Template Editor</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Newsletter Editor</h1>
          <p className="text-neutral-400 text-sm font-medium">Add, configure, and layout sections matching your corporate templates.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addCustomSection}
            className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-700 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">add_box</span>
            <span>Add Section</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/15 cursor-pointer active:scale-[0.98]"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <span className="material-symbols-outlined text-lg">save</span>
            )}
            <span>{saving ? 'Saving...' : 'Save Edition'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Settings Pane */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-neutral-850 border border-neutral-800/80 p-6 rounded-3xl shadow-xl space-y-4">
            <h3 className="text-sm font-black text-neutral-400 uppercase tracking-wider">Editor settings</h3>
            
            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-400">Newsletter Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-neutral-400">Select Template Config</label>
              <select
                value={currentTemplateId}
                onChange={(e) => handleTemplateSwitch(e.target.value)}
                className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs cursor-pointer font-bold text-blue-400"
              >
                <option value="">Choose Template Layout...</option>
                {availableTemplates.map(t => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Dashboard Metrics */}
            <h3 className="text-sm font-black text-neutral-400 uppercase tracking-wider mt-8 pt-4 border-t border-neutral-800">Dashboard Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase">Storefront Downtime</label>
                <input
                  type="text"
                  value={dynamicContent.storefrontDowntime !== undefined ? dynamicContent.storefrontDowntime : '0'}
                  onChange={(e) => updateDynamicContent('storefrontDowntime', e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase">Global Components</label>
                <input
                  type="text"
                  value={dynamicContent.globalComponents !== undefined ? dynamicContent.globalComponents : '90%'}
                  onChange={(e) => updateDynamicContent('globalComponents', e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase">ECP Functionality</label>
                <input
                  type="text"
                  value={dynamicContent.ecpFunctionality !== undefined ? dynamicContent.ecpFunctionality : '80%'}
                  onChange={(e) => updateDynamicContent('ecpFunctionality', e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase">Production Releases</label>
                <input
                  type="text"
                  value={dynamicContent.productionReleases !== undefined ? dynamicContent.productionReleases : '4+'}
                  onChange={(e) => updateDynamicContent('productionReleases', e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-2.5 text-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sections Editor */}
        <div className="md:col-span-2 space-y-6">
          {/* Template sections */}
          {templateSections.map((section) => {
            const val = dynamicContent[section.id] || '';
            const paddingClass = section.level > 0 ? `ml-${section.level * 4}` : '';
            return (
              <div
                key={section.id}
                className={`bg-neutral-850 border border-neutral-800/80 p-6 md:p-8 rounded-3xl space-y-4 shadow-xl ${paddingClass}`}
              >
                <div className="flex items-center gap-2 border-l-4 pl-3" style={{ borderColor: section.color }}>
                  <h3 className="text-sm font-black tracking-tight" style={{ color: section.color }}>
                    {section.title}
                  </h3>
                </div>
                <RichTextEditor
                  value={val}
                  onChange={(html) => updateDynamicContent(section.id, html)}
                  placeholder={`Write details for ${section.title}...`}
                />
              </div>
            );
          })}

          {/* Custom sections */}
          {customSections.map((section) => {
            return (
              <div
                key={section.id}
                className="bg-neutral-850 border border-neutral-800/80 p-6 md:p-8 rounded-3xl space-y-4 shadow-xl relative"
              >
                <button
                  onClick={() => removeCustomSection(section.id)}
                  className="absolute top-4 right-4 text-xs font-bold text-red-400 hover:text-white p-1"
                >
                  ✕ Remove
                </button>
                <div className="flex items-center gap-2 border-l-4 pl-3" style={{ borderColor: section.color }}>
                  <h3 className="text-sm font-black tracking-tight" style={{ color: section.color }}>
                    {section.title} (Custom)
                  </h3>
                </div>
                <RichTextEditor
                  value={section.content || ''}
                  onChange={(html) => updateCustomSectionContent(section.id, html)}
                  placeholder={`Write details for ${section.title}...`}
                />
              </div>
            );
          })}

          {/* Legacy details / fallback textareas */}
          {Object.keys(legacyFields).map(field => {
            const val = legacyFields[field] || '';
            return (
              <div
                key={field}
                className="bg-neutral-850 border border-neutral-800/80 p-6 md:p-8 rounded-3xl space-y-4 shadow-xl"
              >
                <div className="flex items-center gap-2 border-l-4 pl-3 border-neutral-600">
                  <h3 className="text-sm font-black tracking-tight text-neutral-300 uppercase">
                    {field} (Legacy Update Field)
                  </h3>
                </div>
                <textarea
                  value={val}
                  onChange={(e) => setLegacyFields(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs leading-relaxed min-h-[100px]"
                  placeholder={`Enter content for ${field}...`}
                />
              </div>
            );
          })}

          {templateSections.length === 0 && customSections.length === 0 && Object.keys(legacyFields).length === 0 && (
            <div className="text-center py-20 bg-neutral-850 rounded-3xl border border-neutral-800/60 shadow-xl">
              <span className="material-symbols-outlined text-neutral-500 text-5xl mb-4">toc</span>
              <h2 className="text-lg font-bold text-white mb-2">No Content Sections</h2>
              <p className="text-neutral-400 text-sm max-w-sm mx-auto">Please pick a template layout from the settings pane or add custom sections to begin writing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewsletterEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex items-center justify-center bg-neutral-900 min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <EditorContent />
    </Suspense>
  );
}
