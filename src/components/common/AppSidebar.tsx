import { CLASS_CATEGORY } from '@/constants/category.constant';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui';
import { useState } from 'react';

interface Props {
  category: string;
  setCategory: (value: string) => void;
}

function AppSidebar({ category, setCategory }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="w-full">
      {/* ✅ [방법] 테일윈드 기본 중단점을 무시하고 스타일 속성으로 강제 제어 
        맥북 13인치는 브라우저 기준 가로가 보통 1200~1400 사이로 잡히므로 
        1440px(맥북 전체화면 수준)까지는 무조건 가로 바가 나오게 합니다.
      */}
      <style>{`
        @media (max-width: 1440px) {
          .mobile-category-bar { display: block !important; }
          .desktop-category-sidebar { display: none !important; }
        }
        @media (min-width: 1441px) {
          .mobile-category-bar { display: none !important; }
          .desktop-category-sidebar { display: flex !important; }
        }
      `}</style>

      {/* ✅ 1. 가로 스크롤 바 (사진 1번) */}
      <div className="mobile-category-bar w-full overflow-x-auto bg-black sticky top-16 z-40 border-b border-zinc-800 py-4 px-4 -mx-6 scrollbar-hide hidden">
        <div className="flex flex-nowrap gap-2 w-max">
          {CLASS_CATEGORY.map((menu) => {
            const isActive = category === menu.category;
            return (
              <Button
                key={menu.id}
                variant="ghost"
                onClick={() => setCategory(menu.category)}
                className={`shrink-0 rounded-full px-5 py-2 whitespace-nowrap transition-all duration-300
                    ${
                      isActive
                        ? 'bg-white text-black font-bold shadow-lg'
                        : 'text-zinc-400 bg-zinc-900/80 hover:text-white'
                    }`}
              >
                {menu.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* ✅ 2. 세로 사이드바 (사진 2번) */}
      <aside className="desktop-category-sidebar flex-col gap-8 sticky top-28 w-full hidden">
        <div
          className="flex items-center justify-between cursor-pointer select-none px-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          <h4 className="text-xl font-bold tracking-tight text-white">카테고리</h4>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-zinc-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-zinc-500" />
          )}
        </div>

        {isOpen && (
          <div className="flex flex-col gap-2 py-2">
            {CLASS_CATEGORY.map((menu) => {
              const isActive = category === menu.category;
              return (
                <Button
                  key={menu.id}
                  variant="ghost"
                  onClick={() => setCategory(menu.category)}
                  className={`justify-start h-12 transition-all duration-300 hover:text-white
                    ${
                      isActive
                        ? 'bg-zinc-800 text-white font-semibold border-l-4 border-white pl-4'
                        : 'text-zinc-400 hover:bg-zinc-900'
                    }`}
                >
                  <span className="shrink-0">{menu.icon}</span>
                  <span className="ml-3 font-medium">{menu.label}</span>
                </Button>
              );
            })}
          </div>
        )}
      </aside>
    </div>
  );
}

export { AppSidebar };
