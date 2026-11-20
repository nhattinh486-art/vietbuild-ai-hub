// ============================================================================
// VIETBUILD AI STUDIO - CORE ENGINE (DUAL MODE: REAL GEMINI API + SMART DEMO)
// ============================================================================

const AppState = {
  aiMode: 'demo', // 'demo' | 'gemini'
  apiKey: localStorage.getItem('VIETBUILD_GEMINI_KEY') || '',
  currentTab: 'dashboard',
  charts: {},
  siteScenario: 'scaffold',
  crackScenario: 'shear_beam',
  uploadedSiteImage: null,
  uploadedCrackImage: null,
};

// ============================================================================
// 1. DATABASE & PRESETS NGÀNH XÂY DỰNG VIỆT NAM
// ============================================================================

const TCVN_KNOWLEDGE = [
  {
    code: 'TCVN 5574:2018',
    title: 'Thiết kế kết cấu bê tông và bê tông cốt thép',
    clause: 'Mục 10.3.2 - Lớp bê tông bảo vệ cốt thép',
    summary: 'Chiều dày tối thiểu lớp bê tông bảo vệ cốt thép chịu lực (c₀): Trong nhà (độ ẩm thường): Sàn/tường ≥ 20 mm, Dầm/cột ≥ 25 mm. Ngoài trời hoặc tiếp xúc đất (có lớp lót): ≥ 30 mm. Móng lắp ghép/đổ tại chỗ không có bê tông lót: ≥ 40 mm – 70 mm. Môi trường biển/ăn mòn: 40 mm – 50 mm.',
    keywords: ['bảo vệ', 'lớp bê tông', 'c0', '5574', 'dầm', 'cột', 'móng', 'cốt thép', 'bê tông']
  },
  {
    code: 'TCVN 5574:2018',
    title: 'Thiết kế kết cấu bê tông và bê tông cốt thép',
    clause: 'Mục 8.2.2 - Giới hạn bề rộng vết nứt (a_crc)',
    summary: 'Để đảm bảo an toàn chống ăn mòn cốt thép: Bề rộng vết nứt giới hạn dài hạn a_crc,1 ≤ 0,3 mm và ngắn hạn a_crc,2 ≤ 0,4 mm (trong môi trường bình thường). Trong môi trường xâm thực mạnh: dài hạn ≤ 0,2 mm, ngắn hạn ≤ 0,3 mm.',
    keywords: ['vết nứt', 'bề rộng', 'acrc', '0.3', 'nứt', 'giới hạn']
  },
  {
    code: 'TCVN 2737:2023',
    title: 'Tải trọng và tác động (Phiên bản mới thay thế 1995)',
    clause: 'Bảng 4 - Giá trị tiêu chuẩn của hoạt tải phân bố đều lên sàn',
    summary: 'Nhà ở, căn hộ: 1,5 kN/m² (150 kg/m²). Văn phòng làm việc, phòng học: 2,0 kN/m². Hành lang, cầu thang nhà ở: 3,0 kN/m². Sàn hội trường, khu thương mại đông người: 4,0 – 5,0 kN/m². Hệ số độ tin cậy về tải trọng γ_f thường lấy = 1,3.',
    keywords: ['tải trọng', 'hoạt tải', '2737', 'sàn', 'gió', 'nhà ở', 'văn phòng', 'hệ số vượt tải']
  },
  {
    code: 'QCVN 06:2022/BXD (Sửa đổi 1:2023)',
    title: 'Quy chuẩn kỹ thuật quốc gia về An toàn cháy cho nhà và công trình',
    clause: 'Phần 3 - Đảm bảo an toàn cho người (Lối và đường thoát nạn)',
    summary: 'Chiều rộng thông thủy của bản thang và chiếu thang thoát nạn không nhỏ hơn 1,0 m (nhà thông thường) và 1,2 m (nhà có trên 200 người ở tầng bất kỳ). Chiều rộng hành lang thoát nạn không nhỏ hơn 1,2 m (khi số người ≤ 50) và 1,4 m (khi > 50 người).',
    keywords: ['pccc', 'cháy', 'qcvn 06', 'thoát nạn', 'cầu thang', 'hành lang', 'bậc chịu lửa']
  },
  {
    code: 'TCVN 9362:2012',
    title: 'Tiêu chuẩn thiết kế nền nhà và công trình',
    clause: 'Bảng 16 - Giới hạn biến dạng của nền (Độ lún giới hạn S_gh)',
    summary: 'Đối với nhà khung bê tông cốt thép hoàn chỉnh: Độ lún tuyệt đối lớn nhất S_gh ≤ 8 cm; Độ lệch lún tương đối ΔS/L ≤ 0,002. Đối với nhà tường chịu lực không cốt thép: S_gh ≤ 10 cm, độ võng tương đối ≤ 0,0007.',
    keywords: ['móng', 'lún', 'nền', '9362', 'địa chất', 'biến dạng', 'độ lún']
  }
];

