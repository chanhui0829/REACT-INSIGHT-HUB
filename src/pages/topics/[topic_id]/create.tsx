'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { ArrowLeft, Asterisk, BookOpenCheck, ImageOff, Save } from 'lucide-react';

import supabase from '@/lib/supabase';
import { useAuthStore } from '@/stores';

import { AppEditor, AppFileUpload } from '@/components/common';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

import { TOPIC_CATEGORY } from '@/constants/category.constant';
import { TOPIC_STATUS, type Topic } from '@/types/topic.type';
import type { Block } from '@blocknote/core';

import { useQuery, useQueryClient } from '@tanstack/react-query';

// ================================================
// 🔥 TopicInsertWithoutAuthor 타입
// ================================================
type TopicInsertWithoutAuthor = Omit<Topic, 'id' | 'created_at' | 'author' | 'views' | 'likes'>;

// ================================================
// 🔥 Supabase : fetch
// ================================================
async function fetchTopicById(id?: string): Promise<Topic | null> {
  if (!id) return null;

  const { data, error } = await supabase.from('topic').select('*').eq('id', id).single();

  if (error) throw error;
  return data as Topic;
}

// ================================================
// 🔥 Supabase : INSERT (id 반환)
// ================================================
async function insertTopic(userId: string, payload: TopicInsertWithoutAuthor) {
  const { data, error } = await supabase
    .from('topic')
    .insert([{ ...payload, author: userId }])
    .select('id')
    .single();

  if (error) throw error;
  return data.id as number;
}

// ================================================
// 🔥 Supabase : UPDATE
// ================================================
async function updateTopic(id: string, payload: TopicInsertWithoutAuthor) {
  const { error } = await supabase.from('topic').update(payload).eq('id', id);
  if (error) throw error;
}

