import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './hooks/useTheme';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Remedies from './pages/Remedies';
import Cases from './pages/Cases';
import Settings from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/remedies" element={<Remedies />} />
          <Route path="/remedies/:id" element={<Remedies />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}
