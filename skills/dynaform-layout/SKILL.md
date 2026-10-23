---
name: dynaform-layout
description: Bố cục form dynaform — lưới 12 cột (colSpan, colStart), mỗi control chiếm bao nhiêu cột, căn dọc trong hàng (alignSelf — nút thẳng đáy với ô nhập), xếp hàng, responsive desktop-first (override sm/md, tự xuống hàng trên mobile), chọn container/columns/grid/tab/steps, công thức bố cục (2-3-4 cột, 8+4, nút căn phải), theme/settings. Dùng khi sắp xếp field thành hàng/nhóm, quyết định số cột cho từng control, chia tab/wizard, chỉnh hiển thị mobile, hoặc đổi theme form.
---

# Bố cục form

Skill này là tài liệu bố cục cho Agent dựng form. Đọc cùng `../dynaform-components/SKILL.md` (cấu hình riêng từng control layout: container, columns, grid, tab, steps, dialog…).
Mọi khoá dưới đây là khoá của **spec** (`*.spec.json`) — script `dynaform.mjs` đổi sang JSON của lib.

## 1. Mô hình: mọi vùng chứa là một lưới 12 cột

- Gốc form, **bên trong** `container`, mỗi cột của `columns`, mỗi panel của `tab`/`steps`, thân dialog/drawer/bottom-sheet, mỗi dòng của `list`/`nested-list`/`form-loop` — **mỗi vùng đó là một lưới CSS 12 cột riêng** (`grid-cols-12`, `gap` 1rem).
- Control có `colSpan` 1–12 (mặc định **12** = cả hàng) tính **trong vùng chứa nó**, không tính theo cả form. Vùng 6 cột bên trong `columns` vẫn có đủ 12 cột con.
- Thứ tự mảng `components` = thứ tự hiển thị. Lib xếp như lưới CSS: cộng dồn `colSpan` theo thứ tự; cộng thêm control mà tổng **> 12** thì control đó xuống hàng mới. Không có khái niệm "hàng" khai báo sẵn.
- `colStart` (`"auto"` hoặc 1–12): đặt cột bắt đầu. Cần `colStart + colSpan − 1 ≤ 12`. Dùng để căn phải (nút) hoặc chừa khoảng trống; còn lại để `auto`.
- `alignSelf` (`"start"` mặc định | `"center"` | `"end"` | `"stretch"`): căn **dọc** của control trong hàng của nó (lib ≥ 4.8.0; trước đó mọi ô cố định `start`). Control trong cùng hàng cao khác nhau (ô nhập có nhãn + nút không nhãn) mặc định dính mép trên; `end` đưa nút xuống ngang đáy ô nhập, `center` căn giữa, `stretch` kéo cao bằng hàng. Đổi theo viewport như `colSpan`: `overrides: { sm: { alignSelf: "start" } }`. Giá trị `start` không ghi ra JSON.
- Nhóm không đầy hàng (vd 6 + 4 = 10) không lỗi nhưng chừa trống bên phải — script cảnh báo.
- Overlay (`dialog`/`drawer`/`bottom-sheet`) không chiếm chỗ trong lưới; đặt trước nút mở.

```jsonc
{ "type": "input", "name": "first_name", "label": "Họ",  "colSpan": 6 },
{ "type": "input", "name": "last_name",  "label": "Tên", "colSpan": 6 },     // cùng hàng: 6 + 6 = 12
{ "type": "textarea", "name": "note", "label": "Ghi chú" }                   // mặc định 12: xuống hàng riêng
```

## 2. Mỗi loại control nên chiếm bao nhiêu cột (gợi ý)

Số dưới là **gợi ý thiết kế** để form đều và đọc được, không phải ràng buộc của lib. Giữ trọn bộ trong cùng một hàng cho tổng 12.

