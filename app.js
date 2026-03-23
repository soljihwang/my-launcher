const GAS_URL = 'https://script.google.com/macros/s/AKfycbzYJ4BR4IKDRmmm1d4UYDJ86n1LjSBlwh4cOKWKIUOpBAw5XcJOoq1IKtbmr1HZQVxaeA/exec';

const EMOJIS = [
  '🏠','📁','📂','🔗','⭐','❤️','🔥','✅','📌','🎯',
  '💼','📊','📈','📝','🗂️','🛒','🎵','🎬','📷','🎮',
  '💬','📧','📞','🔍','⚙️','🛠️','💡','🌐','🏦','🏥',
  '🍕','☕','🛍️','✈️','🚗','🏋️','📚','🎨','💻','📱',
  '🌟','🎁','🔐','📅','🗓️','💰','🏆','🎉','👨‍👩‍👧','🌈'
];

let links = [];
let editingId = null;
let isEditMode = false;

// 초기 로드
loadLinks();

async function loadLinks() {
  try {
    const res = await fetch(GAS_URL);
    links = await res.json();
    render();
  } catch (e) {
    console.error('불러오기 실패', e);
  }
}

// GAS에 백그라운드로 저장 (화면은 즉시 반영)
async function syncToGAS(payload) {
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error('저장 실패', e);
  }
}

// 편집 모드 토글
document.getElementById('editToggleBtn').addEventListener('click', () => {
  isEditMode = !isEditMode;
  const btn = document.getElementById('editToggleBtn');
  const addBtn = document.getElementById('addBtn');
  if (isEditMode) {
    btn.textContent = '✅ 완료';
    btn.classList.add('active');
    addBtn.classList.remove('hidden');
  } else {
    btn.textContent = '✏️ 편집';
    btn.classList.remove('active');
    addBtn.classList.add('hidden');
  }
  render();
});

// 렌더링
function render() {
  renderPinned();
  renderCategories();
}

function renderPinned() {
  const container = document.getElementById('pinned-list');
  const section = document.getElementById('pinned-section');
  const pinned = links.filter(l => l.pinned === true || l.pinned === 'TRUE');
  if (pinned.length === 0) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');
  container.innerHTML = pinned.map(cardHTML).join('');
}

function renderCategories() {
  const container = document.getElementById('category-list');
  const categories = [...new Set(links.map(l => l.category || '기타'))];
  container.innerHTML = categories.map(cat => {
    const items = links.filter(l => (l.category || '기타') === cat);
    return `
      <div class="category-group">
        <h2 class="section-title">${cat}</h2>
        <div class="card-grid">
          ${items.map(cardHTML).join('')}
        </div>
      </div>
    `;
  }).join('');
}

function cardHTML(link) {
  const iconContent = link.icon
    ? (link.icon.startsWith('http')
        ? `<span class="icon"><img src="${link.icon}" alt=""></span>`
        : `<span class="icon">${link.icon}</span>`)
    : `<span class="icon">🔗</span>`;

  const editBtn = isEditMode
    ? `<button class="edit-btn" onclick="event.stopPropagation(); openEdit('${link.id}')">✏️ 편집</button>`
    : '';

  return `
    <div class="card" onclick="openLink('${link.url}')">
      ${iconContent}
      <span class="card-title">${link.title}</span>
      ${editBtn}
    </div>
  `;
}

function openLink(url) {
  window.open(url, '_blank');
}

// 이모지 피커
const emojiPickerEl = document.getElementById('emoji-picker');

document.getElementById('emojiPickerBtn').addEventListener('click', () => {
  if (emojiPickerEl.classList.contains('hidden')) {
    emojiPickerEl.innerHTML = '';
    emojiPickerEl.className = 'emoji-picker';
    EMOJIS.forEach(emoji => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.onclick = () => {
        document.getElementById('f-icon').value = emoji;
        emojiPickerEl.className = 'hidden';
      };
      emojiPickerEl.appendChild(btn);
    });
  } else {
    emojiPickerEl.className = 'hidden';
  }
});

// 추가 버튼
document.getElementById('addBtn').addEventListener('click', () => {
  editingId = null;
  document.getElementById('modal-title').textContent = '링크 추가';
  document.getElementById('f-title').value = '';
  document.getElementById('f-url').value = '';
  document.getElementById('f-category').value = '';
  document.getElementById('f-icon').value = '';
  document.getElementById('f-pinned').checked = false;
  document.getElementById('deleteBtn').classList.add('hidden');
  emojiPickerEl.className = 'hidden';
  document.getElementById('modal').classList.remove('hidden');
});

// 편집 열기
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
  emojiPickerEl.className = 'hidden';
  document.getElementById('modal').classList.remove('hidden');
}

// 저장 (화면 즉시 반영 후 백그라운드 GAS 저장)
document.getElementById('saveBtn').addEventListener('click', () => {
  const title = document.getElementById('f-title').value.trim();
  const url = document.getElementById('f-url').value.trim();
  if (!title || !url) {
    alert('이름과 URL은 필수예요!');
    return;
  }

  const payload = {
    action: editingId ? 'edit' : 'add',
    id: editingId || Date.now().toString(),
    title,
    url,
    category: document.getElementById('f-category').value.trim() || '기타',
    icon: document.getElementById('f-icon').value.trim(),
    pinned: document.getElementById('f-pinned').checked
  };

  // 로컬 즉시 반영
  if (editingId) {
    const idx = links.findIndex(l => l.id == editingId);
    if (idx !== -1) links[idx] = payload;
  } else {
    links.push(payload);
  }

  closeModal();
  render();

  // 백그라운드 저장
  syncToGAS(payload);
});

// 삭제
document.getElementById('deleteBtn').addEventListener('click', () => {
  if (!confirm('삭제할까요?')) return;

  const payload = { action: 'delete', id: editingId };

  // 로컬 즉시 반영
  links = links.filter(l => l.id != editingId);
  closeModal();
  render();

  // 백그라운드 저장
  syncToGAS(payload);
});

// 취소
document.getElementById('cancelBtn').addEventListener('click', closeModal);

// 모달 바깥 클릭시 닫기
document.querySelector('.modal-backdrop').addEventListener('click', closeModal);

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  emojiPickerEl.className = 'hidden';
  editingId = null;
}