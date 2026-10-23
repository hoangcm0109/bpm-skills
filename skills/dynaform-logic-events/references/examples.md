# Ví dụ đầy đủ — logic & sự kiện

Ba spec chạy được trong `assets/`. Mỗi handler được script đổi thành một flow (`properties.eventHandlers[]`) và **kiểm** event/step/tham chiếu.

```bash
S=skills/dynaform-build-form/scripts/dynaform.mjs
for f in example-rules example-flows example-table-row-actions; do
  node $S build skills/dynaform-logic-events/assets/$f.spec.json --out /tmp/$f.json && node $S validate /tmp/$f.json
done
```

| Spec | Chủ đề | Điểm đáng học |
|---|---|---|
| `example-rules.spec.json` | "Đơn xin nghỉ học" — rule điều kiện | hiện/ẩn, bắt buộc, bật/tắt, `AND`/`OR`, `isEmpty`, so sánh số, `setValue`, ẩn lúc mở |
| `example-flows.spec.json` | "Trung tâm xử lý hồ sơ" — action flow | `push_table`, chọn → điền từ API, `parallel`, `branch`, `confirm` + `for_each`, xác nhận xoá, tải file, `emit_event` |
| `example-table-row-actions.spec.json` | "Quản lý người dùng" | hành động từng dòng của `table` chạy flow riêng (`$row`) |

Script có một cảnh báo cố định: `awaitSubmit: dialog phải có nút xác nhận / gửi …` — chỉ là nhắc (spec đã có footer action `submit`).

## 1. Rule điều kiện — `example-rules.spec.json`

| Yêu cầu | Rule | Ghi chú |
|---|---|---|
| Nghỉ ốm **hoặc** ≥ 3 ngày → hiện và bắt buộc giấy khám | `match: "OR"`, `when` 2 điều kiện (`equals` + `greaterThanOrEqual`), `then: show + require` | số so với chuỗi: `value` viết `"3"` |
| Chọn "Khác" → hiện lý do bắt buộc | `match: "AND"`, `equals`, `then: show + require` | |
| Việc gia đình → hiện **cả nhóm** phụ huynh | rule đặt trên `container`, `then: show` target container | một handler cho cả nhóm |
| Chưa nhờ ai ghi bài (`switch` = false) → khoá ô tên | `equals "false"`, `then: disable` | `show↔hide`, `enable↔disable`, `require↔optional` tự có nhánh ngược |
| Chọn nghỉ ốm → đặt sẵn tóm tắt | `then: setValue` | `setValue` **một chiều**, không có else |
| Chưa chọn loại nghỉ → khoá nút gửi | `isEmpty` (không cần `value`), `then: disable` target nút | |

**Ẩn lúc mở** — làm đúng như skill khuyến cáo, không dùng `hidden: true` tĩnh (không bật lại được bằng logic):

```jsonc
{ "type": "file", "name": "medical_proof", "label": "Giấy khám bệnh",
  "events": [{ "event": "load", "flow": { "id": "init", "type": "field_state", "action": "hide", "targets": ["medical_proof"] } }],
  "rules": [{ "name": "Nghỉ ốm hoặc >= 3 ngày → cần giấy tờ", "match": "OR",
    "when": [
      { "field": "leave_type", "operator": "equals", "value": "sick" },
      { "field": "days", "operator": "greaterThanOrEqual", "value": "3" } ],
    "then": [{ "type": "show", "target": "medical_proof" }, { "type": "require", "target": "medical_proof" }] }] }
```

## 2. Action flow — `example-flows.spec.json`

### 2.1 Tìm kiếm → làm mới bảng (body theo ô lọc)

```jsonc
{ "type": "button", "name": "btn_search", "label": "Tìm kiếm", "alignSelf": "end",
  "events": [{ "event": "click", "flow": { "id": "search", "type": "push_table", "tableId": "requests_table", "mode": "request",
    "bodyMode": "mapping", "bodyMapping": [
      { "source": { "type": "ref", "path": "$form.current.values.keyword" }, "target": "q" },
      { "source": { "type": "ref", "path": "$form.current.values.status" },  "target": "status" } ] } }] }
```

`tableId` viết bằng **`name` của table** (script đổi sang id lúc build). Bảng `GET` thì khoá body đi thành query, giá trị rỗng bị bỏ.

### 2.2 Chọn → điền ô khác từ API (dùng kết quả bước trước)

```jsonc
{ "type": "select", "name": "student_id", "options": [ … ],
  "events": [{ "event": "change", "flow": { "id": "fill", "type": "try",
    "steps": [
      { "id": "get", "type": "call_api", "url": "https://api.example.com/students/{id}", "method": "GET",
        "authConfig": { "type": "bearer", "token_source": "system" },
        "pathMapping": [{ "source": { "type": "ref", "path": "$form.current.values.student_id" }, "target": "id", "required": true }] },
      { "id": "set", "type": "set_values", "mappings": [
        { "from": { "type": "ref", "path": "$steps.get.output.data.full_name" }, "to": "full_name" },
        { "from": { "type": "ref", "path": "$steps.get.output.data.email" },     "to": "email" } ] }
    ],
    "catch": [{ "id": "err", "type": "show_message", "level": "error", "message": "Không tải được sinh viên: {{$error.message}}" }] } }] }
```

Dữ liệu đi **trong flow** bằng `$steps.<id>.output.<path>` — không cần field `hidden` làm trạm trung chuyển. Event `change` không mang giá trị: đọc giá trị mới bằng `$form.current.values.<name>`.

