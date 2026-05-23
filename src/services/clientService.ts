/**
 * @file clientService.ts
 * @description 브라우저(클라이언트) 환경에서만 실행되어야 하는 유틸리티 서비스입니다.
 */

import { createClientComponentClient } from '@/lib/supabase';
import { nanoid } from 'nanoid';

// 썸네일 업로드 — 클라이언트에서 직접 호출
export const uploadThumbnail = async (file: File | string | null) => {
  if (!file) return null;
  const client = createClientComponentClient();

  if (file instanceof File) {
    const ext = file.name.split('.').pop();
    const fileName = `${nanoid()}.${ext}`;
    const filePath = `topics/${fileName}`;

    const { error } = await client.storage.from('files').upload(filePath, file);
    if (error) throw error;

    const { data } = client.storage.from('files').getPublicUrl(filePath);
    return data.publicUrl;
  }

  return typeof file === 'string' ? file : null;
};
