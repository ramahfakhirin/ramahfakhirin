import { Link } from 'react-router-dom';
import { useRealtimeTable } from '../lib/useRealtimeTable';
import { timeAgo } from '../lib/utils';
import { Alert, Badge, Card, EmptyState, Loading } from '../components/ui';

function Stat({ label, value, note }) {
  return (
    <div className="rf-stat">
      <div className="rf-stat-label">{label}</div>
      <div className="rf-stat-value">{value}</div>
      {note && <div className="rf-stat-note">{note}</div>}
    </div>
  );
}

export default function Dashboard() {
  const projects = useRealtimeTable('projects', { orderBy: 'sort_order' });
  const posts = useRealtimeTable('posts', { orderBy: 'created_at', ascending: false });
  const messages = useRealtimeTable('messages', { orderBy: 'created_at', ascending: false });
  const services = useRealtimeTable('services', { orderBy: 'sort_order' });
  const activity = useRealtimeTable('activity_log', {
    orderBy: 'created_at',
    ascending: false,
    limit: 12,
  });

  const loading = projects.loading || posts.loading || messages.loading;
  const error = projects.error || posts.error || messages.error;

  const publishedProjects = projects.rows.filter((r) => r.is_published).length;
  const publishedPosts = posts.rows.filter((r) => r.is_published).length;
  const newMessages = messages.rows.filter((r) => r.status === 'new').length;
  const totalViews = posts.rows.reduce((sum, p) => sum + (p.views || 0), 0);

  if (loading) return <Loading />;

  return (
    <>
      {error && <Alert tone="error">{error}</Alert>}

      <div className="rf-stat-grid">
        <Stat
          label="Portfolio"
          value={projects.rows.length}
          note={`${publishedProjects} tayang`}
        />
        <Stat label="Artikel Blog" value={posts.rows.length} note={`${publishedPosts} tayang`} />
        <Stat label="Services" value={services.rows.length} note="layanan aktif" />
        <Stat
          label="Pesan Masuk"
          value={messages.rows.length}
          note={newMessages ? `${newMessages} belum dibaca` : 'semua sudah dibaca'}
        />
        <Stat label="Total Views" value={totalViews.toLocaleString('id-ID')} note="akumulasi artikel" />
      </div>

      <div className="rf-grid-2">
        <Card
          title="Pesan Terbaru"
          subtitle="Dari form kontak website"
          actions={<Link to="/messages" className="rf-btn rf-btn-ghost rf-btn-sm">Lihat semua</Link>}
          flush
        >
          {messages.rows.length === 0 ? (
            <EmptyState title="Belum ada pesan" text="Submission form kontak akan muncul di sini." />
          ) : (
            <div className="rf-table-wrap">
              <table className="rf-table">
                <tbody>
                  {messages.rows.slice(0, 6).map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="rf-td-title">{m.name}</div>
                        <div style={{ fontSize: 12.5, color: 'var(--rf-soft)' }}>{m.email}</div>
                      </td>
                      <td style={{ maxWidth: 240 }}>
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {m.subject || m.message}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--rf-soft)' }}>
                          {timeAgo(m.created_at)}
                        </div>
                      </td>
                      <td className="rf-td-actions">
                        <Badge tone={m.status === 'new' ? 'accent' : 'off'}>
                          {m.status === 'new' ? 'Baru' : m.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card title="Aktivitas Terakhir" subtitle="Riwayat perubahan konten" flush>
          {activity.rows.length === 0 ? (
            <EmptyState title="Belum ada aktivitas" text="Perubahan konten akan tercatat di sini." />
          ) : (
            <div className="rf-table-wrap">
              <table className="rf-table">
                <tbody>
                  {activity.rows.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <div className="rf-td-title">
                          {a.action} · {a.entity}
                        </div>
                        <div style={{ fontSize: 12.5, color: 'var(--rf-soft)' }}>
                          {a.actor} — {timeAgo(a.created_at)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card title="Artikel Terbaru" subtitle="Blog" flush
        actions={<Link to="/blog" className="rf-btn rf-btn-ghost rf-btn-sm">Kelola blog</Link>}>
        {posts.rows.length === 0 ? (
          <EmptyState title="Belum ada artikel" text="Mulai tulis artikel pertama." />
        ) : (
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Kategori</th>
                  <th>Views</th>
                  <th>Status</th>
                  <th>Diperbarui</th>
                </tr>
              </thead>
              <tbody>
                {posts.rows.slice(0, 8).map((p) => (
                  <tr key={p.id}>
                    <td className="rf-td-title">{p.title}</td>
                    <td>{p.category || '—'}</td>
                    <td>{p.views || 0}</td>
                    <td>
                      <Badge tone={p.is_published ? 'on' : 'off'}>
                        {p.is_published ? 'Tayang' : 'Draft'}
                      </Badge>
                    </td>
                    <td>{timeAgo(p.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
