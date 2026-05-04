import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { DragEvent as ReactDragEvent } from 'react';
import { Button, Input } from '../ui';
import { Image, Trash2 } from 'lucide-react';

interface Props {
  file: File | string | null;
  onChange: (file: File | string | null) => void;
}

export function AppFileUpload({ file, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // File 객체일 경우 preview URL 미리 계산
  const previewUrl = useMemo(() => {
    if (file instanceof File) {
      return URL.createObjectURL(file);
    }
    return typeof file === 'string' ? file : null;
  }, [file]);

  // Blob URL 누수 방지
  useEffect(() => {
    if (file instanceof File) {
      return () => {
        URL.revokeObjectURL(previewUrl!);
      };
    }
  }, [file, previewUrl]);

  // 이벤트 핸들러
  const handleChangeFile = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.files?.[0] ?? null);
      event.target.value = '';
    },
    [onChange]
  );

  const handleDrop = useCallback(
    (e: ReactDragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) onChange(droppedFile);
    },
    [onChange]
  );

  const handleDragOver = useCallback((e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  // Preview 영역
  const preview = useMemo(() => {
    // 이미지가 존재하는 경우
    if (previewUrl) {
      return (
        <div className="relative group">
          <img
            src={previewUrl}
            alt="@THUMBNAIL"
            className="w-full aspect-video rounded-lg object-cover border border-zinc-700"
          />

          <Button
            variant="destructive"
            size="icon"
            onClick={handleRemove}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      );
    }

    // 기본 상태
    return (
      <div
        className={`w-full flex flex-col items-center justify-center aspect-video rounded-lg border-2 border-dashed 
          ${isDragOver ? 'border-emerald-400 bg-emerald-950/20' : 'border-zinc-700 bg-zinc-900'} 
          transition-colors duration-300 cursor-pointer`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Image className={`w-8 h-8 mb-2 ${isDragOver ? 'text-emerald-400' : 'text-zinc-400'}`} />
        <p className={`text-sm ${isDragOver ? 'text-emerald-300' : 'text-zinc-500'}`}>
          {isDragOver ? '여기에 파일을 놓으세요' : '이미지를 클릭하거나 드래그하여 업로드'}
        </p>
      </div>
    );
  }, [previewUrl, isDragOver, handleDrop, handleDragOver, handleDragLeave, handleRemove]);

  // UI
  return (
    <div className="space-y-3">
      {preview}

      <Input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleChangeFile}
        className="hidden"
      />
    </div>
  );
}
