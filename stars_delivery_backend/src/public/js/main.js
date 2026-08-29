const adminCsrfToken =
  document
    .querySelector(
      'meta[name="csrf-token"]',
    )
    ?.getAttribute('content')
  || '';

const nativeFetch =
  window.fetch.bind(window);

function adminFetch(input, init = {}) {
  const requestMethod =
    String(
      init.method
      || (
        input instanceof Request
          ? input.method
          : 'GET'
      ),
    )
      .toUpperCase();

  const mutating =
    ['POST', 'PUT', 'PATCH', 'DELETE']
      .includes(requestMethod);

  if (!mutating) {
    return nativeFetch(
      input,
      init,
    );
  }

  const rawUrl =
    input instanceof Request
      ? input.url
      : input;

  const requestUrl =
    new URL(
      rawUrl,
      window.location.href,
    );

  if (
    requestUrl.origin
    !== window.location.origin
  ) {
    return nativeFetch(
      input,
      init,
    );
  }

  const inheritedHeaders =
    input instanceof Request
      ? input.headers
      : undefined;

  const headers =
    new Headers(
      init.headers
      || inheritedHeaders
      || undefined,
    );

  if (adminCsrfToken) {
    headers.set(
      'X-CSRF-Token',
      adminCsrfToken,
    );
  }

  return nativeFetch(
    input,
    {
      ...init,
      headers,
    },
  );
}

// ================================================
// 1. الساعة الحية
// ================================================
function updateClocks() {
  const now = new Date();
  const str = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  ['clockDisplay', 'clockDisplay2', 'clockDisplay3', 'clockDisplay4', 'clockDisplay5', 'clockDisplay6', 'clockDisplay7', 'clockDisplay8', 'clockDisplay9', 'clockDisplay10', 'clockDisplay11', 'clockDisplay12'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = str;
  });
}
setInterval(updateClocks, 1000);
updateClocks();

// ================================================
// 2. التنقل بين الصفحات
// ================================================
const pages = {
  dashboard: document.getElementById('page-dashboard'),
  drivers: document.getElementById('page-drivers'),
  users: document.getElementById('page-users'),
  commissions: document.getElementById('page-commissions'),
  'add-driver': document.getElementById('page-add-driver'),
  'pending-providers': document.getElementById('page-pending-providers'),
  'driver-reports': document.getElementById('page-driver-reports'),
  'user-reports': document.getElementById('page-user-reports'),
  'support-chat': document.getElementById('page-support-chat'),
  'broadcast-drivers': document.getElementById('page-broadcast-drivers'),
  'broadcast-users': document.getElementById('page-broadcast-users'),
  areas: document.getElementById('page-areas'),
  settings: document.getElementById('page-settings')
};

function switchPage(pageId) {
  document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active-page'));
  if (pages[pageId]) pages[pageId].classList.add('active-page');
  else pages.dashboard.classList.add('active-page');
}

document.querySelectorAll('.sidebar ul li[data-page]').forEach(item => {
  item.addEventListener('click', function () {
    const page = this.dataset.page;
    switchPage(page);
    document.querySelectorAll('.sidebar ul li').forEach(li => li.classList.remove('active'));
    this.classList.add('active');
    if (page === 'commissions') loadCommissions();
    if (page === 'driver-reports') loadDriverReports();
      if (page === 'user-reports') loadUserReports();
      if (page === 'support-chat') initSupportChat();
      if (page === 'areas') loadAreas();
      if (page === 'add-driver') {
        document.getElementById('formSuccessMsg').classList.remove('show');
        document.getElementById('formErrorMsg').classList.remove('show');
        delete document.getElementById('addDriverForm').dataset.pendingId;
      }
      if (page === 'pending-providers') loadPendingProviders();
    if (page === 'broadcast-drivers' || page === 'broadcast-users') {
      const el = document.getElementById(page === 'broadcast-drivers' ? 'driverBroadcastResult' : 'userBroadcastResult');
      el.className = 'broadcast-result';
      el.textContent = '';
    }
  });
});

document.querySelectorAll('.back-home').forEach(btn => {
  btn.addEventListener('click', function () {
    switchPage('dashboard');
    document.querySelectorAll('.sidebar ul li').forEach(li => li.classList.remove('active'));
    document.querySelector('.sidebar ul li[data-page="dashboard"]').classList.add('active');
  });
});

// ================================================
// 3. بيانات فلسطين (المحافظات والمدن)
// ================================================
const citiesMap = {
  'القدس': ['القدس', 'أبو ديس', 'العيزرية', 'عناتا', 'بيت حنينا', 'شعفاط', 'صور باهر', 'سلوان', 'الطور', 'جبل المكبر'],
  'رام الله والبيرة': ['رام الله', 'البيرة', 'بيتونيا', 'دير عمار', 'سنجل', 'بروقين', 'رنتيس', 'عبوين', 'طيرة', 'بيت ريما', 'الزيتونة'],
  'الخليل': ['الخليل', 'دورا', 'يطا', 'حلحول', 'بني نعيم', 'سعير', 'إذنا', 'بيت كاحل', 'ترقوميا', 'بيت أمر', 'ساس'],
  'نابلس': ['نابلس', 'سبسطية', 'يعبد', 'عقابا', 'بيت إيبا', 'زواتا', 'جوريش', 'قصرة', 'تل'],
  'بيت لحم': ['بيت لحم', 'بيت جالا', 'بيت ساحور', 'الخضر', 'تقوع', 'جناتة', 'زعترة', 'حوسان', 'نحالين', 'بتير'],
  'أريحا': ['أريحا', 'النويعمة', 'العوجا', 'فصايل', 'مرج نعجة', 'الزبارة'],
  'سلفيت': ['سلفيت', 'الزاوية', 'كفل حارس', 'دير بلوط', 'بديا', 'قراوة بني حسن', 'رافات'],
  'جنين': ['جنين', 'يعبد', 'قباطية', 'الزبابدة', 'برطعة', 'عنزة', 'جبع', 'فقعوعة', 'سيلة الحارثية'],
  'طولكرم': ['طولكرم', 'عنبتا', 'بلعا', 'شرقية', 'كفر اللبد', 'دير الغصون', 'علار'],
  'قلقيلية': ['قلقيلية', 'حبلة', 'عزون', 'كفر ثلث', 'جيوس', 'سنيريا', 'عرب الرماضين'],
  'طوباس': ['طوباس', 'بردلة', 'طمون', 'عقابا', 'خربة فرعة'],
  'غزة': ['غزة', 'بيت لاهيا', 'بيت حانون', 'جباليا', 'الزيتون', 'الدرج', 'الرمال', 'الشجاعية', 'تفاح', 'الصبرة'],
  'خان يونس': ['خان يونس', 'بني سهيلا', 'عبسان', 'خزاعة', 'الفخاري', 'القرارة', 'أم الكلاب'],
  'رفح': ['رفح', 'الشوكة', 'النصر', 'البريج', 'المواسي', 'تل السلطان', 'خربة العدس'],
  'دير البلح': ['دير البلح', 'الزوايدة', 'المغازي', 'البريج', 'النصيرات', 'وادي غزة'],
  'شمال غزة': ['بيت لاهيا', 'بيت حانون', 'جباليا', 'أم النصر', 'المسدرة'],
  'حيفا': ['حيفا', 'أم الفحم', 'طيرة الكرمل', 'دالية الكرمل', 'جسر الزرقاء', 'أم الزينات', 'الفريديس'],
  'عكا': ['عكا', 'الناصرة', 'شفا عمرو', 'كفر ياسيف', 'جولس', 'المغار', 'دير الأسد', 'البعنة'],
  'الناصرة': ['الناصرة', 'يافة الناصرة', 'الرينة', 'عين ماهل', 'كفر كنا', 'مشهد', 'كسفا', 'مجدل شمس'],
  'يافا': ['يافا', 'اللد', 'الرملة', 'رحوفوت', 'حولون', 'بات يام', 'أور يهودا', 'رأس العين']
};

