/**
 * rf-analytics.js — Tracking snippet untuk ramahfakhirin.com
 * 
 * HOW TO USE:
 * Tambahkan di index.html sebelum </body>:
 * <script src="https://api.ramahfakhirin.com/rf-analytics.js"></script>
 * 
 * Atau copy paste code ini langsung ke <script> tag.
 */
(function() {
  const API = 'https://api.ramahfakhirin.com'; // ganti sesuai URL backend kamu

  // Session ID (per browser tab)
  let sid = sessionStorage.getItem('rf_sid');
  if (!sid) { sid = 'sid_' + Math.random().toString(36).slice(2) + Date.now(); sessionStorage.setItem('rf_sid', sid); }

  // Track page view
  function trackView() {
    fetch(API + '/api/analytics/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page: window.location.pathname || '/',
        referrer: document.referrer || null,
        session_id: sid,
      }),
      keepalive: true,
    }).catch(() => {});
  }

  // Track event
  window.rfTrack = function(eventName, data) {
    fetch(API + '/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_name: eventName,
        event_data: data || {},
        page: window.location.pathname || '/',
        session_id: sid,
      }),
      keepalive: true,
    }).catch(() => {});
  };

  // Auto-track clicks on CTA buttons
  document.addEventListener('click', function(e) {
    const el = e.target.closest('a, button');
    if (!el) return;
    const href = el.getAttribute('href') || '';
    if (href.startsWith('mailto:')) window.rfTrack('click_email');
    else if (href.includes('wa.me')) window.rfTrack('click_whatsapp');
    else if (href.includes('linkedin')) window.rfTrack('click_linkedin');
    else if (href.includes('instagram')) window.rfTrack('click_instagram');
    else if (el.classList.contains('rf-fbtn')) window.rfTrack('portfolio_filter', { filter: el.dataset.filter });
    else if (el.classList.contains('rf-pov-link') || el.closest('.rf-pcard')) window.rfTrack('portfolio_click', { title: el.textContent?.trim().slice(0,50) });
  });

  // Track on load
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', trackView);
  else trackView();
})();
