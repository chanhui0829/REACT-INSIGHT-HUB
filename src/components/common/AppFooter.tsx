/**
 * @file AppFooter.tsx

 * 시각적 위계와 브랜드 아이덴티티 강조를 위해 비대칭 레이아웃을 적용했습니다.
 */

import { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { Github, Youtube, Mail, ExternalLink } from 'lucide-react';
import { Button } from '../ui';

// —————————————————————————————————————————————————————————————————————————————
// ✨ Constants & Data Structures
// —————————————————————————————————————————————————————————————————————————————

/**
 * 푸터 링크 그룹 데이터
 * 포트폴리오의 전문성을 위해 구체적인 서비스 메뉴로 구성했습니다.
 */
const FOOTER_NAV_DATA = [
  {
    title: 'Platform',
    links: [
      { label: 'Explorer', to: '/' },
      { label: 'Case Study', to: '/case-study' },
      { label: 'Tech Stack', to: '/' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'FAQ', to: '/' },
      { label: 'Guidelines', to: '/' },
      { label: 'Contributions', to: '/' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/' },
      { label: 'Terms of Service', to: '/' },
    ],
  },
];

// —————————————————————————————————————————————————————————————————————————————
// 🧩 Main Component
// —————————————————————————————————————————————————————————————————————————————

export function AppFooter() {
  /**
   * 중복 렌더링 방지를 위해 메모이제이션 적용
   */
  const navSections = useMemo(() => FOOTER_NAV_DATA, []);

  return (
    <footer className="relative bg-zinc-950 border-t border-white/5 pt-12 pb-10  overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 mb-12">
          {/* 1️⃣ Brand Section: 큼직한 로고와 슬로건 */}
          <section className="lg:col-span-5 space-y-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl font-black text-white tracking-tighter uppercase italic">
                Insight Hub
              </span>
            </div>
            <p className="max-w-sm text-lg font-medium text-zinc-500 leading-snug">
              흩어진 지식의 조각을 모아 <br />
              <span className="text-zinc-200">단단한 통찰로 연결하는</span> 기술 공유 아카이브.
            </p>

            {/* Social & Contact */}
            <div className="flex items-center gap-3 pt-4">
              <NavLink to="https://github.com/chanhui0829/REACT-CHANWEB" target="_blank">
                <Button
                  variant="outline"
                  size="icon"
                  className="w-12 h-12 rounded-2xl bg-zinc-900 border-white/5 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all"
                >
                  <Github size={20} className="text-zinc-400 group-hover:text-emerald-400" />
                </Button>
              </NavLink>
              <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-2xl bg-zinc-900 border-white/5 hover:border-emerald-500/50 transition-all"
              >
                <Youtube size={20} className="text-zinc-400" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="w-12 h-12 rounded-2xl bg-zinc-900 border-white/5 hover:border-emerald-500/50 transition-all"
              >
                <Mail size={20} className="text-zinc-400" />
              </Button>
            </div>
          </section>

          {/* 2️⃣ Navigation Grid: map을 활용한 효율적 렌더링 */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-12">
            {navSections.map((section) => (
              <nav key={section.title} className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-500/80">
                  {section.title}
                </h4>
                <ul className="space-y-4">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <NavLink
                        to={link.to}
                        className="group flex items-center gap-2 text-[15px] font-bold text-zinc-500 hover:text-white transition-colors"
                      >
                        {link.label}
                        <ExternalLink
                          size={12}
                          className="opacity-0 group-hover:opacity-100 -translate-y-1 transition-all"
                        />
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* 3️⃣ Bottom Copyright: 마무리는 깔끔하게 */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-6 text-xs font-black uppercase tracking-widest text-zinc-600">
          <p>© 2026 Insight Hub. Build by chanhui.</p>
          <div className="flex gap-8">
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">
              Front-end Arch
            </span>
            <span className="hover:text-zinc-400 cursor-pointer transition-colors">
              UX Optimized
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