// ================================================
// 4. دوال مساعدة
// ================================================
function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function extractNumberFromId(id) { return parseInt(id.replace(/\D/g, ''), 10); }

function getStatusBadge(status) {
  const map = { active: '<span class="status-badge-user active">نشط</span>', inactive: '<span class="status-badge-user inactive">غير نشط</span>', pending: '<span class="status-badge-user pending">قيد المراجعة</span>' };
  return map[status] || status;
}

function getOrderStatusBadge(status) {
  const map = { 'completed': '<span class="order-status completed">مكتمل</span>', 'in-progress': '<span class="order-status in-progress">قيد التنفيذ</span>', 'pending': '<span class="order-status pending">قيد الانتظار</span>', 'cancelled': '<span class="order-status cancelled">ملغي</span>' };
  return map[status] || status;
}

function getReportStatusBadge(status) {
  const map = { 'resolved': '<span class="report-status-badge resolved">تم الحل</span>', 'rejected': '<span class="report-status-badge rejected">مرفوض</span>', 'in-review': '<span class="report-status-badge in-review">قيد المراجعة</span>', 'in-progress': '<span class="report-status-badge in-progress">قيد المعالجة</span>' };
  return map[status] || status;
}

function updateFileName(input, spanId) {
  const span = document.getElementById(spanId);
  if (input.files && input.files.length > 0) span.textContent = input.files[0].name;
  else span.textContent = 'لم يتم الاختيار';
}

// ================================================
// 5. إضافة سائق جديد
// ================================================
document.getElementById('addDriverForm').addEventListener('submit', function (e) {
  e.preventDefault();
  addNewDriver();
});

async function addNewDriver() {
  const form = document.getElementById('addDriverForm');
  const formData = new FormData(form);
  const pendingId = form.dataset.pendingId;

  const name = formData.get('driverName').toString().trim();
  const email = formData.get('driverEmail').toString().trim();
  const phone = formData.get('driverPhone').toString().trim();

  if (!name || !email || !phone) {
    document.getElementById('formErrorMsg').textContent = 'الرجاء ملء جميع الحقول المطلوبة';
    document.getElementById('formErrorMsg').classList.add('show');
    document.getElementById('formSuccessMsg').classList.remove('show');
    return;
  }

  try {
    const url = pendingId ? `/admin/drivers/pending/${pendingId}` : '/admin/drivers';
    const res = await adminFetch(url, { method: 'POST', body: formData });
    const data = await res.json();
    if (data.success) {
      document.getElementById('formSuccessMsg').textContent = data.message;
      document.getElementById('formSuccessMsg').classList.add('show');
      document.getElementById('formErrorMsg').classList.remove('show');
      form.reset();
      delete form.dataset.pendingId;
      loadDashboardStats();
      setTimeout(() => { document.getElementById('formSuccessMsg').classList.remove('show'); }, 5000);
    } else {
      document.getElementById('formErrorMsg').textContent = data.message;
      document.getElementById('formErrorMsg').classList.add('show');
      document.getElementById('formSuccessMsg').classList.remove('show');
    }
  } catch (err) {
    document.getElementById('formErrorMsg').textContent = 'حدث خطأ في الاتصال';
    document.getElementById('formErrorMsg').classList.add('show');
  }
}

// ================================================
// 6. البحث عن سائق
// ================================================
document.getElementById('driverSearchBtn').addEventListener('click', searchDriver);
document.getElementById('driverSearchInput').addEventListener('keypress', e => { if (e.key === 'Enter') searchDriver(); });

async function searchDriver() {
  const input = document.getElementById('driverSearchInput');
  const raw = input.value.trim();
  if (!raw) return alert('الرجاء إدخال ID السائق أو الاسم');

  try {
    const res = await adminFetch(`/admin/drivers/search?id=${encodeURIComponent(raw)}`);
    const data = await res.json();
    if (data.error) {
      document.getElementById('driverResult').innerHTML = `<div class="not-found">${data.error}</div>`;
      document.getElementById('driverResult').classList.add('show');
      return;
    }
    renderDriverResultFromDB(data);
  } catch (err) {
    document.getElementById('driverResult').innerHTML = '<div class="not-found">حدث خطأ في البحث</div>';
    document.getElementById('driverResult').classList.add('show');
  }
}

function renderDriverResultFromDB(data) {
  const { driver, commission, netProfit, last30Profit } = data;
  const container = document.getElementById('driverResult');
  const isPaid = driver.financial.paymentStatus === 'paid';
  container.innerHTML = `
    <h4 style="color:#00d4ff; margin-bottom:15px;">بيانات السائق</h4>
     <div class="row"><span class="label">ID السائق</span><span class="value">${driver.driverId}</span></div>
    <div class="row"><span class="label">الاسم الكامل</span><span class="value">${driver.name}</span></div>
    <div class="row"><span class="label">البريد الإلكتروني</span><span class="value">${driver.email}</span></div>
    <div class="row"><span class="label">رقم الجوال</span><span class="value">${driver.phone}</span></div>
    <div class="row"><span class="label">نوع الخدمة</span><span class="value">${driver.serviceType || 'غير محدد'}</span></div>
    <div class="row"><span class="label">نوع السائق</span><span class="value">${driver.licenseType || 'غير محدد'}</span></div>
    <div class="row"><span class="label">المنطقة</span><span class="value">${driver.area}</span></div>
    <div class="row"><span class="label">الحالة</span><span class="value">${getStatusBadge(driver.status)}</span></div>
    <div class="row"><span class="label">حالة الدفع</span><span class="value">${isPaid ? `<span class="paid-badge">مدفوع</span>` : `<span class="unpaid-badge">غير مدفوع (${commission} )</span>`}</span></div>
    <div class="row"><span class="label">إجمالي الأرباح (صافي)</span><span class="value" style="color:#2ecc71;">${netProfit} </div>
    <div class="row"><span class="label">أرباح آخر 30 يوم (صافي)</span><span class="value" style="color:#00d4ff;">${last30Profit} </div>
    <div class="row"><span class="label">كلمة المرور</span><span class="value">${driver.password || 'غير محدد'}</span></div>
    <div class="row"><span class="label">عمولة المنصة المستحقة</span><span class="value" style="color:#f39c12; font-weight:800;">${commission} </div>
    <div class="action-buttons">
      <button class="action-btn chat" onclick="openChat('driver','${driver._id}')">مراسلة</button>
      <button class="action-btn report" onclick="viewDriverOrdersViaDB('${driver._id}')">تقرير الطلبات</button>
      <button class="action-btn change-password" onclick="changeDriverPassword('${driver._id}')" style="padding:5px 12px; font-size:12px;">تغيير كلمة المرور</button>
      <button class="action-btn docs" onclick="viewDocuments('${driver._id}')">الوثائق</button>
      <button class="action-btn freeze" onclick="freezeDriver('${driver._id}')">تجميد</button>
      <button class="action-btn activate" onclick="activateDriver('${driver._id}')">تفعيل</button>
      <button class="action-btn delete" onclick="deleteDriver('${driver._id}')">حذف نهائي</button>
    </div>
  `;
  container.classList.add('show');
}

