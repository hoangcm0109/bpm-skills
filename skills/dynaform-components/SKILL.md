---
name: dynaform-components
description: Danh mục component (type) của dynaform builder và cách chọn đúng type cho từng loại dữ liệu — input, tel, select, date-picker, file, table, container, tab, steps, dialog… Mô tả đầy đủ control layout (container, columns 2/3/4, grid, tab, steps, dialog/drawer/bottom-sheet, list, form-loop, sub-form: khoá cấu hình, cách đặt con, lỗi thường gặp). Dùng khi cần quyết định dùng component nào (ưu tiên control có sẵn; custom-embed chỉ là lựa chọn cuối, viết bằng React + Tailwind), cấu hình thuộc tính riêng của một component, hoặc khi gặp lỗi "type không có trong registry".
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

## Control layout (có con) — chọn đúng loại, cấu hình đúng khoá

Control layout chứa control khác. Con khai báo trong spec bằng `parent: "<name cha>"` (+ `tabId` tuỳ loại cha); **cha phải đứng trước con** trong mảng. Bên trong mỗi vùng chứa là một lưới 12 cột riêng — số cột từng con chiếm xem `../dynaform-layout/SKILL.md`.

| Type | Dùng để | Con xác định vị trí bằng | Khoá spec riêng |
|---|---|---|---|
| `container` | nhóm field thành 1 khối (có khung/không) | thứ tự mảng + `colSpan` | `container: { type, border, borderType }` |
| `columns` (2/3/4 cột) | chia vùng thành cột **rộng khác nhau** | `tabId: "col-0".."col-N"` | `columns: { count, spans, gap, stackOnMobile }` |
| `grid` | bảng ô đều hàng × cột, gộp ô | **thứ tự** (ô lấp dần: hàng trước, cột sau) | `grid: { cols, rows, columnWidths, gap, stackOnMobile, spans }` |
| `tab` | chia tab | `tabId` = id trong `tabs[]` | `tabs: [{ id, label }]` |
| `steps` | wizard nhiều bước | `tabId` = id trong `steps[]` | `steps: [{ id, label }]`, `stepsOptions` |
| `dialog` / `drawer` / `bottom-sheet` | overlay mở bằng action `dialog` | thứ tự mảng (chỉ variant `form`/`custom` có con) | `dialog: { variant, title, … }` |
| `list` / `nested-list` | thêm/xoá dòng lặp do người dùng | thứ tự mảng (con = cột của một dòng) | `list: { minRows, initialRows, maxRows, addButtonLabel }` |
| `form-loop` | lặp khối theo mảng dữ liệu có sẵn | thứ tự mảng | `loop: { mode, dataPath, itemAlias, … }` |
| `sub-form` | nhúng form khác (layout nhiều form) | — (không có con) | `props.subForm: { alias }` |

Chọn nhanh: field đứng cạnh nhau trong một nhóm → chỉ cần `colSpan` trên field. Cột có độ rộng khác nhau (8 + 4) hoặc nhiều control xếp dọc trong một cột → `columns`. Ô đều/gộp ô → `grid`. Tách phần độc lập → `tab`. Tuần tự có kiểm từng bước → `steps`.

### `container`
- Gom field; **không có** `colSpan` riêng cho con ngoài lưới 12 cột bên trong nó.
- `container.type`: `"div"` (mặc định), `"card"` (khung thẻ), `"fieldset"` (khung có `legend`). `container.border`: `true|false` (lib mặc định có viền liền); `container.borderType`: `solid|dashed|dotted`.
- **Tiêu đề container (`showTitle`/`title`) chưa lưu được vào JSON ở lib 4.7.0** (đọc mã: `properties.content.title` bị loại khỏi export). Làm tiêu đề bằng control `text` (`<h3>…</h3>`) đặt làm con đầu tiên.
- Hợp để đặt rule ẩn/hiện cả nhóm bằng một handler (`field_state` trên `container`).

