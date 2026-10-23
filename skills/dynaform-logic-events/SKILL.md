---
name: dynaform-logic-events
description: Logic và sự kiện của form dynaform — mọi event (click/change/load/open/close/condition/embed/menu) theo từng loại control, rule hiển thị/bắt buộc theo điều kiện, action engine đầy đủ (validate_form, call_api, set_values, field_state, dialog, push_table, navigate, show_message, branch, try, parallel, for_each…), cách truyền dữ liệu giữa các bước, và các kịch bản thường gặp (submit, chọn → điền, mở dialog, làm mới bảng, xác nhận xoá). Ưu tiên action flow, hạn chế field ẩn. Dùng khi field cần ẩn/hiện theo field khác, nút cần mở dialog/gọi API/điều hướng, hoặc cần luồng nhiều bước.
---

# Logic & sự kiện

Tài liệu cho Agent dựng form. Mọi khoá bên dưới là khoá **spec** (`*.spec.json`, xem `../dynaform-build-form/references/spec-format.md`) — `dynaform.mjs` đổi sang JSON của lib và **kiểm tra** event/step/tham chiếu (lỗi → exit 1, cảnh báo → in `WARN`).

## 1. Mô hình

- Hành vi nằm ở `properties.eventHandlers[]` của control: `{ id, event, enabled, actions: [{ type: "flow", flow }] }`. **Mỗi handler chạy đúng một flow** (action engine). Không còn hệ "visual rule" riêng: rule điều kiện chính là handler `event: "condition"`.
- Trong spec bạn viết một trong ba dạng, script đưa hết về flow:
  1. `rules[]` — hiện/ẩn/bắt buộc theo điều kiện (§4).
  2. `events[].actions[]` — chuỗi action phẳng (§5).
  3. `events[].flow` — flow tự viết đầy đủ (§6–§7). **Dùng khi có nhiều bước, rẽ nhánh, API, hoặc cần dữ liệu từ bước trước.**
- Một flow = cây step. Mỗi step có `id` duy nhất trong handler; kết quả mọi step lưu ở `$steps.<id>` = `{ status, output?, error? }` cho các step sau đọc.

## 2. Ưu tiên action flow, hạn chế field `hidden`

- Gộp các việc liên tiếp của một sự kiện vào **một flow** thay vì rải nhiều handler nối nhau bằng field trung gian.
- Dữ liệu giữa các bước truyền **trong flow**: `$steps.<id>.output.<path>` (bước trước), `$event.payload.<path>` (embed/control/menu phát ra), `$form.current.values.<name>`, `$row.data.<field>`, template `{{…}}`. Không cần cất vào field.
- **Đừng** tạo control `hidden` làm cờ ("đã bấm"), bộ nhớ tạm, hay tín hiệu cho handler khác. Mẫu sai: embed `publish` vào field ẩn → handler `change` đọc field ẩn → mở dialog. Mẫu đúng: embed `emit` → handler `embed:<tên>` chạy flow dùng `$event.payload` → step `dialog`.
- `hidden` chỉ hợp lý khi (a) giá trị **phải có trong payload submit** mà không có nguồn hiển thị, hoặc (b) host nạp sẵn qua `dataUserFill`. Khi giữ, ghi `reason`. (`steps.stepsOptions.valueField` của wizard do flow điều khiển cũng cần một field — trường hợp hợp lý khác.)
- Phân biệt: `hidden: true` trên field thường là *ẩn hiển thị* (→ `styles.visible: "no"`), không phải control `hidden`. Theo `docs/ACTION_ENGINE.md`, field ẩn **tĩnh** như vậy **không bật lại được bằng logic**; field cần hiện/ẩn động nên ẩn lúc đầu bằng handler `load` + `field_state: hide` (mẫu ở §7.2).
- `run_script` / `customScript` là phương án cuối, khi các step có sẵn không làm được; hiển thị mã cho người dùng duyệt.

## 3. Event — có những gì, trên control nào

