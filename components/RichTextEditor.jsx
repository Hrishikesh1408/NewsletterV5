'use client';

import { useEffect, useRef } from 'react';

export default function RichTextEditor({ value, onChange, placeholder }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const isSettingValueRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.Quill || !containerRef.current) return;

    if (!quillRef.current) {
      quillRef.current = new window.Quill(containerRef.current, {
        theme: 'snow',
        placeholder: placeholder || 'Enter content...',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'header': [1, 2, 3, false] }],
            [{ 'color': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'clean']
          ]
        }
      });

      quillRef.current.on('text-change', () => {
        if (!isSettingValueRef.current && onChange) {
          onChange(quillRef.current.root.innerHTML);
        }
      });
    }

    if (value !== quillRef.current.root.innerHTML) {
      isSettingValueRef.current = true;
      quillRef.current.root.innerHTML = value || '';
      isSettingValueRef.current = false;
    }
  }, [value, onChange, placeholder]);

  return (
    <div className="bg-white text-black border border-neutral-700/60 rounded-2xl overflow-hidden shadow-inner">
      <div ref={containerRef} className="min-h-[140px]"></div>
    </div>
  );
}
