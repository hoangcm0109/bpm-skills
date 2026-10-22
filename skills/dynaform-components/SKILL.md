---
name: dynaform-components
description: Danh mục component (type) của dynaform builder và cách chọn đúng type cho từng loại dữ liệu — input, tel, select, date-picker, file, table, container, tab, steps, dialog… Dùng khi cần quyết định dùng component nào (ưu tiên control có sẵn; custom-embed chỉ là lựa chọn cuối, viết bằng React + Tailwind), cấu hình thuộc tính riêng của một component, hoặc khi gặp lỗi "type không có trong registry".
---

# Component dynaform

Registry gốc: `src/config/component-groups.ts` (fe_dynaform). Script sinh form chỉ nhận type trong bảng dưới; type lạ bị từ chối.
Control tự định nghĩa của host (`defineControl`, tiền tố `x-`) cũng hợp lệ trong builder nhưng script **không** biết — validate sẽ báo, cần thêm vào registry nếu dùng.

## Chọn type theo dữ liệu

| Cần | Dùng | Ghi chú |
|---|---|---|
| Văn bản 1 dòng (tên, mã) | `input` | `attributes.type`: `text` |
| Văn bản nhiều dòng | `textarea` | |
| Email | `email` | kèm validation `email` |
| Mật khẩu / nhập lại | `password` | nhập lại → `matchField` |
| Số điện thoại | `tel` | **không** có type `phone` |
| Số (tuổi, số lượng, tiền) | `number` | `dataType: "number"` |
| URL | `url` | |
| Chọn 1 trong danh sách dài / từ API | `select` | luôn có options hoặc dataSource |
| Chọn 1 trong ít lựa chọn, hiện sẵn | `radio-group` | cần `options` |
| Chọn nhiều | `checkbox-group` | cần `options` |
| Đồng ý / bật tắt 1 giá trị | `checkbox` (đồng ý điều khoản), `switch` (cài đặt) | |
| Chọn dạng cây | `tree-select` | |
| Ngày | `date-picker`; khoảng ngày → `range-picker`; lịch hiện sẵn → `calendar` | |
| Giờ | `time-picker` | |
| Thanh trượt | `range-slider` | |
| Tệp đính kèm | `file` | cấu hình giới hạn qua `props.fileValidations` — nên chỉnh trong builder |
| Chữ ký | `signature` | |
| Soạn thảo văn bản định dạng | `wysiwyg-editor` | |
| Giá trị phải nằm trong payload submit mà không có nguồn hiển thị | `hidden` | **hạn chế** — không dùng làm cờ/tín hiệu giữa các event; xem "Ưu tiên action flow" ở `dynaform-logic-events` |
| Bảng khảo sát (hàng × cột chấm điểm) | `matrix` | |
| Hiển thị bảng dữ liệu | `table` | không dùng để thu 1 giá trị |
| Văn bản tĩnh / tiêu đề | `text` | `content` là HTML; không thu dữ liệu |
| Ảnh tĩnh, liên kết, đường kẻ | `image`, `link`, `divider` | `image` ≠ upload (`file`) |
| Nút | `submit-button` (gửi form), `button` (hành động phụ), `reset-button` | |

## Layout / container (có con)

| Type | Dùng để | Ngăn của con (`tabId`) |
|---|---|---|
| `container` | nhóm field thành 1 khối/section | — |
| `tab` | chia tab | id trong `tabs[]` |
| `steps` | wizard nhiều bước | id trong `steps[]` |
| `columns` | 2–4 cột cạnh nhau | `col-0`, `col-1`… |
| `grid` | lưới hàng × cột cố định | theo slot — **nên dựng trong builder** |
| `dialog` / `drawer` / `bottom-sheet` | overlay; mở bằng action `dialog` | — (variant `form`/`custom` mới có con) |
| `list` / `nested-list` | danh sách lặp (nhiều mục cùng cấu trúc) | — |

Chi tiết cách bố cục: skill `dynaform-layout`.

## Control chuyên dụng — tra trước khi nghĩ tới custom-embed

| Nhu cầu | Dùng | Ghi chú |
|---|---|---|
| Bảng dữ liệu từ API (phân trang, hành động từng dòng, cột HTML/ngày) | `table` | `docs/DATA_TABLE.md` |
| Dòng thời gian / lịch sử | `timeline` | `docs/TIMELINE.md` |
| Cặp nhãn–giá trị chỉ đọc (chi tiết hồ sơ) | `descriptions` | |
| Chọn bản ghi từ API dạng thẻ (lọc, tìm kiếm, xem chi tiết) | `record-picker` | `docs/COLLECTION_CONTROLS.md` |
| Thư viện thẻ/ảnh chọn nhiều, sắp xếp, phân trang, thanh hành động | `record-gallery` | |
| Thẻ KPI bấm được để lọc | `stat-cards` | |
| Danh sách kéo thả đổi thứ tự | `sortable-list` | |
| Bảng khảo sát hàng × cột / chấm điểm | `matrix` | |
| Chọn dạng cây | `tree-select` | |
| Lặp một khối control theo mảng dữ liệu | `form-loop`, `list`, `nested-list` | `list` = 1 control/dòng, `nested-list` = nhiều control/dòng |
| Nhúng form khác vào màn hình nhiều form | `sub-form` | layout runtime |
| Hiện JSON / mã | `json-tree`, `code` | |
| Chữ ký, soạn thảo định dạng, lịch, thanh trượt, tệp | `signature`, `wysiwyg-editor`, `calendar`, `range-slider`, `file` | |

