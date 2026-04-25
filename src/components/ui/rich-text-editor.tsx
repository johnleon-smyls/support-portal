'use client';

import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import ImageResize from 'tiptap-extension-resize-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link2,
  ImageIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { uploadFile } from '@/lib/services/file-service';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Upload an image file to Frappe and insert it into the editor.
 * Shared by button, paste, and drag handlers.
 */
async function uploadAndInsertImage(file: File | Blob, editor: Editor) {
  const frappeUrl = process.env.NEXT_PUBLIC_FRAPPE_BASE_URL || '';
  const filename = file instanceof File ? file.name : `image-${Date.now()}.png`;

  try {
    const result = await uploadFile(file, { filename, isPrivate: false });
    const src = result.file_url?.startsWith('http')
      ? result.file_url
      : `${frappeUrl}${result.file_url}`;
    editor.chain().focus().setImage({ src }).run();
  } catch {
    // Fallback to base64 if upload fails
    const reader = new FileReader();
    reader.onload = (e) => {
      editor.chain().focus().setImage({ src: e.target?.result as string }).run();
    };
    reader.readAsDataURL(file);
  }
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Type here...',
  disabled = false,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const [active, setActive] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Underline,
      Image.configure({ inline: true, allowBase64: true }),
      ImageResize,
      Link.configure({
        openOnClick: 'whenNotEditable',
        autolink: false,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-smyls-blue-700 cursor-pointer',
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable: !disabled,
    onUpdate: ({ editor: e }) => {
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] p-4',
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault();
            const file = item.getAsFile();
            if (!file || !editor) return false;
            uploadAndInsertImage(file, editor);
            return true;
          }
        }
        return false;
      },
      handleClick: (view, pos) => {
        const { state } = view;
        const linkMark = state.doc.resolve(pos).marks().find(m => m.type.name === 'link');
        if (linkMark) {
          const oldHref = linkMark.attrs.href;
          setTimeout(() => {
            const newUrl = window.prompt('Edit URL (clear to remove):', oldHref);
            if (newUrl === null) return;
            if (newUrl === '') {
              editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            } else {
              editor?.chain().focus().extendMarkRange('link').run();
              const { from, to } = editor!.state.selection;
              const currentText = editor!.state.doc.textBetween(from, to);
              if (currentText === oldHref) {
                editor?.chain()
                  .focus()
                  .extendMarkRange('link')
                  .deleteSelection()
                  .insertContent(`<a href="${newUrl}" target="_blank">${newUrl}</a>`)
                  .run();
              } else {
                editor?.chain().focus().extendMarkRange('link').setLink({ href: newUrl }).run();
              }
            }
          }, 0);
          return true;
        }
        return false;
      },
    },
  });

  // Listen to editor transactions to sync active states
  useEffect(() => {
    if (!editor) return;
    const updateActive = () => {
      setActive({
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
      });
    };
    editor.on('transaction', updateActive);
    return () => { editor.off('transaction', updateActive); };
  }, [editor]);

  // Sync external content changes (AI suggestions)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  // Native DOM drop handler — intercepts before TipTap/browser can insert raw <img>
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container || !editor) return;

    const handleDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files?.length) return;
      const file = files[0];
      if (!file.type.startsWith('image/')) return;
      e.preventDefault();
      e.stopPropagation();
      uploadAndInsertImage(file, editor);
    };

    // Must use capture phase to beat TipTap's handler
    container.addEventListener('drop', handleDrop, true);
    container.addEventListener('dragover', (e) => {
      if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
    });

    return () => {
      container.removeEventListener('drop', handleDrop, true);
    };
  }, [editor]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return;
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    uploadAndInsertImage(file, editor);
    event.target.value = '';
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;
    if (editor.isActive('link')) {
      const prev = editor.getAttributes('link').href;
      const url = window.prompt('Edit URL (clear to remove):', prev);
      if (url === null) return;
      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
      return;
    }
    const url = window.prompt('Enter URL:');
    if (!url) return;
    const { from, to } = editor.state.selection;
    if (from === to) {
      editor.chain().focus()
        .insertContent(`<a href="${url}" target="_blank">${url}</a> `)
        .run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const btn = (isActive: boolean) =>
    cn('h-8 w-8 p-0 rounded-md inline-flex items-center justify-center cursor-pointer transition-colors',
      isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      disabled && 'opacity-50 pointer-events-none'
    );

  return (
    <div ref={editorContainerRef} className="border border-border rounded-lg overflow-hidden bg-white">
      <div className="border-b border-border bg-muted/30 p-1.5 flex gap-0.5">
        <button type="button" className={btn(active.bold)} onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={btn(active.italic)} onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={btn(active.underline)} onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </button>

        <div className="w-px bg-border mx-1" />

        <button type="button" className={btn(false)} onMouseDown={e => e.preventDefault()} onClick={addLink} title="Insert Link">
          <Link2 className="h-4 w-4" />
        </button>
        <button type="button" className={btn(false)} onMouseDown={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()} title="Insert Image">
          <ImageIcon className="h-4 w-4" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
      </div>

      <div className="prose-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
