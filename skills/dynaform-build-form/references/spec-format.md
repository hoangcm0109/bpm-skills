# Cú pháp spec (đầu vào của `dynaform.mjs build`)

```jsonc
{
  "name": "Tên form",              // hiển thị + settings.setting.name
  "description": "",
  "formKey": "",                   // tuỳ chọn
  "endpoint": "", "method": "POST",// tuỳ chọn: nơi submit (settings.setting)
  "size": "normal",                // xs | sm | normal | lg | xl
  "complete": true,                // tuỳ chọn: chỉ dùng khi build dần (stream-preview.md); bỏ qua khi build thường
  "mobile": "stack",               // "stack" (mặc định): control colSpan < 12 tự xuống 12 cột khi khung < 768px; "keep": giữ nguyên
  "theme": { "styles": {...}, "colors": {...} }, // bỏ qua = theme mặc định
  "components": [ /* mảng component, THỨ TỰ = thứ tự hiển thị, cha trước con */ ]
}
```

## Một component

| Khoá | Bắt buộc | Ý nghĩa |
|---|---|---|
| `type` | ✅ | Type trong registry (xem `dynaform-components`) |
| `name` | ✅ | `variables.name` — snake_case, duy nhất; mọi tham chiếu dùng khoá này |
| `label` | | Nhãn hiển thị (tiếng Việt) |
| `placeholder`, `helpText` | | |
| `required` | | `true` → thêm validation `required`; `requiredMessage` = thông báo lỗi |
| `disabled`, `readonly`, `hidden` | | `hidden: true` → `styles.visible = "no"` (dùng với rule `show`) |
| `colSpan` | | 1–12 (mặc định 12) — số cột control chiếm trong vùng chứa nó; xem `dynaform-layout` |
| `colStart` | | `"auto"` (mặc định) hoặc 1–12: cột bắt đầu; `colStart + colSpan − 1 ≤ 12` |
| `attributes` | | vd `{ "type": "text" }` cho `input` |
| `content` | | Nội dung HTML cho `text` |
| `default` | | Giá trị mặc định (`default_values`) |
| `dataType` | | `string` (mặc định) \| `number` \| `boolean` \| `object`… |
| `options` | select/radio/checkbox-group | `[{ "label", "value", "checked"? }]` — `value` là chuỗi |
| `dataSource` | | `{ "api": {...} }` — xem `dynaform-data-source` |
| `validations` | | `[{ "type", "value"?, "errorMessage"? }]` — xem `dynaform-validation` |
| `events` | | `[{ "event", "actions": [...] }]` hoặc `{ "event", "flow": {...} }` — xem `dynaform-logic-events` |
| `rules` | | `[{ "name"?, "match": "AND"\|"OR", "when": [...], "then": [...] }]` — điều kiện phản ứng |
| `parent` | | `name` của container cha |
| `tabId` | cha là tab/steps/columns | id panel (`tab-1`, `step-1`, `col-0`…) |
| `tabs` / `steps` | type tab / steps | `[{ "id", "label" }]` |
| `stepsOptions` | steps | `{ showPrevious, defaultPreviousLabel, defaultNextLabel, finishLabel, showProgress, validateOnNext, progressVariant }` |
| `columns` | type columns | `{ "count": 2..4, "spans": [..tổng 12], "gap": "1rem", "stackOnMobile": "yes" }`; con khai `tabId: "col-0"…` |
| `grid` | type grid | `{ "cols": 1..6, "rows"?, "columnWidths"?: ["1fr",…], "gap"?, "stackOnMobile"?, "spans"?: { "<slot>": { "r", "c" } } }`; con **không** có `tabId`, lấp ô theo thứ tự, mỗi ô 1 con; `rows` tự tính nếu bỏ |
| `container` | type container | `{ "type": "div"|"card"|"fieldset", "border": true|false, "borderType": "solid"|"dashed"|"dotted" }` (tiêu đề container: dùng `text`) |
| `list` | list / nested-list | `{ "minRows", "initialRows", "maxRows"?, "addButtonLabel" }` |
| `loop` | form-loop | `{ "mode": "variable", "dataPath", "itemAlias", "emptyText", "allowAdd", "allowRemove", "submitFields"? }` |
| `dialog` | dialog / drawer / bottom-sheet | `{ "variant": "confirmation"\|"form"\|"info"\|"custom", "title", "description" }` |
| `styles` | | trộn thêm vào `editable_props.styles` (vd `{ "showLabel": "no" }`) |
| `overrides` | | theo viewport, **desktop trước**: `{ "md": { "colSpan": 6 }, "sm": { "colSpan": 12 } }` (md: khung < 1024px, sm: < 768px; thêm được `colStart`, `showLabel`…). Dạng cũ `{ "sm": { "styles": {…} } }` vẫn nhận; không có `lg` |
| `custom` | | CSS thuần + class Tailwind của người dùng cho **mọi** control (lib ≥ 4.6.0) → `properties.custom`: `{ "className": "rounded-xl border p-4", "css": "background:#f8fafc", "control": { "className", "css" }, "label": { "className", "css" } }` — xem `dynaform-components` › Style tuỳ chỉnh |
| `props` | | passthrough vào `editable_props.properties` (cấu hình sâu: table, file…) |
| `reason` | `custom-embed` (bắt buộc), `hidden` (nên có) | vì sao control có sẵn / action flow không đáp ứng; không xuất ra JSON, chỉ hiện trong cảnh báo của script |
| `embed` | `custom-embed` | `{ code, inputs?, outputs?, events?, valueType?, height?, sampleData?, tailwind? }` → `properties.embed` (mặc định sandbox + React + Tailwind). `code` là JS dùng `DfbReact.html\`…\`` → ghi vào `source` và `js`. `inputs: [{ name, field }]`, `outputs: [{ name, to }]` trỏ tới `name` field có thật; `events` khai báo để gắn handler `embed:<tên>`. Chi tiết: `custom-embed.md` |