// ================================================
// 🔥 Component
// ================================================
export default function CreateTopic() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Block[]>([]);
  const [category, setCategory] = useState('');
  const [thumbnail, setThumbnail] = useState<File | string | null>(null);

  // ================================================
  // 🔥 useQuery — 수정모드 데이터 로드
  // ================================================
  const { data: topic } = useQuery({
    queryKey: ['topic', id],
    queryFn: () => fetchTopicById(id),
    enabled: !!id,
  });

  // ================================================
  // 🔥 topic 데이터 초기 세팅 (1회만)
  // ================================================
  useEffect(() => {
    if (!topic) return;

    setTitle(topic.title || '');
    setContent(topic.content ? JSON.parse(topic.content) : []);
    setCategory(topic.category || '');
    setThumbnail(topic.thumbnail || null);
  }, [topic]);

  // ================================================
  // 🔥 썸네일 업로드 (useCallback 메모이징)
  // ================================================
  const uploadThumbnail = useCallback(async () => {
    if (!thumbnail) return null;

    if (thumbnail instanceof File) {
      const ext = thumbnail.name.split('.').pop();
      const fileName = `${nanoid()}.${ext}`;
      const filePath = `topics/${fileName}`;

      const { error } = await supabase.storage.from('files').upload(filePath, thumbnail);

      if (error) throw error;

      const { data } = supabase.storage.from('files').getPublicUrl(filePath);
      return data.publicUrl;
    }

    return typeof thumbnail === 'string' ? thumbnail : null;
  }, [thumbnail]);

  // ================================================
  // 🔥 payload 생성 함수 (중복 제거)
  // ================================================
  const buildPayload = useCallback(
    (status: TopicInsertWithoutAuthor['status'], thumbnailUrl: string | null) => ({
      title,
      content: JSON.stringify(content),
      category,
      thumbnail: thumbnailUrl,
      status,
    }),
    [title, content, category]
  );

  // ================================================
  // 🔥 저장 버튼 (TEMP)
  // ================================================
  const handleSave = useCallback(async () => {
    if (!title && !content.length && !category && !thumbnail) {
      toast.warning('최소 하나 이상의 값을 입력해주세요.');
      return;
    }

    try {
      const thumbnailUrl = await uploadThumbnail();
      const payload = buildPayload(TOPIC_STATUS.TEMP, thumbnailUrl);

      if (!id) {
        await insertTopic(user!.id, payload);
        toast.success('임시 저장 완료!');
        navigate('/');
      } else {
        await updateTopic(id, payload);
        toast.success('임시 저장 완료!');
      }

      // ✅ 임시 저장 목록 쿼리 무효화 (메인 페이지 빨간 점 업데이트용)
      await queryClient.invalidateQueries({ queryKey: ['drafts', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['topics'] });
    } catch (err) {
      console.error(err);
      toast.error('저장 중 오류가 발생했습니다.');
    }
  }, [
    title,
    content,
    category,
    thumbnail,
    uploadThumbnail,
    buildPayload,
    id,
    user,
    navigate,
    queryClient,
  ]);

  // ================================================
  // 🔥 발행 버튼 (PUBLISH)
  // ================================================
  const handlePublish = useCallback(async () => {
    if (!title || !content.length || !category || !thumbnail) {
      toast.warning('모든 값을 입력해주세요.');
      return;
    }

    try {
      const thumbnailUrl = await uploadThumbnail();
      const payload = buildPayload(TOPIC_STATUS.PUBLISH, thumbnailUrl);

      if (!id) {
        await insertTopic(user!.id, payload);
      } else {
        await updateTopic(id, payload);
      }

      toast.success('토픽이 발행되었습니다!');

      // ✅ 발행 시에도 쿼리 무효화
      await queryClient.invalidateQueries({ queryKey: ['drafts', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['topics'] });

      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('발행 중 오류가 발생했습니다.');
    }
  }, [
    title,
    content,
    category,
    thumbnail,
    uploadThumbnail,
    buildPayload,
    id,
    user,
    navigate,
    queryClient,
  ]);

  // ================================================
  // 🔥 렌더링
  // ================================================
  return (
    <main className="w-full min-h-[1024px] flex flex-col lg:flex-row gap-6 p-4 sm:p-6">
      {/* Floating 버튼 */}
      <div className="fixed right-1/2 bottom-10 translate-x-1/2 z-20 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>

        <Button variant="outline" className="w-22 !bg-yellow-800/50" onClick={handleSave}>
          <Save /> 저장
        </Button>

        <Button variant="outline" className="w-22 !bg-emerald-800/50" onClick={handlePublish}>
          <BookOpenCheck /> 발행
        </Button>
      </div>

      {/* Step 01 */}
      <section className="w-full lg:w-3/4 flex flex-col gap-6">
        <div className="flex flex-col pb-6 border-b">
          <span className="text-[#F96859] font-semibold">Step 01</span>
          <span className="text-base font-semibold">토픽 작성하기</span>
        </div>

        {/* 제목 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <Asterisk size={14} className="text-[#F96859]" />
            <Label className="text-muted-foreground">제목</Label>
          </div>

          <Input
            placeholder="토픽 제목을 입력하세요."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-16 pl-6 !text-lg placeholder:text-lg placeholder:font-semibold border-0 !bg-zinc-900"
          />
        </div>

        {/* 본문 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <Asterisk size={14} className="text-[#F96859]" />
            <Label className="text-muted-foreground">본문</Label>
          </div>

          <AppEditor value={content} onChange={setContent} />
        </div>
      </section>

      {/* Step 02 */}
      <section className="w-full lg:w-1/4 flex flex-col gap-6">
        <div className="flex flex-col pb-6 border-b">
          <span className="text-[#F96859] font-semibold">Step 02</span>
          <span className="text-base font-semibold">카테고리 및 썸네일 등록</span>
        </div>

        {/* 카테고리 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <Asterisk size={14} className="text-[#F96859]" />
            <Label className="text-muted-foreground">카테고리</Label>
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full !bg-input/30">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                <SelectLabel>카테고리(주제)</SelectLabel>
                {TOPIC_CATEGORY.map((item) => (
                  <SelectItem key={item.id} value={item.category}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {/* 썸네일 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1">
            <Asterisk size={14} className="text-[#F96859]" />
            <Label className="text-muted-foreground">썸네일</Label>
          </div>

          <AppFileUpload file={thumbnail} onChange={setThumbnail} />

          <Button variant="outline" className="border-0" onClick={() => setThumbnail(null)}>
            <ImageOff /> 썸네일 제거
          </Button>
        </div>
      </section>
    </main>
  );
}
