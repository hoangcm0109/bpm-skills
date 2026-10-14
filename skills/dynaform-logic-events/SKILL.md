---
name: dynaform-logic-events
description: Logic và sự kiện của form dynaform — rule hiển thị/bắt buộc theo điều kiện (condition handler), event click/change/load/open/close, action engine (field_state, set_values, dialog, call_api, navigate, run_script, branch/try). Dùng khi field cần ẩn/hiện theo field khác, nút cần mở dialog/gọi API/điều hướng, hoặc cần luồng nhiều bước.
---

# Logic & sự kiện

Mọi hành vi nằm trong `properties.eventHandlers[]` của component: `{ id, event, enabled, actions }`.
**Mỗi handler chạy một flow** (action engine). Hệ thống visual rule cũ (`properties.logic.rules`) đã bị thay bằng handler `event: "condition"`.

## Event

| event | Khi nào |
|---|---|
| `click`, `dblclick`, `hover`, `change` | tương tác DOM của chính component |
| `load` | khi mount (và mỗi lần dialog chứa nó mở lại) |
| `open` / `close` | chỉ dialog / drawer / bottom-sheet |
| `condition` | **phản ứng**: chạy lại mỗi khi *bất kỳ* giá trị form đổi (debounce) |
| `control:<tên>`, `embed:<tên>`, `menu:<id>` | do control tự định nghĩa / custom-embed / menu nút phát ra |

## Cách 1 — Rule điều kiện (`rules`, dùng cho hiện/ẩn, bắt buộc, enable)

```jsonc
{ "type": "input", "name": "company_name", "label": "Tên doanh nghiệp", "hidden": true,
  "rules": [{
    "name": "Hiện khi là doanh nghiệp", "match": "AND",
    "when": [{ "field": "account_type", "operator": "equals", "value": "company" }],
    "then": [{ "type": "show", "target": "company_name" }, { "type": "require", "target": "company_name" }]
  }] }
```

Script sinh handler `condition` → `branch(if when) then=[actions] else=[nghịch đảo]`.
Nghịch đảo tự động: `show↔hide`, `enable↔disable`, `require↔optional`. `setValue`, `callApi`, `openLink`, `customScript`, `flow` **một chiều** (không có else).
Muốn else tuỳ ý → viết `events` với `flow` tự khai báo (Cách 2).

Rule gắn trên component nào cũng được; thường đặt trên component bị ảnh hưởng để dễ đọc.
Toán tử: `equals notEquals isEmpty isNotEmpty greaterThan lessThan contains notContains`.

## Cách 2 — Event + actions phẳng (nút, dialog, change)

```jsonc
{ "type": "submit-button", "name": "btn_submit", "label": "Gửi",
  "events": [{ "event": "click", "actions": [
    { "type": "openModal", "target": "success_dialog" }
  ] }] }
```

Action phẳng hợp lệ (script đổi sang flow step):

| action | Cần | Thành step |
|---|---|---|
| `show` `hide` `enable` `disable` `require` `optional` | `target` (name) | `field_state` |
| `setValue` | `target`, `value`, `valueType`: `static` (mặc định) \| `field` | `set_values` |
| `openModal` `closeModal` `toggleModal` | `target` = name của dialog/drawer | `dialog` open/close/toggle |
| `openLink` | `url`, `newTab`? (mặc định true) | `navigate` |
| `callApi` | `url`, `method`?, `headers`?, `body`? | `call_api` (tối giản — cấu hình auth/mapping trong builder) |
| `customScript` | `code` | `run_script` (+`continueOnError`) |
| `switchTab`, `collapse` | — | **chưa có tác dụng** ở runtime; đừng dùng |

## Cách 3 — Flow tự viết (nhiều bước, rẽ nhánh, try/catch)

```jsonc
"events": [{ "event": "click", "flow": {
  "id": "flow", "type": "sequence", "steps": [
    { "id": "valid", "type": "validate_form", "notify": true },
    { "id": "save",  "type": "try",
      "steps": [
        { "id": "post", "type": "call_api", "url": "https://api.example.com/submit", "method": "POST", "bodyMode": "form" },
        { "id": "ok",   "type": "show_message", "level": "success", "message": "Đã gửi" }
      ],
      "catch": [{ "id": "err", "type": "show_message", "level": "error", "message": "{{$error.message}}" }] }
  ] } }]
```

Step: `sequence` `parallel` `branch` `try` `validate_form` `call_api` `push_table` `set_values` `field_state` `dialog` `run_script`
`show_message` `navigate` `emit_event` `for_each` `reset_form` `submit_form` …  Mỗi step cần `id` duy nhất trong handler.
Giá trị: `{type:"literal"|"ref"|"template"}`; đường dẫn: `$form.current.values.<name>`, `$steps.<id>.output.<path>`, `$event.payload`, `$error.message`.
Tài liệu đầy đủ: `docs/ACTION_ENGINE.md` (fe_dynaform) — **đọc trước khi tự viết flow có `call_api`**.

## Quy tắc chung

1. Mọi `target` / `field` là **`name`**, đã tồn tại trong spec; script từ chối tham chiếu treo.
2. Dialog phải đứng **trước** nút mở nó; `dialog` variant confirmation/info đặt nội dung trong `dialog.title/description`.
3. `customScript`/`run_script` là JS thô chạy ở trình duyệt người dùng cuối, bị host kiểm soát theo logic-execution policy — **không dùng mặc định**; nếu bắt buộc, hiển thị mã cho người dùng duyệt (xem `docs/security/form-json-safety.md`).
4. API ra ngoài đi qua proxy `/api/proxy` của host; yêu cầu CORS/auth của host quyết định — không nhúng secret vào JSON form.
5. Xem `docs/LOGIC_CUSTOM_JAVASCRIPT_GUIDE.md`, `docs/EVENT_SYSTEM.md` khi cần JS tuỳ biến.
