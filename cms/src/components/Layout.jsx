import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { SITE_URL } from '../lib/supabase';
import { initials } from '../lib/utils';
import { Button } from './ui';
import {
  IconBriefcase,
  IconDashboard,
  IconExternal,
  IconHelp,
  IconImage,
  IconLayers,
  IconLink,
  IconLogout,
  IconMail,
  IconMenu,
  IconPages,
  IconPen,
  IconSettings,
  IconTag,
} from './Icons';

const NAV = [
  {
    label: 'Umum',
    items: [{ to: '/', end: true, label: 'Dashboard', icon: IconDashboard }],
  },
  {
    label: 'Konten Halaman',
    items: [
      { to: '/pages', label: 'Halaman & Section', icon: IconPages },
      { to: '/portfolio', label: 'Portfolio', icon: IconBriefcase },
      { to: '/services', label: 'Services', icon: IconLayers },
      { to: '/pricing', label: 'Pricelist', icon: IconTag },
      { to: '/blog', label: 'Blog', icon: IconPen },
      { to: '/faq', label: 'FAQ', icon: IconHelp },
    ],
  },
  {
    label: 'Lainnya',
    items: [
      { to: '/messages', label: 'Pesan Masuk', icon: IconMail },
      { to: '/media', label: 'Media', icon: IconImage },
      { to: '/shortlinks', label: 'Shortlinks', icon: IconLink },
      { to: '/settings', label: 'Pengaturan', icon: IconSettings },
    ],
  },
];

const TITLES = {
  '/': ['Dashboard', 'Ringkasan konten website'],
  '/pages': ['Halaman & Section', 'Edit teks hero, judul, dan blok konten tiap halaman'],
  '/portfolio': ['Portfolio', 'Kelola daftar project'],
  '/services': ['Services', 'Kelola layanan yang ditampilkan'],
  '/pricing': ['Pricelist', 'Paket harga dan add-on'],
  '/blog': ['Blog', 'Tulis dan kelola artikel'],
  '/faq': ['FAQ', 'Pertanyaan yang sering diajukan'],
  '/messages': ['Pesan Masuk', 'Submission dari form kontak'],
  '/media': ['Media', 'File gambar di Supabase Storage'],
  '/shortlinks': ['Shortlinks', 'Buat link pendek untuk portfolio dan URL panjang'],
  '/settings': ['Pengaturan', 'Kontak, sosial media, dan SEO'],
};

export default function Layout() {
  const [open, setOpen] = useState(false);
  const { user, admin, signOut } = useAuth();
  const { pathname } = useLocation();

  const [title, subtitle] = TITLES[pathname] || ['CMS', 'Ramahfakhirin'];
  const name = admin?.full_name || user?.email || 'Admin';

  return (
    <div className="rf-shell">
      <aside className={`rf-sidebar${open ? ' is-open' : ''}`}>
        <div className="rf-sidebar-brand">
          <span className="rf-logo">
            Ramahf<span>.</span>
          </span>
          <span className="rf-badge-cms">CMS</span>
        </div>

        <nav className="rf-sidebar-nav">
          {NAV.map((group) => (
            <div className="rf-nav-group" key={group.label}>
              <div className="rf-nav-label">{group.label}</div>
              {group.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `rf-nav-item${isActive ? ' is-active' : ''}`}
                  onClick={() => setOpen(false)}
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="rf-sidebar-foot">
          <div className="rf-user">
            <div className="rf-avatar">{initials(name)}</div>
            <div className="rf-user-meta">
              <div className="rf-user-name">{name}</div>
              <div className="rf-user-role">{admin?.role === 'owner' ? 'Owner' : 'Editor'}</div>
            </div>
            <Button size="icon" onClick={signOut} title="Keluar">
              <IconLogout size={16} />
            </Button>
          </div>
        </div>
      </aside>

      {open && <div className="rf-backdrop" onClick={() => setOpen(false)} />}

      <div className="rf-main">
        <header className="rf-topbar">
          <button type="button" className="rf-burger" onClick={() => setOpen((v) => !v)} aria-label="Menu">
            <IconMenu size={19} />
          </button>
          <div>
            <h1>{title}</h1>
            <div className="rf-topbar-sub">{subtitle}</div>
          </div>
          <div className="rf-topbar-actions">
            {SITE_URL && (
              <Button size="sm" onClick={() => window.open(SITE_URL, '_blank', 'noopener')}>
                <IconExternal size={15} /> Lihat Website
              </Button>
            )}
          </div>
        </header>

        <main className="rf-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
