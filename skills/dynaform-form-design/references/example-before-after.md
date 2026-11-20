# Ví dụ: một form thật, trước và sau

Form gốc là form thử "Mua sắm — Bước 1: Người đề nghị" do Agent dựng khi chưa có skill này (đọc từ DEV ngày 2026-11-20, nhãn và option là dữ liệu thử). Mục đích: thấy từng quy tắc đổi gì. Bản "sau" viết trên giấy theo khoá gọn, **chưa nạp vào builder để xem render** — dùng làm hình mẫu cấu trúc, chấm lại bằng `review-rubric.md` sau khi dựng.

## Trước

```
text <h3>   Bước 1 — Đề nghị mua sắm
textarea    Ý kiến trả lại                              ← ô trần, ngoài card
container "order" (card)                                ← 17 control trong một card
  text <h4> 1. Thông tin chung
  6+6  Người đề nghị | Phòng ban
  6+6  Loại mua sắm | Mức độ khẩn
  12   Lý do cần gấp
  6+6  Cần trước ngày | Mã ngân sách
  6    Ngân sách còn lại (VND)   help: "Host nạp từ hệ thống ngân sách…"   ← ghi chú cho dev
  12   Mục đích sử dụng
  text <h4> 2. Hàng hoá / dịch vụ                       ← phần 2 nằm chung card phần 1
  nested-list 5+2+2+3
  6+6  Tổng giá trị | VAT          help: "Nhập tay = Σ … (form chưa có phép nhân)"  ← ghi chú cho dev
  text <p style="color:#b91c1c"> ⚠ vượt ngân sách        ← chỉ đổi màu chữ
  text <p style="color:#1d4ed8"> ℹ giá trị > 100 triệu
  12   Địa điểm giao hàng
container "docs" (card)                                 ← phần 3 là card riêng
  text <h4> 3. Tài liệu & cam kết
  file, checkbox
```

Chấm theo `review-rubric.md`: **11/20**, dính 3 lỗi chết.

| Mục | Điểm | Vì sao |
|---|---|---|
| Phân cấp | 3/4 | Có tiêu đề, thiếu mô tả |
| Nhóm | 1/4 | Phần 1 và 2 chung một card 17 control; phần 3 card riêng không nhất quán; ô "Ý kiến trả lại" mồ côi |
| Nhịp | 3/4 | "Ngân sách còn lại" đứng lẻ 6 cột, trống nửa hàng |
| Chữ | 1/3 | Hai `helpText` là ghi chú cho người dựng form, không phải người điền |
| Trạng thái | 0/2 | Callout chỉ là chữ màu cứng; tổng tiền không nổi bật |
| Hành động | 2/2 | Nút do host cung cấp |
| Mobile | 1/1 | Có `overrides.sm` đủ |

Lỗi chết: màu hardcode; ô mồ côi dưới tiêu đề; card > 10 field.

## Sau — phương án A: tách 4 card (đổi cấp dữ liệu)

Chỉ dùng khi form chưa bị workflow hoặc host bind (xem "Ràng buộc dữ liệu" trong `../SKILL.md`). `key_path` đổi từ `order.requester` thành `requester_info.requester`.

```
text <h3>   Bước 1 — Đề nghị mua sắm
text (muted) Điền thông tin để gửi quản lý duyệt. Các mục có dấu * là bắt buộc.
text (callout cảnh báo, hiện khi có ý kiến trả lại)   ⚠ Ý kiến trả lại: {nội dung}

container "general" (card)
  text <h4> 1. Thông tin chung
  6+6  Người đề nghị | Phòng ban
  6+6  Loại mua sắm | Mức độ khẩn
  12   Lý do cần gấp              (hiện khi Mức độ khẩn = Gấp / Khẩn cấp)
  12   Mục đích sử dụng

container "budget" (card)
  text <h4> 2. Ngân sách & giao hàng
  6+6  Mã ngân sách | Ngân sách còn lại (VND)   (readOnly)
  6+6  Cần trước ngày | Địa điểm giao hàng

container "goods" (card)
  text <h4> 3. Hàng hoá / dịch vụ
  nested-list 5+2+2+3
  [callout cảnh báo: vượt ngân sách còn lại]      (ẩn theo điều kiện)
  [callout thông tin: giá trị > 100 triệu]         (ẩn theo điều kiện)
  6+6  Thuế VAT | Tổng giá trị dự toán (VND)       (tổng đứng cuối, in đậm)

container "docs" (card)
  text <h4> 4. Tài liệu & cam kết
  12   Đặc tả / yêu cầu kỹ thuật (file)
  12   Checkbox cam kết
```

Thay đổi so với bản trước:

- Mỗi phần một card, cùng kiểu; không card nào quá 6 field (trừ `goods` có nested-list).
- Địa điểm giao hàng đi cùng "Cần trước ngày" (cùng nghĩa giao hàng), nên "Ngân sách còn lại" có cặp, hết hàng trống nửa.
- "Ý kiến trả lại" thành callout cảnh báo ở đầu form, hiện khi có nội dung.
- Callout có nền/viền bằng `custom.css` (`design-rules.md` §6), bỏ màu cứng. Mỗi card có padding 20 và mỗi tiêu đề có `custom.css` cỡ chữ/độ đậm.
- Phần cuối đánh lại số **4.** (bản dựng đầu quên sửa nên vẫn là "3." — lỗi do Agent, thấy ngay khi mở preview).
- Hai ghi chú cho dev (`helpText`) bỏ khỏi form; thông tin đó thuộc báo cáo cho người dựng, không phải người điền.
- VAT đứng trước tổng; tổng đứng cuối phần.

## Sau — phương án B: giữ một cấp dữ liệu `order`

Dùng khi form là bước của workflow (bind `order.requester`…) hoặc host nạp `{ order: { … } }`. Chỉ có **một** `container "order"`; các phần chia bằng `divider` + tiêu đề + mô tả, **không** thêm container có tên.

```
text <h3>   Bước 1 — Đề nghị mua sắm
text (muted) …
text (callout cảnh báo — ý kiến trả lại)

container "order" (card)
  text <h4> 1. Thông tin chung
  …(như phương án A, card general)

  divider
  text <h4> 2. Ngân sách & giao hàng
  …

  divider
  text <h4> 3. Hàng hoá / dịch vụ
  …

  divider
  text <h4> 4. Tài liệu & cam kết
  …
```

Đánh đổi so với A: card dài hơn (nhiều phần trong một khung) nhưng `key_path` giữ nguyên `order.*`, không phải đổi bind của workflow. Nếu card dài quá ~18 field thì cân nhắc `steps` hoặc đổi sang phương án A và cập nhật bind.

Điểm: A ≈ 19–20/20 (ước tính trên giấy). B = 19/20 chấm tĩnh trên JSON đã dựng thật (trừ 1 ở mục Nhóm vì dồn nhiều phần vào một card); chưa rà bằng ảnh preview.
