# 🚌 Multigo Survey Web - Khảo Sát Người Dùng Ứng Dụng Giao Thông Thông Minh

Ứng dụng web khảo sát người dùng thông minh dành cho **Multigo**, được xây dựng dựa trên tài liệu **"Tối ưu khảo sát Multigo"** với kiến trúc phân nhánh logic thông minh, dashboard trực quan và tích hợp Google Sheets.

![Multigo Survey Banner](docs/multigo_survey_spec_1.jpg)

---

## 🌟 Tính Năng Nổi Bật

### 1. Luồng Câu Hỏi Phân Nhánh Thông Minh (Smart Branching Flow)
Khắc phục triệt để vấn đề gộp chung đối tượng, chia người tham gia khảo sát thành 2 nhánh hoàn toàn riêng biệt sau câu hỏi lọc (Screener):
- **Phần 1: Thông tin chung**: Họ tên, Đối tượng/Nghề nghiệp, Độ tuổi, Thói quen di chuyển bằng phương tiện công cộng (xe buýt, tàu điện metro).
- **Phần 2: Câu hỏi lọc then chốt (Screener)**: *"Bạn đã từng tải/sử dụng Multigo chưa?"*
  - **Nhánh A (Đã từng dùng)**: Đánh giá chuyên sâu trải nghiệm thực tế:
    - Tần suất mở app.
    - Tính năng thường dùng / yêu thích (Bản đồ GPS, Dự báo giờ xe đến thời gian thực, Vé sinh viên, QR Code...).
    - Đánh giá mức độ đồng ý bằng thang điểm 5 sao ⭐: Giờ xe chuẩn xác, Vị trí xe GPS tin cậy, Thanh toán mượt mà, Giao diện trực quan.
    - Báo cáo lỗi kỹ thuật: Giật lag/văng app, Định vị sai lệch, Nhảy trạm, Hao pin/4G...
    - Đóng góp ý kiến cải tiến.
  - **Nhánh B (Chưa từng dùng)**: Nghiên cứu thị trường & nhu cầu tiềm năng:
    - Lý do chưa sử dụng (Chưa biết app, dùng app khác như BusMap/Google Maps, ít đi xe buýt, lo app nặng máy...).
    - Yếu tố quan tâm hàng đầu ở một ứng dụng giao thông công cộng.
    - Điều gì sẽ thuyết phục bạn tải Multigo (Mã giảm giá, bạn bè giới thiệu, giờ xe chính xác...).
    - Khó khăn lớn nhất thường gặp khi đi phương tiện công cộng (chờ xe lâu, đổi tuyến phức tạp, tiền lẻ...).
    - Mong muốn về giải pháp giao thông tương lai.
- **Phần 4: Xác nhận & Gửi phản hồi**: Xem lại tóm tắt, cấp mã Survey ID, hiệu ứng pháo hoa chúc mừng.

### 2. Bảng Phân Tích Dữ Liệu Thời Gian Thực (Analytics Dashboard)
- Thống kê tổng số lượng phản hồi, tỷ lệ % Nhánh A (Đã dùng) vs Nhánh B (Chưa dùng).
- Điểm đánh giá trung bình 5 sao.
- Biểu đồ Doughnut Chart và Bar Chart trực quan bằng **Chart.js**.
- Bảng chi tiết từng phản hồi kèm bộ lọc theo nhánh.
- Xuất file **Excel / CSV chuẩn UTF-8 BOM** (không bị lỗi font tiếng Việt khi mở bằng Excel).
- Nút tạo **10 Dữ Liệu Mẫu (Mock Data)** tức thì.

### 3. Đồng Bộ Dữ Liệu Tự Động (Google Sheets Webhook)
- Hỗ trợ lưu trữ cục bộ (`localStorage`) và tự động đẩy dữ liệu về Google Sheets thông qua Google Apps Script Webhook.

---

## 🚀 Hướng Dẫn Đẩy Lên GitHub & Kích Hoạt GitHub Pages (Trong 3 Phút)

