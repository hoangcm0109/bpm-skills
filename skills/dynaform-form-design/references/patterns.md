# Năm khuôn mẫu theo loại form

Viết bằng **khoá gọn** (quy đổi theo `../../dynaform-build-form/references/form-json.md` §10). Chỉ phác khung và nhịp cột; nhãn, validation, option tự điền theo yêu cầu. Mọi hàng cộng đủ 12; control `colSpan < 12` tự thêm `overrides.sm.colSpan = "12"`.

Mỗi khuôn mở đầu bằng tiêu đề + mô tả (`design-rules.md` §1) — bên dưới bỏ qua cho gọn.

## 1. Đơn đề nghị / phê duyệt (nghiệp vụ, 1 trang, 3–4 card)

Dùng cho: đề nghị mua sắm, xin nghỉ, xin cấp kinh phí, đề xuất.

```
form_title, form_desc
[callout cảnh báo — ý kiến trả lại, chỉ hiện khi có nội dung]
card "1. Thông tin chung"
  6+6   Người đề nghị | Đơn vị
  6+6   Loại đề nghị | Mức độ khẩn
  12    Lý do cần gấp           (hiện khi Mức độ khẩn = Gấp)
  12    Mục đích / nội dung     (textarea)
card "2. Chi tiết"              (danh sách hoặc ngân sách)
  nested-list / table (12)
  [callout thông tin/cảnh báo theo điều kiện]
  6     Tổng giá trị (VND)      (cuối phần, căn phải: colStart 7)
card "3. Tài liệu & cam kết"
  12    File đính kèm
  12    Checkbox cam kết
hàng nút: [Lưu nháp] .... [Gửi đề nghị]   (colStart căn phải)
```

Biến thể bước duyệt: thêm `descriptions` chỉ đọc ở đầu form (tóm tắt đề nghị), card "Ý kiến duyệt" (radio Duyệt/Từ chối + textarea lý do bắt buộc khi từ chối).

## 2. Đăng ký (công khai, thoáng, 1 card)

Dùng cho: đăng ký sự kiện, đăng ký tư vấn, đăng ký học bổng bước đầu.

```
form_title, form_desc
card (một card duy nhất, không đánh số)
  6+6   Họ và tên | Ngày sinh
  6+6   Email | Số điện thoại
  12    Nội dung quan tâm (select) hoặc ghi chú (textarea)
  12    Checkbox đồng ý điều khoản
hàng nút: [Đăng ký]  (12 cột trên mobile, 4 cột căn phải trên desktop)
```

Ít field, không chia nhóm. Cảm giác thoáng: không callout trừ khi có lưu ý quan trọng.

## 3. Khảo sát (nhiều câu hỏi)

Dùng cho: khảo sát sinh viên, đánh giá giảng viên.

```
form_title, form_desc  (nêu thời lượng: "Khoảng 3 phút")
card "Phần A — Thông tin chung"        (2–4 field)
card "Phần B — Đánh giá"
  radio-group hoặc matrix (12), mỗi câu một dòng, ≤ 8 câu mỗi card
card "Phần C — Góp ý"
  12    textarea góp ý
hàng nút: [Gửi khảo sát]
```

Hơn ~15 câu: chuyển sang `steps`, mỗi bước một phần, `stepsOptions.showProgress: true`.

## 4. Bộ lọc / tìm kiếm (không card)

Dùng cho: hàng lọc phía trên bảng danh sách.

```
hàng 1:  5 Từ khoá (input) | 3 Trạng thái (select) | 4 Ngày tạo (range-picker không vừa 4 thì dùng 6 và bỏ bớt một ô)
hàng 2:  cụm nút [Xoá bộ lọc] [Tìm kiếm] căn phải (container không viền, flex)
```

Ô lọc có nhãn, nút đứng cùng hàng thì nút dùng `alignSelf: "end"`. Công thức hàng bộ lọc và cụm nút: `../../dynaform-layout/SKILL.md` §5. Không tiêu đề, không mô tả, không card.

## 5. Hồ sơ nhiều phần (`steps`)

Dùng cho: hồ sơ nhập học, hồ sơ xét học bổng, đăng ký dài.

```
form_title, form_desc
steps  (stepsOptions.showProgress: true, validateOnNext: true)
  bước 1 "Thông tin cá nhân"   → 1–2 card
  bước 2 "Thông tin học tập"   → 1–2 card
  bước 3 "Tài liệu & xác nhận" → card đính kèm + cam kết
nút Quay lại / Tiếp theo / Hoàn tất do `stepsOptions` cung cấp (không dựng nút riêng)
```

- Tên bước là danh từ ngắn, đúng tên card đầu của bước.
- Mỗi bước ≤ 2 card, ≤ 12 field.
- `steps` có tên cũng lồng dữ liệu (xem "Ràng buộc dữ liệu" trong `../SKILL.md`): đặt tên bước bằng danh từ dữ liệu hoặc không đặt nếu server cho phép.
