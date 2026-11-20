// ============================================================================
// DTU XÂY DỰNG ADMIN APP (PWA) — QUẢN TRỊ HỆ THỐNG XÂY DỰNG SỐ AI
// Đồng bộ LocalStorage tức thì + Hỗ trợ Firebase Realtime Database REST Sync
// ============================================================================

const ADMIN_STORAGE_KEY = 'dtu_admin_config_v1';
const STATS_STORAGE_KEY = 'dtu_usage_stats_v1';
const CLOUD_URL_KEY = 'dtu_firebase_rtdb_url';
const ADMIN_AUTH_SESSION = 'dtu_admin_logged_in';
const DEFAULT_FIREBASE_URL = 'https://admin1-404b9-default-rtdb.asia-southeast1.firebasedatabase.app';

const DEFAULT_ADMIN_CONFIG = {
  passwordHash: 'dtu2026',
  notice: {
    enabled: false,
    type: 'info',
    text: ''
  },
  autoUpdate: {
    price: false,
    tcvn: false,
    notice: false
  },
  pendingNotice: null,
  appliedPriceVersion: '2026-Q3',
  appliedTcvnIds: [],
  prices: {
    concrete: 1450000,   // đ/m3 bê tông thương phẩm
    steel: 18200000,     // đ/Tấn cốt thép
    labor: 480000,       // đ/công thợ (NC-01)
    machine: 2150000,    // đ/ca máy (MTC-01)
    aac: 285000,         // đ/m2 tường gạch AAC
    brick: 245000,       // đ/m2 tường gạch tuynel
    epoxy: 460000,       // đ/kg Sikadur-752
    cfrp: 1500000,       // đ/m2 SikaWrap CFRP
    sikatop: 135000      // đ/m2 SikaTop Seal-107
  },
  customTcvn: []
};

// Nguồn phát hành Đơn giá mới & Tiêu chuẩn TCVN mới (kiểm tra thông báo cho Admin)
const LATEST_PRICE_RELEASE = {
  version: '2026-Q4',
  source: 'Sở Xây dựng Đà Nẵng & Mặt bằng giá VLXD – Nhân công Quý IV/2026',
  prices: {
    concrete: 1490000,
    steel: 18650000,
    labor: 510000,
    machine: 2250000,
    aac: 295000,
    brick: 255000,
    epoxy: 475000,
    cfrp: 1550000,
    sikatop: 140000
  }
};

const LATEST_TCVN_RELEASES = [
  {
    id: 'rel-tcvn-10304-2024',
    code: 'TCVN 10304:2024',
    clause: 'Thiết kế Móng cọc (Thay thế bản 2014)',
    title: 'Khoảng cách cọc tối thiểu & sức chịu tải cọc ép/khoan nhồi',
    keywords: ['móng cọc', 'cọc', '10304', 'khoảng cách cọc', 'sức chịu tải'],
    summary: 'Khoảng cách tim đến tim giữa các cọc ma sát không nhỏ hơn 3d (cọc chống ≥ 2.5d). Phải kiểm tra sức chịu tải theo vật liệu, theo đất nền (SPT/CPT) và thí nghiệm nén tĩnh hiện trường đối với công trình cấp II trở lên.'
  },
  {
    id: 'rel-qcvn-06-sd1',
    code: 'QCVN 06:2022/BXD (SĐ 1:2023)',
    clause: 'Thông tư 09/2023/TT-BXD — Sửa đổi An toàn cháy',
    title: 'Nới lỏng điều kiện lối thoát nạn & bậc chịu lửa cho nhà ở kết hợp kinh doanh',
    keywords: ['pccc', 'cháy', 'sửa đổi 1', '09/2023', 'thoát nạn', 'qcvn 06'],
    summary: 'Bổ sung quy định riêng cho nhà ở riêng lẻ và nhà kết hợp kinh doanh quy mô nhỏ (≤ 6 tầng), cho phép áp dụng giải pháp ngăn cháy linh hoạt bằng cửa chống cháy EI 45 và hệ thống báo cháy liên động cục bộ.'
  },
  {
    id: 'rel-tt-09-2024-bxd',
    code: 'Thông tư 09/2024/TT-BXD',
    clause: 'Sửa đổi định mức dự toán Thông tư 12/2021/TT-BXD',
    title: 'Cập nhật định mức hao phí vật liệu xanh, bê tông thương phẩm & ca máy',
    keywords: ['định mức', '09/2024', 'thông tư 12', 'dự toán', 'boq', 'nhân công'],
    summary: 'Sửa đổi, bổ sung nhiều mã hiệu định mức công tác bê tông thương phẩm bơm cần, xây tường gạch không nung AAC, lắp đặt hệ thống cơ điện MEP và định mức ca máy thi công hiện đại.'
  }
];

const DEFAULT_STATS = {
  estimator: 0,
  tcvn: 0,
  siteguard: 0,
  crackdoctor: 0,
  pdf: 0,
  logs: []
};

let adminConfig = loadLocalConfig();
let usageStats = loadLocalStats();
let statsChartInstance = null;
let deferredInstallPrompt = null;

