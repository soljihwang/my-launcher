const GAS_URL = 'https://script.google.com/macros/s/AKfycbzYJ4BR4IKDRmmm1d4UYDJ86n1LjSBlwh4cOKWKIUOpBAw5XcJOoq1IKtbmr1HZQVxaeA/exec';

let links = [];
let editingId = null;

// 데이터 불러오기
async function loadLinks() {
  try {
    const res = await fetch(GAS_URL);
    links = await res.json();
    render();
  } catch (e) {
    console.error('불러오기 실패', e);
  }
}

// 화면 렌더링
function render() {
  renderPinned();
  renderCategories();
}

function renderPinned() {
  const container = document.getElementById('pinned-list');
  const pinned = links.filter(l => l.pinned === true || l.pinned === 'TRUE');
  container.innerHTML = pinned.map(cardHTML).join('');
  document.getElementById('pinned-section').style.display = pinned.length ? 'block' : 'none';
}

function renderCategories() {
  const container = document.getElementById('category-list');
  const categories = [...new Set(links.map(l => l.category || '기타'))];

  container.innerHTML = categories.map(cat => {
    const items = links.filter(l => (l.category || '기타') === cat);
    return `
      <div class="category-group">
        <h2>${cat}</h2>
        <div class="card-grid">
          ${items.map(cardHTML).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function cardHTML(link) {
  const icon = link.icon
    ? (link.icon.startsWith('http') ? `<img src="${link.icon}" class="icon" style="width:2rem;height:2rem;object-fit:contain;">` : `<span class="icon">${link.icon}</span>`)
    : `<span class="icon">🔗</span>`;

  return `
    <div class="card" onclick="openLink('${link.url}')">
      ${icon}
      <span class="card-title">${link.title}</span>
      <button class="edit-btn" onclick="event.stopPropagation(); openEdit('${link.id}')">✏️ 편집</button>
    </div>
  `;
}

function openLink(url) {
  window.open(url, '_blank');
}

// 모달 열기 - 추가
document.getElementById('addBtn').addEventListener('click', () => {
  editingId = null;
  document.getElementById('modal-title').textContent = '링크 추가';
  document.getElementById('f-title').value = '';
  document.getElementById('f-url').value = '';
  document.getElementById('f-category').value = '';
  document.getElementById('f-icon').value = '';
  document.getElementById('f-pinned').checked = false;
  document.getElementById('deleteBtn').classList.add('hidden');
  document.getElementById('modal').classList.remove('hidden');
});

// 모달 열기 - 편집
function openEdit(id) {
  const link = links.find(l => l.id == id);
  if (!link) return;
  editingId = id;
  document.getElementById('modal-title').textContent = '링크 편집';
  document.getElementById('f-title').value = link.title;
  document.getElementById('f-url').value = link.url;
  document.getElementById('f-category').value = link.category || '';
  document.getElementById('f-icon').value = link.icon || '';
  document.getElementById('f-pinned').checked = link.pinned === true || link.pinned === 'TRUE';
  document.getElementById('deleteBtn').classList.remove('hidden');
  document.getElementById('modal').classList.remove('hidden');
}

// 저장
document.getElementById('saveBtn').addEventListener('click', async () => {
  const payload = {
    action: editingId ? 'edit' : 'add',
    id: editingId || Date.now().toString(),
    title: document.getElementById('f-title').value,
    url: document.getElementById('f-url').value,
    category: document.getElementById('f-category').value,
    icon: document.getElementById('f-icon').value,
    pinned: document.getElementById('f-pinned').checked
  };

  await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  closeModal();
  loadLinks();
});

// 삭제
document.getElementById('deleteBtn').addEventListener('click', async () => {
  if (!confirm('삭제할까요?')) return;

  await fetch(GAS_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'delete', id: editingId })
  });

  closeModal();
  loadLinks();
});

// 취소
document.getElementById('cancelBtn').addEventListener('click', closeModal);

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  editingId = null;
}

// 초기 로드
loadLinks();