const SITE_SCENARIOS = {
  scaffold: {
    name: 'Kịch bản 1: Thi công giàn giáo & cốt thép sàn tầng 4',
    score: 68,
    riskLevel: 'Cảnh báo Trung bình - Cao',
    workersCount: 14,
    ppeCompliant: 11,
    violations: [
      { id: 'V1', title: 'Thiếu mũ bảo hộ lao động', location: 'Khu vực gia công thép trục B-C', severity: 'Cao', box: { x: 14, y: 28, w: 22, h: 36 }, color: '#ef4444' },
      { id: 'V2', title: 'Giàn giáo ngoài thiếu thanh giằng ngang & lưới bao che', location: 'Biên sàn hướng Đông (Trục 4)', severity: 'Nghiêm trọng', box: { x: 58, y: 18, w: 32, h: 48 }, color: '#f97316' },
      { id: 'V3', title: 'Vật tư thép vụn & ván khuôn để chắn lối đi', location: 'Hành lang vận chuyển chính', severity: 'Trung bình', box: { x: 28, y: 68, w: 38, h: 22 }, color: '#eab308' }
    ],
    diary: {
      date: '18/11/2026',
      weather: 'Nắng ráo, nhiệt độ 29°C - 33°C, gió nhẹ (Thuận lợi đổ bê tông)',
      manpower: '14 công nhân (8 thợ sắt, 4 thợ cốp pha, 2 phụ hồ) + 2 Kỹ sư giám sát hiện trường',
      progress: 'Hoàn thành 85% lắp dựng cốt thép dầm sàn tầng 4 (Trục A-D, 1-5). Đã nghiệm thu nội bộ tim trục và cao độ cốp pha đáy dầm.',
      actionRequired: 'Yêu cầu tổ đội trưởng nhắc nhở 02 công nhân đội mũ bảo hộ ngay lập tức; Bổ sung lan can an toàn cao 1.1m tại biên sàn trục 4 trước 14h00 chiều nay.'
    }
  },
  concrete_pour: {
    name: 'Kịch bản 2: Công tác bơm đổ bê tông sàn ban đêm',
    score: 88,
    riskLevel: 'An toàn Khá (Đạt chuẩn HSE)',
    workersCount: 18,
    ppeCompliant: 17,
    violations: [
      { id: 'V1', title: 'Dây nguồn đầm dùi đi qua vũng nước đọng trên sàn', location: 'Gần phễu xả bơm cần trục B-2', severity: 'Cao (Nguy cơ rò điện)', box: { x: 46, y: 62, w: 28, h: 24 }, color: '#ef4444' }
    ],
    diary: {
      date: '18/11/2026 (Ca tối 19h00 - 23h30)',
      weather: 'Trời mát 26°C, độ ẩm 78%, không mưa',
      manpower: '18 công nhân tổ bê tông + 1 đội vận hành xe bơm cần 42m + 2 Kỹ sư tư vấn giám sát',
      progress: 'Đã đổ 65m3 bê tông thương phẩm M300 (B22.5), độ sụt kiểm tra tại hiện trường 12±2cm đạt yêu cầu. Đã lấy 03 tổ mẫu lập phương 150x150x150mm.',
      actionRequired: 'Treo cao cáp điện máy đầm dùi lên giá chữ A cách mặt sàn tối thiểu 1.5m để tránh ngấm nước xi măng.'
    }
  },
  excavation: {
    name: 'Kịch bản 3: Đào đất hố móng & Thi công đài cọc',
    score: 54,
    riskLevel: 'Nguy hiểm - Cần khắc phục ngay',
    workersCount: 10,
    ppeCompliant: 7,
    violations: [
      { id: 'V1', title: 'Mái dốc hố đào taluy dựng đứng chưa gia cố cừ/văng chống', location: 'Hố móng trục A (sâu 2.8m)', severity: 'Đặc biệt nguy hiểm (Sạt lở)', box: { x: 10, y: 22, w: 35, h: 55 }, color: '#ef4444' },
      { id: 'V2', title: 'Thiếu biển cảnh báo & rào chắn quanh mép hố móng sâu', location: 'Mép hố đào phía cổng công trường', severity: 'Cao', box: { x: 52, y: 15, w: 40, h: 25 }, color: '#f97316' },
      { id: 'V3', title: '03 công nhân không mặc áo phản quang & đi ủng bảo hộ', location: 'Đáy đài móng M3', severity: 'Trung bình', box: { x: 55, y: 55, w: 26, h: 32 }, color: '#eab308' }
    ],
    diary: {
      date: '18/11/2026',
      weather: 'Nắng nhẹ buổi sáng, chiều có khả năng mưa rào',
      manpower: '10 công nhân + 02 máy xúc đào 0.8m3',
      progress: 'Đào đất hố móng trục A-B đến cao độ -2.85m, đập đầu cọc ly tâm D300 và đổ bê tông lót đá 4x6 M100 dày 100mm.',
      actionRequired: 'DỪNG thi công thủ công dưới đáy hố trục A cho đến khi hạ độ dốc taluy hoặc đóng cừ Larsen chống sạt; Lắp rào chắn cứng quanh hố đào.'
    }
  }
};

