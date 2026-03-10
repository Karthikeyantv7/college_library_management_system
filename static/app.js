/* ============================================================
   LIBRA MANAGER — app.js
   All application logic: data store, navigation, CRUD,
   issue/return/fine management, Chart.js with animations,
   counter animation, toast notifications.
   ============================================================ */

// ============================================================
// DARK / LIGHT THEME
// ============================================================
function toggleDashboardTheme() {
  const html = document.getElementById('htmlRoot');
  const icon = document.getElementById('dashThemeIcon');
  const label = document.getElementById('dashThemeLabel');

  const isLight = html.classList.toggle('light');
  if (isLight) {
    html.classList.remove('dark');
    localStorage.setItem('lm-theme', 'light');
    if (icon) icon.textContent = '☀️';
    if (label) label.textContent = 'Light';
  } else {
    html.classList.add('dark');
    localStorage.setItem('lm-theme', 'dark');
    if (icon) icon.textContent = '🌙';
    if (label) label.textContent = 'Dark';
  }
}

// Sync button label on load
(function syncThemeBtn() {
  const html = document.getElementById('htmlRoot');
  const icon = document.getElementById('dashThemeIcon');
  const label = document.getElementById('dashThemeLabel');
  const isLight = html.classList.contains('light');
  if (isLight) html.classList.remove('dark');
  if (!isLight && !html.classList.contains('dark')) html.classList.add('dark');

  if (icon) icon.textContent = isLight ? '☀️' : '🌙';
  if (label) label.textContent = isLight ? 'Light' : 'Dark';
})();

// ============================================================
// AUTH CHECK
// ============================================================
(function checkAuth() {
  const isLoginPage = window.location.pathname.endsWith('/login') || window.location.pathname.endsWith('login.html');
  const isIndexPage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html');

  if (!isLoginPage && !isIndexPage) {
    if (!localStorage.getItem('activeUser')) {
      window.location.href = '/login';
    }
  }
})();

// ============================================================
// DATA STORE
// ============================================================
// Defaults removed to avoid fake data


let books = [];
let students = [];
let faculty = [];
let issues = [];
let bookRequests = [];
let adminsList = [];

const FINE_PER_DAY = 5; // ₹5 per day

async function loadData() {
  try {
    const [bRes, sRes, fRes, iRes, reqRes, adminRes] = await Promise.all([
      fetch('/api/books'),
      fetch('/api/students'),
      fetch('/api/faculty'),
      fetch('/api/issues'),
      fetch('/api/book-requests'),
      fetch('/api/admins')
    ]);

    if (bRes.ok) books = await bRes.json();
    if (sRes.ok) students = await sRes.json();
    if (fRes.ok) faculty = await fRes.json();
    if (iRes.ok) issues = await iRes.json();
    if (adminRes && adminRes.ok) adminsList = await adminRes.json();
    if (reqRes && reqRes.ok) {
      const newRequests = await reqRes.json();

      let hasNewNotifs = false;
      const activePending = newRequests.filter(req => req.status === 'PENDING_APPROVAL');
      activePending.forEach(req => {
        const key = `notified_admin_req_${req.id}`;
        if (!localStorage.getItem(key)) {
          showToast(`New Book Request: ${req.bookTitle} by ${req.userId}`, 'info');
          localStorage.setItem(key, 'true');
          hasNewNotifs = true;
        }
      });
      bookRequests = newRequests;

      // Update dropdown UI and badge
      renderNotifications();
      if (hasNewNotifs) {
        const badge = document.getElementById('notifBadge');
        if (badge) badge.classList.remove('hidden');
      }
    }
  } catch (err) {
    console.error("Failed to load data from API", err);
    showToast('Failed to connect to server', 'error');
  }

  // Polling every 15s to check for new requests
  if (!window.pollIntervalSet) {
    setInterval(loadData, 15000);
    window.pollIntervalSet = true;
  }
}

function logoutUser() {
  localStorage.removeItem('activeUser');
  localStorage.removeItem('activeUserName');
  window.location.href = '/login';
}

// ============================================================
// NAVIGATION
// ============================================================
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  books: 'Books Management',
  students: 'Students Management',
  faculty: 'Faculty Management',
  issue: 'Issue Book',
  return: 'Return Book',
  history: 'Issue History',
  fines: 'Fine Report',
  addadmin: 'Manage Admins',
};

