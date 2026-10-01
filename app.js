/* ===== app.js - حجز رقم شركات المقاولات ===== */

const KEY_BOOKINGS = 'bookings';
const KEY_SCHEDULE = 'work_schedule';
const KEY_COUNTER  = 'bookingCounter';

// ===== عناصر الواجهة =====
const form            = document.getElementById('booking-form');
const submitBtn       = document.getElementById('submit-btn');
const successOverlay  = document.getElementById('success-overlay');
const successCloseBtn = document.getElementById('success-close-btn');
const bookingNumValue = document.getElementById('booking-number-value');
const companyInput    = document.getElementById('company-name');
const phoneInput      = document.getElementById('phone-number');
const nationalIdInput = document.getElementById('national-id');
const closedBanner    = document.getElementById('closed-banner');
const closedMessage   = document.getElementById('closed-message');

// ===== التحقق من وقت العمل =====
function getSchedule() {
  return JSON.parse(localStorage.getItem(KEY_SCHEDULE) || JSON.stringify({
    enabled: false, from: '08:00', to: '17:00', days: [0,1,2,3,4], message: ''
  }));
}

function isServiceOpen() {
  const s = getSchedule();
  if (!s.enabled) return true;
  const now = new Date();
  const day = now.getDay();
  if (!s.days.includes(day)) return false;
  const [fh, fm] = s.from.split(':').map(Number);
  const [th, tm] = s.to.split(':').map(Number);
  const cur  = now.getHours() * 60 + now.getMinutes();
  const from = fh * 60 + fm;
  const to   = th * 60 + tm;
  return cur >= from && cur < to;
}

function checkServiceStatus() {
  const open = isServiceOpen();
  const s    = getSchedule();

  if (open) {
    closedBanner.style.display = 'none';
    form.style.display = 'flex';
    submitBtn.disabled = false;
  } else {
    closedBanner.style.display = 'flex';
    form.style.display = 'none';
    if (s.message) {
      closedMessage.textContent = s.message;
    } else if (s.enabled) {
      const dayNames = ['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'];
      const daysText = s.days.map(d => dayNames[d]).join(' والـ');
      closedMessage.textContent = `الخدمة متاحة أيام ${daysText} من ${s.from} حتى ${s.to}`;
    }
  }
}

// ===== تحديث كل دقيقة =====
checkServiceStatus();
setInterval(checkServiceStatus, 60000);

// ===== دوال التحقق =====
function validateCompanyName(v) { return v.trim().length >= 2; }
function validatePhone(v) { return /^[\d\+]{10,15}$/.test(v.replace(/\s/g, '')); }
function validateNationalId(v) { return /^\d{14}$/.test(v.trim()); }

function setError(groupId, inputEl, hasError) {
  const group = document.getElementById(groupId);
  group.classList.toggle('has-error', hasError);
  inputEl.classList.toggle('is-error', hasError);
  inputEl.classList.toggle('is-valid', !hasError);
}

// ===== التحقق الفوري =====
companyInput.addEventListener('blur', () =>
  setError('group-company', companyInput, !validateCompanyName(companyInput.value)));

phoneInput.addEventListener('blur', () =>
  setError('group-phone', phoneInput, !validatePhone(phoneInput.value)));

nationalIdInput.addEventListener('input', e => {
  e.target.value = e.target.value.replace(/[^\d]/g, '');
});
nationalIdInput.addEventListener('blur', () =>
  setError('group-national-id', nationalIdInput, !validateNationalId(nationalIdInput.value)));

// ===== إرسال النموذج =====
form.addEventListener('submit', async e => {
  e.preventDefault();

  if (!isServiceOpen()) {
    checkServiceStatus();
    return;
  }

  const companyVal    = companyInput.value;
  const phoneVal      = phoneInput.value;
  const nationalIdVal = nationalIdInput.value;

  const ok1 = validateCompanyName(companyVal);
  const ok2 = validatePhone(phoneVal);
  const ok3 = validateNationalId(nationalIdVal);

  setError('group-company',    companyInput,    !ok1);
  setError('group-phone',      phoneInput,      !ok2);
  setError('group-national-id',nationalIdInput, !ok3);

  if (!ok1 || !ok2 || !ok3) return;

  submitBtn.classList.add('is-loading');
  submitBtn.disabled = true;

  await new Promise(r => setTimeout(r, 1800));

  // حفظ الحجز
  const counter = (parseInt(localStorage.getItem(KEY_COUNTER) || '0')) + 1;
  localStorage.setItem(KEY_COUNTER, counter.toString());
  const bookingNum = '#' + String(counter).padStart(5, '0');

  const booking = {
    id:          Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    bookingNum,
    companyName: companyVal.trim(),
    phone:       phoneVal.trim(),
    nationalId:  nationalIdVal.trim(),
    date:        new Date().toISOString()
  };

  const bookings = JSON.parse(localStorage.getItem(KEY_BOOKINGS) || '[]');
  bookings.push(booking);
  localStorage.setItem(KEY_BOOKINGS, JSON.stringify(bookings));

  bookingNumValue.textContent = bookingNum;
  submitBtn.classList.remove('is-loading');
  submitBtn.disabled = false;
  showSuccess();
});

// ===== نافذة النجاح =====
function showSuccess() {
  successOverlay.classList.add('is-visible');
  document.body.style.overflow = 'hidden';
}

function closeSuccess() {
  successOverlay.classList.remove('is-visible');
  document.body.style.overflow = '';
  form.reset();
  [companyInput, phoneInput, nationalIdInput].forEach(inp => {
    inp.classList.remove('is-valid','is-error');
  });
  ['group-company','group-phone','group-national-id'].forEach(id => {
    document.getElementById(id).classList.remove('has-error');
  });
}

successCloseBtn.addEventListener('click', closeSuccess);
successOverlay.addEventListener('click', e => { if (e.target === successOverlay) closeSuccess(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSuccess(); });