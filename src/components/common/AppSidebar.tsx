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
    <>
      {/* ✅ [사진 1번 형태] lg(1024px) 미만에서는 무조건 가로 스크롤로 나옵니다 */}
      <div className="lg:hidden w-full overflow-x-auto bg-black sticky py-2 px-4 scrollbar-hide">
        <div className="flex flex-nowrap gap-2 w-max">
          {CLASS_CATEGORY.map((menu) => {
            const isActive = category === menu.category;
            return (
              <Button
                key={menu.id}
                variant="ghost"
                onClick={() => setCategory(menu.category)}
                className={`shrink-0 rounded-full px-4 py-2 whitespace-nowrap transition-all duration-300
                    ${
                      isActive
                        ? 'bg-white text-black font-bold shadow-lg ring-1 ring-zinc-700'
                        : 'text-zinc-400 bg-zinc-900/80 hover:text-white'
                    }`}
              >
                {menu.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* ✅ [사진 2번 형태] lg(1024px) 이상일 때만 세로 사이드바가 나옵니다 */}
      <aside className="hidden lg:flex flex-col gap-4 top-2 w-full">
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
    </>
  );
}

export { AppSidebar };
