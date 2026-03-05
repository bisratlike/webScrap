/* ============================================
   dashboard.js — Admin Dashboard SPA Logic
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ---- Auth Guard ---- */
  const token = getToken();
  const user  = getUser();

  if (!token || !user || user.role !== 'admin') {
    window.location.href = '/login.html';
    return;
  }

  // Set admin name
  const adminNameEl = document.getElementById('admin-name');
  if (adminNameEl) adminNameEl.textContent = user.name || user.email || 'Admin';

  /* ---- Logout ---- */
  document.getElementById('logout-btn').addEventListener('click', logout);

  /* ---- Sidebar mobile toggle ---- */
  const sidebarToggleBtn = document.getElementById('sidebar-toggle');
  const sidebar          = document.querySelector('.sidebar');

  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !sidebarToggleBtn.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  /* ---- Tab navigation ---- */
  const tabLinks  = document.querySelectorAll('[data-tab]');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const dashHeader = document.getElementById('dash-page-title');

  const tabTitles = {
    overview:      'Overview',
    users:         'Users',
    subscriptions: 'Subscriptions',
    usage:         'Usage',
    installs:      'Installs',
  };

  function activateTab(tabName) {
    tabLinks.forEach(l => l.classList.toggle('active', l.dataset.tab === tabName));
    tabPanels.forEach(p => p.classList.toggle('active', p.id === `tab-${tabName}`));
    if (dashHeader) dashHeader.textContent = tabTitles[tabName] || tabName;

    // Load data for the tab
    switch (tabName) {
      case 'overview':      fetchOverview();      break;
      case 'users':         fetchUsers();         break;
      case 'subscriptions': fetchSubscriptions(); break;
      case 'usage':         fetchUsage();         break;
      case 'installs':      fetchInstalls();      break;
    }
  }

  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      activateTab(link.dataset.tab);
      sidebar.classList.remove('open');
    });
  });

  // Load default tab
  activateTab('overview');

  /* ============================================
     OVERVIEW TAB
     ============================================ */
  async function fetchOverview() {
    try {
      const data = await api('/api/admin/overview');

      // Stat cards
      setStatCard('stat-users',    data.totalUsers    ?? '—');
      setStatCard('stat-subs',     data.activeSubs    ?? '—');
      setStatCard('stat-revenue',  formatCurrency((data.totalRevenueCents) ?? 0));
      setStatCard('stat-installs', data.totalInstalls ?? '—');

      // Recent signups table
      renderTable(
        ['ID', 'Name', 'Email', 'Role', 'Joined'],
        (data.recentSignups || []).map(u => [
          truncateId(u._id || u.id),
          u.name || '—',
          u.email,
          roleBadge(u.role),
          formatDate(u.createdAt),
        ]),
        document.getElementById('recent-signups-body'),
      );

      // Recent activity table
      renderTable(
        ['Time', 'User', 'Action', 'Details'],
        (data.recentActivity || []).map(a => [
          formatDateTime(a.createdAt || a.timestamp),
          a.userEmail || a.user || '—',
          a.action || a.type || '—',
          a.details || '—',
        ]),
        document.getElementById('recent-activity-body'),
      );
    } catch (err) {
      showToast('Failed to load overview: ' + err.message, 'error');
    }
  }

  function setStatCard(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  /* ============================================
     USERS TAB
     ============================================ */
  let usersPage      = 1;
  const usersPerPage = 15;
  let usersSearch    = '';
  let usersTotal     = 0;

  const userSearchInput = document.getElementById('user-search');

  if (userSearchInput) {
    let debounceTimer;
    userSearchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        usersSearch = e.target.value.trim();
        usersPage   = 1;
        fetchUsers();
      }, 350);
    });
  }

  document.getElementById('users-prev')?.addEventListener('click', () => {
    if (usersPage > 1) { usersPage--; fetchUsers(); }
  });
  document.getElementById('users-next')?.addEventListener('click', () => {
    if (usersPage * usersPerPage < usersTotal) { usersPage++; fetchUsers(); }
  });

  async function fetchUsers() {
    const container = document.getElementById('users-table-body');
    showTableLoading(container, 5);

    try {
      const params = new URLSearchParams({ page: usersPage, limit: usersPerPage });
      if (usersSearch) params.set('search', usersSearch);

      const data  = await api(`/api/admin/users?${params}`);
      const users = data.users || data.data || data || [];
      usersTotal  = data.total || users.length;

      renderTable(
        ['ID', 'Name', 'Email', 'Role', 'Joined', 'Actions'],
        users.map(u => [
          truncateId(u._id || u.id),
          u.name || '—',
          u.email,
          roleBadge(u.role),
          formatDate(u.createdAt),
          `<button class="btn btn-sm btn-secondary change-role-btn"
             data-id="${u._id || u.id}"
             data-role="${u.role}">
             Change Role
           </button>`,
        ]),
        container,
        true, // allow HTML
      );

      updatePagination('users', usersPage, usersPerPage, usersTotal);

      // Bind role change buttons
      document.querySelectorAll('.change-role-btn').forEach(btn => {
        btn.addEventListener('click', () => changeRole(btn.dataset.id, btn.dataset.role));
      });
    } catch (err) {
      showTableError(container, err.message);
    }
  }

  async function changeRole(userId, currentRole) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!confirm(`Change role to "${newRole}"?`)) return;
    try {
      await api(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      showToast(`Role updated to ${newRole}`, 'success');
      fetchUsers();
    } catch (err) {
      showToast('Failed to update role: ' + err.message, 'error');
    }
  }

  /* ============================================
     SUBSCRIPTIONS TAB
     ============================================ */
  let subsPage      = 1;
  const subsPerPage = 15;
  let subsTotal     = 0;
  let subsFilter    = '';

  const subsFilterSelect = document.getElementById('subs-filter');
  if (subsFilterSelect) {
    subsFilterSelect.addEventListener('change', (e) => {
      subsFilter = e.target.value;
      subsPage   = 1;
      fetchSubscriptions();
    });
  }

  document.getElementById('subs-prev')?.addEventListener('click', () => {
    if (subsPage > 1) { subsPage--; fetchSubscriptions(); }
  });
  document.getElementById('subs-next')?.addEventListener('click', () => {
    if (subsPage * subsPerPage < subsTotal) { subsPage++; fetchSubscriptions(); }
  });

  async function fetchSubscriptions() {
    const container = document.getElementById('subs-table-body');
    showTableLoading(container, 6);

    try {
      const params = new URLSearchParams({ page: subsPage, limit: subsPerPage });
      if (subsFilter) params.set('status', subsFilter);

      const data = await api(`/api/admin/subscriptions?${params}`);
      const subs = data.subscriptions || data.data || data || [];
      subsTotal  = data.total || subs.length;

      renderTable(
        ['User', 'Plan', 'Status', 'Amount', 'Current Period', 'Created'],
        subs.map(s => [
          s.userEmail || s.user?.email || '—',
          s.plan || s.planName || 'Pro',
          statusBadge(s.status),
          formatCurrency(s.amount || s.amountCents),
          s.currentPeriodEnd ? formatDate(s.currentPeriodEnd) : '—',
          formatDate(s.createdAt),
        ]),
        container,
        true,
      );

      updatePagination('subs', subsPage, subsPerPage, subsTotal);
    } catch (err) {
      showTableError(container, err.message);
    }
  }

  /* ============================================
     USAGE TAB
     ============================================ */
  async function fetchUsage() {
    try {
      const data = await api('/api/admin/usage');

      // Summary metrics
      setStatCard('usage-scrapes-today',  data.scrapesToday   ?? '—');
      setStatCard('usage-scrapes-month',  data.scrapesMonth   ?? '—');
      setStatCard('usage-exports-today',  data.exportsToday   ?? '—');
      setStatCard('usage-exports-month',  data.exportsMonth   ?? '—');
      setStatCard('usage-ai-today',       data.aiQueriesToday ?? '—');
      setStatCard('usage-ai-month',       data.aiQueriesMonth ?? '—');

      // Bar charts
      renderBarChart(data.scrapesByDay   || [], document.getElementById('scrapes-chart'));
      renderBarChart(data.exportsByDay   || [], document.getElementById('exports-chart'));
    } catch (err) {
      showToast('Failed to load usage: ' + err.message, 'error');
    }
  }

  /* ============================================
     INSTALLS TAB
     ============================================ */
  async function fetchInstalls() {
    try {
      const data = await api('/api/admin/installs');

      setStatCard('stat-total-installs', data.total ?? data.totalInstalls ?? '—');

      renderTable(
        ['Date', 'Browser', 'Version', 'Platform'],
        (data.installs || data.recent || []).map(i => [
          formatDate(i.createdAt || i.date),
          i.browser || '—',
          i.version  || '—',
          i.platform || '—',
        ]),
        document.getElementById('installs-table-body'),
      );

      renderBarChart(data.byDay || data.installsByDay || [], document.getElementById('installs-chart'));
    } catch (err) {
      showToast('Failed to load installs: ' + err.message, 'error');
    }
  }

  /* ============================================
     HELPERS
     ============================================ */

  /**
   * Render a table into tbody element.
   * @param {string[]} headers - column header names (for empty state colspan)
   * @param {Array<Array<string>>} rows - each row is an array of cell values
   * @param {HTMLElement} tbody
   * @param {boolean} allowHTML - whether to use innerHTML for cells
   */
  function renderTable(headers, rows, tbody, allowHTML = false) {
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!rows || rows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = headers.length;
      td.className = 'table-empty';
      td.textContent = 'No data found.';
      tr.appendChild(td);
      tbody.appendChild(tr);
      return;
    }

    rows.forEach(row => {
      const tr = document.createElement('tr');
      row.forEach(cell => {
        const td = document.createElement('td');
        if (allowHTML) {
          td.innerHTML = cell ?? '—';
        } else {
          td.textContent = cell ?? '—';
        }
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function showTableLoading(tbody, cols) {
    if (!tbody) return;
    tbody.innerHTML = `
      <tr>
        <td colspan="${cols}" style="text-align:center;padding:2rem;color:var(--gray-400);">
          <span class="spinner spinner-dark"></span>
        </td>
      </tr>`;
  }

  function showTableError(tbody, msg) {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="10" class="table-empty">Error: ${msg}</td></tr>`;
  }

  function updatePagination(prefix, page, perPage, total) {
    const info = document.getElementById(`${prefix}-page-info`);
    const prev = document.getElementById(`${prefix}-prev`);
    const next = document.getElementById(`${prefix}-next`);

    if (info) {
      const start = Math.min((page - 1) * perPage + 1, total);
      const end   = Math.min(page * perPage, total);
      info.textContent = total > 0 ? `${start}–${end} of ${total}` : 'No results';
    }
    if (prev) prev.disabled = page <= 1;
    if (next) next.disabled = page * perPage >= total;
  }

  /**
   * Render a horizontal bar chart from [{label, value}] data.
   */
  function renderBarChart(data, container) {
    if (!container) return;
    container.innerHTML = '';

    if (!data || data.length === 0) {
      container.innerHTML = '<p style="padding:1rem;color:var(--gray-400);font-style:italic;">No data available.</p>';
      return;
    }

    const max = Math.max(...data.map(d => Number(d.value || d.count || 0)), 1);

    data.forEach(item => {
      const value = Number(item.value || item.count || 0);
      const pct   = (value / max) * 100;

      const row = document.createElement('div');
      row.className = 'bar-row';
      row.innerHTML = `
        <span class="bar-label">${item.label || item.date || item.day || ''}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${pct}%"></div>
        </div>
        <span class="bar-value">${value}</span>
      `;
      container.appendChild(row);
    });
  }

  /* ---- Badges ---- */
  function roleBadge(role) {
    return role === 'admin'
      ? '<span class="badge badge-admin">Admin</span>'
      : '<span class="badge badge-user">User</span>';
  }

  function statusBadge(status) {
    const s = (status || 'inactive').toLowerCase();
    const cls = (s === 'active' || s === 'trialing') ? 'badge-active' : 'badge-inactive';
    return `<span class="badge ${cls}">${s}</span>`;
  }

  function truncateId(id) {
    if (!id) return '—';
    const s = String(id);
    return s.length > 8 ? '…' + s.slice(-8) : s;
  }

});