// ================================================
// 7. البحث عن مستخدم
// ================================================
document.getElementById('userSearchBtn').addEventListener('click', searchUser);
document.getElementById('userSearchInput').addEventListener('keypress', e => { if (e.key === 'Enter') searchUser(); });

async function searchUser() {
  const input = document.getElementById('userSearchInput');
  const raw = input.value.trim();
  if (!raw) return alert('الرجاء إدخال ID المستخدم أو الاسم');

  try {
    const res = await adminFetch(`/admin/users/search?id=${encodeURIComponent(raw)}`);
    const data = await res.json();
    if (data.error) {
      document.getElementById('userResult').innerHTML = `<div class="not-found">${data.error}</div>`;
      document.getElementById('userResult').classList.add('show');
      return;
    }
    renderUserResultFromDB(data.user);
  } catch (err) {
    document.getElementById('userResult').innerHTML = '<div class="not-found">حدث خطأ في البحث</div>';
    document.getElementById('userResult').classList.add('show');
  }
}

function renderUserResultFromDB(user) {
  const container = document.getElementById('userResult');
  const orderCount = user.orders ? user.orders.length : 0;
  container.innerHTML = `
    <h4 style="color:#00d4ff; margin-bottom:15px;">بيانات المستخدم</h4>
     <div class="row"><span class="label">ID المستخدم</span><span class="value">${user.userId}</span></div>
    <div class="row"><span class="label">الاسم الكامل</span><span class="value">${user.name}</span></div>
    <div class="row"><span class="label">البريد الإلكتروني</span><span class="value">${user.email}</span></div>
    <div class="row"><span class="label">رقم الجوال</span><span class="value">${user.phone}</span></div>
    <div class="row"><span class="label">تاريخ التسجيل</span><span class="value">${user.joinDate}</span></div>
    <div class="row"><span class="label">المنطقة</span><span class="value">${user.area}</span></div>
    <div class="row"><span class="label">الحالة</span><span class="value">${getStatusBadge(user.status)}</span></div>
    <div class="row"><span class="label">عدد الطلبات</span><span class="value">${orderCount}</span></div>
    <div class="row"><span class="label">كلمة المرور</span><span class="value">${user.password || 'غير محدد'}</span></div>
    <div class="action-buttons">
      <button class="action-btn chat" onclick="openChat('user','${user._id}')">مراسلة</button>
      <button class="action-btn orders-report" onclick="viewUserOrdersViaDB('${user._id}')">تقرير الطلبات</button>
      <button class="action-btn change-password" onclick="changeUserPassword('${user._id}')" style="padding:5px 12px; font-size:12px;">تغيير كلمة المرور</button>
      <button class="action-btn freeze" onclick="freezeUser('${user._id}')">تجميد</button>
      <button class="action-btn activate" onclick="activateUser('${user._id}')">تفعيل</button>
      <button class="action-btn delete" onclick="deleteUser('${user._id}')">حذف نهائي</button>
    </div>
  `;
  container.classList.add('show');
}

// ================================================
// 8. الشات
// ================================================
let currentChatTarget = null;

async function openChat(type, id) {
  currentChatTarget = { type, id };
  try {
    const res = await adminFetch(`/admin/chat/messages/${type}/${id}`);
    const data = await res.json();
    if (data.error) { alert(data.error); return; }

    document.getElementById('chatTitle').textContent = `محادثة مع ${data.name}`;
    document.getElementById('chatSub').textContent = `مراسلة ${data.name} (${type === 'driver' ? 'سائق' : 'مستخدم'})`;
    renderChatMessages(data.messages, data.name);
    document.getElementById('chatModal').classList.add('show');
    document.getElementById('chatInput').value = '';
    document.getElementById('chatInput').focus();
  } catch (err) {
    alert('حدث خطأ في فتح المحادثة');
  }
}

function renderChatMessages(messages, name) {
  const container = document.getElementById('chatMessages');
  container.innerHTML = '';
  if (!messages || messages.length === 0) {
    container.innerHTML = '<div class="chat-empty">لا توجد رسائل بعد. ابدأ المحادثة!</div>';
    return;
  }
  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = `chat-msg ${msg.sender === 'admin' ? 'admin' : 'other'}`;
    const senderName = msg.sender === 'admin' ? 'المدير' : (name || 'الطرف الآخر');
    div.innerHTML = `<div class="sender-name">${senderName}</div>${msg.text}<span class="time">${msg.time}</span>`;
    container.appendChild(div);
  });
  container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) { alert('الرجاء كتابة رسالة.'); return; }
  if (!currentChatTarget) { alert('لا يوجد محادثة مفتوحة!'); return; }

  try {
    const res = await adminFetch(`/admin/chat/send/${currentChatTarget.type}/${currentChatTarget.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (data.success) {
      renderChatMessages(data.messages, '');
      input.value = '';
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('حدث خطأ في إرسال الرسالة');
  }
}

function closeChat() {
  document.getElementById('chatModal').classList.remove('show');
  currentChatTarget = null;
}

document.getElementById('chatInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') sendChatMessage();
});

// ================================================
// 9. لوحة القيادة - تحميل الإحصائيات
// ================================================
async function loadDashboardStats() {
  try {
    const res = await adminFetch('/admin/api/stats');
    const data = await res.json();
    document.getElementById('totalDrivers').textContent = data.totalDrivers;
    document.getElementById('activeDrivers').textContent = data.activeDrivers;
    document.getElementById('inactiveDrivers').textContent = data.inactiveDrivers;
    document.getElementById('totalUsers').textContent = data.totalUsers;
    document.getElementById('activeUsers').textContent = data.activeUsers;
    document.getElementById('inactiveUsers').textContent = data.inactiveUsers;
    document.getElementById('totalCommission').textContent = data.totalCommission;
    document.getElementById('pendingDrivers').textContent = data.pendingDrivers;
    document.getElementById('pendingAmount').textContent = data.pendingAmount;

    const driverBadge = document.getElementById('driverReportsBadge');
    if (data.driverReportsPending > 0) { driverBadge.textContent = data.driverReportsPending; driverBadge.style.display = 'inline-block'; }
    else { driverBadge.style.display = 'none'; }

    const userBadge = document.getElementById('userReportsBadge');
    if (data.userReportsPending > 0) { userBadge.textContent = data.userReportsPending; userBadge.style.display = 'inline-block'; }
    else { userBadge.style.display = 'none'; }

    // Load pending provider count
    try {
      const pendingRes = await adminFetch('/admin/drivers/pending');
      const pendingData = await pendingRes.json();
      const pendingBadge = document.getElementById('pendingBadge');
      pendingBadge.textContent = pendingData.length;
      pendingBadge.style.display = pendingData.length > 0 ? 'inline-block' : 'none';
    } catch (_) {}

    const topRes = await adminFetch('/admin/api/top-driver');
    const topData = await topRes.json();
    document.getElementById('topDriver').textContent = topData.name;
    document.getElementById('topDriverEarn').textContent = topData.earnings + ' ';
  } catch (err) {
    console.error('Error loading stats:', err);
  }
}

// ================================================
// 10. العمولات
// ================================================
async function loadCommissions() {
  try {
    const res = await adminFetch('/admin/commissions');
    const data = await res.json();
    let rows = '';
    data.driverRows.forEach(driver => {
      const isPaid = driver.paymentStatus === 'paid';
      const statusText = isPaid ? '<span class="status-paid">مدفوع</span>' : `<span class="status-unpaid">غير مدفوع (${driver.commission} )</span>`;
      const actionHtml = !isPaid ?
        `<button class="action-btn pay-now" onclick="markPaid('${driver._id}')" style="padding:5px 12px; font-size:12px;">تحديد كمدفوع</button>` :
        '<span style="color:#2ecc71; font-weight:700;">مدفوع</span>';
      rows += `<tr><td><strong>${driver.name}</strong><br><small style="color:#8892a8;">${driver.driverId}</small></td><td>${driver.phone || 'غير متوفر'}</td><td>${driver.serviceType}</td><td>${driver.commission}</td><td>${statusText}</td><td>${actionHtml}</td></tr>`;
    });

    document.getElementById('commissionsContent').innerHTML = `
      <div class="commissions-summary">
        <div class="summary-card"><div class="label">إجمالي العمولات المستحقة</div><div class="number red">${data.totalUnpaid} </div></div>
        <div class="summary-card"><div class="label">عدد السائقين المستحقين</div><div class="number orange">${data.unpaidDrivers}</div></div>
        <div class="summary-card"><div class="label">إجمالي العمولات المدفوعة</div><div class="number green">${data.totalPaid} </div></div>
        <div class="summary-card"><div class="label">عدد السائقين المدفوعين</div><div class="number">${data.paidDrivers}</div></div>
      </div>
      <div class="commissions-table-container">
        <h3>تفاصيل عمولات السائقين</h3>
        <table class="commissions-table">
          <thead><tr><th>السائق</th><th>رقم الهاتف</th><th>نوع الخدمة</th><th>العمولة المستحقة</th><th>حالة الدفع</th><th>الإجراء</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  } catch (err) {
    console.error('Error loading commissions:', err);
  }
}

