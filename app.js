// ============================================================================
// VIETBUILD AI STUDIO - CORE ENGINE (DUAL MODE: REAL GEMINI API + SMART DEMO)
// ============================================================================

const AppState = {
  aiMode: localStorage.getItem('VIETBUILD_AI_MODE') || 'demo', // 'demo' | 'gemini'
  apiKey: (localStorage.getItem('VIETBUILD_GEMINI_KEY') || '').replace(/\s+/g, ''),
  activeModel: localStorage.getItem('VIETBUILD_GEMINI_MODEL') || 'gemini-2.5-flash',
  apiVerified: false,
  currentTab: 'intro',
  charts: {},
  siteScenario: 'scaffold',
  crackScenario: 'shear_beam',
  uploadedSiteImage: null,
  uploadedCrackImage: null,
  projectData: {
    estimator: null,
    tcvn: null,
    siteguard: null,
    crackdoctor: null
  }
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
// 2. GEMINI API INTEGRATION (AUTO-DISCOVER LIVE MODELS VIA ListModels API)
// ============================================================================

const FALLBACK_GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-flash-latest'
];

async function discoverAvailableModels(cleanKey) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const errJson = await res.json();
      msg = errJson?.error?.message || msg;
    } catch (_) {}
    if (res.status === 400 && /API key not valid/i.test(msg)) {
      throw new Error('Mã API Key không hợp lệ. Vui lòng kiểm tra lại key lấy từ Google AI Studio (bắt đầu bằng AIza...).');
    }
    throw new Error(`Không thể lấy danh sách model (${res.status}): ${msg}`);
  }

  const data = await res.json();
  const rawModels = (data.models || [])
    .filter(m =>
      Array.isArray(m.supportedGenerationMethods) &&
      m.supportedGenerationMethods.includes('generateContent') &&
      typeof m.name === 'string' &&
      m.name.startsWith('models/gemini-') &&
      !/embedding|imagen|veo|tts|audio|live|robotics|computer-use|deep-research/i.test(m.name)
    )
    .map(m => m.name.replace(/^models\//, ''));

  if (!rawModels.length) {
    return FALLBACK_GEMINI_MODELS;
  }

  // Ưu tiên các model ổn định & phản hồi nhanh (flash-lite / flash bản stable trước, preview/exp sau)
  const scoreModel = (name) => {
    let score = 0;
    if (/flash/i.test(name)) score += 120;
    if (/flash-lite/i.test(name)) score += 15; // Ít bị quá tải 503 và phản hồi nhanh nhất
    if (/preview|exp/i.test(name)) score -= 40; // Bản preview hay quá tải 503
    if (/pro/i.test(name)) score += 40;
    const verMatch = name.match(/gemini-(\d+(?:\.\d+)?)/i);
    if (verMatch) score += parseFloat(verMatch[1]) * 10;
    return score;
  };

  return [...new Set(rawModels)].sort((a, b) => scoreModel(b) - scoreModel(a));
}

function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

async function callGeminiAPI(prompt, base64Image = null, mimeType = 'image/jpeg') {
  const cleanKey = (AppState.apiKey || '').replace(/\s+/g, '');
  if (AppState.aiMode !== 'gemini' || !cleanKey) {
    throw new Error('DEMO_MODE');
  }

  const parts = [{ text: prompt }];
  if (base64Image) {
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    parts.push({
      inline_data: {
        mime_type: mimeType || 'image/jpeg',
        data: cleanBase64
      }
    });
  }

  let modelsToTry = AppState.discoveredModels && AppState.discoveredModels.length
    ? [AppState.activeModel, ...AppState.discoveredModels.filter(m => m !== AppState.activeModel)]
    : null;

  if (!modelsToTry) {
    const discovered = await discoverAvailableModels(cleanKey);
    AppState.discoveredModels = discovered;
    populateModelSelect(discovered, discovered[0]);
    modelsToTry = discovered;
  }

  const chosenModel = AppState.activeModel;
  let lastError = null;
  let fallbackNotice = null;

  for (let i = 0; i < Math.min(modelsToTry.length, 5); i++) {
    const model = modelsToTry[i];
    if (!model) continue;
    const isUserChosen = (i === 0 && model === chosenModel);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    try {
      // Cho model người dùng chủ động chọn thời gian chờ rộng hơn (25s) để tránh bị ngắt sớm
      const response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.05,
            maxOutputTokens: 1800
          }
        })
      }, isUserChosen ? 25000 : 12000);

      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          msg = errJson?.error?.message || msg;
        } catch (_) {}
        if ([404, 429, 500, 503, 504].includes(response.status)) {
          lastError = new Error(`Model ${model} (${response.status}): ${msg}`);
          if (isUserChosen) {
            fallbackNotice = `Model ${chosenModel} đang bận (${response.status}), tạm dùng ${modelsToTry[i + 1] || 'model dự phòng'}`;
          }
          continue;
        }
        if (response.status === 400 && /API key not valid/i.test(msg)) {
          throw new Error('Mã API Key không hợp lệ. Vui lòng kiểm tra lại key lấy từ Google AI Studio (bắt đầu bằng AIza...).');
        }
        throw new Error(`Lỗi Gemini API (${response.status}): ${msg}`);
      }

      const data = await response.json();
      AppState.lastUsedModel = model;
      AppState.lastFallbackNotice = isUserChosen ? null : fallbackNotice;
      AppState.apiVerified = true;
      // Chỉ cập nhật activeModel mặc định nếu người dùng chưa chọn model nào; KHÔNG tự ý nhảy dropdown của người dùng!
      if (!chosenModel) {
        AppState.activeModel = model;
        localStorage.setItem('VIETBUILD_GEMINI_MODEL', model);
        const sel = document.getElementById('gemini-model-select');
        if (sel && sel.value !== model) sel.value = model;
      }
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Không nhận được phản hồi từ AI.';
    } catch (err) {
      if (err.name === 'AbortError') {
        lastError = new Error(`Model ${model} phản hồi chậm`);
        if (isUserChosen) {
          fallbackNotice = `Model ${chosenModel} phản hồi chậm, tạm dùng dự phòng`;
        }
        continue;
      }
      if (err.message && !err.message.startsWith('Model ')) {
        throw err;
      }
      lastError = err;
    }
  }

  throw lastError || new Error('Không thể kết nối tới Gemini API.');
}

// ============================================================================
// 3. NAVIGATION & UI INITIALIZATION
// ============================================================================

function toggleMobileSidebar() {
  const sidebar = document.getElementById('main-sidebar');
  const backdrop = document.getElementById('mobile-sidebar-backdrop');
  if (!sidebar) return;
  const isClosed = sidebar.classList.contains('-translate-x-full');
  if (isClosed) {
    sidebar.classList.remove('-translate-x-full');
    if (backdrop) backdrop.classList.remove('hidden');
  } else {
    closeMobileSidebar();
  }
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('main-sidebar');
  const backdrop = document.getElementById('mobile-sidebar-backdrop');
  if (sidebar) sidebar.classList.add('-translate-x-full');
  if (backdrop) backdrop.classList.add('hidden');
}

function switchTab(tabId) {
  AppState.currentTab = tabId;
  document.querySelectorAll('.tab-panel').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`panel-${tabId}`);
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.nav-btn').forEach(btn => {
    if (btn.dataset.tab === tabId) {
      btn.classList.add('nav-active');
      btn.classList.remove('text-zinc-300', 'border-transparent');
    } else {
      btn.classList.remove('nav-active', 'bg-amber-500/15', 'text-amber-400', 'border-amber-500/40');
      btn.classList.add('text-zinc-300', 'border-transparent');
    }
  });

  // Tự động đóng menu 3 gạch trên điện thoại & cuộn lên đầu trang khi chuyển mục
  closeMobileSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Trigger chart resize or lazy render
  if (tabId === 'estimator') calculateEstimation(false);
}

