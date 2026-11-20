---
name: dynaform-form-design
description: Thiết kế bố cục và thẩm mỹ form dynaform TRƯỚC khi viết JSON — brief, outline, chia card/nhóm, tiêu đề, callout, nhịp 12 cột, chọn phẳng/tab/steps, nút hành động. Dùng khi dựng hoặc làm lại form mà cần form gọn, có phân cấp, không bị "rải hết control ra". Từ khoá — form đẹp, thiết kế form, bố cục form, UI/UX form, form xấu, làm lại form, redesign form, outline form.
---

# Thiết kế form dynaform (gu "hành chính gọn")

Skill này quyết định **form trông thế nào**: nhóm gì, thứ tự nào, nhấn chỗ nào. Nó đứng *trước* hai skill kia:

- `../dynaform-layout/SKILL.md` — cách đặt control (lưới 12 cột, `colSpan`, `columns`, `grid`, responsive).
- `../dynaform-build-form/SKILL.md` — cách viết JSON và tự kiểm cấu trúc.

Gu mặc định: card theo từng phần, tiêu đề có số và mô tả ngắn, 2 cột đều, callout rõ ràng, một nút chính. Hợp form nghiệp vụ (đơn từ, đề nghị, hồ sơ). Người dùng muốn gu khác (thoáng kiểu đăng ký công khai, dày kiểu nhập liệu nội bộ) thì nói rõ trong brief và chỉnh số field mỗi card / số cột theo.

## Quy trình — làm theo thứ tự, không bỏ bước

1. **Brief** (3 dòng, hỏi lại nếu thiếu): ai điền, điền để làm gì, dùng máy tính hay điện thoại. Form có phải bước của workflow hoặc nhận dữ liệu điền sẵn từ host không — câu trả lời quyết định có được chia nhiều card hay không (xem "Ràng buộc dữ liệu").
2. **Gom nhóm**: xếp field vào nhóm theo nghĩa, đặt tên nhóm bằng danh từ ≤ 4 từ ("Thông tin chung", "Hàng hoá / dịch vụ"). Field không vào được nhóm nào thì nghi ngờ có cần field đó không.
3. **Chọn cấu trúc** theo bảng ngưỡng dưới.
4. **Xuất outline** theo mẫu dưới cho người dùng duyệt rồi mới viết JSON. Form ≤ 6 field: outline 1–2 dòng, không cần chờ duyệt.
5. **Viết JSON** theo `dynaform-build-form`, rồi **tự chấm** bằng `references/review-rubric.md`. Dưới 16/20 hoặc dính lỗi chết thì sửa trước khi giao.
6. **Báo cáo**: kèm điểm tự chấm và những quy tắc đã cố ý bỏ qua (kèm lý do).

## Bảng ngưỡng chọn cấu trúc

| Tình huống | Cấu trúc |
|---|---|
| ≤ 6 field, một chủ đề | một card hoặc phẳng, 2 cột |
| 7–20 field, 2–4 nhóm nghĩa | mỗi nhóm một card trong cùng trang |
| > 20 field, hoặc > 4 card, hoặc điền tuần tự | `steps` (mỗi bước ≤ 2 card) |
| Các phần độc lập, người dùng nhảy qua lại | `tab` |
| Bộ lọc / tìm kiếm | một hàng ngang, không card |

## Mười quy tắc cốt lõi (chi tiết + ví dụ ở `references/design-rules.md`)