| Nhóm control | `colSpan` | Ghi chú |
|---|---|---|
| `input`, `email`, `password`, `url`, `select`, `tree-select` | **6** (2/hàng) hoặc **4** (3/hàng) | Nhãn dài / giá trị dài (tên cơ quan, địa chỉ email dài) → 12 |
| `tel`, `number`, `date-picker`, `time-picker`, `range-slider` | **4** hoặc **3** | Giá trị ngắn: 3/hàng hoặc 4/hàng; `date-picker` đứng cạnh `time-picker` = 6 + 6 |
| `range-picker` (khoảng ngày) | **6** | Cần chỗ cho 2 ngày |
| `textarea`, `wysiwyg-editor`, `signature`, `calendar` | **12** | Luôn cả hàng |
| `radio-group` | **6** nếu ≤ 3 lựa chọn ngắn; **12** nếu nhiều/dài | |
| `checkbox-group` | **12** (hoặc 6 nếu ≤ 4 lựa chọn ngắn) | |
| `checkbox` (đồng ý điều khoản), `switch` | **12**, hoặc **6** đi kèm field cùng nhóm | |
| `file` | **12** (hoặc 6 nếu chỉ 1 tệp nhỏ) | |
| `table`, `matrix`, `timeline`, `descriptions`, `record-picker`, `record-gallery`, `sortable-list`, `json-tree`, `code`, `custom-embed` | **12** | Control dữ liệu rộng |
| `stat-cards` | **12** | Tự chia thẻ bên trong |
| `text` (tiêu đề / đoạn) | **12** | Tiêu đề nhóm: `text` ở đầu `container` |
| `image` | **4**–**6** (ảnh đại diện cạnh form) hoặc **12** (banner) | |
| `divider` | **12** | |
| `link` | theo ngữ cảnh (thường 12 hoặc cạnh nút) | |
| `button` / `submit-button` / `reset-button` | **12** (nút full), hoặc **3**–**4** + `colStart` để căn phải | Xem công thức "nút căn phải" |
| `container`, `tab`, `steps`, `columns`, `grid`, `list`, `nested-list`, `form-loop`, `sub-form` | **12** | Khối bố cục chiếm cả hàng; cột bên trong chia riêng |
| `dialog`, `drawer`, `bottom-sheet` | (không chiếm chỗ) | |
| `hidden` | (không hiển thị) | Hạn chế dùng — xem `dynaform-logic-events` |

Quy tắc chọn nhanh:
1. Giá trị càng ngắn (mã, số, ngày) → càng ít cột (3–4). Văn bản dài / nhập nhiều dòng → 12.
2. Cùng một hàng chỉ nên chứa các field **cùng nhóm nghĩa** (Họ + Tên; Tỉnh + Quận + Xã).
3. Tối đa **4** control một hàng (mỗi cái ≥ 3 cột). Hơn nữa nhãn bị cắt.
4. Hàng nên cộng đủ **12** (6+6, 4+4+4, 3+3+3+3, 8+4, 9+3, 5+7…).

## 3. Responsive — lib tính **desktop trước**

Điều quan trọng, ngược với thói quen mobile-first:

- `colSpan` ghi ở gốc áp cho **mọi** độ rộng. Tức `colSpan: 6` mà không khai báo gì thêm sẽ vẫn **2 cột cạnh nhau trên điện thoại**.
- Muốn đổi theo độ rộng phải thêm `overrides`:
  - `md` (tablet) — áp khi **bề rộng khung chứa form < 1024px** (container query `@max-5xl`).
  - `sm` (mobile) — áp khi bề rộng khung chứa form **< 768px** (`@max-3xl`); thắng `md` khi cả hai cùng áp.
  - Đo theo khung chứa form (container query), không phải cửa sổ trình duyệt — form nhúng trong panel hẹp cũng tính là "mobile".
  - Không có `lg`: `colSpan` gốc chính là desktop.
- Cú pháp spec (khoá viewport → khoá style; `colSpan`/`colStart` nhận số hoặc chuỗi):
  ```jsonc
  { "type": "input", "name": "city", "colSpan": 4,
    "overrides": { "md": { "colSpan": 6 }, "sm": { "colSpan": 12 } } }
  ```
  (Script đổi sang `editable_props.overrides.<vp>.properties.style.colSpan` — dạng lib đọc. Dạng cũ `{ "sm": { "styles": { … } } }` vẫn được nhận. **Không** tự viết `overrides.sm.styles` thẳng vào JSON: lib bỏ qua nên bố cục không đổi.)
- **Script tự xuống hàng trên mobile**: control nào có `colSpan < 12` mà chưa khai báo `overrides.sm.colSpan` được thêm `sm.colSpan = 12` (và `sm.colStart = "auto"` nếu có `colStart`). Muốn tắt (giữ nguyên cột trên mobile) đặt `"mobile": "keep"` ở gốc spec, hoặc tự khai `overrides.sm` cho control đó.
- Chỉ nên giữ cột trên mobile cho cặp rất ngắn (vd ngày + giờ, số lượng + đơn vị): `"overrides": { "sm": { "colSpan": 6 } }`.
- `columns` và `grid` có `stackOnMobile` (`"yes"` mặc định) — tự về 1 cột khi khung < 768px, không cần override.

## 4. Chọn cấu trúc bố cục

