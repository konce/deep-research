import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Research from './pages/Research';
import Reports from './pages/Reports';
import Layout from './components/Layout';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/research/:id" element={<Research />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Layout>
  );
}

export default App;