function loadLocalConfig() {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_ADMIN_CONFIG);
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_ADMIN_CONFIG,
      ...parsed,
      notice: { ...DEFAULT_ADMIN_CONFIG.notice, ...(parsed.notice || {}) },
      autoUpdate: { ...DEFAULT_ADMIN_CONFIG.autoUpdate, ...(parsed.autoUpdate || {}) },
      pendingNotice: parsed.pendingNotice || null,
      appliedPriceVersion: parsed.appliedPriceVersion || DEFAULT_ADMIN_CONFIG.appliedPriceVersion,
      appliedTcvnIds: Array.isArray(parsed.appliedTcvnIds) ? parsed.appliedTcvnIds : [],
      prices: { ...DEFAULT_ADMIN_CONFIG.prices, ...(parsed.prices || {}) },
      customTcvn: Array.isArray(parsed.customTcvn) ? parsed.customTcvn : []
    };
  } catch {
    return structuredClone(DEFAULT_ADMIN_CONFIG);
  }
}

function loadLocalStats() {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_STATS);
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATS, ...parsed, logs: Array.isArray(parsed.logs) ? parsed.logs : [] };
  } catch {
    return structuredClone(DEFAULT_STATS);
  }
}

function getFirebaseUrl() {
  const saved = localStorage.getItem(CLOUD_URL_KEY);
  if (saved === '__OFF__') return '';
  return ((saved || DEFAULT_FIREBASE_URL) || '').trim().replace(/\/+$/, '');
}

function showToast(msg, isError = false) {
  const el = document.getElementById('admin-toast');
  if (!el) return;
  el.textContent = msg;
  el.className = `fixed top-16 right-4 left-4 sm:left-auto sm:w-80 z-50 p-3.5 rounded-2xl text-xs font-semibold shadow-xl flex items-center gap-2 ${
    isError ? 'bg-rose-700 text-white' : 'bg-slate-900 text-white'
  }`;
  el.classList.remove('hidden');
  clearTimeout(window.__adminToastTimer);
  window.__adminToastTimer = setTimeout(() => el.classList.add('hidden'), 3200);
}

// ============================================================================
// ĐĂNG NHẬP & BẢO MẬT
// ============================================================================

function handleAdminLogin(e) {
  e.preventDefault();
  const input = document.getElementById('admin-login-pass');
  const errBox = document.getElementById('admin-login-error');
  const entered = (input?.value || '').trim();
  const expected = adminConfig.passwordHash || 'dtu2026';

  if (entered === expected) {
    sessionStorage.setItem(ADMIN_AUTH_SESSION, '1');
    if (errBox) errBox.classList.add('hidden');
    if (input) input.value = '';
    openAdminShell();
  } else {
    if (errBox) {
      errBox.textContent = 'Mật khẩu quản trị không đúng. Vui lòng thử lại (mặc định: dtu2026).';
      errBox.classList.remove('hidden');
    }
  }
}

function logoutAdmin() {
  sessionStorage.removeItem(ADMIN_AUTH_SESSION);
  document.getElementById('admin-app-shell')?.classList.add('hidden');
  document.getElementById('admin-login-screen')?.classList.remove('hidden');
}