| event | Chạy khi | Control có |
|---|---|---|
| `click` | bấm vào control | `button`, `submit-button`, `reset-button`, `link`, `text`, `image` (+ mặc định mọi type không liệt kê: container, grid, columns, tab, steps, list, table, file…) |
| `dblclick` | bấm đúp | `button` |
| `hover` | rê chuột | `button`, `link`, `text`, `image` + mặc định các type không liệt kê |
| `change` | giá trị đổi | `input`, `textarea`, `number`, `email`, `password`, `tel`, `url`, `select`, `checkbox`, `checkbox-group`, `radio-group`, `switch`, `date-picker`, `range-picker`, `time-picker`, `rate`, `record-picker`, `record-gallery`, `stat-cards`, `sortable-list` |
| `load` | khi control **mount** (lúc form nạp; và **mỗi lần dialog chứa nó mở lại**) | mọi type **trừ** dialog/drawer/bottom-sheet. |
| `open` / `close` | overlay mở / đóng (nút, Esc, click ngoài, step `dialog`, hàng bảng…) | chỉ `dialog`, `drawer`, `bottom-sheet`. Mở từ một dòng loop/list → flow chạy trong dòng đó (`$row.data`) |
| `condition` | **mọi giá trị form đổi** (debounce 250 ms), kiểm lại toàn form | **mọi type** (không phát từ chính control) |
| `embed:<tên>` | `custom-embed` gọi `dfb.emit("<tên>", payload)` — tên phải khai trong `embed.events` | `custom-embed` (không có event DOM) |
| `menu:<id>` | chọn một mục menu thả xuống của `button` (`properties.menu.items`) | `button` có menu: bấm nút chỉ mở menu, **không** chạy `click` |
| `control:<tên>` | control do host định nghĩa phát ra | control host (`x-…`) |

Quy tắc:
- Event không nằm trong cột "Control có" của type đó sẽ **không chạy** — script cảnh báo.
- `$event.payload` chỉ có với `embed:*`, `control:*`, `menu:*` (và click từ hàng bảng/loop có `$row`). Event DOM (`click`, `change`…) **không mang giá trị**: đọc giá trị mới bằng `$form.current.values.<name>`.
- `condition` được đánh giá trên **giá trị gốc của form**, không theo dòng loop/list; điều kiện theo dòng đặt `change` trong dòng.
- Nút (`button`/`submit-button`) có flow `click` đang chạy tự **khoá + hiện spinner** và bỏ qua click tiếp.
- **Nút có flow `click` bỏ qua đường submit mặc định của nút** (kiểm tra, gọi API cấu hình sẵn): flow phải tự `validate_form` và `call_api`. Nút không có `click` thì chạy hành vi mặc định của lib.
- Tên field trong flow là `name` (variable). Trùng tên giữa gốc và bên trong dialog thì tìm **từ dialog chứa nút ra ngoài**; tốt nhất đặt tên duy nhất toàn form.

## 4. Cách 1 — `rules` (hiện/ẩn, bắt buộc, enable theo điều kiện)

```jsonc
{ "type": "input", "name": "company_name", "label": "Tên doanh nghiệp",
  "rules": [{
    "name": "Hiện khi là doanh nghiệp", "match": "AND",
    "when": [{ "field": "account_type", "operator": "equals", "value": "company" }],
    "then": [{ "type": "show", "target": "company_name" }, { "type": "require", "target": "company_name" }]
  }] }
```

- Script sinh handler `condition`: `branch(if when) then=[actions] else=[nghịch đảo]`. Nghịch đảo tự động: `show↔hide`, `enable↔disable`, `require↔optional`. `setValue`, `callApi`, `openLink`, `customScript` **một chiều** (không có else) — muốn else tuỳ ý, dùng flow (§6).
- `when[].operator`: `equals notEquals isEmpty isNotEmpty greaterThan greaterThanOrEqual lessThan lessThanOrEqual contains notContains` (`isEmpty`/`isNotEmpty` không cần `value`). `match`: `AND` (tất cả) | `OR` (một trong).
- Rule gắn ở control nào cũng được; thường đặt trên control bị ảnh hưởng.
- Điều kiện chỉ nhìn **giá trị form** (`field`). So với step/API/hàng bảng thì dùng flow.
- Ví dụ trên chưa đặt trạng thái ban đầu: để chắc chắn ẩn lúc mới mở, thêm handler `load` ẩn control (§7.2).

## 5. Cách 2 — `events[].actions[]` phẳng (một vài thao tác đơn giản)

```jsonc
{ "type": "submit-button", "name": "btn_open", "label": "Mở",
  "events": [{ "event": "click", "actions": [{ "type": "openModal", "target": "success_dialog" }] }] }
```

| action | Cần | Thành step |
|---|---|---|
| `show` `hide` `enable` `disable` `require` `optional` | `target` (name) | `field_state` |
| `setValue` | `target`, `value`, `valueType`: `static` (mặc định) \| `field` | `set_values` |
| `openModal` `closeModal` `toggleModal` | `target` = name dialog/drawer/bottom-sheet | `dialog` open/close/toggle |
| `openLink` | `url`, `newTab`? (mặc định true) | `navigate` |
| `callApi` | `url`, `method`?, `headers`?, `body`? | `call_api` (tối giản: không auth/mapping) |
| `customScript` | `code` | `run_script` (+ `continueOnError`) |
| `switchTab`, `collapse` | — | **chưa có tác dụng** — đừng dùng |

