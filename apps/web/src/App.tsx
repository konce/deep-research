import { Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import Home from './pages/Home';
import Research from './pages/Research';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import { queryClient } from './api/queryClient';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/research/:id" element={<Research />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </Layout>
    </QueryClientProvider>
  );
}

export default App;
