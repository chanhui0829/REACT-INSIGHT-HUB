import { motion } from 'framer-motion';

// ✅ 성능 최적화된 애니메이션 (transform 제거)
const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

const sections = [
  {
    title: 'Problem',
    content: (
      <>
        <p>
          초기에는 useState 기반으로 모든 상태를 관리하며 UI와 로직이 강하게 결합된 구조였습니다.
        </p>
        <p>
          이로 인해 컴포넌트가 비대해지고, 동일한 데이터 요청이 여러 곳에서 발생하는 문제가
          있었습니다.
        </p>
        <p>
          특히 서버 상태와 UI 상태가 명확히 구분되지 않아 불필요한 리렌더링과 데이터 흐름의 복잡성이
          증가했습니다.
        </p>
      </>
    ),
  },
  {
    title: 'Solution',
    content: (
      <>
        <p>서버 상태와 UI 상태를 분리하는 방향으로 구조를 개선했습니다.</p>
        <p>
          <strong>React Query</strong>를 도입하여 서버 상태를 전담 관리하고, 캐싱 및 자동 리페칭을
          통해 데이터 동기화 문제를 해결했습니다.
        </p>
        <p>
          Custom Hook과 Service Layer를 분리하여 컴포넌트는 UI 렌더링에만 집중하도록 구조를
          개선했습니다.
        </p>
        <p>그 결과 데이터 요청 로직이 중앙화되었고, 중복 API 호출을 줄일 수 있었습니다.</p>
      </>
    ),
  },
  {
    title: 'Trade-off',
    content: (
      <>
        <p>React Query 도입으로 러닝 커브가 증가했습니다.</p>
        <p>query key 관리 및 캐시 제어가 복잡해질 수 있는 리스크가 존재했습니다.</p>
        <p>Supabase는 빠른 개발이 가능하지만 복잡한 데이터 처리에는 한계가 있었습니다.</p>
      </>
    ),
  },
  {
    title: 'Troubleshooting',
    content: (
      <>
        <p>좋아요 기능에서 중복 요청이 발생하는 문제가 있었습니다.</p>
        <p>
          React Query의 mutation과 optimistic update를 적용하여 즉각적인 UI 반영과 중복 요청을
          방지했습니다.
        </p>
        <p>이를 통해 사용자 경험이 개선되고 불필요한 네트워크 요청을 줄일 수 있었습니다.</p>
      </>
    ),
  },
];

export default function CaseStudyPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 pt-20 pb-10 space-y-10">
      {/* 🔥 Hero */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        animate="show"
        className="
          flex flex-col items-center text-center gap-6
          p-10 rounded-2xl
          bg-gradient-to-b from-emerald-500/10 to-transparent
          border border-emerald-500/10
        "
      >
        <h1 className="text-4xl font-bold tracking-tight">Insight Hub</h1>

        <p className="text-lg text-zinc-300">토픽 중심의 인사이트 콘텐츠 플랫폼</p>

        <p className="max-w-2xl text-[15px] text-zinc-400 leading-relaxed">
          정보는 넘쳐나지만, 깊이 있는 인사이트를 찾기는 어렵습니다.
          <br />
          Insight Hub는 주제별로 구조화된 토픽을 통해 지식과 경험을 더 쉽게 탐색하고 공유할 수
          있도록 설계되었습니다.
        </p>
      </motion.section>

      {/* 🔥 Section Cards */}
      {sections.map((section, i) => (
        <motion.section
          key={i}
          variants={fadeIn}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="
            flex flex-col gap-6
            p-6 rounded-2xl
            bg-white/5
            border border-white/10
            hover:border-white/20
            transition-colors duration-300
          "
        >
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
            {section.title}
          </h2>

          <div className="flex flex-col gap-4 text-zinc-300 text-[15px] leading-relaxed">
            {section.content}
          </div>
        </motion.section>
      ))}

      {/* 🔥 Tech Decisions */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="
          flex flex-col gap-6
          p-6 rounded-2xl
          bg-white/5
          border border-white/10
        "
      >
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
          Tech Decisions
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: 'React Query',
              desc: '서버 상태를 UI와 분리하고 캐싱 및 자동 리페칭을 통해 데이터 동기화 문제를 해결',
            },
            {
              title: 'Custom Hooks',
              desc: '데이터 로직을 분리하여 UI 컴포넌트의 책임을 줄이고 재사용성을 향상',
            },
            {
              title: 'Service Layer',
              desc: 'API 호출을 분리하여 데이터 접근 구조를 명확하게 설계',
            },
          ].map((item, i) => (
            <div
              key={i}
              className="
                p-4 rounded-xl
                bg-white/5
                border border-white/10
                hover:border-emerald-400/40
                transition-colors
              "
            >
              <h3 className="text-white font-semibold mb-2">{item.title}</h3>
              <p className="text-zinc-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* 🔥 Result & Learned */}
      <motion.section
        variants={fadeIn}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="
          flex flex-col gap-6
          p-6 rounded-2xl
          bg-gradient-to-b from-white/5 to-transparent
          border border-white/10
        "
      >
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
          Result & Learned
        </h2>

        <div className="flex flex-col gap-4 text-zinc-300 text-[15px] leading-relaxed">
          <p>서버 상태 분리를 통해 데이터 흐름이 명확해지고 유지보수성이 개선되었습니다.</p>
          <p>
            React Query의 캐싱 전략을 활용하여 불필요한 API 요청을 줄이고 사용자 경험을
            개선했습니다.
          </p>
          <p>
            컴포넌트 책임을 분리함으로써 코드 재사용성이 증가하고 기능 확장이 용이한 구조로
            개선되었습니다.
          </p>
        </div>
      </motion.section>
    </main>
  );
}
