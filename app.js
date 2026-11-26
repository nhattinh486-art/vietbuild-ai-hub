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
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash'
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

  // Ưu tiên các model thế hệ mới (Gemini 3.5 / 3.x / 4.x) vì Google đã ngừng cấp Gemini 2.0/2.5 cho API Key mới (404)
  const scoreModel = (name) => {
    let score = 0;
    if (/flash/i.test(name)) score += 120;
    if (/flash-lite/i.test(name)) score += 20;
    if (/pro/i.test(name)) score += 45;
    if (/preview|exp/i.test(name)) score -= 15;
    const verMatch = name.match(/gemini-(\d+(?:\.\d+)?)/i);
    if (verMatch) {
      const ver = parseFloat(verMatch[1]);
      score += ver >= 3 ? (200 + ver * 25) : (ver * 10 - 150);
    } else if (/gemini-flash-latest/i.test(name)) {
      score += 180;
    }
    return score;
  };

  return [...new Set(rawModels)].sort((a, b) => scoreModel(b) - scoreModel(a));
}

function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

function parseGeminiJsonSafe(rawReply) {
  if (!rawReply || typeof rawReply !== 'string') return null;
  // Gỡ khung markdown ```json ... ``` nếu có
  const cleaned = rawReply
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  const tryParse = (str) => {
    try {
      return JSON.parse(str);
    } catch (_) {
      try {
        // Sửa lỗi dấu phẩy thừa cuối mảng/object (, } hoặc , ])
        const noTrailingComma = str.replace(/,\s*([}\]])/g, '$1');
        return JSON.parse(noTrailingComma);
      } catch (__) {
        return null;
      }
    }
  };

  let parsed = tryParse(cleaned);
  if (parsed && typeof parsed === 'object') return parsed;

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    parsed = tryParse(cleaned.slice(firstBrace, lastBrace + 1));
    if (parsed && typeof parsed === 'object') return parsed;
  }

  // Cứu hộ nếu JSON lỡ bị cắt giữa chừng: đóng nốt ngoặc còn thiếu
  if (firstBrace !== -1) {
    let slice = cleaned.slice(firstBrace);
    // Cắt bỏ phần key/value dở dang sau dấu phẩy cuối cùng
    const lastComma = slice.lastIndexOf(',');
    if (lastComma > 0) {
      const candidate = slice.slice(0, lastComma);
      const stack = [];
      let inStr = false;
      let esc = false;
      for (let i = 0; i < candidate.length; i++) {
        const ch = candidate[i];
        if (esc) { esc = false; continue; }
        if (ch === '\\') { esc = true; continue; }
        if (ch === '"') { inStr = !inStr; continue; }
        if (inStr) continue;
        if (ch === '{') stack.push('}');
        else if (ch === '[') stack.push(']');
        else if (ch === '}' || ch === ']') stack.pop();
      }
      if (!inStr) {
        const repaired = candidate + stack.reverse().join('');
        parsed = tryParse(repaired);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    }
  }
  return null;
}