async function markPaid(driverId) {
  if (!confirm('هل أنت متأكد من تحديد السائق كمدفوع؟')) return;
  try {
    const res = await adminFetch(`/admin/commissions/pay/${driverId}`, { method: 'PUT' });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      loadCommissions();
      loadDashboardStats();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert('حدث خطأ في تحديث حالة الدفع');
  }
}

// ================================================
// 11. المناطق
// ================================================
let governorateStats = {};

async function loadAreas() {
  try {
    const res = await adminFetch('/admin/areas');
    const data = await res.json();
    governorateStats = data.stats;

    let listHtml = '', firstGov = null;
    for (const gov of data.governorateOrder) {
      if (governorateStats[gov]) {
        const s = governorateStats[gov];
        listHtml += `<div class="area-item" data-gov="${gov}" onclick="selectGovernorate('${gov}')"><span class="name">${gov}</span><span class="counts"><span class="drivers">${s.totalDrivers}</span><span class="users">${s.totalUsers}</span></span></div>`;
        if (!firstGov) firstGov = gov;
      }
    }

    let detailHtml = firstGov && governorateStats[firstGov] ? buildGovernorateDetail(firstGov, governorateStats[firstGov]) : '<div class="no-city">لا توجد بيانات</div>';
    document.getElementById('areasContainer').innerHTML = `<div class="areas-list">${listHtml}</div><div class="areas-detail" id="areasDetail">${detailHtml}</div>`;
    const firstItem = document.getElementById('areasContainer').querySelector('.area-item');
    if (firstItem) firstItem.classList.add('active');
  } catch (err) {
    console.error('Error loading areas:', err);
  }
}

function buildGovernorateDetail(gov, stats) {
  let citiesHtml = '', totalDrivers = 0, totalUsers = 0;
  stats.cities.forEach(city => {
    totalDrivers += city.drivers; totalUsers += city.users;
    citiesHtml += `<div class="city-item"><span class="city-name">${city.name}</span><span class="city-counts"><span class="drivers">${city.drivers}</span><span class="users">${city.users}</span></span></div>`;
  });
  return `<h3>${gov}</h3>${citiesHtml}<div class="total-badge"><span class="label">إجمالي المحافظة</span><span><span class="value drivers">${totalDrivers}</span><span class="value users" style="margin-right:20px;">${totalUsers}</span></span></div>`;
}

function selectGovernorate(gov) {
  const items = document.getElementById('areasContainer').querySelectorAll('.area-item');
  items.forEach(item => item.classList.toggle('active', item.dataset.gov === gov));
  const stats = governorateStats[gov];
  if (!stats) return;
  const detailDiv = document.getElementById('areasDetail');
  if (detailDiv) detailDiv.innerHTML = buildGovernorateDetail(gov, stats);
}

