/**
 * Google Apps Script Webhook cho Khảo sát Multigo
 * 
 * HƯỚNG DẪN CÀI ĐẶT TRONG 1 PHÚT:
 * 1. Mở trang Google Sheets mới: https://sheets.new
 * 2. Trên thanh menu, chọn: Tiện ích mở rộng (Extensions) -> Apps Script.
 * 3. Xóa hết code mặc định trong file `Code.gs` và dán toàn bộ đoạn code dưới đây vào.
 * 4. Nhấn nút "Lưu" (biểu tượng đĩa mềm).
 * 5. Nhấn nút "Triển khai" (Deploy) ở góc trên bên phải -> Chọn "Tùy chọn triển khai mới" (New deployment).
 * 6. Chọn loại (Select type): "Ứng dụng web" (Web app).
 *    - Mô tả: Multigo Survey Webhook
 *    - Thực thi dưới dạng (Execute as): "Tôi" (Me)
 *    - Ai có quyền truy cập (Who has access): "Bất kỳ ai" (Anyone) -> Rất quan trọng!
 * 7. Nhấn "Triển khai" (Deploy) -> Cấp quyền truy cập nếu Google yêu cầu.
 * 8. Copy đường link "URL ứng dụng web" (Web App URL) và dán vào nút Cài Đặt (icon bánh răng ⚙️) trên trang web Khảo sát Multigo!
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Nếu sheet còn trống thì khởi tạo tiêu đề cột
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Mã Phiếu",
        "Thời Gian",
        "Họ Và Tên",
        "Nghề Nghiệp",
        "Độ Tuổi",
        "Thói Quen Đi Lại",
        "Đã Từng Dùng App",
        "Nhánh Phân Loại",
        "Tần Suất Mở (A)",
        "Tính Năng Yêu Thích (A)",
        "Điểm Giờ Xe (A)",
        "Điểm GPS (A)",
        "Điểm Thanh Toán (A)",
        "Điểm Giao Diện (A)",
        "Lỗi Gặp Phải (A)",
        "Lý Do Chưa Dùng (B)",
        "Mối Quan Tâm Lớn Nhất (B)",
        "Yếu Tố Thuyết Phục (B)",
        "Khó Khăn Chung (B)",
        "Ý Kiến Đóng Góp / Mong Muốn"
      ]);
      
      // Định dạng dòng tiêu đề
      var headerRange = sheet.getRange(1, 1, 1, 20);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#059669");
      headerRange.setFontColor("#ffffff");
    }

    var data = JSON.parse(e.postData.contents);

    // Ghi dữ liệu dòng mới
    sheet.appendRow([
      data.id || "",
      data.timestamp || new Date().toLocaleString("vi-VN"),
      data.fullname || "Ẩn danh",
      data.occupation || "",
      data.age_group || "",
      data.transit_habit || "",
      data.has_used_multigo || "",
      data.branch === "used" ? "Nhánh A (Đã dùng)" : "Nhánh B (Chưa dùng)",
      data.a_open_frequency || "",
      data.a_features || "",
      data.rating_time_accuracy || "",
      data.rating_gps_accuracy || "",
      data.rating_payment_convenience || "",
      data.rating_ui_ux || "",
      data.a_issues || "",
      data.b_reason_not_used || "",
      data.b_concerns || "",
      data.b_incentive || "",
      data.b_pain_points || "",
      data.feedback || ""
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Ghi dữ liệu thành công" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