async function callGeminiAPI(prompt, base64Image = null, mimeType = 'image/jpeg', expectJson = false) {
  const cleanKey = (AppState.apiKey || '').replace(/\s+/g, '');
  if (AppState.aiMode !== 'gemini' || !cleanKey) {
    throw new Error('DEMO_MODE');
  }

  const parts = [{ text: prompt }];
  if (Array.isArray(base64Image)) {
    base64Image.forEach(img => {
      if (!img || !img.base64) return;
      const cleanB64 = img.base64.includes(',') ? img.base64.split(',')[1] : img.base64;
      parts.push({
        inline_data: {
          mime_type: img.mimeType || 'image/jpeg',
          data: cleanB64
        }
      });
    });
  } else if (base64Image) {
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    parts.push({
      inline_data: {
        mime_type: mimeType || 'image/jpeg',
        data: cleanBase64
      }
    });
  }

  if (!AppState.deadModels) AppState.deadModels = new Set();

  let modelsToTry = AppState.discoveredModels && AppState.discoveredModels.length
    ? [AppState.activeModel, ...AppState.discoveredModels.filter(m => m !== AppState.activeModel), ...FALLBACK_GEMINI_MODELS]
    : null;

  if (!modelsToTry) {
    const discovered = await discoverAvailableModels(cleanKey);
    AppState.discoveredModels = discovered;
    populateModelSelect(discovered, discovered[0]);
    modelsToTry = [...discovered, ...FALLBACK_GEMINI_MODELS];
  }

  // Loại trùng & bỏ qua các model đã xác nhận 404 (ngừng hỗ trợ)
  modelsToTry = [...new Set(modelsToTry)].filter(m => m && !AppState.deadModels.has(m));
  if (!modelsToTry.length) {
    AppState.deadModels.clear();
    modelsToTry = [...FALLBACK_GEMINI_MODELS];
  }

  const chosenModel = AppState.activeModel;
  let chosenModelRetired = false;
  let lastError = null;
  let fallbackNotice = null;

  for (let i = 0; i < Math.min(modelsToTry.length, 10); i++) {
    const model = modelsToTry[i];
    if (!model || AppState.deadModels.has(model)) continue;
    const isUserChosen = (i === 0 && model === chosenModel);
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    try {
      const genConfig = {
        temperature: 0.05,
        maxOutputTokens: 8192
      };
      if (expectJson) {
        genConfig.responseMimeType = 'application/json';
      }

      // Cho model người dùng chủ động chọn thời gian chờ rộng hơn (35s) để xử lý ảnh + suy luận đầy đủ không bị cắt JSON
      let response = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: genConfig
        })
      }, isUserChosen ? 35000 : 18000);

      // Nếu model cũ không hỗ trợ responseMimeType -> thử lại không có responseMimeType
      if (!response.ok && response.status === 400 && expectJson) {
        delete genConfig.responseMimeType;
        response = await fetchWithTimeout(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: genConfig
          })
        }, isUserChosen ? 35000 : 18000);
      }

      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try {
          const errJson = await response.json();
          msg = errJson?.error?.message || msg;
        } catch (_) {}
        if ([404, 429, 500, 503, 504].includes(response.status)) {
          lastError = new Error(`Model ${model} (${response.status}): ${msg}`);
          if (response.status === 404) {
            AppState.deadModels.add(model);
            if (isUserChosen) chosenModelRetired = true;
            // Nếu Google gợi ý model thay thế ngay trong thông báo lỗi (VD: "use models/gemini-3.5-flash-lite") -> ưu tiên thử ngay lập tức!
            const sugMatch = msg.match(/use\s+models\/([a-z0-9._-]+)/i);
            if (sugMatch && sugMatch[1] && !AppState.deadModels.has(sugMatch[1])) {
              const suggested = sugMatch[1];
              if (!modelsToTry.includes(suggested)) {
                modelsToTry.splice(i + 1, 0, suggested);
              } else {
                const idx = modelsToTry.indexOf(suggested);
                if (idx > i + 1) {
                  modelsToTry.splice(idx, 1);
                  modelsToTry.splice(i + 1, 0, suggested);
                }
              }
            }
          }
          if (isUserChosen) {
            fallbackNotice = `Model ${chosenModel} không khả dụng (${response.status}), đã tự động chuyển sang ${modelsToTry[i + 1] || 'model mới hơn'}`;
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
      // Tự động cập nhật activeModel nếu chưa chọn hoặc model cũ đã bị Google khai tử (404)
      if (!chosenModel || chosenModelRetired) {
        AppState.activeModel = model;
        localStorage.setItem('VIETBUILD_GEMINI_MODEL', model);
        const sel = document.getElementById('gemini-model-select');
        if (sel) {
          if (!Array.from(sel.options).some(o => o.value === model)) {
            const opt = document.createElement('option');
            opt.value = model;
            opt.textContent = model;
            sel.prepend(opt);
          }
          sel.value = model;
        }
      }
      const respParts = data?.candidates?.[0]?.content?.parts || [];
      const answerText = respParts
        .filter(p => p && !p.thought && typeof p.text === 'string')
        .map(p => p.text)
        .join('\n')
        .trim() || respParts.map(p => p?.text || '').join('\n').trim();
      return answerText || 'Không nhận được phản hồi từ AI.';
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

  const ap = (typeof getAdminOverrides === 'function' ? getAdminOverrides().prices : null) || {};
  const pConcrete = ap.concrete || 1450000;
  const pSteel = ap.steel || 18200000;
  const pAac = ap.aac || 285000;
  const pBrick = ap.brick || 235000;
  const pLabor = ap.labor || 480000;
  const pMachine = ap.machine || 2150000;

  const boqItems = [
    { code: 'AB.11', name: `Vật liệu & Công tác Đất móng, Bê tông lót đá 4×6 M100 (${volLeanConcrete} m³)`, unit: 'm³', qty: volExcavation, unitPrice: Math.round(240000 * regionCoeff) },
    { code: 'AF.11', name: `Bê tông thương phẩm Móng, Cột, Dầm, Sàn cấp bền ${concreteGrade} (Móng ${volFoundConcrete} m³ + Thân ${volBodyConcrete} m³)`, unit: 'm³', qty: totalConcreteM3, unitPrice: Math.round(pConcrete * regionCoeff * gradeCoeff) },
    { code: 'AF.61', name: 'Vật tư Cốp pha ván khuôn phủ phim & hệ giáo chống thi công kết cấu BTCT', unit: 'm²', qty: areaFormwork, unitPrice: Math.round(195000 * regionCoeff) },
    { code: 'AF.81', name: `Vật tư Cốt thép toàn khối (Thép chủ ${mainSteelTon}T + Đai/sàn ${stirrupSteelTon}T, gồm 3% hao hụt)`, unit: 'Tấn', qty: totalSteelTon, unitPrice: Math.round(pSteel * regionCoeff) },
    { code: 'AE.22', name: ecoMode ? `Vật tư Xây tường gạch nhẹ chưng áp AAC (${bricksCount.toLocaleString('vi-VN')} viên) + Keo xây` : `Vật tư Xây tường gạch ống Tuynel (${bricksCount.toLocaleString('vi-VN')} viên) + Vữa M75`, unit: 'm²', qty: areaWallM2, unitPrice: Math.round((ecoMode ? pAac : pBrick) * regionCoeff) },
    { code: 'AK.21', name: `Vật tư Trát tường trong/ngoài & láng nền (Xi măng ${cementTon}T, Cát ${sandM3} m³, Đá ${stoneM3} m³)`, unit: 'm²', qty: areaPlasterM2, unitPrice: Math.round(105000 * regionCoeff) },
    { code: 'AK.51', name: 'Vật tư Ốp lát gạch Ceramic / Granite nền nhà, cầu thang & khu vệ sinh', unit: 'm²', qty: areaTilingM2, unitPrice: Math.round(420000 * regionCoeff * finishMult) },
    { code: 'AK.74', name: 'Vật tư Chống thấm sàn mái, ban công & sàn khu vệ sinh (Sika 2 thành phần)', unit: 'm²', qty: areaWaterproofM2, unitPrice: Math.round(185000 * regionCoeff) },
    { code: 'AK.82', name: ecoMode ? 'Vật tư Bả matit, sơn lót kháng kiềm & sơn phủ sinh thái ít VOC (2 lớp)' : 'Vật tư Bả matit & sơn nước nội/ngoại thất hoàn thiện (2 lớp)', unit: 'm²', qty: areaPaintM2, unitPrice: Math.round((ecoMode ? 92000 : 75000) * regionCoeff * finishMult) },
    { code: 'MEP-01', name: ecoMode ? 'Thiết bị Điện, Cấp thoát nước, Cửa nhôm kính Low-E cản nhiệt' : 'Thiết bị Điện, Cấp thoát nước & Cửa nhôm kính hoàn thiện', unit: 'm² sàn', qty: totalBuiltArea, unitPrice: Math.round((ecoMode ? 1280000 : 1050000) * regionCoeff * finishMult * typeCoeff) },
    { code: 'NC-01', name: `Chi phí Nhân công thi công trực tiếp (Thợ chính bậc 3,5/7 & phụ hồ toàn công trình)`, unit: 'Công', qty: totalManDays, unitPrice: Math.round(pLabor * regionCoeff) },
    { code: 'MTC-01', name: 'Chi phí Máy móc & Thiết bị thi công (Xe bơm cần bê tông, máy xúc, đầm dùi, cắt/uốn thép, tời/vận thăng)', unit: 'Ca máy', qty: totalMachineShifts, unitPrice: Math.round(pMachine * regionCoeff) }
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
      <div class="p-3.5 rounded-xl border ${beamOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}">
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold text-sm ${beamOk ? 'text-emerald-300' : 'text-rose-300'}">1. Chiều cao tiết diện dầm chính (h = ${beamH} mm)</span>
          <span class="px-2 py-0.5 text-xs font-bold rounded shrink-0 ${beamOk ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}">${beamOk ? 'ĐẠT' : 'CHƯA ĐẠT'}</span>
        </div>
        <p class="text-xs text-slate-300 mt-1 leading-relaxed">Theo điều kiện hạn chế độ võng TCVN 5574:2018 (h = 1/12 ÷ 1/8 nhịp L), với nhịp L = ${spanM} m, chiều cao dầm hợp lý từ <strong>${minBeamH} mm – ${maxBeamH} mm</strong>.</p>
        ${!beamOk ? `
          <div class="mt-2 p-2.5 rounded-lg fix-guide-box text-xs leading-relaxed">
            <strong>Vì sao chưa đạt &amp; Cách giải quyết:</strong> Dầm chọn (h = ${beamH} mm) quá mảnh so với nhịp ${spanM} m, dễ gây võng lớn vượt giới hạn và nứt vùng kéo.<br>
            <strong>→ Hướng xử lý:</strong> Tăng chiều cao dầm lên tối thiểu <strong>h ≥ ${Math.ceil(minBeamH / 50) * 50} mm</strong>; nếu bị khống chế chiều cao thông thủy, hãy giảm nhịp dầm (thêm cột/vách) hoặc chuyển sang dầm bẹt rộng kết hợp kiểm tra độ võng.
          </div>
        ` : ''}
      </div>

      <div class="p-3.5 rounded-xl border ${coverOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}">
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold text-sm ${coverOk ? 'text-emerald-300' : 'text-rose-300'}">2. Lớp bê tông bảo vệ cốt thép chịu lực (c<sub>0</sub> = ${coverMm} mm)</span>
          <span class="px-2 py-0.5 text-xs font-bold rounded shrink-0 ${coverOk ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}">${coverOk ? 'ĐẠT TCVN 5574' : 'VI PHẠM TCVN'}</span>
        </div>
        <p class="text-xs text-slate-300 mt-1 leading-relaxed">Theo <strong>Mục 10.3.2 – Bảng 19 (TCVN 5574:2018)</strong>, cấu kiện trong điều kiện môi trường đã chọn yêu cầu chiều dày lớp bê tông bảo vệ tối thiểu <strong>c<sub>0,min</sub> = ${minCover} mm</strong>.</p>
        ${!coverOk ? `
          <div class="mt-2 p-2.5 rounded-lg fix-guide-box text-xs leading-relaxed">
            <strong>Vì sao vi phạm &amp; Cách giải quyết:</strong> Lớp bảo vệ c<sub>0</sub> = ${coverMm} mm quá mỏng sẽ không ngăn được hơi ẩm/ion xâm thực làm gỉ cốt thép, giảm khả năng chống cháy và bám dính bê tông.<br>
            <strong>→ Hướng xử lý:</strong> Tăng chiều dày lớp bảo vệ lên tối thiểu <strong>c<sub>0</sub> ≥ ${minCover} mm</strong> và bố trí con kê bê tông mác cao đúng quy cách khi thi công.
          </div>
        ` : ''}
      </div>

      <div class="p-3.5 rounded-xl border ${slabOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}">
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold text-sm ${slabOk ? 'text-emerald-300' : 'text-amber-300'}">3. Chiều dày bản sàn toàn khối (h<sub>s</sub> = ${slabH} mm)</span>
          <span class="px-2 py-0.5 text-xs font-bold rounded shrink-0 ${slabOk ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}">${slabOk ? 'ĐẠT' : 'LƯU Ý ĐỘ VÕNG'}</span>
        </div>
        <p class="text-xs text-slate-300 mt-1 leading-relaxed">Chiều dày sàn dân dụng khuyến nghị h<sub>s</sub> ≥ 100 mm và thỏa mãn độ mảnh hạn chế độ võng (tối thiểu ~${Math.max(100, minSlabH)} mm).</p>
        ${!slabOk ? `
          <div class="mt-2 p-2.5 rounded-lg fix-guide-box text-xs leading-relaxed">
            <strong>Vì sao cần lưu ý &amp; Cách giải quyết:</strong> Bản sàn dày ${slabH} mm hơi mỏng so với nhịp ${spanM} m, dễ bị rung khi đi lại, võng lớn và gây nứt tường xây ngăn phòng phía trên.<br>
            <strong>→ Hướng xử lý:</strong> Tăng chiều dày bản sàn lên ít nhất <strong>h<sub>s</sub> ≥ ${Math.ceil(Math.max(100, minSlabH) / 10) * 10} mm</strong> hoặc bố trí thêm dầm phụ chia nhỏ ô bản sàn.
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

// ============================================================================
// MỞ RỘNG PHÂN HỆ 2: CHUYỂN TAB CON + 4 BỘ CÔNG CỤ KỸ THUẬT KẾT CẤU CHUẨN TCVN
// ============================================================================

function switchEstimatorSubTab(tabKey) {
  document.querySelectorAll('.est-sub-panel').forEach(p => p.classList.add('hidden'));
  const activePanel = document.getElementById(`est-sub-${tabKey}`);
  if (activePanel) activePanel.classList.remove('hidden');

  document.querySelectorAll('.est-subtab-btn').forEach(btn => {
    const isActive = btn.dataset.estSubtab === tabKey;
    btn.classList.toggle('tcvn-subtab-active', isActive);
  });
}

function switchTcvnSubTab(tabKey) {
  document.querySelectorAll('.tcvn-sub-panel').forEach(p => p.classList.add('hidden'));
  const activePanel = document.getElementById(`tcvn-sub-${tabKey}`);
  if (activePanel) activePanel.classList.remove('hidden');

  document.querySelectorAll('.tcvn-subtab-btn').forEach(btn => {
    const isActive = btn.dataset.tcvnSubtab === tabKey;
    btn.classList.toggle('tcvn-subtab-active', isActive);
    btn.style.backgroundColor = '';
    btn.style.color = '';
  });
}

function calcBeamRebar() {
  const M = Math.max(1, parseFloat(document.getElementById('rc-moment')?.value) || 140); // kN.m
  const b = Math.max(120, parseFloat(document.getElementById('rc-b')?.value) || 250); // mm
  const h = Math.max(150, parseFloat(document.getElementById('rc-h')?.value) || 500); // mm
  const a = Math.max(25, Math.min(h * 0.35, parseFloat(document.getElementById('rc-a')?.value) || 40)); // mm
  const conc = document.getElementById('rc-concrete')?.value || 'B25';
  const steel = document.getElementById('rc-steel')?.value || 'CB400-V';

  const rbMap = { B20: 11.5, 'B22.5': 13.0, B25: 14.5, B30: 17.0, B35: 19.5 };
  const rsMap = { 'CB300-V': 260, 'CB400-V': 350, 'CB500-V': 435 };
  const xiRMap = { 'CB300-V': 0.583, 'CB400-V': 0.533, 'CB500-V': 0.493 };

  const Rb = rbMap[conc] || 14.5;
  const Rs = rsMap[steel] || 350;
  const xiR = xiRMap[steel] || 0.533;
  const alphaR = xiR * (1 - 0.5 * xiR);

  const h0 = h - a;
  const alphaM = (M * 1e6) / (Rb * b * h0 * h0);
  const out = document.getElementById('rc-beam-result');
  if (!out) return;

  const glossaryHtml = `
    <div class="mt-3 p-3 rounded-xl glossary-box text-[11px] leading-relaxed">
      <div class="font-bold text-slate-800 mb-1">Giải thích ký hiệu kỹ thuật (TCVN 5574:2018):</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-600">
        <div><strong>M:</strong> Mô-men uốn tính toán tại tiết diện (kN·m).</div>
        <div><strong>b, h:</strong> Bề rộng và chiều cao tiết diện dầm (mm).</div>
        <div><strong>a:</strong> Khoảng cách từ mép kéo đến trọng tâm thép (mm).</div>
        <div><strong>R<sub>b</sub>, R<sub>s</sub>:</strong> Cường độ nén bê tông &amp; kéo cốt thép (MPa).</div>
        <div><strong>A<sub>s</sub>:</strong> Diện tích cốt thép dọc chịu kéo yêu cầu (mm²).</div>
        <div><strong>α<sub>m</sub>, α<sub>R</sub>:</strong> Hệ số kiểm tra vùng nén (cần α<sub>m</sub> ≤ α<sub>R</sub>).</div>
        <div><strong>μ:</strong> Hàm lượng cốt thép dọc trong tiết diện (%).</div>
        <div><strong>h<sub>0</sub>:</strong> Chiều cao làm việc của tiết diện (h<sub>0</sub> = h − a).</div>
      </div>
    </div>
  `;

  if (alphaM > alphaR) {
    const hMinSuggest = Math.ceil((Math.sqrt((M * 1e6) / (alphaR * Rb * b)) + a) / 50) * 50;
    out.innerHTML = `
      <div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-bold text-sm text-rose-700">KHÔNG ĐẠT: α<sub>m</sub> = ${alphaM.toFixed(3)} &gt; α<sub>R</sub> = ${alphaR.toFixed(3)}</span>
          <span class="px-2 py-0.5 text-xs font-bold rounded bg-rose-600 text-white">NGUY CƠ PHÁ HOẠI GIÒN</span>
        </div>
        <div class="p-2.5 rounded-lg fix-guide-box text-xs leading-relaxed">
          <strong>Giải thích nguyên nhân:</strong> Tiết diện dầm ${b}×${h} mm quá nhỏ so với mô-men M = ${M} kN·m. Nếu đặt cố thêm thép kéo, vùng bê tông chịu nén sẽ bị vỡ giòn đột ngột trước khi thép kịp chảy dẻo (rất nguy hiểm).<br>
          <strong>→ Cách giải quyết:</strong>
          (1) Tăng chiều cao dầm lên tối thiểu <strong>h ≥ ${hMinSuggest} mm</strong> (hiệu quả nhất);
          (2) Hoặc tăng bề rộng dầm b lên ${b + 50}–${b + 100} mm;
          (3) Hoặc nâng cấp bền bê tông lên B30/B35;
          (4) Hoặc tính toán đặt thêm cốt thép chịu nén A'<sub>s</sub> (cốt kép).
        </div>
      </div>
      ${glossaryHtml}
    `;
    return;
  }

  const xi = 1 - Math.sqrt(Math.max(0, 1 - 2 * alphaM));
  const AsReq = (xi * Rb * b * h0) / Rs; // mm2
  const muMin = 0.1; // %
  const muMax = xiR * (Rb / Rs) * 100;
  const AsMin = (muMin / 100) * b * h0;
  const AsDesign = Math.max(AsReq, AsMin);
  const muActual = (AsDesign / (b * h0)) * 100;
  const isMinGoverned = AsReq < AsMin;

  // Gợi ý chọn thanh thép thực tế (2..6 thanh, đường kính 14..25mm)
  const dias = [14, 16, 18, 20, 22, 25];
  const options = [];
  dias.forEach(d => {
    const area1 = (Math.PI * d * d) / 4;
    const n = Math.max(2, Math.ceil(AsDesign / area1));
    if (n <= 6) {
      const clearSpacing = (b - 2 * 25 - 2 * 8 - n * d) / Math.max(1, n - 1);
      if (clearSpacing >= Math.max(25, d)) {
        const totalArea = n * area1;
        const surplus = ((totalArea - AsDesign) / AsDesign) * 100;
        options.push({ n, d, totalArea, surplus, label: `${n}Ø${d}` });
      }
    }
  });
  options.sort((x, y) => x.surplus - y.surplus);
  const needsTwoLayers = options.length === 0;
  const best = options[0] || { n: 4, d: 22, totalArea: 4 * 380.1, surplus: 0, label: 'Bố trí 2 lớp' };
  const topSuggestions = options.slice(0, 3);

  // Vẽ mặt cắt dầm SVG động (nền trắng sạch sẽ, chữ sắc nét)
  const svgW = 166;
  const svgH = 192;
  const ratio = Math.min(94 / b, 126 / h);
  const drawW = Math.max(54, Math.round(b * ratio));
  const drawH = Math.max(76, Math.round(h * ratio));
  const ox = Math.round((svgW - drawW) / 2);
  const oy = Math.round((svgH - drawH) / 2) - 4;
  const pad = Math.max(8, Math.round(drawW * 0.13));

  let bottomBarsSvg = '';
  const barCount = Math.min(6, best.n);
  const barR = Math.max(3.4, Math.min(5, best.d / 4.4));
  for (let i = 0; i < barCount; i++) {
    const cx = barCount === 1
      ? ox + drawW / 2
      : ox + pad + (i * (drawW - 2 * pad)) / (barCount - 1);
    const cy = oy + drawH - pad;
    bottomBarsSvg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${barR.toFixed(1)}" fill="#b91c1c" />`;
  }

  const beamSvg = `
    <div class="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-center">
      <svg viewBox="0 0 ${svgW} ${svgH}" class="w-full max-w-[166px] mx-auto block" role="img" aria-label="Sơ đồ mặt cắt dầm">
        <rect x="${ox}" y="${oy}" width="${drawW}" height="${drawH}" rx="2" fill="#f1f5f9" stroke="#334155" stroke-width="2" />
        <rect x="${ox + pad - 3}" y="${oy + pad - 3}" width="${drawW - 2 * pad + 6}" height="${drawH - 2 * pad + 6}" rx="3" fill="none" stroke="#0284c7" stroke-width="1.6" stroke-dasharray="3,2" />
        <circle cx="${ox + pad}" cy="${oy + pad}" r="3" fill="#64748b" />
        <circle cx="${ox + drawW - pad}" cy="${oy + pad}" r="3" fill="#64748b" />
        ${bottomBarsSvg}
        <text x="${ox + drawW / 2}" y="${oy - 6}" text-anchor="middle" font-size="10" font-weight="700" fill="#1e293b">b = ${b} mm</text>
        <text x="${ox + drawW + 6}" y="${oy + drawH / 2 + 3}" font-size="10" font-weight="700" fill="#1e293b">h=${h}</text>
        <text x="${ox + drawW / 2}" y="${oy + drawH + 15}" text-anchor="middle" font-size="10" font-weight="700" fill="#8b1e2b">Chọn: ${best.label}</text>
      </svg>
    </div>
  `;

  out.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center p-4 rounded-xl tech-surface border">
      <div class="sm:col-span-5">${beamSvg}</div>
      <div class="sm:col-span-7 space-y-2.5 text-xs text-slate-700">
        <div class="flex items-center justify-between border-b border-slate-200 pb-2">
          <span class="text-slate-600 font-medium">Diện tích thép yêu cầu A<sub>s</sub>:</span>
          <span class="font-mono-tech font-extrabold text-sm text-emerald-700">${Math.round(AsDesign)} mm² (${(AsDesign / 100).toFixed(2)} cm²)</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-600">Hệ số kiểm tra α<sub>m</sub> / α<sub>R</sub>:</span>
          <span class="font-mono-tech font-bold text-slate-900">${alphaM.toFixed(3)} / ${alphaR.toFixed(3)} <span class="text-emerald-700">(Đạt)</span></span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-slate-600">Hàm lượng cốt thép μ:</span>
          <span class="font-mono-tech font-bold text-emerald-700">${muActual.toFixed(2)}% <span class="text-slate-500 font-normal">(${muMin}% ÷ ${muMax.toFixed(2)}%)</span></span>
        </div>
        <div class="pt-1">
          <div class="text-slate-600 font-medium mb-1.5">Phương án chọn thanh thép tối ưu (1 lớp):</div>
          <div class="flex flex-wrap gap-1.5">
            ${topSuggestions.map((opt, idx) => `
              <span class="px-2.5 py-1 rounded-lg font-mono-tech text-[11px] font-bold border ${idx === 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-white text-slate-700 border-slate-300'}">
                ${opt.label} (${Math.round(opt.totalArea)} mm²)
              </span>
            `).join('') || `<span class="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-300 text-[11px] font-semibold">Cần bố trí 2 lớp thép</span>`}
          </div>
        </div>
      </div>
    </div>

    ${needsTwoLayers ? `
      <div class="mt-2.5 p-3 rounded-xl fix-guide-box text-xs leading-relaxed">
        <strong>Lưu ý bố trí thép &amp; Cách giải quyết:</strong> Lượng thép A<sub>s</sub> = ${Math.round(AsDesign)} mm² không xếp vừa 1 hàng trong bề rộng dầm b = ${b} mm (khoảng hở thông thủy giữa các thanh nhỏ hơn max(25mm, d), đá dăm bê tông khó lọt xuống gây rỗ đáy dầm).<br>
        <strong>→ Hướng xử lý:</strong> Chia cốt thép thành <strong>2 lớp</strong> (đặt thanh kê ngang Ø25 giữa 2 lớp và tăng giá trị <strong>a</strong> lên 60–65 mm để tính lại), hoặc tăng bề rộng dầm b lên <strong>${b + 50} mm</strong>.
      </div>
    ` : ''}

    ${isMinGoverned ? `
      <div class="mt-2.5 p-3 rounded-xl fix-guide-box text-xs leading-relaxed">
        <strong>Lưu ý hàm lượng tối thiểu:</strong> Mô-men nhỏ nên A<sub>s</sub> tính toán (${Math.round(AsReq)} mm²) nhỏ hơn A<sub>s,min</sub> (${Math.round(AsMin)} mm²). Hệ thống đã tự động lấy theo <strong>μ<sub>min</sub> = 0.1%</strong> để tránh dầm bị phá hoại giòn ngay khi nứt.
      </div>
    ` : ''}

    ${glossaryHtml}
  `;
}

function calcAnchorLap() {
  const d = parseFloat(document.getElementById('anc-dia')?.value) || 18;
  const conc = document.getElementById('anc-concrete')?.value || 'B25';
  const steel = document.getElementById('anc-steel')?.value || 'CB400-V';
  const stress = document.getElementById('anc-stress')?.value || 'tension';
  const ratio = document.getElementById('anc-ratio')?.value || '50';

  const rbtMap = { B15: 0.75, B20: 0.90, 'B22.5': 0.98, B25: 1.05, B30: 1.15, B35: 1.30 };
  const rsMap = { 'CB240-T': 210, 'CB300-V': 260, 'CB400-V': 350, 'CB500-V': 435 };
  const isSmooth = steel === 'CB240-T';

  const Rbt = rbtMap[conc] || 1.05;
  const Rs = rsMap[steel] || 350;
  const eta1 = isSmooth ? 1.5 : 2.5;
  const eta2 = d <= 32 ? 1.0 : 0.9;
  const Rbond = eta1 * eta2 * Rbt;

  const l0an = (Rs * d) / (4 * Rbond);
  const alphaAn = stress === 'tension' ? 1.0 : 0.75;
  const lanRaw = Math.max(alphaAn * l0an, 15 * d, 200);
  const lan = Math.ceil(lanRaw / 10) * 10;

  const alphaLap = stress === 'compression' ? 0.9 : (ratio === '100' ? 2.0 : 1.2);
  const llapRaw = Math.max(alphaLap * l0an, 20 * d, 250);
  const llap = Math.ceil(llapRaw / 10) * 10;

  const lanD = Math.ceil(lan / d);
  const llapD = Math.ceil(llap / d);

  const out = document.getElementById('anc-lap-result');
  if (!out) return;
  out.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="p-4 rounded-xl tech-surface border space-y-1">
        <div class="text-xs font-medium text-slate-600">Chiều dài neo cơ bản (l<sub>0,an</sub>)</div>
        <div class="font-mono-tech text-2xl font-extrabold text-slate-900">${Math.round(l0an)} mm</div>
        <div class="text-[11px] text-slate-600">R<sub>bond</sub> = ${Rbond.toFixed(2)} MPa (η₁ = ${eta1}, R<sub>bt</sub> = ${Rbt} MPa)</div>
      </div>

      <div class="p-4 rounded-xl bg-sky-50 border border-sky-200 space-y-1">
        <div class="text-xs text-sky-800 font-semibold">Chiều dài Neo tính toán (l<sub>an</sub>)</div>
        <div class="font-mono-tech text-2xl font-extrabold text-sky-700">${lan} mm <span class="text-sm font-bold">(≈ ${lanD}d)</span></div>
        <div class="text-[11px] text-slate-600">Tối thiểu: max(15d, 200 mm) = ${Math.max(15 * d, 200)} mm</div>
      </div>

      <div class="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
        <div class="text-xs text-emerald-800 font-semibold">Chiều dài Nối chồng (l<sub>lap</sub>)</div>
        <div class="font-mono-tech text-2xl font-extrabold text-emerald-700">${llap} mm <span class="text-sm font-bold">(≈ ${llapD}d)</span></div>
        <div class="text-[11px] text-slate-600">Hệ số α<sub>lap</sub> = ${alphaLap} • Tối thiểu max(20d, 250 mm) = ${Math.max(20 * d, 250)} mm</div>
      </div>
    </div>

    ${(ratio === '100' && stress === 'tension') ? `
      <div class="mt-3 p-3 rounded-xl fix-guide-box text-xs leading-relaxed">
        <strong>Lưu ý nối 100% thanh thép tại 1 mặt cắt &amp; Cách tối ưu:</strong> Nối đồng thời toàn bộ thanh thép chịu kéo tại cùng một vị trí khiến hệ số tăng vọt lên α<sub>lap</sub> = 2.0 (l<sub>lap</sub> = <strong>${llap} mm</strong>), vừa tốn thép vừa gây tắc bê tông cục bộ.<br>
        <strong>→ Cách giải quyết:</strong> Bố trí <strong>nối so le ≤ 50%</strong> số thanh trên 1 mặt cắt (khoảng cách giữa 2 tâm mối nối ≥ 1,3·l<sub>lap</sub>) hoặc chuyển sang dùng <strong>khớp nối ren Coupler</strong> cho thép Ø≥20 mm.
      </div>
    ` : `
      <div class="mt-3 p-3 rounded-xl fix-guide-box text-xs leading-relaxed">
        <strong>Lưu ý thi công công trường (TCVN 5574:2018):</strong>
        Với thép <strong>Ø${d} ${steel}</strong> trong bê tông <strong>${conc}</strong>, khi nối so le ≤ 50%, khoảng cách giữa 2 tâm mối nối liền kề phải đạt ≥ 1,3·l<sub>lap</sub> = <strong>${Math.ceil((1.3 * llap) / 10) * 10} mm</strong>, và tuyệt đối không nối tại vùng mô-men lớn nhất.
      </div>
    `}

    <div class="mt-3 p-3 rounded-xl glossary-box text-[11px] leading-relaxed">
      <div class="font-bold text-slate-800 mb-1">Giải thích ký hiệu kỹ thuật (TCVN 5574:2018 – Mục 10.3.3):</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-0.5 text-slate-600">
        <div><strong>R<sub>bt</sub>:</strong> Cường độ chịu kéo tính toán của bê tông (MPa).</div>
        <div><strong>R<sub>bond</sub>:</strong> Cường độ bám dính giữa cốt thép và bê tông (MPa).</div>
        <div><strong>η<sub>1</sub>:</strong> Hệ số bề mặt thép (2.5 cho thép gân; 1.5 cho thép trơn).</div>
        <div><strong>l<sub>0,an</sub>:</strong> Chiều dài neo cơ bản (chưa nhân hệ số điều kiện).</div>
        <div><strong>l<sub>an</sub>:</strong> Chiều dài neo tính toán bắt buộc vào gối tựa / cột.</div>
        <div><strong>l<sub>lap</sub> &amp; d:</strong> Chiều dài đoạn nối chồng (d là đường kính thép).</div>
      </div>
    </div>
  `;
}

function calcLoads2737() {
  const room = document.getElementById('load-room-type')?.value || 'residential';
  const roomMap = {
    residential: { name: 'Phòng ngủ, phòng khách, căn hộ chung cư', qk: 1.5, yf: 1.3, note: 'Nhóm công năng A — Nhà ở dân dụng (TCVN 2737:2023 Bảng 4).' },
    office: { name: 'Văn phòng làm việc, phòng học, phòng kỹ thuật', qk: 2.0, yf: 1.3, note: 'Nhóm công năng B/C1 — Khu vực có bàn ghế cố định hoặc văn phòng.' },
    corridor_res: { name: 'Hành lang, cầu thang nhà ở & văn phòng', qk: 3.0, yf: 1.3, note: 'Khu vực lưu thông đông người cần hệ số an toàn cao hơn phòng ở.' },
    balcony: { name: 'Ban công, lô gia (dải 0.8m sát lan can)', qk: 4.0, yf: 1.3, note: 'Tính toàn bộ diện tích ban công lấy 2.0 kN/m²; dải 0.8m sát mép lấy 4.0 kN/m².' },
    hall: { name: 'Hội trường, trung tâm thương mại, sảnh lớn', qk: 4.0, yf: 1.3, note: 'Khu vực tập trung đông người đứng (có thể lên tới 5.0 kN/m² khi không có ghế cố định).' },
    parking: { name: 'Bãi đỗ xe ô tô con (≤ 2.5 tấn)', qk: 2.5, yf: 1.3, note: 'Cần kiểm tra thêm tải trọng tập trung bánh xe cục bộ theo TCVN 2737:2023.' },
    roof_use: { name: 'Sàn mái có sử dụng (sân thượng, nghỉ ngơi)', qk: 1.5, yf: 1.3, note: 'Nếu làm sân thượng tổ chức sự kiện đông người lấy 3.0 – 4.0 kN/m².' },
    roof_no: { name: 'Sàn mái không sử dụng (chỉ sửa chữa)', qk: 0.75, yf: 1.3, note: 'Hoạt tải sửa chữa mái tối thiểu 0.75 kN/m² (75 kg/m²).' }
  };
  const rm = roomMap[room] || roomMap.residential;
  const qtt = rm.qk * rm.yf;

  const liveOut = document.getElementById('load-live-result');
  if (liveOut) {
    liveOut.innerHTML = `
      <div class="grid grid-cols-3 gap-2.5">
        <div class="p-3 rounded-xl tech-surface border">
          <div class="text-[11px] text-slate-600">Hoạt tải tiêu chuẩn q<sub>k</sub></div>
          <div class="font-mono-tech text-lg font-extrabold text-sky-700">${rm.qk.toFixed(2)} kN/m²</div>
          <div class="text-[11px] text-slate-500">≈ ${Math.round(rm.qk * 100)} kg/m²</div>
        </div>
        <div class="p-3 rounded-xl tech-surface border">
          <div class="text-[11px] text-slate-600">Hệ số tin cậy γ<sub>f</sub></div>
          <div class="font-mono-tech text-lg font-extrabold text-slate-900">${rm.yf.toFixed(1)}</div>
          <div class="text-[11px] text-slate-500">TCVN 2737:2023</div>
        </div>
        <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <div class="text-[11px] text-emerald-800 font-medium">Hoạt tải tính toán q<sub>tt</sub></div>
          <div class="font-mono-tech text-lg font-extrabold text-emerald-700">${qtt.toFixed(2)} kN/m²</div>
          <div class="text-[11px] text-slate-600">≈ ${Math.round(qtt * 100)} kg/m²</div>
        </div>
      </div>
      <p class="text-xs text-slate-600 mt-3 leading-relaxed"><strong>Ghi chú:</strong> ${rm.note}</p>
      <div class="mt-3 p-3 rounded-xl glossary-box text-[11px] leading-relaxed">
        <div class="font-bold text-slate-800 mb-1">Giải thích ký hiệu Hoạt tải:</div>
        <div class="space-y-0.5 text-slate-600">
          <div><strong>q<sub>k</sub>:</strong> Hoạt tải tiêu chuẩn phân bố đều trên sàn (1 kN/m² ≈ 100 kg/m²).</div>
          <div><strong>γ<sub>f</sub>:</strong> Hệ số độ tin cậy (hệ số vượt tải) nhân thêm để đảm bảo an toàn.</div>
          <div><strong>q<sub>tt</sub>:</strong> Hoạt tải tính toán đưa vào phần mềm kết cấu (q<sub>tt</sub> = γ<sub>f</sub> · q<sub>k</sub>).</div>
        </div>
      </div>
    `;
  }

  const zone = document.getElementById('wind-zone')?.value || 'III';
  const terrain = document.getElementById('wind-terrain')?.value || 'B';
  const ze = Math.max(3, parseFloat(document.getElementById('wind-height')?.value) || 15);

  const w3sMap = { I: 0.65, II: 0.95, III: 1.25, IV: 1.55, V: 1.85 };
  const W3s10 = w3sMap[zone] || 1.25;
  const W0 = W3s10 * 0.852;

  const terrainParams = {
    A: { zg: 213.36, alpha: 11.5, zmin: 2.13 },
    B: { zg: 274.32, alpha: 9.5, zmin: 4.57 },
    C: { zg: 365.76, alpha: 7.0, zmin: 9.14 }
  };
  const tp = terrainParams[terrain] || terrainParams.B;
  const zEff = Math.max(ze, tp.zmin);
  const kZe = 2.01 * Math.pow(zEff / tp.zg, 2 / tp.alpha);

  const Gf = 0.85;
  const WkFront = W3s10 * kZe * 0.8 * Gf;
  const WkTotal = W3s10 * kZe * 1.4 * Gf;
  const WttTotal = WkTotal * 2.1;
  const isHighWindAlert = ze >= 40 || zone === 'IV' || zone === 'V';

  const windOut = document.getElementById('load-wind-result');
  if (windOut) {
    windOut.innerHTML = `
      <div class="grid grid-cols-3 gap-2.5">
        <div class="p-3 rounded-xl tech-surface border">
          <div class="text-[11px] text-slate-600">Hệ số độ cao k(z<sub>e</sub>)</div>
          <div class="font-mono-tech text-lg font-extrabold text-slate-900">${kZe.toFixed(3)}</div>
          <div class="text-[11px] text-slate-500">Địa hình ${terrain} • H=${ze}m</div>
        </div>
        <div class="p-3 rounded-xl bg-sky-50 border border-sky-200">
          <div class="text-[11px] text-sky-800 font-medium">Gió tiêu chuẩn W<sub>k</sub></div>
          <div class="font-mono-tech text-lg font-extrabold text-sky-700">${WkTotal.toFixed(2)} kN/m²</div>
          <div class="text-[11px] text-slate-600">Đón gió: ${WkFront.toFixed(2)} kN/m²</div>
        </div>
        <div class="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <div class="text-[11px] text-emerald-800 font-medium">Gió tính toán W<sub>tt</sub></div>
          <div class="font-mono-tech text-lg font-extrabold text-emerald-700">${WttTotal.toFixed(2)} kN/m²</div>
          <div class="text-[11px] text-slate-600">γ<sub>f</sub> = 2.1 (TCVN 2023)</div>
        </div>
      </div>

      ${isHighWindAlert ? `
        <div class="mt-2.5 p-3 rounded-xl fix-guide-box text-xs leading-relaxed">
          <strong>Lưu ý gió lớn / công trình cao &amp; Cách xử lý:</strong> ${ze >= 40 ? `Công trình cao H = ${ze} m (≥ 40 m)` : `Vùng gió ${zone} chịu bão mạnh`} dễ phát sinh dao động ngang và chuyển vị đỉnh lớn.<br>
          <strong>→ Hướng xử lý:</strong> Cần tính chi tiết hệ số giật G<sub>f</sub> theo chu kỳ dao động riêng T<sub>1</sub>, bố trí hệ vách cứng/lõi thang máy đối xứng và kiểm tra chuyển vị đỉnh ≤ H/500.
        </div>
      ` : `
        <p class="text-xs text-slate-600 mt-3 leading-relaxed">
          <strong>Chuẩn mới TCVN 2737:2023:</strong> Vùng ${zone} có W<sub>3s,10</sub> = ${W3s10} kN/m² (W<sub>0</sub> ≈ ${W0.toFixed(2)} kN/m²), tính với G<sub>f</sub> = 0.85 và tổng hệ số khí động c = 1.4 (đón 0.8 + hút 0.6).
        </p>
      `}

      <div class="mt-3 p-3 rounded-xl glossary-box text-[11px] leading-relaxed">
        <div class="font-bold text-slate-800 mb-1">Giải thích ký hiệu Tải trọng Gió (TCVN 2737:2023):</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-600">
          <div><strong>W<sub>3s,10</sub>:</strong> Áp lực gió cơ sở 3 giây (chu kỳ lặp 10 năm).</div>
          <div><strong>k(z<sub>e</sub>):</strong> Hệ số thay đổi áp lực gió theo độ cao &amp; địa hình.</div>
          <div><strong>G<sub>f</sub>:</strong> Hệ số hiệu ứng giật của gió tác dụng lên công trình.</div>
          <div><strong>W<sub>k</sub>, W<sub>tt</sub>:</strong> Áp lực gió tiêu chuẩn và tính toán (γ<sub>f</sub> = 2.1).</div>
        </div>
      </div>
    `;
  }
}

function calcFoundationPccc() {
  const Nton = Math.max(5, parseFloat(document.getElementById('fnd-load')?.value) || 65);
  const R0 = Math.max(50, parseFloat(document.getElementById('fnd-r0')?.value) || 180); // kN/m2
  const Hm = Math.max(0.6, parseFloat(document.getElementById('fnd-depth')?.value) || 1.6); // m

  const Nkn = Nton * 10;
  const gammaTb = 20;
  const netBearing = R0 - gammaTb * Hm;
  const isWeakSoil = netBearing <= 25;
  const Areq = (Nkn * 1.1) / Math.max(25, netBearing);
  const sideRaw = Math.sqrt(Areq);
  const side = Math.ceil(sideRaw * 10) / 10;
  const Aactual = side * side;
  const pActual = (Nkn / Aactual) + gammaTb * Hm;
  const hmRec = Math.max(0.4, Math.ceil((side / 4.2) * 20) / 20);
  const isSafe = !isWeakSoil && pActual <= R0;

  const fndOut = document.getElementById('fnd-calc-result');
  if (fndOut) {
    fndOut.innerHTML = `
      <div class="grid grid-cols-2 gap-3 text-xs">
        <div class="p-3 rounded-xl bg-sky-50 border border-sky-200">
          <div class="text-sky-800 font-medium">Kích thước đáy móng gợi ý</div>
          <div class="font-mono-tech text-lg font-extrabold text-sky-700 mt-0.5">${side.toFixed(1)}m × ${side.toFixed(1)}m</div>
          <div class="text-[11px] text-slate-600">Diện tích A = ${Aactual.toFixed(2)} m² (A<sub>yc</sub> = ${Areq.toFixed(2)} m²)</div>
        </div>
        <div class="p-3 rounded-xl border ${isSafe ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}">
          <div class="${isSafe ? 'text-emerald-800' : 'text-rose-800'} font-medium">Áp lực đáy móng p<sub>tb</sub></div>
          <div class="font-mono-tech text-lg font-extrabold ${isSafe ? 'text-emerald-700' : 'text-rose-700'} mt-0.5">${pActual.toFixed(1)} kN/m²</div>
          <div class="text-[11px] text-slate-600">${isSafe ? `ĐẠT (≤ R₀ = ${R0} kN/m²)` : `KHÔNG ĐẠT (Vượt R₀ = ${R0} kN/m²)`}</div>
        </div>
      </div>
      <p class="text-xs text-slate-600 mt-2.5 leading-relaxed">
        <strong>Chiều cao đài móng sơ bộ chống chọc thủng:</strong> h<sub>m</sub> ≥ <strong>${Math.round(hmRec * 1000)} mm</strong>.
      </p>

      ${(!isSafe || side > 2.6) ? `
        <div class="mt-2.5 p-3 rounded-xl fix-guide-box text-xs leading-relaxed">
          <strong>Vì sao cần lưu ý &amp; Cách giải quyết:</strong> ${!isSafe ? `Đất nền yếu (R<sub>0</sub> = ${R0} kN/m²) không đủ chịu tải trọng chân cột ${Nton} Tấn ở độ sâu ${Hm} m, nguy cơ lún lệch và trượt nền cao.` : `Đế móng đơn quá rộng (${side.toFixed(1)}m > 2.6m) dễ chồng lấn móng cột bên cạnh và tốn bê tông/cốt thép.`}<br>
          <strong>→ Hướng xử lý:</strong> Chuyển sang phương án <strong>Móng băng giao thoa</strong> (liên kết các cột để giảm áp lực nền) hoặc <strong>Móng cọc ép BTCT / Cọc khoan nhồi</strong> truyền tải xuống tầng đất tốt sâu hơn.
        </div>
      ` : ''}

      <div class="mt-3 p-3 rounded-xl glossary-box text-[11px] leading-relaxed">
        <div class="font-bold text-slate-800 mb-1">Giải thích ký hiệu Nền móng (TCVN 9362:2012):</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-slate-600">
          <div><strong>N:</strong> Lực dọc chân cột truyền xuống móng (1 Tấn ≈ 10 kN).</div>
          <div><strong>R<sub>0</sub>:</strong> Cường độ chịu tải quy ước của lớp đất nền (kN/m²).</div>
          <div><strong>H<sub>m</sub>:</strong> Chiều sâu chôn móng từ mặt đất tự nhiên (m).</div>
          <div><strong>p<sub>tb</sub>, h<sub>m</sub>:</strong> Áp lực đáy móng trung bình &amp; chiều cao đài móng.</div>
        </div>
      </div>
    `;
  }

  const city = document.getElementById('seis-city')?.value || 'danang';
  const pcccH = document.getElementById('pccc-height')?.value || 'low';

  const cityMap = {
    danang: { name: 'TP. Đà Nẵng', agr: 0.068, level: 'Động đất yếu (Cấp VI)', advice: 'Thường chỉ cần bố trí cấu tạo kháng chấn cơ bản (trừ công trình quan trọng đặc biệt).' },
    hanoi: { name: 'TP. Hà Nội', agr: 0.105, level: 'Động đất trung bình (Cấp VII)', advice: 'Bắt buộc tính toán tải trọng động đất theo TCVN 9386:2012 cho nhà nhiều tầng.' },
    hcm: { name: 'TP. Hồ Chí Minh', agr: 0.075, level: 'Động đất yếu (Cấp VI)', advice: 'Nền đất yếu (loại D/E) làm khuếch đại gia tốc — nhà cao tầng cần kiểm tra kháng chấn.' },
    haiphong: { name: 'TP. Hải Phòng', agr: 0.118, level: 'Động đất trung bình (Cấp VII)', advice: 'Bắt buộc tính toán kháng chấn và tăng cường cốt đai vùng nút khung.' },
    dienbien: { name: 'Tỉnh Điện Biên', agr: 0.215, level: 'Động đất mạnh (Cấp VIII)', advice: 'Vùng nguy hiểm cao — Bắt buộc thiết kế kháng chấn cấp dẻo cao (DCH) theo TCVN 9386:2012.' },
    nhatrang: { name: 'TP. Nha Trang', agr: 0.088, level: 'Động đất yếu–TB (Cấp VI–VII)', advice: 'Cần kiểm tra kháng chấn cho công trình từ 5 tầng trở lên.' }
  };
  const ct = cityMap[city] || cityMap.danang;

  const pcccMap = {
    low: { grade: 'Bậc III – IV', rei: 'Cột/Tường: R 60 • Sàn: REI 45', exit: 'Cầu thang thoát nạn rộng ≥ 0.9m – 1.05m (nhà ở riêng lẻ / văn phòng nhỏ).' },
    mid: { grade: 'Bậc II', rei: 'Cột/Tường chịu lực: R 90 • Sàn: REI 45–60', exit: 'Yêu cầu buồng thang bộ kín (L1/N1), hành lang rộng ≥ 1.2m, hệ thống báo cháy & chữa cháy vách tường.' },
    high: { grade: 'Bậc I (Nghiêm ngặt)', rei: 'Cột chịu lực: R 120–150 • Sàn: REI 60', exit: 'Bắt buộc thang bộ không nhiễm khói N1/N3 có tăng áp, tối thiểu 2 lối thoát nạn độc lập, hệ thống Sprinkler tự động.' }
  };
  const pc = pcccMap[pcccH] || pcccMap.low;

  const spOut = document.getElementById('seis-pccc-result');
  if (spOut) {
    spOut.innerHTML = `
      <div class="space-y-2.5 text-xs">
        <div class="p-3.5 rounded-xl tech-surface border space-y-1">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-slate-900">Động đất (${ct.name} — TCVN 9386:2012)</span>
            <span class="font-mono-tech px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold shrink-0">a<sub>gR</sub> = ${ct.agr}g</span>
          </div>
          <div class="text-slate-700 leading-relaxed"><strong>Mức độ:</strong> ${ct.level}. ${ct.advice}</div>
        </div>
        <div class="p-3.5 rounded-xl tech-surface border space-y-1">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-slate-900">An toàn Cháy (QCVN 06:2022/BXD)</span>
            <span class="font-mono-tech px-2 py-0.5 rounded bg-rose-100 text-rose-900 border border-rose-300 font-bold shrink-0">${pc.grade}</span>
          </div>
          <div class="text-slate-700"><strong>Giới hạn chịu lửa:</strong> ${pc.rei}</div>
          <div class="text-slate-700 leading-relaxed"><strong>Thoát nạn:</strong> ${pc.exit}</div>
        </div>
      </div>

      <div class="mt-3 p-3 rounded-xl glossary-box text-[11px] leading-relaxed">
        <div class="font-bold text-slate-800 mb-1">Giải thích ký hiệu Động đất &amp; PCCC:</div>
        <div class="space-y-0.5 text-slate-600">
          <div><strong>a<sub>gR</sub>:</strong> Gia tốc nền tham chiếu (tính theo gia tốc trọng trường g ≈ 9.81 m/s²).</div>
          <div><strong>R / REI (phút):</strong> Giới hạn chịu lửa — <strong>R</strong>: Chịu lực, <strong>E</strong>: Toàn vẹn ngăn khói lửa, <strong>I</strong>: Cách nhiệt (VD: REI 60 = chịu lửa 60 phút).</div>
        </div>
      </div>
    `;
  }
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
    const rawReply = await callGeminiAPI(prompt, AppState.uploadedSiteBase64, AppState.uploadedSiteMime, true);
    const parsed = parseGeminiJsonSafe(rawReply);

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

  const hasImage = Boolean(AppState.uploadedSiteBase64);
  const modeTag = hasImage
    ? '<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">Bám sát ảnh công trường đã tải</span>'
    : '<span class="px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-semibold">Tư vấn trực tiếp (không cần ảnh)</span>';

  const loadingId = `site-qa-${Date.now()}`;
  const safeQ = question.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  thread.innerHTML += `
    <div class="p-3.5 rounded-xl tech-surface border space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs font-semibold text-slate-900">Câu hỏi của bạn: ${safeQ}</div>
        ${modeTag}
      </div>
      <div id="${loadingId}" class="flex items-center gap-2 text-emerald-700 text-xs">
        <span class="animate-spin inline-block w-4 h-4 shrink-0 border-2 border-emerald-600 border-t-transparent rounded-full"></span>
        <span>Kỹ sư An toàn AI đang phân tích câu hỏi...</span>
      </div>
    </div>
  `;
  thread.scrollTop = thread.scrollHeight;

  // Chế độ Mô phỏng thông minh (không có API Key) vẫn trả lời được câu hỏi trực tiếp!
  if (AppState.aiMode !== 'gemini' || !(AppState.apiKey || '').trim()) {
    const q = question.toLowerCase();
    let simReply = '';
    if (q.includes('biên bản') || q.includes('nhắc nhở')) {
      simReply = `- Tiêu đề: BIÊN BẢN NHẮC NHỞ AN TOÀN LAO ĐỘNG (HSE) TẠI CÔNG TRƯỜNG.\n- Nội dung vi phạm cần khắc phục ngay: Rà soát đầy đủ mũ bảo hộ có quai cài, giày mũi thép, áo phản quang và dây đeo an toàn khi làm việc trên cao ≥ 2m.\n- Yêu cầu tổ đội trưởng tạm dừng hạng mục không đảm bảo an toàn, bổ sung đủ PPE trong vòng 30 phút và ký cam kết trước khi thi công tiếp.\n- Lưu ý: Kết nối Gemini API để AI tự điền đúng lỗi chi tiết từ bức ảnh công trường của bạn.`;
    } else if (q.includes('bảo hộ') || q.includes('ppe')) {
      simReply = `- Trang bị PPE cơ bản bắt buộc theo QCVN 18:2021/BXD: Mũ bảo hộ cứng có cài quai, giày bảo hộ mũi thép chống đinh, áo phản quang.\n- Khi cắt/mài/hàn: Bắt buộc đeo kính che mặt hoặc kính bảo hộ chống tia lửa, khẩu trang lọc bụi mịn, găng tay da chịu nhiệt và máy mài phải còn nguyên ốp chắn bảo vệ.\n- Khi làm việc trên cao ≥ 2m: Bắt buộc đeo dây đai an toàn toàn thân 2 móc nối vào dây cứu sinh độc lập.`;
    } else if (q.includes('giàn giáo') || q.includes('trên cao') || q.includes('té ngã')) {
      simReply = `- Quy định làm việc trên cao (QCVN 18:2021/BXD): Phải có sàn thao tác kín rộng ≥ 60 cm, lan can bảo vệ cao 0.9–1.1 m và tấm chắn chân (toe-board) cao ≥ 15 cm chống rơi dụng cụ.\n- Giàn giáo phải đặt trên nền phẳng cứng, có kích tăng, giằng chéo đầy đủ và neo chắc vào kết cấu công trình theo lưới quy định.\n- Nghiêm cấm leo trèo ngoài khung giàn giáo hoặc đứng trên lan can/thang chữ A gần mép sàn hở.`;
    } else if (q.includes('điện') || q.includes('máy cắt') || q.includes('hàn')) {
      simReply = `- An toàn điện công trường: Tủ điện thi công phải có CB chống giật (ELCB/RCCB 30mA), dây điện treo cao trên giá cách điện ≥ 2.5m (không kéo lê dưới nước/sắt thép).\n- Máy cắt/mài cầm tay bắt buộc giữ nguyên chụp chắn bảo vệ đĩa cắt và có công tắc an toàn.\n- Khu vực hàn cắt phải dọn sạch vật liệu dễ cháy và đặt sẵn bình chữa cháy xách tay trong bán kính ≤ 5m.`;
    } else {
      simReply = `- Nguyên tắc an toàn công trường theo QCVN 18:2021/BXD: Nhận diện mối nguy trước khi làm việc (JSA), trang bị đủ PPE theo đúng công việc và che chắn toàn bộ lỗ mở/mép hở.\n- Mọi hạng mục trên cao, đào đất sâu > 1.2m hoặc dùng điện tạm đều cần kỹ sư HSE kiểm tra nghiệm thu trước ca làm việc.\n- Mẹo: Bạn có thể kết nối Gemini API Key để Kỹ sư An toàn AI trả lời chuyên sâu mọi tình huống thực tế (có ảnh hoặc không có ảnh đều được).`;
    }
    const target = document.getElementById(loadingId);
    if (target) {
      target.className = 'pt-1';
      target.innerHTML = formatAIResponseHTML(simReply);
    }
    thread.scrollTop = thread.scrollHeight;
    return;
  }

  let prompt = '';
  if (hasImage) {
    const summaryText = AppState.lastSiteAnalysisSummary
      ? `Kết quả phân tích an toàn trước đó của bức ảnh: ${AppState.lastSiteAnalysisSummary}`
      : 'Người dùng đã tải ảnh công trường đính kèm.';
    prompt = `Bạn là Kỹ sư Giám sát An toàn Lao động (HSE) tại công trường xây dựng Việt Nam.
QUY TẮC BẮT BUỘC: Người dùng ĐÃ tải lên bức ảnh công trường đính kèm.
${summaryText}
Hãy trả lời câu hỏi của người dùng BÁM SÁT 100% đúng những gì nhìn thấy trong bức ảnh đính kèm và bối cảnh an toàn công trường đó, KHÔNG nói lan man hay chệch hướng sang vấn đề không có trong ảnh.
Dùng dấu gạch đầu dòng (-), không dùng dấu (*), không dùng cú pháp LaTeX $...$, mỗi ý và mỗi câu hoàn chỉnh xuống dòng riêng rõ ràng.
Câu hỏi của người dùng: "${question}"`;
  } else {
    prompt = `Bạn là Kỹ sư Giám sát An toàn Lao động (HSE) chuyên nghiệp tại công trường xây dựng Việt Nam (am hiểu QCVN 18:2021/BXD).
QUY TẮC BẮT BUỘC: Người dùng CHƯA tải ảnh lên và đang đặt câu hỏi tư vấn trực tiếp bằng văn bản. TUYỆT ĐỐI KHÔNG yêu cầu người dùng phải tải ảnh lên mới trả lời — hãy trả lời thẳng, chính xác, thực tế và dễ áp dụng ngay cho câu hỏi này.
Dùng dấu gạch đầu dòng (-), không dùng dấu (*), không dùng cú pháp LaTeX $...$, mỗi ý và mỗi câu hoàn chỉnh xuống dòng riêng rõ ràng.
Câu hỏi của người dùng: "${question}"`;
  }

  try {
    const reply = await callGeminiAPI(prompt, hasImage ? AppState.uploadedSiteBase64 : null, AppState.uploadedSiteMime || 'image/jpeg');
    const target = document.getElementById(loadingId);
    if (target) {
      target.className = 'pt-1';
      target.innerHTML = formatAIResponseHTML(reply);
    }
  } catch (err) {
    const target = document.getElementById(loadingId);
    if (target) {
      target.className = 'text-xs text-rose-700';
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
    const rawReply = await callGeminiAPI(prompt, AppState.uploadedCrackBase64, AppState.uploadedCrackMime, true);

    // Trích xuất & cứu hộ khối JSON an toàn từ phản hồi của Gemini
    const parsed = parseGeminiJsonSafe(rawReply);

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

  const hasImage = Boolean(AppState.uploadedCrackBase64);
  const modeTag = hasImage
    ? '<span class="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">Bám sát ảnh &amp; phác đồ đã chẩn đoán</span>'
    : '<span class="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-semibold">Tư vấn trực tiếp (không cần ảnh)</span>';

  const loadingId = `crack-qa-${Date.now()}`;
  const safeQ = question.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  thread.innerHTML += `
    <div class="p-3.5 rounded-xl tech-surface border space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-xs font-semibold text-slate-900">Câu hỏi của bạn: ${safeQ}</div>
        ${modeTag}
      </div>
      <div id="${loadingId}" class="flex items-center gap-2 text-emerald-700 text-xs">
        <span class="animate-spin inline-block w-4 h-4 shrink-0 border-2 border-emerald-600 border-t-transparent rounded-full"></span>
        <span>Bác sĩ Công trình AI đang phân tích câu hỏi...</span>
      </div>
    </div>
  `;
  thread.scrollTop = thread.scrollHeight;

  // Chế độ Mô phỏng thông minh (không có API Key) vẫn trả lời được câu hỏi trực tiếp!
  if (AppState.aiMode !== 'gemini' || !(AppState.apiKey || '').trim()) {
    const q = question.toLowerCase();
    let simReply = '';
    if (q.includes('nguy hiểm') || q.includes('sập') || q.includes('di tản') || q.includes('45')) {
      simReply = `- Dấu hiệu vết nứt NGUY HIỂM cần xử lý khẩn cấp: Vết nứt xiên 45° tại đầu dầm/vách, nứt dọc thân cột kèm bong vỡ bê tông, bề rộng vết nứt > 0.3 mm (vượt giới hạn TCVN 5574:2018) và tiếp tục mở rộng theo thời gian.\n- Dấu hiệu ÍT NGUY HIỂM hơn: Vết nứt chân chim bề rộng < 0.2 mm chỉ nằm ở lớp vữa trát hoặc vị trí tiếp giáp tường gạch – cột bê tông.\n- Khuyến nghị: Gắn mốc thạch cao/thước đo vết nứt theo dõi 7–14 ngày; nếu vết nứt mở rộng nhanh hoặc có tiếng kêu rắc, phải chống đỡ tạm và mời đơn vị kiểm định kết cấu ngay.`;
    } else if (q.includes('tiết kiệm') || q.includes('chi phí') || q.includes('rẻ')) {
      simReply = `- Nếu là nứt vữa/nứt tường không chịu lực (< 0.3 mm): Phương án tiết kiệm nhất là cắt rãnh chữ V rộng 10 mm, vệ sinh sạch, trám keo đàn hồi Polyurethane (Sikaflex) hoặc dán lưới sợi thủy tinh rồi trát lại bằng vữa trộn phụ gia Sika Latex.\n- Nếu là nứt kết cấu (dầm/cột/sàn chịu lực): Tuyệt đối không chỉ trát che bề mặt vì sẽ nứt lại và gây gỉ thép — tối thiểu phải bơm keo Epoxy áp lực thấp (Sikadur-752) để hàn gắn liền khối bê tông.\n- Mẹo tiết kiệm: Xử lý sớm ngay khi vết nứt còn nhỏ sẽ giảm 60–70% chi phí so với để thấm nước làm gỉ cốt thép.`;
    } else if (q.includes('thấm') || q.includes('dột') || q.includes('mái') || q.includes('vệ sinh')) {
      simReply = `- Nguyên nhân thấm phổ biến: Nứt sàn bê tông do co ngót nhiệt, hỏng lớp chống thấm cổ ống xuyên sàn hoặc chân tường tiếp giáp hộp kỹ thuật.\n- Quy trình xử lý chuẩn: Đục bỏ lớp gạch/vữa yếu tới sàn bê tông gốc, mở rộng cổ ống rót vữa không co ngót SikaGrout 214, quét tối thiểu 2 lớp chống thấm 2 thành phần SikaTop Seal-107 (vén chân tường cao ≥ 20 cm), ngâm thử nước 48 giờ rồi mới lát gạch hoàn thiện.`;
    } else {
      simReply = `- Nguyên tắc chẩn đoán vết nứt theo TCVN 5574:2018: Xác định vị trí (kết cấu chịu lực hay tường ngăn), hướng vết nứt (xiên 45°, đứng giữa nhịp hay chân chim) và đo bề rộng vết nứt acrc (giới hạn thường ≤ 0.3 mm).\n- Phác đồ chung: Nứt bề mặt dùng keo đàn hồi + lưới thủy tinh; nứt kết cấu dùng bơm keo Epoxy (Sikadur-752) và gia cường sợi Carbon CFRP khi suy giảm khả năng chịu lực.\n- Mẹo: Bạn có thể kết nối Gemini API Key để Bác sĩ Công trình AI phân tích sâu đúng từng câu hỏi hoặc chẩn đoán trực tiếp trên ảnh chụp thực tế.`;
    }
    const target = document.getElementById(loadingId);
    if (target) {
      target.className = 'pt-1';
      target.innerHTML = formatAIResponseHTML(simReply);
    }
    thread.scrollTop = thread.scrollHeight;
    return;
  }

  let prompt = '';
  if (hasImage) {
    const summaryText = AppState.lastCrackAnalysisSummary
      ? `Kết quả chẩn đoán bệnh học công trình trước đó của bức ảnh: ${AppState.lastCrackAnalysisSummary}`
      : 'Người dùng đã tải ảnh vết nứt/hư hỏng công trình đính kèm.';
    prompt = `Bạn là Tiến sĩ Kỹ thuật Xây dựng, Bác sĩ Công trình chuyên kiểm định và sửa chữa kết cấu tại Việt Nam.
QUY TẮC BẮT BUỘC: Người dùng ĐÃ tải lên bức ảnh hư hỏng công trình đính kèm.
${summaryText}
Hãy trả lời câu hỏi của người dùng BÁM SÁT 100% đúng bức ảnh đính kèm, phác đồ chẩn đoán trên và TCVN 5574:2018, KHÔNG suy diễn chệch hướng sang sự cố khác không có trong ảnh.
Dùng dấu gạch đầu dòng (-), không dùng dấu (*), không dùng cú pháp LaTeX $...$, mỗi ý và mỗi câu hoàn chỉnh xuống dòng riêng rõ ràng.
Câu hỏi của người dùng: "${question}"`;
  } else {
    prompt = `Bạn là Tiến sĩ Kỹ thuật Xây dựng, Bác sĩ Công trình chuyên kiểm định, chẩn đoán bệnh học và sửa chữa kết cấu tại Việt Nam (am hiểu TCVN 5574:2018).
QUY TẮC BẮT BUỘC: Người dùng CHƯA tải ảnh lên và đang đặt câu hỏi tư vấn trực tiếp bằng văn bản. TUYỆT ĐỐI KHÔNG yêu cầu người dùng phải tải ảnh lên mới trả lời — hãy trả lời thẳng, rõ ràng, đúng chuyên môn xây dựng và đưa ra hướng xử lý thực tế ngay cho câu hỏi này.
Dùng dấu gạch đầu dòng (-), không dùng dấu (*), không dùng cú pháp LaTeX $...$, mỗi ý và mỗi câu hoàn chỉnh xuống dòng riêng rõ ràng.
Câu hỏi của người dùng: "${question}"`;
  }

  try {
    const reply = await callGeminiAPI(prompt, hasImage ? AppState.uploadedCrackBase64 : null, AppState.uploadedCrackMime || 'image/jpeg');
    const target = document.getElementById(loadingId);
    if (target) {
      target.className = 'pt-1';
      target.innerHTML = formatAIResponseHTML(reply);
    }
  } catch (err) {
    const target = document.getElementById(loadingId);
    if (target) {
      target.className = 'text-xs text-rose-700';
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

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const docCode = `${dd}${mm}/HSKT-KXD`;

  const escapePdf = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const cleanText = (elId, fallback = 'Chưa có dữ liệu.') => {
    const el = document.getElementById(elId);
    if (!el) return fallback;
    const lines = el.innerText.split('\n').map(l => l.trim()).filter(Boolean);
    return lines.length ? lines.map(escapePdf).join('<br>') : fallback;
  };

  let sectionsHtml = '';

  // =========================================================================
  // PHẦN I. KHÁI TOÁN CHI PHÍ, KỸ THUẬT & BÓC TÁCH KHỐI LƯỢNG (TT 12/2021/TT-BXD)
  // =========================================================================
  if (selected.includes('estimator')) {
    const pType = document.getElementById('est-type')?.selectedOptions?.[0]?.text || 'Nhà phố hiện đại';
    const area = document.getElementById('est-area')?.value || '--';
    const floors = document.getElementById('est-floors')?.value || '--';
    const floorH = document.getElementById('est-floor-h')?.value || '3.6';
    const basement = document.getElementById('est-basement')?.selectedOptions?.[0]?.text || 'Không có tầng hầm';
    const found = document.getElementById('est-foundation')?.selectedOptions?.[0]?.text || '--';
    const roof = document.getElementById('est-roof')?.selectedOptions?.[0]?.text || '--';
    const conc = document.getElementById('est-concrete')?.selectedOptions?.[0]?.text || 'B22.5';
    const steelGrade = document.getElementById('est-steel')?.selectedOptions?.[0]?.text || 'CB400-V';
    const region = document.getElementById('est-region')?.selectedOptions?.[0]?.text || 'Đà Nẵng';
    const pkg = document.getElementById('est-package')?.selectedOptions?.[0]?.text || '--';
    const isEco = document.getElementById('est-eco')?.checked;

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

    // Trích xuất sạch từng dòng bảng BOQ (12 hạng mục: Vật liệu, Nhân công, Máy thi công)
    let boqRowsHtml = '';
    const boqBody = document.getElementById('boq-detail-body');
    if (boqBody) {
      const trs = Array.from(boqBody.querySelectorAll('tr'));
      boqRowsHtml = trs.map(tr => {
        const tds = Array.from(tr.querySelectorAll('td'));
        if (tds.length === 6) {
          return `
            <tr style="page-break-inside:avoid;">
              <td class="td-c" style="font-weight:700; width:10%;">${escapePdf(tds[0].innerText.trim())}</td>
              <td class="td-l" style="width:42%;">${escapePdf(tds[1].innerText.trim())}</td>
              <td class="td-c" style="width:9%;">${escapePdf(tds[2].innerText.trim())}</td>
              <td class="td-r" style="width:11%;">${escapePdf(tds[3].innerText.trim())}</td>
              <td class="td-r" style="width:13%;">${escapePdf(tds[4].innerText.trim())}</td>
              <td class="td-r" style="font-weight:700; width:15%;">${escapePdf(tds[5].innerText.trim())}</td>
            </tr>
          `;
        } else if (tds.length >= 2) {
          const label = escapePdf(tds[0].innerText.trim());
          const val = escapePdf(tds[tds.length - 1].innerText.trim());
          const isTotal = label.toUpperCase().includes('TỔNG');
          return `
            <tr style="page-break-inside:avoid; background:${isTotal ? '#f8f0f1' : '#f8fafc'};">
              <td colspan="5" class="td-r" style="font-weight:700; ${isTotal ? 'color:#65121b; font-size:11.5px;' : ''}">${label}</td>
              <td class="td-r" style="font-weight:700; ${isTotal ? 'color:#65121b; font-size:11.5px;' : ''}">${val}</td>
            </tr>
          `;
        }
        return '';
      }).join('');
    }

    sectionsHtml += `
      <div class="pdf-section">
        <h2 class="pdf-h2">PHẦN I. THÔNG SỐ KỸ THUẬT, KHÁI TOÁN CHI PHÍ &amp; BÓC TÁCH KHỐI LƯỢNG (TT 12/2021/TT-BXD)</h2>

        <h3 class="pdf-h3">1.1. Quy mô và Thông số kỹ thuật đầu vào</h3>
        <table class="pdf-table">
          <tr>
            <td class="td-k" style="width:24%;">Loại công trình</td>
            <td class="td-l" style="width:26%;">${escapePdf(pType)}</td>
            <td class="td-k" style="width:24%;">Khu vực thi công</td>
            <td class="td-l" style="width:26%;">${escapePdf(region)}</td>
          </tr>
          <tr>
            <td class="td-k">Diện tích 1 sàn / Số tầng</td>
            <td class="td-l">${escapePdf(area)} m² × ${escapePdf(floors)} tầng (H<sub>t</sub> = ${escapePdf(floorH)} m)</td>
            <td class="td-k">Tầng hầm / Bán hầm</td>
            <td class="td-l">${escapePdf(basement)}</td>
          </tr>
          <tr>
            <td class="td-k">Giải pháp móng</td>
            <td class="td-l">${escapePdf(found)}</td>
            <td class="td-k">Kết cấu mái</td>
            <td class="td-l">${escapePdf(roof)}</td>
          </tr>
          <tr>
            <td class="td-k">Cấp bê tông / Mác thép</td>
            <td class="td-l">${escapePdf(conc)} / ${escapePdf(steelGrade)}</td>
            <td class="td-k">Gói hoàn thiện / Vật liệu</td>
            <td class="td-l">${escapePdf(pkg)} (${isEco ? 'Vật liệu xanh EcoBuild' : 'Vật liệu truyền thống'})</td>
          </tr>
        </table>

        <h3 class="pdf-h3">1.2. Tổng hợp Kinh phí Dự toán &amp; Chỉ tiêu Kinh tế – Kỹ thuật</h3>
        <table class="pdf-table">
          <tr>
            <td class="td-k" style="width:25%;">Tổng diện tích quy đổi</td>
            <td class="td-l" style="width:25%; font-weight:700;">${escapePdf(builtArea)}</td>
            <td class="td-k" style="width:25%;">Tổng mức đầu tư dự kiến</td>
            <td class="td-l" style="width:25%; font-weight:700; color:#65121b;">${escapePdf(totalCost)}</td>
          </tr>
          <tr>
            <td class="td-k">Chi phí Phần thô &amp; Nhân công</td>
            <td class="td-l">${escapePdf(rawCost)}</td>
            <td class="td-k">Chi phí Hoàn thiện &amp; MEP</td>
            <td class="td-l">${escapePdf(finishCost)}</td>
          </tr>
          <tr>
            <td class="td-k">Bê tông kết cấu</td>
            <td class="td-l">${escapePdf(concrete)}</td>
            <td class="td-k">Cốt thép chịu lực</td>
            <td class="td-l">${escapePdf(steel)}</td>
          </tr>
          <tr>
            <td class="td-k">Xi măng xây trát</td>
            <td class="td-l">${escapePdf(cement)}</td>
            <td class="td-k">Khối xây tường</td>
            <td class="td-l">${escapePdf(brick)}</td>
          </tr>
          <tr>
            <td class="td-k">Giảm phát thải Carbon (CO₂)</td>
            <td class="td-l" style="font-weight:700; color:#047857;">${escapePdf(co2)}</td>
            <td class="td-k">Tiết kiệm điện làm mát</td>
            <td class="td-l" style="font-weight:700; color:#0369a1;">${escapePdf(elec)}</td>
          </tr>
        </table>

        ${boqRowsHtml ? `
          <h3 class="pdf-h3">1.3. Bảng Bóc tách Khối lượng &amp; Dự toán Chi tiết (BOQ – ĐVT: VNĐ)</h3>
          <table class="pdf-table">
            <thead>
              <tr style="background:#f1f5f9;">
                <th class="th-c">Mã CT</th>
                <th class="th-l">Hạng mục Công tác &amp; Quy cách Kỹ thuật</th>
                <th class="th-c">ĐVT</th>
                <th class="th-r">Khối lượng</th>
                <th class="th-r">Đơn giá (đ)</th>
                <th class="th-r">Thành tiền (đ)</th>
              </tr>
            </thead>
            <tbody>${boqRowsHtml}</tbody>
          </table>
        ` : ''}
      </div>
    `;
  }

  // =========================================================================
  // PHẦN II. KIỂM TRA KẾT CẤU & ÁP DỤNG TIÊU CHUẨN XÂY DỰNG VIỆT NAM (TCVN)
  // =========================================================================
  if (selected.includes('tcvn')) {
    // 2.1. Tính lại chính xác số liệu Kiểm tra Tiết diện & Bảo vệ
    const spanM = parseFloat(document.getElementById('chk-span')?.value) || 6.0;
    const beamH = parseFloat(document.getElementById('chk-beam-h')?.value) || 500;
    const slabH = parseFloat(document.getElementById('chk-slab-h')?.value) || 120;
    const coverMm = parseFloat(document.getElementById('chk-cover')?.value) || 25;
    const env = document.getElementById('chk-env')?.value || 'indoor';
    const envName = document.getElementById('chk-env')?.selectedOptions?.[0]?.text || 'Trong nhà';

    const minBeamH = Math.round((spanM * 1000) / 12);
    const maxBeamH = Math.round((spanM * 1000) / 8);
    const minCover = env === 'indoor' ? 25 : env === 'outdoor' ? 30 : env === 'foundation' ? 40 : 50;
    const minSlabH = Math.max(100, Math.round((spanM * 1000) / 45));

    const beamOk = beamH >= minBeamH;
    const coverOk = coverMm >= minCover;
    const slabOk = slabH >= minSlabH;

    // 2.2. Số liệu Tính cốt thép Dầm chịu uốn (TCVN 5574:2018)
    const rcM = parseFloat(document.getElementById('rc-moment')?.value) || 140;
    const rcB = parseFloat(document.getElementById('rc-b')?.value) || 250;
    const rcH = parseFloat(document.getElementById('rc-h')?.value) || 500;
    const rcA = parseFloat(document.getElementById('rc-a')?.value) || 40;
    const rcConc = document.getElementById('rc-concrete')?.value || 'B25';
    const rcSteel = document.getElementById('rc-steel')?.value || 'CB400-V';
    const rbMap = { B20: 11.5, 'B22.5': 13.0, B25: 14.5, B30: 17.0, B35: 19.5 };
    const rsMap = { 'CB300-V': 260, 'CB400-V': 350, 'CB500-V': 435 };
    const xiRMap = { 'CB300-V': 0.583, 'CB400-V': 0.533, 'CB500-V': 0.493 };
    const Rb = rbMap[rcConc] || 14.5;
    const Rs = rsMap[rcSteel] || 350;
    const xiR = xiRMap[rcSteel] || 0.533;
    const alphaR = xiR * (1 - 0.5 * xiR);
    const h0 = rcH - rcA;
    const alphaM = (rcM * 1e6) / (Rb * rcB * h0 * h0);
    let rebarSummary = '';
    if (alphaM > alphaR) {
      const hSug = Math.ceil((Math.sqrt((rcM * 1e6) / (alphaR * Rb * rcB)) + rcA) / 50) * 50;
      rebarSummary = `KHÔNG ĐẠT (αm = ${alphaM.toFixed(3)} > αR = ${alphaR.toFixed(3)}) — Nguy cơ phá hoại giòn, cần tăng h ≥ ${hSug} mm`;
    } else {
      const xi = 1 - Math.sqrt(Math.max(0, 1 - 2 * alphaM));
      const AsDesign = Math.max((xi * Rb * rcB * h0) / Rs, 0.001 * rcB * h0);
      const mu = (AsDesign / (rcB * h0)) * 100;
      rebarSummary = `ĐẠT (αm = ${alphaM.toFixed(3)} ≤ αR = ${alphaR.toFixed(3)}) • As = ${Math.round(AsDesign)} mm² (${(AsDesign / 100).toFixed(2)} cm²) • μ = ${mu.toFixed(2)}%`;
    }

    // 2.3. Số liệu Neo & Nối chồng (TCVN 5574:2018)
    const ancD = parseFloat(document.getElementById('anc-dia')?.value) || 18;
    const ancConc = document.getElementById('anc-concrete')?.value || 'B25';
    const ancSteel = document.getElementById('anc-steel')?.value || 'CB400-V';
    const ancStress = document.getElementById('anc-stress')?.value || 'tension';
    const ancRatio = document.getElementById('anc-ratio')?.value || '50';
    const rbtMap = { B15: 0.75, B20: 0.90, 'B22.5': 0.98, B25: 1.05, B30: 1.15, B35: 1.30 };
    const rsAncMap = { 'CB240-T': 210, 'CB300-V': 260, 'CB400-V': 350, 'CB500-V': 435 };
    const Rbt = rbtMap[ancConc] || 1.05;
    const RsAnc = rsAncMap[ancSteel] || 350;
    const Rbond = (ancSteel === 'CB240-T' ? 1.5 : 2.5) * Rbt;
    const l0an = (RsAnc * ancD) / (4 * Rbond);
    const lan = Math.ceil(Math.max((ancStress === 'tension' ? 1.0 : 0.75) * l0an, 15 * ancD, 200) / 10) * 10;
    const llap = Math.ceil(Math.max((ancStress === 'compression' ? 0.9 : (ancRatio === '100' ? 2.0 : 1.2)) * l0an, 20 * ancD, 250) / 10) * 10;

    // 2.4. Số liệu Tải trọng (TCVN 2737:2023), Nền móng (TCVN 9362), Động đất & PCCC
    const roomLabel = document.getElementById('load-room-type')?.selectedOptions?.[0]?.text || '--';
    const windZone = document.getElementById('wind-zone')?.selectedOptions?.[0]?.text || 'Vùng III';
    const windTer = document.getElementById('wind-terrain')?.value || 'B';
    const windH = document.getElementById('wind-height')?.value || '15';
    const fndN = document.getElementById('fnd-load')?.value || '65';
    const fndR0 = document.getElementById('fnd-r0')?.value || '180';
    const fndHm = document.getElementById('fnd-depth')?.value || '1.6';
    const cityLabel = document.getElementById('seis-city')?.selectedOptions?.[0]?.text || 'TP. Đà Nẵng';
    const pcccLabel = document.getElementById('pccc-height')?.selectedOptions?.[0]?.text || '--';

    const qaEl = document.getElementById('tcvn-chat-output');
    const qaText = qaEl && qaEl.innerText.trim() ? cleanText('tcvn-chat-output') : '';

    sectionsHtml += `
      <div class="pdf-section">
        <h2 class="pdf-h2">PHẦN II. KIỂM TRA KẾT CẤU &amp; ÁP DỤNG TIÊU CHUẨN XÂY DỰNG VIỆT NAM (TCVN)</h2>

        <h3 class="pdf-h3">2.1. Kiểm tra sơ bộ Tiết diện &amp; Lớp bê tông bảo vệ (TCVN 5574:2018)</h3>
        <p class="pdf-note">Điều kiện làm việc: ${escapePdf(envName)} • Nhịp tính toán L = ${spanM} m.</p>
        <table class="pdf-table">
          <thead>
            <tr style="background:#f1f5f9;">
              <th class="th-c" style="width:7%;">STT</th>
              <th class="th-l" style="width:28%;">Nội dung kiểm tra</th>
              <th class="th-c" style="width:15%;">Giá trị chọn</th>
              <th class="th-c" style="width:18%;">Yêu cầu TCVN</th>
              <th class="th-l" style="width:32%;">Kết luận &amp; Hướng xử lý</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="td-c">1</td>
              <td class="td-l">Chiều cao dầm chính (h)</td>
              <td class="td-c" style="font-weight:700;">${beamH} mm</td>
              <td class="td-c">${minBeamH} – ${maxBeamH} mm</td>
              <td class="td-l" style="color:${beamOk ? '#047857' : '#b91c1c'}; font-weight:700;">${beamOk ? 'ĐẠT yêu cầu độ cứng' : `CHƯA ĐẠT — Tăng h ≥ ${Math.ceil(minBeamH / 50) * 50} mm`}</td>
            </tr>
            <tr>
              <td class="td-c">2</td>
              <td class="td-l">Lớp bê tông bảo vệ (c<sub>0</sub>)</td>
              <td class="td-c" style="font-weight:700;">${coverMm} mm</td>
              <td class="td-c">≥ ${minCover} mm (Bảng 19)</td>
              <td class="td-l" style="color:${coverOk ? '#047857' : '#b91c1c'}; font-weight:700;">${coverOk ? 'ĐẠT TCVN 5574:2018' : `VI PHẠM — Tăng c₀ ≥ ${minCover} mm`}</td>
            </tr>
            <tr>
              <td class="td-c">3</td>
              <td class="td-l">Chiều dày bản sàn (h<sub>s</sub>)</td>
              <td class="td-c" style="font-weight:700;">${slabH} mm</td>
              <td class="td-c">≥ ${minSlabH} mm</td>
              <td class="td-l" style="color:${slabOk ? '#047857' : '#b45309'}; font-weight:700;">${slabOk ? 'ĐẠT yêu cầu hạn chế võng' : `LƯU Ý — Tăng hₛ ≥ ${Math.ceil(minSlabH / 10) * 10} mm hoặc thêm dầm phụ`}</td>
            </tr>
          </tbody>
        </table>

        <h3 class="pdf-h3">2.2. Tính toán Cốt thép Dầm, Chiều dài Neo &amp; Nối chồng (TCVN 5574:2018)</h3>
        <table class="pdf-table">
          <tr>
            <td class="td-k" style="width:28%;">Cốt thép Dầm chịu uốn</td>
            <td class="td-l" style="width:72%;">
              Tiết diện b×h = ${rcB}×${rcH} mm (a = ${rcA} mm) • Bê tông ${rcConc} • Thép ${rcSteel} • Mô-men M = ${rcM} kN·m.<br>
              <strong>Kết quả:</strong> ${rebarSummary}
            </td>
          </tr>
          <tr>
            <td class="td-k">Neo &amp; Nối chồng cốt thép</td>
            <td class="td-l">
              Thép Ø${ancD} ${ancSteel} • Bê tông ${ancConc} • ${ancStress === 'tension' ? 'Vùng chịu kéo' : 'Vùng chịu nén'} • Tỷ lệ nối ${ancRatio}%/mặt cắt.<br>
              <strong>Kết quả:</strong> l<sub>0,an</sub> = ${Math.round(l0an)} mm • <strong>l<sub>an</sub> = ${lan} mm (≈ ${Math.ceil(lan / ancD)}d)</strong> • <strong>l<sub>lap</sub> = ${llap} mm (≈ ${Math.ceil(llap / ancD)}d)</strong>.
            </td>
          </tr>
        </table>

        <h3 class="pdf-h3">2.3. Tải trọng (TCVN 2737:2023), Nền móng (TCVN 9362), Động đất &amp; PCCC</h3>
        <table class="pdf-table">
          <tr>
            <td class="td-k" style="width:28%;">Hoạt tải &amp; Tải trọng Gió</td>
            <td class="td-l" style="width:72%;">
              Công năng sàn: ${escapePdf(roomLabel)} (γ<sub>f</sub> = 1.3).<br>
              Tải trọng gió: ${escapePdf(windZone)} • Địa hình dạng ${windTer} • Chiều cao z<sub>e</sub> = ${windH} m (γ<sub>f</sub> = 2.1 theo TCVN 2737:2023).
            </td>
          </tr>
          <tr>
            <td class="td-k">Nền móng, Động đất &amp; PCCC</td>
            <td class="td-l">
              Móng đơn sơ bộ: N = ${fndN} Tấn, R<sub>0</sub> = ${fndR0} kN/m², H<sub>m</sub> = ${fndHm} m.<br>
              Khu vực động đất: ${escapePdf(cityLabel)} (TCVN 9386:2012) • Quy mô PCCC: ${escapePdf(pcccLabel)} (QCVN 06:2022/BXD).
            </td>
          </tr>
        </table>

        ${qaText ? `
          <div class="pdf-card" style="margin-top:8px;">
            <strong>Trích dẫn tra cứu tiêu chuẩn cùng AI gần nhất:</strong><br>${qaText}
          </div>
        ` : ''}
      </div>
    `;
  }

  // =========================================================================
  // PHẦN III. GIÁM SÁT AN TOÀN LAO ĐỘNG (QCVN 18:2021/BXD) & NHẬT KÝ CÔNG TRƯỜNG
  // =========================================================================
  if (selected.includes('siteguard')) {
    const score = document.getElementById('site-score')?.textContent || '--';
    const risk = document.getElementById('site-risk-badge')?.textContent || '--';
    const workers = document.getElementById('site-workers')?.textContent || '--';
    const vText = cleanText('site-violations-list', 'Chưa có dữ liệu kiểm tra ảnh hiện trường.');
    const diaryText = cleanText('site-diary-box', 'Chưa có nhật ký công trường.');
    const imgHtml = AppState.uploadedSiteBase64
      ? `<div style="text-align:center; margin:8px 0; page-break-inside:avoid;"><img src="${AppState.uploadedSiteBase64}" style="max-width:100%; max-height:200px; border:1px solid #94a3b8;" /></div>`
      : '';

    sectionsHtml += `
      <div class="pdf-section">
        <h2 class="pdf-h2">PHẦN III. GIÁM SÁT AN TOÀN LAO ĐỘNG (QCVN 18:2021/BXD) &amp; NHẬT KÝ CÔNG TRƯỜNG</h2>
        <table class="pdf-table">
          <tr>
            <td class="td-k" style="width:20%;">Điểm An toàn HSE</td>
            <td class="td-c" style="width:15%; font-weight:700;">${escapePdf(score)}</td>
            <td class="td-k" style="width:18%;">Mức độ rủi ro</td>
            <td class="td-c" style="width:17%; font-weight:700;">${escapePdf(risk)}</td>
            <td class="td-k" style="width:15%;">Bảo hộ PPE</td>
            <td class="td-c" style="width:15%;">${escapePdf(workers)}</td>
          </tr>
        </table>
        ${imgHtml}
        <div class="pdf-card" style="margin-top:6px;">
          <strong>1. Kết quả kiểm tra vi phạm &amp; vùng nguy hiểm:</strong><br>${vText}
        </div>
        <div class="pdf-card" style="margin-top:6px;">
          <strong>2. Nhật ký thi công &amp; biên bản nhắc nhở an toàn:</strong><br>${diaryText}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // PHẦN IV. KIỂM ĐỊNH, CHẨN ĐOÁN BỆNH HỌC CÔNG TRÌNH & DỰ TOÁN SỬA CHỮA
  // =========================================================================
  if (selected.includes('crackdoctor')) {
    const comp = document.getElementById('crack-component')?.textContent || '--';
    const type = document.getElementById('crack-type')?.textContent || '--';
    const width = document.getElementById('crack-width')?.textContent || '--';
    const sev = document.getElementById('crack-severity')?.textContent || '--';
    const cause = cleanText('crack-cause', 'Chưa có dữ liệu chẩn đoán.');
    const steps = cleanText('crack-steps', 'Chưa có phác đồ xử lý.');
    const imgHtml = AppState.uploadedCrackBase64
      ? `<div style="text-align:center; margin:8px 0; page-break-inside:avoid;"><img src="${AppState.uploadedCrackBase64}" style="max-width:100%; max-height:200px; border:1px solid #94a3b8;" /></div>`
      : '';

    let repairRowsHtml = '';
    const matsEl = document.getElementById('crack-materials');
    if (matsEl) {
      const trs = Array.from(matsEl.querySelectorAll('tr'));
      repairRowsHtml = trs.map(tr => {
        const tds = Array.from(tr.querySelectorAll('td'));
        if (tds.length >= 3) {
          return `
            <tr style="page-break-inside:avoid;">
              <td class="td-l">${escapePdf(tds[0].innerText.trim())}</td>
              <td class="td-c">${escapePdf(tds[1].innerText.trim())}</td>
              <td class="td-r" style="font-weight:700;">${escapePdf(tds[2].innerText.trim())}</td>
            </tr>
          `;
        } else if (tds.length === 2) {
          return `
            <tr style="page-break-inside:avoid; background:#f8f0f1;">
              <td colspan="2" class="td-r" style="font-weight:700; color:#65121b;">${escapePdf(tds[0].innerText.trim())}</td>
              <td class="td-r" style="font-weight:700; color:#65121b;">${escapePdf(tds[1].innerText.trim())}</td>
            </tr>
          `;
        }
        return '';
      }).join('');
    }

    sectionsHtml += `
      <div class="pdf-section">
        <h2 class="pdf-h2">PHẦN IV. KIỂM ĐỊNH BỆNH HỌC CÔNG TRÌNH &amp; DỰ TOÁN SỬA CHỮA</h2>
        ${imgHtml}
        <table class="pdf-table">
          <tr>
            <td class="td-k" style="width:22%;">Cấu kiện khảo sát</td>
            <td class="td-l" style="width:28%;">${escapePdf(comp)}</td>
            <td class="td-k" style="width:22%;">Phân loại vết nứt</td>
            <td class="td-l" style="width:28%;">${escapePdf(type)}</td>
          </tr>
          <tr>
            <td class="td-k">Bề rộng ước tính</td>
            <td class="td-l">${escapePdf(width)}</td>
            <td class="td-k">Mức độ an toàn</td>
            <td class="td-l" style="font-weight:700; color:#b91c1c;">${escapePdf(sev)}</td>
          </tr>
        </table>
        <div class="pdf-card" style="margin-top:6px;">
          <strong>Chẩn đoán nguyên nhân:</strong><br>${cause}<br><br>
          <strong>Phác đồ xử lý &amp; gia cường đề xuất:</strong><br>${steps}
        </div>
        ${repairRowsHtml ? `
          <h3 class="pdf-h3">Bảng Dự toán Vật tư &amp; Hóa chất Sửa chữa</h3>
          <table class="pdf-table">
            <thead>
              <tr style="background:#f1f5f9;">
                <th class="th-l">Hạng mục vật tư / Hóa chất</th>
                <th class="th-c">Khối lượng</th>
                <th class="th-r">Thành tiền (VNĐ)</th>
              </tr>
            </thead>
            <tbody>${repairRowsHtml}</tbody>
          </table>
        ` : ''}
      </div>
    `;
  }

  // =========================================================================
  // PHẦN V. TỔNG HỢP CHỈ SỐ TOÀN DỰ ÁN
  // =========================================================================
  if (selected.includes('dashboard')) {
    const kCost = document.getElementById('dash-kpi-cost')?.textContent || 'Chưa có dữ liệu';
    const kSafe = document.getElementById('dash-kpi-safety')?.textContent || 'Chưa có dữ liệu';
    const kCarb = document.getElementById('dash-kpi-carbon')?.textContent || 'Chưa có dữ liệu';
    const kStru = document.getElementById('dash-kpi-struct')?.textContent || 'Chưa có dữ liệu';

    sectionsHtml += `
      <div class="pdf-section" style="page-break-inside:avoid;">
        <h2 class="pdf-h2">PHẦN V. TỔNG HỢP CHỈ SỐ KINH TẾ – KỸ THUẬT TOÀN DỰ ÁN</h2>
        <table class="pdf-table">
          <thead>
            <tr style="background:#f1f5f9;">
              <th class="th-c">Tổng mức đầu tư</th>
              <th class="th-c">Điểm An toàn HSE</th>
              <th class="th-c">Giảm phát thải CO₂</th>
              <th class="th-c">Đánh giá Kết cấu &amp; TCVN</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="td-c" style="font-weight:700; padding:8px;">${escapePdf(kCost)}</td>
              <td class="td-c" style="font-weight:700; padding:8px;">${escapePdf(kSafe)}</td>
              <td class="td-c" style="font-weight:700; padding:8px;">${escapePdf(kCarb)}</td>
              <td class="td-c" style="font-weight:700; padding:8px;">${escapePdf(kStru)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }

  // Dựng văn bản chuẩn thể thức Nhà nước (Nghị định 30/2020/NĐ-CP) — bề rộng 661px (= 175mm chuẩn A4 lề Trái 20mm, Phải 15mm)
  const pdfWrapper = document.createElement('div');
  pdfWrapper.id = 'pdf-render-sandbox';
  pdfWrapper.style.cssText = 'width:661px; box-sizing:border-box; background:#ffffff; color:#0f172a; padding:0; margin:0; font-family:"Times New Roman", Times, serif; font-size:12px; line-height:1.45;';
  pdfWrapper.innerHTML = `
    <style>
      #pdf-render-sandbox, #pdf-render-sandbox * { box-sizing: border-box !important; max-width: 100% !important; background-image: none !important; font-family: "Times New Roman", Times, serif !important; }
      #pdf-render-sandbox .pdf-section { margin-bottom: 14px; }
      #pdf-render-sandbox .pdf-h2 { font-size: 13px; font-weight: 700; color: #65121b; border-bottom: 1.5px solid #65121b; padding-bottom: 3px; margin: 12px 0 8px 0; text-transform: uppercase; page-break-after: avoid; break-after: avoid; }
      #pdf-render-sandbox .pdf-h3 { font-size: 12px; font-weight: 700; color: #0f172a; margin: 8px 0 4px 0; page-break-after: avoid; break-after: avoid; }
      #pdf-render-sandbox .pdf-note { font-size: 11px; font-style: italic; color: #334155; margin: 0 0 5px 0; }
      #pdf-render-sandbox .pdf-table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 8px; }
      #pdf-render-sandbox .pdf-table tr { page-break-inside: avoid; break-inside: avoid; }
      #pdf-render-sandbox .th-c { border: 1px solid #475569; padding: 5px 4px; text-align: center; font-weight: 700; color: #0f172a; }
      #pdf-render-sandbox .th-l { border: 1px solid #475569; padding: 5px 6px; text-align: left; font-weight: 700; color: #0f172a; }
      #pdf-render-sandbox .th-r { border: 1px solid #475569; padding: 5px 6px; text-align: right; font-weight: 700; color: #0f172a; }
      #pdf-render-sandbox .td-k { border: 1px solid #64748b; padding: 5px 6px; text-align: left; font-weight: 700; background: #f8fafc; color: #0f172a; vertical-align: top; }
      #pdf-render-sandbox .td-l { border: 1px solid #64748b; padding: 5px 6px; text-align: left; color: #0f172a; vertical-align: top; }
      #pdf-render-sandbox .td-c { border: 1px solid #64748b; padding: 5px 4px; text-align: center; color: #0f172a; vertical-align: top; }
      #pdf-render-sandbox .td-r { border: 1px solid #64748b; padding: 5px 6px; text-align: right; color: #0f172a; vertical-align: top; }
      #pdf-render-sandbox .pdf-card { border: 1px solid #94a3b8; background: #f8fafc; padding: 7px 9px; font-size: 11px; line-height: 1.5; color: #0f172a; page-break-inside: avoid; break-inside: avoid; }
    </style>

    <!-- TÊN HỒ SƠ KỸ THUẬT -->
    <div style="text-align:center; margin:0 0 14px 0; padding-bottom:8px; border-bottom:2px double #65121b;">
      <div style="font-size:15px; font-weight:700; text-transform:uppercase; color:#0f172a; letter-spacing:0.3px;">HỒ SƠ KỸ THUẬT &amp; THUYẾT MINH TÍNH TOÁN CÔNG TRÌNH</div>
      <div style="font-size:12.5px; font-weight:700; color:#65121b; margin-top:3px;">${escapePdf(projectName)}</div>
      <div style="font-size:10.5px; font-style:italic; color:#475569; margin-top:3px;">Ngày xuất hồ sơ: ${dd}/${mm}/${yyyy} • Hệ thống Kiến Tạo Xây Dựng Số AI – Khoa Xây Dựng, Đại Học Duy Tân</div>
    </div>

    ${sectionsHtml}

    <div style="margin-top:14px; border-top:1px solid #cbd5e1; padding-top:6px; text-align:center; font-size:10px; color:#64748b;">
      © ${yyyy} Kiến Tạo Xây Dựng Số AI • Khoa Xây Dựng • Đại Học Duy Tân (DTU)
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
        margin: [15, 15, 15, 20], // Chuẩn Nghị định 30/2020/NĐ-CP: Trên 15, Phải 15, Dưới 15, Trái 20 (mm)
        filename: `${safeFileName}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
          width: 661,
          windowWidth: 661,
          onclone: (clonedDoc) => {
            clonedDoc.documentElement.style.cssText = 'margin:0 !important; padding:0 !important; width:661px !important; background:#ffffff !important; overflow:visible !important;';
            clonedDoc.body.style.cssText = 'display:block !important; margin:0 !important; padding:0 !important; width:661px !important; background:#ffffff !important; overflow:visible !important; background-image:none !important;';
            Array.from(clonedDoc.body.children).forEach(child => {
              if (!child.classList || !child.classList.contains('html2pdf__overlay')) {
                child.style.setProperty('display', 'none', 'important');
              } else {
                child.style.cssText = 'position:static !important; left:0 !important; top:0 !important; width:661px !important; height:auto !important; margin:0 !important; padding:0 !important; opacity:1 !important; overflow:visible !important; background:#ffffff !important;';
                const innerContainer = child.querySelector('.html2pdf__container');
                if (innerContainer) {
                  innerContainer.style.cssText = 'position:static !important; left:0 !important; top:0 !important; width:661px !important; margin:0 !important; padding:0 !important;';
                }
              }
            });
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'], avoid: ['tr', '.pdf-card', 'h2', 'h3'] }
      })
      .from(pdfWrapper)
      .save();

    recordAdminUsage('pdf', `Xuất Hồ sơ Kỹ thuật PDF: ${safeFileName}.pdf`);
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
// 10. KẾT NỐI ĐỒNG BỘ VỚI ỨNG DỤNG DTU ADMIN APP (LOCAL + FIREBASE CLOUD)
// ============================================================================

const DEFAULT_FIREBASE_URL = 'https://admin1-404b9-default-rtdb.asia-southeast1.firebasedatabase.app';

function getMainFirebaseUrl() {
  const saved = localStorage.getItem('dtu_firebase_rtdb_url');
  if (saved === '__OFF__') return '';
  return ((saved || DEFAULT_FIREBASE_URL) || '').trim().replace(/\/+$/, '');
}

function getAdminOverrides() {
  try {
    const raw = localStorage.getItem('dtu_admin_config_v1');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function recordAdminUsage(category, actionLabel) {
  try {
    const key = 'dtu_usage_stats_v1';
    const raw = localStorage.getItem(key);
    const stats = raw ? JSON.parse(raw) : { estimator: 0, tcvn: 0, siteguard: 0, crackdoctor: 0, pdf: 0, logs: [] };
    if (typeof stats[category] === 'number') stats[category] += 1;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} ${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}`;
    stats.logs = [{ action: actionLabel, time: timeStr }, ...(Array.isArray(stats.logs) ? stats.logs : [])].slice(0, 30);
    localStorage.setItem(key, JSON.stringify(stats));

    const fbUrl = getMainFirebaseUrl();
    if (fbUrl) {
      fetch(`${fbUrl}/dtu_usage_stats.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats)
      }).catch(() => {});
    }
  } catch {
    // ignore storage quota errors
  }
}

function applyAdminConfigToApp(cfg) {
  if (!cfg || typeof cfg !== 'object') return;

  // 1. Áp dụng thanh thông báo toàn hệ thống
  const noticeEl = document.getElementById('admin-global-notice');
  if (noticeEl) {
    if (cfg.notice && cfg.notice.enabled && cfg.notice.text) {
      const styleMap = {
        info: 'background:#eff6ff; border-color:#bfdbfe; color:#1e40af;',
        success: 'background:#ecfdf5; border-color:#a7f3d0; color:#065f46;',
        warning: 'background:#fffbeb; border-color:#fde68a; color:#92400e;'
      };
      noticeEl.style.cssText = styleMap[cfg.notice.type] || styleMap.info;
      noticeEl.textContent = `Thông báo từ Quản trị viên DTU: ${cfg.notice.text}`;
      noticeEl.classList.remove('hidden');
    } else {
      noticeEl.classList.add('hidden');
    }
  }

  // 2. Cập nhật đơn giá vật tư sửa chữa (Mục 4)
  if (cfg.prices && typeof STANDARD_REPAIR_CATALOG !== 'undefined') {
    if (cfg.prices.epoxy) STANDARD_REPAIR_CATALOG.sikadur_752.unitPrice = cfg.prices.epoxy;
    if (cfg.prices.cfrp) STANDARD_REPAIR_CATALOG.cfrp_wrap.unitPrice = cfg.prices.cfrp;
    if (cfg.prices.sikatop) STANDARD_REPAIR_CATALOG.sikatop_107.unitPrice = cfg.prices.sikatop;
  }

  // 3. Nạp các điều khoản TCVN bổ sung từ Admin
  if (Array.isArray(cfg.customTcvn) && typeof TCVN_KNOWLEDGE !== 'undefined') {
    cfg.customTcvn.forEach(item => {
      if (item && item.code && !TCVN_KNOWLEDGE.some(k => k.code === item.code && k.title === item.title)) {
        TCVN_KNOWLEDGE.unshift(item);
      }
    });
  }

  // 4. Tự động kết nối Gemini AI bằng API Key dùng chung tạm thời (cấu hình qua Firebase Admin — KHÔNG lộ key trên GitHub)
  const sharedKey = (cfg.sharedApiKey || '').trim();
  const userOwnKey = (localStorage.getItem('VIETBUILD_GEMINI_KEY') || '').trim();
  if (sharedKey && !userOwnKey && !AppState.apiVerified) {
    AppState.apiKey = sharedKey;
    AppState.aiMode = 'gemini';
    AppState.usingSharedKey = true;
    toggleAIMode('gemini');
    setLinkedUIState(true);
    connectAndVerifyGeminiKey(sharedKey);
  }
}

async function initAdminBridgeSync() {
  applyAdminConfigToApp(getAdminOverrides());
  const fbUrl = getMainFirebaseUrl();
  if (!fbUrl) return;
  try {
    const res = await fetch(`${fbUrl}/dtu_admin_config.json?t=${Date.now()}`);
    if (res.ok) {
      const remote = await res.json();
      if (remote && typeof remote === 'object') {
        localStorage.setItem('dtu_admin_config_v1', JSON.stringify(remote));
        applyAdminConfigToApp(remote);
        calculateEstimation(false);
      }
    }
  } catch {
    // offline fallback silently
  }
}

window.addEventListener('focus', () => {
  initAdminBridgeSync();
});

// ============================================================================
// 11. HỖ TRỢ CÀI ĐẶT ỨNG DỤNG PWA TRÊN ĐIỆN THOẠI (iOS & ANDROID)
// ============================================================================

let mainDeferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  mainDeferredInstallPrompt = e;
});

async function triggerMainInstallPWA() {
  closeMobileSidebar();
  if (mainDeferredInstallPrompt) {
    mainDeferredInstallPrompt.prompt();
    await mainDeferredInstallPrompt.userChoice;
    mainDeferredInstallPrompt = null;
  } else {
    document.getElementById('main-install-pwa-modal')?.classList.remove('hidden');
    if (typeof lucide !== 'undefined' && lucide.createIcons) lucide.createIcons();
  }
}

function closeMainInstallModal() {
  document.getElementById('main-install-pwa-modal')?.classList.add('hidden');
}

// Vuốt từ cạnh trái sang phải để mở thanh bên Sidebar trên điện thoại, vuốt ngược sang trái để đóng (vẫn giữ nút 3 gạch)
(function initMobileSidebarSwipeGesture() {
  let startX = 0;
  let startY = 0;
  let tracking = false;
  let startedInScrollableTable = false;

  document.addEventListener('touchstart', (e) => {
    if (window.innerWidth >= 1024 || e.touches.length !== 1) return;
    const t = e.touches[0];
    startX = t.clientX;
    startY = t.clientY;
    startedInScrollableTable = Boolean(e.target && e.target.closest && e.target.closest('.overflow-x-auto'));
    const sidebar = document.getElementById('main-sidebar');
    const isOpen = sidebar && !sidebar.classList.contains('-translate-x-full');
    // Cho phép vuốt mở từ vùng bên trái (0..65px) hoặc vuốt đóng khi sidebar đang mở
    tracking = isOpen || startX <= 65 || (!startedInScrollableTable && startX <= 110);
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!tracking || window.innerWidth >= 1024 || !e.changedTouches || !e.changedTouches.length) return;
    tracking = false;
    const t = e.changedTouches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;
    // Chỉ kích hoạt khi vuốt ngang rõ ràng (> 55px và ngang áp đảo dọc)
    if (Math.abs(dx) < 55 || Math.abs(dx) < Math.abs(dy) * 1.4) return;

    const sidebar = document.getElementById('main-sidebar');
    if (!sidebar) return;
    const isOpen = !sidebar.classList.contains('-translate-x-full');

    if (dx > 55 && !isOpen) {
      if (typeof openMobileSidebar === 'function') openMobileSidebar();
    } else if (dx < -55 && isOpen) {
      if (typeof closeMobileSidebar === 'function') closeMobileSidebar();
    }
  }, { passive: true });
})();

// ============================================================================
// 12. TRÌNH ĐỌC & TRÍCH XUẤT BẢN VẼ KỸ THUẬT CAD / BIM (.DXF, .IFC, .DWG, .RVT, ẢNH)
// ============================================================================

let lastCadBimExtracted = null;

function handleCadBimFileUpload(event) {
  const files = Array.from(event?.target?.files || []);
  if (!files.length) return;

  // Nếu người dùng chọn 1 hoặc NHIỀU ảnh bản vẽ mặt bằng (VD: Tầng 1, Tầng 2, TMB...)
  const imageFiles = files.filter(f => f.type && f.type.startsWith('image/'));
  if (imageFiles.length > 0) {
    const readImage = (f) => new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve({
        name: f.name,
        mimeType: f.type || 'image/jpeg',
        base64: String(e.target.result || '')
      });
      reader.readAsDataURL(f);
    });
    Promise.all(imageFiles.slice(0, 8).map(readImage)).then((imgItems) => {
      analyzeBlueprintImagesWithAI(imgItems);
    });
    return;
  }

  const file = files[0];
  const name = file.name || '';
  const ext = name.split('.').pop().toLowerCase();
  document.getElementById('cadbim-gallery')?.classList.add('hidden');

  if (ext === 'dxf') {
    const reader = new FileReader();
    reader.onload = (e) => parseAndRenderDXF(String(e.target.result || ''), name);
    reader.readAsText(file);
  } else if (ext === 'ifc') {
    const reader = new FileReader();
    reader.onload = (e) => parseAndRenderIFC(String(e.target.result || ''), name);
    reader.readAsText(file);
  } else if (ext === 'dwg' || ext === 'rvt') {
    const reader = new FileReader();
    reader.onload = (e) => inspectBinaryCadHeader(new Uint8Array(e.target.result), name, ext, file.size);
    reader.readAsArrayBuffer(file.slice(0, 64));
  } else {
    const box = document.getElementById('cadbim-result-box');
    if (box) {
      box.innerHTML = `<div class="text-rose-700 font-semibold">Định dạng tệp "${name}" chưa hỗ trợ. Vui lòng chọn tệp .dxf, .ifc, .dwg, .rvt hoặc 1–8 ảnh mặt bằng (.png, .jpg).</div>`;
    }
  }
}