// ================================================
// 12. الإبلاغات
// ================================================
async function loadDriverReports() {
  try {
    const res = await adminFetch('/admin/reports/driver');
    const data = await res.json();
    let rows = '';
    data.reports.forEach(report => {
      const replyCount = report.replies ? report.replies.length : 0;
      const reporterName = report.reporterId?.fullName || report.reporter || 'غير معروف';
      const targetId = report.reportedPublicId || '';
      rows += `<tr><td><strong>${report.reportId}</strong></td><td>${reporterName}</td><td>#${targetId}</td><td>${report.category}</td><td>${report.date}</td><td>${getReportStatusBadge(report.status)}</td><td>${report.content.substring(0, 40)}${report.content.length > 40 ? '...' : ''}</td><td><button class="action-btn info" onclick="viewReportDetail('driver','${report.reportId}')" style="padding:5px 12px; font-size:12px;">عرض</button><button class="action-btn reply" onclick="openReplyModal('driver','${report.reportId}')" style="padding:5px 12px; font-size:12px;">رد (${replyCount})</button>${report.status !== 'resolved' ? `<button class="action-btn success" onclick="resolveReport('driver','${report.reportId}')" style="padding:5px 12px; font-size:12px;">حل</button>` : ''}<button class="action-btn danger" onclick="deleteReport('driver','${report.reportId}')" style="padding:5px 12px; font-size:12px;">حذف</button></td></tr>`;
    });
    document.getElementById('driverReportsContent').innerHTML = `<div class="commissions-table-container"><h3>قائمة إبلاغات السائقين</h3><table class="commissions-table"><thead><tr><th>رقم الإبلاغ</th><th>المبلغ</th><th>ID السائق</th><th>النوع</th><th>التاريخ</th><th>الحالة</th><th>المحتوى</th><th>الإجراءات</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } catch (err) { console.error('Error loading driver reports:', err); }
}

async function loadUserReports() {
  try {
    const res = await adminFetch('/admin/reports/user');
    const data = await res.json();
    let rows = '';
    data.reports.forEach(report => {
      const replyCount = report.replies ? report.replies.length : 0;
      const reporterName = report.reporterId?.fullName || report.reporter || 'غير معروف';
      const targetId = report.reportedPublicId || '';
      rows += `<tr><td><strong>${report.reportId}</strong></td><td>${reporterName}</td><td>#${targetId}</td><td>${report.category}</td><td>${report.date}</td><td>${getReportStatusBadge(report.status)}</td><td>${report.content.substring(0, 40)}${report.content.length > 40 ? '...' : ''}</td><td><button class="action-btn info" onclick="viewReportDetail('user','${report.reportId}')" style="padding:5px 12px; font-size:12px;">عرض</button><button class="action-btn reply" onclick="openReplyModal('user','${report.reportId}')" style="padding:5px 12px; font-size:12px;">رد (${replyCount})</button>${report.status !== 'resolved' ? `<button class="action-btn success" onclick="resolveReport('user','${report.reportId}')" style="padding:5px 12px; font-size:12px;">حل</button>` : ''}<button class="action-btn danger" onclick="deleteReport('user','${report.reportId}')" style="padding:5px 12px; font-size:12px;">حذف</button></td></tr>`;
    });
    document.getElementById('userReportsContent').innerHTML = `<div class="commissions-table-container"><h3>قائمة إبلاغات المستخدمين</h3><table class="commissions-table"><thead><tr><th>رقم الإبلاغ</th><th>المبلغ</th><th>ID المستخدم</th><th>النوع</th><th>التاريخ</th><th>الحالة</th><th>المحتوى</th><th>الإجراءات</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  } catch (err) { console.error('Error loading user reports:', err); }
}

let currentReportType = null, currentReportId = null;

async function openReplyModal(type, reportId) {
  currentReportType = type; currentReportId = reportId;
  try {
    const res = await adminFetch(`/admin/reports/detail/${reportId}`);
    const data = await res.json();
    if (data.error) { alert(data.error); return; }
    const report = data.report;

    document.getElementById('reportDetailTitle').textContent = `إبلاغ رقم ${report.reportId} - ${report.category}`;
    document.getElementById('reportDetailContent').innerHTML = `<div style="background:#0f141c; border-radius:12px; padding:20px; border:1px solid #2a3546;"><div class="row"><span class="label">المرسل:</span><span class="value">${report.reporter}</span></div><div class="row"><span class="label">النوع:</span><span class="value">${report.category}</span></div><div class="row"><span class="label">التاريخ:</span><span class="value">${report.date}</span></div><div class="row"><span class="label">الحالة:</span><span class="value">${getReportStatusBadge(report.status)}</span></div><div style="margin-top:15px; padding-top:15px; border-top:1px solid #2a3546;"><span style="color:#8892a8; display:block; margin-bottom:8px; font-weight:600;">المحتوى الكامل:</span><p style="color:#fff; line-height:1.8; background:#0b0e14; padding:15px; border-radius:10px;">${report.content}</p></div></div>`;
    renderChatThread(report);
    document.getElementById('reportDetailModal').classList.add('show');
    document.getElementById('replyInput').value = '';
  } catch (err) { alert('حدث خطأ في فتح الإبلاغ'); }
}

function viewReportDetail(type, reportId) { openReplyModal(type, reportId); }

function renderChatThread(report) {
  const threadDiv = document.getElementById('chatThread');
  threadDiv.innerHTML = '';
  if (!report.replies || report.replies.length === 0) {
    threadDiv.innerHTML = '<p style="color:#8892a8; text-align:center; padding:20px;">لا توجد ردود حتى الآن.</p>';
    return;
  }
  report.replies.forEach(msg => {
    const div = document.createElement('div');
    div.className = `chat-msg ${msg.sender === 'admin' ? 'admin' : 'other'}`;
    const senderName = msg.sender === 'admin' ? 'المدير' : (report.reporter || 'المرسل');
    div.innerHTML = `<div class="sender-name">${senderName}</div>${msg.text}<span class="time">${msg.time}</span>`;
    threadDiv.appendChild(div);
  });
  threadDiv.scrollTop = threadDiv.scrollHeight;
}

async function sendReply() {
  if (!currentReportType || !currentReportId) { alert('لا يوجد إبلاغ مفتوح!'); return; }
  const input = document.getElementById('replyInput');
  const text = input.value.trim();
  if (!text) { alert('الرجاء كتابة رد.'); return; }

  try {
    const res = await adminFetch(`/admin/reports/reply/${currentReportId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (data.success) {
      renderChatThread(data.report);
      input.value = '';
      loadDashboardStats();
      alert('تم إرسال الرد بنجاح.');
    } else {
      alert(data.message);
    }
  } catch (err) { alert('حدث خطأ في إرسال الرد'); }
}

async function resolveReport(type, reportId) {
  if (!confirm('هل أنت متأكد من تغيير الحالة إلى "تم الحل"؟')) return;
  try {
    await adminFetch(`/admin/reports/${reportId}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'resolved' }) });
    if (type === 'driver') loadDriverReports(); else loadUserReports();
    loadDashboardStats();
    alert('تم تغيير الحالة بنجاح.');
  } catch (err) { alert('حدث خطأ'); }
}

async function deleteReport(type, reportId) {
  if (!confirm('هل أنت متأكد من حذف هذا الإبلاغ نهائياً؟')) return;
  try {
    await adminFetch(`/admin/reports/${reportId}`, { method: 'DELETE' });
    if (type === 'driver') loadDriverReports(); else loadUserReports();
    loadDashboardStats();
    alert('تم حذف الإبلاغ بنجاح.');
  } catch (err) { alert('حدث خطأ'); }
}

// ================================================
// 13. الإرسال الجماعي
// ================================================
async function sendBroadcast(target) {
  const titleInput = document.getElementById(target === 'drivers' ? 'driverBroadcastTitle' : 'userBroadcastTitle');
  const bodyInput = document.getElementById(target === 'drivers' ? 'driverBroadcastBody' : 'userBroadcastBody');
  const resultDiv = document.getElementById(target === 'drivers' ? 'driverBroadcastResult' : 'userBroadcastResult');
  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title || !body) {
    resultDiv.className = 'broadcast-result error';
    resultDiv.textContent = 'الرجاء إدخال عنوان ونص للرسالة.';
    return;
  }

  try {
    const res = await adminFetch(`/admin/broadcast/${target}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body })
    });
    const data = await res.json();
    if (data.success) {
      resultDiv.className = 'broadcast-result success';
      resultDiv.innerHTML = `تم إرسال الرسالة بنجاح إلى <strong>${data.count}</strong> ${target === 'drivers' ? 'سائق' : 'مستخدم'}.<br><span style="font-size:13px; color:#8892a8;">العنوان: ${title}</span><br><span style="font-size:13px; color:#8892a8;">تم الإرسال في: ${data.sentAt}</span>`;
    } else {
      resultDiv.className = 'broadcast-result error';
      resultDiv.textContent = data.message;
    }
  } catch (err) {
    resultDiv.className = 'broadcast-result error';
    resultDiv.textContent = 'حدث خطأ في الإرسال';
  }
}

// ================================================
// 14. إجراءات السائقين والمستخدمين
// ================================================
async function freezeDriver(id) {
  try {
    await adminFetch(`/admin/drivers/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'inactive' }) });
    alert('تم تجميد حساب السائق بنجاح.');
    searchDriverById(id);
    loadDashboardStats();
  } catch (err) { alert('حدث خطأ'); }
}

async function activateDriver(id) {
  try {
    await adminFetch(`/admin/drivers/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'active' }) });
    alert('تم تفعيل حساب السائق بنجاح.');
    searchDriverById(id);
    loadDashboardStats();
  } catch (err) { alert('حدث خطأ'); }
}

async function deleteDriver(id) {
  if (!confirm('هل أنت متأكد من حذف السائق نهائياً؟')) return;
  try {
    const res = await adminFetch(`/admin/drivers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    alert(data.message);
    document.getElementById('driverResult').classList.remove('show');
    loadDashboardStats();
  } catch (err) { alert('حدث خطأ'); }
}

async function changeDriverPassword(driverId) {
  const newPassword = prompt('أدخل كلمة المرور الجديدة للسائق:', '');
  if (!newPassword || newPassword.trim() === '') { alert('كلمة المرور لا يمكن أن تكون فارغة.'); return; }
  const confirmPassword = prompt('أعد إدخال كلمة المرور الجديدة للتأكيد:', '');
  if (!confirmPassword || newPassword !== confirmPassword) { alert('كلمة المرور وتأكيدها غير متطابقين.'); return; }
  try {
    await adminFetch(`/admin/drivers/${driverId}/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }) });
    alert('تم تغيير كلمة المرور بنجاح.');
    searchDriverById(driverId);
  } catch (err) { alert('حدث خطأ'); }
}

