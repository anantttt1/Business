const API = window.location.origin.includes('localhost') ? 'http://localhost:4000' : (localStorage.getItem('apiBase') || '');
let token = sessionStorage.getItem('adminToken') || '';

const loginView = document.getElementById('login-view');
const dashView = document.getElementById('dashboard-view');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const ordersList = document.getElementById('orders-list');
const dashMessage = document.getElementById('dash-message');

function showDash() {
  loginView.hidden = true;
  dashView.hidden = false;
  loadOrders();
}
function showLogin() {
  loginView.hidden = false;
  dashView.hidden = true;
  token = '';
  sessionStorage.removeItem('adminToken');
}

if (token) showDash();

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.hidden = true;
  const password = document.getElementById('password').value;
  try {
    const res = await fetch(`${API}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Login failed');
    token = data.token;
    sessionStorage.setItem('adminToken', token);
    showDash();
  } catch (err) {
    loginError.textContent = err.message || 'Login failed. Is the API running?';
    loginError.hidden = false;
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  try {
    await fetch(`${API}/api/admin/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  } catch (_) {}
  showLogin();
});

async function loadOrders() {
  dashMessage.textContent = 'Loading…';
  ordersList.innerHTML = '';
  try {
    const res = await fetch(`${API}/api/admin/orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status === 401) { showLogin(); return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to load orders');
    const orders = data.orders || [];
    if (!orders.length) {
      dashMessage.textContent = 'No orders yet.';
      return;
    }
    dashMessage.textContent = `${orders.length} order(s)`;
    orders.forEach((o) => {
      const el = document.createElement('article');
      el.className = 'order-card';
      el.innerHTML = `
        <h3>${escapeHtml(o.name)} · ${escapeHtml(o.service || '')}</h3>
        <div class="meta">
          <span class="badge ${escapeHtml(o.status || 'open')}">${escapeHtml(o.status || 'open')}</span>
          <span>${escapeHtml(o.email || '')}</span>
          <span>${escapeHtml(o.whatsapp || '')}</span>
          <span>${escapeHtml(o.id || '')}</span>
          <span>${o.created_at ? new Date(o.created_at).toLocaleString() : ''}</span>
        </div>
        <p>${escapeHtml(o.requirements || '')}</p>
        <label>Status
          <select data-id="${escapeHtml(o.id)}" class="status-select">
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="done">done</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>
        <label>Internal notes
          <textarea data-id="${escapeHtml(o.id)}" class="notes-area" rows="3">${escapeHtml(o.notes || '')}</textarea>
        </label>
        <div class="actions">
          <button type="button" class="save-btn" data-id="${escapeHtml(o.id)}">Save</button>
        </div>
      `;
      const sel = el.querySelector('.status-select');
      if (sel) sel.value = o.status || 'open';
      ordersList.appendChild(el);
    });
    ordersList.querySelectorAll('.save-btn').forEach((btn) => {
      btn.addEventListener('click', () => saveOrder(btn.dataset.id));
    });
  } catch (err) {
    dashMessage.textContent = err.message || 'Could not load orders. Check API URL and auth.';
  }
}

async function saveOrder(id) {
  const status = ordersList.querySelector(`select[data-id="${id}"]`)?.value;
  const notes = ordersList.querySelector(`textarea[data-id="${id}"]`)?.value;
  try {
    const res = await fetch(`${API}/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status, notes })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Save failed');
    dashMessage.textContent = `Saved ${id}`;
    loadOrders();
  } catch (err) {
    dashMessage.textContent = err.message || 'Save failed';
  }
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
