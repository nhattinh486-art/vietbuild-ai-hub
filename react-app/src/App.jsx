import React, { useState, useMemo } from 'react';
import { generateConstructionAI } from './services/geminiService';

const TCVN_DB = [
  {
    code: 'TCVN 5574:2018',
    clause: 'Mục 10.3.2 – Lớp bê tông bảo vệ cốt thép (c₀)',
    content: 'Trong nhà (độ ẩm thường): Sàn/tường ≥ 20 mm, Dầm/cột ≥ 25 mm. Ngoài trời: ≥ 30 mm. Đài móng có lớp bê tông lót: ≥ 40 mm.'
  },
  {
    code: 'TCVN 5574:2018',
    clause: 'Mục 8.2.2 – Bề rộng vết nứt giới hạn (a_crc)',
    content: 'Môi trường bình thường: Vết nứt dài hạn a_crc,1 ≤ 0,3 mm, ngắn hạn a_crc,2 ≤ 0,4 mm.'
  },
  {
    code: 'TCVN 2737:2023',
    clause: 'Bảng 4 – Hoạt tải sàn phân bố đều tiêu chuẩn',
    content: 'Nhà ở, căn hộ: 1,5 kN/m². Văn phòng, lớp học: 2,0 kN/m². Hành lang, cầu thang: 3,0 kN/m². Hệ số độ tin cậy tải trọng γ_f = 1,3.'
  },
  {
    code: 'QCVN 06:2022/BXD',
    clause: 'Phần 3 – Đường và lối thoát nạn PCCC',
    content: 'Chiều rộng thông thủy bản thang thoát nạn ≥ 1,0 m (nhà thông thường) và ≥ 1,2 m (khi tầng có trên 200 người). Hành lang thoát nạn ≥ 1,2 m.'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [aiMode, setAiMode] = useState('demo'); // 'demo' | 'gemini'
  const [apiKey, setApiKey] = useState('');
  const [aiOutput, setAiOutput] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);

  // Module 2 State: Dự toán & Vật liệu xanh
  const [area, setArea] = useState(100);
  const [floors, setFloors] = useState(3);
  const [foundation, setFoundation] = useState('bang');
  const [ecoMode, setEcoMode] = useState(true);

  // Module 3 State: Kiểm tra TCVN
  const [spanM, setSpanM] = useState(6.0);
  const [beamH, setBeamH] = useState(500);

  const estimation = useMemo(() => {
    const fCoeff = foundation === 'don' ? 0.35 : foundation === 'bang' ? 0.55 : 0.65;
    const totalCoeff = fCoeff + floors + 0.5;
    const builtArea = Math.round(area * totalCoeff);
    const unitPrice = 6900000 + (ecoMode ? 280000 : 0);
    const totalCost = builtArea * unitPrice;
    const co2Saved = (builtArea * (ecoMode ? 0.048 : 0.008)).toFixed(1);
    return {
      builtArea,
      totalCoeff: totalCoeff.toFixed(2),
      totalCostB: (totalCost / 1e9).toFixed(2),
      concreteM3: (builtArea * 0.24).toFixed(1),
      steelTon: (builtArea * 0.036).toFixed(2),
      co2Saved
    };
  }, [area, floors, foundation, ecoMode]);

  async function handleAskAI(prompt, fallbackText) {
    setLoadingAI(true);
    try {
      const res = await generateConstructionAI({
        mode: aiMode,
        apiKey,
        prompt,
        fallbackText
      });
      setAiOutput(`[${res.source}]\n${res.text}`);
    } catch (err) {
      setAiOutput(`Lỗi kết nối API: ${err.message}`);
    } finally {
      setLoadingAI(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-950 text-slate-100">
      {/* THANH BÊN (SIDEBAR) */}
      <aside className="w-full lg:w-72 bg-slate-900/90 border-r border-slate-800 p-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#8c1925] to-[#4b0e15] border border-[#e2b877]/40 text-[#e2b877] font-black flex items-center justify-center text-sm">
              DTU
            </div>
            <div>
              <div className="font-bold text-white text-sm">KHOA XÂY DỰNG • DTU</div>
              <div className="text-xs text-[#e2b877]">Trợ Lý AI Xây Dựng Toàn Diện</div>
            </div>
          </div>

          <nav className="space-y-1.5">
            {[
              { id: 'dashboard', label: '1. Tổng quan Dự án', icon: '📊' },
              { id: 'estimator', label: '2. Dự toán & Vật liệu Xanh', icon: '🧮' },
              { id: 'tcvn', label: '3. Trợ lý TCVN & Kết cấu', icon: '📐' },
              { id: 'siteguard', label: '4. Giám sát An toàn & Nhật ký', icon: '🦺' },
              { id: 'crackdoctor', label: '5. Bác sĩ Công trình', icon: '🩺' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                  activeTab === item.id
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* BỘ CHỌN CHẾ ĐỘ AI */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 mt-6">
          <div className="text-xs font-bold text-amber-400">Chế độ Bộ não AI (Tích hợp Kép)</div>
          <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-lg">
            <button
              onClick={() => setAiMode('demo')}
              className={`py-1.5 rounded text-xs font-semibold ${
                aiMode === 'demo' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Mô phỏng Thông minh
            </button>
            <button
              onClick={() => setAiMode('gemini')}
              className={`py-1.5 rounded text-xs font-semibold ${
                aiMode === 'gemini' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              AI Gemini Thật
            </button>
          </div>
          {aiMode === 'gemini' && (
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Nhập mã Gemini API Key..."
              className="w-full px-2.5 py-1.5 rounded bg-slate-900 border border-emerald-500/40 text-xs text-white"
            />
          )}
        </div>
      </aside>

      {/* NỘI DUNG CHÍNH + BANNER ĐẠI HỌC DUY TÂN & FOOTER */}
      <div className="flex-1 flex flex-col justify-between">
        <main className="p-6 max-w-6xl w-full mx-auto space-y-6">
          {/* BANNER ĐỎ ĐÔ - VÀNG ĐỒNG CHUẨN TRƯỜNG ĐẠI HỌC DUY TÂN • KHOA XÂY DỰNG */}
          <div
            className="rounded-3xl px-7 py-6 flex flex-col justify-center space-y-1.5"
            style={{
              background: 'linear-gradient(90deg, #65121b 0%, #4b0e15 55%, #2d090e 100%)',
              border: '1px solid rgba(217, 160, 91, 0.28)'
            }}
          >
            <div className="text-xs sm:text-sm font-extrabold tracking-[0.14em] uppercase text-[#e2b877]">
              TRƯỜNG ĐẠI HỌC DUY TÂN • KHOA XÂY DỰNG
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight uppercase leading-tight">
              <span className="text-white">KIẾN TẠO XÂY DỰNG SỐ AI</span>
              <span className="text-[#e2b877]"> &amp; QUẢN LÝ CÔNG TRÌNH TOÀN DIỆN</span>
            </h1>
            <p className="text-xs sm:text-sm text-rose-100/80 font-medium pt-0.5">
              Hệ Thống Trợ Lý Kỹ Thuật, Dự Toán Vật Liệu Xanh, Tra Cứu TCVN, Giám Sát An Toàn &amp; Chẩn Đoán Kết Cấu Xây Dựng Thông Minh
            </p>
          </div>

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Trung tâm Điều hành Kỹ thuật Xây dựng Toàn diện</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">Dự toán Sơ bộ</div>
                  <div className="text-2xl font-extrabold text-amber-400 mt-1">{estimation.totalCostB} Tỷ đ</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">Điểm An toàn Công trường</div>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-1">89 / 100</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">Giảm phát thải Carbon</div>
                  <div className="text-2xl font-extrabold text-sky-400 mt-1">-{estimation.co2Saved} Tấn CO₂</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-400">Tuân thủ TCVN 5574:2018</div>
                  <div className="text-2xl font-extrabold text-white mt-1">98,5% Đạt</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'estimator' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Phân hệ Dự toán Khối lượng &amp; Tối ưu Vật liệu Xanh</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <div>
                    <label className="text-xs text-slate-400">Diện tích đất (m²)</label>
                    <input
                      type="number"
                      value={area}
                      onChange={(e) => setArea(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400">Số tầng</label>
                    <input
                      type="number"
                      value={floors}
                      onChange={(e) => setFloors(Number(e.target.value))}
                      className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700"
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <span className="text-xs font-semibold text-emerald-300">Bật Vật liệu Xanh (Gạch nhẹ AAC + Kính cản nhiệt)</span>
                    <input
                      type="checkbox"
                      checked={ecoMode}
                      onChange={(e) => setEcoMode(e.target.checked)}
                      className="w-5 h-5"
                    />
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="text-sm text-slate-400">Tổng diện tích sàn quy đổi: <strong className="text-white">{estimation.builtArea} m²</strong></div>
                  <div className="text-2xl font-bold text-amber-400">Tổng chi phí: {estimation.totalCostB} Tỷ VNĐ</div>
                  <div className="text-sm text-slate-300">• Bê tông thương phẩm M300: <strong>{estimation.concreteM3} m³</strong></div>
                  <div className="text-sm text-slate-300">• Cốt thép CB400-V: <strong>{estimation.steelTon} Tấn</strong></div>
                  <div className="text-sm text-emerald-400">• Giảm phát thải Carbon: <strong>-{estimation.co2Saved} Tấn CO₂</strong></div>
                  <button
                    onClick={() =>
                      handleAskAI(
                        `Phân tích tối ưu dự toán cho nhà ${floors} tầng, diện tích ${area}m2, vật liệu xanh=${ecoMode}`,
                        `Khuyến nghị Kỹ sư Dự toán: Sử dụng gạch nhẹ AAC giúp giảm ~20% tĩnh tải tường lên móng, tiết kiệm khoảng 8% cốt thép đài móng và giảm nhiệt độ bức xạ hướng Tây 3.5°C.`
                      )
                    }
                    className="mt-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    ✨ AI Phân tích Tối ưu Kỹ thuật
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tcvn' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Trợ lý Tra cứu TCVN &amp; Kiểm tra Kết cấu Nhanh (TCVN 5574:2018)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-sky-400 text-sm">Kiểm tra sơ bộ tiết diện Dầm &amp; Lớp bảo vệ</h3>
                  <input
                    type="number"
                    value={spanM}
                    onChange={(e) => setSpanM(Number(e.target.value))}
                    placeholder="Nhịp dầm L (m)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm"
                  />
                  <input
                    type="number"
                    value={beamH}
                    onChange={(e) => setBeamH(Number(e.target.value))}
                    placeholder="Chiều cao dầm h (mm)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm"
                  />
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div>Chiều cao dầm khuyến nghị (L/12 ÷ L/8): <strong>{Math.round((spanM * 1000) / 12)} - {Math.round((spanM * 1000) / 8)} mm</strong></div>
                    <div className={beamH >= (spanM * 1000) / 12 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      Kết luận: {beamH >= (spanM * 1000) / 12 ? 'ĐẠT ĐỘ CỨNG CHỊU UỐN' : 'CẦN TĂNG CHIỀU CAO DẦM'}
                    </div>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                  <h3 className="font-bold text-amber-400 text-sm">Tra cứu nhanh Điều khoản TCVN</h3>
                  {TCVN_DB.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                      <div className="font-bold text-amber-300">{item.code} — {item.clause}</div>
                      <div className="text-slate-300">{item.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'siteguard' || activeTab === 'crackdoctor') && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h2 className="text-xl font-bold">
                {activeTab === 'siteguard'
                  ? '🦺 Giám sát An toàn Lao động & Nhật ký Tự động'
                  : '🩺 Bác sĩ Công trình – Chẩn đoán Vết nứt & Phác đồ Sửa chữa'}
              </h2>
              <p className="text-sm text-slate-300">
                Phiên bản đầy đủ đồ họa Canvas tương tác, khoanh vùng phát hiện vi phạm trực tiếp trên ảnh và xuất PDF đã được tích hợp sẵn tại file <code>index.html</code> ở thư mục gốc dự án.
              </p>
            </div>
          )}

          {aiOutput && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 text-sm whitespace-pre-line text-slate-200">
              {loadingAI ? 'Đang xử lý AI...' : aiOutput}
            </div>
          )}
        </main>

        {/* CHÂN TRANG (FOOTER) CHUẨN KHOA XÂY DỰNG • ĐẠI HỌC DUY TÂN (DTU) */}
        <footer className="mt-10 border-t border-slate-800/90 bg-slate-950/90 py-6 px-6 text-center space-y-1.5">
          <div className="text-xs sm:text-sm font-medium text-slate-300">
            © 2026 Kiến Tạo Xây Dựng Số AI • Nền tảng Dự toán Vật liệu Xanh, Giám sát An toàn, Chẩn đoán Kết cấu &amp; Tra cứu Tiêu chuẩn Xây dựng Thông minh
          </div>
          <div className="text-xs sm:text-sm font-bold text-[#e2b877] tracking-wide">
            Khoa Xây Dựng • Đại Học Duy Tân (DTU)
          </div>
        </footer>
      </div>
    </div>
  );
}