async function freezeUser(id) {
  try {
    await adminFetch(`/admin/users/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'inactive' }) });
    alert('تم تجميد حساب المستخدم بنجاح.');
    searchUserById(id);
    loadDashboardStats();
  } catch (err) { alert('حدث خطأ'); }
}

async function activateUser(id) {
  try {
    await adminFetch(`/admin/users/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'active' }) });
    alert('تم تفعيل حساب المستخدم بنجاح.');
    searchUserById(id);
    loadDashboardStats();
  } catch (err) { alert('حدث خطأ'); }
}

async function deleteUser(id) {
  alert('هذه الميزة غير مفعلة حالياً.');
  // if (!confirm('هل أنت متأكد من حذف المستخدم نهائياً؟')) return;
  // try {
  //   const res = await adminFetch(`/admin/users/${id}`, { method: 'DELETE' });
  //   const data = await res.json();
  //   alert(data.message);
  //   document.getElementById('userResult').classList.remove('show');
  //   loadDashboardStats();
  // } catch (err) { alert('حدث خطأ'); }
}

async function changeUserPassword(userId) {
  const newPassword = prompt('أدخل كلمة المرور الجديدة للمستخدم:', '');
  if (!newPassword || newPassword.trim() === '') { alert('كلمة المرور لا يمكن أن تكون فارغة.'); return; }
  const confirmPassword = prompt('أعد إدخال كلمة المرور الجديدة للتأكيد:', '');
  if (!confirmPassword || newPassword !== confirmPassword) { alert('كلمة المرور وتأكيدها غير متطابقين.'); return; }
  try {
    await adminFetch(`/admin/users/${userId}/password`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: newPassword }) });
    alert('تم تغيير كلمة المرور بنجاح.');
    searchUserById(userId);
  } catch (err) { alert('حدث خطأ'); }
}

function searchDriverById(id) {
  document.getElementById('driverSearchInput').value = id;
  searchDriver();
}

function searchUserById(id) {
  document.getElementById('userSearchInput').value = id;
  searchUser();
}

// ================================================
// 15. عرض الوثائق وطلبات السائق/المستخدم
// ================================================
async function viewDocuments(driverId) {
  try {
    const res = await adminFetch(`/admin/drivers/search?id=${driverId}`);
    const data = await res.json();
    if (data.error) { alert(data.error); return; }
    const driver = data.driver;

    document.getElementById('docDriverName').textContent = `اسم السائق: ${driver.name} (${driver.driverId})`;
    const listContainer = document.getElementById('documentsList');
    listContainer.innerHTML = '';
    if (!driver.documents || driver.documents.length === 0) {
      listContainer.innerHTML = '<p style="color:#8892a8; text-align:center; padding:20px;">لا توجد وثائق مسجلة.</p>';
    } else {
      driver.documents.forEach(doc => {
        const fileDisplay = doc.file && doc.file !== 'لم يتم الرفع' ? `<span style="color:#00d4ff;">${doc.file}</span>` : '<span style="color:#e74c3c;">لم يتم الرفع</span>';
        const div = document.createElement('div');
        div.className = 'doc-item';
        div.innerHTML = `<span class="doc-name">${doc.name}</span><span class="doc-status">${fileDisplay}</span>`;
        listContainer.appendChild(div);
      });
    }
    document.getElementById('documentsModal').classList.add('show');
  } catch (err) { alert('حدث خطأ في تحميل الوثائق'); }
}

async function viewDriverOrdersViaDB(driverId) {
  try {
    const res = await adminFetch(`/admin/drivers/search?id=${driverId}`);
    const data = await res.json();
    if (data.error) { alert(data.error); return; }
    const { driver, netProfit, last30Profit, totalCommission } = data;
    document.getElementById('reportDriverName').textContent = `اسم السائق: ${driver.name} (${driver.driverId})`;
    const content = document.getElementById('reportContent');
    if (driver.financial && driver.financial.transactions && driver.financial.transactions.length > 0) {
      let rows = '';
      driver.financial.transactions.forEach(t => {
        rows += `<tr><td>${t.id.slice(-8)}</td><td>${t.desc}</td><td>${t.date}</td><td class="amount">${t.amount} </td></tr>`;
      });
      content.innerHTML = `
        <div class="invoice-box">
          <table class="invoice-table"><thead><tr><th>رقم المعاملة</th><th>الوصف</th><th>التاريخ</th><th>المبلغ</th></tr></thead><tbody>${rows}</tbody></table>
          <div class="invoice-total"><span class="total-label">صافي الأرباح</span><span class="total-value">${netProfit} </span></div>
          <div style="display:flex;justify-content:space-between;margin-top:10px;color:#8892a8;"><span>آخر 30 يوم: ${last30Profit} </span><span>عمولة المنصة: ${totalCommission || 0} </span></div>
        </div>`;
    } else {
      content.innerHTML = '<p style="color:#8892a8;text-align:center;padding:30px;">لا توجد معاملات مسجلة.</p>';
    }
    document.getElementById('reportModal').classList.add('show');
  } catch (err) { alert('حدث خطأ في تحميل التقرير'); }
}

async function viewUserOrdersViaDB(userId) {
  try {
    const res = await adminFetch(`/admin/users/search?id=${userId}`);
    const data = await res.json();
    if (data.error) { alert(data.error); return; }
    const user = data.user;
    document.getElementById('userOrdersName').textContent = `اسم المستخدم: ${user.name} (${user.userId})`;
    const content = document.getElementById('userOrdersContent');
    if (user.orders && user.orders.length > 0) {
      let rows = '';
      user.orders.forEach(o => {
        rows += `<tr><td>${o.orderId}</td><td>${o.type}</td><td>${o.date}</td><td>${o.status}</td><td class="amount">${o.amount} </td></tr>`;
      });
      content.innerHTML = `<div class="invoice-box"><table class="invoice-table"><thead><tr><th>رقم الطلب</th><th>النوع</th><th>التاريخ</th><th>الحالة</th><th>المبلغ</th></tr></thead><tbody>${rows}</tbody></table></div>`;
    } else {
      content.innerHTML = '<p style="color:#8892a8;text-align:center;padding:30px;">لا توجد طلبات مسجلة.</p>';
    }
    document.getElementById('userOrdersModal').classList.add('show');
  } catch (err) { alert('حدث خطأ في تحميل الطلبات'); }
}

function closeDocuments() { document.getElementById('documentsModal').classList.remove('show'); }
document.getElementById('documentsModal').addEventListener('click', function (e) { if (e.target === this) closeDocuments(); });

function closeReport() { document.getElementById('reportModal').classList.remove('show'); }
function closeUserOrders() { document.getElementById('userOrdersModal').classList.remove('show'); }

function closeReportDetail() {
  document.getElementById('reportDetailModal').classList.remove('show');
  currentReportType = null;
  currentReportId = null;
}
document.getElementById('reportDetailModal').addEventListener('click', function (e) { if (e.target === this) closeReportDetail(); });

// ================================================
// 16. مودال القوائم الإحصائية
// ================================================
function openListModal(type, filter, title) {
  document.getElementById('listModalTitle').textContent = title;
  alert('انقر على أيقونة ' + type + ' في الإحصائيات لرؤية القائمة.');
  closeListModal();
}

function closeListModal() { document.getElementById('listModal').classList.remove('show'); }
document.getElementById('listModal').addEventListener('click', function (e) { if (e.target === this) closeListModal(); });

