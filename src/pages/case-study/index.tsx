/*
 * @file CaseStudyPage.tsx
 * @description Insight Hub 프로젝트 케이스 스터디.
 */

import { useMemo } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  ShieldAlert,
  Zap,
  Cpu,
  CheckCircle2,
  Code2,
  Database,
  Boxes,
  MousePointer2,
  Wind,
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
  <h2 className="text-xs font-black text-emerald-500 tracking-[0.4em] uppercase mb-12 flex items-center gap-3">
    <div className="w-8 h-px bg-emerald-500" />
    {children}
  </h2>
);

export default function CaseStudyPage() {
  // 기술 스택 (한 줄 배치를 위해 최적화)
  const techStack = useMemo(
    () => [
      { icon: <Code2 size={20} />, name: 'React' },
      { icon: <Boxes size={20} />, name: 'Zustand' },
      { icon: <Database size={20} />, name: 'Supabase' },
      { icon: <Boxes size={20} />, name: 'React Query' },
      { icon: <Wind size={20} />, name: 'Tailwind' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-400 pb-60 selection:bg-emerald-500/30">
      <main className="mx-auto max-w-[1400px] px-8 pt-40">
        {/* 🟢 1. PROJECT HERO & TECH STACK (일자 배치) */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-52">
          <div className="flex flex-col gap-16">
            <div>
              <h1 className="text-[13vw] md:text-[140px] font-black text-white leading-[0.8] tracking-[-0.05em] italic">
                INSIGHT <br /> <span className="text-emerald-500">HUB.</span>
              </h1>
              <p className="mt-10 text-2xl text-zinc-500 font-bold max-w-2xl">
                지식의 파편을 연결하는 아카이브 <br />
                <span className="text-zinc-300">Architecture & Performance Case Study</span>
              </p>
            </div>

            {/* 기술 스택 5종 일자 배치 로우 */}
            <div className="flex flex-wrap gap-3">
              {techStack.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-center gap-3 px-5 py-3 rounded-xl bg-zinc-900/50 border border-white/5 group hover:border-emerald-500/40 transition-all duration-300"
                >
                  <div className="text-emerald-500 group-hover:scale-110 transition-transform">
                    {tech.icon}
                  </div>
                  <span className="text-white font-black text-xs uppercase tracking-wider">
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
          className="space-y-44"
        >
          {/* 🔴 2. MAIN CHALLENGE & SOLUTION (초록색 호버 효과) */}
          <motion.section variants={ITEM_UP}>
            <SectionTitle>Main Challenge & Solution</SectionTitle>
            <div className="group relative p-14 rounded-[4rem] bg-zinc-900/20 border border-white/5 overflow-hidden transition-all duration-700 hover:border-emerald-500/50 hover:bg-emerald-500/1">
              <div className="grid md:grid-cols-2 gap-20 relative z-10">
                <div className="space-y-8">
                  <div className="flex items-center gap-3 text-rose-500">
                    <ShieldAlert size={24} />
                    <span className="font-black tracking-[0.2em] uppercase text-[10px]">
                      Critical Problem
                    </span>
                  </div>
                  <h3 className="text-5xl font-black text-white tracking-tighter leading-tight">
                    강하게 결합된 <br />
                    로직의 파편화.
                  </h3>
                  <p className="text-xl font-medium text-zinc-500 leading-relaxed">
                    데이터 요청 로직이 UI 컴포넌트와 뒤섞여 유지보수가 불가능한 상태였습니다. 코드의{' '}
                    <span className="text-zinc-200">순수성</span>을 되찾기 위한 구조적 개선을
                    단행했습니다.
                  </p>
                </div>
                <div className="flex flex-col justify-center space-y-5">
                  <div className="flex items-center gap-3 text-emerald-500 mb-2">
                    <MousePointer2 size={18} className="animate-bounce" />
                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">
                      Resolution
                    </span>
                  </div>
                  {[
                    'Service Layer를 통한 API 추상화',
                    'Custom Hooks 기반 비즈니스 로직 분리',
                    '상태 관리 도구의 선언적 활용',
                  ].map((sol) => (
                    <div
                      key={sol}
                      className="flex items-center gap-4 p-5 rounded-4xl bg-black/40 border border-white/5 group-hover:border-emerald-500/20 transition-all"
                    >
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      <span className="text-zinc-300 font-bold text-base">{sol}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-0 bg-linear-to-tr from-emerald-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
            </div>
          </motion.section>

          {/* 🟣 3. TROUBLE SHOOTING (번개 아이콘 옆 표기) */}
          <motion.section variants={ITEM_UP}>
            <SectionTitle>Deep Troubleshooting</SectionTitle>
            <div className="p-16 rounded-[5rem] bg-zinc-900/30 border border-white/5">
              <div className="flex flex-col md:flex-row items-center gap-8 mb-16">
                <div className="w-20 h-20 bg-violet-600/20 rounded-4xl flex items-center justify-center text-violet-400">
                  <Zap size={36} fill="currentColor" />
                </div>
                <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                  Trouble Shooting
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-16 items-start">
                <div className="space-y-6">
                  <h4 className="text-2xl font-black text-zinc-200">
                    낙관적 업데이트를 통한 UX 임계점 돌파
                  </h4>
                  <p className="text-lg text-zinc-500 leading-relaxed font-medium">
                    네트워크 응답 대기 시간을 기술적으로 제거하여 사용자에게 네이티브 앱과 같은
                    즉각적인 경험을 제공하는 데 주력했습니다.
                  </p>
                </div>
                <div className="p-10 rounded-[3rem] bg-violet-600/3 border border-violet-500/10">
                  <p className="text-[10px] font-black text-violet-400 uppercase tracking-[0.3em] mb-6">
                    Technical Fix
                  </p>
                  <p className="text-zinc-300 font-bold leading-relaxed italic">
                    "Race Condition 방지를 위한 쿼리 취소 로직과 에러 롤백 시스템을 구축하여 데이터
                    무결성을 유지하며 0ms의 피드백 속도를 구현했습니다."
                  </p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* 🔵 4. TECH DECISIONS (Zustand & Tailwind 의사결정) */}
          <motion.section variants={ITEM_UP}>
            <SectionTitle>Technical Decisions</SectionTitle>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Zustand',
                  detail:
                    'Flux 패턴을 단순화하여 보일러플레이트를 줄이고, 스토어 접근성을 높여 개발 속도를 2배 이상 단축했습니다.',
                  icon: <Boxes />,
                },
                {
                  title: 'Tailwind CSS',
                  detail:
                    '디자인 시스템의 파편화를 방지하고, CSS 파일 크기 최소화 및 일관된 UI 구현을 위해 채택했습니다.',
                  icon: <Wind />,
                },
                {
                  title: 'React Query',
                  detail:
                    '비동기 상태의 복잡성을 선언적으로 관리하여 서버 데이터 동기화 로직의 신뢰성을 확보했습니다.',
                  icon: <Cpu />,
                },
              ].map((tech) => (
                <div
                  key={tech.title}
                  className="p-12 rounded-[3.5rem] bg-zinc-900 border border-white/5 hover:border-zinc-700 transition-all group"
                >
                  <div className="text-emerald-500 mb-10 group-hover:scale-110 transition-transform origin-left">
                    {tech.icon}
                  </div>
                  <h4 className="text-white font-black text-xl mb-4 tracking-tight italic underline decoration-emerald-500/30 decoration-2 underline-offset-8">
                    {tech.title}
                  </h4>
                  <p className="text-zinc-500 font-bold leading-relaxed text-sm">{tech.detail}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* 🏁 5. LEARNING & GROWTH */}
          <motion.section variants={ITEM_UP}>
            <SectionTitle>Learning & Growth</SectionTitle>
            <div className="grid md:grid-cols-12 gap-8">
              <div className="md:col-span-7 p-14 rounded-[4rem] bg-emerald-500 text-black">
                <h3 className="text-4xl font-black mb-8 tracking-tighter italic leading-none">
                  Engineering <br /> Mindset
                </h3>
                <p className="text-xl font-bold leading-relaxed opacity-90">
                  단순 구현보다 "왜?"라는 질문에 집중하며 아키텍처를 설계하는 법을 배웠습니다.
                  유지보수 가능한 코드가 팀에 기여하는 가치를 몸소 체험했습니다.
                </p>
              </div>
              <div className="md:col-span-5 p-14 rounded-[4rem] bg-zinc-900 border border-white/5 flex flex-col justify-end">
                <h3 className="text-2xl font-black text-white mb-6 tracking-tighter italic">
                  UX Reflection
                </h3>
                <p className="text-lg font-bold leading-relaxed text-zinc-500">
                  기술은 결국 사람을 향해야 함을 느꼈습니다. 성능 최적화가 유저의 신뢰로 이어지는
                  과정을 직접 목격했습니다.
                </p>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </main>
    </div>
  );
}