| Muốn | Dùng | Vì sao |
|---|---|---|
| Gom field thành nhóm có khung, tiêu đề | `container` (+ `text` tiêu đề làm con đầu) | Nhìn gọn; ẩn/hiện cả nhóm bằng một rule |
| Chia vùng thành 2–4 cột **cố định, rộng khác nhau** (8 + 4, 3 + 9) | `columns` với `spans` | Kiểm soát độ rộng từng cột; tự xếp chồng trên mobile |
| Bảng ô đều (hàng × cột), có thể gộp ô | `grid` | Chỉ khi cần ô đều/gộp ô; mỗi ô chứa **đúng 1** control |
| Chỉ cần field đứng cạnh nhau trong một nhóm | `colSpan` thẳng trên field | Đơn giản nhất, không thêm tầng lồng |
| Nhiều phần độc lập, không cần thấy cùng lúc | `tab` | |
| Quy trình tuần tự, kiểm từng bước | `steps` (+ `stepsOptions.validateOnNext`) | |
| Lặp một nhóm field theo số lượng người dùng thêm | `list` / `nested-list` | `list` 1 control/dòng, `nested-list` nhiều control/dòng |
| Lặp theo mảng dữ liệu có sẵn | `form-loop` | |
| Popup / panel bên | `dialog` / `drawer` / `bottom-sheet` | |

Nguyên tắc:
- **Ưu tiên `colSpan` trên field** hơn là `columns`/`grid`. `columns` chỉ khi cần cột có độ rộng khác nhau hoặc **nhiều control xếp dọc trong một cột** (cột trái ảnh + chú thích, cột phải form).
- Form ≤ ~8 field: phẳng 2 cột. Form dài có nhóm nghĩa: `container` theo nhóm. Quá dài: `tab` hoặc `steps`.
- Lồng tối đa 2–3 cấp (container trong tab trong form); mỗi cấp lồng làm dài `key_path` và hẹp chỗ.
- Cha luôn đứng **trước** con trong mảng; con khai `parent` (+ `tabId` nếu cha là `tab`/`steps`/`columns`).

## 5. Công thức bố cục (copy rồi đổi tên)

**Hai cột đều** — họ tên, email + điện thoại:
```jsonc
{ "type": "input", "name": "full_name", "label": "Họ và tên", "colSpan": 6 },
{ "type": "tel",   "name": "phone",     "label": "Số điện thoại", "colSpan": 6 }
```

**Ba / bốn cột đều** — Tỉnh / Quận / Xã; Ngày / Tháng / Năm:
```jsonc
{ "type": "select", "name": "province", "label": "Tỉnh/Thành", "colSpan": 4, "dataSource": { /* … */ } },
{ "type": "select", "name": "district", "label": "Quận/Huyện", "colSpan": 4, "dataSource": { /* … */ } },
{ "type": "select", "name": "ward",     "label": "Phường/Xã",  "colSpan": 4, "dataSource": { /* … */ } }
```

**Một dòng dài + một ô ngắn** — Địa chỉ (9) + Mã bưu chính (3):
```jsonc
{ "type": "input", "name": "address", "label": "Địa chỉ", "colSpan": 9 },
{ "type": "input", "name": "zip",     "label": "Mã bưu chính", "colSpan": 3 }
```

**Ô nhập + nút bên cạnh** — mã khuyến mại (9) + nút Áp dụng (3). Ô nhập có nhãn cao hơn nút, mặc định nút dính mép trên nên lệch; đặt `alignSelf: "end"` để nút thẳng đáy với ô nhập:
```jsonc
{ "type": "input",  "name": "promo", "label": "Mã khuyến mại", "colSpan": 9 },
{ "type": "button", "name": "btn_apply", "label": "Áp dụng", "colSpan": 3, "alignSelf": "end" }
```
(Nếu ô nhập đang hiện thông báo lỗi bên dưới thì ô cao thêm và nút lệch lên một chút. Muốn thẳng tuyệt đối với đỉnh ô nhập: ẩn nhãn ô nhập bằng `styles.showLabel: "no"` + `placeholder`, giữ nút `alignSelf: "start"`.)

**Hàng bộ lọc** — các ô lọc có nhãn + hai nút Xoá bộ lọc / Áp dụng cùng hàng:
```jsonc
{ "type": "select", "name": "class_code", "label": "Lớp học", "colSpan": 6, "options": [{ "label": "Tất cả lớp", "value": "" }, { "label": "Lớp A", "value": "a" }] },
{ "type": "button", "name": "btn_clear", "label": "Xóa bộ lọc", "colSpan": 3, "alignSelf": "end" },
{ "type": "button", "name": "btn_apply", "label": "Áp dụng",   "colSpan": 3, "alignSelf": "end" }
```