Từ hai thao tác có phụ thuộc nhau (dùng kết quả bước trước, rẽ nhánh, bắt lỗi) → chuyển sang flow.

## 6. Cách 3 — flow tự viết

```jsonc
"events": [{ "event": "click", "flow": {
  "id": "flow", "type": "sequence", "steps": [
    { "id": "valid", "type": "validate_form", "notify": true },
    { "id": "save", "type": "try",
      "steps": [
        { "id": "post", "type": "call_api", "url": "https://api.example.com/submit", "method": "POST", "bodyMode": "form" },
        { "id": "ok", "type": "show_message", "level": "success", "message": "Đã gửi" }
      ],
      "catch": [{ "id": "err", "type": "show_message", "level": "error", "message": "{{$error.message}}" }] }
  ] } }]
```

- Gốc `flow` là một step (thường `sequence`). `branch.then` / `branch.else` là **MỘT step** (dùng `sequence` để gộp).
- Mọi step nhận: `id` (bắt buộc, duy nhất trong handler), `label?`, `enabled?` (`false` = bỏ qua), `continueOnError?` (lỗi được ghi lại nhưng sequence chạy tiếp), `form?` (chỉ layout nhiều form).
- Lỗi một step làm `sequence` dừng ngay, trừ khi `continueOnError`. Dùng `try` để bắt lỗi (`catch` đọc `$error.message`; `finally` luôn chạy).
- **Huỷ** (`confirm` bị Hủy, dialog `awaitSubmit` bị đóng): kết quả step là `cancelled` — flow **dừng ngay kể cả step có `continueOnError`**, `catch` của `try` **không chạy** (huỷ không phải lỗi; `finally` vẫn chạy), không toast lỗi. Đặt `confirm` **trước** bước có tác dụng phụ (gọi API xoá…), không đặt trong `catch`.

### 6.1 Giá trị (`ValueSource`)

| dạng | ý nghĩa |
|---|---|
| `{ "type": "literal", "value": 42 }` | giá trị cố định |
| `{ "type": "ref", "path": "$form.current.values.email" }` | đọc theo đường dẫn |
| `{ "type": "template", "template": "Xin chào {{$form.current.values.full_name}}" }` | chuỗi có `{{đường dẫn}}` |
| `{ "type": "map", "rule": { … } }` | quy tắc Data mapper (đổi mã → nhãn, đếm, định dạng ngày…) — xem `docs/layout-runtime/13-data-mapper.md` |

Đường dẫn:

| root | đọc |
|---|---|
| `$form.current.values.<name>` | giá trị field **hiện tại** (đọc sống: step sau `set_values` thấy giá trị mới). Field trong dialog cũng đọc bằng `<name>` |
| `$steps.<id>.output.<path>` / `.status` | kết quả step đã chạy trước. `items[0].name`, `["a.b"]` đều dùng được |
| `$row.data.<field>`, `$row.index` | dòng bảng/loop/list đang chạy (trong `for_each`: phần tử hiện tại) |
| `$event.type`, `$event.payload.<path>` | event hiện tại (payload của embed/control/menu) |
| `$error.message` | trong `catch` |
| `$runtime.userId` / `tenantId` / `permissions` | ngữ cảnh người dùng do host cấp |
| `$forms.<alias>.values.<name>`, `$layout.vars.<n>`, `$queries.<id>.data` | chỉ khi form chạy trong layout nhiều form |

Template `{{…}}` dùng được ở `template.template`, `show_message.message`, `navigate.url`.
Script chỉ tham chiếu tới `name` đã có trong spec và `$steps.<id>` có trong cùng flow — sai tên → lỗi.

### 6.2 Điều kiện (`branch.condition`)

```jsonc
{ "source": { … } }                                   // truthy của một giá trị
{ "left": {…ValueSource}, "operator": "eq", "right": {…ValueSource} }
{ "all": [ cond, cond ] }  /  { "any": [ cond, cond ] }   // AND / OR, lồng nhiều tầng
```

`operator`: `eq neq gt gte lt lte contains not_contains empty not_empty` (`empty`/`not_empty` không cần `right`). `all: []` = đúng; `any: []` = sai. Số so với chuỗi: lấy giá trị bằng `ref`, so `literal` đúng kiểu.
(Trong `rules[]` của spec dùng tên dễ đọc `equals/greaterThan/…` — xem §4.)