## Ánh xạ sang JSON đầu ra

| Spec | JSON |
|---|---|
| `name` | `item_control.variables.name` + `key_path` + `wrapper.variable_name` |
| `label`, `placeholder`, `required`, `attributes`, `tabs`… | `item_control.editable_props.properties.*` |
| `colSpan`, `styles` | `item_control.editable_props.styles` |
| `custom` | `item_control.editable_props.properties.custom` |
| `embed` | `item_control.editable_props.properties.embed` (`inputs[].field` → `from: { field }`; không có `tailwindCss`) |
| `required` + `validations` | `item_control.validation_schema[]` (+ `properties.required`) |
| `options` | `variables.data_source` = `{ connection_type: "hard", connection_config: { value: [...] } }` |
| `dataSource.api` | `variables.data_source` = `{ connection_type: "api", request_config, response_mapping, connection_config, depends_on? }` |
| `events` | `properties.eventHandlers[]` mỗi handler chạy 1 `flow` |
| `rules` | `properties.eventHandlers[]` với `event: "condition"` + `branch` (then = actions, else = nghịch đảo show↔hide, enable↔disable, require↔optional) |
| `parent` | con nằm trong `children_schema` của cha; `parent_id`; `parent_tab_id` = `tabId` |

Container (`container`, `tab`, `steps`, `columns`, `dialog`, `drawer`, `bottom-sheet`) xuất **không có vỏ `item_control`** ngoài cùng — đúng như builder xuất; control thường có vỏ `{ kind: "component", item_control }`.

## Điều kiện (`rules[].when`)

`{ "field": "<name>", "operator": "equals|notEquals|isEmpty|isNotEmpty|greaterThan|lessThan|contains|notContains", "value": "..." }`
`isEmpty` / `isNotEmpty` không cần `value`. `match: "AND"` → tất cả đúng, `"OR"` → một trong số.
