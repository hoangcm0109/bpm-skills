---
name: dynaform-components
description: Danh mục component (type) của dynaform builder và cách chọn đúng type cho từng loại dữ liệu — input, tel, select, date-picker, file, table, container, tab, steps, dialog… Dùng khi cần quyết định dùng component nào, cấu hình thuộc tính riêng của một component, hoặc khi gặp lỗi "type không có trong registry".
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
| Giá trị ẩn gửi kèm (id, token) | `hidden` | |
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

## Quy tắc cho mọi component

- `name` snake_case duy nhất; nên có tiền tố nhóm khi form lớn (`addr_province`).
- Component thu dữ liệu phải có `name`; `text`/`image`/`divider` không cần ràng buộc nhưng vẫn cần `name` duy nhất trong spec.
- Cấu hình riêng của một type nằm ở `props` (passthrough vào `editable_props.properties`). Chỉ truyền khoá bạn **đã xác nhận** từ docs/builder; khoá lạ vẫn được lưu nhưng có thể không có tác dụng.
- Gặp control cấu hình phức tạp (table, matrix, file, custom-embed): dựng khung bằng script, sau đó mở builder để cấu hình chi tiết và Save.

## Tài liệu sâu trong fe_dynaform (đọc khi cần)

`docs/DATA_TABLE.md`, `docs/TABLE_FILTER.md`, `docs/COLLECTION_CONTROLS.md`, `docs/FILE_UPLOAD_CONFIG_GUIDE.md`, `docs/CUSTOM_EMBED.md`, `docs/CONTROL_OVERRIDES.md`, `docs/TIMELINE.md`, `docs/WYSIWYG_EDITOR_GUIDE.md`.
