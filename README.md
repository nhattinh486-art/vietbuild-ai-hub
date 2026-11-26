# Kiến Tạo Xây Dựng Số AI & Quản Lý Công Trình Toàn Diện (DTU Construction AI Hub)

Dự án tham gia cuộc thi **Ứng dụng AI phát triển Web** — **Khoa Xây Dựng, Đại Học Duy Tân (DTU)**.

---

## Đường dẫn sản phẩm triển khai trực tuyến (Hỗ trợ cài đặt PWA trên iOS & Android)

- **Trang web chính (Hỗ trợ cài đặt PWA trên điện thoại iOS/Android & dùng trên máy tính):** https://dtu-xaydung-ai.surge.sh
- **Đường dẫn dự phòng:** https://kien-tao-xay-dung-so-ai-dtu.surge.sh
- **Ứng dụng Quản trị Admin (Hỗ trợ cài đặt PWA trên điện thoại iOS/Android):** https://dtu-xaydung-ai.surge.sh/admin.html *(Mật khẩu dùng thử: `dtu2026`)*

### Hướng dẫn cài đặt App (PWA) trên điện thoại cho cả Web chính & Trang Admin:
- **Trên iPhone / iPad (Safari):** Mở link Web chính hoặc Trang Admin → bấm nút **Chia sẻ** (ô vuông mũi tên lên) → chọn **"Thêm vào MH chính" (Add to Home Screen)** → bấm **Thêm**.
- **Trên Android (Chrome):** Mở link → bấm nút **"Cài App lên Điện thoại (iOS/Android)"** trong menu (hoặc dấu `⋮` → **"Cài đặt ứng dụng"**).

---

## Điểm nổi bật của hệ thống

1. **5 Phân hệ phủ kín vòng đời công trình xây dựng:**
   - **Phân hệ 1 – Dự toán Chi phí, Kỹ thuật, Bóc tách Khối lượng (BOQ – 12 Hạng mục) & Đọc Bản vẽ CAD/BIM:** Chia gọn 3 trang con: (1) Thông số & Biểu đồ tính tải trọng móng, thời gian thi công và hiệu quả **Vật liệu Xanh (Gạch AAC, Kính Low-E, Sơn sinh thái)** về giảm $\text{CO}_2$ và tiết kiệm điện làm mát 5 năm; (2) Bảng BOQ 12 hạng mục tách riêng Nhân công `NC-01`, Máy thi công `MTC-01` theo Thông tư 12/2021/TT-BXD; (3) Trình đọc & Trích xuất Bản vẽ Kỹ thuật CAD/BIM (`.dxf`, `.ifc`) và tổng hợp cùng lúc nhiều ảnh mặt bằng (Tầng 1, Tầng 2, tổng mặt bằng…) bằng AI để tự động đẩy số liệu sang Dự toán (Mục 1) và Kết cấu (Mục 2).
   - **Phân hệ 2 – Trợ lý TCVN & Tính toán Kết cấu (4 Tab kỹ thuật):** Kiểm tra tiết diện & tính nhanh cốt thép dầm kèm **sơ đồ mặt cắt SVG động** (TCVN 5574:2018), tra cứu chiều dài Neo & Nối chồng ($l_{an}, l_{lap}$), tính hoạt tải & áp lực gió chuẩn mới (**TCVN 2737:2023**), kiểm tra sơ bộ móng đơn (**TCVN 9362:2012**), tra Động đất (**TCVN 9386:2012**) & PCCC (**QCVN 06:2022/BXD**) kèm góc giải thích ký hiệu kỹ thuật và hướng xử lý khi chưa đạt.
   - **Phân hệ 3 – Giám sát An toàn Lao động (HSE) & Nhật ký Công trường:** Tải ảnh công trường thực tế để Gemini Vision khoanh vùng lỗi bảo hộ (`box_2d`), chấm điểm an toàn, tự lập Nhật ký thi công và hỗ trợ **hỏi đáp trực tiếp** (có ảnh bám sát ảnh, không cần ảnh vẫn hỏi được).
   - **Phân hệ 4 – Bác sĩ Công trình:** Phân tích ảnh vết nứt thực tế theo TCVN 5574:2018 ($a_{crc} \le 0.3\text{ mm}$), đề xuất phác đồ xử lý, dự toán vật tư theo danh mục đơn giá chuẩn thống nhất (`STANDARD_REPAIR_CATALOG`) và hỗ trợ hỏi đáp trực tiếp.
   - **Phân hệ 5 – Tổng quan Dự án & Xuất Hồ sơ Kỹ thuật (.PDF):** Đồng bộ số liệu thời gian thực và xuất file `.pdf` khổ A4 chuẩn kỹ thuật có bảng biểu trình tự rõ ràng.
2. **Ứng dụng Quản trị DTU Admin (PWA) đồng bộ thời gian thực qua Firebase:**
   - Quản lý đơn giá BOQ & vật tư sửa chữa, bổ sung kho TCVN, theo dõi thống kê lượt dùng, thông báo khi có đơn giá/TCVN mới, quy trình tự soạn thông báo chờ duyệt và công tắc tự động cập nhật (mặc định tắt).
3. **Hỗ trợ PWA toàn diện cho cả Web chính & App Admin (`manifest.json`, `sw.js`, `manifest-admin.json`, `sw-admin.js`)** và **Kiến trúc AI Kép** (Chế độ Mô phỏng Thông minh không cần API Key + Google Gemini API thật có tự động dò model & chuyển dự phòng).

---

## Cách chạy cục bộ

### Cách 1: Bản Web Chạy Trực Tiếp (HTML / JS / Tailwind / Chart.js / PWA)
Mở trực tiếp file `index.html` (Web chính) hoặc `admin.html` (Trang quản trị) bằng Chrome / Edge / Safari.

### Cách 2: Bản React + Vite (`react-app/`)
```bash
cd react-app
npm install
npm run dev
```

---

## Tài liệu kê khai trong kho mã nguồn
- `PROMPT_LOG.md`: Nhật ký câu lệnh (Prompt Log) quá trình phát triển sản phẩm.
- `BANG_KE_KHAI_AI.md`: Bảng kê khai công cụ AI, mô hình, thư viện, API và phân định mức độ đóng góp.
