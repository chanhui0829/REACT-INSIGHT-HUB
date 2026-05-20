/**
 * @file topic.type.ts
 * @description 토픽(블로그 포스트) 관련 타입 정의 파일입니다.
 */

export enum TOPIC_STATUS {
  TEMP = 'temp',
  PUBLISH = 'publish',
}

export interface Topic {
  id: number;
  title: string;
  content: string;
  category: string;
  thumbnail: string | null;
  author: string;
  views: number;
  likes: number;
  status: TOPIC_STATUS;
  created_at: string;
  updated_at?: string;
}

export interface TopicInsertWithoutAuthor
  extends Omit<Topic, 'id' | 'created_at' | 'updated_at' | 'author' | 'views' | 'likes'> {}