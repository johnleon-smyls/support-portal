'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
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
import { Button } from './button';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [, setTick] = useState(0);

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
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
      setTick(t => t + 1);
    },
    onSelectionUpdate: () => setTick(t => t + 1),
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

    // If already on a link, allow editing or removing it
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

    // Auto-prepend https:// if no protocol
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

  const ToolbarButton = ({ onClick, active, title, children, btnDisabled }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    children: React.ReactNode;
    btnDisabled?: boolean;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onMouseDown={(e) => { e.preventDefault(); }}
      onClick={() => onClick()}
      disabled={btnDisabled || disabled}
      className={`h-8 w-8 p-0 ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-white">
      <div className="border-b border-border bg-muted/30 p-1.5 flex gap-0.5">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px bg-border mx-1" />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List">
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>

        <div className="w-px bg-border mx-1" />

        <ToolbarButton onClick={addLink} title="Insert Link">
          <Link2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Insert Image">
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      </div>

      <div className="prose-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