### `columns` — `2 columns`, `3 columns`, `4 columns`
- Cùng một type `columns`; `columns.count` = 2–4 (script chọn `renderer_key` DfsColumns2/3/4 theo `count`).
- `columns.spans` = độ rộng mỗi cột trên lưới **12**, tổng phải **12**: `[6,6]`, `[4,4,4]`, `[3,3,3,3]`, `[8,4]`, `[3,9]`, `[3,6,3]`. Thiếu `spans` thì chia đều.
- `columns.gap` (mặc định `"1rem"`), `columns.stackOnMobile: "yes"|"no"` (mặc định `yes`: dưới 768px các cột xếp chồng).
- Con của cột nào khai `tabId` đúng cột đó (`col-0` là cột đầu). **Bắt buộc** — thiếu `tabId` script báo lỗi.
- Trong mỗi cột, con lại dùng `colSpan` trên lưới 12 cột của chính cột đó (mặc định 12 = đầy cột).
- Khi nào dùng `columns` thay `colSpan`: cột rộng khác nhau; cột chứa **nhiều control dọc** (vd cột trái ảnh + chú thích); muốn tự xếp chồng cả cột trên mobile.

```jsonc
{ "type": "columns", "name": "two", "columns": { "count": 2, "spans": [8, 4] } },
{ "type": "input", "name": "title", "parent": "two", "tabId": "col-0", "label": "Tiêu đề" },
{ "type": "image", "name": "cover", "parent": "two", "tabId": "col-1" }
```

### `grid`
- `grid.cols` (script chấp nhận 1–6), `grid.rows` (mặc định tự tính = ⌈số con / cols⌉), `grid.columnWidths` (mảng CSS, vd `["1fr","2fr","200px"]`, mặc định `1fr` đều), `grid.gap` (mặc định `"1rem"`), `grid.stackOnMobile` (`yes` mặc định).
- **Con lấp ô theo thứ tự** (slot = hàng × cols + cột), **không có `tabId`**, mỗi ô chứa đúng **1** control; muốn nhiều control trong một ô thì bọc bằng `container`. Script dựng theo thứ tự nên không chừa ô trống ở giữa.
- Gộp ô: `grid.spans: { "<slot>": { "r": 1, "c": 2 } }` (ô `slot` trải `r` hàng × `c` cột; các ô bị phủ bị bỏ khỏi số ô khả dụng). Số con không được vượt số ô khả dụng.
- Dùng cho dashboard thẻ số liệu, bảng form dày. Form nhập liệu thường dùng `colSpan` / `columns` hợp hơn.

### `tab`
- `tabs: [{ "id": "tab-1", "label": "Thông tin" }, …]` (id duy nhất, ổn định — con tham chiếu id này). Mỗi con của tab khai `parent` + `tabId`. Panel trong tab là lưới 12 cột.
- Muốn chặn người dùng sang phần sau khi phần trước chưa hợp lệ → dùng `steps` + `validateOnNext`, không dùng `tab`.
- Chuyển tab bằng code (`switch_tab`) **chưa có tác dụng**; người dùng tự bấm.

### `steps`
- `steps: [{ "id": "step-1", "label": "…" }, …]`; con khai `parent` + `tabId` = id bước.
- `stepsOptions`: `showPrevious`, `showProgress`, `validateOnNext` (kiểm bước hiện tại trước khi sang bước sau), `defaultPreviousLabel`, `defaultNextLabel`, `finishLabel`, `progressVariant`: `pills` (mặc định) | `numbered` | `dots` | `tabs` | `wizard`.
- `progressVariant: "wizard"` + `stepsOptions.valueField` (tên field điều khiển bước hiện tại) cho wizard do flow điều khiển (`set_values` ghi vào field đó — một trong số ít trường hợp field ẩn là hợp lý); các variant còn lại tự điều hướng bằng nút Trước/Sau.
- Bước cuối hiện nút `finishLabel`. Nút gửi form (`submit-button`) tuỳ ý đặt ngay sau `steps`.