function openAdminShell() {
  document.getElementById('admin-login-screen')?.classList.add('hidden');
  document.getElementById('admin-app-shell')?.classList.remove('hidden');
  populateAllAdminFields();
  renderStatsDashboard();
  renderCustomTcvnList();
  updateCloudBadgeUI();
  checkPriceUpdates(true);
  checkTcvnUpdates(true);
  renderPendingNoticeBox();
  updateNotificationBell();
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

// ============================================================================
// CHUYỂN TAB GIAO DIỆN (MOBILE BOTTOM NAV + DESKTOP SIDEBAR)
// ============================================================================

function switchAdminTab(tabKey) {
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.add('hidden'));
  document.getElementById(`atab-${tabKey}`)?.classList.remove('hidden');

  document.querySelectorAll('.admin-nav-btn').forEach(btn => {
    btn.classList.toggle('nav-item-active', btn.dataset.atab === tabKey);
  });
  document.querySelectorAll('.admin-bottom-btn').forEach(btn => {
    btn.classList.toggle('bottom-nav-active', btn.dataset.abtn === tabKey);
  });

  if (tabKey === 'overview') {
    usageStats = loadLocalStats();
    renderStatsDashboard();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============================================================================
// ĐỒNG BỘ CLOUD (FIREBASE REALTIME DATABASE REST API)
// ============================================================================

async function pushConfigToCloud() {
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminConfig));
  const url = getFirebaseUrl();
  if (!url) return false;
  try {
    const res = await fetch(`${url}/dtu_admin_config.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...adminConfig, updatedAt: new Date().toISOString() })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } catch (err) {
    showToast(`Đã lưu cục bộ, nhưng lỗi đồng bộ Cloud: ${err.message}`, true);
    return false;
  }
}

async function syncFromCloudNow(silent = false) {
  const url = getFirebaseUrl();
  if (!url) {
    usageStats = loadLocalStats();
    adminConfig = loadLocalConfig();
    populateAllAdminFields();
    renderStatsDashboard();
    renderCustomTcvnList();
    if (!silent) showToast('Đã làm mới dữ liệu cục bộ trên thiết bị.');
    return;
  }

  try {
    const [cfgRes, statRes] = await Promise.all([
      fetch(`${url}/dtu_admin_config.json`),
      fetch(`${url}/dtu_usage_stats.json`)
    ]);
    if (cfgRes.ok) {
      const remoteCfg = await cfgRes.json();
      if (remoteCfg && typeof remoteCfg === 'object') {
        adminConfig = {
          ...DEFAULT_ADMIN_CONFIG,
          ...remoteCfg,
          notice: { ...DEFAULT_ADMIN_CONFIG.notice, ...(remoteCfg.notice || {}) },
          prices: { ...DEFAULT_ADMIN_CONFIG.prices, ...(remoteCfg.prices || {}) },
          customTcvn: Array.isArray(remoteCfg.customTcvn) ? remoteCfg.customTcvn : []
        };
        localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminConfig));
      }
    }
    if (statRes.ok) {
      const remoteStats = await statRes.json();
      if (remoteStats && typeof remoteStats === 'object') {
        usageStats = {
          ...DEFAULT_STATS,
          ...remoteStats,
          logs: Array.isArray(remoteStats.logs) ? remoteStats.logs : []
        };
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(usageStats));
      }
    }
    populateAllAdminFields();
    renderStatsDashboard();
    renderCustomTcvnList();
    updateCloudBadgeUI();
    if (!silent) showToast('Đã đồng bộ dữ liệu mới nhất từ Firebase Cloud!');
  } catch (err) {
    if (!silent) showToast(`Không thể kết nối Firebase: ${err.message}`, true);
  }
}

function updateCloudBadgeUI() {
  const url = getFirebaseUrl();
  const badge = document.getElementById('admin-sync-badge');
  const pill = document.getElementById('cloud-status-pill');
  const input = document.getElementById('cfg-firebase-url');
  if (input && !input.value && url) input.value = url;

  if (url) {
    if (badge) {
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 inline-block"></span><span>Đã đồng bộ Firebase Cloud</span>`;
    }
    if (pill) {
      pill.textContent = 'Đang đồng bộ Cloud';
      pill.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  } else {
    if (badge) {
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-300 inline-block"></span><span>Chế độ Cục bộ (Local)</span>`;
    }
    if (pill) {
      pill.textContent = 'Chưa gắn Cloud';
      pill.className = 'px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200';
    }
  }
}

async function saveCloudConfig() {
  const input = document.getElementById('cfg-firebase-url');
  const url = (input?.value || '').trim().replace(/\/+$/, '');
  if (!url || !url.startsWith('https://')) {
    showToast('Vui lòng nhập đúng đường dẫn Firebase bắt đầu bằng https://', true);
    return;
  }
  localStorage.setItem(CLOUD_URL_KEY, url);
  updateCloudBadgeUI();
  const ok = await pushConfigToCloud();
  if (ok) {
    showToast('Kết nối & đẩy cấu hình lên Firebase Cloud thành công!');
  }
}

function disconnectCloud() {
  localStorage.setItem(CLOUD_URL_KEY, '__OFF__');
  const input = document.getElementById('cfg-firebase-url');
  if (input) input.value = '';
  updateCloudBadgeUI();
  showToast('Đã ngắt kết nối Cloud — chuyển về chế độ Cục bộ.');
}

// ============================================================================
// ĐỔ DỮ LIỆU RA FORM & LƯU ĐƠN GIÁ / THÔNG BÁO / KHO TCVN
// ============================================================================

function populateAllAdminFields() {
  const p = adminConfig.prices;
  const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  setVal('cfg-price-concrete', p.concrete);
  setVal('cfg-price-steel', p.steel);
  setVal('cfg-price-labor', p.labor);
  setVal('cfg-price-machine', p.machine);
  setVal('cfg-price-aac', p.aac);
  setVal('cfg-price-brick', p.brick);
  setVal('cfg-price-epoxy', p.epoxy);
  setVal('cfg-price-cfrp', p.cfrp);
  setVal('cfg-price-sikatop', p.sikatop);

  const nEnabled = document.getElementById('cfg-notice-enabled');
  if (nEnabled) nEnabled.checked = Boolean(adminConfig.notice.enabled);
  setVal('cfg-notice-type', adminConfig.notice.type || 'info');
  setVal('cfg-notice-text', adminConfig.notice.text || '');
  setVal('cfg-firebase-url', getFirebaseUrl());

  const autoPriceEl = document.getElementById('cfg-auto-price');
  if (autoPriceEl) autoPriceEl.checked = Boolean(adminConfig.autoUpdate?.price);
  const autoTcvnEl = document.getElementById('cfg-auto-tcvn');
  if (autoTcvnEl) autoTcvnEl.checked = Boolean(adminConfig.autoUpdate?.tcvn);
  const autoNoticeEl = document.getElementById('cfg-auto-notice');
  if (autoNoticeEl) autoNoticeEl.checked = Boolean(adminConfig.autoUpdate?.notice);
}

async function saveAdminPrices() {
  const num = (id, fb) => Math.max(1000, parseInt(document.getElementById(id)?.value, 10) || fb);
  adminConfig.prices = {
    concrete: num('cfg-price-concrete', DEFAULT_ADMIN_CONFIG.prices.concrete),
    steel: num('cfg-price-steel', DEFAULT_ADMIN_CONFIG.prices.steel),
    labor: num('cfg-price-labor', DEFAULT_ADMIN_CONFIG.prices.labor),
    machine: num('cfg-price-machine', DEFAULT_ADMIN_CONFIG.prices.machine),
    aac: num('cfg-price-aac', DEFAULT_ADMIN_CONFIG.prices.aac),
    brick: num('cfg-price-brick', DEFAULT_ADMIN_CONFIG.prices.brick),
    epoxy: num('cfg-price-epoxy', DEFAULT_ADMIN_CONFIG.prices.epoxy),
    cfrp: num('cfg-price-cfrp', DEFAULT_ADMIN_CONFIG.prices.cfrp),
    sikatop: num('cfg-price-sikatop', DEFAULT_ADMIN_CONFIG.prices.sikatop)
  };
  await pushConfigToCloud();
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  await queueNoticeFromUpdate(
    `Đã cập nhật bảng Đơn giá Xây dựng mới: Bê tông ${fmt(adminConfig.prices.concrete)} đ/m³, Cốt thép ${fmt(adminConfig.prices.steel)} đ/Tấn, Nhân công NC-01 ${fmt(adminConfig.prices.labor)} đ/công, Máy thi công MTC-01 ${fmt(adminConfig.prices.machine)} đ/ca.`,
    'Cập nhật Đơn giá BOQ'
  );
  showToast('Đã lưu đơn giá! Nội dung thông báo đã được soạn sẵn trong mục Thông báo.');
}

async function resetDefaultPrices() {
  adminConfig.prices = structuredClone(DEFAULT_ADMIN_CONFIG.prices);
  populateAllAdminFields();
  await pushConfigToCloud();
  showToast('Đã khôi phục bảng đơn giá chuẩn mặc định.');
}

async function saveAdminNotice() {
  adminConfig.notice = {
    enabled: Boolean(document.getElementById('cfg-notice-enabled')?.checked),
    type: document.getElementById('cfg-notice-type')?.value || 'info',
    text: (document.getElementById('cfg-notice-text')?.value || '').trim()
  };
  await pushConfigToCloud();
  showToast(adminConfig.notice.enabled ? 'Đã bật thông báo trên web chính!' : 'Đã tắt thanh thông báo trên web chính.');
}

async function addCustomTcvn() {
  const code = (document.getElementById('new-tcvn-code')?.value || '').trim();
  const clause = (document.getElementById('new-tcvn-clause')?.value || '').trim() || 'Quy định chung';
  const title = (document.getElementById('new-tcvn-title')?.value || '').trim();
  const kwRaw = (document.getElementById('new-tcvn-keywords')?.value || '').trim();
  const summary = (document.getElementById('new-tcvn-summary')?.value || '').trim();

  if (!code || !title || !summary) {
    showToast('Vui lòng nhập đầy đủ Mã tiêu chuẩn, Tiêu đề và Tóm tắt!', true);
    return;
  }

  const keywords = kwRaw
    ? kwRaw.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
    : [code.toLowerCase(), title.toLowerCase()];

  adminConfig.customTcvn.unshift({
    id: `tcvn-${Date.now()}`,
    code,
    clause,
    title,
    keywords,
    summary
  });

  ['new-tcvn-code', 'new-tcvn-clause', 'new-tcvn-title', 'new-tcvn-keywords', 'new-tcvn-summary'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  renderCustomTcvnList();
  await pushConfigToCloud();
  await queueNoticeFromUpdate(
    `Kho Tiêu chuẩn Xây dựng vừa bổ sung điều khoản mới: ${code} (${title}).`,
    'Bổ sung Kho TCVN'
  );
  showToast(`Đã thêm ${code}! Thông báo cập nhật đã được đưa vào mục Thông báo.`);
}

async function deleteCustomTcvn(id) {
  adminConfig.customTcvn = adminConfig.customTcvn.filter(item => item.id !== id);
  renderCustomTcvnList();
  await pushConfigToCloud();
  showToast('Đã xóa điều khoản khỏi kho TCVN.');
}

function renderCustomTcvnList() {
  const list = document.getElementById('admin-tcvn-list');
  if (!list) return;
  if (!adminConfig.customTcvn.length) {
    list.innerHTML = `<div class="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400 text-center">Chưa có điều khoản bổ sung nào. Bạn có thể thêm ở khung phía trên.</div>`;
    return;
  }
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  list.innerHTML = adminConfig.customTcvn.map(item => `
    <div class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
      <div class="flex items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="px-2 py-0.5 rounded bg-[#fdf2f4] text-[#8b1e2b] border border-[#8b1e2b]/20 text-[11px] font-bold">${esc(item.code)}</span>
          <span class="text-[11px] text-slate-500 font-medium">${esc(item.clause)}</span>
        </div>
        <button onclick="deleteCustomTcvn('${item.id}')" class="text-[11px] font-semibold text-rose-600 hover:underline shrink-0">Xóa</button>
      </div>
      <div class="text-xs font-bold text-slate-900">${esc(item.title)}</div>
      <div class="text-xs text-slate-600 leading-relaxed">${esc(item.summary)}</div>
    </div>
  `).join('');
}

async function changeAdminPassword() {
  const p1 = (document.getElementById('cfg-new-pass')?.value || '').trim();
  const p2 = (document.getElementById('cfg-new-pass-confirm')?.value || '').trim();
  if (p1.length < 4) {
    showToast('Mật khẩu mới phải có ít nhất 4 ký tự!', true);
    return;
  }
  if (p1 !== p2) {
    showToast('Hai lần nhập mật khẩu không khớp nhau!', true);
    return;
  }
  adminConfig.passwordHash = p1;
  document.getElementById('cfg-new-pass').value = '';
  document.getElementById('cfg-new-pass-confirm').value = '';
  await pushConfigToCloud();
  showToast('Đã đổi mật khẩu quản trị thành công!');
}

// ============================================================================
// BIỂU ĐỒ THỐNG KÊ & NHẬT KÝ HOẠT ĐỘNG
// ============================================================================

function renderStatsDashboard() {
  const s = usageStats;
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt('stat-estimator', s.estimator || 0);
  setTxt('stat-tcvn', s.tcvn || 0);
  setTxt('stat-vision', (s.siteguard || 0) + (s.crackdoctor || 0));
  setTxt('stat-pdf', s.pdf || 0);

  const canvas = document.getElementById('admin-stats-chart');
  if (canvas && typeof Chart !== 'undefined') {
    if (statsChartInstance) statsChartInstance.destroy();
    statsChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['Dự toán BOQ', 'Tra cứu TCVN', 'An toàn HSE', 'Bác sĩ CT', 'Xuất PDF'],
        datasets: [{
          label: 'Số lượt thực hiện',
          data: [s.estimator || 0, s.tcvn || 0, s.siteguard || 0, s.crackdoctor || 0, s.pdf || 0],
          backgroundColor: ['#8b1e2b', '#0369a1', '#047857', '#b45309', '#475569'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0, font: { size: 11 } }, grid: { color: '#f1f5f9' } },
          x: { ticks: { font: { size: 11 } }, grid: { display: false } }
        }
      }
    });
  }

  const logBox = document.getElementById('admin-activity-log');
  if (logBox) {
    if (!s.logs || !s.logs.length) {
      logBox.innerHTML = `<div class="p-4 rounded-xl bg-slate-50 text-slate-400 text-center">Chưa có hoạt động nào. Khi người dùng tính dự toán, tra cứu TCVN, quét ảnh hoặc xuất PDF trên web chính, nhật ký sẽ hiện tại đây.</div>`;
    } else {
      const esc = (str) => String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      logBox.innerHTML = s.logs.slice(0, 20).map(l => `
        <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-2">
          <div class="font-medium text-slate-700">${esc(l.action)}</div>
          <div class="font-mono-tech text-[10px] text-slate-400 shrink-0">${esc(l.time)}</div>
        </div>
      `).join('');
    }
  }
}

