# 🏗️ VietBuild AI Studio — Hệ sinh thái AI Kỹ sư Xây dựng Toàn diện (5-in-1 Hub)

Dự án tham gia cuộc thi **Ứng dụng AI phát triển Web** dành cho sinh viên và kỹ sư ngành Xây dựng.

---

## 🌟 Điểm khác biệt ăn điểm trước Ban Giám khảo

1. **5 Phân hệ phủ kín vòng đời dự án xây dựng:**
   - **Module 1 – Executive BIM & ESG Dashboard:** Tổng quan tiến độ, chi phí, điểm an toàn HSE và chỉ số giảm phát thải Carbon.
   - **Module 2 – ConstructEst & EcoBuild:** Tính toán hệ số diện tích xây dựng, bóc tách khối lượng vật tư chính (Bê tông M300, Thép CB400-V, Xi măng PCB40, Gạch) và so sánh hiệu quả **Vật liệu Xanh (Gạch nhẹ AAC + Kính Low-E)** về lượng giảm phát thải $\text{CO}_2$ cũng như tiền điện tiết kiệm sau 5 năm.
   - **Module 3 – TCVN Copilot & Auto-Checker:** Kiểm tra nhanh tiết diện dầm, sàn, lớp bê tông bảo vệ cốt thép $c_0$ và tra cứu điều khoản **TCVN 5574:2018**, **TCVN 2737:2023**, **QCVN 06:2022/BXD**, **TCVN 9362:2012**.
   - **Module 4 – AI SiteGuard (Computer Vision HSE):** Quét ảnh công trường phát hiện vi phạm bảo hộ lao động (PPE), giàn giáo, chấm điểm an toàn và tự động viết **Nhật ký thi công** chuẩn kỹ thuật.
   - **Module 5 – CrackDoctor (Bác sĩ Công trình):** Chẩn đoán hình thái vết nứt (nứt cắt $45^\circ$ gối dầm, nứt uốn giữa nhịp, nứt chân chim tường gạch), đối chiếu giới hạn $a_{crc} \le 0.3\text{ mm}$ của TCVN 5574:2018 và đề xuất quy trình bơm keo Epoxy / hóa chất Sika.

2. **Kiến trúc Kép (Dual AI Engine):**
   - **Chế độ Demo Thông Minh (Offline 1-Click):** Chạy mượt 100% không cần mạng, có sẵn các kịch bản mẫu để thuyết trình trên sân khấu không bao giờ bị lỗi.
   - **Chế độ Gemini AI Thật (`gemini-2.5-flash`):** Chỉ cần dán Gemini API Key ngay trên thanh Header, hệ thống lập tức dùng AI Vision thật để phân tích bất kỳ bức ảnh công trường hoặc vết nứt nào bạn tải lên.

---

## 🚀 Cách chạy 2 Phiên bản trong Dự án

### Cách 1: Bản Web Chạy Trực Tiếp (HTML / JS / Tailwind / Chart.js) — Khuyên dùng khi Demo thi đấu
Không cần cài đặt môi trường, mở trực tiếp file:
- [index.html](file:///C:/Users/Admin/.gemini/antigravity/scratch/vietbuild-ai-hub/index.html) bằng trình duyệt Chrome / Edge.

### Cách 2: Bản React + Vite (`react-app/`) — Dùng khi nộp Source Code Framework hiện đại
```bash
cd C:\Users\Admin\.gemini\antigravity\scratch\vietbuild-ai-hub\react-app
npm install
npm run dev
```

---

## 🎤 Kịch bản Thuyết trình (Pitching 3 Phút)

1. **Mở đầu (30s):** *"Ngành xây dựng Việt Nam đang chuyển đổi số mạnh mẽ, nhưng kỹ sư hiện trường và sinh viên vẫn mất hàng giờ để bóc tách dự toán sơ bộ, dò từng trang TCVN, kiểm tra an toàn công trường và viết nhật ký cuối ngày. Đó là lý do chúng tôi xây dựng **VietBuild AI Studio** — nền tảng Web AI 5-trong-1 đầu tiên đồng hành xuyên suốt vòng đời công trình."*
2. **Demo trực tiếp (120s):**
   - Bấm sang **Module 2 (Dự toán & Vật liệu Xanh):** Thay đổi diện tích/số tầng, bật nút **EcoBuild** để cho Giám khảo thấy biểu đồ chi phí và lượng $\text{CO}_2$ giảm được nhờ gạch nhẹ AAC.
   - Bấm sang **Module 3 (TCVN Copilot):** Đổi chiều cao dầm $h$ hoặc lớp bảo vệ $c_0$ để web báo đỏ/xanh theo đúng **TCVN 5574:2018**.
   - Bấm sang **Module 4 (AI SiteGuard) & Module 5 (CrackDoctor):** Click qua các kịch bản 1-Click hoặc tải 1 tấm ảnh vết nứt/công trường thật lên để AI khoanh vùng lỗi và tự động xuất biên bản PDF.
3. **Kết luận (30s):** Nhấn mạnh tính thực tiễn, khả năng thương mại hóa cho các nhà thầu vừa và nhỏ (SME) và đóng góp vào mục tiêu **Net Zero 2050** của ngành Xây dựng.