let currentSection = 'dashboard';
let barChartInst = null;
let pieChartInst = null;

// ============================================================
// NOTIFICATIONS
// ============================================================
function toggleNotificationsPanel() {
  const panel = document.getElementById('notifPanel');
  panel.classList.toggle('hidden');

  // Clear the badge when opened
  const badge = document.getElementById('notifBadge');
  if (badge) badge.classList.add('hidden');
}

function renderNotifications() {
  const notifList = document.getElementById('notifList');
  const badge = document.getElementById('notifBadge');
  if (!notifList) return;

  // Sort by requestDate descending (newest first)
  const sortedRequests = [...bookRequests].sort((a, b) => {
    const da = new Date(a.requestDate || a.request_date || 0);
    const db2 = new Date(b.requestDate || b.request_date || 0);
    return db2 - da;
  });

  if (sortedRequests.length === 0) {
    notifList.innerHTML = `<div class="px-4 py-3 text-sm text-slate-400 text-center">No new notifications</div>`;
    return;
  }

  notifList.innerHTML = sortedRequests.map(r => {
    const isPending = r.status === 'PENDING_APPROVAL';
    const isApproved = r.status === 'APPROVED';
    const isRejected = r.status === 'REJECTED';
    let color = isPending ? 'text-amber-400' : (isApproved ? 'text-emerald-400' : (isRejected ? 'text-red-400' : 'text-slate-400'));
    let icon = isPending ? '🔔' : (isApproved ? '✅' : (isRejected ? '❌' : '📋'));
    const rawDate = r.requestDate || r.request_date || '';
    // Format: show date + time if available
    let dateStr = rawDate;
    if (rawDate && rawDate.length >= 10) {
      const parts = rawDate.split(' ');
      const datePart = parts[0]; // YYYY-MM-DD
      const timePart = parts[1] || ''; // HH:MM or empty
      const d = new Date(datePart);
      const formatted = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      dateStr = timePart ? `${formatted}, ${timePart}` : formatted;
    }
    return `
      <div class="px-4 py-3 border-b border-slate-700 hover:bg-slate-700/30 cursor-pointer">
        <div class="flex items-start gap-2">
          <span class="text-sm mt-0.5">${icon}</span>
          <div class="flex-1 min-w-0">
            <p class="text-xs text-white break-words"><span class="font-bold">${r.userId}</span> requested <span class="text-indigo-300">${r.bookTitle}</span></p>
            <div class="flex items-center justify-between mt-1">
              <span class="text-[10px] ${color} font-medium">${r.status.replace(/_/g, ' ')}</span>
              <span class="text-[10px] text-slate-500">${dateStr}</span>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}

function showSection(name) {
  // Hide all sections
  document.querySelectorAll('.section-content').forEach(s => s.classList.add('hidden'));

  // Reset all nav links
  document.querySelectorAll('.nav-link').forEach(n => {
    n.classList.remove('bg-indigo-600', 'text-white', 'active-nav');
    n.classList.add('text-slate-300');
  });

  // Show target section with animation
  const sec = document.getElementById('sec-' + name);
  const nav = document.getElementById('nav-' + name);

  if (sec) {
    sec.classList.remove('hidden', 'fade-in');
    void sec.offsetWidth; // reflow to restart animation
    sec.classList.add('fade-in');
  }

  if (nav) {
    nav.classList.add('bg-indigo-600', 'text-white', 'active-nav');
    nav.classList.remove('text-slate-300');
  }

  document.getElementById('pageTitle').textContent = PAGE_TITLES[name] || name;
  currentSection = name;
  closeSidebar();

  // Section-specific render
  if (name === 'dashboard') refreshDashboard();
  if (name === 'books') renderBooks();
  if (name === 'students') renderStudents();
  if (name === 'faculty') renderFaculty();
  if (name === 'requests') renderRequests();
  if (name === 'issue') populateIssueDropdowns();
  if (name === 'history') renderHistory();
  if (name === 'fines') renderFines();
  if (name === 'addadmin') renderAdmins();
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('overlay');
  const isHidden = sb.classList.contains('-translate-x-full');
  sb.classList.toggle('-translate-x-full', !isHidden);
  ov.classList.toggle('hidden', !isHidden);
}

function closeSidebar() {
  document.getElementById('sidebar').classList.add('-translate-x-full');
  document.getElementById('overlay').classList.add('hidden');
}

// ============================================================
// ANIMATED COUNTER
// ============================================================
function animateCounter(el, target, duration = 800) {
  const start = performance.now();
  const startVal = 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(startVal + (target - startVal) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ============================================================
// DASHBOARD
// ============================================================
function refreshDashboard() {
  const totalBooks = books.reduce((s, b) => s + b.copies, 0);
  const availBooks = books.reduce((s, b) => s + b.available, 0);
  const totalMembers = students.length + faculty.length;
  const activeIssues = issues.filter(i => i.status === 'active').length;

  // Animated counters
  animateCounter(document.getElementById('stat-totalBooks'), totalBooks, 900);
  animateCounter(document.getElementById('stat-availBooks'), availBooks, 850);
  animateCounter(document.getElementById('stat-totalStudents'), totalMembers, 800);
  animateCounter(document.getElementById('stat-issuedBooks'), activeIssues, 700);

  renderRecentActivity();

  // For the pie chart: "Issued" = number of currently active issued books, "Available" = total available copies
  const issuedCount = issues.filter(i => i.status === 'active').length;
  initCharts(availBooks, issuedCount);
}

function renderRecentActivity() {
  const container = document.getElementById('recentActivity');
  const recent = [...issues].reverse().slice(0, 5);

  if (!recent.length) {
    container.innerHTML = '<p class="text-slate-500 text-sm text-center py-8">No activity yet.</p>';
    return;
  }

  container.innerHTML = recent.map(i => `
    <div class="activity-item flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-700 transition-all hover:border-indigo-500/40">
      <div class="w-8 h-8 rounded-lg ${i.status === 'active' ? 'bg-indigo-600/20' : 'bg-emerald-600/20'} flex items-center justify-center flex-shrink-0">
        <svg class="w-4 h-4 ${i.status === 'active' ? 'text-indigo-400' : 'text-emerald-400'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${i.status === 'active' ? 'M12 9v3m0 0v3m0-3h3m-3 0H9' : 'M9 12l2 2 4-4'}"/>
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-white truncate">${i.bookTitle}</p>
        <p class="text-xs text-slate-400">${i.borrower} &bull; ${i.issueDate}</p>
      </div>
      <span class="badge ${i.status === 'active' ? 'bg-indigo-600/20 text-indigo-400 badge-pulse' : 'bg-emerald-600/20 text-emerald-400'}">
        ${i.status === 'active' ? 'Active' : 'Returned'}
      </span>
    </div>
  `).join('');
}

// ============================================================
// CHARTS (with Chart.js animations)
// ============================================================
function initCharts(avail, issued) {
  const barCtx = document.getElementById('barChart').getContext('2d');
  const pieCtx = document.getElementById('pieChart').getContext('2d');

  if (barChartInst) barChartInst.destroy();
  if (pieChartInst) pieChartInst.destroy();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = new Array(12).fill(0);
  issues.forEach(i => {
    if (i.issueDate) {
      const m = parseInt(i.issueDate.split('-')[1], 10) - 1;
      if (!isNaN(m) && m >= 0 && m < 12) data[m]++;
    }
  });

  // Bar chart — animated bars rising one-by-one (delayBetweenPoints)
  barChartInst = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{
        label: 'Books Issued',
        data,
        backgroundColor: (ctx) => {
          // gradient fill per bar
          const grad = ctx.chart.ctx.createLinearGradient(0, 0, 0, 280);
          grad.addColorStop(0, 'rgba(99,102,241,0.85)');
          grad.addColorStop(1, 'rgba(99,102,241,0.25)');
          return grad;
        },
        borderColor: '#6366f1',
        borderWidth: 1,
        borderRadius: 7,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 900,
        easing: 'easeOutQuart',
        delay: (ctx) => ctx.dataIndex * 55, // stagger each bar
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          borderColor: '#334155',
          borderWidth: 1,
          titleColor: '#f8fafc',
          bodyColor: '#94a3b8',
          padding: 10,
          callbacks: {
            label: ctx => ` ${ctx.parsed.y} books issued`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#94a3b8', font: { size: 11 } },
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#94a3b8', font: { size: 11 } },
          beginAtZero: true,
        },
      },
    },
  });

  // Doughnut chart — rotates in on load
  pieChartInst = new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: ['Available', 'Issued'],
      datasets: [{
        data: [avail || 1, issued || 0],
        backgroundColor: ['rgba(52,211,153,0.85)', 'rgba(99,102,241,0.85)'],
        borderColor: ['#10b981', '#6366f1'],
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 900,
        easing: 'easeOutBack',
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#94a3b8',
            font: { size: 12 },
            padding: 14,
            usePointStyle: true,
            pointStyleWidth: 10,
          },
        },
        tooltip: {
          backgroundColor: '#1e293b',
          borderColor: '#334155',
          borderWidth: 1,
          titleColor: '#f8fafc',
          bodyColor: '#94a3b8',
          padding: 10,
        },
      },
      cutout: '68%',
    },
  });
}

// ============================================================
// BOOKS
// ============================================================
async function addBook(e) {
  e.preventDefault();
  const btn = document.getElementById('addBookBtn');
  btn.classList.add('btn-loading');

  const newBook = {
    title: document.getElementById('bTitle').value.trim(),
    author: document.getElementById('bAuthor').value.trim(),
    isbn: document.getElementById('bIsbn').value.trim(),
    genre: document.getElementById('bGenre').value,
    copies: parseInt(document.getElementById('bCopies').value),
    available: parseInt(document.getElementById('bCopies').value),
  };

  try {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBook)
    });

    if (res.ok) {
      const addedBook = await res.json();
      books.push(addedBook);
      document.getElementById('bookForm').reset();
      renderBooks();
      showToast('Book added successfully!', 'success');
      refreshDashboard();
    } else {
      showToast('Failed to add book', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  } finally {
    btn.classList.remove('btn-loading');
  }
}

function renderBooks() {
  const q = (document.getElementById('bookSearch')?.value || '').toLowerCase();
  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(q) ||
    b.author.toLowerCase().includes(q) ||
    b.genre.toLowerCase().includes(q));

  const tbody = document.getElementById('bookTableBody');
  const empty = document.getElementById('bookEmptyState');

  if (!filtered.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  tbody.innerHTML = filtered.map(b => `
    <tr class="hover:bg-slate-700/30 transition-colors">
      <td class="px-4 py-3 font-medium text-white">${b.title}</td>
      <td class="px-4 py-3 text-slate-400">${b.author}</td>
      <td class="px-4 py-3"><span class="badge bg-slate-700 text-slate-300">${b.genre}</span></td>
      <td class="px-4 py-3 text-center text-slate-300">${b.copies}</td>
      <td class="px-4 py-3 text-center">
        <span class="badge ${b.available > 0 ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'}">${b.available}</span>
      </td>
      <td class="px-4 py-3 text-center space-x-2">
        <button onclick="editBook('${b.id}')" class="text-indigo-400 hover:text-indigo-300 text-xs font-medium hover:underline">Edit</button>
        <button onclick="deleteBook('${b.id}')" class="text-red-400 hover:text-red-300 text-xs font-medium hover:underline">Delete</button>
      </td>
    </tr>`).join('');
}

async function editBook(id) {
  const b = books.find(x => x.id === id);
  if (!b) return;
  const newCopies = prompt(`Update total copies for '${b.title}':`, b.copies);
  if (newCopies === null || isNaN(newCopies) || newCopies === '') return;

  try {
    const res = await fetch(`/api/books/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ copies: parseInt(newCopies) })
    });
    if (res.ok) {
      showToast('Book updated.', 'success');
      await loadData();
      renderBooks();
      refreshDashboard();
    } else {
      showToast('Failed to update book.', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}
async function deleteBook(id) {
  if (!confirm('Are you sure you want to delete this book?')) return;

  try {
    const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
    if (res.ok) {
      books = books.filter(b => b.id !== id);
      renderBooks();
      refreshDashboard();
      showToast('Book deleted.', 'error');
    } else {
      showToast('Failed to delete book.', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

// ============================================================
// STUDENTS
// ============================================================
async function addStudent(e) {
  e.preventDefault();
  const newStudent = {
    name: document.getElementById('sName').value.trim(),
    roll: document.getElementById('sRoll').value.trim(),
    email: document.getElementById('sEmail').value.trim(),
    dept: document.getElementById('sDept').value,
  };

  try {
    const res = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStudent)
    });

    if (res.ok) {
      const added = await res.json();
      students.push(added);
      document.getElementById('studentForm').reset();
      renderStudents();
      refreshDashboard();
      showToast('Student registered!', 'success');
    } else {
      showToast('Failed to register student', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

function renderStudents() {
  const tbody = document.getElementById('studentTableBody');
  document.getElementById('studentCount').textContent = students.length + ' students';

  tbody.innerHTML = students.map(s => `
    <tr class="hover:bg-slate-700/30 transition-colors">
      <td class="px-4 py-3 font-medium text-white">${s.name}</td>
      <td class="px-4 py-3 text-slate-400">${s.roll}</td>
      <td class="px-4 py-3 text-slate-400">${s.email}</td>
      <td class="px-4 py-3"><span class="badge bg-slate-700 text-slate-300">${s.dept}</span></td>
      <td class="px-4 py-3 text-center">
        <button onclick="deleteStudent(${s.id})" class="text-red-400 hover:text-red-300 text-xs font-medium hover:underline">Remove</button>
      </td>
    </tr>`).join('')
    || '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">No students yet.</td></tr>';
}

async function deleteStudent(id) {
  if (!confirm('Are you sure you want to remove this student?')) return;

  try {
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' });
    if (res.ok) {
      students = students.filter(s => s.id !== id);
      renderStudents();
      refreshDashboard();
      showToast('Student removed.', 'error');
    } else {
      showToast('Failed to remove student.', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

// ============================================================
// FACULTY
// ============================================================
async function addFaculty(e) {
  e.preventDefault();
  const newFaculty = {
    name: document.getElementById('fName').value.trim(),
    empId: document.getElementById('fEmpId').value.trim(),
    email: document.getElementById('fEmail').value.trim(),
    dept: document.getElementById('fDept').value,
  };

  try {
    const res = await fetch('/api/faculty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFaculty)
    });

    if (res.ok) {
      const added = await res.json();
      faculty.push(added);
      document.getElementById('facultyForm').reset();
      renderFaculty();
      refreshDashboard();
      showToast('Faculty member added!', 'success');
    } else {
      showToast('Failed to add faculty member', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

function renderFaculty() {
  const tbody = document.getElementById('facultyTableBody');
  document.getElementById('facultyCount').textContent = faculty.length + ' members';

  tbody.innerHTML = faculty.map(f => `
    <tr class="hover:bg-slate-700/30 transition-colors">
      <td class="px-4 py-3 font-medium text-white">${f.name}</td>
      <td class="px-4 py-3 text-slate-400">${f.empId}</td>
      <td class="px-4 py-3 text-slate-400">${f.email}</td>
      <td class="px-4 py-3"><span class="badge bg-slate-700 text-slate-300">${f.dept}</span></td>
      <td class="px-4 py-3 text-center">
        <button onclick="deleteFaculty(${f.id})" class="text-red-400 hover:text-red-300 text-xs font-medium hover:underline">Remove</button>
      </td>
    </tr>`).join('')
    || '<tr><td colspan="5" class="px-4 py-8 text-center text-slate-500">No faculty yet.</td></tr>';
}

async function deleteFaculty(id) {
  if (!confirm('Are you sure you want to remove this faculty member?')) return;

  try {
    const res = await fetch(`/api/faculty/${id}`, { method: 'DELETE' });
    if (res.ok) {
      faculty = faculty.filter(f => f.id !== id);
      renderFaculty();
      refreshDashboard();
      showToast('Faculty removed.', 'error');
    } else {
      showToast('Failed to remove faculty.', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

// ============================================================
// BOOK REQUESTS
// ============================================================
function renderRequests() {
  const tbody = document.getElementById('requestTableBody');
  document.getElementById('requestCount').textContent = bookRequests.filter(req => req.status === 'PENDING_APPROVAL').length + ' pending';

  tbody.innerHTML = bookRequests.map(req => {
    let actionButtons = '';
    let statusBadge = '';

    if (req.status === 'PENDING_APPROVAL') {
      statusBadge = `<span class="badge bg-amber-600/20 text-amber-400">Pending</span>`;
      actionButtons = `
        <button onclick="approveRequest(${req.id})" class="text-emerald-400 hover:text-emerald-300 text-xs font-medium px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors">Approve</button>
        <button onclick="rejectRequest(${req.id})" class="text-red-400 hover:text-red-300 text-xs font-medium px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors">Reject</button>
      `;
    } else if (req.status === 'APPROVED') {
      statusBadge = `<span class="badge bg-emerald-600/20 text-emerald-400">Approved</span>`;
      actionButtons = `
        <button onclick="issueRequestedBook(${req.id})" class="text-indigo-400 hover:text-indigo-300 text-xs font-medium px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors">Issue Book</button>
      `;
    } else if (req.status === 'REJECTED') {
      statusBadge = `<span class="badge bg-red-600/20 text-red-400">Rejected</span>`;
      actionButtons = `<span class="text-xs text-slate-500">-</span>`;
    } else if (req.status === 'ISSUED') {
      statusBadge = `<span class="badge bg-indigo-600/20 text-indigo-400">Issued</span>`;
      actionButtons = `<span class="text-xs text-slate-500">-</span>`;
    }

    return `
      <tr class="hover:bg-slate-700/30 transition-colors border-b border-slate-700">
        <td class="px-4 py-3 font-mono text-indigo-400 font-medium">${req.id}</td>
        <td class="px-4 py-3 font-medium text-white">${req.bookTitle}</td>
        <td class="px-4 py-3 text-slate-400">${req.userId}</td>
        <td class="px-4 py-3 text-slate-400 capitalize">${req.role}</td>
        <td class="px-4 py-3 text-slate-400">${req.requestDate}</td>
        <td class="px-4 py-3">${statusBadge}</td>
        <td class="px-4 py-3 text-center space-x-2">${actionButtons}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">No book requests found.</td></tr>';
}

async function approveRequest(id) {
  try {
    const res = await fetch(`/api/approve-request/${id}`, { method: 'PUT' });
    const data = await res.json();

    if (res.ok) {
      showToast('Request Approved', 'success');
      await loadData();
      renderRequests();
      refreshDashboard();
    } else {
      showToast(data.error || 'Failed to approve', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

async function rejectRequest(id) {
  if (!confirm('Are you sure you want to reject this request?')) return;
  try {
    const res = await fetch(`/api/reject-request/${id}`, { method: 'PUT' });
    const data = await res.json();

    if (res.ok) {
      showToast('Request Rejected', 'success');
      await loadData();
      renderRequests();
    } else {
      showToast(data.error || 'Failed to reject', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

async function issueRequestedBook(id) {
  try {
    const res = await fetch(`/api/issue-book/${id}`, { method: 'PUT' });
    const data = await res.json();

    if (res.ok) {
      showToast('Book Physically Issued', 'success');
      await loadData();
      renderRequests();
      refreshDashboard();
    } else {
      showToast(data.error || 'Failed to issue', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

// ============================================================
// RETURN BOOK
// ============================================================
let currentReturnIssue = null;

function lookupIssue() {
  const id = document.getElementById('returnIssueId').value.trim().toUpperCase();
  const issue = issues.find(i => i.id === id && i.status === 'active');
  const details = document.getElementById('returnDetails');
  const success = document.getElementById('returnSuccessAlert');

  success.classList.add('hidden');
  document.getElementById('confirmReturnBtn').classList.remove('hidden');

  if (!issue) {
    details.classList.add('hidden');
    showToast('Issue ID not found or already returned.', 'error');
    return;
  }

  currentReturnIssue = issue;
  const { overdue, fine } = calcFine(issue);

  document.getElementById('retBook').textContent = issue.bookTitle;
  document.getElementById('retBorrower').textContent = issue.borrower;
  document.getElementById('retIssueDate').textContent = issue.issueDate;
  document.getElementById('retDue').textContent = issue.dueDate;
  document.getElementById('retOverdueDays').textContent = overdue > 0 ? overdue + ' days' : 'On time ✓';
  document.getElementById('retFine').textContent = '₹' + fine;

  details.classList.remove('hidden');
}

async function confirmReturn() {
  if (!currentReturnIssue) return;

  try {
    const res = await fetch(`/api/issues/${currentReturnIssue.id}`, { method: 'PUT' });
    if (res.ok) {
      const updated = await res.json();
      const idx = issues.findIndex(i => i.id === updated.id);
      if (idx > -1) issues[idx] = updated;

      const book = books.find(b => b.id === updated.bookId);
      if (book) book.available++;

      document.getElementById('returnSuccessAlert').classList.remove('hidden');
      document.getElementById('returnSuccessAlert').classList.add('alert-pop');
      document.getElementById('confirmReturnBtn').classList.add('hidden');
      currentReturnIssue = null;
      refreshDashboard();
      showToast('Book returned successfully!', 'success');
    } else {
      showToast('Failed to return book.', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

// ============================================================
// ISSUE HISTORY
// ============================================================
function renderHistory() {
  const filter = document.getElementById('historyFilter').value;
  const filtered = issues.filter(i => filter === 'all' || i.status === filter);
  const tbody = document.getElementById('historyTableBody');

  tbody.innerHTML = filtered.map(i => `
    <tr class="hover:bg-slate-700/30 transition-colors">
      <td class="px-4 py-3 font-mono text-indigo-400 font-medium">${i.id}</td>
      <td class="px-4 py-3 font-medium text-white">${i.bookTitle}</td>
      <td class="px-4 py-3 text-slate-400">${i.borrower}</td>
      <td class="px-4 py-3 text-slate-400">${i.issueDate}</td>
      <td class="px-4 py-3 text-slate-400">${i.dueDate}</td>
      <td class="px-4 py-3">
        <span class="badge ${i.status === 'active' ? 'bg-amber-600/20 text-amber-400 badge-pulse' : 'bg-emerald-600/20 text-emerald-400'}">
          ${i.status === 'active' ? 'Active' : 'Returned'}
        </span>
      </td>
    </tr>`).join('')
    || '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">No records found.</td></tr>';
}

// ============================================================
// FINES
// ============================================================
function calcFine(issue) {
  if (!issue || !issue.dueDate) return { overdue: 0, fine: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = issue.dueDate.split('-');
  if (parts.length !== 3) return { overdue: 0, fine: 0 };
  const due = new Date(parts[0], parts[1] - 1, parts[2]);
  due.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let overdue = 0;
  // Let fine grow only if active. If returned, and we don't have returnDate, assume paid/resolved.
  if (issue.status === 'active') {
    overdue = Math.max(0, diffDays);
  }

  return { overdue, fine: overdue * FINE_PER_DAY };
}

function renderFines() {
  const filter = document.getElementById('fineFilter').value;

  const overduePending = issues.filter(i => i.status === 'active' && calcFine(i).overdue > 0);
  const returned = issues.filter(i => i.status === 'returned' && i.finePaid);

  let pendingTotal = 0, collectedTotal = 0;
  overduePending.forEach(i => { pendingTotal += calcFine(i).fine; });
  returned.forEach(i => { collectedTotal += calcFine(i).fine; }); // if any

  // Animate fine stats
  animateCounter(document.getElementById('fStatOverdue'), overduePending.length, 600);
  document.getElementById('fStatCollected').textContent = '₹' + collectedTotal;
  document.getElementById('fStatPending').textContent = '₹' + pendingTotal;

  const rows = issues.filter(i => {
    const { overdue } = calcFine(i);
    // Filter conditions for Fine Report Table
    if (filter === 'paid') return i.finePaid;
    if (filter === 'unpaid') return (!i.finePaid && overdue > 0 && i.status === 'active');
    // If 'all', show records that are either overdue or have been paid
    return overdue > 0 || i.finePaid;
  });

  const tbody = document.getElementById('fineTableBody');
  tbody.innerHTML = rows.map(i => {
    const { overdue, fine } = calcFine(i);
    const isOverdue = overdue > 0;
    return `
      <tr class="${isOverdue ? 'overdue-row' : ''} hover:bg-slate-700/30 transition-colors">
        <td class="px-4 py-3 font-mono ${isOverdue ? 'text-red-400' : 'text-indigo-400'} font-medium">${i.id}</td>
        <td class="px-4 py-3 font-medium text-white">${i.bookTitle}</td>
        <td class="px-4 py-3 text-slate-400">${i.borrower}</td>
        <td class="px-4 py-3 ${isOverdue ? 'text-red-400 font-bold' : 'text-slate-400'}">${overdue > 0 ? overdue + ' days' : 'On time'}</td>
        <td class="px-4 py-3 font-bold ${fine > 0 ? 'text-amber-400' : 'text-slate-500'}">₹${fine}</td>
        <td class="px-4 py-3">
          <span class="badge ${i.finePaid ? 'bg-emerald-600/20 text-emerald-400' : 'bg-red-600/20 text-red-400'}">
            ${i.finePaid ? 'Paid' : 'Unpaid'}
          </span>
        </td>
      </tr>`;
  }).join('') || '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">No fine records.</td></tr>';
}

// ============================================================
// TOAST NOTIFICATION (animated)
// ============================================================
function showToast(msg, type = 'success') {
  const palette = {
    success: { bg: '#059669', icon: '✓' },
    error: { bg: '#dc2626', icon: '✕' },
    info: { bg: '#4f46e5', icon: 'ℹ' },
  };
  const { bg, icon } = palette[type] || palette.success;

  const toast = document.createElement('div');
  toast.className = 'toast-enter fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-white text-sm font-medium shadow-2xl';
  toast.style.cssText = `background:${bg};min-width:220px;`;
  toast.innerHTML = `
    <span class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold flex-shrink-0">${icon}</span>
    <span>${msg}</span>`;

  document.body.appendChild(toast);

  // Fade out after 3s
  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    setTimeout(() => toast.remove(), 320);
  }, 3000);
}

// ============================================================
// LOGOUT & ADD ADMIN
// ============================================================
function renderAdmins() {
  const tbody = document.getElementById('adminsTableBody');
  const badge = document.getElementById('adminCountBadge');
  if (!tbody) return;

  if (badge) badge.textContent = `${adminsList.length} Total`;

  tbody.innerHTML = adminsList.map(a => `
    <tr class="hover:bg-slate-700/30 transition-colors">
      <td class="px-4 py-3 font-mono text-indigo-400 font-medium">#${a.id}</td>
      <td class="px-4 py-3 font-medium text-white">${a.name}</td>
      <td class="px-4 py-3 text-slate-400 text-right">${a.created_at || 'N/A'}</td>
    </tr>
  `).join('');
}

async function addAdminSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('addAdminSubmitBtn');
  const txt = btn.querySelector('.btn-text');
  btn.disabled = true;
  txt.textContent = 'Creating...';

  const name = document.getElementById('newAdminName').value.trim();
  const pass = document.getElementById('newAdminPass').value;

  try {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminName: name, password: pass })
    });

    if (res.ok) {
      document.getElementById('addAdminForm').reset();
      const alertEl = document.getElementById('addAdminAlert');
      document.getElementById('addAdminAlertText').textContent = `Admin '${name}' created successfully!`;
      alertEl.classList.remove('hidden');
      alertEl.classList.add('alert-pop');
      showToast('Admin Account Created', 'success');

      setTimeout(() => { alertEl.classList.add('hidden'); alertEl.classList.remove('alert-pop'); }, 4000);
    } else {
      showToast('Failed to create admin.', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  } finally {
    btn.disabled = false;
    txt.textContent = 'Create Admin Account';
  }
}

function logoutUser() {
  localStorage.removeItem('activeUser');
  localStorage.removeItem('activeRole');
  localStorage.removeItem('activeUserName');
  window.location.href = '/login';
}

// Attach to window so HTML can call it
window.logoutUser = logoutUser;

// ============================================================
// INITIALISE
// ============================================================
(async function init() {
  // Set date in header
  const now = new Date();
  document.getElementById('pageDate').textContent =
    now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Update sidebar and dashboard greeting username if available
  const activeUser = localStorage.getItem('activeUser');
  const activeUserName = localStorage.getItem('activeUserName');
  const displayName = activeUserName || activeUser;

  if (displayName) {
    const sidebarNameEl = document.getElementById('sidebarUserName');
    if (sidebarNameEl) {
      sidebarNameEl.textContent = displayName;
    }
    const greetingEl = document.getElementById('greetingName');
    if (greetingEl) {
      greetingEl.textContent = displayName;
    }
  }

  // Set minimum due date to today on Issue form
  const ISOtoday = now.toISOString().split('T')[0];
  const dueInput = document.getElementById('issueDue');
  if (dueInput) dueInput.min = ISOtoday;

  // Activate dashboard nav
  const nav = document.getElementById('nav-dashboard');
  if (nav) { nav.classList.add('bg-indigo-600', 'text-white', 'active-nav'); nav.classList.remove('text-slate-300'); }

  // Boot dashboard
  await loadData();
  refreshDashboard();
})();