const CRACK_SCENARIOS = {
  shear_beam: {
    name: 'Mẫu 1: Vết nứt nghiêng 45° gần gối tựa dầm chính BTCT',
    component: 'Dầm chính BTCT (Vị trí cách mép cột 300mm)',
    crackType: 'Vết nứt kết cấu do Lực cắt chính (Ứng suất kéo nghiêng)',
    widthMm: 0.65,
    tcvnLimitMm: 0.30,
    severity: 'NGUY HIỂM KẾT CẤU (Cấp độ 3/3)',
    severityColor: 'red',
    cause: 'Ứng suất kéo chính do lực cắt Q vượt quá khả năng chịu cắt của bê tông và cốt đai (có thể do khoảng cách cốt đai s quá thưa tại vùng gối dầm hoặc chất lượng bê tông không đạt mác thiết kế, hoặc vượt tải sàn).',
    solutionSteps: [
      'Bước 1 (Cấp bách): Chống đỡ tạm thời (gia cố cột chống thép/cây chống tăng) dưới bụng dầm để giảm tải tức thời.',
      'Bước 2: Đục tẩy lớp vữa trát dọc theo vết nứt rộng 10cm mỗi bên để kiểm tra chiều sâu xuyên suốt tiết diện dầm.',
      'Bước 3: Gắn kim bơm dọc vết nứt cách nhau 200mm và bơm keo Epoxy kết cấu độ nhớt thấp (Sikadur-752) áp lực thấp để hàn gắn khối bê tông.',
      'Bước 4: Gia cường kháng cắt bằng cách dán sợi Carbon (CFRP - SikaWrap-231C) chữ U bọc 3 mặt dầm hoặc ốp bản thép hai bên hông dầm neo bu-lông hóa chất.'
    ],
    materials: [
      { item: 'Keo Epoxy bơm vết nứt Sikadur-752', qty: '2,5 kg', cost: '1.150.000 đ' },
      { item: 'Keo trám bề mặt & định vị kim bơm Sikadur-731', qty: '2,0 kg', cost: '480.000 đ' },
      { item: 'Lưới sợi Carbon CFRP gia cường kháng cắt', qty: '1,8 m²', cost: '2.700.000 đ' },
      { item: 'Kim bơm áp lực một chiều (Bơm keo nhôm)', qty: '15 cái', cost: '225.000 đ' }
    ]
  },
  flexural_beam: {
    name: 'Mẫu 2: Vết nứt thẳng đứng ở thớ dưới giữa nhịp dầm',
    component: 'Dầm sàn tầng 2 (Giữa nhịp L = 6,0 m)',
    crackType: 'Vết nứt uốn thẳng góc do Mô-men dương giữa nhịp',
    widthMm: 0.25,
    tcvnLimitMm: 0.30,
    severity: 'CẦN THEO DÕI & XỬ LÝ BẢO VỆ (Cấp độ 2/3)',
    severityColor: 'amber',
    cause: 'Mô-men uốn lớn nhất tại giữa nhịp làm bê tông vùng kéo nứt để cốt thép dọc chịu lực. Bề rộng vết nứt hiện tại a_crc = 0,25 mm vẫn nằm trong giới hạn cho phép của TCVN 5574:2018 (≤ 0,3 mm), tuy nhiên cần xử lý chống ẩm xâm nhập gây gỉ thép.',
    solutionSteps: [
      'Bước 1: Dán thước đo vết nứt theo dõi trong 14 ngày xem vết nứt đã ổn định chưa.',
      'Bước 2: Mở rộng miệng vết nứt hình chữ V sâu 10 mm, thổi sạch bụi bằng máy nén khí.',
      'Bước 3: Quét chất kết nối và trám kín bằng keo Epoxy dẻo hoặc vữa sửa chữa Polymer cải tiến (Sika MonoTop-615) để bảo vệ cốt thép chủ khỏi quá trình cacbonat hóa.'
    ],
    materials: [
      { item: 'Vữa sửa chữa gốc xi măng-polymer Sika MonoTop', qty: '5,0 kg', cost: '350.000 đ' },
      { item: 'Phụ gia kết nối Sika Latex TH', qty: '1,0 lít', cost: '165.000 đ' },
      { item: 'Thước đo theo dõi biến dạng vết nứt', qty: '2 bộ', cost: '180.000 đ' }
    ]
  },
  shrinkage_wall: {
    name: 'Mẫu 3: Nứt chân chim tường xây & Nứt tiếp giáp cột - tường',
    component: 'Tường gạch ngăn phòng & vị trí tiếp giáp cột BTCT',
    crackType: 'Nứt co ngót nhiệt - ẩm phi kết cấu (Bề mặt vữa trát)',
    widthMm: 0.15,
    tcvnLimitMm: 0.30,
    severity: 'AN TOÀN KẾT CẤU - ẢNH HƯỞNG THẨM MỸ & THẤM (Cấp độ 1/3)',
    severityColor: 'emerald',
    cause: 'Co ngót khô của vữa trát do bảo dưỡng ẩm chưa đủ sau khi tô trát, hoặc thiếu lưới thép mắt cáo chống nứt tại vị trí tiếp giáp giữa hai vật liệu có hệ số giãn nở nhiệt khác nhau (Cột bê tông & Tường gạch).',
    solutionSteps: [
      'Bước 1: Đục lớp vữa dọc vết nứt tiếp giáp cột - tường rộng 15–20 cm tới mặt gạch.',
      'Bước 2: Đóng lưới thép mắt cáo (hoặc lưới sợi thủy tinh kháng kiềm) phủ qua khe tiếp giáp tối thiểu 10 cm mỗi bên.',
      'Bước 3: Tưới ẩm bão hòa, trát lại bằng vữa xi măng M75 có pha phụ gia chống co ngót, sau đó bả matit và sơn đàn hồi chống thấm.'
    ],
    materials: [
      { item: 'Lưới sợi thủy tinh chống nứt định lượng 145 g/m²', qty: '5,0 m²', cost: '150.000 đ' },
      { item: 'Keo trám khe đàn hồi Polyurethane (Sikaflex)', qty: '2 tuýp', cost: '360.000 đ' },
      { item: 'Sơn phủ đàn hồi che vết nứt chân chim', qty: '1 thùng 5L', cost: '680.000 đ' }
    ]
  }
};

// ============================================================================
// 2. GEMINI API INTEGRATION (DUAL ENGINE)
// ============================================================================

