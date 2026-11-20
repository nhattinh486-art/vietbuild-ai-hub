# BẢN KÊ KHAI CÔNG CỤ AI, MÔ HÌNH, THƯ VIỆN, API & PHÂN ĐỊNH ĐÓNG GÓP

**Dự án:** Trợ Lý AI Kỹ Sư Xây Dựng Toàn Diện (VietBuild AI Studio — Khoa Xây Dựng, Đại học Duy Tân)  
**Kho mã nguồn:** https://github.com/nhattinh486-art/vietbuild-ai-hub

---

## 1. Công cụ AI & Mô hình (AI Tools & Models)

| Thành phần | Tên cụ thể | Mục đích sử dụng |
| :--- | :--- | :--- |
| **IDE / Trợ lý AI phát triển** | **Google Antigravity** (Agentic AI IDE) | Lên cấu trúc dự án, sinh mã nguồn giao diện & logic theo yêu cầu của tác giả, gỡ lỗi và tối ưu UI/UX. |
| **Mô hình AI tích hợp trong Web** | `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-flash` (Google Gemini API) | Phân tích ảnh hiện trường công trường (phát hiện vi phạm PPE/giàn giáo), chẩn đoán hình thái vết nứt kết cấu và sinh nội dung Nhật ký thi công. |
| **Chế độ dự phòng (Offline)** | Smart Simulation Engine (Rule-based trong `app.js`) | Mô phỏng kết quả phân tích kỹ thuật theo kịch bản mẫu chuẩn hóa khi không có kết nối mạng hoặc chưa nhập API Key. |

---

## 2. API, Thư viện, Dataset & Tài nguyên sử dụng

### A. API bên ngoài
- **Google Generative Language API (`generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`):** Gửi văn bản và ảnh Base64 (`inline_data`) từ trình duyệt để nhận kết quả phân tích từ Gemini Vision.

### B. Thư viện & Framework (Kế thừa / Mã nguồn mở)
1. **Bản Web chạy trực tiếp (`index.html`, `admin.html`):**
   - **Tailwind CSS** (`cdn.tailwindcss.com`) — Thiết kế giao diện Responsive.
   - **Chart.js v4.4.1** (`cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js`) — Vẽ biểu đồ chi phí, khối lượng vật tư và thống kê tổng quan.
   - **html2pdf.js v0.10.1** (`cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js`) — Xuất báo cáo/biên bản kỹ thuật ra file PDF.
   - **Lucide Icons** (`unpkg.com/lucide@latest`) — Hệ thống icon kỹ thuật.
   - **Google Fonts** (`Inter`, `JetBrains Mono`) — Font chữ hiển thị và số liệu kỹ thuật.
2. **Bản React + Vite (`react-app/`):**
   - `react` (`^18.3.1`), `react-dom` (`^18.3.1`), `lucide-react` (`^0.460.0`)
   - `vite` (`^6.0.1`), `@vitejs/plugin-react` (`^4.3.4`), `tailwindcss` (`^3.4.15`), `postcss` (`^8.4.49`), `autoprefixer` (`^10.4.20`).

### C. Dữ liệu chuyên ngành & Tài nguyên (Dataset / Knowledge Base)
- **Hệ thống quy chuẩn, tiêu chuẩn xây dựng Việt Nam (tích hợp tra cứu & công thức kiểm tra):**
  - **TCVN 5574:2018** (Thiết kế kết cấu bê tông và bê tông cốt thép — kiểm tra lớp bảo vệ $c_0$, bề rộng khe nứt giới hạn $a_{crc} \le 0.3\text{ mm}$).
  - **TCVN 2737:2023** (Tải trọng và tác động).
  - **QCVN 06:2022/BXD** (Quy chuẩn kỹ thuật quốc gia về An toàn cháy cho nhà và công trình).
  - **TCVN 9362:2012** (Tiêu chuẩn thiết kế nền nhà và công trình).
- **Bảng định mức, đơn giá vật tư xây dựng & hệ số phát thải $\text{CO}_2$** (Bê tông M300, Thép CB400-V, Xi măng PCB40, Gạch ống, Gạch nhẹ AAC, Kính Low-E) lưu trong mã nguồn và cấu hình động qua `admin.js`.
- **Tài nguyên nhận diện thương hiệu:** `logo-khoa-xay-dung-dtu.jpg` (Logo Khoa Xây dựng — Đại học Duy Tân).

---

## 3. Phân định rõ: Phần Tự Làm — Phần AI Hỗ Trợ — Phần Kế Thừa

| Nhóm công việc | Phần Tác giả tự thực hiện (Self-made) | Phần AI hỗ trợ (AI-assisted) | Phần Kế thừa (Inherited / Open-source) |
| :--- | :--- | :--- | :--- |
| **Ý tưởng & Bài toán chuyên ngành** | Xác định 5 bài toán thực tế của sinh viên & kỹ sư xây dựng (Dự toán Xanh, TCVN, HSE, Vết nứt, Admin BOQ); đặt yêu cầu nghiệp vụ & chuẩn hóa nội dung chuyên môn. | Gợi ý cấu trúc hệ sinh thái 5-trong-1 và đề xuất các kịch bản trình diễn. | Các quy định từ TCVN 5574:2018, TCVN 2737:2023, QCVN 06:2022/BXD, TCVN 9362:2012. |
| **Giao diện (UI/UX)** | Định hướng tông màu nhận diện Khoa Xây dựng DTU, bố cục 5 phân hệ, cấu trúc trang Admin và kiểm thử trên Desktop/Mobile. | Sinh mã HTML/CSS/Tailwind (`index.html`, `admin.html`), tối ưu Responsive và PWA (`manifest-admin.json`, `sw-admin.js`). | Tailwind CSS CDN, Lucide Icons, Google Fonts (`Inter`, `JetBrains Mono`). |
| **Logic tính toán & AI Vision** | Thiết kế công thức bóc tách sơ bộ, chọn vật liệu xanh (AAC, Low-E), kiểm định logic kết quả kỹ thuật và thiết lập mật khẩu/quy trình Admin (`dtu2026`). | Viết mã JavaScript (`app.js`, `admin.js`, `geminiService.js`) xử lý tính toán, kết nối Gemini API, vẽ biểu đồ và xuất PDF. | Chart.js, html2pdf.js, Google Gemini API (`gemini-2.5-flash`), React/Vite. |