### 6.3 Các step

**Điều khiển luồng**

| step | Trường | Ghi chú |
|---|---|---|
| `sequence` | `steps[]` | chạy lần lượt, dừng ở lỗi đầu tiên |
| `parallel` | `steps[]`, `strategy`: `all` (mặc định, lỗi nếu bất kỳ lỗi) \| `all_settled` \| `race` | gọi nhiều API cùng lúc |
| `branch` | `condition`, `then`, `else?` | `then`/`else` là **một** step |
| `try` | `steps[]`, `catch[]?`, `finally[]?` | `catch` đọc `$error.message` |
| `for_each` | `items` (ValueSource → danh sách), `steps[]`, `mode`: `sequence` (mặc định) \| `parallel`, `failFast?` | trong `steps`: `$row.data`, `$row.index`. Output `{ total, succeeded, failed, errors[] }`; lỗi nếu có phần tử lỗi (thêm `continueOnError` rồi rẽ nhánh theo `$steps.<id>.output.failed`) |

**Form & trường**

| step | Trường | Ghi chú |
|---|---|---|
| `validate_form` | `fields?: [name]` (bỏ qua = cả form), `notify?: true` | `notify` báo số lỗi + focus ô lỗi đầu. Thất bại → flow dừng |
| `set_values` | `mappings: [{ from: ValueSource, to: "<name>" }]` | ghi giá trị vào field. `to` hỗ trợ khoá lồng `items.0.name` |
| `field_state` | `action`: `show\|hide\|enable\|disable\|require\|optional`, `targets: [name]` | áp cho field **và** control layout (container, nhóm…) |
| `reset_form` | — | đặt lại form |
| `submit_form` | — | chủ yếu cho layout nhiều form; ở form đơn dùng `validate_form` + `call_api` |

**Giao diện**

| step | Trường | Ghi chú |
|---|---|---|
| `dialog` | `action`: `open\|close\|toggle`, `target` (name dialog/drawer/bottom-sheet); `fillFromRow?`, `awaitSubmit?` | mở từ dòng loop/list → nội dung dialog đọc dòng đó. `fillFromRow: true` (flow chạy cho một dòng: hành động hàng của table, dòng loop): control trong dialog có **tên biến trùng khoá của dòng** được điền sẵn. `awaitSubmit: true`: mở dialog rồi **dừng ở step này** — nút xác nhận / gửi của dialog (footer action `confirm`/`submit`) cho flow chạy tiếp, `output.values` = giá trị trong dialog; đóng dialog bằng cách khác (X, Esc, click ngoài) → flow dừng, không báo lỗi |
| `confirm` | `message` (chuỗi hoặc ValueSource, có `{{$row.data.name}}`), `title?`, `confirmLabel?` (mặc định "Tiếp tục"), `cancelLabel?` (mặc định "Hủy"), `destructive?` (nút đỏ) | hỏi người dùng đồng ý trước khi chạy tiếp (thay confirm modal). Bấm Hủy / Esc → **flow dừng lặng lẽ** (xem "Huỷ" bên dưới) |
| `show_message` | `level`: `success\|error\|warning\|info`, `message` (chuỗi hoặc ValueSource, có `{{…}}`) | toast |
| `navigate` | `url` (có `{{…}}`), `newTab?`, `delayMs?`, `pathMapping?`, `queryMapping?`, `download?: { authConfig?, fileName? }` | `download` tải file **tại tab hiện tại** kèm header Authorization. `delayMs` để người dùng kịp đọc toast. Chỉ `https://` hoặc đường dẫn nội bộ |
| `push_table` | `tableId`, `mode`: `rows\|request`, `rows`/`total` (mode rows), body (mode request), `keepPage?` | đẩy dữ liệu vào `table` / `record-gallery`; `request` = bảng tự gọi lại API của nó (về trang 1; `keepPage: true` giữ trang). **Trong spec viết `tableId` = name của table**, script đổi sang id lúc build |
| `embed_command` | `target` (name custom-embed), `command`, `payload?` | gửi lệnh vào embed đang hiển thị (`dfb.onCommand`) |
| `emit_event` | `eventName`, `payload?: { khoá: ValueSource }` | phát `CustomEvent` ra `window` cho app host lắng nghe |

**API**

`call_api`:

| trường | ý nghĩa |
|---|---|
| `url` hoặc `apiRef` | endpoint trực tiếp, hoặc id Data Source đã cấu hình trong builder |
| `method` | `GET` (mặc định) \| `POST` \| `PUT` \| `PATCH` \| `DELETE` |
| `headers` | object tĩnh (không để token) |
| `authConfig` | `{ type: "none"\|"bearer"\|"basic"\|"api_key", token_source: "system"\|"manual", token? }` — **dùng `token_source: "system"`**; không ghi token vào form |
| `pathMapping` / `queryMapping` / `headerMapping` | `[{ source: ValueSource, target, required? }]`. `pathMapping` thay `{id}` trong `url`; `required: true` → lỗi nếu giá trị rỗng |
| `bodyMode` | `static` (dùng `body` nguyên văn) \| `mapping` (`bodyMapping: [{source,target}]`) \| `form` (**cả form**, đúng dạng payload submit) \| `tree` (Recursive Mapping Builder — làm trong builder) |
| `applyResponseMapping` | chỉ với `apiRef`: ghi response vào field theo Response Mapping của Data Source |
| output | `$steps.<id>.output` = payload đã bóc; đọc `…output.data.items[0].name` |

- Mặc định lib **gọi trực tiếp từ trình duyệt** (`fetch`) — API phải cho phép CORS và host quyết định cách gắn token (`config.http`). Không viết `fetch("/api/proxy")` trong flow.
- Body truyền như **dữ liệu** (object), không `JSON.stringify` chuỗi.
- Hai bước API độc lập → `parallel`; bước sau cần kết quả bước trước → `sequence` + `$steps.<id>.output`.

`run_script` (`code`, async JS có `form`, `fields`, `ctx.steps/row/event`; `return` → output) — cuối cùng mới dùng.

**Chỉ trong layout nhiều form** (script cảnh báo ở form đơn): `open_form`, `close_form`, `refetch` (chạy lại query của layout), và trường `form` (alias) trên các step.
**Chưa có tác dụng**: `switch_tab`, `collapse`.

## 7. Công thức nhanh (copy rồi đổi tên)

Mỗi mục là một handler `{ "event": …, "flow": … }` đặt vào `events[]` của control chỉ định.

### 7.1 Hiện/ẩn theo giá trị (rules)

Xem §4. Khởi tạo trạng thái đầu bằng `load` (mục 7.2 bên dưới).

### 7.2 Ẩn lúc mở, hiện khi chọn

```jsonc
// trên chính control cần ẩn, hoặc container cha
{ "event": "load", "flow": { "id": "init", "type": "field_state", "action": "hide", "targets": ["company_block"] } }
```
rồi dùng `rules`/`condition` để hiện ra khi điều kiện đúng.

### 7.3 Gửi form (validate → API → thông báo → chuyển trang), xử lý lỗi

```jsonc
{ "event": "click", "flow": { "id": "submit", "type": "sequence", "steps": [
  { "id": "valid", "type": "validate_form", "notify": true },
  { "id": "send", "type": "try",
    "steps": [
      { "id": "post", "type": "call_api", "url": "https://api.example.com/registrations", "method": "POST", "bodyMode": "form",
        "authConfig": { "type": "bearer", "token_source": "system" } },
      { "id": "ok", "type": "show_message", "level": "success", "message": "Đã gửi, mã hồ sơ: {{$steps.post.output.data.code}}" },
      { "id": "go", "type": "navigate", "url": "/registrations", "delayMs": 1200 }
    ],
    "catch": [{ "id": "fail", "type": "show_message", "level": "error", "message": "Gửi thất bại: {{$error.message}}" }] }
] } }
```
Đặt trên `submit-button`. Nút có flow `click` **không** tự validate/gửi — flow làm hết.

### 7.4 Chọn xong → điền các ô khác từ API (có kết quả bước trước)

```jsonc
// trên select `student_id` (event change)
{ "event": "change", "flow": { "id": "fill", "type": "try",
  "steps": [
    { "id": "get", "type": "call_api", "url": "https://api.example.com/students/{id}", "method": "GET",
      "pathMapping": [{ "source": { "type": "ref", "path": "$form.current.values.student_id" }, "target": "id", "required": true }] },
    { "id": "set", "type": "set_values", "mappings": [
      { "from": { "type": "ref", "path": "$steps.get.output.data.full_name" }, "to": "full_name" },
      { "from": { "type": "ref", "path": "$steps.get.output.data.email" }, "to": "email" }
    ] }
  ],
  "catch": [{ "id": "err", "type": "show_message", "level": "error", "message": "Không tải được: {{$error.message}}" }] } }
```
(Select **phụ thuộc** nhau thì dùng `dependsOn` của data source — `../dynaform-data-source/SKILL.md`, không cần flow.)