async function callGeminiAPI(prompt, base64Image = null, mimeType = 'image/jpeg') {
  if (AppState.aiMode !== 'gemini' || !AppState.apiKey.trim()) {
    throw new Error('DEMO_MODE');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(AppState.apiKey.trim())}`;
  const parts = [{ text: prompt }];

  if (base64Image) {
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    parts.push({
      inline_data: {
        mime_type: mimeType,
        data: cleanBase64
      }
    });
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1500
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Lỗi Gemini API (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Không nhận được phản hồi từ AI.';
}

// ============================================================================
// 3. NAVIGATION & UI INITIALIZATION
// ============================================================================

function switchTab(tabId) {
  AppState.currentTab = tabId;
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`panel-${tabId}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('bg-amber-500/15', 'text-amber-400', 'border-amber-500/40');
      btn.classList.remove('text-slate-300', 'border-transparent');
    } else {
      btn.classList.remove('bg-amber-500/15', 'text-amber-400', 'border-amber-500/40');
      btn.classList.add('text-slate-300', 'border-transparent');
    }
  });

  // Trigger chart resize or lazy render
  if (tabId === 'estimator') calculateEstimation();
  if (tabId === 'siteguard') renderSiteGuardScenario(AppState.siteScenario);
  if (tabId === 'crackdoctor') renderCrackScenario(AppState.crackScenario);
}

function toggleAIMode(mode) {
  AppState.aiMode = mode;
  const demoBtn = document.getElementById('btn-mode-demo');
  const geminiBtn = document.getElementById('btn-mode-gemini');
  const keyBox = document.getElementById('api-key-container');
  const badge = document.getElementById('ai-status-badge');

  if (mode === 'gemini') {
    geminiBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-slate-950 shadow transition';
    demoBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition';
    keyBox.classList.remove('hidden');
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Đang kết nối AI Gemini Thật`;
    badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
  } else {
    demoBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-slate-950 shadow transition';
    geminiBtn.className = 'px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white transition';
    keyBox.classList.add('hidden');
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span> Chế độ Mô phỏng Thông minh`;
    badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30';
  }
}

function saveApiKey(val) {
  AppState.apiKey = val.trim();
  localStorage.setItem('VIETBUILD_GEMINI_KEY', AppState.apiKey);
}

// ============================================================================
// 4. MODULE 1: DASHBOARD OVERVIEW CHARTS
// ============================================================================