Ngoài ra, nhiều nhu cầu chỉ là **diện mạo**: dùng `custom` (class Tailwind / CSS cho khung ngoài, ô nhập, nhãn) trước khi nghĩ tới viết control mới.

## Khi nào mới dùng `custom-embed`

`custom-embed` (một control, tự viết giao diện bằng code) là **lựa chọn cuối cùng**. Đi hết các bước sau mà vẫn không đủ mới dùng:

1. Có control cơ bản/chuyên dụng ở hai bảng trên làm được không?
2. Ghép được bằng `custom` (Tailwind) + `props` + action flow không?
3. Phần "thiếu" có phải chỉ là giao diện hiển thị dữ liệu *chỉ đọc*? → thử `descriptions` / `timeline` / `table` / `stat-cards` trước.

Nếu vẫn phải dùng:
- Spec ghi `reason` (đã thử control nào, thiếu gì) — script báo lỗi nếu thiếu.
- **React 19 + Tailwind** (`mode: "sandbox"`, `framework: "react"`, `tailwind: true`) — mặc định của script. Template (HTML + `{{ }}`) / JS thuần / CSS thuần chỉ cho khối tĩnh rất đơn giản; trong builder, hộp "Mã nhúng" cũng đặt React + Tailwind làm lựa chọn khuyến nghị.
- Viết đủ tên class Tailwind, màu theo token theme (`bg-card border-border text-foreground`…), `dark:` chạy được.
- Giao tiếp qua `inputs` (field → embed), `outputs` (embed → field qua `dfb.publish`), `events` (`dfb.emit` → handler `embed:<tên>` chạy action flow). Không dùng field `hidden` làm cầu nối.
- Cú pháp, ví dụ chạy được, bước "mở builder → Lưu" để sinh Tailwind: `../dynaform-build-form/references/custom-embed.md`; tài liệu lib: `docs/CUSTOM_EMBED.md` §19–21.

## Quy tắc cho mọi component

- `name` snake_case duy nhất; nên có tiền tố nhóm khi form lớn (`addr_province`).
- Component thu dữ liệu phải có `name`; `text`/`image`/`divider` không cần ràng buộc nhưng vẫn cần `name` duy nhất trong spec.
- Cấu hình riêng của một type nằm ở `props` (passthrough vào `editable_props.properties`). Chỉ truyền khoá bạn **đã xác nhận** từ docs/builder; khoá lạ vẫn được lưu nhưng có thể không có tác dụng.
- Gặp control cấu hình phức tạp (table, matrix, file, record-*, custom-embed): dựng khung bằng script, sau đó mở builder để cấu hình chi tiết và Save. Riêng `custom-embed` còn cần Lưu trong hộp "Mã nhúng" để sinh Tailwind.

## Style tuỳ chỉnh — CSS thuần / class Tailwind (lib ≥ 4.6.0)

Mọi control (nhập liệu, content, layout, overlay) nhận `custom` trong spec → `properties.custom`:

```jsonc
{ "type": "input", "name": "email", "custom": {
  "className": "rounded-xl border p-4 hover:bg-muted",        // khung ngoài (label + ô nhập + lỗi): Tailwind
  "css": "background: #f8fafc; &:hover { box-shadow: 0 2px 8px #0002 }",  // khung ngoài: CSS thuần
  "control": { "className": "border-2 border-rose-500 rounded-xl" },     // CHÍNH ô nhập (chỉ control nhập liệu)
  "label":   { "className": "font-bold uppercase text-rose-600" }        // nhãn của field (chỉ control nhập liệu)
} }
```

- Phần **`control`** = input / textarea / select / checkbox / switch (Button thì là chính nút); **`label`** = nhãn của field. Container / content / layout chỉ có khung ngoài; Dialog / Drawer / Bottom sheet áp lên panel khi mở.
- Class viết Tailwind thường (`p-4`, `hover:`, `dark:`, `w-[37px]`, `@max-3xl:`); phải **viết đủ tên class** (không ghép `p-${n}`). CSS thuần: khai báo trực tiếp hoặc rule lồng (`&:hover {…}`, `& input {…}`); `@import`, `expression()`, `url()` ngoài `https:` bị lọc.
- **Đừng tự điền `tailwindCss` / `twHash`**: builder tự sinh khi form được nạp vào editor (`loadFormJson` / Open JSON / mở editor). Form chưa qua editor chỉ hiện CSS thuần cho tới khi được lưu từ builder — nên sau khi dựng bằng script, mở form trong builder một lần và Save.
- Host tắt được bằng `embedPolicy.allowCustomCss: false`. Chi tiết: `docs/CUSTOM_STYLE.md` trong fe_dynaform.

## Tài liệu sâu trong fe_dynaform (đọc khi cần)

`docs/DATA_TABLE.md`, `docs/CUSTOM_STYLE.md`, `docs/COLLECTION_CONTROLS.md`, `docs/FILE_UPLOAD_CONFIG_GUIDE.md`, `docs/CUSTOM_EMBED.md`, `docs/CONTROL_OVERRIDES.md`, `docs/TIMELINE.md`, `docs/WYSIWYG_EDITOR_GUIDE.md`.