### 7.5 Nạp dữ liệu khi mở form

```jsonc
// trên container gốc hoặc một control (event load)
{ "event": "load", "flow": { "id": "load", "type": "try",
  "steps": [
    { "id": "get", "type": "call_api", "url": "https://api.example.com/profile", "method": "GET", "authConfig": { "type": "bearer", "token_source": "system" } },
    { "id": "fill", "type": "set_values", "mappings": [{ "from": { "type": "ref", "path": "$steps.get.output.data.name" }, "to": "full_name" }] }
  ],
  "catch": [{ "id": "err", "type": "show_message", "level": "error", "message": "{{$error.message}}" }] } }
```

### 7.6 Nút mở dialog (và dialog tự nạp khi mở)

```jsonc
// nút: mở dialog `edit_dialog`
{ "event": "click", "flow": { "id": "open", "type": "dialog", "action": "open", "target": "edit_dialog" } }
// trên chính dialog: chạy mỗi lần mở
{ "event": "open", "flow": { "id": "prep", "type": "set_values", "mappings": [{ "from": { "type": "literal", "value": "" }, "to": "edit_note" }] } }
```

### 7.7 Xác nhận xoá (dialog → gọi API → đóng → làm mới bảng)

```jsonc
// `button` "Xác nhận" đặt làm con của dialog (variant custom/form). Nút footer có sẵn của dialog không chạy eventHandlers
{ "event": "click", "flow": { "id": "del", "type": "try",
  "steps": [
    { "id": "call", "type": "call_api", "url": "https://api.example.com/items/{id}", "method": "DELETE",
      "pathMapping": [{ "source": { "type": "ref", "path": "$form.current.values.item_id" }, "target": "id", "required": true }] },
    { "id": "close", "type": "dialog", "action": "close", "target": "confirm_dialog" },
    { "id": "refresh", "type": "push_table", "tableId": "items_table", "mode": "request", "keepPage": true },
    { "id": "ok", "type": "show_message", "level": "success", "message": "Đã xoá" }
  ],
  "catch": [{ "id": "err", "type": "show_message", "level": "error", "message": "{{$error.message}}" }] } }
```

### 7.8 Tìm kiếm → làm mới bảng (body theo các ô lọc)

```jsonc
{ "event": "click", "flow": { "id": "search", "type": "push_table", "tableId": "items_table", "mode": "request",
  "bodyMode": "mapping", "bodyMapping": [
    { "source": { "type": "ref", "path": "$form.current.values.keyword" }, "target": "q" },
    { "source": { "type": "ref", "path": "$form.current.values.status" }, "target": "status" }
  ] } }
```
`GET`/`HEAD` bảng: các khoá body đi thành query `?q=…&status=…`, giá trị rỗng bị bỏ.

### 7.9 Rẽ nhánh theo giá trị

```jsonc
{ "event": "change", "flow": { "id": "route", "type": "branch",
  "condition": { "all": [
    { "left": { "type": "ref", "path": "$form.current.values.account_type" }, "operator": "eq", "right": { "type": "literal", "value": "company" } },
    { "left": { "type": "ref", "path": "$form.current.values.country" }, "operator": "not_empty" }
  ] },
  "then": { "id": "yes", "type": "field_state", "action": "show", "targets": ["tax_code"] },
  "else": { "id": "no", "type": "field_state", "action": "hide", "targets": ["tax_code"] } } }
```

### 7.10 Xử lý nhiều mục (mỗi mục một API)

```jsonc
{ "event": "click", "flow": { "id": "bulk", "type": "sequence", "steps": [
  { "id": "each", "type": "for_each", "items": { "type": "ref", "path": "$form.current.values.selected_items" }, "continueOnError": true,
    "steps": [{ "id": "one", "type": "call_api", "url": "https://api.example.com/items/{id}/approve", "method": "POST",
      "pathMapping": [{ "source": { "type": "ref", "path": "$row.data.id" }, "target": "id" }] }] },
  { "id": "report", "type": "show_message", "level": "info", "message": "Xong: {{$steps.each.output.succeeded}}/{{$steps.each.output.total}}" }
] } }
```

### 7.11 Hai API cùng lúc rồi điền

