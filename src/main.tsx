import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

// 🔥 React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// 🔥 Theme + Toast
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';

// 🔥 Layout + Pages
import RootLayout from '@/pages/layout';
import App from '@/pages';
import SignUp from '@/pages/sign-up';
import SignIn from '@/pages/sign-in';
import AuthCallback from '@/pages/auth/callback';
import CreateTopic from '@/pages/topics/[topic_id]/create';
import TopicDetail from '@/pages/topics/[topic_id]/detail';
import ScrollToTop from './components/common/ScrollToTop';

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
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route element={<RootLayout />}>
              <Route index element={<App />} />
              <Route path="sign-up" element={<SignUp />} />
              <Route path="sign-in" element={<SignIn />} />
              <Route path="auth/callback" element={<AuthCallback />} />
              <Route path="topics">
                <Route path="create" element={<CreateTopic />} />
                <Route path="create/:id" element={<CreateTopic />} />
                <Route path=":id/detail" element={<TopicDetail />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>

        <Toaster richColors position="top-center" />
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);