### 2.3 Nạp song song khi mở form

`load` trên container: `parallel` (2 `call_api` độc lập, `strategy: "all"`) rồi `set_values` từ `$steps.dept…` và `$steps.unit…`; lỗi → `catch` toast.

### 2.4 Rẽ nhánh

`branch` với `condition: { all: [ { left, operator: "eq", right } ] }`; `then`/`else` là **MỘT** step (dùng `sequence` để gộp nhiều). Ở ví dụ: chọn "Doanh nghiệp" → `field_state show` ô mã số thuế, ngược lại `hide`.

### 2.5 Xử lý hàng loạt (hỏi xác nhận + mỗi mục một API)

```jsonc
{ "event": "click", "flow": { "id": "bulk", "type": "sequence", "steps": [
  { "id": "ask",  "type": "confirm", "title": "Duyệt hàng loạt", "message": "Duyệt tất cả hồ sơ đang chờ duyệt?", "confirmLabel": "Duyệt" },
  { "id": "list", "type": "call_api", "url": "https://api.example.com/requests?status=pending", "method": "GET", "authConfig": { "type": "bearer", "token_source": "system" } },
  { "id": "each", "type": "for_each", "items": { "type": "ref", "path": "$steps.list.output.data.items" }, "continueOnError": true,
    "steps": [{ "id": "one", "type": "call_api", "url": "https://api.example.com/requests/{id}/approve", "method": "POST",
      "pathMapping": [{ "source": { "type": "ref", "path": "$row.data.id" }, "target": "id", "required": true }] }] },
  { "id": "report", "type": "show_message", "level": "info", "message": "Đã duyệt {{$steps.each.output.succeeded}}/{{$steps.each.output.total}} hồ sơ" }
] } }
```

- `confirm` **đứng trước** bước có tác dụng phụ. Bấm Hủy → flow **dừng lặng lẽ** (không lỗi, `catch` không chạy).
- `for_each`: trong `steps` đọc phần tử bằng `$row.data.<field>`; output `{ total, succeeded, failed, errors[] }`; thêm `continueOnError` rồi báo kết quả.

### 2.6 Xác nhận xoá trong dialog

Dialog `delete_dialog` (variant `custom`) đứng trước nút mở; nút "Xoá" là **con của dialog** chạy `call_api DELETE` → `dialog close` → `push_table … keepPage: true` → toast. Nút footer có sẵn của dialog **không** chạy `eventHandlers` — nên dùng `button` làm con.

### 2.7 Tải file và phát sự kiện cho app host

```jsonc
{ "id": "dl",   "type": "navigate", "url": "https://api.example.com/reports/{{$form.current.values.report_id}}/export",
  "download": { "authConfig": { "type": "bearer", "token_source": "system" }, "fileName": "bao-cao.xlsx" } }
{ "id": "emit", "type": "emit_event", "eventName": "dynaform:request-processed",
  "payload": { "student_id": { "type": "ref", "path": "$form.current.values.student_id" } } }
```

`download` tải file tại tab hiện tại kèm header Authorization; `emit_event` phát `CustomEvent` ra `window` để app host lắng nghe (`window.addEventListener("dynaform:request-processed", …)`).

## 3. Hành động từng dòng của table — `example-table-row-actions.spec.json`

Cấu hình ở `props.table.actionColumn.actions[]`, mỗi hành động có `flow` riêng với `$row.data.<cột>`, `$row.key`, `$row.index`:

| Hành động | Flow |
|---|---|
| **Xem** | `navigate` `/users/{{$row.key}}` |
| **Sửa** | `dialog open … fillFromRow: true, awaitSubmit: true` → `call_api PUT` (body từ `$steps.open.output.values.*`) → `push_table keepPage` → toast |
| **Xoá** | `confirm` (`destructive: true`) → `try { call_api DELETE, push_table, toast }` |

- Dialog `edit_dialog` đứng **trước** table; control trong dialog có **tên biến trùng khoá của dòng** (`name`, `email`) được điền sẵn nhờ `fillFromRow`; footer có `action: "submit"` (kiểm tra các trường trong dialog) để cho flow chạy tiếp.
- Có `flow` thì flow **nắm toàn bộ** cú click: các trường cũ `confirm` / `dialogTarget` / `dataSourceId` / `redirectUrl` bị bỏ qua.
- Dữ liệu và cột của bảng (Data Source, cột hiển thị) cấu hình thêm trong builder.

## 4. Lỗi hay gặp (script báo)

| Thông báo thật của script | Sửa |
|---|---|
| `WARN … event "change" không được lib cung cấp cho type button (có: click, dblclick, …) — handler sẽ không chạy` | xem bảng event theo control ở SKILL.md §3 |
| `ERROR … $steps.nope.output.x trỏ tới step "nope" không có trong flow` | sửa id; `$steps` chỉ tham chiếu step có trong cùng flow |
| `ERROR … mappings[1].to "missing_field" không tồn tại` | `to` / `target` / `field` là `name` có thật trong spec |
| `ERROR … then phải là MỘT step (dùng sequence để gộp nhiều bước)` | `then`/`else` không phải mảng — bọc bằng `sequence` |
| `ERROR … step id "s1" bị trùng trong cùng handler` | đặt id khác nhau |
| (không có thông báo) nút có flow `click` không validate/gửi | flow phải tự `validate_form` + `call_api` |