```jsonc
{ "event": "load", "flow": { "id": "boot", "type": "sequence", "steps": [
  { "id": "both", "type": "parallel", "strategy": "all", "steps": [
    { "id": "a", "type": "call_api", "url": "https://api.example.com/a", "method": "GET" },
    { "id": "b", "type": "call_api", "url": "https://api.example.com/b", "method": "GET" } ] },
  { "id": "fill", "type": "set_values", "mappings": [
    { "from": { "type": "ref", "path": "$steps.a.output.data.name" }, "to": "name" },
    { "from": { "type": "ref", "path": "$steps.b.output.data.unit" }, "to": "unit" } ] }
] } }
```

### 7.12 Tải file về máy

```jsonc
{ "event": "click", "flow": { "id": "dl", "type": "navigate", "url": "https://api.example.com/reports/{{$form.current.values.report_id}}/export",
  "download": { "authConfig": { "type": "bearer", "token_source": "system" }, "fileName": "bao-cao.xlsx" } } }
```

### 7.13 Custom-embed phát sự kiện → flow (không dùng field ẩn)

```jsonc
// trên custom-embed `preset_picker` (embed.events: ["select"])
{ "event": "embed:select", "flow": { "id": "pick", "type": "sequence", "steps": [
  { "id": "set", "type": "set_values", "mappings": [{ "from": { "type": "ref", "path": "$event.payload.id" }, "to": "selected_preset" }] },
  { "id": "show", "type": "dialog", "action": "open", "target": "preset_dialog" }
] } }
```

### 7.14 Menu thả xuống của nút

`button` có `properties.menu.items = [{ id: "approve", label: "Duyệt" }, …]` → mỗi mục một handler `{ "event": "menu:approve", "flow": … }`. Cấu hình `menu.items` làm qua `props`/builder; `click` của nút bị bỏ qua.

### 7.15 Đặt lại form / xoá lọc

```jsonc
{ "event": "click", "flow": { "id": "clear", "type": "set_values", "mappings": [
  { "from": { "type": "literal", "value": "" }, "to": "keyword" },
  { "from": { "type": "literal", "value": "" }, "to": "status" } ] } }
```
(Hoặc `reset_form` để đưa cả form về ban đầu.)

### 7.16 Hành động từng dòng của table (`actions[].flow`)

Mỗi hành động trong cột hành động của `table` có **flow riêng**, chạy khi bấm với `$row` = dòng được bấm: `$row.data.<cột>`, `$row.key`, `$row.index`.
Khai trong spec ở `props.table.actionColumn.actions[]` (cấu hình cột / dữ liệu bảng làm trong builder; script chỉ kiểm flow):

```jsonc
{ "type": "table", "name": "users_table",
  "props": { "table": { "actionColumn": { "enabled": true, "actions": [
    // Xoá: hỏi → gọi API với id của dòng → tải lại bảng, giữ trang
    { "id": "del", "label": "Xoá", "type": "delete", "variant": "danger", "flow": { "id": "flow", "type": "sequence", "steps": [
      { "id": "ask", "type": "confirm", "title": "Xoá người dùng", "message": "Xoá {{$row.data.name}}?", "destructive": true },
      { "id": "api", "type": "try",
        "steps": [
          { "id": "call", "type": "call_api", "method": "DELETE", "url": "https://api.example.com/users/{id}",
            "pathMapping": [{ "source": { "type": "ref", "path": "$row.data.id" }, "target": "id", "required": true }] },
          { "id": "reload", "type": "push_table", "tableId": "users_table", "mode": "request", "keepPage": true },
          { "id": "ok", "type": "show_message", "level": "success", "message": "Đã xoá" }
        ],
        "catch": [{ "id": "fail", "type": "show_message", "level": "error", "message": "Xoá thất bại: {{$error.message}}" }] }
    ] } },
    // Sửa: mở dialog điền sẵn từ dòng, CHỜ nút xác nhận rồi mới gọi API
    { "id": "edit", "label": "Sửa", "type": "custom", "flow": { "id": "flow", "type": "sequence", "steps": [
      { "id": "open", "type": "dialog", "action": "open", "target": "edit_dialog", "fillFromRow": true, "awaitSubmit": true },
      { "id": "save", "type": "call_api", "method": "PUT", "url": "https://api.example.com/users/{id}", "bodyMode": "static", "body": {},
        "pathMapping": [{ "source": { "type": "ref", "path": "$row.data.id" }, "target": "id", "required": true }] }
    ] } },
    // Xem chi tiết: điều hướng theo khoá dòng
    { "id": "view", "label": "Xem", "type": "view", "flow": { "id": "flow", "type": "navigate", "url": "/users/{{$row.key}}" } }
  ] } } } }
```