### `dialog` / `drawer` / `bottom-sheet`
- Overlay **không chiếm chỗ** trong lưới; đứng trước nút mở trong mảng. Mở/đóng bằng action `dialog` (`openModal`/`closeModal`/`toggleModal` hoặc step `dialog`), sự kiện `open`/`close`.
- `dialog.variant`: `confirmation` | `delete` | `form` | `info` | `success` | `warning` | `custom`. **Chỉ `form` / `custom` có con**; các variant còn lại hiển thị `title` + `description`.
- Khoá hay dùng: `title`, `description`, `size` (`xs|sm|md|lg|xl|2xl|3xl|4xl|full`), `showHeader`, `showCloseButton`, `closeOnEsc`, `closeOnOverlayClick`, `openByDefault`, `footer: { show, buttons: [{ id, label, action: "close"|"submit"|"confirm"|"logic"|"event", variant, color }] }`, `trigger: { type: "button"|"logic", buttonLabel, … }` (`logic` = không có nút riêng, mở bằng flow).
- Cấu hình nằm ở `properties.dialog` (dialog), `properties.drawer` (drawer, thêm `side`: `left|right|top|bottom`), `properties.bottomSheet` (bottom-sheet: `minHeight`, `maxHeight`, `dragHandle`). Trong spec luôn viết dưới khoá `dialog`; script chuyển đúng khoá.
- Field bên trong dialog được đăng ký dưới tiền tố của dialog nhưng flow vẫn gọi chúng bằng `name`. Tên có thể trùng tên field gốc (flow tìm từ trong dialog ra ngoài) — tuy nhiên **nên đặt tên duy nhất toàn form**.
- `load` của control trong dialog chạy lại mỗi lần dialog mở (con được mount lại).

### `list` / `nested-list`
- Người dùng bấm "+ thêm" để thêm dòng. `list`: mỗi dòng **1 control** (mảng giá trị đơn); `nested-list`: mỗi dòng **nhiều control** (mảng object). Con khai báo các control của một dòng.
- `list: { minRows, initialRows, maxRows?, addButtonLabel }`.

### `form-loop`
- Lặp khối con theo **mảng có sẵn**: `loop.mode: "variable"` (mảng nằm ở một field/biến, `loop.dataPath` = đường dẫn) hoặc `"dynamic"` (lấy từ Data Source — cấu hình trong builder). `loop.itemAlias` (tên gợi nhớ), `loop.emptyText`, `loop.allowAdd`/`allowRemove`, `loop.submitFields` (liệt kê field của dòng được gửi lên; bỏ trống = tất cả).
- Trong dòng, flow đọc dữ liệu dòng bằng `$row.data.<field>`; điều kiện chỉ theo dòng dùng `change` trong dòng, không dùng `condition` (xem `dynaform-logic-events`).

### `sub-form`
- Nhúng một form khác thành instance riêng (màn hình nhiều form, layout runtime). Script chỉ dựng khung; cấu hình alias/mapping làm trong builder. Không có con.

### Lỗi thường gặp với control layout
| Lỗi | Cách đúng |
|---|---|
| Quên `tabId` cho con của `tab`/`steps`/`columns` | luôn khai `tabId` đúng id/`col-N` |
| Con đứng trước cha trong mảng | cha trước con |
| `columns.spans` không tổng 12 | `[6,6]`, `[4,4,4]`, `[8,4]`… |
| Dùng `grid` rồi cố đặt 2 control vào 1 ô | bọc bằng `container` |
| Đặt `tabId` cho con của `grid`/`container` | chỉ `tab`/`steps`/`columns` mới có `tabId` |
| Muốn tiêu đề cho `container` bằng `container.title` | dùng `text` làm tiêu đề |
| Dialog `confirmation`/`info` có con | nội dung ở `dialog.title/description`; chỉ `form`/`custom` có con |
| Nghĩ `colSpan: 6` tự xuống hàng trên mobile | lib tính desktop trước; script tự thêm `overrides.sm` (xem `dynaform-layout`) |

Chi tiết bố cục (số cột từng control, responsive, công thức): skill `dynaform-layout`.

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
