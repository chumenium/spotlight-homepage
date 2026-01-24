const NOTICE_ENDPOINT = 'notices.json';
const NOTICE_LIST_ID = 'noticeList';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatNotice(notice) {
  const date = escapeHtml(notice.date || '');
  const title = escapeHtml(notice.title || '');
  const body = escapeHtml(notice.body || '');
  const tag = escapeHtml(notice.tag || 'INFO');

  return `
    <div class="notice-item fade-in">
      <div class="notice-meta">
        <span class="notice-tag">${tag}</span>
        <span>${date}</span>
      </div>
      <div class="notice-title">${title}</div>
      <div class="notice-body">${body}</div>
    </div>
  `;
}

function renderNotices(items) {
  const container = document.getElementById(NOTICE_LIST_ID);
  if (!container) return;

  if (!items || items.length === 0) {
    container.innerHTML = `
      <div class="notice-item fade-in">
        <div class="notice-title">現在お知らせはありません</div>
      </div>
    `;
    return;
  }

  container.innerHTML = items.map(formatNotice).join('');
}

async function loadNotices() {
  const container = document.getElementById(NOTICE_LIST_ID);
  if (!container) return;

  try {
    const response = await fetch(NOTICE_ENDPOINT, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Failed to load notices: ${response.status}`);
    }
    const data = await response.json();
    renderNotices(data.notices || []);
  } catch (error) {
    console.error(error);
    container.innerHTML = `
      <div class="notice-item fade-in">
        <div class="notice-title">お知らせの読み込みに失敗しました</div>
        <div class="notice-body">しばらくしてから再度お試しください。</div>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadNotices();
});