function toggleAIMode(mode) {
  AppState.aiMode = mode;
  localStorage.setItem('VIETBUILD_AI_MODE', mode);
  const demoBtn = document.getElementById('btn-mode-demo');
  const geminiBtn = document.getElementById('btn-mode-gemini');
  const badge = document.getElementById('ai-status-badge');
  const keyInput = document.getElementById('gemini-api-key-input');
  const headerSel = document.getElementById('gemini-model-select');

  if (mode === 'gemini') {
    if (geminiBtn) geminiBtn.className = 'p-3.5 rounded-xl text-left border bg-emerald-500/15 border-emerald-500/50 text-emerald-300 transition';
    if (demoBtn) demoBtn.className = 'p-3.5 rounded-xl text-left border bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-500/40 transition';
    if (AppState.apiKey) {
      if (badge) {
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span><span class="truncate">AI Gemini (${AppState.activeModel})</span>`;
        badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition truncate max-w-[200px] sm:max-w-none';
      }
    } else {
      if (badge) {
        badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span><span class="truncate">Chưa nhập API Key</span>`;
        badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition truncate max-w-[200px] sm:max-w-none';
      }
      if (keyInput && AppState.currentTab === 'aisettings') keyInput.focus();
    }
  } else {
    if (demoBtn) demoBtn.className = 'p-3.5 rounded-xl text-left border bg-amber-500/15 border-amber-500/50 text-amber-300 transition';
    if (geminiBtn) geminiBtn.className = 'p-3.5 rounded-xl text-left border bg-slate-950 border-slate-800 text-slate-300 hover:border-emerald-500/40 transition';
    if (headerSel) headerSel.classList.add('hidden');
    if (badge) {
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span><span class="truncate">Chế độ Mô phỏng</span>`;
      badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25 transition truncate max-w-[200px] sm:max-w-none';
    }
  }
}

function saveApiKey(val) {
  const cleaned = (val || '').replace(/\s+/g, '');
  AppState.apiKey = cleaned;
  AppState.apiVerified = false;
  AppState.discoveredModels = null;
  localStorage.setItem('VIETBUILD_GEMINI_KEY', cleaned);

  const feedback = document.getElementById('api-key-feedback');
  if (feedback) {
    if (cleaned) {
      feedback.textContent = 'Đã lưu key — Bấm "✓ Lưu & Kết nối" để kiểm tra';
      feedback.className = 'text-[11px] font-medium text-amber-300';
    } else {
      feedback.classList.add('hidden');
    }
  }
}

function toggleKeyVisibility() {
  const input = document.getElementById('gemini-api-key-input');
  const btn = document.getElementById('btn-toggle-key-vis');
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (btn) btn.textContent = '🙈';
  } else {
    input.type = 'password';
    if (btn) btn.textContent = '👁️';
  }
}

function populateModelSelect(models, selectedModel) {
  const optionsHtml = models.map(m => `<option value="${m}" ${m === selectedModel ? 'selected' : ''}>${m}</option>`).join('');
  const headerSel = document.getElementById('gemini-model-select');
  const settingsSel = document.getElementById('settings-model-select');
  const settingsWrap = document.getElementById('settings-model-wrap');

  if (headerSel && models && models.length) {
    headerSel.innerHTML = optionsHtml;
    headerSel.classList.remove('hidden');
  }
  if (settingsSel && models && models.length) {
    settingsSel.innerHTML = optionsHtml;
    if (settingsWrap) settingsWrap.classList.remove('hidden');
  }
}

function selectGeminiModel(model) {
  AppState.activeModel = model;
  localStorage.setItem('VIETBUILD_GEMINI_MODEL', model);
  const headerSel = document.getElementById('gemini-model-select');
  const settingsSel = document.getElementById('settings-model-select');
  if (headerSel && headerSel.value !== model) headerSel.value = model;
  if (settingsSel && settingsSel.value !== model) settingsSel.value = model;
  const badge = document.getElementById('ai-status-badge');
  if (badge) {
    badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span><span class="truncate">AI Gemini (${model})</span>`;
  }
}

async function pasteKeyIntoSettings() {
  const input = document.getElementById('gemini-api-key-input');
  const feedback = document.getElementById('api-key-feedback');
  try {
    const text = (await navigator.clipboard.readText()).replace(/\s+/g, '');
    if (input) input.value = text;
    saveApiKey(text);
    if (feedback) {
      feedback.textContent = text ? '📋 Đã dán mã API Key — Bấm "⚡ Lưu & Kết nối ngay"' : '⚠️ Bộ nhớ tạm đang trống.';
      feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300';
    }
  } catch (_) {
    if (feedback) {
      feedback.textContent = 'Trình duyệt chặn đọc bộ nhớ tạm — Hãy chạm giữ vào ô nhập rồi chọn Dán (Paste).';
      feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300';
    }
    if (input) input.focus();
  }
}

function openGeminiLinkModal() {
  const modal = document.getElementById('gemini-link-modal');
  const modalInput = document.getElementById('modal-gemini-key-input');
  const statusEl = document.getElementById('modal-key-status');
  if (modalInput) modalInput.value = AppState.apiKey || '';
  if (statusEl) {
    statusEl.textContent = AppState.apiVerified
      ? `✅ Tài khoản đã liên kết thành công (Model: ${AppState.activeModel})`
      : 'Chưa liên kết. Dán mã API Key từ Google AI Studio rồi bấm "⚡ Liên kết Tài khoản ngay".';
    statusEl.className = AppState.apiVerified ? 'text-xs font-semibold text-emerald-400' : 'text-xs text-slate-400';
  }
  if (modal) modal.classList.remove('hidden');
}

function closeGeminiLinkModal() {
  const modal = document.getElementById('gemini-link-modal');
  if (modal) modal.classList.add('hidden');
}

async function pasteKeyFromClipboard() {
  const modalInput = document.getElementById('modal-gemini-key-input');
  const statusEl = document.getElementById('modal-key-status');
  try {
    const text = (await navigator.clipboard.readText()).replace(/\s+/g, '');
    if (modalInput) modalInput.value = text;
    if (statusEl) {
      statusEl.textContent = text ? '📋 Đã dán mã khóa — Bấm "⚡ Liên kết Tài khoản ngay"' : '⚠️ Bộ nhớ tạm đang trống.';
      statusEl.className = 'text-xs text-amber-300';
    }
  } catch (_) {
    if (statusEl) {
      statusEl.textContent = 'Trình duyệt chặn đọc bộ nhớ tạm — Bạn hãy nhấn Ctrl+V trực tiếp vào ô trên nhé.';
      statusEl.className = 'text-xs text-amber-300';
    }
    if (modalInput) modalInput.focus();
  }
}

async function applyModalGeminiKey() {
  const modalInput = document.getElementById('modal-gemini-key-input');
  const headerInput = document.getElementById('gemini-api-key-input');
  const statusEl = document.getElementById('modal-key-status');
  const val = (modalInput ? modalInput.value : '').replace(/\s+/g, '');
  if (headerInput) headerInput.value = val;
  if (statusEl) {
    statusEl.textContent = '⚡ Đang liên kết tài khoản Google Gemini...';
    statusEl.className = 'text-xs text-sky-300';
  }
  const ok = await connectAndVerifyGeminiKey(val);
  if (ok) {
    if (statusEl) {
      statusEl.textContent = `✅ Liên kết thành công! Đã tìm thấy ${AppState.discoveredModels.length} model (Đang dùng: ${AppState.activeModel})`;
      statusEl.className = 'text-xs font-bold text-emerald-400';
    }
    setTimeout(() => closeGeminiLinkModal(), 900);
  } else if (statusEl) {
    const fb = document.getElementById('api-key-feedback');
    statusEl.textContent = fb ? fb.textContent : '❌ Liên kết thất bại, vui lòng kiểm tra lại API Key.';
    statusEl.className = 'text-xs font-semibold text-rose-400';
  }
}

function setLinkedUIState(isLinked) {
  // Nút Lưu & Kết nối nằm trong trang riêng #panel-aisettings nên luôn hiển thị để người dùng dễ đổi key bất kỳ lúc nào
  const verifyBtn = document.getElementById('btn-verify-key');
  if (verifyBtn) verifyBtn.classList.remove('hidden');
}

function unlinkGeminiAccount() {
  AppState.apiKey = '';
  AppState.apiVerified = false;
  AppState.discoveredModels = null;
  localStorage.removeItem('VIETBUILD_GEMINI_KEY');
  localStorage.removeItem('VIETBUILD_GEMINI_MODEL');
  const headerInput = document.getElementById('gemini-api-key-input');
  const modalInput = document.getElementById('modal-gemini-key-input');
  const headerSel = document.getElementById('gemini-model-select');
  const settingsWrap = document.getElementById('settings-model-wrap');
  const fb = document.getElementById('api-key-feedback');
  if (headerInput) headerInput.value = '';
  if (modalInput) modalInput.value = '';
  if (headerSel) headerSel.classList.add('hidden');
  if (settingsWrap) settingsWrap.classList.add('hidden');
  if (fb) {
    fb.textContent = 'Đã hủy liên kết API Key và chuyển về Chế độ Mô phỏng.';
    fb.className = 'p-3 rounded-xl text-xs font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-300';
  }
  toggleAIMode('demo');
  closeGeminiLinkModal();
}

async function connectAndVerifyGeminiKey(overrideKey = null, redirectOnSuccess = false) {
  const input = document.getElementById('gemini-api-key-input');
  const feedback = document.getElementById('api-key-feedback');
  const btn = document.getElementById('btn-verify-key');
  const badge = document.getElementById('ai-status-badge');

  const rawVal = overrideKey !== null ? overrideKey : (input ? input.value : AppState.apiKey);
  const cleaned = (rawVal || '').replace(/\s+/g, '');
  if (input) input.value = cleaned;
  AppState.apiKey = cleaned;
  localStorage.setItem('VIETBUILD_GEMINI_KEY', cleaned);

  if (!cleaned) {
    if (feedback) {
      feedback.textContent = '⚠️ Bạn chưa nhập mã API Key! Vui lòng dán mã API Key từ Google AI Studio.';
      feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-300';
    }
    return false;
  }

  AppState.aiMode = 'gemini';
  AppState.discoveredModels = null;
  localStorage.setItem('VIETBUILD_AI_MODE', 'gemini');

  if (btn) {
    btn.disabled = true;
    btn.textContent = '⚡ Đang kiểm tra...';
  }
  if (feedback) {
    feedback.textContent = '⚡ Đang xác thực API Key với Google Gemini...';
    feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-sky-500/15 border border-sky-500/30 text-sky-300';
  }

  try {
    const models = await discoverAvailableModels(cleaned);
    AppState.discoveredModels = models;
    if (!AppState.activeModel || !models.includes(AppState.activeModel)) {
      AppState.activeModel = models[0] || 'gemini-2.5-flash';
    }
    AppState.apiVerified = true;
    localStorage.setItem('VIETBUILD_GEMINI_MODEL', AppState.activeModel);
    populateModelSelect(models, AppState.activeModel);
    toggleAIMode('gemini');

    if (feedback) {
      feedback.textContent = redirectOnSuccess
        ? `✅ Kết nối thành công (${AppState.activeModel})! Đang chuyển về trang chính...`
        : `✅ Đã kết nối thành công (${AppState.activeModel})`;
      feedback.className = 'p-3 rounded-xl text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-300';
    }
    if (badge) {
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span><span class="truncate">AI Gemini (${AppState.activeModel})</span>`;
      badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition truncate max-w-[200px] sm:max-w-none';
    }

    // Nếu người dùng vừa chủ động nhập API thành công -> tự động chuyển về Trang chính!
    if (redirectOnSuccess) {
      setTimeout(() => {
        switchTab('intro');
      }, 650);
    }
    return true;
  } catch (err) {
    // Nhập sai API Key -> báo lỗi đỏ rõ ràng và GIỮ NGUYÊN ở lại trang nhập API
    if (feedback) {
      feedback.textContent = `❌ API Key không hợp lệ hoặc lỗi kết nối: ${err.message}`;
      feedback.className = 'p-3 rounded-xl text-xs font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-300';
    }
    if (badge) {
      badge.innerHTML = `<span class="w-2 h-2 rounded-full bg-rose-400 shrink-0"></span><span class="truncate">Lỗi API Key</span>`;
      badge.className = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 transition truncate max-w-[200px] sm:max-w-none';
    }
    return false;
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⚡ Lưu & Kết nối ngay';
    }
  }
}

// ============================================================================
// 4. MODULE 1: DASHBOARD TỔNG QUAN (100% DỮ LIỆU THẬT TỪ CÁC PHÂN HỆ)
// ============================================================================

function updateDashboardOverview() {
  const pd = AppState.projectData;

  const costEl = document.getElementById('dash-kpi-cost');
  const costSub = document.getElementById('dash-kpi-cost-sub');
  const safetyEl = document.getElementById('dash-kpi-safety');
  const safetySub = document.getElementById('dash-kpi-safety-sub');
  const carbonEl = document.getElementById('dash-kpi-carbon');
  const carbonSub = document.getElementById('dash-kpi-carbon-sub');
  const structEl = document.getElementById('dash-kpi-struct');
  const structSub = document.getElementById('dash-kpi-struct-sub');
  const countBadge = document.getElementById('dash-data-count');
  const emptyChart = document.getElementById('dash-chart-empty');
  const canvas = document.getElementById('chart-dashboard-progress');

  // 1. Thẻ Dự toán & 3. Thẻ Carbon (từ Mục 2)
  if (pd.estimator) {
    if (costEl) {
      costEl.textContent = pd.estimator.totalCostText;
      costEl.className = 'text-2xl font-extrabold text-white';
    }
    if (costSub) costSub.textContent = `Diện tích quy đổi: ${pd.estimator.builtAreaText}`;

    if (carbonEl) {
      carbonEl.textContent = `-${pd.estimator.co2SavedTons} Tấn CO₂`;
      carbonEl.className = 'text-2xl font-extrabold text-emerald-400';
    }
    if (carbonSub) {
      carbonSub.textContent = pd.estimator.ecoMode
        ? 'Đang bật Gói Vật liệu Xanh (Gạch AAC + Kính cản nhiệt)'
        : 'Chế độ vật liệu truyền thống';
    }
  } else {
    if (costEl) { costEl.textContent = 'Chưa có dữ liệu'; costEl.className = 'text-xl font-extrabold text-slate-500'; }
    if (costSub) costSub.textContent = 'Vào Mục 1 để nhập thông số & lập dự toán';
    if (carbonEl) { carbonEl.textContent = 'Chưa có dữ liệu'; carbonEl.className = 'text-xl font-extrabold text-slate-500'; }
    if (carbonSub) carbonSub.textContent = 'Bật gói Vật liệu Xanh ở Mục 1 để tính CO₂';
  }

  // 2. Thẻ Điểm An toàn (từ Mục 3)
  if (pd.siteguard) {
    if (safetyEl) {
      safetyEl.textContent = `${pd.siteguard.score} / 100`;
      safetyEl.className = pd.siteguard.score >= 80
        ? 'text-2xl font-extrabold text-emerald-400'
        : pd.siteguard.score >= 60
          ? 'text-2xl font-extrabold text-amber-400'
          : 'text-2xl font-extrabold text-rose-400';
    }
    if (safetySub) {
      safetySub.textContent = pd.siteguard.violationsCount > 0
        ? `⚠️ Phát hiện ${pd.siteguard.violationsCount} lỗi an toàn cần khắc phục`
        : '✅ Không phát hiện vi phạm an toàn nghiêm trọng';
    }
  } else {
    if (safetyEl) { safetyEl.textContent = 'Chưa có dữ liệu'; safetyEl.className = 'text-xl font-extrabold text-slate-500'; }
    if (safetySub) safetySub.textContent = 'Tải ảnh công trường ở Mục 3 để AI chấm điểm';
  }

  // 4. Thẻ Kiểm định Kết cấu & TCVN (từ Mục 2 & Mục 4)
  if (pd.crackdoctor) {
    if (structEl) {
      structEl.textContent = pd.crackdoctor.shortStatus;
      structEl.className = pd.crackdoctor.isSevere
        ? 'text-lg font-extrabold text-rose-400'
        : 'text-lg font-extrabold text-emerald-400';
    }
    if (structSub) structSub.textContent = `Chi phí sửa chữa dự kiến: ${pd.crackdoctor.repairTotalText}`;
  } else if (pd.tcvn) {
    if (structEl) {
      structEl.textContent = `${pd.tcvn.percent}% Đạt TCVN`;
      structEl.className = pd.tcvn.percent === 100
        ? 'text-2xl font-extrabold text-emerald-400'
        : 'text-2xl font-extrabold text-amber-400';
    }
    if (structSub) structSub.textContent = `Đạt ${pd.tcvn.passedCount}/${pd.tcvn.totalCount} tiêu chí TCVN 5574:2018`;
  } else {
    if (structEl) { structEl.textContent = 'Chưa có dữ liệu'; structEl.className = 'text-xl font-extrabold text-slate-500'; }
    if (structSub) structSub.textContent = 'Kiểm tra TCVN (Mục 2) hoặc quét vết nứt (Mục 4)';
  }

  // Đếm số phân hệ đã có dữ liệu thật
  const activeCount = [pd.estimator, pd.tcvn, pd.siteguard, pd.crackdoctor].filter(Boolean).length;
  if (countBadge) {
    countBadge.textContent = `${activeCount}/4 phân hệ có dữ liệu`;
    countBadge.className = activeCount > 0
      ? 'text-xs px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
      : 'text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400';
  }

  // Chỉ vẽ biểu đồ khi có ít nhất 1 phân hệ có dữ liệu thật
  if (activeCount === 0) {
    if (AppState.charts.dashboardProgress) {
      AppState.charts.dashboardProgress.destroy();
      AppState.charts.dashboardProgress = null;
    }
    if (canvas) canvas.classList.add('hidden');
    if (emptyChart) emptyChart.classList.remove('hidden');
    return;
  }

  if (emptyChart) emptyChart.classList.add('hidden');
  if (canvas) canvas.classList.remove('hidden');

  const labels = [];
  const values = [];
  const colors = [];

  if (pd.estimator) {
    labels.push('Hiệu quả Công trình Xanh (%)');
    values.push(pd.estimator.ecoMode ? 92 : 45);
    colors.push('#15803d');
  }
  if (pd.tcvn) {
    labels.push('Tuân thủ TCVN 5574:2018 (%)');
    values.push(pd.tcvn.percent);
    colors.push('#0369a1');
  }
  if (pd.siteguard) {
    labels.push('Điểm An toàn Công trường (/100)');
    values.push(Number(pd.siteguard.score) || 0);
    colors.push('#b45309');
  }
  if (pd.crackdoctor) {
    labels.push('Chỉ số An toàn Kết cấu (%)');
    values.push(pd.crackdoctor.healthScore);
    colors.push('#8b1e2b');
  }

  if (AppState.charts.dashboardProgress) AppState.charts.dashboardProgress.destroy();
  AppState.charts.dashboardProgress = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Chỉ số đánh giá thực tế (%)',
        data: values,
        backgroundColor: colors,
        borderRadius: 8,
        maxBarThickness: 52
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: '#334155', font: { size: 11, weight: '500' } }, grid: { display: false } },
        y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(15, 23, 42, 0.08)' }, min: 0, max: 100 }
      }
    }
  });
}

function resetProjectDashboard() {
  AppState.projectData = { estimator: null, tcvn: null, siteguard: null, crackdoctor: null };
  updateDashboardOverview();
}

// ============================================================================
// 5. MODULE 2: CONSTRUCTEST & ECOBUILD (DỰ TOÁN & VẬT LIỆU XANH)
// ============================================================================

function calculateEstimation(recordToDashboard = true) {
  const projType = document.getElementById('est-type')?.value || 'nhapho';
  const area = Math.max(20, parseFloat(document.getElementById('est-area')?.value) || 100);
  const floors = Math.max(1, parseInt(document.getElementById('est-floors')?.value) || 3);
  const floorH = parseFloat(document.getElementById('est-floor-h')?.value) || 3.6;
  const basement = document.getElementById('est-basement')?.value || 'none';
  const foundation = document.getElementById('est-foundation')?.value || 'bang';
  const roof = document.getElementById('est-roof')?.value || 'btct';
  const concreteGrade = document.getElementById('est-concrete-grade')?.value || 'B22.5';
  const region = document.getElementById('est-region')?.value || 'danang';
  const packageType = document.getElementById('est-package')?.value || 'standard';
  const ecoMode = document.getElementById('est-eco-toggle')?.checked || false;

  const foundCoeff = foundation === 'don' ? 0.35 : foundation === 'bang' ? 0.55 : 0.65;
  const baseCoeff = basement === 'semi' ? 1.5 : basement === 'full' ? 1.7 : 0;
  const roofCoeff = roof === 'ton' ? 0.30 : roof === 'btct' ? 0.50 : 0.75;
  const totalCoeff = foundCoeff + baseCoeff + floors * 1.0 + roofCoeff;
  const totalBuiltArea = Math.round(area * totalCoeff);

  const regionCoeff = region === 'hcm' ? 1.08 : region === 'hanoi' ? 1.05 : 1.0;
  const typeCoeff = projType === 'bietthu' ? 1.12 : projType === 'vanphong' ? 1.06 : 1.0;
  const gradeCoeff = concreteGrade === 'B25' ? 1.06 : concreteGrade === 'B20' ? 0.96 : 1.0;
  const heightCoeff = floorH / 3.6;

  // Bóc tách khối lượng 10 hạng mục chuẩn kỹ thuật (BOQ)
  const excavDepth = basement === 'full' ? 2.6 : basement === 'semi' ? 1.8 : (foundation === 'don' ? 1.4 : 1.7);
  const volExcavation = +(area * excavDepth * (basement !== 'none' ? 1.15 : 0.45)).toFixed(1);
  const volLeanConcrete = +(area * (foundation === 'don' ? 0.08 : 0.11)).toFixed(1);
  const volFoundConcrete = +(area * (foundation === 'don' ? 0.14 : foundation === 'bang' ? 0.22 : 0.26) + (basement !== 'none' ? area * 0.28 : 0)).toFixed(1);
  const volBodyConcrete = +(area * floors * (0.21 * heightCoeff) + area * (roof === 'btct' ? 0.14 : 0.05)).toFixed(1);
  const totalConcreteM3 = +(volFoundConcrete + volBodyConcrete).toFixed(1);

  const areaFormwork = +(totalConcreteM3 * 6.4).toFixed(1);
  const steelRatioKgPerM3 = projType === 'vanphong' ? 148 : projType === 'bietthu' ? 138 : 132;
  const totalSteelTon = +((totalConcreteM3 * steelRatioKgPerM3 * 1.03) / 1000).toFixed(2);
  const mainSteelTon = +(totalSteelTon * 0.64).toFixed(2);
  const stirrupSteelTon = +(totalSteelTon - mainSteelTon).toFixed(2);

  const wallFactor = projType === 'bietthu' ? 1.55 : projType === 'vanphong' ? 1.15 : 1.35;
  const areaWallM2 = Math.round(area * floors * wallFactor * heightCoeff);
  const bricksCount = Math.round(areaWallM2 * (ecoMode ? 8.5 : 58));
  const sandM3 = +(areaWallM2 * 0.068 + totalConcreteM3 * 0.08).toFixed(1);
  const stoneM3 = +(volLeanConcrete * 0.9 + totalConcreteM3 * 0.12).toFixed(1);
  const cementTon = +(areaWallM2 * 0.024 * (ecoMode ? 0.65 : 1) + volLeanConcrete * 0.22).toFixed(1);

  const areaPlasterM2 = Math.round(areaWallM2 * 2.05);
  const areaTilingM2 = Math.round(area * (floors + (basement !== 'none' ? 1 : 0)) * 0.92);
  const areaWaterproofM2 = Math.round(area * (roof === 'btct' ? 1.0 : 0.35) + floors * 12);
  const areaPaintM2 = Math.round(areaPlasterM2 * 1.12);

  const finishMult = packageType === 'basic' ? 0.82 : packageType === 'premium' ? 1.38 : 1.0;
  const totalManDays = Math.round(totalBuiltArea * (projType === 'bietthu' ? 3.0 : 2.5));
  const totalMachineShifts = +(totalConcreteM3 * 0.18 + volExcavation * 0.06 + floors * 4.5 + (basement !== 'none' ? 12 : 0)).toFixed(1);

  const boqItems = [
    { code: 'AB.11', name: `Vật liệu & Công tác Đất móng, Bê tông lót đá 4×6 M100 (${volLeanConcrete} m³)`, unit: 'm³', qty: volExcavation, unitPrice: Math.round(240000 * regionCoeff) },
    { code: 'AF.11', name: `Bê tông thương phẩm Móng, Cột, Dầm, Sàn cấp bền ${concreteGrade} (Móng ${volFoundConcrete} m³ + Thân ${volBodyConcrete} m³)`, unit: 'm³', qty: totalConcreteM3, unitPrice: Math.round(1450000 * regionCoeff * gradeCoeff) },
    { code: 'AF.61', name: 'Vật tư Cốp pha ván khuôn phủ phim & hệ giáo chống thi công kết cấu BTCT', unit: 'm²', qty: areaFormwork, unitPrice: Math.round(195000 * regionCoeff) },
    { code: 'AF.81', name: `Vật tư Cốt thép toàn khối (Thép chủ ${mainSteelTon}T + Đai/sàn ${stirrupSteelTon}T, gồm 3% hao hụt)`, unit: 'Tấn', qty: totalSteelTon, unitPrice: Math.round(18200000 * regionCoeff) },
    { code: 'AE.22', name: ecoMode ? `Vật tư Xây tường gạch nhẹ chưng áp AAC (${bricksCount.toLocaleString('vi-VN')} viên) + Keo xây` : `Vật tư Xây tường gạch ống Tuynel (${bricksCount.toLocaleString('vi-VN')} viên) + Vữa M75`, unit: 'm²', qty: areaWallM2, unitPrice: Math.round((ecoMode ? 285000 : 235000) * regionCoeff) },
    { code: 'AK.21', name: `Vật tư Trát tường trong/ngoài & láng nền (Xi măng ${cementTon}T, Cát ${sandM3} m³, Đá ${stoneM3} m³)`, unit: 'm²', qty: areaPlasterM2, unitPrice: Math.round(105000 * regionCoeff) },
    { code: 'AK.51', name: 'Vật tư Ốp lát gạch Ceramic / Granite nền nhà, cầu thang & khu vệ sinh', unit: 'm²', qty: areaTilingM2, unitPrice: Math.round(420000 * regionCoeff * finishMult) },
    { code: 'AK.74', name: 'Vật tư Chống thấm sàn mái, ban công & sàn khu vệ sinh (Sika 2 thành phần)', unit: 'm²', qty: areaWaterproofM2, unitPrice: Math.round(185000 * regionCoeff) },
    { code: 'AK.82', name: ecoMode ? 'Vật tư Bả matit, sơn lót kháng kiềm & sơn phủ sinh thái ít VOC (2 lớp)' : 'Vật tư Bả matit & sơn nước nội/ngoại thất hoàn thiện (2 lớp)', unit: 'm²', qty: areaPaintM2, unitPrice: Math.round((ecoMode ? 92000 : 75000) * regionCoeff * finishMult) },
    { code: 'MEP-01', name: ecoMode ? 'Thiết bị Điện, Cấp thoát nước, Cửa nhôm kính Low-E cản nhiệt' : 'Thiết bị Điện, Cấp thoát nước & Cửa nhôm kính hoàn thiện', unit: 'm² sàn', qty: totalBuiltArea, unitPrice: Math.round((ecoMode ? 1280000 : 1050000) * regionCoeff * finishMult * typeCoeff) },
    { code: 'NC-01', name: `Chi phí Nhân công thi công trực tiếp (Thợ chính bậc 3,5/7 & phụ hồ toàn công trình)`, unit: 'Công', qty: totalManDays, unitPrice: Math.round(480000 * regionCoeff) },
    { code: 'MTC-01', name: 'Chi phí Máy móc & Thiết bị thi công (Xe bơm cần bê tông, máy xúc, đầm dùi, cắt/uốn thép, tời/vận thăng)', unit: 'Ca máy', qty: totalMachineShifts, unitPrice: Math.round(2150000 * regionCoeff) }
  ];

  const rawMaterialCost = boqItems.slice(0, 6).reduce((acc, it) => acc + Math.round(it.qty * it.unitPrice), 0);
  const finishMaterialCost = boqItems.slice(6, 10).reduce((acc, it) => acc + Math.round(it.qty * it.unitPrice), 0);
  const laborAndMachineCost = boqItems.slice(10).reduce((acc, it) => acc + Math.round(it.qty * it.unitPrice), 0);
  const rawCost = rawMaterialCost + Math.round(laborAndMachineCost * 0.65);
  const finishCost = finishMaterialCost + Math.round(laborAndMachineCost * 0.35);
  const contingencyCost = Math.round((rawMaterialCost + finishMaterialCost + laborAndMachineCost) * 0.05);
  const grandTotal = rawMaterialCost + finishMaterialCost + laborAndMachineCost + contingencyCost;

  const wallLoadTons = Math.round(areaWallM2 * (ecoMode ? 0.14 : 0.28));
  const structLoadTons = Math.round(totalConcreteM3 * 2.5 + totalBuiltArea * 0.25);
  const totalLoadTons = structLoadTons + wallLoadTons;
  const durationMonths = +(Math.max(2.5, totalBuiltArea / 85 + (basement !== 'none' ? 1.2 : 0))).toFixed(1);

  const co2SavedTons = ecoMode ? +(totalBuiltArea * 0.048).toFixed(2) : +(totalBuiltArea * 0.008).toFixed(2);
  const annualElecSavedMWh = ecoMode ? +(totalBuiltArea * 0.026).toFixed(2) : +(totalBuiltArea * 0.004).toFixed(2);
  const fiveYearMoneySaved = Math.round(annualElecSavedMWh * 1000 * 3200 * 5);

  const fmtVND = (num) => (num / 1e9 >= 1 ? (num / 1e9).toFixed(2) + ' Tỷ đ' : Math.round(num / 1e6).toLocaleString('vi-VN') + ' Triệu đ');

  document.getElementById('out-built-area').textContent = `${totalBuiltArea.toLocaleString('vi-VN')} m² (HS ${totalCoeff.toFixed(2)})`;
  document.getElementById('out-total-cost').textContent = fmtVND(grandTotal);
  document.getElementById('out-raw-cost').textContent = fmtVND(rawCost);
  document.getElementById('out-finish-cost').textContent = fmtVND(finishCost);

  document.getElementById('mat-concrete').textContent = `${totalConcreteM3} m³ (${concreteGrade})`;
  document.getElementById('mat-steel').textContent = `${totalSteelTon} Tấn (Chủ ${mainSteelTon}T / Đai ${stirrupSteelTon}T)`;
  document.getElementById('mat-cement').textContent = `${cementTon}T XM • ${sandM3} m³ cát • ${stoneM3} m³ đá`;
  document.getElementById('mat-brick').textContent = ecoMode
    ? `${bricksCount.toLocaleString('vi-VN')} viên AAC (${areaWallM2} m²)`
    : `${bricksCount.toLocaleString('vi-VN')} viên Tuynel (${areaWallM2} m²)`;

  document.getElementById('eco-co2').textContent = `-${co2SavedTons} Tấn CO₂e`;
  document.getElementById('eco-elec').textContent = `${fmtVND(fiveYearMoneySaved)} / 5 năm`;

  const durEl = document.getElementById('tech-duration');
  const loadEl = document.getElementById('tech-load');
  const manEl = document.getElementById('tech-mandays');
  if (durEl) durEl.textContent = `~${durationMonths} Tháng`;
  if (loadEl) loadEl.textContent = `~${totalLoadTons.toLocaleString('vi-VN')} Tấn`;
  if (manEl) manEl.textContent = `${totalManDays.toLocaleString('vi-VN')} ngày công thợ`;

  const boqBody = document.getElementById('boq-detail-body');
  if (boqBody) {
    const rows = boqItems.map(it => {
      const sub = Math.round(it.qty * it.unitPrice);
      return `
        <tr class="hover:bg-slate-800/40 transition">
          <td class="py-2.5 pr-3 font-mono-tech text-xs text-sky-400 font-semibold whitespace-nowrap">${it.code}</td>
          <td class="py-2.5 pr-3 text-slate-200">${it.name}</td>
          <td class="py-2.5 px-2 text-center text-slate-400 whitespace-nowrap">${it.unit}</td>
          <td class="py-2.5 px-2 text-right font-semibold text-amber-400 whitespace-nowrap">${it.qty.toLocaleString('vi-VN')}</td>
          <td class="py-2.5 px-2 text-right text-slate-400 whitespace-nowrap hidden sm:table-cell">${it.unitPrice.toLocaleString('vi-VN')}</td>
          <td class="py-2.5 pl-2 text-right font-bold text-slate-100 whitespace-nowrap">${sub.toLocaleString('vi-VN')}</td>
        </tr>
      `;
    }).join('');
    boqBody.innerHTML = rows + `
      <tr style="background:#f8fafc;">
        <td colspan="5" class="py-2.5 px-2 text-right text-xs font-semibold text-slate-600">Chi phí dự phòng trượt giá &amp; phát sinh (5%):</td>
        <td class="py-2.5 pl-2 text-right font-bold text-slate-800 whitespace-nowrap">${contingencyCost.toLocaleString('vi-VN')}</td>
      </tr>
      <tr style="background:#fdf2f4;" class="font-bold">
        <td colspan="5" class="py-3 px-2 text-right text-xs sm:text-sm uppercase" style="color:#8b1e2b;">Tổng dự toán công trình (Vật liệu + Nhân công + Máy TC + 5% dự phòng):</td>
        <td class="py-3 pl-2 text-right text-sm sm:text-base font-extrabold whitespace-nowrap" style="color:#15803d;">${grandTotal.toLocaleString('vi-VN')}</td>
      </tr>
    `;
  }

  if (recordToDashboard) {
    AppState.projectData.estimator = {
      totalCostText: fmtVND(grandTotal),
      builtAreaText: `${totalBuiltArea.toLocaleString('vi-VN')} m²`,
      co2SavedTons,
      ecoMode
    };
    updateDashboardOverview();
  }

  const ctxEst = document.getElementById('chart-estimator');
  if (ctxEst) {
    if (AppState.charts.estimator) AppState.charts.estimator.destroy();
    AppState.charts.estimator = new Chart(ctxEst, {
      type: 'doughnut',
      data: {
        labels: ['Vật liệu Phần thô & Xây trát', 'Vật tư Hoàn thiện & MEP', 'Nhân công & Máy thi công', 'Dự phòng phí (5%)'],
        datasets: [{
          data: [Math.round(rawMaterialCost / 1e6), Math.round(finishMaterialCost / 1e6), Math.round(laborAndMachineCost / 1e6), Math.round(contingencyCost / 1e6)],
          backgroundColor: ['#8b1e2b', '#0369a1', '#b45309', '#64748b'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#334155', font: { size: 11, weight: '500' }, padding: 12 } }
        }
      }
    });
  }
}

function formatAIResponseHTML(rawText) {
  if (!rawText) return '';
  const escapeHtml = (str) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const convertLatexToHtml = (expr) => {
    let e = expr.trim();
    // Phân số \frac{a}{b} -> a/b
    e = e.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1/$2)');
    // Bỏ \text{...}, \mathrm{...}, \mathbf{...}, \left, \right
    e = e.replace(/\\(?:text|mathrm|mathbf|operatorname|it)\{([^{}]*)\}/g, '$1');
    e = e.replace(/\\(?:left|right|,|;|!|quad|qquad)/g, ' ');
    // Các toán tử & ký hiệu Hy Lạp phổ biến trong Xây dựng
    const symbolMap = [
      [/\\geq|\\ge\b/g, '≥'],
      [/\\leq|\\le\b/g, '≤'],
      [/\\neq|\\ne\b/g, '≠'],
      [/\\approx/g, '≈'],
      [/\\times/g, '×'],
      [/\\cdot/g, '·'],
      [/\\div/g, '÷'],
      [/\\pm/g, '±'],
      [/\\infty/g, '∞'],
      [/\\circ/g, '°'],
      [/\\degree/g, '°'],
      [/\\gamma/g, 'γ'],
      [/\\Gamma/g, 'Γ'],
      [/\\lambda/g, 'λ'],
      [/\\varphi|\\phi/g, 'φ'],
      [/\\Phi/g, 'Φ'],
      [/\\Delta/g, 'Δ'],
      [/\\delta/g, 'δ'],
      [/\\sigma/g, 'σ'],
      [/\\tau/g, 'τ'],
      [/\\alpha/g, 'α'],
      [/\\beta/g, 'β'],
      [/\\mu/g, 'μ'],
      [/\\rho/g, 'ρ'],
      [/\\theta/g, 'θ'],
      [/\\pi/g, 'π'],
      [/\\omega/g, 'ω'],
      [/\\Omega/g, 'Ω'],
      [/\\%/g, '%']
    ];
    for (const [regex, rep] of symbolMap) {
      e = e.replace(regex, rep);
    }
    // Chỉ số dưới & chỉ số trên: c_{min} -> c<sub>min</sub>, c_0 -> c<sub>0</sub>, m^{2} -> m<sup>2</sup>
    e = e.replace(/_\{([^{}]+)\}/g, '<sub>$1</sub>');
    e = e.replace(/_([A-Za-z0-9]+)/g, '<sub>$1</sub>');
    e = e.replace(/\^\{([^{}]+)\}/g, '<sup>$1</sup>');
    e = e.replace(/\^([A-Za-z0-9+-]+)/g, '<sup>$1</sup>');
    // Xóa các dấu ngoặc nhọn hoặc gạch chéo ngược còn sót
    e = e.replace(/[{}]/g, '').replace(/\\/g, '');
    return `<span class="font-semibold text-sky-300">${e.replace(/\s+/g, ' ').trim()}</span>`;
  };

  const renderInline = (str) => {
    let s = escapeHtml(str);
    // 1. Chuyển toàn bộ công thức LaTeX $$...$$ và $...$ sang HTML/Unicode chuẩn đẹp
    s = s.replace(/\$\$([^$]+)\$\$/g, (_, expr) => convertLatexToHtml(expr));
    s = s.replace(/\$([^$\n]+)\$/g, (_, expr) => convertLatexToHtml(expr));
    // 2. Xử lý các ký hiệu toán học viết rời không có $ (VD: c_{min}, \geq, m2, m3)
    s = s.replace(/\\geq|\\ge\b/g, '≥').replace(/\\leq|\\le\b/g, '≤').replace(/\\div/g, '÷').replace(/\\times/g, '×');
    s = s.replace(/([A-Za-zγλφΔσ])_\{([^{}]+)\}/g, '$1<sub>$2</sub>');
    s = s.replace(/(\d|\b)(kN\/m2|kg\/m2|N\/mm2|m2)\b/g, (m) => m.replace('2', '²'));
    s = s.replace(/(\d|\b)(kg\/m3|kN\/m3|m3)\b/g, (m) => m.replace('3', '³'));
    // 3. Chuyển **in đậm** thành thẻ strong nổi bật
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong class="text-amber-300 font-semibold">$1</strong>');
    // 4. Xóa các dấu * đơn lẻ còn sót
    s = s.replace(/(^|\s)\*([^*\n]+)\*(?=\s|[.,:;!?]|$)/g, '$1$2');
    s = s.replace(/\*/g, '');
    return s;
  };

  // Tách các câu hoàn chỉnh trong cùng một đoạn xuống dòng riêng (KHÔNG tách sau số thứ tự như 1. 2. hoặc viết tắt TP. VD.)
  const splitSentencesToLines = (text) => {
    return text.replace(
      /(?<!\b\d{1,2})(?<!\b(?:TP|VD|ThS|TS|KS|Q|P))([.!?])\s+(?=[A-ZÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ])/g,
      '$1\n'
    );
  };

  const rawLines = rawText.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];

  for (let line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 1. Tiêu đề Markdown (#, ##, ###)
    if (/^#{1,4}\s+/.test(trimmed)) {
      const heading = trimmed.replace(/^#{1,4}\s+/, '');
      blocks.push(`<div class="font-bold text-amber-400 text-sm pt-2 border-b border-slate-800 pb-1">${renderInline(heading)}</div>`);
      continue;
    }

    // 2. Mục đánh số lớn (VD: "1. Tiêu đề", "- 1. Tiêu đề", "**1. Tiêu đề**") -> giữ nguyên trên 1 dòng tiêu đề gọn đẹp
    const numberedMatch = trimmed.match(/^(?:[-*•]\s*)?(?:\*\*)?(\d+[.)])\s+(.+?)(?:\*\*)?$/);
    if (numberedMatch) {
      const numLabel = numberedMatch[1];
      const numContent = numberedMatch[2];
      // Nếu dòng ngắn (< 120 ký tự) xem như tiêu đề mục; nếu dài thì tách câu phần sau
      const splitNum = splitSentencesToLines(numContent).split('\n').map(l => l.trim()).filter(Boolean);
      const firstLine = `<div class="font-bold text-amber-400 text-sm pt-2">${numLabel} ${renderInline(splitNum[0])}</div>`;
      const restLines = splitNum.slice(1).map(sub => `<div class="pl-5 text-slate-200 mt-1 leading-relaxed">${renderInline(sub)}</div>`).join('');
      blocks.push(`<div>${firstLine}${restLines}</div>`);
      continue;
    }

    // 3. Gạch đầu dòng (- , * , • )
    const bulletMatch = trimmed.match(/^[-*•]+\s+(.*)$/);
    if (bulletMatch) {
      const body = splitSentencesToLines(bulletMatch[1]);
      const subLines = body.split('\n').map(l => l.trim()).filter(Boolean);
      const formattedBody = subLines
        .map((sub, idx) =>
          idx === 0
            ? `<div><span class="text-amber-400 font-bold mr-1.5">-</span>${renderInline(sub)}</div>`
            : `<div class="pl-4 text-slate-300 mt-1">${renderInline(sub)}</div>`
        )
        .join('');
      blocks.push(`<div class="leading-relaxed">${formattedBody}</div>`);
      continue;
    }

    // 4. Đoạn văn thường -> mỗi câu hoàn chỉnh xuống dòng rõ ràng
    const splitPara = splitSentencesToLines(trimmed).split('\n').map(l => l.trim()).filter(Boolean);
    splitPara.forEach((sentence) => {
      blocks.push(`<p class="leading-relaxed text-slate-200">${renderInline(sentence)}</p>`);
    });
  }

  return `<div class="space-y-2.5 text-sm text-slate-200">${blocks.join('')}</div>`;
}

async function runEstimatorAIAdvice() {
  const projType = document.getElementById('est-type')?.selectedOptions?.[0]?.text || 'Nhà phố';
  const area = document.getElementById('est-area').value;
  const floors = document.getElementById('est-floors').value;
  const floorH = document.getElementById('est-floor-h')?.value || '3.6';
  const basement = document.getElementById('est-basement')?.selectedOptions?.[0]?.text || 'Không hầm';
  const foundation = document.getElementById('est-foundation').selectedOptions[0].text;
  const concreteGrade = document.getElementById('est-concrete-grade')?.value || 'B22.5';
  const region = document.getElementById('est-region')?.selectedOptions?.[0]?.text || 'Đà Nẵng';
  const ecoMode = document.getElementById('est-eco-toggle').checked;
  const totalCost = document.getElementById('out-total-cost')?.textContent || '';
  const totalLoad = document.getElementById('tech-load')?.textContent || '';
  const box = document.getElementById('est-ai-response');

  box.innerHTML = `<div class="flex items-center gap-2.5 text-amber-400 text-sm"><span class="animate-spin inline-block w-4 h-4 shrink-0 border-2 border-amber-400 border-t-transparent rounded-full"></span><span>AI Kỹ sư Dự toán &amp; Kết cấu đang phân tích hồ sơ BOQ...</span></div>`;

  try {
    const prompt = `Bạn là Kỹ sư Kinh tế Xây dựng (QS) & Kỹ sư Kết cấu tại Việt Nam. Hãy phân tích kỹ thuật và tối ưu chi phí theo 4 mục cho công trình: Loại hình ${projType}, khu vực ${region}, diện tích ${area}m²/tầng, ${floors} tầng (chiều cao tầng ${floorH}m), ${basement}, ${foundation}, bê tông ${concreteGrade}, tổng tải trọng ước tính ${totalLoad}, dự toán ${totalCost}, vật liệu xanh: ${ecoMode ? 'Đang bật (Gạch AAC + Kính Low-E)' : 'Truyền thống'}. Yêu cầu trình bày văn bản chuẩn tiếng Việt bằng dấu gạch đầu dòng (-), không dùng dấu (*), không dùng cú pháp LaTeX $...$, mỗi ý và mỗi câu hoàn chỉnh đều xuống dòng riêng rõ ràng.`;
    const reply = await callGeminiAPI(prompt);
    box.innerHTML = `
      <div class="space-y-3">
        <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider">Phản hồi trực tiếp từ Gemini AI (${AppState.activeModel})</div>
        ${formatAIResponseHTML(reply)}
      </div>
    `;
  } catch (e) {
    if (e.message !== 'DEMO_MODE') {
      box.innerHTML = `
        <div class="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-sm text-rose-200 space-y-1">
          <div class="font-bold text-rose-300">❌ Không thể gọi Gemini API thật:</div>
          <div>${e.message}</div>
          <div class="text-xs text-slate-300 pt-1">💡 Hãy kiểm tra lại API Key ở thanh trên cùng và bấm nút <strong>"✓ Lưu &amp; Kết nối"</strong>, hoặc chuyển sang chế độ <strong>Mô phỏng Thông minh</strong>.</div>
        </div>
      `;
      return;
    }
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

function checkStructureTCVN(recordToDashboard = true) {
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

  if (recordToDashboard) {
    const passedCount = [beamOk, coverOk, slabOk].filter(Boolean).length;
    AppState.projectData.tcvn = {
      passedCount,
      totalCount: 3,
      percent: Math.round((passedCount / 3) * 100)
    };
    updateDashboardOverview();
  }

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
  out.innerHTML = `<div class="flex items-center gap-2.5 text-amber-400 text-sm p-4"><span class="animate-spin inline-block w-4 h-4 shrink-0 border-2 border-amber-400 border-t-transparent rounded-full"></span><span>Đang đối chiếu cơ sở dữ liệu TCVN / QCVN...</span></div>`;

  try {
    const prompt = `Bạn là Chuyên gia Thẩm tra Thiết kế Xây dựng Việt Nam. Hãy trả lời câu hỏi sau có trích dẫn rõ mã tiêu chuẩn (TCVN 5574:2018, TCVN 2737:2023, QCVN 06:2022/BXD, TCVN 9362:2012), điều khoản và con số cụ thể. Trình bày văn bản chuẩn tiếng Việt bằng dấu gạch đầu dòng (-), không dùng dấu (*), KHÔNG dùng ký hiệu LaTeX $...$ (hãy viết thẳng ký hiệu chuẩn như ≥, ≤, m², c0, acrc), mỗi ý và mỗi câu đều xuống dòng riêng rõ ràng: "${query}"`;
    const aiText = await callGeminiAPI(prompt);
    out.innerHTML = `
      <div class="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
        <div class="text-xs font-semibold text-emerald-400 uppercase tracking-wider">✨ Phản hồi trực tiếp từ Gemini AI (${AppState.activeModel})</div>
        ${formatAIResponseHTML(aiText)}
      </div>
    `;
  } catch (e) {
    const errorBanner = e.message !== 'DEMO_MODE'
      ? `<div class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-200 mb-3"><strong>❌ Lỗi kết nối Gemini API:</strong> ${e.message} (Đang hiển thị kết quả tra cứu dự phòng từ kho TCVN nội bộ bên dưới)</div>`
      : '';
    // Smart Local RAG Search
    const qLower = query.toLowerCase();
    const matched = TCVN_KNOWLEDGE.filter(item =>
      item.keywords.some(k => qLower.includes(k)) ||
      item.title.toLowerCase().includes(qLower)
    );
    const results = matched.length > 0 ? matched : TCVN_KNOWLEDGE.slice(0, 2);

    out.innerHTML = `
      ${errorBanner}
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
// 7. MODULE 4: AI SITEGUARD (GIÁM SÁT AN TOÀN & NHẬT KÝ TỪ ẢNH THỰC TẾ)
// ============================================================================

function getSeverityColor(severityText) {
  const s = (severityText || '').toLowerCase();
  if (s.includes('nghiêm trọng') || s.includes('đặc biệt') || s.includes('nguy hiểm')) {
    return { hex: '#ef4444', bg: 'rgba(239, 68, 68, 0.24)', border: '#ef4444', badge: 'bg-rose-500 text-white' };
  }
  if (s.includes('cao')) {
    return { hex: '#f97316', bg: 'rgba(249, 115, 22, 0.24)', border: '#f97316', badge: 'bg-orange-500 text-slate-950' };
  }
  return { hex: '#eab308', bg: 'rgba(234, 179, 8, 0.22)', border: '#eab308', badge: 'bg-amber-400 text-slate-950' };
}

function resetSiteGuardUI(statusMsg = 'Chưa có ảnh công trường — Hãy tải ảnh thực tế lên để AI khoanh vùng nguy hiểm và lập Nhật ký thi công.') {
  const overlay = document.getElementById('site-boxes-overlay');
  const scoreEl = document.getElementById('site-score');
  const riskEl = document.getElementById('site-risk-badge');
  const workersEl = document.getElementById('site-workers');
  const vList = document.getElementById('site-violations-list');
  const diaryBox = document.getElementById('site-diary-box');

  if (overlay) overlay.innerHTML = '';
  if (scoreEl) scoreEl.textContent = '--';
  if (riskEl) {
    riskEl.textContent = 'Chờ phân tích';
    riskEl.className = 'text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold';
  }
  if (workersEl) workersEl.textContent = '--';
  if (vList) vList.innerHTML = `<div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">${statusMsg}</div>`;
  if (diaryBox) diaryBox.innerHTML = `<div class="text-xs text-slate-400">Nhật ký thi công &amp; biên bản nhắc nhở an toàn sẽ được AI tự động tạo sau khi quét ảnh công trường của bạn.</div>`;
}

function highlightSiteViolation(targetId) {
  document.querySelectorAll('.site-danger-box').forEach(el => {
    const isTarget = el.dataset.vid === targetId;
    const tip = el.querySelector('.site-reason-tip');
    if (isTarget) {
      el.style.zIndex = '50';
      el.style.boxShadow = '0 0 0 3px rgba(255,255,255,0.85), 0 0 18px rgba(0,0,0,0.7)';
      if (tip) tip.classList.remove('hidden');
    } else {
      el.style.zIndex = el.dataset.baseZ || '10';
      el.style.boxShadow = '0 0 8px rgba(0,0,0,0.35)';
      if (tip) tip.classList.add('hidden');
    }
  });
  document.querySelectorAll('.site-violation-card').forEach(card => {
    if (card.dataset.vid === targetId) {
      card.classList.add('ring-2', 'ring-amber-400', 'bg-slate-900');
    } else {
      card.classList.remove('ring-2', 'ring-amber-400', 'bg-slate-900');
    }
  });
}

function renderSiteDangerBoxes(violations) {
  const overlay = document.getElementById('site-boxes-overlay');
  if (!overlay) return;
  overlay.innerHTML = '';

  if (!Array.isArray(violations) || !violations.length) return;

  const escapeHtml = (str) =>
    String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // Chuẩn hóa tọa độ và tính diện tích để khung lớn nằm dưới, khung nhỏ nằm trên (không bao giờ che nhau)
  const normalized = violations.map((v, idx) => {
    const id = v.id || `V${idx + 1}`;
    let ymin = 150, xmin = 150, ymax = 550, xmax = 550;
    if (Array.isArray(v.box_2d) && v.box_2d.length === 4) {
      [ymin, xmin, ymax, xmax] = v.box_2d.map(n => Math.max(0, Math.min(1000, Number(n) || 0)));
      if (ymax <= ymin) ymax = Math.min(1000, ymin + 200);
      if (xmax <= xmin) xmax = Math.min(1000, xmin + 220);
    } else {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      xmin = 60 + col * 460;
      xmax = Math.min(960, xmin + 420);
      ymin = 100 + row * 380;
      ymax = Math.min(940, ymin + 320);
    }

    let widthPct = (xmax - xmin) / 10;
    let heightPct = (ymax - ymin) / 10;
    let leftPct = xmin / 10;
    let topPct = ymin / 10;

    if (widthPct < 18) {
      const diff = 18 - widthPct;
      leftPct = Math.max(1, Math.min(100 - 19, leftPct - diff / 2));
      widthPct = 18;
    }
    if (heightPct < 18) {
      const diff = 18 - heightPct;
      topPct = Math.max(1, Math.min(100 - 19, topPct - diff / 2));
      heightPct = 18;
    }

    return {
      v,
      id,
      idx,
      leftPct,
      topPct,
      widthPct,
      heightPct,
      area: widthPct * heightPct
    };
  });

  // Sắp xếp khung lớn trước (z-index thấp), khung nhỏ sau (z-index cao hơn để dễ hover/click)
  normalized.sort((a, b) => b.area - a.area);

  // Theo dõi vị trí nhãn để tránh đè nhau khi 2 khung ở gần nhau
  const placedTags = [];

  normalized.forEach((item, orderIdx) => {
    const { v, id, leftPct, topPct, widthPct, heightPct } = item;
    const style = getSeverityColor(v.severity);
    const baseZ = 10 + orderIdx;

    // Chọn góc đặt nhãn gọn bên TRONG khung (không bao giờ tràn ra ngoài ảnh!)
    // Nếu có nhãn khác gần góc trên-trái, tự động đẩy xuống dưới hoặc sang góc phải
    let tagCorner = 'top: 4px; left: 4px;';
    const overlapsTopLeft = placedTags.some(
      t => Math.abs(t.x - leftPct) < 22 && Math.abs(t.y - topPct) < 12
    );
    if (overlapsTopLeft) {
      tagCorner = 'bottom: 4px; left: 4px;';
      placedTags.push({ x: leftPct, y: topPct + heightPct - 6 });
    } else {
      placedTags.push({ x: leftPct, y: topPct });
    }

    // Đặt hộp Lý do nguy hiểm nằm GỌN TRONG ẢNH (hiện khi hover hoặc click vào khung / danh sách bên phải)
    const tipVert = (topPct + heightPct) > 72 ? 'bottom: 28px;' : 'top: 28px;';
    const tipHoriz = leftPct > 55 ? 'right: 4px;' : 'left: 4px;';

    const boxEl = document.createElement('div');
    boxEl.className = 'site-danger-box cursor-pointer transition-all duration-150';
    boxEl.dataset.vid = id;
    boxEl.dataset.baseZ = String(baseZ);
    boxEl.style.cssText = `
      position: absolute;
      top: ${topPct.toFixed(2)}%;
      left: ${leftPct.toFixed(2)}%;
      width: ${widthPct.toFixed(2)}%;
      height: ${heightPct.toFixed(2)}%;
      background-color: ${style.bg};
      border: 2.5px solid ${style.border};
      border-radius: 6px;
      box-shadow: 0 0 8px rgba(0,0,0,0.35);
      pointer-events: auto;
      z-index: ${baseZ};
    `;

    boxEl.addEventListener('mouseenter', () => highlightSiteViolation(id));
    boxEl.addEventListener('click', (e) => {
      e.stopPropagation();
      highlightSiteViolation(id);
    });

    boxEl.innerHTML = `
      <div style="position:absolute; ${tagCorner} background:${style.border}; color:#0f172a;"
           class="px-2 py-0.5 rounded text-[10px] sm:text-[11px] font-extrabold leading-tight shadow-md max-w-[92%] truncate">
        [${escapeHtml(id)}] ${escapeHtml(v.title || 'Vùng nguy hiểm')}
      </div>
      <div class="site-reason-tip hidden"
           style="position:absolute; ${tipVert} ${tipHoriz} width:230px; max-width:90%; border:1.5px solid ${style.border}; z-index:60;"
           class="rounded-lg shadow-2xl">
        <div class="p-2 rounded-lg bg-slate-950/95 text-[11px] text-slate-100 leading-snug shadow-2xl">
          <div class="font-extrabold text-amber-300 mb-0.5">[${escapeHtml(id)}] ${escapeHtml(v.title || '')}</div>
          <div><strong>⚠️ Lý do:</strong> ${escapeHtml(v.reason || 'Nguy cơ mất an toàn lao động')}</div>
        </div>
      </div>
    `;

    overlay.appendChild(boxEl);
  });

  // Mặc định làm nổi bật lỗi đầu tiên (hoặc lỗi nghiêm trọng nhất) để người xem thấy ngay lý do mà không bị rối
  const firstId = violations[0]?.id || 'V1';
  highlightSiteViolation(firstId);
}

function handleSiteImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    AppState.uploadedSiteBase64 = base64;
    AppState.uploadedSiteMime = file.type || 'image/jpeg';

    const emptyState = document.getElementById('site-empty-state');
    const stage = document.getElementById('site-image-stage');
    const previewImg = document.getElementById('site-preview-img');
    const reanalyzeBtn = document.getElementById('btn-reanalyze-site');

    if (previewImg) previewImg.src = base64;
    if (emptyState) emptyState.classList.add('hidden');
    if (stage) stage.classList.remove('hidden');
    if (reanalyzeBtn) reanalyzeBtn.classList.remove('hidden');

    await analyzeUploadedSiteImage();
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

async function analyzeUploadedSiteImage() {
  if (!AppState.uploadedSiteBase64) return;

  const overlay = document.getElementById('site-boxes-overlay');
  const scoreEl = document.getElementById('site-score');
  const riskEl = document.getElementById('site-risk-badge');
  const workersEl = document.getElementById('site-workers');
  const vList = document.getElementById('site-violations-list');
  const diaryBox = document.getElementById('site-diary-box');
  const contextNote = (document.getElementById('site-context-input')?.value || '').trim();

  if (AppState.aiMode !== 'gemini' || !(AppState.apiKey || '').trim()) {
    resetSiteGuardUI('⚠️ Bạn đang ở Chế độ Mô phỏng. Hãy bấm "✨ Kết nối AI Gemini Thật (API Key)" ở thanh trên cùng rồi bấm "🔍 Quét lại An toàn AI" để AI khoanh vùng nguy hiểm trực tiếp trên ảnh công trường của bạn!');
    return;
  }

  if (overlay) overlay.innerHTML = '';
  if (scoreEl) scoreEl.textContent = '⏳';
  if (riskEl) {
    riskEl.textContent = 'Đang quét ảnh...';
    riskEl.className = 'text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-semibold animate-pulse';
  }
  if (workersEl) workersEl.textContent = 'Đang kiểm đếm...';
  if (vList) {
    vList.innerHTML = `<div class="flex items-center gap-2.5 text-emerald-400 text-xs p-3 rounded-xl bg-slate-950 border border-slate-800"><span class="animate-spin inline-block w-4 h-4 shrink-0 border-2 border-emerald-400 border-t-transparent rounded-full"></span><span>Gemini Vision (${AppState.activeModel}) đang kiểm tra toàn diện 8 hạng mục an toàn &amp; khoanh vùng nguy hiểm...</span></div>`;
  }
  if (diaryBox) {
    diaryBox.innerHTML = `<div class="text-xs text-slate-400 animate-pulse">Đang tự động lập Nhật ký thi công &amp; biên bản nhắc nhở an toàn...</div>`;
  }

  const todayStr = new Date().toLocaleDateString('vi-VN');
  const prompt = `Bạn là Chuyên gia Giám sát An toàn Lao động (HSE) cấp cao tại công trường xây dựng Việt Nam.
Hãy quan sát thật kỹ TỪNG CHI TIẾT trong bức ảnh công trường người dùng vừa tải lên${contextNote ? ` (Hạng mục: "${contextNote}")` : ''}.

BẮT BUỘC KIỂM TRA ĐẦY ĐỦ 8 HẠNG MỤC AN TOÀN SAU (KHÔNG ĐƯỢC BỎ SÓT LỖI NÀO THẤY TRONG ẢNH):
1. BẢO HỘ ĐẦU: Công nhân có đội mũ bảo hộ cứng chuyên dụng không? (Lưu ý: mũ lưỡi trai vải KHÔNG phải mũ bảo hộ!).
2. BẢO HỘ MẮT & HÔ HẤP: Khi đang cắt, mài, đục tường/bê tông có đeo kính bảo hộ chống mảnh văng/tia lửa và khẩu trang chống bụi mịn không?
3. BẢO HỘ TAY & CHÂN: Có đeo găng tay bảo hộ khi cầm máy/vật sắc nhọn và đi giày/ủng bảo hộ không?
4. THIẾT BỊ CẦM TAY (MÁY CẮT / MÁY MÀI / MÁY KHOAN): Nếu công nhân đang cầm máy cắt/mài cầm tay, hãy soi kỹ xem máy có lắp chụp chắn bảo vệ lưỡi cắt (ốp bảo vệ) không, tư thế cầm máy có an toàn không, dây điện có bị vướng/rò rỉ không?
5. LÀM VIỆC TRÊN CAO & GIÀN GIÁO: Có dây đai an toàn, lan can bảo vệ, lưới bao che hay đứng trên ghế/thang không chắc chắn không?
6. ÁO PHẢN QUANG & TRANG PHỤC: Có mặc áo phản quang / đồ bảo hộ công trường phù hợp không?
7. HỐ ĐÀO & KẾT CẤU NGUY HIỂM: Tường nứt lớn có nguy cơ sập/rơi mảng vữa, hố móng không rào chắn, vật liệu rơi vãi?
8. ĐIỆN & CHÁY NỔ: Dây điện đi qua nước, tia lửa gần vật liệu dễ cháy?

Với MỖI lỗi vi phạm thực tế phát hiện được (thường có từ 2 đến 5 lỗi nếu công nhân thiếu nhiều bảo hộ hoặc dùng máy cắt không an toàn), hãy tạo 1 phần tử riêng trong mảng "violations" kèm tọa độ "box_2d": [ymin, xmin, ymax, xmax] (thang 0..1000) chỉ đúng vị trí lỗi đó trên ảnh và "reason" nêu rõ LÝ DO NGUY HIỂM!

TRẢ VỀ DUY NHẤT MỘT KHỐI JSON HỢP LỆ (không thêm chữ nào ngoài JSON) theo cấu trúc sau:
{
  "score": 55,
  "riskLevel": "An toàn Tốt | Cảnh báo Trung bình | Nguy hiểm Cao",
  "workersSummary": "VD: 0/1 công nhân đạt chuẩn bảo hộ PPE (thiếu mũ cứng, kính, găng tay, chụp bảo vệ máy cắt)",
  "violations": [
    {
      "id": "V1",
      "title": "Tên ngắn lỗi vi phạm (tối đa 7 từ)",
      "reason": "Lý do nguy hiểm cụ thể (ngắn gọn 10-18 từ để hiện rõ trên nhãn ảnh)",
      "location": "Vị trí cụ thể trong ảnh",
      "severity": "Nghiêm trọng | Cao | Trung bình",
      "box_2d": [200, 150, 520, 420]
    }
  ],
  "diary": {
    "date": "${todayStr}",
    "weather": "Mô tả điều kiện hiện trường/ánh sáng quan sát từ ảnh",
    "manpower": "Mô tả nhân lực và thiết bị quan sát thấy trong ảnh",
    "progress": "Mô tả công tác thi công đang diễn ra trong ảnh",
    "actionRequired": "Liệt kê đầy đủ biện pháp chấn chỉnh cho TẤT CẢ các lỗi vừa phát hiện (dùng gạch đầu dòng -)"
  }
}`;

  try {
    const rawReply = await callGeminiAPI(prompt, AppState.uploadedSiteBase64, AppState.uploadedSiteMime);
    let parsed = null;
    try {
      const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch (_) {
      parsed = null;
    }

    if (parsed && typeof parsed === 'object') {
      const score = typeof parsed.score === 'number' ? parsed.score : '--';
      if (scoreEl) scoreEl.textContent = `${score}/100`;
      if (riskEl) {
        riskEl.textContent = parsed.riskLevel || 'Đã hoàn tất quét AI';
        const isDanger = /nguy hiểm|cao/i.test(parsed.riskLevel || '') || (typeof score === 'number' && score < 70);
        riskEl.className = isDanger
          ? 'text-xs px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30'
          : 'text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30';
      }
      if (workersEl) workersEl.textContent = parsed.workersSummary || 'Đã kiểm tra từ ảnh';

      const violations = Array.isArray(parsed.violations) ? parsed.violations : [];
      // Vẽ các ô màu khoanh vùng nguy hiểm kèm LÝ DO NGUY HIỂM trực tiếp lên ảnh thật
      renderSiteDangerBoxes(violations);

      // Lưu ngữ cảnh phân tích để hỗ trợ hỏi đáp tiếp
      AppState.lastSiteAnalysisSummary = JSON.stringify(parsed);

      // Cập nhật dữ liệu thật lên Dashboard Tổng quan (Mục 1)
      AppState.projectData.siteguard = {
        score: typeof score === 'number' ? score : 0,
        riskLevel: parsed.riskLevel || '',
        violationsCount: violations.length,
        workersSummary: parsed.workersSummary || ''
      };
      updateDashboardOverview();

      if (vList) {
        if (violations.length) {
          vList.innerHTML = violations.map((v, idx) => {
            const id = v.id || `V${idx + 1}`;
            const st = getSeverityColor(v.severity);
            return `
              <div data-vid="${id}"
                   onmouseenter="highlightSiteViolation('${id}')"
                   onclick="highlightSiteViolation('${id}')"
                   class="site-violation-card cursor-pointer p-3 rounded-xl bg-slate-950/90 border border-slate-700/80 hover:border-amber-400/60 space-y-1.5 transition">
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 rounded text-xs font-extrabold text-slate-950 shrink-0" style="background:${st.hex}">${id}</span>
                    <span class="font-semibold text-sm text-slate-100">${v.title || 'Vùng nguy hiểm'}</span>
                  </div>
                  <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${st.badge}">${v.severity || 'Cảnh báo'}</span>
                </div>
                <div class="text-xs text-amber-200 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                  <strong>⚠️ Lý do nguy hiểm:</strong> ${v.reason || 'Cần kiểm tra an toàn tại vị trí này'}
                </div>
                <div class="text-[11px] text-slate-400">📍 Vị trí: ${v.location || 'Khu vực khoanh màu trên ảnh'} <span class="text-sky-400 ml-1">(Bấm để soi trên ảnh)</span></div>
              </div>
            `;
          }).join('');
        } else {
          vList.innerHTML = `<div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">✅ Không phát hiện vi phạm an toàn nghiêm trọng nào trong bức ảnh này!</div>`;
        }
      }

      const d = parsed.diary || {};
      if (diaryBox) {
        diaryBox.innerHTML = `
          <div class="space-y-2 text-sm text-slate-200">
            <div class="flex justify-between border-b border-slate-700 pb-2">
              <span class="font-bold text-amber-400">NHẬT KÝ THI CÔNG &amp; AN TOÀN CÔNG TRƯỜNG</span>
              <span class="text-xs text-slate-400">Ngày: ${d.date || todayStr}</span>
            </div>
            <p class="text-xs sm:text-sm"><strong>🌤️ Điều kiện hiện trường:</strong> ${d.weather || '--'}</p>
            <p class="text-xs sm:text-sm"><strong>👷 Nhân lực &amp; Thiết bị:</strong> ${d.manpower || '--'}</p>
            <p class="text-xs sm:text-sm"><strong>🏗️ Hạng mục thi công:</strong> ${d.progress || '--'}</p>
            <div class="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs sm:text-sm">
              <strong>⚠️ Yêu cầu chấn chỉnh An toàn (HSE):</strong>
              <div class="mt-1">${formatAIResponseHTML(d.actionRequired || 'Duy trì tuân thủ đầy đủ trang bị bảo hộ lao động.')}</div>
            </div>
          </div>
        `;
      }
    } else {
      if (vList) vList.innerHTML = `<div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">Xem báo cáo chi tiết ở khung Nhật ký bên dưới.</div>`;
      if (diaryBox) {
        diaryBox.innerHTML = `
          <div class="space-y-3">
            <div class="text-xs font-bold text-emerald-400 uppercase tracking-wider">✨ Báo cáo An toàn &amp; Nhật ký từ Gemini Vision (${AppState.activeModel})</div>
            ${formatAIResponseHTML(rawReply)}
          </div>
        `;
      }
    }
  } catch (err) {
    resetSiteGuardUI(`❌ Lỗi khi quét ảnh công trường bằng Gemini Vision: ${err.message}`);
  }
}

async function askSiteFollowUp(presetQ = null) {
  const input = document.getElementById('site-followup-input');
  const thread = document.getElementById('site-followup-thread');
  const question = (presetQ || (input ? input.value : '')).trim();
  if (!question || !thread) return;
  if (input) input.value = '';

  thread.classList.remove('hidden');

  if (AppState.aiMode !== 'gemini' || !(AppState.apiKey || '').trim()) {
    thread.innerHTML += `
      <div class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200">
        ⚠️ Vui lòng bật chế độ <strong>✨ Kết nối AI Gemini Thật (API Key)</strong> ở thanh trên cùng để hỏi đáp tiếp với Kỹ sư An toàn AI.
      </div>
    `;
    thread.scrollTop = thread.scrollHeight;
    return;
  }

  const loadingId = `site-qa-${Date.now()}`;
  const safeQ = question.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  thread.innerHTML += `
    <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
      <div class="text-xs font-semibold text-sky-300">👤 Câu hỏi của bạn: ${safeQ}</div>
      <div id="${loadingId}" class="flex items-center gap-2 text-emerald-400 text-xs">
        <span class="animate-spin inline-block w-4 h-4 shrink-0 border-2 border-emerald-400 border-t-transparent rounded-full"></span>
        <span>Kỹ sư An toàn AI (${AppState.activeModel}) đang trả lời...</span>
      </div>
    </div>
  `;
  thread.scrollTop = thread.scrollHeight;

  const contextStr = AppState.lastSiteAnalysisSummary
    ? `Kết quả phân tích an toàn trước đó của bức ảnh: ${AppState.lastSiteAnalysisSummary}`
    : 'Người dùng chưa tải ảnh hoặc đang hỏi chung về an toàn công trường.';

  const prompt = `Bạn là Kỹ sư Giám sát An toàn Lao động (HSE) tại công trường xây dựng Việt Nam.
${contextStr}
Hãy trả lời câu hỏi tiếp theo của người dùng một cách chính xác, thực tế, dễ áp dụng. Dùng dấu gạch đầu dòng (-), không dùng dấu (*), không dùng cú pháp LaTeX $...$, mỗi ý và mỗi câu hoàn chỉnh xuống dòng riêng rõ ràng.
Câu hỏi của người dùng: "${question}"`;

  try {
    const reply = await callGeminiAPI(prompt, AppState.uploadedSiteBase64 || null, AppState.uploadedSiteMime || 'image/jpeg');
    const target = document.getElementById(loadingId);
    if (target) {
      target.className = 'pt-1';
      target.innerHTML = formatAIResponseHTML(reply);
    }
  } catch (err) {
    const target = document.getElementById(loadingId);
    if (target) {
      target.className = 'text-xs text-rose-300';
      target.textContent = `❌ Lỗi trả lời: ${err.message}`;
    }
  }
  thread.scrollTop = thread.scrollHeight;
}

// ============================================================================
// 8. MODULE 5: CRACKDOCTOR (CHẨN ĐOÁN BỆNH HỌC CÔNG TRÌNH TỪ ẢNH THỰC TẾ)
// ============================================================================

// BẢNG ĐƠN GIÁ & ĐỊNH MỨC CHUẨN VẬT TƯ SỬA CHỮA CÔNG TRÌNH (THỐNG NHẤT CHO MỌI MODEL AI)
const STANDARD_REPAIR_CATALOG = {
  sikadur_752: { name: 'Keo Epoxy bơm vết nứt kết cấu (Sikadur-752)', unit: 'kg', unitPrice: 460000 },
  sikadur_731: { name: 'Keo trám bề mặt & định vị kim bơm (Sikadur-731)', unit: 'kg', unitPrice: 240000 },
  packer: { name: 'Kim bơm áp lực một chiều (Packer nhôm)', unit: 'cái', unitPrice: 15000 },
  sikagrout_214: { name: 'Vữa rót không co ngót cường độ cao (SikaGrout 214-11, bao 25 kg)', unit: 'bao', unitPrice: 295000 },
  cfrp_wrap: { name: 'Tấm sợi Carbon gia cường kết cấu (CFRP SikaWrap-231C)', unit: 'm²', unitPrice: 1500000 },
  sika_monotop: { name: 'Vữa sửa chữa bê tông gốc Polymer (Sika MonoTop-615)', unit: 'kg', unitPrice: 70000 },
  sika_latex: { name: 'Phụ gia kết nối & chống thấm (Sika Latex TH)', unit: 'lít', unitPrice: 165000 },
  fiberglass_mesh: { name: 'Lưới sợi thủy tinh chống nứt tường (145 g/m²)', unit: 'm²', unitPrice: 30000 },
  sikaflex: { name: 'Keo trám khe đàn hồi Polyurethane (Sikaflex Construction)', unit: 'tuýp', unitPrice: 180000 },
  sikatop_107: { name: 'Vữa chống thấm 2 thành phần (SikaTop Seal-107)', unit: 'm²', unitPrice: 135000 },
  elastic_paint: { name: 'Sơn phủ đàn hồi che vết nứt chân chim ngoài trời', unit: 'lít', unitPrice: 140000 }
};

// Danh mục vật tư mặc định theo nhóm mức độ hư hỏng nếu AI không trả đủ mã chuẩn
function getFallbackMaterialsByCategory(category) {
  if (category === 'structural_severe') {
    return [
      { code: 'sikadur_752', qty: 2.5 },
      { code: 'sikadur_731', qty: 2 },
      { code: 'packer', qty: 15 },
      { code: 'cfrp_wrap', qty: 2 }
    ];
  }
  if (category === 'structural_moderate') {
    return [
      { code: 'sikadur_752', qty: 1.5 },
      { code: 'sika_monotop', qty: 10 },
      { code: 'sika_latex', qty: 2 }
    ];
  }
  if (category === 'waterproof') {
    return [
      { code: 'sikatop_107', qty: 6 },
      { code: 'sikaflex', qty: 2 },
      { code: 'sika_latex', qty: 2 }
    ];
  }
  return [
    { code: 'fiberglass_mesh', qty: 5 },
    { code: 'sikaflex', qty: 2 },
    { code: 'elastic_paint', qty: 5 }
  ];
}

function renderStandardMaterialsTable(aiMaterials, category = 'non_structural') {
  const matsEl = document.getElementById('crack-materials');
  if (!matsEl) return;

  // Chuẩn hóa danh sách theo Bảng Đơn Giá Chuẩn (STANDARD_REPAIR_CATALOG)
  let validItems = [];
  if (Array.isArray(aiMaterials)) {
    for (const m of aiMaterials) {
      const code = (m.code || '').trim();
      const spec = STANDARD_REPAIR_CATALOG[code];
      const qtyNum = parseFloat(m.qty);
      if (spec && !isNaN(qtyNum) && qtyNum > 0) {
        validItems.push({ code, qty: qtyNum, spec });
      }
    }
  }

  if (!validItems.length) {
    validItems = getFallbackMaterialsByCategory(category).map(x => ({
      code: x.code,
      qty: x.qty,
      spec: STANDARD_REPAIR_CATALOG[x.code]
    }));
  }

  let grandTotal = 0;
  const rowsHtml = validItems.map(({ qty, spec }) => {
    const subtotal = Math.round(qty * spec.unitPrice);
    grandTotal += subtotal;
    return `
      <tr class="border-b border-slate-800">
        <td class="py-2 text-slate-200">
          <div>${spec.name}</div>
          <div class="text-[11px] text-slate-400">Đơn giá chuẩn: ${spec.unitPrice.toLocaleString('vi-VN')} đ/${spec.unit}</div>
        </td>
        <td class="py-2 text-center text-amber-300 font-medium whitespace-nowrap">${qty} ${spec.unit}</td>
        <td class="py-2 text-right text-emerald-400 font-semibold whitespace-nowrap">${subtotal.toLocaleString('vi-VN')} đ</td>
      </tr>
    `;
  }).join('');

  const totalRowHtml = `
    <tr class="bg-slate-950/80">
      <td colspan="2" class="py-2.5 pl-2 font-bold text-amber-400 text-xs uppercase">Tổng chi phí vật tư tạm tính (Theo bảng đơn giá chuẩn)</td>
      <td class="py-2.5 text-right font-extrabold text-emerald-300 text-sm whitespace-nowrap">${grandTotal.toLocaleString('vi-VN')} đ</td>
    </tr>
  `;

  matsEl.innerHTML = rowsHtml + totalRowHtml;
  return grandTotal;
}

function resetCrackDoctorUI(statusMsg = 'Chưa có ảnh khảo sát — Hãy tải ảnh vết nứt / hư hỏng lên để AI phân tích.') {
  const compEl = document.getElementById('crack-component');
  const typeEl = document.getElementById('crack-type');
  const widthEl = document.getElementById('crack-width');
  const sevEl = document.getElementById('crack-severity');
  const causeEl = document.getElementById('crack-cause');
  const stepsEl = document.getElementById('crack-steps');
  const matsEl = document.getElementById('crack-materials');

  if (compEl) compEl.textContent = 'Chờ dữ liệu phân tích...';
  if (typeEl) typeEl.textContent = 'Chờ dữ liệu phân tích...';
  if (widthEl) widthEl.textContent = '--';
  if (sevEl) sevEl.textContent = '--';
  if (causeEl) causeEl.innerHTML = `<span class="text-slate-400 text-xs">${statusMsg}</span>`;
  if (stepsEl) stepsEl.innerHTML = `<li class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400">Phác đồ xử lý sẽ được AI lập riêng theo đúng tình trạng hư hỏng trong bức ảnh bạn tải lên.</li>`;
  if (matsEl) matsEl.innerHTML = `<tr><td colspan="3" class="py-3 text-center text-slate-500 text-xs">Chưa có bảng định mức vật tư</td></tr>`;
}

function handleCrackImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const base64 = e.target.result;
    AppState.uploadedCrackBase64 = base64;
    AppState.uploadedCrackMime = file.type || 'image/jpeg';

    const previewImg = document.getElementById('crack-preview-img');
    const emptyState = document.getElementById('crack-empty-state');
    const reanalyzeBtn = document.getElementById('btn-reanalyze-crack');

    if (previewImg) {
      previewImg.src = base64;
      previewImg.classList.remove('hidden');
    }
    if (emptyState) emptyState.classList.add('hidden');
    if (reanalyzeBtn) reanalyzeBtn.classList.remove('hidden');

    await analyzeUploadedCrackImage();
  };
  reader.readAsDataURL(file);
  // Reset input để có thể chọn lại cùng 1 file nếu muốn
  event.target.value = '';
}

async function analyzeUploadedCrackImage() {
  if (!AppState.uploadedCrackBase64) return;

  const compEl = document.getElementById('crack-component');
  const typeEl = document.getElementById('crack-type');
  const widthEl = document.getElementById('crack-width');
  const sevEl = document.getElementById('crack-severity');
  const causeEl = document.getElementById('crack-cause');
  const stepsEl = document.getElementById('crack-steps');
  const matsEl = document.getElementById('crack-materials');
  const contextNote = (document.getElementById('crack-context-input')?.value || '').trim();

  // Nếu chưa bật Gemini API thật -> báo rõ cho người dùng, KHÔNG dùng mẫu cũ
  if (AppState.aiMode !== 'gemini' || !(AppState.apiKey || '').trim()) {
    resetCrackDoctorUI('⚠️ Bạn đang ở Chế độ Mô phỏng. Hãy bấm "✨ Kết nối AI Gemini Thật (API Key)" ở thanh trên cùng rồi bấm "🔬 Phân tích lại bằng AI" để Gemini Vision chẩn đoán chính xác bức ảnh thực tế của bạn!');
    return;
  }

  // Xóa sạch dữ liệu cũ & hiện trạng thái đang phân tích
  if (compEl) compEl.textContent = '⏳ Đang nhận diện cấu kiện trong ảnh...';
  if (typeEl) typeEl.textContent = '⏳ Đang phân loại vết nứt / hư hỏng...';
  if (widthEl) widthEl.textContent = '⏳ Đang ước tính...';
  if (sevEl) sevEl.textContent = '⏳ Đang đánh giá...';
  if (causeEl) {
    causeEl.innerHTML = `<div class="flex items-center gap-2.5 text-emerald-400 text-sm"><span class="animate-spin inline-block w-4 h-4 shrink-0 border-2 border-emerald-400 border-t-transparent rounded-full"></span><span>Gemini Vision (${AppState.activeModel}) đang chẩn đoán chi tiết bức ảnh thực tế của bạn...</span></div>`;
  }
  if (stepsEl) {
    stepsEl.innerHTML = `<li class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 animate-pulse">Đang lập phác đồ xử lý chuẩn kỹ thuật...</li>`;
  }
  if (matsEl) {
    matsEl.innerHTML = `<tr><td colspan="3" class="py-3 text-center text-slate-400 text-xs animate-pulse">Đang tính toán định mức vật tư sửa chữa...</td></tr>`;
  }

  const catalogListText = Object.entries(STANDARD_REPAIR_CATALOG)
    .map(([code, v]) => `- "${code}": ${v.name} (đơn vị: ${v.unit})`)
    .join('\n');

  const prompt = `Bạn là Tiến sĩ Kỹ thuật Xây dựng, Chuyên gia Kiểm định & Bệnh học Công trình tại Việt Nam.
Hãy quan sát thật kỹ bức ảnh người dùng vừa tải lên${contextNote ? ` (Ghi chú vị trí từ người dùng: "${contextNote}")` : ''}.
Nếu trong ảnh KHÔNG phải công trình/vết nứt/hư hỏng xây dựng, hãy nêu trung thực trong kết quả và để mảng "materials" rỗng [].
Nếu ĐÚNG là ảnh công trình/vết nứt/thấm dột/hư hỏng, hãy phân tích nhất quán, khách quan theo đúng TCVN 5574:2018 và TRẢ VỀ DUY NHẤT MỘT KHỐI JSON HỢP LỆ (không thêm lời giải thích ngoài JSON) theo cấu trúc sau:
{
  "component": "Tên cấu kiện và vị trí quan sát thấy trong ảnh (VD: Cột BTCT / Dầm BTCT / Tường gạch trát vữa / Sàn...)",
  "crackType": "Phân loại cơ học vết nứt hoặc dạng hư hỏng thực tế nhìn thấy trong ảnh",
  "widthEstimate": "Ước tính bề rộng vết nứt & đối chiếu TCVN 5574:2018 (VD: Khoảng 0,4 – 0,6 mm, vượt giới hạn 0,3 mm)",
  "severity": "Chọn 1 trong 3 mức: NGUY HIỂM KẾT CẤU (Cấp độ 3/3) | CẦN THEO DÕI & XỬ LÝ BẢO VỆ (Cấp độ 2/3) | AN TOÀN KẾT CẤU - ẢNH HƯỞNG THẨM MỸ (Cấp độ 1/3)",
  "category": "Chọn đúng 1 mã nhóm: structural_severe | structural_moderate | waterproof | non_structural",
  "cause": "Chẩn đoán chi tiết nguyên nhân gây ra hư hỏng trong ảnh (dùng gạch đầu dòng -, mỗi câu hoàn chỉnh xuống dòng)",
  "solutionSteps": [
    "Bước 1: ...",
    "Bước 2: ...",
    "Bước 3: ..."
  ],
  "materials": [
    { "code": "CHỈ CHỌN MÃ TRONG DANH MỤC CHUẨN BÊN DƯỚI", "qty": 2 }
  ]
}

DANH MỤC MÃ VẬT TƯ CHUẨN (BẮT BUỘC CHỈ CHỌN "code" TỪ DANH SÁCH NÀY VÀ ĐIỀN SỐ LƯỢNG "qty" LÀ CON SỐ):
${catalogListText}`;

  try {
    const rawReply = await callGeminiAPI(prompt, AppState.uploadedCrackBase64, AppState.uploadedCrackMime);

    // Trích xuất khối JSON từ phản hồi của Gemini
    let parsed = null;
    try {
      const jsonMatch = rawReply.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    } catch (_) {
      parsed = null;
    }

    if (parsed && typeof parsed === 'object') {
      if (compEl) compEl.textContent = parsed.component || 'Không xác định rõ cấu kiện';
      if (typeEl) typeEl.textContent = parsed.crackType || 'Đã phân tích từ ảnh thực tế';
      if (widthEl) widthEl.textContent = parsed.widthEstimate || 'Cần đo trực tiếp tại hiện trường';
      if (sevEl) sevEl.textContent = parsed.severity || 'Cần kỹ sư kiểm tra thêm';
      if (causeEl) causeEl.innerHTML = formatAIResponseHTML(parsed.cause || 'Không có mô tả nguyên nhân.');

      if (stepsEl) {
        const steps = Array.isArray(parsed.solutionSteps) && parsed.solutionSteps.length
          ? parsed.solutionSteps
          : ['Liên hệ kỹ sư kiểm định để khảo sát trực tiếp tại hiện trường.'];
        stepsEl.innerHTML = steps.map(s => `
          <li class="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/70 text-sm text-slate-200 leading-relaxed">${formatAIResponseHTML(String(s))}</li>
        `).join('');
      }

      // Lưu ngữ cảnh chẩn đoán để hỗ trợ hỏi đáp tiếp
      AppState.lastCrackAnalysisSummary = JSON.stringify(parsed);

      // Tính tiền & hiển thị theo Bảng Đơn Giá Chuẩn thống nhất giữa mọi Model AI
      const repairTotal = renderStandardMaterialsTable(parsed.materials, parsed.category || 'non_structural') || 0;
      const sevText = String(parsed.severity || '');
      const isSevere = /nguy hiểm|cấp độ 3/i.test(sevText);
      const isModerate = /theo dõi|cấp độ 2/i.test(sevText);
      AppState.projectData.crackdoctor = {
        shortStatus: isSevere ? 'Nguy hiểm Kết cấu' : isModerate ? 'Cần theo dõi & xử lý' : 'An toàn Kết cấu',
        isSevere,
        healthScore: isSevere ? 35 : isModerate ? 70 : 95,
        repairTotalText: `${repairTotal.toLocaleString('vi-VN')} đ`
      };
      updateDashboardOverview();
    } else {
      // Nếu model trả về văn bản thường thay vì JSON -> vẫn hiển thị sạch đẹp bằng formatAIResponseHTML
      if (compEl) compEl.textContent = contextNote || 'Đã phân tích trực tiếp từ ảnh tải lên';
      if (typeEl) typeEl.textContent = `Chẩn đoán bởi ${AppState.activeModel}`;
      if (widthEl) widthEl.textContent = 'Xem chi tiết trong báo cáo';
      if (sevEl) sevEl.textContent = 'Xem đánh giá chi tiết';
      if (causeEl) causeEl.innerHTML = formatAIResponseHTML(rawReply);
      if (stepsEl) stepsEl.innerHTML = `<li class="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300">Chi tiết phác đồ đã được trình bày trong phần chẩn đoán phía trên.</li>`;
      if (matsEl) matsEl.innerHTML = `<tr><td colspan="3" class="py-3 text-center text-slate-400 text-xs">Xem danh mục vật tư trong báo cáo chi tiết phía trên.</td></tr>`;
    }
  } catch (err) {
    resetCrackDoctorUI(`❌ Lỗi khi phân tích ảnh bằng Gemini Vision: ${err.message}`);
  }
}

async function askCrackFollowUp(presetQ = null) {
  const input = document.getElementById('crack-followup-input');
  const thread = document.getElementById('crack-followup-thread');
  const question = (presetQ || (input ? input.value : '')).trim();
  if (!question || !thread) return;
  if (input) input.value = '';

  thread.classList.remove('hidden');

  if (AppState.aiMode !== 'gemini' || !(AppState.apiKey || '').trim()) {
    thread.innerHTML += `
      <div class="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-200">
        ⚠️ Vui lòng bật chế độ <strong>✨ Kết nối AI Gemini Thật (API Key)</strong> ở thanh trên cùng để hỏi đáp tiếp với Bác sĩ Công trình AI.
      </div>
    `;
    thread.scrollTop = thread.scrollHeight;
    return;
  }

  const loadingId = `crack-qa-${Date.now()}`;
  const safeQ = question.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  thread.innerHTML += `
    <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
      <div class="text-xs font-semibold text-amber-300">👤 Câu hỏi của bạn: ${safeQ}</div>
      <div id="${loadingId}" class="flex items-center gap-2 text-emerald-400 text-xs">
        <span class="animate-spin inline-block w-4 h-4 shrink-0 border-2 border-emerald-400 border-t-transparent rounded-full"></span>
        <span>Bác sĩ Công trình AI (${AppState.activeModel}) đang trả lời...</span>
      </div>
    </div>
  `;
  thread.scrollTop = thread.scrollHeight;

  const contextStr = AppState.lastCrackAnalysisSummary
    ? `Kết quả chẩn đoán bệnh học công trình trước đó của bức ảnh: ${AppState.lastCrackAnalysisSummary}`
    : 'Người dùng chưa tải ảnh hoặc đang hỏi chung về bệnh học kết cấu công trình.';

  const prompt = `Bạn là Tiến sĩ Kỹ thuật Xây dựng, Bác sĩ Công trình chuyên kiểm định và sửa chữa kết cấu tại Việt Nam.
${contextStr}
Hãy trả lời câu hỏi tiếp theo của người dùng thật rõ ràng, bám sát TCVN 5574:2018 và tình trạng thực tế trong ảnh. Dùng dấu gạch đầu dòng (-), không dùng dấu (*), không dùng cú pháp LaTeX $...$, mỗi ý và mỗi câu hoàn chỉnh xuống dòng riêng rõ ràng.
Câu hỏi của người dùng: "${question}"`;

  try {
    const reply = await callGeminiAPI(prompt, AppState.uploadedCrackBase64 || null, AppState.uploadedCrackMime || 'image/jpeg');
    const target = document.getElementById(loadingId);
    if (target) {
      target.className = 'pt-1';
      target.innerHTML = formatAIResponseHTML(reply);
    }
  } catch (err) {
    const target = document.getElementById(loadingId);
    if (target) {
      target.className = 'text-xs text-rose-300';
      target.textContent = `❌ Lỗi trả lời: ${err.message}`;
    }
  }
  thread.scrollTop = thread.scrollHeight;
}

// ============================================================================
// 9. XUẤT FILE PDF THẬT (.PDF) THEO CÁC TRANG / MỤC NGƯỜI DÙNG CHỌN (HTML2PDF)
// ============================================================================

function openPdfExportModal() {
  closeMobileSidebar();
  const modal = document.getElementById('pdf-export-modal');
  const statusEl = document.getElementById('pdf-export-status');
  if (statusEl) statusEl.classList.add('hidden');
  if (modal) modal.classList.remove('hidden');
}

function closePdfExportModal() {
  const modal = document.getElementById('pdf-export-modal');
  if (modal) modal.classList.add('hidden');
}

function toggleAllPdfSections(checked) {
  document.querySelectorAll('.pdf-section-chk').forEach(chk => {
    chk.checked = checked;
  });
}

async function generateAndDownloadPDF() {
  const selected = Array.from(document.querySelectorAll('.pdf-section-chk:checked')).map(el => el.value);
  const statusEl = document.getElementById('pdf-export-status');
  const btn = document.getElementById('btn-download-pdf-now');
  const projectName = (document.getElementById('pdf-project-name')?.value || 'Ho-so-Ky-thuat-DTU-Xay-Dung-AI').trim();

  if (!selected.length) {
    if (statusEl) {
      statusEl.textContent = '⚠️ Vui lòng chọn ít nhất 1 mục để xuất ra file PDF!';
      statusEl.className = 'text-xs font-semibold p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300';
    }
    return;
  }

  if (typeof html2pdf === 'undefined') {
    if (statusEl) {
      statusEl.textContent = '❌ Thư viện tạo PDF đang tải, vui lòng thử lại sau 2 giây.';
      statusEl.className = 'text-xs font-semibold p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300';
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Đang tạo file PDF...';
  }
  if (statusEl) {
    statusEl.textContent = '⏳ Đang đóng gói Hồ sơ Kỹ thuật khổ A4 định dạng .pdf, vui lòng chờ vài giây...';
    statusEl.className = 'text-xs font-semibold p-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-300';
  }

  const today = new Date().toLocaleDateString('vi-VN');
  const escapePdf = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const stripDarkHtml = (elId) => {
    const el = document.getElementById(elId);
    if (!el) return '<p style="color:#64748b;">Chưa có dữ liệu.</p>';
    return el.innerText.replace(/\n+/g, '<br>');
  };

  let sectionsHtml = '';

  // 1. DỰ TOÁN & VẬT LIỆU XANH
  if (selected.includes('estimator')) {
    const area = document.getElementById('est-area')?.value || '--';
    const floors = document.getElementById('est-floors')?.value || '--';
    const found = document.getElementById('est-foundation')?.selectedOptions?.[0]?.text || '--';
    const roof = document.getElementById('est-roof')?.selectedOptions?.[0]?.text || '--';
    const totalCost = document.getElementById('out-total-cost')?.textContent || '--';
    const builtArea = document.getElementById('out-built-area')?.textContent || '--';
    const rawCost = document.getElementById('out-raw-cost')?.textContent || '--';
    const finishCost = document.getElementById('out-finish-cost')?.textContent || '--';
    const concrete = document.getElementById('mat-concrete')?.textContent || '--';
    const steel = document.getElementById('mat-steel')?.textContent || '--';
    const cement = document.getElementById('mat-cement')?.textContent || '--';
    const brick = document.getElementById('mat-brick')?.textContent || '--';
    const co2 = document.getElementById('eco-co2')?.textContent || '--';
    const elec = document.getElementById('eco-elec')?.textContent || '--';
    const aiAdvice = stripDarkHtml('est-ai-response');

    sectionsHtml += `
      <div style="margin-bottom:16px;">
        <h2 style="font-size:13px; font-weight:800; color:#65121b; border-bottom:2px solid #65121b; padding-bottom:4px; margin:0 0 8px 0; text-transform:uppercase; page-break-after:avoid;">
          1. DỰ TOÁN CHI PHÍ &amp; TỐI ƯU VẬT LIỆU XANH
        </h2>
        <p style="font-size:11px; margin:0 0 8px 0; line-height:1.45;">
          <strong>Thông số đầu vào:</strong> Diện tích ${escapePdf(area)} m²/sàn • Quy mô ${escapePdf(floors)} tầng • ${escapePdf(found)} • ${escapePdf(roof)}
        </p>
        <table style="width:100%; border-collapse:collapse; font-size:11px; margin-bottom:10px; table-layout:fixed; page-break-inside:avoid;">
          <tr style="background:#f8fafc;">
            <td style="border:1px solid #cbd5e1; padding:6px; width:24%;"><strong>Tổng diện tích quy đổi</strong></td>
            <td style="border:1px solid #cbd5e1; padding:6px; width:26%;">${escapePdf(builtArea)}</td>
            <td style="border:1px solid #cbd5e1; padding:6px; width:24%;"><strong>Tổng kinh phí dự toán</strong></td>
            <td style="border:1px solid #cbd5e1; padding:6px; width:26%; color:#b45309; font-weight:800;">${escapePdf(totalCost)}</td>
          </tr>
          <tr>
            <td style="border:1px solid #cbd5e1; padding:6px;">Phần thô &amp; Nhân công</td>
            <td style="border:1px solid #cbd5e1; padding:6px;">${escapePdf(rawCost)}</td>
            <td style="border:1px solid #cbd5e1; padding:6px;">Hoàn thiện &amp; Điện nước</td>
            <td style="border:1px solid #cbd5e1; padding:6px;">${escapePdf(finishCost)}</td>
          </tr>
          <tr style="background:#f8fafc;">
            <td style="border:1px solid #cbd5e1; padding:6px;">Bê tông thương phẩm</td>
            <td style="border:1px solid #cbd5e1; padding:6px;">${escapePdf(concrete)}</td>
            <td style="border:1px solid #cbd5e1; padding:6px;">Cốt thép chịu lực</td>
            <td style="border:1px solid #cbd5e1; padding:6px;">${escapePdf(steel)}</td>
          </tr>
          <tr>
            <td style="border:1px solid #cbd5e1; padding:6px;">Xi măng xây trát</td>
            <td style="border:1px solid #cbd5e1; padding:6px;">${escapePdf(cement)}</td>
            <td style="border:1px solid #cbd5e1; padding:6px;">Khối xây tường</td>
            <td style="border:1px solid #cbd5e1; padding:6px;">${escapePdf(brick)}</td>
          </tr>
          <tr style="background:#ecfdf5;">
            <td style="border:1px solid #cbd5e1; padding:6px;"><strong>Giảm phát thải Carbon</strong></td>
            <td style="border:1px solid #cbd5e1; padding:6px; color:#047857; font-weight:700;">${escapePdf(co2)}</td>
            <td style="border:1px solid #cbd5e1; padding:6px;"><strong>Điện làm mát tiết kiệm</strong></td>
            <td style="border:1px solid #cbd5e1; padding:6px; color:#0369a1; font-weight:700;">${escapePdf(elec)}</td>
          </tr>
        </table>
        <div style="background:#f8fafc; border-left:3px solid #d97706; padding:8px 10px; font-size:11px; line-height:1.55; word-wrap:break-word;">
          <strong>Phân tích &amp; Khuyến nghị từ AI:</strong><br>${aiAdvice}
        </div>
      </div>
    `;
  }

  // 2. KIỂM TRA KẾT CẤU & TRA CỨU TCVN
  if (selected.includes('tcvn')) {
    const checkHtml = stripDarkHtml('tcvn-check-result');
    const qaHtml = stripDarkHtml('tcvn-chat-output');
    sectionsHtml += `
      <div style="margin-bottom:16px;">
        <h2 style="font-size:13px; font-weight:800; color:#65121b; border-bottom:2px solid #65121b; padding-bottom:4px; margin:0 0 8px 0; text-transform:uppercase; page-break-after:avoid;">
          2. KIỂM TRA KẾT CẤU &amp; TRA CỨU TIÊU CHUẨN XÂY DỰNG (TCVN)
        </h2>
        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px 10px; font-size:11px; line-height:1.55; margin-bottom:8px; word-wrap:break-word;">
          <strong>Kết quả kiểm tra nhanh tiết diện (TCVN 5574:2018):</strong><br>${checkHtml}
        </div>
        <div style="background:#fffbeb; border:1px solid #fcd34d; padding:8px 10px; font-size:11px; line-height:1.55; word-wrap:break-word;">
          <strong>Nội dung tra cứu tiêu chuẩn gần nhất:</strong><br>${qaHtml}
        </div>
      </div>
    `;
  }

  // 3. GIÁM SÁT AN TOÀN & NHẬT KÝ CÔNG TRƯỜNG
  if (selected.includes('siteguard')) {
    const score = document.getElementById('site-score')?.textContent || '--';
    const risk = document.getElementById('site-risk-badge')?.textContent || '--';
    const workers = document.getElementById('site-workers')?.textContent || '--';
    const vText = stripDarkHtml('site-violations-list');
    const diaryText = stripDarkHtml('site-diary-box');
    const imgHtml = AppState.uploadedSiteBase64
      ? `<div style="text-align:center; margin:8px 0; page-break-inside:avoid;"><img src="${AppState.uploadedSiteBase64}" style="max-width:100%; max-height:210px; border:1px solid #cbd5e1; border-radius:6px;" /></div>`
      : '';

    sectionsHtml += `
      <div style="margin-bottom:16px;">
        <h2 style="font-size:13px; font-weight:800; color:#65121b; border-bottom:2px solid #65121b; padding-bottom:4px; margin:0 0 8px 0; text-transform:uppercase; page-break-after:avoid;">
          3. GIÁM SÁT AN TOÀN LAO ĐỘNG &amp; NHẬT KÝ CÔNG TRƯỜNG
        </h2>
        <p style="font-size:11px; margin:0 0 6px 0; line-height:1.45;">
          <strong>Điểm An toàn:</strong> ${escapePdf(score)} • <strong>Mức độ rủi ro:</strong> ${escapePdf(risk)} • <strong>Bảo hộ PPE:</strong> ${escapePdf(workers)}
        </p>
        ${imgHtml}
        <div style="background:#fef2f2; border:1px solid #fecaca; padding:8px 10px; font-size:11px; line-height:1.55; margin-bottom:8px; word-wrap:break-word;">
          <strong>Các vùng nguy hiểm &amp; vi phạm phát hiện:</strong><br>${vText}
        </div>
        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px 10px; font-size:11px; line-height:1.55; word-wrap:break-word;">
          ${diaryText}
        </div>
      </div>
    `;
  }

  // 4. BÁC SĨ CÔNG TRÌNH
  if (selected.includes('crackdoctor')) {
    const comp = document.getElementById('crack-component')?.textContent || '--';
    const type = document.getElementById('crack-type')?.textContent || '--';
    const width = document.getElementById('crack-width')?.textContent || '--';
    const sev = document.getElementById('crack-severity')?.textContent || '--';
    const cause = stripDarkHtml('crack-cause');
    const steps = stripDarkHtml('crack-steps');
    const matsBody = document.getElementById('crack-materials')?.innerHTML || '';
    const imgHtml = AppState.uploadedCrackBase64
      ? `<div style="text-align:center; margin:8px 0; page-break-inside:avoid;"><img src="${AppState.uploadedCrackBase64}" style="max-width:100%; max-height:210px; border:1px solid #cbd5e1; border-radius:6px;" /></div>`
      : '';

    sectionsHtml += `
      <div style="margin-bottom:16px;">
        <h2 style="font-size:13px; font-weight:800; color:#65121b; border-bottom:2px solid #65121b; padding-bottom:4px; margin:0 0 8px 0; text-transform:uppercase; page-break-after:avoid;">
          4. BÁC SĨ CÔNG TRÌNH – CHẨN ĐOÁN VẾT NỨT &amp; ĐỊNH MỨC SỬA CHỮA
        </h2>
        ${imgHtml}
        <p style="font-size:11px; margin:0 0 6px 0; line-height:1.5;">
          <strong>Cấu kiện:</strong> ${escapePdf(comp)}<br>
          <strong>Phân loại vết nứt:</strong> ${escapePdf(type)}<br>
          <strong>Bề rộng ước tính:</strong> ${escapePdf(width)} • <strong>Mức độ an toàn:</strong> <span style="color:#be123c; font-weight:700;">${escapePdf(sev)}</span>
        </p>
        <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:8px 10px; font-size:11px; line-height:1.55; margin-bottom:8px; word-wrap:break-word;">
          <strong>Chẩn đoán nguyên nhân:</strong><br>${cause}<br><br>
          <strong>Phác đồ xử lý &amp; gia cường:</strong><br>${steps}
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:11px; color:#0f172a; page-break-inside:avoid;">
          <thead>
            <tr style="background:#f1f5f9;">
              <th style="border:1px solid #cbd5e1; padding:6px; text-align:left;">Hạng mục vật tư / Hóa chất</th>
              <th style="border:1px solid #cbd5e1; padding:6px; text-align:center;">Khối lượng</th>
              <th style="border:1px solid #cbd5e1; padding:6px; text-align:right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>${matsBody.replace(/text-slate-\d+|text-amber-\d+|text-emerald-\d+|bg-slate-\d+\/\d+|border-slate-\d+/g, '')}</tbody>
        </table>
      </div>
    `;
  }

  // 5. TỔNG QUAN DỰ ÁN
  if (selected.includes('dashboard')) {
    const kCost = document.getElementById('dash-kpi-cost')?.textContent || 'Chưa có dữ liệu';
    const kSafe = document.getElementById('dash-kpi-safety')?.textContent || 'Chưa có dữ liệu';
    const kCarb = document.getElementById('dash-kpi-carbon')?.textContent || 'Chưa có dữ liệu';
    const kStru = document.getElementById('dash-kpi-struct')?.textContent || 'Chưa có dữ liệu';

    sectionsHtml += `
      <div style="margin-bottom:14px; page-break-inside:avoid;">
        <h2 style="font-size:13px; font-weight:800; color:#65121b; border-bottom:2px solid #65121b; padding-bottom:4px; margin:0 0 8px 0; text-transform:uppercase;">
          5. TỔNG HỢP CHỈ SỐ TOÀN DỰ ÁN
        </h2>
        <table style="width:100%; border-collapse:collapse; font-size:11px; table-layout:fixed;">
          <tr style="background:#f8fafc;">
            <th style="border:1px solid #cbd5e1; padding:6px;">Tổng mức đầu tư</th>
            <th style="border:1px solid #cbd5e1; padding:6px;">Điểm An toàn</th>
            <th style="border:1px solid #cbd5e1; padding:6px;">Giảm phát thải CO₂</th>
            <th style="border:1px solid #cbd5e1; padding:6px;">Kết cấu &amp; TCVN</th>
          </tr>
          <tr>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:center; font-weight:700;">${escapePdf(kCost)}</td>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:center; font-weight:700;">${escapePdf(kSafe)}</td>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:center; font-weight:700;">${escapePdf(kCarb)}</td>
            <td style="border:1px solid #cbd5e1; padding:8px; text-align:center; font-weight:700;">${escapePdf(kStru)}</td>
          </tr>
        </table>
      </div>
    `;
  }

  // Tạo vùng dựng PDF chuẩn bề rộng 700px (= 190mm khổ A4 trừ lề 10mm mỗi bên), KHÔNG bị dính scrollY/lệch phải!
  const pdfWrapper = document.createElement('div');
  pdfWrapper.style.cssText = 'width:700px; box-sizing:border-box; background:#ffffff; color:#0f172a; padding:0; margin:0; font-family:Inter, Arial, sans-serif;';
  pdfWrapper.innerHTML = `
    <div style="background:linear-gradient(90deg, #65121b 0%, #3a0a10 100%); color:#ffffff; padding:14px 18px; border-radius:8px; margin-bottom:14px;">
      <div style="font-size:10px; font-weight:800; letter-spacing:1.2px; color:#e2b877; text-transform:uppercase;">ĐẠI HỌC DUY TÂN • KHOA XÂY DỰNG</div>
      <div style="font-size:16px; font-weight:900; margin-top:4px; text-transform:uppercase; line-height:1.3;">${escapePdf(projectName)}</div>
      <div style="font-size:10px; color:#fecdd3; margin-top:4px;">Ngày xuất hồ sơ: ${today} • Hệ thống Kiến Tạo Xây Dựng Số AI &amp; Quản Lý Công Trình Toàn Diện</div>
    </div>
    ${sectionsHtml}
    <div style="margin-top:16px; border-top:1px solid #cbd5e1; padding-top:8px; text-align:center; font-size:10px; color:#475569;">
      © 2026 Kiến Tạo Xây Dựng Số AI • Khoa Xây Dựng • Đại Học Duy Tân (DTU)
    </div>
  `;

  // Chuẩn hóa tên file .pdf an toàn không dấu
  const safeFileName = projectName
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'Ho-so-Ky-thuat-DTU-AI';

  try {
    await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `${safeFileName}.pdf`,
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0,
          windowWidth: 700
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      })
      .from(pdfWrapper)
      .save();

    if (statusEl) {
      statusEl.textContent = `✅ Đã xuất và tải xuống thành công file "${safeFileName}.pdf"!`;
      statusEl.className = 'text-xs font-bold p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300';
    }
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = `❌ Lỗi khi xuất PDF: ${err.message}`;
      statusEl.className = 'text-xs font-semibold p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300';
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '⬇️ Tải xuống File PDF (.pdf)';
    }
  }
}

// ============================================================================
// INITIALIZE ON DOM READY
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
  const keyInput = document.getElementById('gemini-api-key-input');
  if (keyInput && AppState.apiKey) keyInput.value = AppState.apiKey;
  toggleAIMode(AppState.aiMode);
  if (AppState.aiMode === 'gemini' && AppState.apiKey) {
    setLinkedUIState(true);
    connectAndVerifyGeminiKey(AppState.apiKey);
  }

  updateDashboardOverview();
  calculateEstimation(false);
  checkStructureTCVN(false);
  resetSiteGuardUI();
  resetCrackDoctorUI();
  askTCVNCopilot('Chiều dày lớp bê tông bảo vệ cốt thép theo TCVN 5574:2018 là bao nhiêu?');
});