**Nút căn phải** — Huỷ + Gửi dồn về bên phải hàng cuối:
```jsonc
{ "type": "reset-button",  "name": "btn_reset",  "label": "Làm lại", "colSpan": 2, "colStart": 9 },
{ "type": "submit-button", "name": "btn_submit", "label": "Gửi",     "colSpan": 2 }
```
(`colStart: 9` + 2 + 2 → các cột 9–12. Script tự đưa về cột `auto` + `colSpan 12` trên mobile.) Hoặc đơn giản hơn: mỗi nút `colSpan` 12 nếu form hẹp.

**Cột nội dung 8 + 4** — form bên trái, tóm tắt bên phải (khác độ rộng → dùng `columns`):
```jsonc
{ "type": "columns", "name": "main", "columns": { "count": 2, "spans": [8, 4], "gap": "1.5rem" } },
{ "type": "input",  "name": "title",   "parent": "main", "tabId": "col-0", "label": "Tiêu đề" },
{ "type": "textarea","name": "content", "parent": "main", "tabId": "col-0", "label": "Nội dung" },
{ "type": "descriptions", "name": "summary", "parent": "main", "tabId": "col-1" }
```

**Nhóm có khung + tiêu đề**:
```jsonc
{ "type": "container", "name": "grp_contact", "container": { "type": "card", "border": true } },
{ "type": "text", "name": "grp_contact_title", "parent": "grp_contact", "content": "<h3>Liên hệ</h3>" },
{ "type": "email", "name": "email", "parent": "grp_contact", "label": "Email", "colSpan": 6 },
{ "type": "tel",   "name": "phone", "parent": "grp_contact", "label": "Điện thoại", "colSpan": 6 }
```
(Tiêu đề của chính `container` — `showTitle` — chưa lưu được vào JSON ở lib 4.7.0–4.8.0; dùng `text` làm tiêu đề như trên.)

**Lưới ô đều có gộp ô** — mỗi ô một control (bọc `container` nếu muốn nhiều control trong 1 ô):
```jsonc
{ "type": "grid", "name": "kpi", "grid": { "cols": 3, "gap": "1rem", "columnWidths": ["1fr", "1fr", "2fr"] } },
{ "type": "stat-cards", "name": "k1", "parent": "kpi" },
{ "type": "stat-cards", "name": "k2", "parent": "kpi" },
{ "type": "container",  "name": "k3", "parent": "kpi" }
```

## 6. Chiều cao, khoảng cách, nhãn

- Khoảng cách giữa control là `gap-4` cố định của vùng; `columns.gap` và `grid.gap` chỉnh khoảng cách giữa cột/ô (chuỗi CSS, vd `"1rem"`).
- `styles.showLabel: "no"` ẩn nhãn; `styles.labelPosition` mặc định `top` (đổi trong builder nếu cần nhãn bên trái).
- Muốn ẩn/hiện control theo điều kiện: rule/flow (`dynaform-logic-events`), không dùng `colSpan: 0`.

## 7. Settings & theme

`settings.setting`: `size` (`xs|sm|normal|lg|xl`), `formKey`, `endpoint`, `method`.
`settings.theme`: `styles.type` (`normal`|`float`), `borderRadius`, `fontSize`, và 7 màu (`background foreground primary primaryForeground secondary secondaryForeground border`).
Bỏ qua = theme mặc định. UI form phải đọc được ở cả light/dark — dùng màu theme, tránh hardcode trong `props`/`custom`.

## 8. Checklist trước khi build

1. Mỗi hàng cộng đủ 12 (script cảnh báo hàng thiếu); nhóm cùng nghĩa nằm cùng hàng.
2. Control rộng (`textarea`, `table`, `wysiwyg-editor`, …) để 12.
3. `colStart + colSpan − 1 ≤ 12`.
4. `columns.spans` tổng 12; `grid`: số con ≤ số ô (hàng × cột − ô bị gộp), mỗi ô 1 con.
5. Cha đứng trước con; `tabId` đúng ngăn.
6. Đã quyết định mobile: để mặc định (tự xếp chồng) hay `overrides.sm` riêng.
7. Overlay đứng trước nút mở nó.
8. Nút đứng cạnh ô nhập có nhãn: `alignSelf: "end"` (không dùng khoảng trắng / `text` rỗng để đẩy nút xuống).

Ví dụ chạy được: `skills/dynaform-build-form/assets/example-layout.spec.json` và `assets/example-layout-recipes.spec.json` (11 công thức bố cục: 2-3-4 cột, 9+3, ô nhập + nút `alignSelf`, hàng bộ lọc, responsive `overrides`, `columns` 8+4, `grid` gộp ô, nút căn phải) — giải thích trong `references/examples.md`.
Tài liệu lib: `docs/CONTAINER_DRAG_DROP.md`, `docs/CANVAS_NAVIGATION.md`, `public/templates/sample/*.json` (mẫu form thật).
