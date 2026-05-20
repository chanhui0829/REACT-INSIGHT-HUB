/**
 * @file AppEditor.tsx
 * @description BlockNote 에디터 컴포넌트입니다.
 */

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import type { Block } from '@blocknote/core';
import { ko } from '@blocknote/core/locales';

import '@blocknote/mantine/style.css';
import '@blocknote/core/fonts/inter.css';

interface Props {
  value: Block[];
  onChange?: (content: Block[]) => void;
  readonly?: boolean;
}

export function AppEditor({ value, onChange, readonly = false }: Props) {
  const locale = useMemo(() => ko, []);
  const initializedRef = useRef(false);

  const editor = useCreateBlockNote({
    dictionary: {
      ...locale,
      placeholders: {
        ...locale.placeholders,
        emptyDocument: "텍스트를 입력하거나 '/'를 눌러 명령어를 실행하세요.",
      },
    },
  });

  // 최초 1회만 초기값 세팅 (매 렌더마다 replaceBlocks 방지)
  useEffect(() => {
    if (initializedRef.current) return;
    if (!value || value.length === 0) return;

    editor.replaceBlocks(editor.document, value);
    initializedRef.current = true;
  }, [editor, value]);

  return (
    <BlockNoteView
      editor={editor}
      editable={!readonly}
      onChange={() => {
        if (!readonly) {
          onChange?.(editor.document);
        }
      }}
      className={`
        rounded-lg p-2 shadow-inner
        ${
          readonly
            ? 'border-0 bg-transparent !border-none'
            : 'bg-zinc-900 border border-zinc-800 focus-within:border-zinc-600'
        }
      `}
    />
  );
}