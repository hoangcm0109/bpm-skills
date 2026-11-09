# custom-embed — React (TSX) + Tailwind

`custom-embed` là **lối thoát cuối cùng**: chỉ dùng khi không control có sẵn nào đáp ứng (bảng "nhu cầu → control" ở `dynaform-components`).
Phải nêu **lý do** (control có sẵn nào đã cân nhắc, vì sao không đủ) trong báo cáo cuối — thiếu lý do là chưa đạt checklist (§G).

Khi đã phải dùng: **React 19 + Tailwind** (`mode: "sandbox"`, `framework: "react"`, `tailwind: true` — đây là cấu hình chuẩn).
Template (HTML + `{{ }}`) và JS thuần chỉ cho khối tĩnh rất đơn giản; CSS thuần là phần thêm, tránh dùng.

## Cấu hình (khoá gọn)

Viết bằng khoá gọn cho dễ đọc; khi dựng JSON, `embed` quy đổi thành `editable_props.properties.embed` đầy đủ như `form-json.md` §9 (`inputs[].field` → `from: { field }`; `code` ghi vào cả `source` và `js`; `reason` không ghi vào JSON).

```jsonc
{
  "type": "custom-embed", "name": "preset_picker", "colSpan": 12,
  "reason": "record-picker chỉ có thẻ ảnh; cần danh sách có tìm kiếm + bảng bước mở rộng theo bộ được chọn",
  "embed": {
    "valueType": "none",                                   // none | string | number | boolean | array | object
    "inputs":  [{ "name": "keyword", "field": "keyword" }],  // host → embed (field: name của field trong form; hoặc "ref": đường dẫn layout)
    "outputs": [{ "name": "picked", "to": "picked_id" }],    // embed → form (dfb.publish) — field đích phải tồn tại
    "events":  ["select"],                                  // dfb.emit("select") → handler { "event": "embed:select", ... }
    "code": "…"                                             // xem bên dưới
  },
  "events": [{ "event": "embed:select", "flow": { /* action flow — KHÔNG cất tín hiệu vào field ẩn */ } }]
}
```

Khoá khác của `embed`: `height` (`{ mode: "auto" }` | `{ mode: "fixed", value: "320px" }`), `sampleData` (dữ liệu hiện trên canvas), `valueType` + `dfb.setValue` nếu control tự giữ giá trị.

## Viết `embed.code`

Không có bước biên dịch TSX khi viết JSON tay, nên `code` phải chạy được như JavaScript: dùng thẻ `html` của `DfbReact` (JSX viết bằng tagged template) — đó là TSX hợp lệ, builder biên dịch lại không đổi gì.
Ghi `code` vào cả `source` (TSX) lẫn `js` (bản chạy).

```js
const { React, html, render, useDfbData } = DfbReact;   // React 19 có sẵn trong frame; KHÔNG import / export
const { useState } = React;

function App() {
  const { items = [], keyword = "" } = useDfbData();     // {} cho tới khi dữ liệu tới → luôn có giá trị mặc định
  const [picked, setPicked] = useState(null);
  return html`
    <ul class="grid gap-1.5 p-1">
      ${items.filter((i) => i.name.includes(keyword)).map((i) => html`
        <li key=${i.id}>
          <button type="button"
            class="w-full rounded-md border border-border bg-card px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
            onClick=${() => { setPicked(i.id); dfb.emit("select", { id: i.id }); dfb.publish({ picked: i.id }); }}>
            ${i.name}${picked === i.id ? " ✓" : ""}
          </button>
        </li>`)}
    </ul>`;
}
render(App);
```

API trong frame: `DfbReact` = `React`, `html`, `render(App, selector = "#root")`, `useDfbData()`, `useDfbValue()`, `useDfbState()` (`{readOnly, disabled}`), `useDfbTheme()`; `dfb.emit(event, payload)`, `dfb.publish({ output: value })`, `dfb.setValue(v)`.
Handler của form đọc payload qua `$event.payload.<path>`.

Quy tắc:
- Style **chỉ bằng class Tailwind**, viết đủ tên class (`p-4`, không `p-${n}`; class nằm trong dữ liệu cũng không được sinh CSS). Màu theo theme: `bg-background text-foreground bg-card text-primary bg-primary text-muted-foreground border-border text-destructive`; `dark:` chạy được.
- Không `import`/`export`, không JSX thô (`<div>` ngoài template), không `eval`, không mạng (CSP `connect-src 'none'`). Cần gọi API: khai báo Data Source rồi cấp quyền `permissions: [{ kind: "http", dataSourceId }]` trong builder.
- Giới hạn kích thước code + CSS; frame mang thêm ~180 KB runtime React.

## Việc phải làm sau khi viết JSON

JSON viết tay **không** có `tailwindCss` (cần trình biên dịch Tailwind của builder). Embed sẽ **chưa có style** cho tới khi:

1. Nạp JSON vào builder (Open JSON / `loadFormJson` / `DynaformBuilder form=…` ở editor).
2. Chọn control → **Sửa TSX / HTML (Tailwind)** → **Lưu** — builder biên dịch TSX và sinh `tailwindCss` (cần mạng để tải Monaco).
3. Save form.

Báo bước này cho người dùng ở phần "chưa làm được" của báo cáo cuối. Xem `docs/CUSTOM_EMBED.md` §19–21 trong fe_dynaform.