### Cách 1: Sử dụng file tự động `push_to_github.bat` (Khuyên dùng trên Windows)
1. Truy cập [https://github.com/new](https://github.com/new) để tạo một Repository mới (ví dụ đặt tên là `multigo-survey`). Chọn chế độ **Public**.
2. Copy đường link Repository (ví dụ: `https://github.com/username/multigo-survey.git`).
3. Trong thư mục dự án, nhấp đúp chuột vào file **`push_to_github.bat`**.
4. Dán đường link repo vừa copy vào và nhấn **Enter**. Tool sẽ tự động khởi tạo Git, đóng gói và đẩy toàn bộ mã nguồn lên GitHub!

---

### Cách 2: Sử dụng lệnh Git thủ công (Terminal / PowerShell / Git Bash)

Mở terminal trong thư mục này và chạy các lệnh sau:

```bash
# 1. Khởi tạo Git
git init
git branch -M main

# 2. Thêm toàn bộ file và commit
git add .
git commit -m "Khởi tạo website khảo sát Multigo phân nhánh thông minh"

# 3. Kết nối với repository GitHub của bạn (thay bằng link của bạn)
git remote add origin https://github.com/<tai-khoan-cua-ban>/<ten-repository>.git

# 4. Đẩy mã nguồn lên GitHub
git push -u origin main
```

---

## 🌐 Cách Bật GitHub Pages Để Nhận Đường Link Web Miễn Phí

Sau khi đã đẩy code lên GitHub thành công:
1. Vào repository GitHub của bạn trên trình duyệt.
2. Nhấp vào tab **Settings** (Cài đặt) trên thanh công cụ của repo.
3. Ở menu thanh bên trái, chọn mục **Pages**.
4. Tại phần **Build and deployment** -> **Branch**:
   - Chọn nhánh: **`main`**
   - Chọn thư mục: **`/(root)`**
   - Nhấn **Save**.
5. Đợi khoảng 1 - 2 phút, GitHub sẽ cấp cho bạn một đường link website trực tuyến miễn phí có dạng:
   👉 **`https://<ten-tai-khoan>.github.io/<ten-repo>/`**

Bây giờ bạn có thể gửi link này cho bạn bè, khách hàng hoặc đăng tải lên mạng xã hội để thu thập khảo sát online!

---

## 📊 Kết Nối Google Sheets Để Nhận Dữ Liệu Khảo Sát Tự Động

1. Mở một trang Google Sheets mới tại [https://sheets.new](https://sheets.new).
2. Vào **Tiện ích mở rộng (Extensions)** -> **Apps Script**.
3. Mở file `google-apps-script.js` trong thư mục dự án này, copy toàn bộ nội dung và dán vào Apps Script.
4. Nhấn **Triển khai (Deploy)** -> **Tùy chọn triển khai mới (New deployment)**:
   - Loại: **Ứng dụng web (Web app)**
   - Thực thi dưới dạng: **Tôi (Me)**
   - Ai có quyền truy cập: **Bất kỳ ai (Anyone)**
5. Nhấn **Triển khai**, cấp quyền và copy đường link **URL ứng dụng web**.
6. Mở trang web khảo sát của bạn, nhấn vào icon bánh răng **⚙️ (Cài Đặt)** ở góc trên bên phải và dán link vào là hoàn tất!

---

## 🛠️ Công Nghệ Sử Dụng
- **HTML5 & CSS3** hiện đại, chuẩn UI/UX giao thông thông minh.
- **Tailwind CSS (CDN)**: Giao diện phản hồi 100% trên cả điện thoại (iOS, Android) và máy tính.
- **Font Awesome 6**: Hệ thống icon sinh động.
- **Chart.js**: Vẽ biểu đồ thống kê kết quả trực quan.
- **Canvas-confetti**: Hiệu ứng pháo hoa chúc mừng khi hoàn thành.
- **Vanilla JavaScript**: Không cần cài đặt node_modules hay build tool phức tạp, mở file `index.html` chạy ngay lập tức!
