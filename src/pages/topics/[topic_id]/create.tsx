'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Asterisk, BookOpenCheck, ImageOff, Save } from 'lucide-react';

import { useAuthStore } from '@/stores';

// ✅ hook 사용
import { useSaveTopic, usePublishTopic } from '@/hooks/useCreateTopic';

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
import { QUERY_KEYS } from '@/constants/querykey.constant';

import { type Topic } from '@/types/topic.type';
import type { Block } from '@blocknote/core';

import { useQuery } from '@tanstack/react-query';
import { fetchTopicById } from '@/services/topic.service';

// ================================================
// 🔥 TopicInsertWithoutAuthor 타입
// ================================================
type TopicInsertWithoutAuthor = Omit<Topic, 'id' | 'created_at' | 'author' | 'views' | 'likes'>;

// ================================================
// 🔥 Component
// ================================================
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

  // ================================================
  // 🔥 useQuery — 수정모드 데이터 로드
  // ================================================
  const { data: topic } = useQuery({
    queryKey: id ? QUERY_KEYS.topics.detail(Number(id)) : ['topic', 'create'],
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
      await saveMutation.mutateAsync({
        id,
        userId: user!.id,
        buildPayload,
        thumbnail,
      });

      toast.success('임시 저장 완료!');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('저장 중 오류가 발생했습니다.');
    }
  }, [title, content, category, thumbnail, id, user, navigate, saveMutation]);

  // ================================================
  // 🔥 발행 버튼 (PUBLISH)
  // ================================================
  const handlePublish = useCallback(async () => {
    if (!title || !content.length || !category || !thumbnail) {
      toast.warning('모든 값을 입력해주세요.');
      return;
    }

    try {
      await publishMutation.mutateAsync({
        id,
        userId: user!.id,
        buildPayload,
        thumbnail,
      });

      toast.success('토픽이 발행되었습니다!');

      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('발행 중 오류가 발생했습니다.');
    }
  }, [title, content, category, thumbnail, id, user, navigate, publishMutation]);

  // ================================================
  // 🔥 렌더링
  // ================================================
  return (
    <main className="w-full flex flex-col lg:flex-row gap-8 pt-16">
      {/* Floating 버튼 */}
      <div className="fixed right-1/2 bottom-10 translate-x-1/2 z-20 flex items-center gap-2">
        <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </Button>

        <Button
          variant="outline"
          className="bg-yellow-800/40! hover:bg-yellow-800/60!"
          onClick={handleSave}
        >
          <Save className="mr-1" /> 저장
        </Button>

        <Button
          variant="outline"
          className="bg-emerald-800/40! hover:bg-emerald-800/60!"
          onClick={handlePublish}
        >
          <BookOpenCheck className="mr-1" /> 발행
        </Button>
      </div>

      {/* LEFT */}
      <section className="flex-1 flex flex-col gap-8">
        <div className="pb-6 border-b space-y-1">
          <span className="text-sm text-orange-500 font-semibold">Step 01</span>
          <h2 className="text-lg font-semibold">토픽 작성하기</h2>
        </div>

        {/* 제목 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Asterisk size={14} className="text-destructive" />
            <Label className="text-muted-foreground">제목</Label>
          </div>

          <Input
            placeholder="토픽 제목을 입력하세요."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-14 text-lg bg-muted border border-border rounded-lg"
          />
        </div>

        {/* 본문 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Asterisk size={14} className="text-destructive" />
            <Label className="text-muted-foreground">본문</Label>
          </div>

          <AppEditor value={content} onChange={setContent} />
        </div>
      </section>

      {/* RIGHT */}
      <aside className="w-full lg:w-[320px] flex flex-col gap-8">
        <div className="pb-6 border-b space-y-1">
          <span className="text-sm text-orange-500 font-semibold">Step 02</span>
          <h2 className="text-lg font-semibold">설정</h2>
        </div>

        {/* 카테고리 */}
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Asterisk size={14} className="text-destructive" />
            <Label className="text-muted-foreground">카테고리</Label>
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full bg-muted border border-border rounded-lg">
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
        <div className="space-y-2">
          <div className="flex items-center gap-1">
            <Asterisk size={14} className="text-destructive" />
            <Label className="text-muted-foreground">썸네일</Label>
          </div>

          <AppFileUpload file={thumbnail} onChange={setThumbnail} />

          <Button
            variant="outline"
            className="w-full justify-center"
            onClick={() => setThumbnail(null)}
          >
            <ImageOff className="mr-2" /> 썸네일 제거
          </Button>
        </div>
      </aside>
    </main>
  );
}
