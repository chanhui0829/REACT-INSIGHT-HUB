import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

// 🔥 React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Toast
import { Toaster } from '@/components/ui/sonner';

// 🔥 Layout + Pages
import ScrollToTop from './components/common/ScrollToTop';

const RootLayout = lazy(() => import('@/pages/layout'));
const App = lazy(() => import('@/pages'));
const SignUp = lazy(() => import('@/pages/sign-up'));
const SignIn = lazy(() => import('@/pages/sign-in'));
const AuthCallback = lazy(() => import('@/pages/auth/callback'));
const CreateTopic = lazy(() => import('@/pages/topics/[topic_id]/create'));
const TopicDetail = lazy(() => import('@/pages/topics/[topic_id]/detail'));
const CaseStudy = lazy(() => import('@/pages/case-study'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 60 * 3,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a]" />}>
          <Routes>
            <Route path="auth/callback" element={<AuthCallback />} />
            <Route element={<RootLayout />}>
              <Route index element={<App />} />
              <Route path="sign-up" element={<SignUp />} />
              <Route path="sign-in" element={<SignIn />} />
              <Route path="topics">
                <Route path="create" element={<CreateTopic />} />
                <Route path="create/:id" element={<CreateTopic />} />
                <Route path=":id/detail" element={<TopicDetail />} />
              </Route>
              <Route path="case-study" element={<CaseStudy />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>

      <Toaster richColors position="top-center" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