async function resetAnalyticsStats() {
  usageStats = structuredClone(DEFAULT_STATS);
  localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(usageStats));
  const url = getFirebaseUrl();
  if (url) {
    fetch(`${url}/dtu_usage_stats.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usageStats)
    }).catch(() => {});
  }
  renderStatsDashboard();
  showToast('Đã đặt lại số liệu thống kê về 0.');
}

// ============================================================================
// CÀI ĐẶT PWA LÊN ĐIỆN THOẠI (iOS SAFARI + ANDROID CHROME)
// ============================================================================

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

async function triggerInstallPWA() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const { outcome } = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (outcome === 'accepted') showToast('Đang cài đặt ứng dụng DTU Admin lên điện thoại!');
  } else {
    showInstallGuideModal();
  }
}

function showInstallGuideModal() {
  document.getElementById('install-guide-modal')?.classList.remove('hidden');
  if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
}

function closeInstallGuideModal() {
  document.getElementById('install-guide-modal')?.classList.add('hidden');
}

// ============================================================================
// TRUNG TÂM THÔNG BÁO & CẬP NHẬT TỰ ĐỘNG (ĐƠN GIÁ MỚI + TCVN MỚI)
// ============================================================================

function getPendingTcvnList() {
  const applied = new Set(adminConfig.appliedTcvnIds || []);
  const existingCodes = new Set((adminConfig.customTcvn || []).map(x => x.code));
  return LATEST_TCVN_RELEASES.filter(item => !applied.has(item.id) && !existingCodes.has(item.code));
}

function hasPendingPriceRelease() {
  return adminConfig.appliedPriceVersion !== LATEST_PRICE_RELEASE.version;
}

function updateNotificationBell() {
  const badge = document.getElementById('admin-bell-badge');
  if (!badge) return;
  const priceCount = hasPendingPriceRelease() ? 1 : 0;
  const tcvnCount = getPendingTcvnList().length;
  const noticeCount = adminConfig.pendingNotice ? 1 : 0;
  const total = priceCount + tcvnCount + noticeCount;
  if (total > 0) {
    badge.textContent = total;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

function openPendingUpdatesTab() {
  if (adminConfig.pendingNotice) {
    switchAdminTab('notice');
    renderPendingNoticeBox();
  } else if (hasPendingPriceRelease()) {
    switchAdminTab('prices');
    checkPriceUpdates(false);
  } else if (getPendingTcvnList().length > 0) {
    switchAdminTab('tcvn');
    checkTcvnUpdates(false);
  } else {
    showToast('Tuyệt vời! Đơn giá, Kho TCVN và Thông báo đều đã cập nhật đầy đủ.');
  }
}

async function queueNoticeFromUpdate(summaryText, sourceLabel) {
  const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN');
  if (adminConfig.autoUpdate?.notice) {
    adminConfig.notice = {
      enabled: true,
      type: 'success',
      text: summaryText
    };
    adminConfig.pendingNotice = null;
    populateAllAdminFields();
    renderPendingNoticeBox();
    await pushConfigToCloud();
    updateNotificationBell();
    showToast('[Tự động duyệt] Đã tự động đăng Thông báo cập nhật lên Web chính!');
    return;
  }

  adminConfig.pendingNotice = {
    source: sourceLabel,
    time: nowStr,
    text: summaryText
  };
  renderPendingNoticeBox();
  await pushConfigToCloud();
  updateNotificationBell();
}

function renderPendingNoticeBox() {
  const box = document.getElementById('pending-notice-box');
  if (!box) return;
  const pending = adminConfig.pendingNotice;
  if (!pending || !pending.text) {
    box.className = 'p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400';
    box.textContent = 'Chưa có thông báo cập nhật nào đang chờ duyệt. Khi bạn duyệt Đơn giá mới hoặc TCVN mới, nội dung tóm tắt sẽ tự động hiện tại đây.';
    return;
  }
  const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  box.className = 'p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-2.5';
  box.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div class="text-xs font-extrabold text-amber-900">Bản nháp Thông báo chờ duyệt (${esc(pending.source)})</div>
      <span class="font-mono-tech text-[10px] px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">${esc(pending.time)}</span>
    </div>
    <textarea id="pending-notice-editor" rows="3" class="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs text-slate-800">${esc(pending.text)}</textarea>
    <div class="flex flex-wrap gap-2">
      <button onclick="approvePendingNotice()" class="px-3.5 py-2 rounded-lg btn-dtu text-xs font-bold transition">Duyệt &amp; Đăng lên Web chính ngay</button>
      <button onclick="discardPendingNotice()" class="px-3 py-2 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-semibold">Bỏ qua</button>
    </div>
  `;
}

async function approvePendingNotice() {
  const editor = document.getElementById('pending-notice-editor');
  const finalText = (editor ? editor.value : (adminConfig.pendingNotice?.text || '')).trim();
  if (!finalText) return;
  adminConfig.notice = {
    enabled: true,
    type: 'success',
    text: finalText
  };
  adminConfig.pendingNotice = null;
  populateAllAdminFields();
  renderPendingNoticeBox();
  await pushConfigToCloud();
  updateNotificationBell();
  showToast('Đã duyệt & đăng Thông báo cập nhật lên Web chính!');
}

async function discardPendingNotice() {
  adminConfig.pendingNotice = null;
  renderPendingNoticeBox();
  await pushConfigToCloud();
  updateNotificationBell();
  showToast('Đã bỏ qua bản nháp thông báo.');
}

async function toggleAutoUpdate(kind) {
  if (!adminConfig.autoUpdate) adminConfig.autoUpdate = { price: false, tcvn: false, notice: false };
  const idMap = { price: 'cfg-auto-price', tcvn: 'cfg-auto-tcvn', notice: 'cfg-auto-notice' };
  const isOn = Boolean(document.getElementById(idMap[kind])?.checked);
  adminConfig.autoUpdate[kind] = isOn;
  await pushConfigToCloud();

  if (kind === 'price') {
    if (isOn) {
      showToast('Đã BẬT Tự động cập nhật Đơn giá mới!');
      await checkPriceUpdates(false);
    } else {
      showToast('Đã TẮT Tự động cập nhật Đơn giá (chuyển sang duyệt thủ công).');
      checkPriceUpdates(true);
    }
  } else if (kind === 'tcvn') {
    if (isOn) {
      showToast('Đã BẬT Tự động cập nhật Tiêu chuẩn TCVN mới!');
      await checkTcvnUpdates(false);
    } else {
      showToast('Đã TẮT Tự động cập nhật TCVN (chuyển sang duyệt thủ công).');
      checkTcvnUpdates(true);
    }
  } else if (kind === 'notice') {
    if (isOn) {
      showToast('Đã BẬT Tự động duyệt & đăng Thông báo lên Web!');
      if (adminConfig.pendingNotice) {
        await approvePendingNotice();
      }
    } else {
      showToast('Đã TẮT Tự động duyệt Thông báo (chuyển sang duyệt thủ công).');
    }
  }
}

async function checkPriceUpdates(silent = false) {
  const alertBox = document.getElementById('price-update-alert');
  const lastEl = document.getElementById('price-last-check');
  const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (lastEl) lastEl.textContent = `Đã kiểm tra lúc ${nowStr} • Phiên bản đang dùng: ${adminConfig.appliedPriceVersion || '2026-Q3'}`;

  if (!hasPendingPriceRelease()) {
    if (alertBox) {
      if (silent) {
        alertBox.classList.add('hidden');
      } else {
        alertBox.className = 'p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium';
        alertBox.innerHTML = `Đơn giá trên web đang ở phiên bản mới nhất (<strong>${LATEST_PRICE_RELEASE.version}</strong>).`;
      }
    }
    updateNotificationBell();
    return;
  }

  // Nếu người dùng ĐÃ BẬT công tắc tự động cập nhật -> Tự áp dụng luôn!
  if (adminConfig.autoUpdate?.price) {
    await applyPendingPriceUpdate(true);
    return;
  }

  // Nếu đang TẮT tự động -> Hiện thông báo chi tiết để Admin duyệt thủ công
  if (alertBox) {
    const fmt = (n) => Number(n).toLocaleString('vi-VN');
    const cur = adminConfig.prices;
    const nxt = LATEST_PRICE_RELEASE.prices;
    alertBox.className = 'p-3.5 rounded-xl bg-amber-50 border border-amber-300 space-y-2.5';
    alertBox.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs font-extrabold text-amber-900">Phát hiện bảng Đơn giá mới (${LATEST_PRICE_RELEASE.version})!</div>
        <span class="px-2 py-0.5 rounded bg-amber-200 text-amber-900 text-[10px] font-bold">Chờ Admin duyệt</span>
      </div>
      <div class="text-[11px] text-amber-800">Nguồn: ${LATEST_PRICE_RELEASE.source}</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-700 bg-white/80 p-2.5 rounded-lg border border-amber-200 font-mono-tech">
        <div>Bê tông: ${fmt(cur.concrete)} → <strong class="text-[#8b1e2b]">${fmt(nxt.concrete)} đ/m³</strong></div>
        <div>Cốt thép: ${fmt(cur.steel)} → <strong class="text-[#8b1e2b]">${fmt(nxt.steel)} đ/T</strong></div>
        <div>Nhân công NC-01: ${fmt(cur.labor)} → <strong class="text-[#8b1e2b]">${fmt(nxt.labor)} đ/công</strong></div>
        <div>Máy thi công MTC-01: ${fmt(cur.machine)} → <strong class="text-[#8b1e2b]">${fmt(nxt.machine)} đ/ca</strong></div>
      </div>
      <div class="flex flex-wrap gap-2 pt-0.5">
        <button onclick="applyPendingPriceUpdate(false)" class="px-3.5 py-2 rounded-lg btn-dtu text-xs font-bold transition">Duyệt &amp; Cập nhật lên Web ngay</button>
        <button onclick="dismissPriceUpdate()" class="px-3 py-2 rounded-lg bg-white border border-amber-300 text-amber-900 text-xs font-semibold">Bỏ qua bản này</button>
      </div>
    `;
  }
  updateNotificationBell();
  if (!silent) showToast(`Có đợt điều chỉnh Đơn giá mới (${LATEST_PRICE_RELEASE.version}) đang chờ duyệt!`);
}

async function applyPendingPriceUpdate(isAuto = false) {
  adminConfig.prices = { ...adminConfig.prices, ...LATEST_PRICE_RELEASE.prices };
  adminConfig.appliedPriceVersion = LATEST_PRICE_RELEASE.version;
  populateAllAdminFields();
  await pushConfigToCloud();
  const alertBox = document.getElementById('price-update-alert');
  if (alertBox) {
    alertBox.className = 'p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium';
    alertBox.innerHTML = `${isAuto ? '<strong>[Tự động cập nhật]</strong> ' : ''}Đã áp dụng bảng Đơn giá mới <strong>${LATEST_PRICE_RELEASE.version}</strong> lên trang web chính!`;
  }
  updateNotificationBell();
  const fmt = (n) => Number(n).toLocaleString('vi-VN');
  await queueNoticeFromUpdate(
    `Hệ thống vừa cập nhật bảng Đơn giá Xây dựng (${LATEST_PRICE_RELEASE.version}): Bê tông ${fmt(LATEST_PRICE_RELEASE.prices.concrete)} đ/m³, Cốt thép ${fmt(LATEST_PRICE_RELEASE.prices.steel)} đ/Tấn, Nhân công NC-01 ${fmt(LATEST_PRICE_RELEASE.prices.labor)} đ/công, Máy thi công MTC-01 ${fmt(LATEST_PRICE_RELEASE.prices.machine)} đ/ca.`,
    `Đơn giá ${LATEST_PRICE_RELEASE.version}`
  );
  showToast(isAuto
    ? `Đã tự động cập nhật Đơn giá mới (${LATEST_PRICE_RELEASE.version}) lên web!`
    : `Đã duyệt Đơn giá ${LATEST_PRICE_RELEASE.version}! Bản nháp thông báo đã sẵn sàng trong mục Thông báo.`);
}

async function dismissPriceUpdate() {
  adminConfig.appliedPriceVersion = LATEST_PRICE_RELEASE.version;
  await pushConfigToCloud();
  document.getElementById('price-update-alert')?.classList.add('hidden');
  updateNotificationBell();
  showToast('Đã bỏ qua thông báo đơn giá này.');
}

async function checkTcvnUpdates(silent = false) {
  const alertBox = document.getElementById('tcvn-update-alert');
  const lastEl = document.getElementById('tcvn-last-check');
  const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (lastEl) lastEl.textContent = `Đã kiểm tra lúc ${nowStr} • Kho bổ sung hiện có ${(adminConfig.customTcvn || []).length} điều khoản.`;

  const pending = getPendingTcvnList();
  if (!pending.length) {
    if (alertBox) {
      if (silent) {
        alertBox.classList.add('hidden');
      } else {
        alertBox.className = 'p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium';
        alertBox.innerHTML = 'Kho Tiêu chuẩn TCVN / QCVN đã cập nhật đầy đủ các văn bản mới nhất.';
      }
    }
    updateNotificationBell();
    return;
  }

  // Nếu người dùng ĐÃ BẬT công tắc tự động cập nhật -> Tự nạp luôn!
  if (adminConfig.autoUpdate?.tcvn) {
    await applyPendingTcvnUpdates(true);
    return;
  }

  // Nếu đang TẮT tự động -> Hiện thông báo chờ Admin duyệt
  if (alertBox) {
    alertBox.className = 'p-3.5 rounded-xl bg-sky-50 border border-sky-300 space-y-2.5';
    alertBox.innerHTML = `
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs font-extrabold text-sky-900">Phát hiện ${pending.length} Tiêu chuẩn TCVN / QCVN mới!</div>
        <span class="px-2 py-0.5 rounded bg-sky-200 text-sky-900 text-[10px] font-bold">Chờ Admin duyệt</span>
      </div>
      <div class="space-y-1.5">
        ${pending.map(it => `
          <div class="p-2.5 rounded-lg bg-white border border-sky-200 text-[11px]">
            <div class="font-bold text-slate-900"><span class="text-[#8b1e2b]">${it.code}</span> — ${it.title}</div>
            <div class="text-slate-600 mt-0.5">${it.summary}</div>
          </div>
        `).join('')}
      </div>
      <div class="flex flex-wrap gap-2 pt-0.5">
        <button onclick="applyPendingTcvnUpdates(false)" class="px-3.5 py-2 rounded-lg btn-dtu text-xs font-bold transition">Duyệt &amp; Nạp tất cả lên Web</button>
      </div>
    `;
  }
  updateNotificationBell();
  if (!silent) showToast(`Có ${pending.length} tiêu chuẩn TCVN / QCVN mới đang chờ duyệt!`);
}

async function applyPendingTcvnUpdates(isAuto = false) {
  const pending = getPendingTcvnList();
  if (!pending.length) return;
  if (!Array.isArray(adminConfig.appliedTcvnIds)) adminConfig.appliedTcvnIds = [];
  pending.forEach(item => {
    adminConfig.customTcvn.unshift({ ...item });
    if (!adminConfig.appliedTcvnIds.includes(item.id)) {
      adminConfig.appliedTcvnIds.push(item.id);
    }
  });
  renderCustomTcvnList();
  await pushConfigToCloud();

  const alertBox = document.getElementById('tcvn-update-alert');
  if (alertBox) {
    alertBox.className = 'p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium';
    alertBox.innerHTML = `${isAuto ? '<strong>[Tự động cập nhật]</strong> ' : ''}Đã nạp thành công <strong>${pending.length} tiêu chuẩn TCVN / QCVN mới</strong> vào Kho tra cứu trên web chính!`;
  }
  updateNotificationBell();
  const codesStr = pending.map(it => it.code).join(', ');
  await queueNoticeFromUpdate(
    `Kho Tiêu chuẩn Xây dựng vừa cập nhật ${pending.length} văn bản mới: ${codesStr}.`,
    `Cập nhật ${pending.length} TCVN mới`
  );
  showToast(isAuto
    ? `Đã tự động nạp ${pending.length} tiêu chuẩn TCVN mới lên web!`
    : `Đã duyệt ${pending.length} TCVN mới! Bản nháp thông báo đã sẵn sàng trong mục Thông báo.`);
}

// ============================================================================
// KHỞI ĐỘNG ỨNG DỤNG ADMIN
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw-admin.js').catch(() => {});
  }
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }

  if (sessionStorage.getItem(ADMIN_AUTH_SESSION) === '1') {
    openAdminShell();
    syncFromCloudNow(true);
  }
});
