import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { ToastProvider } from './lib/ToastContext';
import Layout from './components/Layout';
import { Loading } from './components/ui';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PagesEditor from './pages/PagesEditor';
import Portfolio from './pages/Portfolio';
import Services from './pages/Services';
import Pricing from './pages/Pricing';
import Blog from './pages/Blog';
import Faq from './pages/Faq';
import Messages from './pages/Messages';
import Media from './pages/Media';
import Settings from './pages/Settings';
import Shortlinks from './pages/Shortlinks';

function Protected() {
  const { session, admin, loading } = useAuth();

  if (loading) return <Loading text="Menyiapkan sesi…" />;
  if (!session || !admin) return <Navigate to="/login" replace />;
  return <Layout />;
}

function Root() {
  const { session, admin, loading } = useAuth();

  return (
    <Routes>
      <Route
        path="/login"
        element={!loading && session && admin ? <Navigate to="/" replace /> : <Login />}
      />
      <Route element={<Protected />}>
         <Route index element={<Dashboard />} />
         <Route path="pages" element={<PagesEditor />} />
         <Route path="portfolio" element={<Portfolio />} />
         <Route path="services" element={<Services />} />
         <Route path="pricing" element={<Pricing />} />
         <Route path="blog" element={<Blog />} />
         <Route path="faq" element={<Faq />} />
         <Route path="messages" element={<Messages />} />
         <Route path="media" element={<Media />} />
         <Route path="shortlinks" element={<Shortlinks />} />
         <Route path="settings" element={<Settings />} />
       </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/admin">
      <ToastProvider>
        <AuthProvider>
          <Root />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
