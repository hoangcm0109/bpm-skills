# Ví dụ đầy đủ — bố cục form

Spec chạy được: [`assets/example-layout-recipes.spec.json`](../assets/example-layout-recipes.spec.json) — **11 công thức**, mỗi công thức mở đầu bằng một `text` đánh số để dễ nhận trên canvas.
Ví dụ bố cục sẵn có khác: `../../dynaform-build-form/assets/example-layout.spec.json` (container, `columns`, `tab`, `grid`, nút căn phải).

```bash
S=skills/dynaform-build-form/scripts/dynaform.mjs
node $S build skills/dynaform-layout/assets/example-layout-recipes.spec.json --out /tmp/layout.json
node $S validate /tmp/layout.json     # OK … hợp lệ (không còn cảnh báo hàng thiếu 12 cột)
```

## Bảng công thức → khoá spec

| # | Công thức | Khoá cần dùng | Cộng cột |
|---|---|---|---|
| 1 | Hai cột đều | `colSpan: 6` × 2 | 6+6 |
| 2 | Ba cột đều (Tỉnh/Quận/Xã) | `colSpan: 4` × 3 | 4+4+4 |
| 3 | Dòng dài + ô ngắn | `colSpan: 9` + `colSpan: 3` | 9+3 |
| 4 | Ô nhập + nút cạnh nhau | nút: `colSpan: 3`, `alignSelf: "end"` | 9+3 |
| 5 | Hàng bộ lọc | select `6`, hai nút `3` + `alignSelf: "end"` | 6+3+3 |
| 6 | Giữ 2 cột trên mobile cho cặp rất ngắn | `overrides: { sm: { colSpan: 6 } }` | 6+6 |
| 7 | Đổi cột theo cỡ khung | `colSpan: 4` + `overrides: { md: { colSpan: 6 }, sm: { colSpan: 12 } }` | 4+4+4 → 6+6+12 → 12 |
| 8 | Nhóm có khung + tiêu đề | `container.type: "card"` + `text` làm con đầu | 6+6 trong nhóm |
| 9 | Hai cột rộng khác nhau | `columns.spans: [8, 4]`, con `tabId: "col-0" / "col-1"` | 8+4 |
| 10 | Lưới ô đều, gộp ô | `grid: { cols: 3, rows: 2, spans: { "0": { r: 1, c: 2 } } }` | ô 0 trải 2 cột |
| 11 | Nút căn phải | `colStart: 9` + `colSpan: 2` × 2 | cột 9–12 |

## Đoạn tiêu biểu

**Ô nhập + nút** — nút không nhãn thấp hơn ô nhập có nhãn; `alignSelf: "end"` đưa nút xuống ngang đáy ô (lib ≥ 4.8.0). Đừng dùng `text` rỗng/khoảng trắng để đẩy nút:

```jsonc
{ "type": "input",  "name": "r4_promo", "label": "Mã khuyến mại", "colSpan": 9 },
{ "type": "button", "name": "r4_apply", "label": "Áp dụng",       "colSpan": 3, "alignSelf": "end" }
```

**Responsive desktop-first** — `colSpan` gốc áp cho **mọi** cỡ; muốn khác phải khai `overrides` (`md` < 1024px, `sm` < 768px, đo theo khung chứa form, không phải cửa sổ):

```jsonc
{ "type": "number", "name": "r7_a", "label": "Số lượng",   "colSpan": 4, "dataType": "number", "overrides": { "md": { "colSpan": 6 }, "sm": { "colSpan": 12 } } },
{ "type": "number", "name": "r7_b", "label": "Đơn giá",    "colSpan": 4, "dataType": "number", "overrides": { "md": { "colSpan": 6 }, "sm": { "colSpan": 12 } } },
{ "type": "number", "name": "r7_c", "label": "Chiết khấu", "colSpan": 4, "dataType": "number", "overrides": { "md": { "colSpan": 12 }, "sm": { "colSpan": 12 } } }
```

Spec gốc có `"mobile": "stack"` (mặc định): control `colSpan < 12` mà chưa có `overrides.sm.colSpan` được tự thêm `sm.colSpan = 12`. Công thức #6 khai `sm: 6` nên được **giữ** 2 cột trên mobile. Tắt tự động: `"mobile": "keep"`.

**Hai cột rộng khác nhau — `columns`**:

```jsonc
{ "type": "columns", "name": "r9_main", "columns": { "count": 2, "spans": [8, 4], "gap": "1.5rem" } },
{ "type": "input",    "name": "r9_title_input", "parent": "r9_main", "tabId": "col-0", "label": "Tiêu đề" },
{ "type": "textarea", "name": "r9_content",     "parent": "r9_main", "tabId": "col-0", "label": "Nội dung" },
{ "type": "text",     "name": "r9_side",        "parent": "r9_main", "tabId": "col-1", "content": "<p><b>Gợi ý:</b> …</p>" }
```

**Grid gộp ô** — mỗi ô đúng 1 control, lấp theo thứ tự; `rows` phải đủ chỗ cho số con (1 hàng × 3 cột trừ 1 ô bị gộp chỉ còn 2 ô):

```jsonc
{ "type": "grid", "name": "r10_kpi", "grid": { "cols": 3, "rows": 2, "gap": "1rem", "columnWidths": ["1fr","1fr","1fr"], "spans": { "0": { "r": 1, "c": 2 } } } },
{ "type": "text", "name": "r10_a", "parent": "r10_kpi", "content": "<b>Hồ sơ mới</b> — ô trải 2 cột" },
{ "type": "text", "name": "r10_b", "parent": "r10_kpi", "content": "<b>Đã duyệt</b>" },
{ "type": "text", "name": "r10_c", "parent": "r10_kpi", "content": "<b>Từ chối</b>" }
```

## Chọn nhanh cấu trúc

| Tình huống | Dùng |
|---|---|
| Field cạnh nhau trong một nhóm | `colSpan` trực tiếp trên field (đơn giản nhất) |
| Cột rộng khác nhau / nhiều control xếp dọc trong một cột | `columns` |
| Ô đều hoặc gộp ô (dashboard thẻ số liệu) | `grid` |
| Nhóm có khung, ẩn/hiện cả nhóm bằng một rule | `container` |
| Phần độc lập / tuần tự có kiểm từng bước | `tab` / `steps` (`dynaform-components`) |

## Lỗi hay gặp

| Thông báo / triệu chứng | Sửa |
|---|---|
| `WARN hàng ở gốc form: a(4) + b(4) + c(3) = 11/12` | chỉnh `colSpan` cho đủ 12, hoặc căn phải bằng `colStart` |
| `ERROR grid "x": 3 con nhưng chỉ có 2 ô (…)` | tăng `rows`/`cols` hoặc bỏ `spans`; mỗi ô đúng 1 control (nhiều control → bọc `container`) |
| `colSpan: 6` mà mobile vẫn 2 cột | lib tính desktop trước — để `mobile: "stack"` mặc định hoặc khai `overrides.sm.colSpan: 12` |
| nút lệch lên/xuống so với ô nhập | `alignSelf: "end"` trên nút |
| `overrides.sm.styles` không có tác dụng | khai kiểu gọn `overrides: { sm: { colSpan: 12 } }` để script đổi sang dạng lib đọc |

## Settings & theme

`size` (`xs|sm|normal|lg|xl`), `endpoint`, `method`, `formKey` đặt ở gốc spec; `theme: { styles: {…}, colors: {…} }` tuỳ chọn (bỏ qua = theme mặc định). Dùng màu theme, tránh hardcode màu trong `props`/`custom` để đọc được cả light/dark.