1. Form có **tiêu đề** và **một câu mô tả** ở đầu. `<h3>`/`<h4>` trong `text` render như chữ thường nên **luôn kèm `custom.css`** để có cỡ chữ và độ đậm.
2. **Mỗi nhóm nghĩa là một card** có **padding 4 cạnh** (`styles.padding*`, lib không đặt mặc định), **không bóng** (`styles.showShadow: "no"`, lib ≥ v5.9.0) và tiêu đề (đánh số nếu ≥ 3 phần). Không để nhiều phần trong cùng một card chỉ ngăn bằng thẻ `<h4>`.
3. Mỗi **phần** có **4–8 field**; tối đa 10. Card nhiều hơn 10 field chỉ chấp nhận khi chia thành các phần bằng `divider` + tiêu đề (phương án B).
4. **Thứ tự theo luồng nghĩ**: nhận diện → bối cảnh → nội dung chính → số liệu tổng → đính kèm → cam kết → nút.
5. **Nhịp 6+6 làm nền**; field ngắn (ngày, số, mã) 4 hoặc 3; `textarea` 12 và dồn xuống cuối card; mọi hàng cộng đủ 12.
6. **Nhãn ngắn**, `placeholder` là ví dụ chứ không lặp nhãn, `helpText` chỉ khi có quy tắc hoặc ngoại lệ.
7. **Callout** (cảnh báo / thông tin) là `text` có nền, viền, dựng bằng **`custom.css`**. Không dùng `custom.className` Tailwind khi viết JSON tay (chưa qua builder thì không có CSS) và không hardcode `style="color:#…"`.
8. **Số liệu tổng** (tổng tiền, kết quả) đặt cuối phần, tách hàng, nổi bật hơn field thường.
9. **Một nút chính** ở cuối, căn phải; nút phụ bên trái nó; không quá 3 nút.
10. Ẩn/hiện theo điều kiện thì ẩn **cả nhóm** (cả card), không ẩn lẻ từng field.

## Ràng buộc dữ liệu — card cũng là cấp dữ liệu

Theo mã lib (`fe_dynaform/src/lib/nest-form-values.ts`): `container`, `tab`, `steps`, `columns`, `grid` đều **lồng dữ liệu khi có `variables.name`**. Con của chúng nằm trong `key_path` dạng `<tên card>.<tên field>`, `dataUserFill` và `bound_variables` phải lồng theo, bind phẳng không nhận. Hệ quả cho thiết kế:

- Chia N card = N đối tượng dữ liệu. Đặt tên card bằng danh từ dữ liệu (`requester_info`, `items`), không dùng `container_1`.
- Form là bước của workflow, hoặc host nạp sẵn dữ liệu, hoặc đã có consumer đọc `form_data` phẳng: **hỏi người dùng trước khi tách thêm card**. Nếu giữ nguyên cấp dữ liệu, dùng **một card** và chia phần nhìn thấy bằng `text` tiêu đề + `divider` (phương án B trong `references/example-before-after.md`).
- Form mới, không ràng buộc nào: chia card theo nhóm nghĩa tự do.

Chưa kiểm: `save_form_design` có nhận `columns`/`tab`/`steps`/`grid` **không tên** hay không (container không tên bị server từ chối). Nếu nhận được thì layout không tên không thêm cấp dữ liệu.

## Mẫu outline

```
FORM: Đề nghị mua sắm   (người dùng: nhân viên, desktop; dữ liệu: workflow → giữ 1 cấp `order`)
Tiêu đề + mô tả: "Đề nghị mua sắm" / "Điền thông tin để gửi lãnh đạo phê duyệt."
Cấu trúc: 1 trang, 3 card
 1. Thông tin chung      (6 field)  Người đề nghị | Phòng ban ; Loại mua sắm | Mức độ khẩn ; Mục đích (12)
 2. Hàng hoá / dịch vụ   (nested-list + 2 field)  ... ; callout: vượt ngân sách (ẩn theo điều kiện)
 3. Tài liệu & cam kết   (2 field)
Nút: Gửi đề nghị (cuối, căn phải)
Cần xác nhận: có được tách 3 card (đổi cấp dữ liệu) không?
```

## Tham chiếu

- `references/design-rules.md` — quy tắc chi tiết, công thức callout, tiêu đề card, nút.
- `references/patterns.md` — 5 khuôn mẫu theo loại form (khoá gọn).
- `references/review-rubric.md` — thang chấm 20 điểm, lỗi chết, cách rà bằng ảnh preview.
- `references/example-before-after.md` — một form thật trước và sau khi áp quy tắc.
