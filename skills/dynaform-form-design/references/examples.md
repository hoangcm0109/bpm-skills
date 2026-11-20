# Ví dụ — dynaform-form-design

Mọi ví dụ viết bằng **khoá gọn** (quy đổi theo `../../dynaform-build-form/references/form-json.md` §10), dữ liệu giả, không script.

| Ví dụ | File | Dùng để |
|---|---|---|
| Form thật trước và sau khi áp quy tắc, kèm bảng chấm điểm và hai phương án (tách 4 card / giữ một cấp dữ liệu) | `example-before-after.md` | Thấy từng quy tắc đổi gì; chọn phương án theo ràng buộc dữ liệu |
| Năm khuôn mẫu theo loại form (đơn đề nghị, đăng ký, khảo sát, bộ lọc, hồ sơ nhiều bước) | `patterns.md` | Bắt đầu từ khung đúng thay vì từ trang trắng |
| Mẫu outline để người dùng duyệt | `../SKILL.md` › Mẫu outline | Bước 4 của quy trình |
| Công thức callout, tiêu đề card, nút | `design-rules.md` §1, §2, §6, §9 | Sao chép rồi đổi tên |

## Bảng lỗi hay gặp khi tự chấm

| Dấu hiệu | Quy tắc vi phạm | Cách sửa |
|---|---|---|
| Một card 15+ control, có `<h4>` giữa card | Mỗi nhóm nghĩa một card | Tách card (nếu được đổi cấp dữ liệu) hoặc thêm `divider` giữa các phần |
| Cảnh báo là `<p style="color:…">` | Callout có nền/viền | `text` + `custom.css` ở `design-rules.md` §6 (không dùng `className`) |
| Card sát mép chữ, `<h4>` nhìn như chữ thường | Padding 4 cạnh; tiêu đề có `custom.css` | `design-rules.md` §1, §2 |
| `textarea` trần dưới tiêu đề | Không có ô mồ côi | Bỏ vào card hoặc thành callout (ý kiến trả lại) |
| `helpText` kiểu "Host nạp từ hệ thống…" | Chữ cho người điền, không cho người dựng | Chuyển vào báo cáo |
| Một field 6 cột đứng lẻ | Hàng cộng đủ 12 | Ghép với field cùng nghĩa hoặc đưa xuống cuối card thành 12 |
| Tách thêm card trong form workflow | Card là cấp dữ liệu | Hỏi người dùng; hoặc phương án B (một card + `divider`) |