// ================================================
// 17. إعدادات كلمة المرور
// ================================================
function openResetPassword() {
  document.getElementById('resetPasswordModal').classList.add('show');
  document.getElementById('currentPassword').value = '';
  document.getElementById('newPassword').value = '';
  document.getElementById('confirmPassword').value = '';
  document.getElementById('resetMsg').className = 'msg';
  document.getElementById('resetMsg').textContent = '';
}

function closeResetPassword() {
  document.getElementById('resetPasswordModal').classList.remove('show');
}
document.getElementById('resetPasswordModal').addEventListener('click', function (e) {
  if (e.target === this) closeResetPassword();
});

async function handleResetPassword() {
  const current = document.getElementById('currentPassword').value.trim();
  const newPass = document.getElementById('newPassword').value.trim();
  const confirmPass = document.getElementById('confirmPassword').value.trim();
  const msgEl = document.getElementById('resetMsg');

  if (!current || !newPass || !confirmPass) {
    msgEl.className = 'msg error';
    msgEl.textContent = 'الرجاء ملء جميع الحقول.';
    return;
  }
  if (newPass.length < 12) {
    msgEl.className = 'msg error';
    msgEl.textContent = 'كلمة المرور الجديدة يجب أن تكون 12 حرفاً على الأقل.';
    return;
  }
  if (newPass !== confirmPass) {
    msgEl.className = 'msg error';
    msgEl.textContent = 'كلمة المرور وتأكيدها غير متطابقين.';
    return;
  }

  try {
    const res = await adminFetch('/admin/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: current, newPassword: newPass, confirmPassword: confirmPass })
    });
    const data = await res.json();
    if (data.success) {
      msgEl.className = 'msg success';
      msgEl.textContent = 'تم تغيير كلمة المرور بنجاح!';
      setTimeout(() => { closeResetPassword(); }, 2000);
    } else {
      msgEl.className = 'msg error';
      msgEl.textContent = data.message;
    }
  } catch (err) {
    msgEl.className = 'msg error';
    msgEl.textContent = 'حدث خطأ في الاتصال';
  }
}

// ================================================
// 18. محادثات الدعم (Real-time)
// ================================================
let supportSocket = null;
let activeChatUserId = null;
let conversations = [];

function initSupportChat() {
  loadConversations();
  if (!supportSocket || !supportSocket.connected) connectSupportSocket();
}

function connectSupportSocket() {
  supportSocket = io({ transports: ['websocket'] });
  supportSocket.on('connect', () => console.log('Admin socket connected to support'));
  supportSocket.on('support_message', (data) => {
    const badge = document.getElementById('chatBadge');
    const current = parseInt(badge.textContent || '0');
    badge.textContent = current + 1;
    badge.style.display = 'inline-block';
    if (document.getElementById('page-support-chat').classList.contains('active-page')) {
      loadConversations();
      if (activeChatUserId === data.userId) appendChatMessage('user', data.text, data.createdAt);
    }
  });
}

async function loadConversations() {
  try {
    const res = await adminFetch('/api/chat/admin/conversations');
    conversations = await res.json();
    renderConversations();
  } catch (err) { console.error('Load conversations:', err); }
}

function renderConversations() {
  const container = document.getElementById('chatConversations');

  if (!conversations || conversations.length === 0) {
    container.innerHTML = '<p style="color:#8892a8;text-align:center;padding:40px;">لا توجد محادثات حالياً</p>';
    return;
  }

  container.innerHTML = '';

  conversations.forEach((conversation) => {
    const userId = String(conversation.userId || '');
    const userName = conversation.userName || 'Unknown';
    const initial = (userName || 'U')[0].toUpperCase();

    let role = 'مستخدم';
    if (conversation.userRole === 'provider') role = 'سائق';
    if (conversation.userRole === 'guest') role = 'زائر';

    const item = document.createElement('div');
    item.className =
      `conv-item ${activeChatUserId === userId ? 'active' : ''}`;

    const avatar = document.createElement('div');
    avatar.className = 'conv-avatar';
    avatar.textContent = initial;

    const info = document.createElement('div');
    info.className = 'conv-info';

    const name = document.createElement('div');
    name.className = 'conv-name';
    name.textContent = userName;

    const preview = document.createElement('div');
    preview.className = 'conv-preview';
    preview.textContent = conversation.lastMessage || '';

    info.appendChild(name);
    info.appendChild(preview);

    item.appendChild(avatar);
    item.appendChild(info);

    if ((conversation.unread || 0) > 0) {
      const badge = document.createElement('div');
      badge.className = 'conv-badge';
      badge.textContent = String(conversation.unread);
      item.appendChild(badge);
    }

    item.addEventListener('click', () => {
      openSupportChat(
        userId,
        userName,
        conversation.userPublicId || '',
        role,
      );
    });

    container.appendChild(item);
  });
}

async function openSupportChat(
  userId,
  userName,
  userPublicId,
  role,
) {
  activeChatUserId = userId;
  renderConversations();

  const windowEl = document.getElementById('chatWindow');
  const isPublicContact = userId.startsWith('contact:');

  windowEl.innerHTML = isPublicContact
    ? `
      <div class="chat-header">
        <i class="fas fa-user-circle"></i>
        <span id="chatHeaderIdentity"></span>
        <button id="resolveChatButton" style="margin-right:auto;padding:6px 14px;border:none;border-radius:20px;background:#2ecc71;color:#fff;font-weight:700;cursor:pointer;font-size:12px;">
          <i class="fas fa-check"></i> حل المشكلة
        </button>
      </div>
      <div class="chat-messages" id="chatMessagesArea">
        <p style="color:#8892a8;text-align:center;padding:40px;">جاري التحميل...</p>
      </div>
      <div class="chat-input-area">
        <span style="color:#8892a8;font-size:13px;">
          طلب تواصل من زائر — استخدم البريد الإلكتروني أو رقم الهاتف الظاهر في الرسالة للرد.
        </span>
      </div>
    `
    : `
      <div class="chat-header">
        <i class="fas fa-user-circle"></i>
        <span id="chatHeaderIdentity"></span>
        <button id="resolveChatButton" style="margin-right:auto;padding:6px 14px;border:none;border-radius:20px;background:#2ecc71;color:#fff;font-weight:700;cursor:pointer;font-size:12px;">
          <i class="fas fa-check"></i> حل المشكلة
        </button>
      </div>
      <div class="chat-messages" id="chatMessagesArea">
        <p style="color:#8892a8;text-align:center;padding:40px;">جاري التحميل...</p>
      </div>
      <div class="chat-input-area">
        <input
          type="text"
          id="adminChatInput"
          placeholder="اكتب ردك..."
        >
        <button id="adminChatSendButton">
          <i class="fas fa-paper-plane"></i> إرسال
        </button>
      </div>
    `;

  const identity =
    document.getElementById('chatHeaderIdentity');

  if (identity) {
    const publicIdText =
      userPublicId ? ` #${userPublicId}` : '';

    identity.textContent =
      `${userName}${publicIdText} (${role})`;
  }

  const resolveButton =
    document.getElementById('resolveChatButton');

  if (resolveButton) {
    resolveButton.addEventListener(
      'click',
      () => resolveChat(userId),
    );
  }

  if (!isPublicContact) {
    const input =
      document.getElementById('adminChatInput');

    const sendButton =
      document.getElementById('adminChatSendButton');

    if (input) {
      input.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
          sendAdminReply();
        }
      });
    }

    if (sendButton) {
      sendButton.addEventListener(
        'click',
        () => sendAdminReply(),
      );
    }
  }

  loadChatMessages(userId);
}

