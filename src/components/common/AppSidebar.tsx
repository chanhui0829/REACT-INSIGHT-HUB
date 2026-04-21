import { motion } from 'framer-motion';

import { useState, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../ui';
import { CLASS_CATEGORY } from '@/constants/category.constant';

interface Props {
  category: string;
  setCategory: (value: string) => void;
}

function AppSidebar({ category, setCategory }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  const activeCategory = useMemo(
    () => CLASS_CATEGORY.find((c) => c.category === category),
    [category]
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col w-full select-none"
    >
      <div className="flex flex-col w-full select-none">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center justify-between px-3 py-2 cursor-pointer"
        >
          <div className="flex flex-col gap-1">
            <h4 className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.2em]">
              카테고리
            </h4>
            <span className="text-[14px] font-bold text-zinc-200">
              {activeCategory?.label || '전체'}
            </span>
          </div>
          <div
            className={`p-2 rounded-xl bg-zinc-900/50 border border-white/5 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          >
            <ChevronDown className="w-4 h-4 text-zinc-500 group-hover:text-emerald-500 transition-colors" />
          </div>
        </div>

        <div
          className={`grid transition-all duration-500 ease-in-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
          }`}
        >
          <div className="overflow-hidden flex flex-col gap-1.5">
            {CLASS_CATEGORY.map((menu) => {
              const isActive = category === menu.category;
              return (
                <Button
                  key={menu.id}
                  variant="ghost"
                  onClick={() => setCategory(menu.category)}
                  className={`relative group justify-start h-12 px-4 rounded-2xl transition-all duration-300
                  ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 w-1 h-5 bg-emerald-500 rounded-r-full" />
                  )}

                  <span
                    className={`shrink-0 transition-transform duration-300 ${
                      isActive ? 'scale-110' : 'group-hover:scale-110'
                    }`}
                  >
                    {menu.icon}
                  </span>
                  <span className="ml-3 text-[14px]">{menu.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export { AppSidebar };