function parseAndRenderDXF(dxfText, fileName) {
  const lines = dxfText.replace(/\r\n/g, '\n').split('\n');
  const entities = [];
  const layers = new Set();
  const texts = [];
  let inEntities = false;
  let current = null;
  let polyPts = [];

  for (let i = 0; i < lines.length - 1; i += 2) {
    const code = lines[i].trim();
    const val = (lines[i + 1] || '').trim();

    if (code === '0' && val === 'SECTION') {
      continue;
    }
    if (code === '2' && val === 'ENTITIES') {
      inEntities = true;
      continue;
    }
    if (code === '0' && val === 'ENDSEC' && inEntities) {
      if (current) {
        if (polyPts.length) current.points = polyPts;
        entities.push(current);
      }
      inEntities = false;
      current = null;
      polyPts = [];
      continue;
    }
    if (!inEntities) continue;

    if (code === '0') {
      if (current) {
        if (polyPts.length) current.points = polyPts;
        entities.push(current);
      }
      current = { type: val, layer: '0' };
      polyPts = [];
      continue;
    }
    if (!current) continue;

    if (code === '8') {
      current.layer = val;
      layers.add(val);
    } else if (current.type === 'LINE') {
      if (code === '10') current.x1 = parseFloat(val);
      if (code === '20') current.y1 = parseFloat(val);
      if (code === '11') current.x2 = parseFloat(val);
      if (code === '21') current.y2 = parseFloat(val);
    } else if (current.type === 'LWPOLYLINE') {
      if (code === '10') polyPts.push({ x: parseFloat(val), y: 0 });
      if (code === '20' && polyPts.length) polyPts[polyPts.length - 1].y = parseFloat(val);
      if (code === '70') current.closed = (parseInt(val, 10) & 1) === 1;
    } else if (current.type === 'CIRCLE') {
      if (code === '10') current.cx = parseFloat(val);
      if (code === '20') current.cy = parseFloat(val);
      if (code === '40') current.r = parseFloat(val);
    } else if (current.type === 'TEXT' || current.type === 'MTEXT') {
      if (code === '1' && val) texts.push(val);
    }
  }

  // Tính kích thước bao & tổng chiều dài nét vẽ
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  let totalLineLength = 0;
  let countLines = 0, countPolys = 0, countCircles = 0, countInserts = 0;

  const trackPt = (x, y) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  entities.forEach(ent => {
    if (ent.type === 'LINE' && Number.isFinite(ent.x1) && Number.isFinite(ent.x2)) {
      countLines++;
      trackPt(ent.x1, ent.y1);
      trackPt(ent.x2, ent.y2);
      totalLineLength += Math.hypot(ent.x2 - ent.x1, ent.y2 - ent.y1);
    } else if (ent.type === 'LWPOLYLINE' && ent.points && ent.points.length >= 2) {
      countPolys++;
      for (let i = 0; i < ent.points.length; i++) {
        trackPt(ent.points[i].x, ent.points[i].y);
        if (i > 0) {
          totalLineLength += Math.hypot(ent.points[i].x - ent.points[i - 1].x, ent.points[i].y - ent.points[i - 1].y);
        }
      }
      if (ent.closed) {
        const a = ent.points[ent.points.length - 1];
        const b = ent.points[0];
        totalLineLength += Math.hypot(b.x - a.x, b.y - a.y);
      }
    } else if (ent.type === 'CIRCLE' && Number.isFinite(ent.cx)) {
      countCircles++;
      trackPt(ent.cx - (ent.r || 0), ent.cy - (ent.r || 0));
      trackPt(ent.cx + (ent.r || 0), ent.cy + (ent.r || 0));
    } else if (ent.type === 'INSERT') {
      countInserts++;
    }
  });

  // Chuẩn hóa đơn vị (nếu kích thước > 200 coi là mm -> quy đổi ra mét)
  const rawW = Number.isFinite(maxX - minX) ? Math.abs(maxX - minX) : 0;
  const rawH = Number.isFinite(maxY - minY) ? Math.abs(maxY - minY) : 0;
  const isMm = Math.max(rawW, rawH) > 200;
  const scaleToM = isMm ? 0.001 : 1;
  const widthM = +(rawW * scaleToM).toFixed(2);
  const lengthM = +(rawH * scaleToM).toFixed(2);
  const estAreaM2 = Math.max(30, Math.round(widthM * lengthM));
  const totalLenM = +(totalLineLength * scaleToM).toFixed(1);

  // Vẽ xem trước 2D CAD trên Canvas
  const wrap = document.getElementById('cadbim-preview-wrap');
  const canvas = document.getElementById('cadbim-canvas');
  const imgPrev = document.getElementById('cadbim-img-preview');
  const titleEl = document.getElementById('cadbim-preview-title');
  const badgeEl = document.getElementById('cadbim-file-badge');
  if (wrap) wrap.classList.remove('hidden');
  if (imgPrev) imgPrev.classList.add('hidden');
  if (canvas) {
    canvas.classList.remove('hidden');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Nền lưới bản vẽ CAD tối chuẩn kỹ sư
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(148,163,184,0.12)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx < canvas.width; gx += 28) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, canvas.height); ctx.stroke();
    }
    for (let gy = 0; gy < canvas.height; gy += 28) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(canvas.width, gy); ctx.stroke();
    }

    if (rawW > 0 || rawH > 0) {
      const pad = 28;
      const sx = (canvas.width - pad * 2) / Math.max(rawW, 1);
      const sy = (canvas.height - pad * 2) / Math.max(rawH, 1);
      const sc = Math.min(sx, sy);
      const offsetX = (canvas.width - rawW * sc) / 2;
      const offsetY = (canvas.height - rawH * sc) / 2;
      const toX = (x) => offsetX + (x - minX) * sc;
      const toY = (y) => canvas.height - (offsetY + (y - minY) * sc);

      entities.forEach(ent => {
        const layerLow = (ent.layer || '').toLowerCase();
        ctx.strokeStyle = layerLow.includes('col') || layerLow.includes('cot')
          ? '#f87171'
          : layerLow.includes('grid') || layerLow.includes('truc')
            ? '#38bdf8'
            : '#34d399';
        ctx.lineWidth = layerLow.includes('col') || layerLow.includes('cot') ? 2.2 : 1.5;

        if (ent.type === 'LINE' && Number.isFinite(ent.x1) && Number.isFinite(ent.x2)) {
          ctx.beginPath();
          ctx.moveTo(toX(ent.x1), toY(ent.y1));
          ctx.lineTo(toX(ent.x2), toY(ent.y2));
          ctx.stroke();
        } else if (ent.type === 'LWPOLYLINE' && ent.points && ent.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(toX(ent.points[0].x), toY(ent.points[0].y));
          for (let i = 1; i < ent.points.length; i++) {
            ctx.lineTo(toX(ent.points[i].x), toY(ent.points[i].y));
          }
          if (ent.closed) ctx.closePath();
          ctx.stroke();
        } else if (ent.type === 'CIRCLE' && Number.isFinite(ent.cx)) {
          ctx.beginPath();
          ctx.arc(toX(ent.cx), toY(ent.cy), Math.max(2, (ent.r || 0) * sc), 0, Math.PI * 2);
          ctx.stroke();
        }
      });
    }
  }
  if (titleEl) titleEl.textContent = fileName;
  if (badgeEl) badgeEl.textContent = `CAD DXF • ${isMm ? 'mm' : 'm'}`;

  lastCadBimExtracted = {
    source: fileName,
    area: estAreaM2,
    floors: null
  };

  const box = document.getElementById('cadbim-result-box');
  if (box) {
    box.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-200 pb-2">
        <span class="font-bold text-sm text-emerald-700">Đã đọc thành công tệp AutoCAD (.DXF)</span>
        <span class="font-mono-tech text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">${entities.length} đối tượng</span>
      </div>
      <div class="grid grid-cols-2 gap-2.5 pt-1">
        <div class="p-2.5 rounded-xl bg-white border border-slate-200">
          <div class="text-[11px] text-slate-500">Kích thước bao mặt bằng</div>
          <div class="font-mono-tech text-sm font-extrabold text-slate-900">${widthM} m × ${lengthM} m</div>
        </div>
        <div class="p-2.5 rounded-xl bg-white border border-slate-200">
          <div class="text-[11px] text-slate-500">Diện tích sàn ước tính</div>
          <div class="font-mono-tech text-sm font-extrabold text-[#8b1e2b]">${estAreaM2} m²/sàn</div>
        </div>
        <div class="p-2.5 rounded-xl bg-white border border-slate-200">
          <div class="text-[11px] text-slate-500">Tổng chiều dài nét tường/dầm</div>
          <div class="font-mono-tech text-sm font-bold text-slate-800">${totalLenM} md</div>
        </div>
        <div class="p-2.5 rounded-xl bg-white border border-slate-200">
          <div class="text-[11px] text-slate-500">Số lớp Layer &amp; Cấu kiện</div>
          <div class="font-mono-tech text-sm font-bold text-slate-800">${layers.size} layers • ${countLines + countPolys} nét</div>
        </div>
      </div>
      <div class="text-[11px] text-slate-600 pt-1">
        <strong>Chi tiết đối tượng DXF:</strong> LINE (${countLines}), LWPOLYLINE (${countPolys}), CIRCLE (${countCircles}), BLOCK/INSERT (${countInserts}), TEXT (${texts.length}).
        ${texts.length ? `<br><strong>Ghi chú đọc được trong bản vẽ:</strong> ${texts.slice(0, 6).join(' • ')}` : ''}
      </div>
    `;
  }

  const applyBar = document.getElementById('cadbim-apply-bar');
  const applySum = document.getElementById('cadbim-apply-summary');
  if (applyBar && applySum) {
    applySum.textContent = `Sẵn sàng đẩy Diện tích sàn = ${estAreaM2} m² từ bản vẽ "${fileName}" sang Mục 1!`;
    applyBar.classList.remove('hidden');
  }
}

function parseAndRenderIFC(ifcText, fileName) {
  const schemaMatch = ifcText.match(/FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'/i);
  const schema = schemaMatch ? schemaMatch[1] : 'IFC2X3 / IFC4';
  const projMatch = ifcText.match(/IFCPROJECT\s*\([^,]*,[^,]*,'([^']*)'/i);
  const projectName = projMatch && projMatch[1] ? projMatch[1] : fileName;

  const countEntity = (regex) => (ifcText.match(regex) || []).length;
  const storeys = countEntity(/=\s*IFCBUILDINGSTOREY\s*\(/gi);
  const walls = countEntity(/=\s*IFCWALL(?:STANDARDCASE)?\s*\(/gi);
  const columns = countEntity(/=\s*IFCCOLUMN\s*\(/gi);
  const beams = countEntity(/=\s*IFCBEAM\s*\(/gi);
  const slabs = countEntity(/=\s*IFCSLAB\s*\(/gi);
  const footings = countEntity(/=\s*IFCFOOTING\s*\(/gi);
  const doors = countEntity(/=\s*IFCDOOR\s*\(/gi);
  const windows = countEntity(/=\s*IFCWINDOW\s*\(/gi);
  const stairs = countEntity(/=\s*IFCSTAIR(?:FLIGHT)?\s*\(/gi);

  // Ước tính diện tích sàn từ số lượng cấu kiện hoặc đọc IFCQUANTITYAREA nếu có
  const areaMatches = [...ifcText.matchAll(/IFCQUANTITYAREA\s*\([^,]*,[^,]*,[^,]*,\s*([0-9.]+)/gi)].map(m => parseFloat(m[1])).filter(n => n > 10 && n < 5000);
  const estArea = areaMatches.length
    ? Math.round(areaMatches.reduce((a, b) => a + b, 0) / Math.max(1, storeys || 1))
    : Math.max(60, Math.round((columns || 8) * 12));
  const estFloors = Math.max(1, storeys || 3);

  const wrap = document.getElementById('cadbim-preview-wrap');
  const canvas = document.getElementById('cadbim-canvas');
  const imgPrev = document.getElementById('cadbim-img-preview');
  const titleEl = document.getElementById('cadbim-preview-title');
  const badgeEl = document.getElementById('cadbim-file-badge');
  if (wrap) wrap.classList.remove('hidden');
  if (imgPrev) imgPrev.classList.add('hidden');
  if (canvas) {
    canvas.classList.remove('hidden');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Vẽ sơ đồ phân tầng BIM 3D isometric minh họa trực quan số tầng đọc từ IFC
    const floorsDraw = Math.min(8, estFloors);
    const baseY = canvas.height - 46;
    const stepY = Math.min(34, (canvas.height - 90) / Math.max(1, floorsDraw));
    for (let f = 0; f < floorsDraw; f++) {
      const y = baseY - f * stepY;
      ctx.fillStyle = f === 0 ? 'rgba(139, 30, 43, 0.55)' : 'rgba(56, 189, 248, 0.25)';
      ctx.strokeStyle = f === 0 ? '#fda4af' : '#38bdf8';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(280, y - 24);
      ctx.lineTo(430, y);
      ctx.lineTo(280, y + 24);
      ctx.lineTo(130, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillText(`Tầng ${f + 1}`, 445, y + 4);
    }
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`BIM Schema: ${schema} • ${estFloors} tầng • ${columns} Cột • ${beams} Dầm • ${walls} Tường`, 20, 24);
  }
  if (titleEl) titleEl.textContent = projectName;
  if (badgeEl) badgeEl.textContent = `BIM ${schema}`;

  lastCadBimExtracted = {
    source: fileName,
    area: estArea,
    floors: estFloors
  };

  const box = document.getElementById('cadbim-result-box');
  if (box) {
    box.innerHTML = `
      <div class="flex items-center justify-between border-b border-slate-200 pb-2">
        <span class="font-bold text-sm text-emerald-700">Đã đọc thành công mô hình BIM (.IFC)</span>
        <span class="font-mono-tech text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800">${schema}</span>
      </div>
      <div class="text-xs text-slate-700 pt-1"><strong>Tên dự án BIM:</strong> ${projectName}</div>
      <div class="grid grid-cols-3 gap-2 pt-1 font-mono-tech">
        <div class="p-2 rounded-lg bg-white border border-slate-200 text-center"><div class="text-[10px] text-slate-500">Số tầng</div><div class="text-sm font-extrabold text-[#8b1e2b]">${estFloors}</div></div>
        <div class="p-2 rounded-lg bg-white border border-slate-200 text-center"><div class="text-[10px] text-slate-500">Cột (Column)</div><div class="text-sm font-extrabold text-slate-900">${columns}</div></div>
        <div class="p-2 rounded-lg bg-white border border-slate-200 text-center"><div class="text-[10px] text-slate-500">Dầm (Beam)</div><div class="text-sm font-extrabold text-slate-900">${beams}</div></div>
        <div class="p-2 rounded-lg bg-white border border-slate-200 text-center"><div class="text-[10px] text-slate-500">Tường (Wall)</div><div class="text-sm font-extrabold text-slate-900">${walls}</div></div>
        <div class="p-2 rounded-lg bg-white border border-slate-200 text-center"><div class="text-[10px] text-slate-500">Sàn (Slab)</div><div class="text-sm font-extrabold text-slate-900">${slabs}</div></div>
        <div class="p-2 rounded-lg bg-white border border-slate-200 text-center"><div class="text-[10px] text-slate-500">Móng (Footing)</div><div class="text-sm font-extrabold text-slate-900">${footings}</div></div>
      </div>
      <div class="text-[11px] text-slate-600 pt-1">
        <strong>Hoàn thiện kiến trúc:</strong> ${doors} Cửa đi (<code>IFCDOOR</code>) • ${windows} Cửa sổ (<code>IFCWINDOW</code>) • ${stairs} Cầu thang (<code>IFCSTAIR</code>).
      </div>
    `;
  }

  const applyBar = document.getElementById('cadbim-apply-bar');
  const applySum = document.getElementById('cadbim-apply-summary');
  if (applyBar && applySum) {
    applySum.textContent = `Sẵn sàng đẩy Quy mô ${estFloors} tầng × ${estArea} m²/sàn từ mô hình BIM "${fileName}" sang Mục 1!`;
    applyBar.classList.remove('hidden');
  }
}

function inspectBinaryCadHeader(bytes, fileName, ext, fileSize) {
  let headerStr = '';
  for (let i = 0; i < Math.min(bytes.length, 12); i++) {
    headerStr += String.fromCharCode(bytes[i]);
  }
  const dwgVersions = {
    AC1032: 'AutoCAD 2018 – 2026 DWG',
    AC1027: 'AutoCAD 2013 – 2017 DWG',
    AC1024: 'AutoCAD 2010 – 2012 DWG',
    AC1021: 'AutoCAD 2007 – 2009 DWG'
  };
  const code6 = headerStr.slice(0, 6);
  const detected = ext === 'dwg'
    ? (dwgVersions[code6] || `AutoCAD DWG (${code6 || 'Binary'})`)
    : 'Autodesk Revit Project (.RVT Binary)';

  const box = document.getElementById('cadbim-result-box');
  if (box) {
    box.innerHTML = `
      <div class="p-3 rounded-xl fix-guide-box space-y-1.5">
        <div class="font-bold text-sm">Đã nhận diện tệp: ${fileName} (${(fileSize / 1024).toFixed(1)} KB)</div>
        <div><strong>Định dạng phát hiện:</strong> ${detected}</div>
        <div>Vì <strong>.${ext}</strong> là định dạng nhị phân độc quyền đóng của Autodesk (trình duyệt web không giải mã trực tiếp mã nguồn đóng), hãy thực hiện 1 thao tác xuất chuẩn mở (mất 5 giây):</div>
        <div>• ${ext === 'dwg' ? 'Trong <strong>AutoCAD</strong>: chọn <strong>Save As → AutoCAD DXF (*.dxf)</strong> rồi tải lại vào đây để vẽ Canvas 2D &amp; bóc tách tự động.' : 'Trong <strong>Revit</strong>: chọn <strong>File → Export → IFC (*.ifc)</strong> rồi tải lại vào đây để đếm toàn bộ Cột, Dầm, Tường, Sàn, Móng 3D.'}</div>
      </div>
    `;
  }
  document.getElementById('cadbim-apply-bar')?.classList.add('hidden');
}

async function analyzeBlueprintImagesWithAI(imgItems) {
  if (!Array.isArray(imgItems) || !imgItems.length) return;
  const wrap = document.getElementById('cadbim-preview-wrap');
  const canvas = document.getElementById('cadbim-canvas');
  const imgPrev = document.getElementById('cadbim-img-preview');
  const gallery = document.getElementById('cadbim-gallery');
  const titleEl = document.getElementById('cadbim-preview-title');
  const badgeEl = document.getElementById('cadbim-file-badge');

  if (wrap) wrap.classList.remove('hidden');
  if (canvas) canvas.classList.add('hidden');

  if (imgItems.length === 1) {
    if (gallery) gallery.classList.add('hidden');
    if (imgPrev) {
      imgPrev.src = imgItems[0].base64;
      imgPrev.classList.remove('hidden');
    }
    if (titleEl) titleEl.textContent = imgItems[0].name;
    if (badgeEl) badgeEl.textContent = 'AI Vision • 1 bản vẽ';
  } else {
    if (imgPrev) imgPrev.classList.add('hidden');
    if (gallery) {
      gallery.classList.remove('hidden');
      const esc = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      gallery.innerHTML = imgItems.map((it, idx) => `
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-1.5 space-y-1">
          <img src="${it.base64}" alt="${esc(it.name)}" class="w-full h-24 object-contain rounded-lg bg-white" />
          <div class="text-[10px] font-semibold text-slate-700 truncate" title="${esc(it.name)}">${idx + 1}. ${esc(it.name)}</div>
        </div>
      `).join('');
    }
    if (titleEl) titleEl.textContent = `Bộ hồ sơ gồm ${imgItems.length} bản vẽ mặt bằng`;
    if (badgeEl) badgeEl.textContent = `AI Vision • ${imgItems.length} ảnh`;
  }

  const box = document.getElementById('cadbim-result-box');
  if (box) {
    box.innerHTML = `<div class="flex items-center gap-2 text-emerald-700 font-semibold"><span class="animate-spin inline-block w-4 h-4 shrink-0 border-2 border-emerald-600 border-t-transparent rounded-full"></span><span>Gemini Vision AI đang đọc tổng hợp ${imgItems.length} bản vẽ mặt bằng (lưới trục, số tầng, diện tích &amp; cột)...</span></div>`;
  }

  const fileListDesc = imgItems.map((it, idx) => `Ảnh ${idx + 1}: ${it.name}`).join('; ');

  try {
    const prompt = `Bạn là Kỹ sư QS & Kết cấu Việt Nam. Người dùng vừa tải lên bộ hồ sơ gồm ${imgItems.length} ảnh bản vẽ (${fileListDesc}).
Hãy quan sát TẤT CẢ các ảnh bản vẽ đính kèm (từng tầng, tổng mặt bằng, lưới trục, kích thước phủ bì) và trả về DUY NHẤT JSON chuẩn:
{
  "widthM": 5.0,
  "lengthM": 20.0,
  "areaM2": 100,
  "floorsEstimate": 2,
  "columnsEstimate": 12,
  "summary": "Tóm tắt rõ từng bản vẽ đã đọc (VD: Ảnh 1 tầng 1..., Ảnh 2 tầng 2..., Ảnh 3 tổng mặt bằng...), kích thước lưới trục, công năng và lưu ý kết cấu (dùng gạch đầu dòng -, không dùng dấu * hay LaTeX)"
}`;
    const raw = await callGeminiAPI(prompt, imgItems, 'image/jpeg', true);
    const parsed = parseGeminiJsonSafe(raw);
    if (parsed && typeof parsed === 'object') {
      const area = Math.max(30, Math.round(parsed.areaM2 || ((parsed.widthM || 5) * (parsed.lengthM || 20))));
      const floors = Math.max(1, Math.round(parsed.floorsEstimate || Math.min(5, imgItems.length)));
      lastCadBimExtracted = { source: `${imgItems.length} ảnh bản vẽ`, area, floors };
      if (box) {
        box.innerHTML = `
          <div class="font-bold text-sm text-emerald-700 border-b border-slate-200 pb-1.5">Gemini Vision đã đọc tổng hợp ${imgItems.length} Bản vẽ Mặt bằng</div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono-tech">
            <div class="p-2 rounded-lg bg-white border border-slate-200 text-center"><div class="text-[10px] text-slate-500">Kích thước</div><div class="text-xs font-bold">${parsed.widthM || '--'}×${parsed.lengthM || '--'}m</div></div>
            <div class="p-2 rounded-lg bg-white border border-slate-200 text-center"><div class="text-[10px] text-slate-500">Diện tích/sàn</div><div class="text-xs font-extrabold text-[#8b1e2b]">${area} m²</div></div>
            <div class="p-2 rounded-lg bg-white border border-slate-200 text-center"><div class="text-[10px] text-slate-500">Số tầng đọc được</div><div class="text-xs font-extrabold text-sky-700">${floors} tầng</div></div>
            <div class="p-2 rounded-lg bg-white border border-slate-200 text-center"><div class="text-[10px] text-slate-500">Số cột dự kiến</div><div class="text-xs font-bold">${parsed.columnsEstimate || '--'}</div></div>
          </div>
          <div class="pt-1 text-slate-700">${formatAIResponseHTML(parsed.summary || 'Đã hoàn tất phân tích bộ bản vẽ.')}</div>
        `;
      }
      const applyBar = document.getElementById('cadbim-apply-bar');
      const applySum = document.getElementById('cadbim-apply-summary');
      if (applyBar && applySum) {
        applySum.textContent = `Sẵn sàng đẩy Diện tích ${area} m²/sàn × ${floors} tầng (từ ${imgItems.length} bản vẽ) sang Dự toán Mục 1!`;
        applyBar.classList.remove('hidden');
      }
    } else if (box) {
      box.innerHTML = formatAIResponseHTML(raw);
    }
  } catch (err) {
    if (box) {
      box.innerHTML = `<div class="text-rose-700 font-semibold">Không thể phân tích bộ ảnh bản vẽ bằng AI: ${err.message}. Hãy kiểm tra kết nối Gemini API hoặc tải tệp .dxf / .ifc để đọc ngoại tuyến 100%.</div>`;
    }
  }
}

function applyCadBimToEstimator() {
  if (!lastCadBimExtracted) return;
  const areaInput = document.getElementById('est-area');
  const floorsInput = document.getElementById('est-floors');
  if (areaInput && lastCadBimExtracted.area) areaInput.value = lastCadBimExtracted.area;
  if (floorsInput && lastCadBimExtracted.floors) floorsInput.value = lastCadBimExtracted.floors;
  calculateEstimation(true);
  switchEstimatorSubTab('overview');
}

function loadSampleDXF() {
  // Mẫu file DXF chuẩn AutoCAD thật (nhà phố 5m x 20m = 5000mm x 20000mm có tường bao, vách ngăn & lưới cột)
  const sampleDxf = [
    '0', 'SECTION', '2', 'ENTITIES',
    '0', 'LWPOLYLINE', '8', 'WALL', '70', '1',
    '10', '0', '20', '0', '10', '5000', '20', '0', '10', '5000', '20', '20000', '10', '0', '20', '20000',
    '0', 'LINE', '8', 'WALL', '10', '0', '20', '6000', '11', '5000', '21', '6000',
    '0', 'LINE', '8', 'WALL', '10', '0', '20', '12000', '11', '5000', '21', '12000',
    '0', 'LINE', '8', 'WALL', '10', '0', '20', '16500', '11', '5000', '21', '16500',
    '0', 'LINE', '8', 'GRID', '10', '-800', '20', '0', '11', '5800', '21', '0',
    '0', 'LINE', '8', 'GRID', '10', '-800', '20', '20000', '11', '5800', '21', '20000',
    '0', 'CIRCLE', '8', 'COLUMN', '10', '0', '20', '0', '40', '250',
    '0', 'CIRCLE', '8', 'COLUMN', '10', '5000', '20', '0', '40', '250',
    '0', 'CIRCLE', '8', 'COLUMN', '10', '0', '20', '6000', '40', '250',
    '0', 'CIRCLE', '8', 'COLUMN', '10', '5000', '20', '6000', '40', '250',
    '0', 'CIRCLE', '8', 'COLUMN', '10', '0', '20', '12000', '40', '250',
    '0', 'CIRCLE', '8', 'COLUMN', '10', '5000', '20', '12000', '40', '250',
    '0', 'CIRCLE', '8', 'COLUMN', '10', '0', '20', '20000', '40', '250',
    '0', 'CIRCLE', '8', 'COLUMN', '10', '5000', '20', '20000', '40', '250',
    '0', 'TEXT', '8', 'TEXT', '1', 'MAT BANG NHA PHO 5x20m - KHOA XAY DUNG DTU',
    '0', 'TEXT', '8', 'TEXT', '1', 'PHONG KHACH 30m2',
    '0', 'TEXT', '8', 'TEXT', '1', 'BEP + AN 30m2',
    '0', 'ENDSEC', '0', 'EOF'
  ].join('\n');
  parseAndRenderDXF(sampleDxf, 'Mau_Nha_Pho_5x20m_DTU.dxf');
}

function loadSampleIFC() {
  // Mẫu file IFC4 STEP chuẩn BIM thật (Nhà phố 4 tầng, 12 cột, 28 dầm, 24 tường, 4 sàn, 12 móng)
  const lines = [
    'ISO-10303-21;',
    'HEADER;',
    "FILE_SCHEMA(('IFC4'));",
    'ENDSEC;',
    'DATA;',
    "#1=IFCPROJECT('0x1',#2,'Nha Pho 4 Tang BIM - Khoa Xay Dung DTU',$,$,$,$,$,$);"
  ];
  let id = 10;
  for (let i = 1; i <= 4; i++) lines.push(`#${id++}=IFCBUILDINGSTOREY('s${i}',#2,'Tang ${i}',$,$,$,$,$,.ELEMENT.,${(i - 1) * 3.6});`);
  for (let i = 1; i <= 12; i++) lines.push(`#${id++}=IFCCOLUMN('c${i}',#2,'Cot BTCT 250x250',$,$,$,$,$);`);
  for (let i = 1; i <= 28; i++) lines.push(`#${id++}=IFCBEAM('b${i}',#2,'Dam BTCT 220x450',$,$,$,$,$);`);
  for (let i = 1; i <= 24; i++) lines.push(`#${id++}=IFCWALLSTANDARDCASE('w${i}',#2,'Tuong gach nhe AAC 150',$,$,$,$,$);`);
  for (let i = 1; i <= 4; i++) lines.push(`#${id++}=IFCSLAB('sl${i}',#2,'San BTCT day 120mm',$,$,$,$,$,.FLOOR.);`);
  for (let i = 1; i <= 12; i++) lines.push(`#${id++}=IFCFOOTING('f${i}',#2,'Mong coc BTCT',$,$,$,$,$,.PAD_FOOTING.);`);
  for (let i = 1; i <= 10; i++) lines.push(`#${id++}=IFCDOOR('d${i}',#2,'Cua di',$,$,$,$,$);`);
  for (let i = 1; i <= 14; i++) lines.push(`#${id++}=IFCWINDOW('wn${i}',#2,'Cua so kinh Low-E',$,$,$,$,$);`);
  for (let i = 1; i <= 3; i++) lines.push(`#${id++}=IFCSTAIR('st${i}',#2,'Cau thang bo',$,$,$,$,$);`);
  lines.push(`#${id++}=IFCQUANTITYAREA('NetFloorArea',$,$,440.0);`);
  lines.push('ENDSEC;', 'END-ISO-10303-21;');
  parseAndRenderIFC(lines.join('\n'), 'Mau_Mo_Hinh_BIM_4_Tang_DTU.ifc');
}

// ============================================================================
// INITIALIZE ON DOM READY
// ============================================================================

window.addEventListener('DOMContentLoaded', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
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

  initAdminBridgeSync();
  updateDashboardOverview();
  calculateEstimation(false);
  checkStructureTCVN(false);
  switchTcvnSubTab('beam');
  calcBeamRebar();
  calcAnchorLap();
  calcLoads2737();
  calcFoundationPccc();
  resetSiteGuardUI();
  resetCrackDoctorUI();
  askTCVNCopilot('Chiều dày lớp bê tông bảo vệ cốt thép theo TCVN 5574:2018 là bao nhiêu?');
});