async function loadChatMessages(userId) {
  try {
    const res = await adminFetch(`/api/chat/admin/messages/${userId}`);
    const messages = await res.json();
    const area = document.getElementById('chatMessagesArea');
    area.innerHTML = '';
    messages.forEach(m => appendChatMessage(m.sender, m.text, m.createdAt));
    area.scrollTop = area.scrollHeight;

    const readRes = await adminFetch(
      `/api/chat/admin/messages/${userId}/read`,
      {
        method: 'POST',
      },
    );

    if (!readRes.ok) {
      console.error(
        `Mark-read failed with HTTP ${readRes.status}`,
      );
    }
  } catch (err) { console.error(err); }
}

function appendChatMessage(sender, text, time) {
  const area = document.getElementById('chatMessagesArea');
  if (!area) return;

  const div = document.createElement('div');
  div.className = `chat-msg ${sender}`;

  const body = document.createElement('div');
  body.className = 'chat-text';
  body.textContent = text || '';

  const timeEl = document.createElement('div');
  timeEl.className = 'chat-time';
  timeEl.textContent = time
    ? new Date(time).toLocaleTimeString(
        'ar-EG',
        {
          hour: '2-digit',
          minute: '2-digit',
        },
      )
    : '';

  div.appendChild(body);
  div.appendChild(timeEl);

  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

async function sendAdminReply() {
  const input =
    document.getElementById('adminChatInput');

  if (
    !input
    || !activeChatUserId
    || activeChatUserId.startsWith('contact:')
  ) {
    return;
  }

  const text = input.value.trim();
  if (!text) return;

  input.value = '';

  try {
    const res = await adminFetch(
      `/api/chat/admin/reply/${activeChatUserId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      },
    );

    if (!res.ok) {
      throw new Error(
        `Reply failed with HTTP ${res.status}`,
      );
    }

    appendChatMessage(
      'admin',
      text,
      new Date().toISOString(),
    );
  } catch (err) {
    console.error(err);
  }
}

async function resolveChat(userId) {
  if (!confirm('هل أنت متأكد من حل هذه المشكلة؟ سيتم حذف جميع رسائل هذه المحادثة.')) return;
  try {
    await adminFetch(`/api/chat/admin/resolve/${userId}`, { method: 'DELETE' });
    activeChatUserId = null;
    document.getElementById('chatWindow').innerHTML = '<div class="chat-empty-state"><i class="fas fa-check-circle" style="font-size:48px;color:#2ecc71;margin-bottom:16px;"></i><p style="color:#8892a8;">تم حل المشكلة بنجاح</p></div>';
    loadConversations();
    document.getElementById('chatBadge').style.display = 'none';
    document.getElementById('chatBadge').textContent = '0';
  } catch (err) { console.error(err); }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// ================================================
// 19. طلبات تسجيل السائقين
// ================================================
async function loadPendingProviders() {
  try {
    const res = await adminFetch('/admin/drivers/pending');
    const pending = await res.json();
    const badge = document.getElementById('pendingBadge');
    badge.textContent = pending.length;
    badge.style.display = pending.length > 0 ? 'inline-block' : 'none';

    if (pending.length === 0) {
      document.getElementById('pendingProvidersContent').innerHTML = '<p style="color:#8892a8;text-align:center;padding:40px;">لا توجد طلبات تسجيل جديدة</p>';
      return;
    }

    let rows = '';
    pending.forEach(p => {
      rows += `<tr>
        <td><strong>${p.fullName}</strong></td>
        <td>${p.email}</td>
        <td>${p.phone}</td>
        <td>${p.area || 'غير محدد'}</td>
        <td>${new Date(p.createdAt).toLocaleDateString('ar-EG')}</td>
        <td>
          <button class="action-btn info" onclick="enterDocs('${p._id}','${escapeHtml(p.fullName)}','${p.email}','${p.phone}','${p.area || ''}')" style="padding:5px 14px;font-size:12px;"><i class="fas fa-file-alt"></i> إدخال وثائق</button>
          <button class="action-btn success" onclick="approveProvider('${p._id}','${p.email}')" style="padding:5px 14px;font-size:12px;"><i class="fas fa-check"></i> قبول</button>
          <button class="action-btn danger" onclick="rejectProvider('${p._id}')" style="padding:5px 14px;font-size:12px;"><i class="fas fa-times"></i> رفض</button>
        </td>
      </tr>`;
    });

    document.getElementById('pendingProvidersContent').innerHTML = `
      <div class="commissions-table-container">
        <h3>قائمة طلبات التسجيل</h3>
        <table class="commissions-table">
          <thead><tr><th>الاسم</th><th>البريد</th><th>الجوال</th><th>المنطقة</th><th>تاريخ التسجيل</th><th>الإجراءات</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  } catch (err) { console.error('Error loading pending providers:', err); }
}

async function approveProvider(id, email) {
  if (!confirm('هل أنت متأكد من قبول طلب هذا السائق؟')) return;
  try {
    const url = email ? `/admin/drivers/pending/${id}/approve?email=${encodeURIComponent(email)}` : `/admin/drivers/pending/${id}/approve`;
    const res = await adminFetch(url, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      loadPendingProviders();
      loadDashboardStats();
    } else {
      alert(data.message);
    }
  } catch (err) { alert('حدث خطأ'); }
}

async function rejectProvider(id) {
  if (!confirm('هل أنت متأكد من رفض طلب هذا السائق؟')) return;
  try {
    const res = await adminFetch(`/admin/drivers/pending/${id}/reject`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      alert(data.message);
      loadPendingProviders();
    } else {
      alert(data.message);
    }
  } catch (err) { alert('حدث خطأ'); }
}

function enterDocs(pendingId, name, email, phone, area) {
  // Store pending ID for the add-driver form to reference
  document.getElementById('addDriverForm').dataset.pendingId = pendingId;
  // Pre-fill fields
  document.querySelector('input[name="driverName"]').value = name;
  document.querySelector('input[name="driverEmail"]').value = email;
  document.querySelector('input[name="driverPhone"]').value = phone;
  const areaSelect = document.getElementById('driverAreaSelect');
  if (areaSelect) {
    for (const opt of areaSelect.options) {
      if (opt.value === area) { opt.selected = true; break; }
    }
  }
  // Switch to add-driver page
  switchPage('add-driver');
  document.querySelectorAll('.sidebar ul li').forEach(li => li.classList.remove('active'));
  document.querySelector('.sidebar ul li[data-page="add-driver"]').classList.add('active');
}
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardStats();
  loadCommissions();
  loadAreasForDropdown();
});

async function loadAreasForDropdown() {
  try {
    const res = await adminFetch('/data/areas.json');
    const data = await res.json();
    const states = data.states || [];
    const select = document.getElementById('driverAreaSelect');
    if (!select) return;

    const westBank = ['القدس','رام الله والبيرة','الخليل','نابلس','بيت لحم','أريحا','سلفيت','جنين','طولكرم','قلقيلية','طوباس'];
    const gaza = ['غزة','خان يونس','رفح','دير البلح','شمال غزة'];
    const interior = ['حيفا','عكا','الناصرة','يافا'];
    const groups = { 'الضفة الغربية': westBank, 'قطاع غزة': gaza, 'الداخل المحتل': interior };

    for (const [groupLabel, groupAreas] of Object.entries(groups)) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = groupLabel;
      for (const name of groupAreas) {
        if (states.find(s => s.name === name)) {
          const option = document.createElement('option');
          option.value = name;
          option.textContent = name;
          optgroup.appendChild(option);
        }
      }
      select.appendChild(optgroup);
    }
  } catch (_) {}
}
