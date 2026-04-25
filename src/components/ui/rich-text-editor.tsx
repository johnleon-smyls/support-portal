'use client';

import { useEditor, EditorContent } from '@tiptap/react';
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
  List,
  ListOrdered,
  Link2,
  ImageIcon,
} from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Type here...',
  disabled = false,
}: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      ImageResize.configure({
        inline: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-smyls-blue-700',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
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
    },
  });

  // Sync external content changes (e.g. AI suggestions)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (!editor) return;
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      editor.chain().focus().setImage({ src: result }).run();
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  }, [editor]);

  const addLink = useCallback(() => {
    if (!editor) return;

    if (editor.isActive('link')) {
      const previousUrl = editor.getAttributes('link').href;
      const url = window.prompt('Edit URL (clear to remove):', previousUrl);
      if (url === null) return;
      if (url === '') {
        editor.chain().focus().extendMarkRange('link').unsetLink().run();
      } else {
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
      }
      return;
    }

    const rawUrl = window.prompt('Enter URL:', 'https://');
    if (!rawUrl) return;
    const url = rawUrl.match(/^https?:\/\//) ? rawUrl : `https://${rawUrl}`;

    const { from, to } = editor.state.selection;
    if (from === to) {
      const linkText = window.prompt('Link text:', url) || url;
      editor.chain().focus()
        .insertContent(`<a href="${url}" target="_blank">${linkText}</a>`)
        .run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    cn('h-8 w-8 p-0 rounded-md inline-flex items-center justify-center transition-colors',
      active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
      disabled && 'opacity-50 pointer-events-none'
    );

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white">
      <div className="border-b border-border bg-muted/30 p-1.5 flex gap-0.5">
        <button type="button" className={btnClass(editor.isActive('bold'))} onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={btnClass(editor.isActive('italic'))} onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={btnClass(editor.isActive('underline'))} onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </button>

        <div className="w-px bg-border mx-1" />

        <button type="button" className={btnClass(editor.isActive('bulletList'))} onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet List">
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={btnClass(editor.isActive('orderedList'))} onMouseDown={e => e.preventDefault()} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </button>

        <div className="w-px bg-border mx-1" />

        <button type="button" className={btnClass(false)} onMouseDown={e => e.preventDefault()} onClick={addLink} title="Insert Link">
          <Link2 className="h-4 w-4" />
        </button>
        <button type="button" className={btnClass(false)} onMouseDown={e => e.preventDefault()} onClick={() => fileInputRef.current?.click()} title="Insert Image">
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
