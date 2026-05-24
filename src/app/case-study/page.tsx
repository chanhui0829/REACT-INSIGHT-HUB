/**
 * @file page.tsx
 * @description 케이스 스터디 페이지입니다.
 */

'use client';

import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { useMemo } from 'react';
import {
  ShieldAlert,
  Zap,
  CheckCircle2,
  Code2,
  Database,
  Boxes,
  MousePointer2,
  Wind,
  Image as ImageIcon,
} from 'lucide-react';

const STAGGER: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const ITEM_UP: Variants = {
  hidden: { opacity: 0, y: 40 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-sm font-black text-indigo-400 tracking-[0.4em] uppercase mb-12 flex items-center gap-4">
    <div className="w-12 h-px bg-indigo-400" />
    {children}
  </h2>
);

export default function CaseStudyPage() {
  const techStack = useMemo(
    () => [
      { icon: <Code2 size={24} />, name: 'Next.js 15+' },
      { icon: <Boxes size={24} />, name: 'TanStack Query' },
      { icon: <Database size={24} />, name: 'Supabase' },
      { icon: <Boxes size={24} />, name: 'Zustand' },
      { icon: <Wind size={24} />, name: 'Tailwind CSS' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 pb-60 selection:bg-indigo-500/30">
      <main className="mx-auto max-w-[1400px] px-8 pt-40">
        {/* 1. PROJECT HERO */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-52">
          <div className="flex flex-col gap-16">
            <div>
              <h1 className="text-[13vw] md:text-[140px] font-black text-white leading-[0.8] tracking-[-0.05em] italic">
                INSIGHT <br /> <span className="text-indigo-400">HUB.</span>
              </h1>
              <p className="mt-12 text-3xl text-zinc-400 font-bold max-w-3xl leading-relaxed">
                토픽 기반의 인사이트를 공유하는 미니 블로그 플랫폼 <br />
                <span className="text-zinc-100">사용자 경험과 데이터 관리 중심의 설계 사례</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              {techStack.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900/50 border border-white/10"
                >
                  <div className="text-indigo-400">{tech.icon}</div>
                  <span className="text-white font-black text-sm uppercase tracking-wider">
                    {tech.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        <motion.div
          variants={STAGGER}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="space-y-48"
        >
          {/* 2. CHALLENGE */}
          <motion.section variants={ITEM_UP}>
            <SectionTitle>Challenge & Architecture</SectionTitle>
            <div className="group relative p-20 rounded-[4rem] bg-slate-900/20 border border-white/5 overflow-hidden">
              <div className="grid md:grid-cols-2 gap-20 relative z-10">
                <div className="space-y-10">
                  <div className="flex items-center gap-3 text-rose-500">
                    <ShieldAlert size={28} />
                    <span className="font-black tracking-[0.2em] uppercase text-xs">
                      Technical Obstacle
                    </span>
                  </div>
                  <h3 className="text-6xl font-black text-white tracking-tighter leading-tight">
                    기록의 흐름을 <br /> 자연스럽게 유지하기.
                  </h3>
                  <p className="text-2xl font-medium text-zinc-400 leading-relaxed">
                    사용자가 글을 쓰거나 좋아요를 누를 때, 서버 응답을 기다리느라 화면이 멈추는
                    느낌이 들지 않도록 <strong>사용자 중심의 반응성</strong>을 확보하는 데
                    집중했습니다.
                  </p>
                </div>
                <div className="flex flex-col justify-center space-y-4">
                  <div className="flex items-center gap-3 text-indigo-400 mb-8">
                    <MousePointer2 size={20} className="animate-bounce" />
                    <span className="font-black text-xs uppercase tracking-[0.2em]">Solution</span>
                  </div>
                  {[
                    {
                      title: '반응형 UI 설계',
                      desc: '상태 변화 시 즉각적으로 피드백을 보여주는 낙관적 업데이트 적용',
                    },
                    {
                      title: '컴포넌트 분리',
                      desc: '기능 단위로 컴포넌트를 설계하여 유지보수 용이성 확보',
                    },
                    {
                      title: '데이터 관리',
                      desc: '복잡한 비동기 상태를 TanStack Query로 체계적으로 관리',
                    },
                  ].map((sol) => (
                    <div
                      key={sol.title}
                      className="flex items-start gap-6 p-4 rounded-3xl bg-black/40 border border-white/5"
                    >
                      <CheckCircle2 size={24} className="text-indigo-400 shrink-0 mt-1" />
                      <div>
                        <div className="text-xl text-white font-bold mb-1">{sol.title}</div>
                        <div className="text-lg text-zinc-400">{sol.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          {/* 3. TROUBLE SHOOTING */}
          <motion.section variants={ITEM_UP}>
            <SectionTitle>Deep Troubleshooting</SectionTitle>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="p-12 rounded-[3rem] bg-zinc-900/30 border border-white/5 space-y-8">
                <div className="w-20 h-20 bg-purple-600/20 rounded-[2rem] flex items-center justify-center text-purple-400">
                  <Zap size={32} />
                </div>
                <h4 className="text-3xl font-black text-white">데이터 동기화 이슈</h4>
                <p className="text-xl text-zinc-400 leading-relaxed">
                  좋아요 버튼 클릭 시 서버 통신 간에 UI가 초기화되는 현상을 발견했습니다. 낙관적
                  업데이트 로직에서 이전 상태를 안전하게 보존하고, 통신 완료 후 자연스럽게 데이터를
                  갱신하도록 처리했습니다.
                </p>
              </div>
              <div className="p-12 rounded-[3rem] bg-zinc-900/30 border border-white/5 space-y-8">
                <div className="w-20 h-20 bg-blue-600/20 rounded-[2rem] flex items-center justify-center text-blue-400">
                  <ImageIcon size={32} />
                </div>
                <h4 className="text-3xl font-black text-white">이미지 최적화 경험</h4>
                <p className="text-xl text-zinc-400 leading-relaxed">
                  다양한 썸네일 이미지가 로드될 때 페이지 성능이 저하되는 것을 막기 위해 Next.js의
                  Image 컴포넌트를 활용했습니다. 레이아웃 시프트(CLS)를 방지하고 최적화된 포맷으로
                  전달하는 과정을 경험했습니다.
                </p>
              </div>
            </div>
          </motion.section>

          {/* 4. PERFORMANCE & GROWTH */}
          <motion.section variants={ITEM_UP}>
            <SectionTitle>Performance & Growth</SectionTitle>
            <div className="grid md:grid-cols-2 gap-10">
              <div className="p-16 rounded-[4rem] bg-indigo-500 text-black">
                <h3 className="text-5xl font-black mb-10 tracking-tighter italic leading-none">
                  사용자 경험(UX) <br /> 개선에 집중
                </h3>
                <p className="text-2xl font-bold opacity-90 leading-relaxed">
                  기술 자체보다, 어떻게 하면 사용자가 더 편안하게 자신의 인사이트를 기록할 수
                  있을지에 집중했습니다. 닉네임 설정이나 임시 저장 기능처럼,{' '}
                  <strong>사용자의 고민을 덜어주는 인터페이스</strong>를 만드는 과정이 즐거웠습니다.
                </p>
              </div>
              <div className="p-16 rounded-[4rem] bg-zinc-900 border border-white/5 flex flex-col justify-center">
                <h3 className="text-4xl font-black text-white mb-10 tracking-tighter italic">
                  성장한 점
                </h3>
                <ul className="space-y-6 text-zinc-300 font-bold text-xl">
                  <li className="flex items-center gap-3">
                    <span>•</span> 사용자 중심의 UI/UX 설계를 통한 편의성 개선
                  </li>
                  <li className="flex items-center gap-3">
                    <span>•</span> 비동기 데이터 처리를 통한 부드러운 앱 경험 구현
                  </li>
                  <li className="flex items-center gap-3">
                    <span>•</span> 컴포넌트 재사용성을 고려한 코드 구조 설계 경험
                  </li>
                </ul>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}
