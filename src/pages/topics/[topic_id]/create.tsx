/**
 * @file CreateTopic.tsx
 * @description 스크롤 성능 최적화 및 '임시 저장' 레이어 UI가 적용된 최종본입니다.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Asterisk,
  BookOpenCheck,
  ImageOff,
  Sparkles,
  PenTool,
  Settings2,
  NotebookPen,
} from 'lucide-react';

import { useAuthStore } from '@/stores';
import { useSaveTopic, usePublishTopic } from '@/hooks/useCreateTopic';
import { fetchTopicById } from '@/services/topicService';

import { AppEditor, AppFileUpload } from '@/components/common';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from '@/components/ui';
import { TOPIC_CATEGORY } from '@/constants/category.constant';
import { QUERY_KEYS } from '@/constants/querykey.constant';

import { type Topic } from '@/types/topic.type';
import type { Block } from '@blocknote/core';

type TopicInsertWithoutAuthor = Omit<Topic, 'id' | 'created_at' | 'author' | 'views' | 'likes'>;

const parseEditorContent = (raw: string | null | undefined): Block[] => {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Block[]) : [];
  } catch {
    return [];
  }
};

export default function CreateTopic() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { id } = useParams();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState<Block[]>([]);
  const [category, setCategory] = useState('');
  const [thumbnail, setThumbnail] = useState<File | string | null>(null);

  const saveMutation = useSaveTopic();
  const publishMutation = usePublishTopic();

  const { data: topic } = useQuery({
    queryKey: id ? QUERY_KEYS.topics.detail(Number(id)) : ['topic', 'create'],
    queryFn: () => fetchTopicById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (!topic) return;
    setTitle(topic.title || '');
    setContent(parseEditorContent(topic.content));
    setCategory(topic.category || '');
    setThumbnail(topic.thumbnail || null);
  }, [topic]);

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

  const memoizedEditor = useMemo(
    () => (
      <div className="min-h-[500px] rounded-2xl border border-zinc-800 bg-zinc-950/30 overflow-hidden transform-gpu will-change-transform">
        <AppEditor value={content} onChange={setContent} />
      </div>
    ),
    [content]
  );

  const requireAuth = useCallback(() => {
    if (user) return user.id;
    toast.warning('로그인 후 작성/저장이 가능합니다.');
    navigate('/sign-in');
    return null;
  }, [user, navigate]);

  const handleSave = useCallback(async () => {
    if (!title && !content.length && !category && !thumbnail) {
      toast.warning('최소 하나 이상의 값을 입력해주세요.');
      return;
    }

    const userId = requireAuth();
    if (!userId) return;

    try {
      // 1. 결과값 뒤에 'as { id: number | string }'을 붙여서 강제로 타입을 지정합니다.
      const savedTopic = (await saveMutation.mutateAsync({
        id,
        userId,
        buildPayload,
        thumbnail,
      })) as { id: number | string };

      toast.success('임시 저장이 완료되었습니다.');

      if (!id) {
        const newId =
          savedTopic?.id || (Array.isArray(savedTopic) ? savedTopic[0]?.id : savedTopic);
        if (newId) {
          navigate(`/topics/create/${newId}`, { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('저장 중 오류가 발생했습니다.');
    }
  }, [title, content, category, thumbnail, id, buildPayload, saveMutation, navigate, requireAuth]);
  const handlePublish = useCallback(async () => {
    if (!title || !content.length || !category || !thumbnail) {
      toast.warning('필수 항목을 모두 입력해주세요.');
      return;
    }

    const userId = requireAuth();
    if (!userId) return;

    try {
      await publishMutation.mutateAsync({ id, userId, buildPayload, thumbnail });
      toast.success('토픽이 발행되었습니다!');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('발행 중 오류가 발생했습니다.');
    }
  }, [title, content, category, thumbnail, id, navigate, publishMutation, buildPayload, requireAuth]);

  return (
    <main className="relative w-full max-w-7xl mx-auto pt-24 pb-32 px-6">
      {/* 🚀 Sticky Action Bar: 성능 최적화를 위해 blur를 제거하고 불투명도 조정 */}
      <div className="fixed left-1/2 bottom-10 -translate-x-1/2 z-50 transform-gpu will-change-transform ">
        <div className="flex items-center gap-3 p-2 rounded-full bg-zinc-900 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full w-11 h-11 hover:bg-white/5 text-zinc-400"
          >
            <ArrowLeft size={20} />
          </Button>

          <div className="w-px h-4 bg-zinc-800 " />
          {/* 📍 임시 저장 섹션  */}
          <div className="relative flex items-center justify-center ">
            {/* 임시 저장 버튼: 외곽선과 배경을 명확히 주어 배지 위에 얹혀진 느낌 구현 */}
            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={saveMutation.isPending || !user}
              className="
                relative z-10 
                rounded-full h-11 px-5 
                bg-zinc-900 
                border-2 border-zinc-800 
                hover:border-zinc-700 hover:bg-zinc-800
                text-zinc-300 hover:text-white 
                shadow-xl transition-all active:scale-95
                flex gap-2 items-center
              "
            >
              <NotebookPen className="w-4 h-4" />
              <span>임시 저장</span>
            </Button>
          </div>

          <Button
            onClick={handlePublish}
            disabled={publishMutation.isPending || !user}
            className="rounded-full h-10 px-8 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 flex gap-2 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <BookOpenCheck size={18} />
            토픽 발행
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 items-start">
        {/* Step 01. 본문 작성 */}
        <section className="flex-1 w-full flex flex-col gap-10">
          <header className="space-y-3 px-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black tracking-widest uppercase">
              <PenTool size={12} /> Step 01. Content Creation
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
              어떤 지식을 공유할까요? <Sparkles size={24} className="text-emerald-400" />
            </h2>
          </header>

          <div className="flex flex-col gap-8 p-8 rounded-4xl bg-zinc-900/40 border border-white/5 shadow-inner overflow-hidden">
            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-1">
                <Asterisk size={14} className="text-emerald-500" />
                <Label className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  Title
                </Label>
              </div>
              <Input
                placeholder=" 제목을 입력하세요."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-16 text-xl font-bold bg-zinc-950/50 border-zinc-800 rounded-2xl focus:border-emerald-500/50 transition-all"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-1">
                <Asterisk size={14} className="text-emerald-500" />
                <Label className="text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                  Content Body
                </Label>
              </div>
              {memoizedEditor}
            </div>
          </div>
        </section>

        {/* Step 02. 배포 설정 */}
        <aside className="w-full lg:w-[360px] flex flex-col gap-10 lg:sticky lg:top-24">
          <header className="space-y-3 px-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[11px] font-black tracking-widest uppercase">
              <Settings2 size={12} /> Step 02. Configuration
            </div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-200">배포 설정</h2>
          </header>

          <div className="flex flex-col gap-8 p-7 rounded-4xl bg-zinc-900/60 border border-white/5 shadow-xl">
            <div className="space-y-3">
              <div className="flex items-center gap-2 ml-1">
                <Asterisk size={14} className="text-sky-500" />
                <Label className="text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                  Category
                </Label>
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 bg-zinc-950/50 border-zinc-800 rounded-xl focus:ring-sky-500/20 transition-all text-zinc-300">
                  <SelectValue placeholder="주제를 선택하세요" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-950 border-zinc-800 text-zinc-300">
                  <SelectGroup>
                    {TOPIC_CATEGORY.map((item) => (
                      <SelectItem key={item.id} value={item.category} className="cursor-pointer">
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <Separator className="bg-zinc-800" />

            <div className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <Asterisk size={14} className="text-sky-500" />
                <Label className="text-zinc-500 font-bold uppercase tracking-wider text-[11px]">
                  Thumbnail Image
                </Label>
              </div>
              <div className="group relative overflow-hidden rounded-2xl border border-dashed border-zinc-800 bg-zinc-950/30 hover:border-sky-500/40 transition-all">
                <AppFileUpload file={thumbnail} onChange={setThumbnail} />
              </div>
              <Button
                variant="ghost"
                className="w-full h-10 rounded-xl text-xs text-zinc-500 hover:text-red-400 hover:bg-red-400/5 transition-all"
                onClick={() => setThumbnail(null)}
              >
                <ImageOff size={14} className="mr-2" /> 썸네일 이미지 제거
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
