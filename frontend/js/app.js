const API = 'https://drifxs.com/api/clients.php';

const COLORS = [
  ['#1a2a4a', '#4f8ef7'],
  ['#1a3328', '#2dd4a0'],
  ['#3a1f2e', '#e879a0'],
  ['#2d2210', '#f5a623'],
  ['#2a1a3e', '#a78bfa'],
  ['#1e2d1e', '#6ee090'],
  ['#3a1f1f', '#f87171'],
  ['#1a2e3a', '#38bdf8'],
];

let allClients = [];
let editingId = null;
let currentProfileId = null;

document.addEventListener('DOMContentLoaded', loadClients);

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed.');
  return data;
}

async function loadClients() {
  try {
    allClients = await apiFetch(API);
    renderTable();
    updateStats();
  } catch (err) {
    document.getElementById('loading-state').innerHTML = `
      <div class="empty-icon">⚠</div>
      <div class="empty-title">Could not connect to server</div>
      <div>${err.message}</div>
    `;
  }
}

function initials(first, last) {
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase() || '?';
}

function colorFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

function renewalStatus(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((d - today) / 86400000);
  if (diff < 0) return { label: 'Overdue', cls: 'badge-red', diff };
  if (diff <= 30) return { label: `${diff}d left`, cls: 'badge-amber', diff };
  return { label: 'Active', cls: 'badge-green', diff };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function updateStats() {
  let soon = 0, overdue = 0;
  allClients.forEach(c => {
    const s = renewalStatus(c.renewal_date);
    if (!s) return;
    if (s.diff < 0) overdue++;
    else if (s.diff <= 30) soon++;
  });
  document.getElementById('stat-total').textContent = allClients.length;
  document.getElementById('stat-soon').textContent = soon;
  document.getElementById('stat-overdue').textContent = overdue;
}

function filterTable() {
  renderTable();
}

function renderTable() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const tbody = document.getElementById('client-tbody');
  const empty = document.getElementById('empty-state');
  const loading = document.getElementById('loading-state');
  const table = document.getElementById('client-table');

  loading.style.display = 'none';

  const filtered = allClients.filter(c =>
    !q ||
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
    (c.company || '').toLowerCase().includes(q) ||
    (c.email || '').toLowerCase().includes(q)
  );

  if (allClients.length === 0) {
    table.style.display = 'none';
    empty.style.display = 'block';
    return;
  }

  table.style.display = '';
  empty.style.display = 'none';

  tbody.innerHTML = filtered.map(c => {
    const [bg, fg] = colorFor(c.id);
    const init = initials(c.first_name, c.last_name);
    const rs = renewalStatus(c.renewal_date);
    const badgeHtml = rs
      ? `<span class="badge ${rs.cls}">${rs.label}</span>`
      : `<span class="badge badge-blue">No date</span>`;

    return `
      <tr>
        <td>
          <div class="client-name-cell" onclick="showProfile('${c.id}')">
            <div class="avatar" style="background:${bg};color:${fg}">${escHtml(init)}</div>
            <div>
              <div class="client-name">${escHtml(c.first_name)} ${escHtml(c.last_name)}</div>
              ${c.company ? `<div class="client-company">${escHtml(c.company)}</div>` : ''}
            </div>
          </div>
        </td>
        <td style="font-size:13px;color:var(--muted)">${escHtml(c.email || '—')}</td>
        <td style="font-size:13px;font-family:var(--mono)">${formatDate(c.renewal_date)}</td>
        <td>${badgeHtml}</td>
        <td>
          <div class="action-cell">
            <button class="icon-btn" title="Edit client" onclick="openEditModal('${c.id}')">✎</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function showProfile(id) {
  const c = allClients.find(x => x.id === id);
  if (!c) return;
  currentProfileId = id;

  const [bg, fg] = colorFor(c.id);
  const init = initials(c.first_name, c.last_name);
  const rs = renewalStatus(c.renewal_date);
  const badgeHtml = rs
    ? `<span class="badge ${rs.cls}">${rs.label}</span>`
    : `<span class="badge badge-blue">No date set</span>`;

  document.getElementById('profile-content').innerHTML = `
    <div class="profile-header">
      <div class="profile-identity">
        <div class="avatar-lg" style="background:${bg};color:${fg}">${escHtml(init)}</div>
        <div>
          <div class="profile-name">${escHtml(c.first_name)} ${escHtml(c.last_name)}</div>
          ${c.company ? `<div class="profile-company">${escHtml(c.company)}</div>` : ''}
          <div class="profile-badges">${badgeHtml}</div>
        </div>
      </div>
      <div class="profile-actions">
        <button class="btn btn-primary" onclick="openEditModal('${c.id}')">✎ Edit</button>
      </div>
    </div>

    <div class="profile-grid">
      <div class="info-card">
        <div class="info-card-title">Contact Info</div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span class="info-value info-value-accent">${escHtml(c.email || '—')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phone</span>
          <span class="info-value">${escHtml(c.phone || '—')}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Company</span>
          <span class="info-value">${escHtml(c.company || '—')}</span>
        </div>
      </div>
      <div class="info-card">
        <div class="info-card-title">Renewal</div>
        <div class="info-row">
          <span class="info-label">Date</span>
          <span class="info-value info-value-mono">${formatDate(c.renewal_date)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Status</span>
          <span class="info-value">${rs ? rs.label : 'Not set'}</span>
        </div>
      </div>
    </div>

    ${c.contract_details ? `
    <div class="notes-card">
      <div class="info-card-title">Contract Details</div>
      <div class="notes-text">${escHtml(c.contract_details)}</div>
    </div>` : ''}

    ${c.notes ? `
    <div class="notes-card">
      <div class="info-card-title">Notes</div>
      <div class="notes-text">${escHtml(c.notes)}</div>
    </div>` : ''}

    ${c.additional_data ? `
    <div class="notes-card">
      <div class="info-card-title">Additional Data</div>
      <div class="notes-text">${escHtml(c.additional_data)}</div>
    </div>` : ''}
  `;

  document.getElementById('view-dashboard').classList.remove('active');
  document.getElementById('view-profile').classList.add('active');
  window.scrollTo(0, 0);
}

function showDashboard() {
  document.getElementById('view-dashboard').classList.add('active');
  document.getElementById('view-profile').classList.remove('active');
  currentProfileId = null;
  renderTable();
}

function openCreateModal() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Add New Client';
  document.getElementById('save-btn').textContent = 'Save Client';
  clearForm();
  document.getElementById('modal-overlay').classList.add('open');
}

function openEditModal(id) {
  const c = allClients.find(x => x.id === id);
  if (!c) return;
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Client';
  document.getElementById('save-btn').textContent = 'Update Client';

  document.getElementById('f-first').value = c.first_name || '';
  document.getElementById('f-last').value = c.last_name || '';
  document.getElementById('f-company').value = c.company || '';
  document.getElementById('f-email').value = c.email || '';
  document.getElementById('f-phone').value = c.phone || '';
  document.getElementById('f-renewal').value = c.renewal_date ? c.renewal_date.split('T')[0] : '';
  document.getElementById('f-contract').value = c.contract_details || '';
  document.getElementById('f-notes').value = c.notes || '';
  document.getElementById('f-extra').value = c.additional_data || '';

  document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  editingId = null;
}

function closeModalOnOverlay(e) {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
}

function clearForm() {
  ['f-first', 'f-last', 'f-company', 'f-email', 'f-phone', 'f-renewal', 'f-contract', 'f-notes', 'f-extra']
    .forEach(id => document.getElementById(id).value = '');
}

async function saveClient() {
  const first_name = document.getElementById('f-first').value.trim();
  const last_name = document.getElementById('f-last').value.trim();
  const email = document.getElementById('f-email').value.trim();

  if (!first_name || !last_name || !email) {
    toast('First name, last name, and email are required.');
    return;
  }

  const body = {
    first_name,
    last_name,
    email,
    company: document.getElementById('f-company').value.trim(),
    phone: document.getElementById('f-phone').value.trim(),
    renewal_date: document.getElementById('f-renewal').value || null,
    contract_details: document.getElementById('f-contract').value.trim(),
    notes: document.getElementById('f-notes').value.trim(),
    additional_data: document.getElementById('f-extra').value.trim(),
  };

  const saveBtn = document.getElementById('save-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    if (editingId) {
      const updated = await apiFetch(`${API}/${editingId}`, { method: 'PUT', body: JSON.stringify(body) });
      const idx = allClients.findIndex(x => x.id === editingId);
      allClients[idx] = updated;
      toast('Client updated.');
      if (currentProfileId === editingId) showProfile(editingId);
    } else {
      const created = await apiFetch(API, { method: 'POST', body: JSON.stringify(body) });
      allClients.unshift(created);
      toast('Client added.');
    }

    closeModal();
    renderTable();
    updateStats();
  } catch (err) {
    toast(`Error: ${err.message}`);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = editingId ? 'Update Client' : 'Save Client';
  }
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.style.display = 'none', 2800);
}