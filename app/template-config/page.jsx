'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function TemplateConfigPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [currentSection, setCurrentSection] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit states for current section
  const [editTitle, setEditTitle] = useState('');
  const [editColor, setEditColor] = useState('#f97316');
  const [editEnabled, setEditEnabled] = useState(true);
  const [editHeadingOnly, setEditHeadingOnly] = useState(false);

  // Add section modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [addTitle, setAddTitle] = useState('');
  const [addColor, setAddColor] = useState('#f97316');
  const [addEnabled, setAddEnabled] = useState(true);
  const [addHeadingOnly, setAddHeadingOnly] = useState(false);
  const [pendingParentId, setPendingParentId] = useState(null);

  const quillContainerRef = useRef(null);
  const quillInstance = useRef(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Sync section edit fields when selection changes
  useEffect(() => {
    if (currentSection) {
      setEditTitle(currentSection.title);
      setEditColor(currentSection.color || '#f97316');
      setEditEnabled(currentSection.enabled !== false);
      setEditHeadingOnly(currentSection.headingOnly === true);

      // Re-initialize Quill editor for section content
      setTimeout(() => {
        if (!currentSection.headingOnly && typeof window !== 'undefined' && window.Quill) {
          if (quillInstance.current) {
            quillInstance.current.root.innerHTML = currentSection.content || '';
          } else if (quillContainerRef.current) {
            quillInstance.current = new window.Quill(quillContainerRef.current, {
              theme: 'snow',
              placeholder: 'Enter default section content...',
              modules: {
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  ['link', 'blockquote'],
                  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                  ['clean']
                ]
              }
            });
            quillInstance.current.root.innerHTML = currentSection.content || '';
          }
        } else {
          quillInstance.current = null;
        }
      }, 50);
    } else {
      quillInstance.current = null;
    }
  }, [currentSection]);

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
          if (data.templates.length > 0) {
            setCurrentTemplate(data.templates[0]);
            setCurrentSection(null);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewTemplate = async () => {
    const name = prompt('Enter template name:');
    if (!name) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, description: 'Custom template' })
      });
      const data = await response.json();
      if (data.success) {
        await loadTemplates();
        const found = data.template;
        if (found) {
          setCurrentTemplate(found);
          setCurrentSection(null);
        }
      }
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleUpdateSection = () => {
    if (!currentSection || !currentTemplate) return;

    const updated = { ...currentSection };
    updated.title = editTitle;
    updated.color = editColor;
    updated.enabled = editEnabled;
    updated.headingOnly = editHeadingOnly;
    if (quillInstance.current && !editHeadingOnly) {
      updated.content = quillInstance.current.root.innerHTML;
    } else {
      updated.content = '';
    }

    // Replace in tree
    const replaceNode = (nodes) => {
      return nodes.map(n => {
        if (n.id === currentSection.id) return { ...n, ...updated };
        if (n.children && n.children.length > 0) {
          return { ...n, children: replaceNode(n.children) };
        }
        return n;
      });
    };

    const nextSections = replaceNode(currentTemplate.sections);
    setCurrentTemplate({ ...currentTemplate, sections: nextSections });
    setCurrentSection(updated);
    alert('Section properties updated in memory! Remember to click Save Template.');
  };

  const handleSaveTemplate = async () => {
    if (!currentTemplate) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/templates/${currentTemplate._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: currentTemplate.name,
          description: currentTemplate.description,
          sections: currentTemplate.sections
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Template config saved successfully!');
        loadTemplates();
      } else {
        alert('Failed to save template: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const addSectionNode = (e) => {
    e.preventDefault();
    if (!addTitle || !currentTemplate) return;

    const newSection = {
      id: 'section-' + Date.now(),
      title: addTitle,
      color: addColor,
      enabled: addEnabled,
      headingOnly: addHeadingOnly,
      content: '',
      children: []
    };

    if (pendingParentId) {
      const appendChild = (nodes) => {
        return nodes.map(n => {
          if (n.id === pendingParentId) {
            const nextChildren = [...(n.children || []), newSection];
            return { ...n, children: nextChildren };
          }
          if (n.children && n.children.length > 0) {
            return { ...n, children: appendChild(n.children) };
          }
          return n;
        });
      };
      const nextSections = appendChild(currentTemplate.sections);
      setCurrentTemplate({ ...currentTemplate, sections: nextSections });
    } else {
      const nextSections = [...currentTemplate.sections, newSection];
      setCurrentTemplate({ ...currentTemplate, sections: nextSections });
    }

    setShowAddModal(false);
    setAddTitle('');
    alert('New section added! Remember to click Save Template.');
  };

  const handleDeleteSection = (sectionId) => {
    if (!confirm('Are you sure you want to delete this section?')) return;

    const removeNode = (nodes) => {
      return nodes
        .filter(n => n.id !== sectionId)
        .map(n => {
          if (n.children && n.children.length > 0) {
            return { ...n, children: removeNode(n.children) };
          }
          return n;
        });
    };

    const nextSections = removeNode(currentTemplate.sections);
    setCurrentTemplate({ ...currentTemplate, sections: nextSections });
    if (currentSection?.id === sectionId) {
      setCurrentSection(null);
    }
    alert('Section removed! Remember to click Save Template.');
  };

  const moveSection = async (sectionId, direction, level) => {
    if (!currentTemplate) return;

    const reorder = (nodes) => {
      const index = nodes.findIndex(n => n.id === sectionId);
      if (index !== -1) {
        const nextIndex = direction === 'up' ? index - 1 : index + 1;
        if (nextIndex >= 0 && nextIndex < nodes.length) {
          const updated = [...nodes];
          const [moved] = updated.splice(index, 1);
          updated.splice(nextIndex, 0, moved);
          return updated;
        }
      }
      return nodes.map(n => {
        if (n.children && n.children.length > 0) {
          return { ...n, children: reorder(n.children) };
        }
        return n;
      });
    };

    const nextSections = reorder(currentTemplate.sections);
    setCurrentTemplate({ ...currentTemplate, sections: nextSections });
  };

  const findSectionInTree = (nodes, id) => {
    for (let node of nodes) {
      if (node.id === id) return node;
      if (node.children && node.children.length > 0) {
        const found = findSectionInTree(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Render Section Node Component recursively
  const SectionNode = ({ section, index, siblingCount, level }) => {
    const isSelected = currentSection && currentSection.id === section.id;
    return (
      <div className="space-y-1">
        <div
          className={`flex items-center justify-between p-3 rounded-xl transition-all ${
            isSelected
              ? 'bg-blue-600/10 border border-blue-500/40 text-white shadow-md'
              : 'bg-neutral-800/40 border border-neutral-800/60 hover:bg-neutral-800/80 text-neutral-300'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-neutral-500 text-sm">drag_indicator</span>
            <div className="w-3.5 h-3.5 rounded-md border border-neutral-700/50" style={{ backgroundColor: section.color }}></div>
            <span className={`font-semibold text-sm ${section.enabled ? 'text-white' : 'text-neutral-500 line-through'}`}>{section.title}</span>
            {section.headingOnly && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-neutral-700 text-neutral-400">Heading Only</span>}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={index === 0}
              onClick={() => moveSection(section.id, 'up', level)}
              className="p-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:pointer-events-none rounded text-xs font-bold text-neutral-300"
            >
              ↑
            </button>
            <button
              disabled={index === siblingCount - 1}
              onClick={() => moveSection(section.id, 'down', level)}
              className="p-1 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:pointer-events-none rounded text-xs font-bold text-neutral-300"
            >
              ↓
            </button>
            <button
              onClick={() => setCurrentSection(section)}
              className="p-1 text-blue-400 hover:text-white rounded"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
            <button
              onClick={() => {
                setPendingParentId(section.id);
                setAddTitle('');
                setAddEnabled(true);
                setAddHeadingOnly(false);
                setShowAddModal(true);
              }}
              className="p-1 text-emerald-400 hover:text-white rounded"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
            <button
              onClick={() => handleDeleteSection(section.id)}
              className="p-1 text-red-400 hover:text-red-300 rounded"
            >
              <span className="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
        {section.children && section.children.map((child, cIndex) => (
          <SectionNode
            key={child.id}
            section={child}
            index={cIndex}
            siblingCount={section.children.length}
            level={level + 1}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 p-8 md:p-12 bg-neutral-900 max-w-7xl mx-auto w-full space-y-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-black tracking-widest text-neutral-500 uppercase mb-2">
            <span>Dashboard</span>
            <span>/</span>
            <span className="text-blue-500">Structure Config</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Template Structure</h1>
          <p className="text-neutral-400 text-sm font-medium">Arrange section hierarchies, parent-child flows and default templates markup</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPendingParentId(null);
              setAddTitle('');
              setAddEnabled(true);
              setAddHeadingOnly(false);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-neutral-800 hover:bg-neutral-750 text-white transition-all border border-neutral-700 cursor-pointer active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span>Add Section</span>
          </button>
          
          <button
            onClick={handleSaveTemplate}
            className="flex items-center gap-2 rounded-xl h-11 px-5 text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-lg shadow-blue-600/15 cursor-pointer active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            <span>Save Template</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Templates list panel */}
          <div className="bg-neutral-850 border border-neutral-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400">layers</span>
              Templates
            </h2>

            <div className="space-y-2 overflow-y-auto max-h-[50vh]">
              {templates.map(t => {
                const isSelected = currentTemplate?._id === t._id;
                return (
                  <div
                    key={t._id}
                    onClick={() => {
                      setCurrentTemplate(t);
                      setCurrentSection(null);
                    }}
                    className={`p-3 rounded-2xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500/30 text-white'
                        : 'bg-neutral-900/40 border-transparent hover:bg-neutral-800/50 text-neutral-300'
                    }`}
                  >
                    <span className="font-bold text-sm block">{t.name}</span>
                    <span className="text-[11px] text-neutral-400 mt-1 block">{t.description || 'Custom template'}</span>
                    {t.isDefault && <span className="inline-block mt-2 px-2 py-0.5 text-[9px] font-black tracking-wider bg-blue-500/15 text-blue-400 rounded uppercase">Default</span>}
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={createNewTemplate}
              className="w-full py-3 bg-neutral-800 hover:bg-neutral-750 text-white font-bold text-xs rounded-2xl border border-neutral-700 transition-all cursor-pointer"
            >
              + Create New Template
            </button>
          </div>

          {/* Section tree hierarchy */}
          <div className="bg-neutral-850 border border-neutral-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400">account_tree</span>
              Section Structure
            </h2>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {currentTemplate?.sections?.map((sect, sIndex) => (
                <SectionNode
                  key={sect.id}
                  section={sect}
                  index={sIndex}
                  siblingCount={currentTemplate.sections.length}
                  level={0}
                />
              ))}
              {(!currentTemplate?.sections || currentTemplate.sections.length === 0) && (
                <div className="text-center py-10 text-xs text-neutral-500 font-bold">
                  No sections configured. Add your first section layout!
                </div>
              )}
            </div>
          </div>

          {/* Section property editor */}
          <div className="bg-neutral-850 border border-neutral-800/80 rounded-3xl p-5 space-y-4 shadow-xl">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-400">edit_note</span>
              Section Editor
            </h2>

            {currentSection ? (
              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-[10px] font-black tracking-widest text-neutral-400 uppercase mb-2">Section Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black tracking-widest text-neutral-400 uppercase mb-2">Section Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-12 h-10 rounded-xl border border-neutral-700 bg-neutral-900/50 cursor-pointer p-0.5 overflow-hidden"
                    />
                    <input
                      type="text"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 text-white text-xs uppercase focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 py-2 border-t border-b border-neutral-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editEnabled}
                      onChange={(e) => setEditEnabled(e.target.checked)}
                      className="rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-300 font-bold">Enabled</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editHeadingOnly}
                      onChange={(e) => setEditHeadingOnly(e.target.checked)}
                      className="rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                    />
                    <span className="text-xs text-neutral-300 font-bold">Heading Only</span>
                  </label>
                </div>

                {!editHeadingOnly && (
                  <div>
                    <label className="block text-[10px] font-black tracking-widest text-neutral-400 uppercase mb-2">Default Markup</label>
                    <div className="border border-neutral-750 rounded-2xl overflow-hidden bg-white">
                      <div ref={quillContainerRef} className="bg-white text-black min-h-[150px]"></div>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpdateSection}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/10 transition-all cursor-pointer active:scale-[0.98]"
                >
                  Apply Editor Changes
                </button>
              </div>
            ) : (
              <div className="text-center py-20 text-xs text-neutral-500 font-bold">
                Select a section edit icon (🖊️) from the hierarchy tree to configure properties.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Section Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
          <div className="bg-neutral-850 border border-neutral-700 rounded-3xl p-8 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-lg">
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Add New Section</h3>
            
            <form onSubmit={addSectionNode} className="space-y-5">
              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Section Title</label>
                <input
                  type="text"
                  required
                  value={addTitle}
                  onChange={(e) => setAddTitle(e.target.value)}
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm"
                  placeholder="e.g., QA Team Updates"
                />
              </div>

              <div>
                <label className="block text-xs font-black tracking-wider uppercase text-neutral-400 mb-2">Section Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={addColor}
                    onChange={(e) => setAddColor(e.target.value)}
                    className="w-14 h-11 rounded-xl border border-neutral-750 bg-neutral-900/50 cursor-pointer overflow-hidden p-0.5"
                  />
                  <input
                    type="text"
                    required
                    value={addColor}
                    onChange={(e) => setAddColor(e.target.value)}
                    className="flex-1 rounded-xl border border-neutral-700 bg-neutral-900/50 p-3 focus:border-blue-500 focus:outline-none text-white text-sm uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 py-2 border-t border-b border-neutral-850">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addEnabled}
                    onChange={(e) => setAddEnabled(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-neutral-300 font-bold">Enabled</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addHeadingOnly}
                    onChange={(e) => setAddHeadingOnly(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-900 text-blue-500 focus:ring-offset-0 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-xs text-neutral-300 font-bold">Heading Only</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 text-sm font-bold text-neutral-400 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/15 transition-all cursor-pointer"
                >
                  Add Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