- Có `flow` thì flow **nắm toàn bộ cú click**: `confirm` / `dialogTarget` / `dataSourceId` / `redirectUrl` cũ và hành vi sửa/xoá cục bộ của `type` bị bỏ qua (script cảnh báo khi còn trường cũ). Muốn hỏi xác nhận → step `confirm`.
- `type` (`edit`/`delete`/`view`/`custom`) chỉ quyết định nhãn/biểu tượng mặc định; không có `flow` thì `edit`/`delete` vẫn sửa/xoá dòng cục bộ (bảng tĩnh).
- `push_table.tableId` viết bằng **name của table** (script đổi sang id lúc build). `keepPage: true` tải lại tại trang hiện tại.
- Dialog mở từ hàng bảng đứng **trước** table trong mảng; nút xác nhận của dialog dùng footer action `confirm` (không kiểm tra form) hoặc `submit` (kiểm tra các trường trong dialog).
- Cấu hình cũ (confirm, mở dialog, gọi Data Source, redirect) ở form lưu từ trước **vẫn chạy** (lib tự chuyển thành flow khi bấm; builder hiển thị "chuyển từ cấu hình cũ"). Sự kiện script `table-row-action` giai đoạn `response` không còn bắn cho hành động chạy bằng flow.

## 8. Giới hạn & lưu ý

- **Export code React** chỉ mang dialog / link / API đơn giản; `load`, `condition` và flow phức tạp chỉ chạy ở runtime (preview / viewer / SDK).
- Không có phép tính số học trong `ValueSource` (cộng/nhân): tính toán để backend làm, hoặc `run_script` có duyệt. Data mapper `map` lo định dạng/đổi mã/đếm.
- `condition` luôn nhìn giá trị gốc của form; nhiều `condition` trên form lớn tốn kém — gom vào ít handler, mỗi handler một `branch`.
- Bảng: **hành động hàng chạy flow riêng** (`actions[].flow`, §7.16). Link ô của cột và nút footer có sẵn của dialog vẫn có đường logic riêng (chưa đi qua `eventHandlers`) — cấu hình trong builder.
- Mở/đóng dialog luôn qua step `dialog` (key theo dialog), kể cả từ hàng bảng; dialog mở từ dòng loop/list đọc dữ liệu dòng đó.
- `required` thay đổi động: dùng `field_state` `require`/`optional` (đừng đặt `required: true` cứng cho control cần bật/tắt — `../dynaform-validation/SKILL.md`).
- Gỡ lỗi: builder có **Sơ đồ + chạy thử + trace từng step** (`docs/ACTION_ENGINE.md`); mỗi lần gọi API test trong editor nhập giá trị mẫu cho các field flow đọc.

## 9. Ví dụ chạy được

Spec đầy đủ (build + validate bằng `dynaform.mjs`), giải thích trong `references/examples.md`:

- `assets/example-rules.spec.json` — rule điều kiện: hiện/ẩn, bắt buộc, bật/tắt, `AND`/`OR`, `isEmpty`, so sánh số, `setValue`; ẩn lúc mở bằng `load` + `field_state`.
- `assets/example-flows.spec.json` — flow: tìm kiếm → làm mới bảng, chọn → điền từ API, nạp song song khi mở, `branch`, `confirm` + `for_each`, xác nhận xoá trong dialog, tải file, `emit_event`.
- `assets/example-table-row-actions.spec.json` — hành động từng dòng của `table` (xem / sửa bằng dialog chờ xác nhận / xoá có xác nhận).

## 10. Quy tắc chung

1. Mọi `target` / `field` là **`name`**, phải tồn tại trong spec; script từ chối tham chiếu treo.
2. Dialog đứng **trước** nút mở nó; `dialog` variant confirmation/info đặt nội dung ở `dialog.title/description`.
3. `customScript`/`run_script` là JS thô chạy ở trình duyệt người dùng cuối, bị host kiểm soát theo logic-execution policy — **không dùng mặc định** (`../dynaform-build-form/` › Bảo mật; `docs/security/form-json-safety.md`).
4. Không nhúng secret/token vào JSON form; API ngoài cần CORS + auth do host cấp.
5. URL `navigate` / `call_api`: `https://` hoặc đường dẫn nội bộ do người dùng cung cấp.
6. Tài liệu lib: `docs/ACTION_ENGINE.md` (steps, adapter), `docs/EVENT_SYSTEM.md` (event, condition), `docs/LOGIC_CUSTOM_JAVASCRIPT_GUIDE.md` (JS), `docs/layout-runtime/` (nhiều form).
