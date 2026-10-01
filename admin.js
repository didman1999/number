/* ===== admin.js - لوحة التحكم ===== */

const KEY_PASS     = 'admin_password';
const KEY_BOOKINGS = 'bookings';
const KEY_SCHEDULE = 'work_schedule';
const KEY_COUNTER  = 'bookingCounter';
const KEY_SESSION  = 'admin_session';
const DEFAULT_PASS = 'admin123';

// ===== INIT PASSWORD =====
if (!localStorage.getItem(KEY_PASS)) localStorage.setItem(KEY_PASS, DEFAULT_PASS);

// ===== WAIT FOR DOM =====
document.addEventListener('DOMContentLoaded', function () {

  // ===== DOM REFS =====
  const loginScreen    = document.getElementById('login-screen');
  const dashboard      = document.getElementById('dashboard');
  const adminPassEl    = document.getElementById('admin-pass');
  const loginBtn       = document.getElementById('login-btn');
  const loginError     = document.getElementById('login-error');
  const logoutBtn      = document.getElementById('logout-btn');
  const togglePassBtn  = document.getElementById('toggle-pass');
  const menuToggle     = document.getElementById('menu-toggle');
  const sidebar        = document.getElementById('sidebar');
  const pageTitle      = document.getElementById('page-title');
  const pageTime       = document.getElementById('page-time');
  const topStatusPill  = document.getElementById('top-status-pill');
  const topStatusLabel = document.getElementById('top-status-label');
  const toastEl        = document.getElementById('toast');
  const confirmOverlay = document.getElementById('confirm-overlay');
  const confirmOkBtn   = document.getElementById('confirm-ok');
  const confirmCancelBtn = document.getElementById('confirm-cancel');

  // ===== SESSION CHECK =====
  if (localStorage.getItem(KEY_SESSION) === '1') {
    showDashboard();
  } else {
    showLogin();
  }

  // ===== LOGIN FUNCTIONS =====
  function showLogin() {
    loginScreen.style.display = 'flex';
    dashboard.style.display = 'none';
    setTimeout(() => adminPassEl && adminPassEl.focus(), 300);
  }

  function showDashboard() {
    loginScreen.classList.add('hidden');
    setTimeout(() => { loginScreen.style.display = 'none'; }, 400);
    dashboard.style.display = 'flex';
    initDashboard();
  }

  function doLogin() {
    const pass = adminPassEl.value.trim();
    if (pass === localStorage.getItem(KEY_PASS)) {
      localStorage.setItem(KEY_SESSION, '1');
      loginError.classList.remove('show');
      showDashboard();
    } else {
      loginError.classList.add('show');
      adminPassEl.value = '';
      adminPassEl.focus();
    }
  }

  loginBtn.addEventListener('click', doLogin);
  adminPassEl.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
  });

  // ===== LOGOUT =====
  logoutBtn.addEventListener('click', function() {
    localStorage.removeItem(KEY_SESSION);
    location.reload();
  });

  // ===== SHOW / HIDE PASSWORD =====
  togglePassBtn.addEventListener('click', function() {
    const isPass = adminPassEl.type === 'password';
    adminPassEl.type = isPass ? 'text' : 'password';
    document.getElementById('eye-icon').innerHTML = isPass
      ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
      : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
  });

  // ===== NAVIGATION =====
  const sections = ['overview', 'bookings', 'schedule', 'settings'];
  const titleMap = {
    overview: 'نظرة عامة',
    bookings: 'الحجوزات',
    schedule: 'أوقات العمل',
    settings: 'الإعدادات'
  };

  window.switchSection = function(name) {
    sections.forEach(function(s) {
      document.getElementById('section-' + s).classList.toggle('active', s === name);
      document.getElementById('nav-' + s).classList.toggle('active', s === name);
    });
    pageTitle.textContent = titleMap[name];
    if (window.innerWidth <= 768) sidebar.classList.remove('open');
  };

  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      switchSection(item.dataset.section);
    });
  });

  menuToggle.addEventListener('click', function() {
    sidebar.classList.toggle('open');
  });

  document.addEventListener('click', function(e) {
    if (window.innerWidth <= 768 &&
        !sidebar.contains(e.target) &&
        e.target !== menuToggle &&
        !menuToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });

  // ===== HELPERS =====
  function getBookings() {
    return JSON.parse(localStorage.getItem(KEY_BOOKINGS) || '[]');
  }

  function getSchedule() {
    return JSON.parse(localStorage.getItem(KEY_SCHEDULE) || JSON.stringify({
      enabled: false,
      from: '08:00',
      to: '17:00',
      days: [0, 1, 2, 3, 4],
      message: ''
    }));
  }

  function formatDateTime(iso) {
    if (!iso) return '--';
    var d = new Date(iso);
    return d.toLocaleDateString('ar-EG') + ' ' + d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  }

  function isServiceOpen() {
    var s = getSchedule();
    if (!s.enabled) return true;
    var now = new Date();
    var day = now.getDay();
    if (!s.days.includes(day)) return false;
    var fParts = s.from.split(':').map(Number);
    var tParts = s.to.split(':').map(Number);
    var cur  = now.getHours() * 60 + now.getMinutes();
    var from = fParts[0] * 60 + fParts[1];
    var to   = tParts[0] * 60 + tParts[1];
    return cur >= from && cur < to;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatNationalId(id) {
    if (!id) return '<span style="color:#64748b">—</span>';
    return escHtml(id);
  }

  // ===== CLOCK =====
  function updateClock() {
    var now = new Date();
    var timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    var dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (pageTime) pageTime.textContent = dateStr + ' | ' + timeStr;
    var stEl = document.getElementById('status-time-now');
    if (stEl) stEl.textContent = timeStr;
    updateStatusIndicators();
  }

  function updateStatusIndicators() {
    var open = isServiceOpen();
    var s    = getSchedule();
    var dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

    // Top pill
    if (topStatusPill) {
      topStatusPill.classList.toggle('open', open);
      topStatusPill.classList.toggle('closed', !open);
    }
    if (topStatusLabel) topStatusLabel.textContent = open ? 'الخدمة متاحة' : 'الخدمة مغلقة';

    // Status circle
    var circle   = document.getElementById('status-circle');
    var bigLabel = document.getElementById('status-big-label');
    if (circle) {
      circle.classList.toggle('open', open);
      circle.classList.toggle('closed', !open);
    }
    if (bigLabel) bigLabel.textContent = open ? '✅ الخدمة متاحة الآن' : '🔴 الخدمة مغلقة الآن';

    // Stat card
    var statCard = document.getElementById('stat-status-card');
    if (statCard) statCard.textContent = open ? 'مفتوحة' : 'مغلقة';

    // Schedule summary
    var summary = document.getElementById('schedule-summary');
    if (summary) {
      if (!s.enabled) {
        summary.textContent = 'أوقات العمل غير مفعّلة — الخدمة متاحة دائماً';
      } else {
        var daysText = s.days.map(function(d) { return dayNames[d]; }).join(' - ');
        summary.textContent = 'من ' + s.from + ' إلى ' + s.to + '\n' + daysText;
      }
    }
  }

  // ===== STATS =====
  function updateStats() {
    var bookings  = getBookings();
    var today     = new Date().toDateString();
    var todayCount = bookings.filter(function(b) {
      return new Date(b.date).toDateString() === today;
    }).length;

    document.getElementById('stat-total').textContent = bookings.length;
    document.getElementById('stat-today').textContent = todayCount;
    document.getElementById('nav-badge').textContent  = bookings.length;

    var last   = bookings[bookings.length - 1];
    var lastEl = document.getElementById('stat-last');
    if (lastEl) lastEl.textContent = last ? last.bookingNum : '--';
  }

  // ===== RECENT TABLE =====
  function renderRecentTable() {
    var bookings = getBookings();
    var tbody    = document.getElementById('recent-tbody');
    var recent   = bookings.slice(-5).reverse();
    if (recent.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="5">لا توجد حجوزات بعد</td></tr>';
      return;
    }
    tbody.innerHTML = recent.map(function(b) {
      return '<tr>' +
        '<td><span class="booking-num">' + b.bookingNum + '</span></td>' +
        '<td><span class="company-name">' + escHtml(b.companyName) + '</span></td>' +
        '<td>' + escHtml(b.phone) + '</td>' +
        '<td style="font-family:monospace;letter-spacing:1px">' + formatNationalId(b.nationalId) + '</td>' +
        '<td>' + formatDateTime(b.date) + '</td>' +
        '</tr>';
    }).join('');
  }

  // ===== ALL TABLE =====
  function renderAllTable(filter) {
    filter = filter || '';
    var bookings = getBookings();
    var lower    = filter.toLowerCase();
    var filtered = filter
      ? bookings.filter(function(b) {
          return b.companyName.toLowerCase().includes(lower) || b.phone.includes(lower);
        })
      : bookings.slice();

    var tbody = document.getElementById('all-tbody');
    document.getElementById('total-count').textContent = 'إجمالي: ' + filtered.length + ' حجز';

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="6">لا توجد حجوزات</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.slice().reverse().map(function(b) {
      return '<tr id="row-' + b.id + '">' +
        '<td><span class="booking-num">' + b.bookingNum + '</span></td>' +
        '<td><span class="company-name">' + escHtml(b.companyName) + '</span></td>' +
        '<td>' + escHtml(b.phone) + '</td>' +
        '<td style="font-family:monospace;letter-spacing:1px">' + formatNationalId(b.nationalId) + '</td>' +
        '<td>' + formatDateTime(b.date) + '</td>' +
        '<td><button class="action-del" onclick="deleteBooking(\'' + b.id + '\')">حذف</button></td>' +
        '</tr>';
    }).join('');
  }

  // ===== DELETE ONE =====
  window.deleteBooking = function(id) {
    showConfirm('حذف الحجز', 'هل تريد حذف هذا الحجز نهائياً؟', function() {
      var bookings = getBookings().filter(function(b) { return b.id !== id; });
      localStorage.setItem(KEY_BOOKINGS, JSON.stringify(bookings));
      renderRecentTable();
      renderAllTable(document.getElementById('search-input').value);
      updateStats();
      showToast('تم حذف الحجز', 'success');
    });
  };

  // ===== SEARCH =====
  document.getElementById('search-input').addEventListener('input', function(e) {
    renderAllTable(e.target.value);
  });

  // ===== DELETE ALL =====
  document.getElementById('clear-all-btn').addEventListener('click', function() {
    if (getBookings().length === 0) { showToast('لا توجد حجوزات لحذفها', 'error'); return; }
    showConfirm('حذف جميع الحجوزات', 'هل تريد حذف جميع الحجوزات نهائياً؟ لا يمكن التراجع.', function() {
      localStorage.setItem(KEY_BOOKINGS, '[]');
      localStorage.removeItem(KEY_COUNTER);
      renderRecentTable();
      renderAllTable();
      updateStats();
      showToast('تم حذف جميع الحجوزات', 'success');
    });
  });

  // ===== EXPORT CSV =====
  document.getElementById('export-btn').addEventListener('click', function() {
    var bookings = getBookings();
    if (bookings.length === 0) { showToast('لا توجد بيانات للتصدير', 'error'); return; }
    var header = ['رقم الحجز', 'اسم الشركة', 'رقم الهاتف', 'الرقم القومي', 'التاريخ والوقت'];
    var rows   = bookings.map(function(b) {
      return [b.bookingNum, b.companyName, b.phone, b.nationalId, formatDateTime(b.date)];
    });
    var csv  = '\uFEFF' + [header].concat(rows).map(function(r) {
      return r.map(function(c) { return '"' + c + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var a    = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = 'bookings_' + new Date().toISOString().slice(0, 10) + '.csv';
    a.click();
    showToast('تم تصدير الملف بنجاح', 'success');
  });

  // ===== SCHEDULE FORM =====
  function loadScheduleForm() {
    var s = getSchedule();
    document.getElementById('schedule-enabled').checked = s.enabled;
    document.getElementById('time-from').value = s.from;
    document.getElementById('time-to').value   = s.to;
    document.getElementById('custom-msg').value = s.message || '';
    document.querySelectorAll('input[name="day"]').forEach(function(cb) {
      cb.checked = s.days.includes(parseInt(cb.value));
    });
  }

  document.getElementById('save-schedule-btn').addEventListener('click', function() {
    var enabled = document.getElementById('schedule-enabled').checked;
    var from    = document.getElementById('time-from').value;
    var to      = document.getElementById('time-to').value;
    var message = document.getElementById('custom-msg').value.trim();
    var days    = Array.from(document.querySelectorAll('input[name="day"]:checked'))
                       .map(function(cb) { return parseInt(cb.value); });

    if (enabled && days.length === 0) {
      showToast('الرجاء تحديد يوم عمل واحد على الأقل', 'error');
      return;
    }
    if (enabled && from >= to) {
      showToast('وقت البدء يجب أن يكون قبل وقت الانتهاء', 'error');
      return;
    }

    localStorage.setItem(KEY_SCHEDULE, JSON.stringify({ enabled: enabled, from: from, to: to, days: days, message: message }));
    updateStatusIndicators();
    showToast('تم حفظ إعدادات أوقات العمل ✓', 'success');
  });

  // ===== PASSWORD CHANGE =====
  document.getElementById('save-pass-btn').addEventListener('click', function() {
    var np  = document.getElementById('new-pass').value;
    var cp  = document.getElementById('confirm-pass').value;
    var msg = document.getElementById('settings-msg');
    if (np.length < 6) {
      msg.className = 'settings-msg err';
      msg.textContent = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
      return;
    }
    if (np !== cp) {
      msg.className = 'settings-msg err';
      msg.textContent = 'كلمتا المرور غير متطابقتين';
      return;
    }
    localStorage.setItem(KEY_PASS, np);
    msg.className = 'settings-msg ok';
    msg.textContent = 'تم تغيير كلمة المرور بنجاح ✓';
    document.getElementById('new-pass').value = '';
    document.getElementById('confirm-pass').value = '';
    setTimeout(function() { msg.textContent = ''; }, 3000);
  });

  // ===== RESET ALL =====
  document.getElementById('reset-data-btn').addEventListener('click', function() {
    showConfirm('إعادة الضبط الكامل', 'سيتم حذف جميع البيانات والإعدادات نهائياً. هل أنت متأكد؟', function() {
      [KEY_BOOKINGS, KEY_COUNTER, KEY_SCHEDULE, KEY_SESSION].forEach(function(k) {
        localStorage.removeItem(k);
      });
      location.reload();
    });
  });

  // ===== CONFIRM MODAL =====
  var confirmCallback = null;

  function showConfirm(title, msg, cb) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent   = msg;
    confirmCallback = cb;
    confirmOverlay.classList.add('show');
  }

  confirmOkBtn.addEventListener('click', function() {
    confirmOverlay.classList.remove('show');
    if (confirmCallback) { confirmCallback(); confirmCallback = null; }
  });
  confirmCancelBtn.addEventListener('click', function() {
    confirmOverlay.classList.remove('show');
    confirmCallback = null;
  });

  // ===== TOAST =====
  var toastTimer = null;
  function showToast(msg, type) {
    type = type || 'success';
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.className   = 'toast show ' + type;
    toastTimer = setTimeout(function() { toastEl.classList.remove('show'); }, 3000);
  }

  // ===== INIT DASHBOARD =====
  function initDashboard() {
    updateStats();
    renderRecentTable();
    renderAllTable();
    loadScheduleForm();
    updateClock();
    setInterval(updateClock, 1000);
    // Auto-refresh every 5 seconds to pick up new bookings from the form page
    setInterval(function() {
      updateStats();
      renderRecentTable();
      renderAllTable(document.getElementById('search-input').value);
    }, 5000);
  }

}); // end DOMContentLoaded