function initDashboardCharts() {
  const ctxProgress = document.getElementById('chart-dashboard-progress');
  if (!ctxProgress) return;

  if (AppState.charts.dashboardProgress) AppState.charts.dashboardProgress.destroy();

  AppState.charts.dashboardProgress = new Chart(ctxProgress, {
    type: 'line',
    data: {
      labels: ['Tuần 1', 'Tuần 2', 'Tuần 3', 'Tuần 4', 'Tuần 5', 'Tuần 6'],
      datasets: [
        {
          label: 'Tiến độ Thực tế (%)',
          data: [12, 26, 44, 61, 75, 86],
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5
        },
        {
          label: 'Điểm An toàn HSE (/100)',
          data: [82, 85, 79, 88, 91, 89],
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          tension: 0.35,
          borderWidth: 2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#cbd5e1', font: { size: 11 } } }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148, 163, 184, 0.1)' }, min: 0, max: 100 }
      }
    }
  });
}

// ============================================================================
// 5. MODULE 2: CONSTRUCTEST & ECOBUILD (DỰ TOÁN & VẬT LIỆU XANH)
// ============================================================================

function calculateEstimation() {
  const area = parseFloat(document.getElementById('est-area')?.value) || 100;
  const floors = parseInt(document.getElementById('est-floors')?.value) || 3;
  const foundation = document.getElementById('est-foundation')?.value || 'bang'; // don, bang, coc
  const roof = document.getElementById('est-roof')?.value || 'btct'; // ton, btct, ngoi
  const packageType = document.getElementById('est-package')?.value || 'standard'; // basic, standard, premium
  const ecoMode = document.getElementById('est-eco-toggle')?.checked || false;

  // Hệ số diện tích xây dựng theo thông lệ ngành xây dựng Việt Nam
  const foundCoeff = foundation === 'don' ? 0.35 : foundation === 'bang' ? 0.55 : 0.65;
  const roofCoeff = roof === 'ton' ? 0.30 : roof === 'btct' ? 0.50 : 0.75;
  const totalCoeff = foundCoeff + floors * 1.0 + roofCoeff;
  const totalBuiltArea = Math.round(area * totalCoeff);

  // Đơn giá (VNĐ / m2 sàn xây dựng)
  const rawUnitPrice = 3750000; // Phần thô + nhân công hoàn thiện
  const finishUnitPrice = packageType === 'basic' ? 2250000 : packageType === 'standard' ? 3150000 : 4600000;
  const ecoPremium = ecoMode ? 280000 : 0; // Chi phí đầu tư ban đầu cho vật liệu xanh (Gạch AAC + Kính Low-E)

  const rawCost = totalBuiltArea * rawUnitPrice;
  const finishCost = totalBuiltArea * (finishUnitPrice + ecoPremium);
  const contingencyCost = Math.round((rawCost + finishCost) * 0.05);
  const grandTotal = rawCost + finishCost + contingencyCost;

  // Định mức vật tư chính ước tính trên m2 sàn xây dựng
  const concreteM3 = +(totalBuiltArea * 0.24).toFixed(1);
  const steelTon = +(totalBuiltArea * 0.036).toFixed(2);
  const cementTon = +(totalBuiltArea * 0.165 * (ecoMode ? 0.82 : 1)).toFixed(1);
  const bricksCount = Math.round(totalBuiltArea * (ecoMode ? 22 : 68)); // AAC lớn hơn gạch ống 8x8x18

  // Tính toán chỉ số Xanh (EcoBuild)
  const co2SavedTons = ecoMode ? +(totalBuiltArea * 0.048).toFixed(2) : +(totalBuiltArea * 0.008).toFixed(2);
  const annualElecSavedMWh = ecoMode ? +(totalBuiltArea * 0.026).toFixed(2) : +(totalBuiltArea * 0.004).toFixed(2);
  const fiveYearMoneySaved = Math.round(annualElecSavedMWh * 1000 * 3200 * 5); // 3,200đ/kWh x 5 năm

  // Update DOM
  const fmtVND = (num) => (num / 1e9 >= 1 ? (num / 1e9).toFixed(2) + ' Tỷ đ' : Math.round(num / 1e6).toLocaleString('vi-VN') + ' Triệu đ');

  document.getElementById('out-built-area').textContent = `${totalBuiltArea.toLocaleString('vi-VN')} m² (Hệ số ${totalCoeff.toFixed(2)})`;
  document.getElementById('out-total-cost').textContent = fmtVND(grandTotal);
  document.getElementById('out-raw-cost').textContent = fmtVND(rawCost);
  document.getElementById('out-finish-cost').textContent = fmtVND(finishCost);

  document.getElementById('mat-concrete').textContent = `${concreteM3} m³ (B22.5 / M300)`;
  document.getElementById('mat-steel').textContent = `${steelTon} Tấn (CB300-V / CB400-V)`;
  document.getElementById('mat-cement').textContent = `${cementTon} Tấn (PCB40)`;
  document.getElementById('mat-brick').textContent = ecoMode
    ? `${bricksCount.toLocaleString('vi-VN')} viên (Gạch nhẹ AAC 600x200x100)`
    : `${bricksCount.toLocaleString('vi-VN')} viên (Gạch Tuynel 80x80x180)`;

  document.getElementById('eco-co2').textContent = `-${co2SavedTons} Tấn CO₂e`;
  document.getElementById('eco-elec').textContent = `${fmtVND(fiveYearMoneySaved)} / 5 năm`;

  // Update Chart
  const ctxEst = document.getElementById('chart-estimator');
  if (ctxEst) {
    if (AppState.charts.estimator) AppState.charts.estimator.destroy();
    AppState.charts.estimator = new Chart(ctxEst, {
      type: 'doughnut',
      data: {
        labels: ['Kết cấu Phần thô (54%)', 'Vật tư Hoàn thiện & MEP (36%)', 'Dự phòng phí & Quản lý (5%)', 'Tối ưu Vật liệu Xanh (5%)'],
        datasets: [{
          data: [
            Math.round(rawCost / 1e6),
            Math.round((finishCost - totalBuiltArea * ecoPremium) / 1e6),
            Math.round(contingencyCost / 1e6),
            Math.round((totalBuiltArea * (ecoPremium || 120000)) / 1e6)
          ],
          backgroundColor: ['#f59e0b', '#0ea5e9', '#64748b', '#10b981'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd5e1', font: { size: 11 }, padding: 12 } }
        }
      }
    });
  }
}

async function runEstimatorAIAdvice() {
  const area = document.getElementById('est-area').value;
  const floors = document.getElementById('est-floors').value;
  const foundation = document.getElementById('est-foundation').selectedOptions[0].text;
  const ecoMode = document.getElementById('est-eco-toggle').checked;
  const box = document.getElementById('est-ai-response');

  box.innerHTML = `<div class="flex items-center gap-2 text-amber-400 text-sm"><span class="animate-spin h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full"></span> AI Kỹ sư Dự toán đang phân tích phương án tối ưu...</div>`;

  try {
    const prompt = `Bạn là Kỹ sư Kinh tế Xây dựng (QS) và Chuyên gia Công trình Xanh tại Việt Nam. Hãy phân tích ngắn gọn (4 gạch đầu dòng súc tích, có số liệu cụ thể) cho công trình: Diện tích đất ${area}m2, quy mô ${floors} tầng, giải pháp ${foundation}, chế độ vật liệu xanh: ${ecoMode ? 'Đang bật (Gạch AAC + Kính Low-E)' : 'Truyền thống'}. Đưa ra lời khuyên tối ưu kết cấu móng, giảm hao hụt thép và giải pháp chống nóng hướng Tây.`;
    const reply = await callGeminiAPI(prompt);
    box.innerHTML = `<div class="prose prose-invert max-w-none text-sm text-slate-200 whitespace-pre-line">${reply}</div>`;
  } catch (e) {
    // Fallback Smart Demo
    box.innerHTML = `
      <div class="space-y-2 text-sm text-slate-200">
        <div class="font-semibold text-amber-400">💡 Khuyến nghị Chuyên môn từ AI Kỹ sư Dự toán &amp; Công trình Xanh:</div>
        <ul class="list-disc pl-5 space-y-1.5 text-slate-300">
          <li><strong>Tối ưu hệ kết cấu &amp; móng (${foundation}):</strong> Với diện tích ${area} m² và quy mô ${floors} tầng, nếu chuyển sang gạch bê tông khí chưng áp (AAC, khối lượng riêng γ ≈ 650 kg/m³ so với gạch đất nung 1.800 kg/m³), tĩnh tải tường truyền xuống móng giảm khoảng <strong>18% – 22%</strong>, giúp tiết kiệm ~8% hàm lượng cốt thép đài móng và cột.</li>
          <li><strong>Kiểm soát hao hụt cốt thép:</strong> Nên lập bảng nối chồng cốt thép theo TCVN 5574:2018 (chiều dài nối chồng l<sub>lap</sub> = 35d – 40d) kết hợp phần mềm cắt thép tối ưu từ cây thép 11,7 m để kéo tỷ lệ thép vụn từ 5% xuống dưới 1,8%.</li>
          <li><strong>Giải pháp nhiệt &amp; Vi khí hậu:</strong> Kết hợp tường bao ngoài dày 200 mm bằng gạch AAC (hệ số dẫn nhiệt λ = 0,11 W/mK, bằng 1/5 gạch đỏ) và kính cản nhiệt giúp giảm nhiệt độ bề mặt trong nhà từ 3°C – 4,5°C vào mùa hè.</li>
        </ul>
      </div>
    `;
  }
}

// ============================================================================
// 6. MODULE 3: TCVN COPILOT & QUICK STRUCTURAL CHECKER
// ============================================================================

function checkStructureTCVN() {
  const spanM = parseFloat(document.getElementById('chk-span')?.value) || 6.0;
  const beamH = parseFloat(document.getElementById('chk-beam-h')?.value) || 500;
  const slabH = parseFloat(document.getElementById('chk-slab-h')?.value) || 120;
  const coverMm = parseFloat(document.getElementById('chk-cover')?.value) || 25;
  const env = document.getElementById('chk-env')?.value || 'indoor'; // indoor, outdoor, foundation, marine

  const minBeamH = Math.round((spanM * 1000) / 12);
  const maxBeamH = Math.round((spanM * 1000) / 8);
  const minCover = env === 'indoor' ? 25 : env === 'outdoor' ? 30 : env === 'foundation' ? 40 : 50;
  const minSlabH = Math.round((spanM * 1000) / 45);

  const beamOk = beamH >= minBeamH;
  const coverOk = coverMm >= minCover;
  const slabOk = slabH >= Math.max(100, minSlabH);

  const container = document.getElementById('tcvn-check-result');
  container.innerHTML = `
    <div class="space-y-3">
      <div class="p-3 rounded-xl border ${beamOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-sm ${beamOk ? 'text-emerald-300' : 'text-rose-300'}">1. Chiều cao tiết diện dầm chính (h = ${beamH} mm)</span>
          <span class="px-2 py-0.5 text-xs font-bold rounded ${beamOk ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}">${beamOk ? 'ĐẠT' : 'CHƯA ĐẠT'}</span>
        </div>
        <p class="text-xs text-slate-300 mt-1">Theo kinh nghiệm thiết kế &amp; điều kiện độ võng TCVN 5574:2018 (h = 1/12 ÷ 1/8 nhịp L), với nhịp L = ${spanM} m, chiều cao dầm hợp lý từ <strong>${minBeamH} mm – ${maxBeamH} mm</strong>.</p>
      </div>

      <div class="p-3 rounded-xl border ${coverOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-sm ${coverOk ? 'text-emerald-300' : 'text-rose-300'}">2. Lớp bê tông bảo vệ cốt thép chịu lực (c<sub>0</sub> = ${coverMm} mm)</span>
          <span class="px-2 py-0.5 text-xs font-bold rounded ${coverOk ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'}">${coverOk ? 'ĐẠT TCVN 5574:2018' : 'VI PHẠM TCVN'}</span>
        </div>
        <p class="text-xs text-slate-300 mt-1">Theo <strong>Mục 10.3.2 – Bảng 19 (TCVN 5574:2018)</strong>, cấu kiện dầm/cột trong điều kiện đã chọn yêu cầu chiều dày lớp bê tông bảo vệ tối thiểu <strong>c<sub>0,min</sub> = ${minCover} mm</strong>.</p>
      </div>

      <div class="p-3 rounded-xl border ${slabOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-sm ${slabOk ? 'text-emerald-300' : 'text-amber-300'}">3. Chiều dày bản sàn toàn khối (h<sub>s</sub> = ${slabH} mm)</span>
          <span class="px-2 py-0.5 text-xs font-bold rounded ${slabOk ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'}">${slabOk ? 'ĐẠT' : 'LƯU Ý ĐỘ VÕNG'}</span>
        </div>
        <p class="text-xs text-slate-300 mt-1">Chiều dày sàn dân dụng khuyến nghị h<sub>s</sub> ≥ 100 mm và thỏa mãn điều kiện độ mảnh hạn chế độ võng (tối thiểu ~${Math.max(100, minSlabH)} mm).</p>
      </div>
    </div>
  `;
}

async function askTCVNCopilot(presetQuestion = null) {
  const input = document.getElementById('tcvn-query-input');
  const query = (presetQuestion || input.value).trim();
  if (!query) return;
  if (presetQuestion) input.value = presetQuestion;

  const out = document.getElementById('tcvn-chat-output');
  out.innerHTML = `<div class="flex items-center gap-2 text-amber-400 text-sm p-4"><span class="animate-spin h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full"></span> Đang đối chiếu cơ sở dữ liệu TCVN / QCVN...</div>`;

  try {
    const prompt = `Bạn là Chuyên gia Thẩm tra Thiết kế Xây dựng Việt Nam. Hãy trả lời câu hỏi sau có trích dẫn rõ mã tiêu chuẩn (TCVN 5574:2018, TCVN 2737:2023, QCVN 06:2022/BXD, TCVN 9362:2012), điều khoản và con số cụ thể: "${query}"`;
    const aiText = await callGeminiAPI(prompt);
    out.innerHTML = `
      <div class="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-2">
        <div class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Phản hồi từ Gemini AI + TCVN Copilot</div>
        <div class="text-sm text-slate-200 whitespace-pre-line leading-relaxed">${aiText}</div>
      </div>
    `;
  } catch (e) {
    // Smart Local RAG Search
    const qLower = query.toLowerCase();
    const matched = TCVN_KNOWLEDGE.filter(item =>
      item.keywords.some(k => qLower.includes(k)) ||
      item.title.toLowerCase().includes(qLower)
    );
    const results = matched.length > 0 ? matched : TCVN_KNOWLEDGE.slice(0, 2);

    out.innerHTML = `
      <div class="space-y-3">
        <div class="text-xs text-slate-400">Kết quả trích xuất cho câu hỏi: <span class="text-amber-300 font-medium">"${query}"</span></div>
        ${results.map(r => `
          <div class="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-1.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40">${r.code}</span>
              <span class="text-xs text-sky-400 font-medium">${r.clause}</span>
            </div>
            <div class="font-semibold text-slate-100 text-sm">${r.title}</div>
            <p class="text-sm text-slate-300 leading-relaxed">${r.summary}</p>
          </div>
        `).join('')}
      </div>
    `;
  }
}

// ============================================================================
// 7. MODULE 4: AI SITEGUARD (AN TOÀN LAO ĐỘNG & NHẬT KÝ CÔNG TRƯỜNG)
// ============================================================================

function drawSiteGuardCanvas(scenarioKey, uploadedImg = null) {
  const canvas = document.getElementById('siteguard-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const scenario = SITE_SCENARIOS[scenarioKey];

  const w = canvas.width = 680;
  const h = canvas.height = 380;

  ctx.clearRect(0, 0, w, h);

  if (uploadedImg) {
    ctx.drawImage(uploadedImg, 0, 0, w, h);
  } else {
    // Vẽ mô phỏng trực quan công trường kỹ thuật số (Blueprint + Site Scene)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Draw structural elements (Columns, Slab, Scaffolding)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 60, w - 80, h - 90);

    // Header HUD inside Canvas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(14, 12, 360, 28);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`CAM-HSE-04 | ${scenario.name.toUpperCase().slice(0, 42)}`, 22, 30);
  }

  // Draw AI Detection Bounding Boxes
  scenario.violations.forEach((v) => {
    const bx = (v.box.x / 100) * w;
    const by = (v.box.y / 100) * h;
    const bw = (v.box.w / 100) * w;
    const bh = (v.box.h / 100) * h;

    ctx.fillStyle = v.color + '22';
    ctx.fillRect(bx, by, bw, bh);

    ctx.strokeStyle = v.color;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(bx, by, bw, bh);

    // Label tag
    ctx.fillStyle = v.color;
    ctx.fillRect(bx, by - 22, Math.min(bw + 40, 250), 22);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`[${v.id}] ${v.title.slice(0, 30)}`, bx + 6, by - 7);
  });
}

function renderSiteGuardScenario(scenarioKey) {
  AppState.siteScenario = scenarioKey;
  const sc = SITE_SCENARIOS[scenarioKey];

  document.querySelectorAll('.site-preset-btn').forEach(btn => {
    if (btn.dataset.scenario === scenarioKey) {
      btn.className = 'site-preset-btn px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 shadow transition';
    } else {
      btn.className = 'site-preset-btn px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition';
    }
  });

  drawSiteGuardCanvas(scenarioKey, AppState.uploadedSiteImage);

  document.getElementById('site-score').textContent = `${sc.score}/100`;
  document.getElementById('site-risk-badge').textContent = sc.riskLevel;
  document.getElementById('site-workers').textContent = `${sc.ppeCompliant}/${sc.workersCount} đạt chuẩn PPE`;

  const vList = document.getElementById('site-violations-list');
  vList.innerHTML = sc.violations.map(v => `
    <div class="p-3 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-start justify-between gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded text-xs font-bold text-slate-950" style="background:${v.color}">${v.id}</span>
          <span class="font-semibold text-sm text-slate-100">${v.title}</span>
        </div>
        <div class="text-xs text-slate-400 mt-1">📍 Vị trí: ${v.location}</div>
      </div>
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 shrink-0">${v.severity}</span>
    </div>
  `).join('');

  // Render Diary
  const d = sc.diary;
  document.getElementById('site-diary-box').innerHTML = `
    <div class="space-y-2 text-sm text-slate-200">
      <div class="flex justify-between border-b border-slate-700 pb-2">
        <span class="font-bold text-amber-400">NHẬT KÝ THI CÔNG & AN TOÀN CÔNG TRƯỜNG</span>
        <span class="text-xs text-slate-400">Ngày: ${d.date}</span>
      </div>
      <p><strong>🌤️ Thời tiết:</strong> ${d.weather}</p>
      <p><strong>👷 Nhân lực & Thiết bị:</strong> ${d.manpower}</p>
      <p><strong>🏗️ Khối lượng & Tiến độ:</strong> ${d.progress}</p>
      <p class="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200"><strong>⚠️ Yêu cầu chấn chỉnh An toàn (HSE):</strong> ${d.actionRequired}</p>
    </div>
  `;
}

async function handleSiteImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    const img = new Image();
    img.onload = async () => {
      AppState.uploadedSiteImage = img;
      drawSiteGuardCanvas(AppState.siteScenario, img);

      if (AppState.aiMode === 'gemini' && AppState.apiKey.trim()) {
        const diaryBox = document.getElementById('site-diary-box');
        diaryBox.innerHTML = `<div class="flex items-center gap-2 text-emerald-400 text-sm"><span class="animate-spin h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full"></span> Gemini Vision đang quét ảnh công trường của bạn...</div>`;
        try {
          const prompt = `Bạn là Kỹ sư Giám sát An toàn Lao động (HSE) tại công trường xây dựng. Hãy phân tích bức ảnh này và trả lời theo 4 mục: 1. Điểm an toàn ước tính (/100), 2. Phát hiện trang bị bảo hộ (mũ, áo phản quang, giày, giàn giáo), 3. Các nguy cơ mất an toàn nhìn thấy trong ảnh, 4. Bản tóm tắt Nhật ký công trường và biện pháp khắc phục.`;
          const text = await callGeminiAPI(prompt, base64, file.type);
          diaryBox.innerHTML = `<div class="text-sm text-slate-200 whitespace-pre-line">${text}</div>`;
        } catch (err) {
          alert(err.message);
        }
      }
    };
    img.src = base64;
  };
  reader.readAsDataURL(file);
}

// ============================================================================
// 8. MODULE 5: CRACKDOCTOR (CHẨN ĐOÁN BỆNH HỌC CÔNG TRÌNH)
// ============================================================================

function drawCrackCanvas(scenarioKey, uploadedImg = null) {
  const canvas = document.getElementById('crack-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width = 560;
  const h = canvas.height = 300;

  ctx.clearRect(0, 0, w, h);

  if (uploadedImg) {
    ctx.drawImage(uploadedImg, 0, 0, w, h);
    return;
  }

  // Concrete surface texture simulation
  ctx.fillStyle = '#334155';
  ctx.fillRect(0, 0, w, h);

  // Draw beam/wall outline
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.strokeRect(30, 40, w - 60, h - 80);

  // Draw crack pattern based on scenario
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = scenarioKey === 'shear_beam' ? 3.5 : scenarioKey === 'flexural_beam' ? 2.5 : 1.5;
  ctx.beginPath();

  if (scenarioKey === 'shear_beam') {
    // 45 degree diagonal crack near support
    ctx.moveTo(80, 220);
    ctx.lineTo(110, 185);
    ctx.lineTo(135, 165);
    ctx.lineTo(175, 120);
    ctx.lineTo(210, 80);
  } else if (scenarioKey === 'flexural_beam') {
    // Vertical cracks at midspan bottom
    ctx.moveTo(260, 220); ctx.lineTo(255, 165); ctx.lineTo(262, 130);
    ctx.moveTo(310, 220); ctx.lineTo(315, 175); ctx.lineTo(308, 145);
  } else {
    // Shrinkage crazing / spiderweb cracks
    ctx.moveTo(220, 120); ctx.lineTo(270, 145); ctx.lineTo(320, 130);
    ctx.moveTo(270, 145); ctx.lineTo(265, 195);
    ctx.moveTo(270, 145); ctx.lineTo(230, 180);
  }
  ctx.stroke();

  // Callout label
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(45, 52, 340, 28);
  ctx.fillStyle = '#fda4af';
  ctx.font = 'bold 12px monospace';
  const c = CRACK_SCENARIOS[scenarioKey];
  ctx.fillText(`Bề rộng đo được: acrc = ${c.widthMm} mm (Giới hạn TCVN: ${c.tcvnLimitMm} mm)`, 55, 70);
}

function renderCrackScenario(scenarioKey) {
  AppState.crackScenario = scenarioKey;
  const c = CRACK_SCENARIOS[scenarioKey];

  document.querySelectorAll('.crack-preset-btn').forEach(btn => {
    if (btn.dataset.crack === scenarioKey) {
      btn.className = 'crack-preset-btn px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-slate-950 shadow transition';
    } else {
      btn.className = 'crack-preset-btn px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition';
    }
  });

  drawCrackCanvas(scenarioKey, AppState.uploadedCrackImage);

  document.getElementById('crack-type').textContent = c.crackType;
  document.getElementById('crack-component').textContent = c.component;
  document.getElementById('crack-width').textContent = `${c.widthMm} mm (TCVN 5574:2018 cho phép ≤ ${c.tcvnLimitMm} mm)`;
  document.getElementById('crack-severity').textContent = c.severity;
  document.getElementById('crack-cause').textContent = c.cause;

  document.getElementById('crack-steps').innerHTML = c.solutionSteps.map(s => `
    <li class="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/70 text-sm text-slate-200">${s}</li>
  `).join('');

  document.getElementById('crack-materials').innerHTML = c.materials.map(m => `
    <tr class="border-b border-slate-800">
      <td class="py-2 text-slate-200">${m.item}</td>
      <td class="py-2 text-center text-amber-300 font-medium">${m.qty}</td>
      <td class="py-2 text-right text-emerald-400 font-semibold">${m.cost}</td>
    </tr>
  `).join('');
}

async function handleCrackImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    const img = new Image();
    img.onload = async () => {
      AppState.uploadedCrackImage = img;
      drawCrackCanvas(AppState.crackScenario, img);

      if (AppState.aiMode === 'gemini' && AppState.apiKey.trim()) {
        const causeEl = document.getElementById('crack-cause');
        causeEl.innerHTML = `<span class="text-emerald-400 animate-pulse">Gemini Vision đang chẩn đoán hình thái vết nứt...</span>`;
        try {
          const prompt = `Bạn là Chuyên gia Kiểm định Kết cấu Xây dựng (Bác sĩ Công trình). Hãy phân tích ảnh vết nứt/hư hỏng này: 1. Nhận diện hình thái vết nứt (nghiêng 45 độ, thẳng đứng, hay chân chim/thấm), 2. Đánh giá nguy cơ đối chiếu TCVN 5574:2018, 3. Nguyên nhân gây nứt, 4. Quy trình xử lý sửa chữa bằng hóa chất xây dựng (Sika/Epoxy).`;
          const text = await callGeminiAPI(prompt, base64, file.type);
          causeEl.innerHTML = `<div class="whitespace-pre-line text-slate-200">${text}</div>`;
        } catch (err) {
          alert(err.message);
        }
      }
    };
    img.src = base64;
  };
  reader.readAsDataURL(file);
}

// ============================================================================
// INITIALIZE ON DOM READY
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  const keyInput = document.getElementById('gemini-api-key-input');
  if (keyInput && AppState.apiKey) keyInput.value = AppState.apiKey;

  initDashboardCharts();
  calculateEstimation();
  checkStructureTCVN();
  renderSiteGuardScenario('scaffold');
  renderCrackScenario('shear_beam');
  askTCVNCopilot('Chiều dày lớp bê tông bảo vệ cốt thép theo TCVN 5574:2018 là bao nhiêu?');
});
