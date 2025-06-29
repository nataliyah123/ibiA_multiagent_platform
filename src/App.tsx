import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { useAppStore } from './stores/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  const { isDarkMode } = useAppStore();

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Layout>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Dashboard />} />
            </Routes>
          </main>
          
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: isDarkMode ? '#374151' : '#ffffff',
                color: isDarkMode ? '#ffffff' : '#000000',
                border: isDarkMode ? '1px solid #4B5563' : '1px solid #E5E7EB',
              },
            }}
          />
        </Layout>
      </Router>
    </QueryClientProvider>
  );
}

export default App;