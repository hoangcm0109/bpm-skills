# Ví dụ đầy đủ — component dynaform

Hai spec chạy được trong `assets/` (build/validate như `../../dynaform-build-form/references/examples.md`):

```bash
S=skills/dynaform-build-form/scripts/dynaform.mjs
node $S build skills/dynaform-components/assets/example-input-catalog.spec.json   --out /tmp/catalog.json
node $S build skills/dynaform-components/assets/example-layout-controls.spec.json --out /tmp/layout-controls.json
```

| Spec | Có gì |
|---|---|
| `example-input-catalog.spec.json` | **một** control cho mỗi type nhập liệu/hiển thị: `input textarea number email tel password url select radio-group checkbox-group checkbox switch date-picker time-picker range-picker range-slider calendar file signature wysiwyg-editor text link image` + 3 loại nút |
| `example-layout-controls.spec.json` | `container` (card + `custom`), `list`, `nested-list`, `form-loop`, `dialog` (confirmation + form), `drawer`, `bottom-sheet` |

## 1. Chọn type — đi từ dữ liệu, không từ hình dạng

| Yêu cầu | Type | Ghi chú trong catalog |
|---|---|---|
| "số điện thoại" | `tel` | không có `phone` |
| "tuổi / số lượng / tiền" | `number` + `dataType: "number"` | |
| "chọn 1 trong 3 tỉnh" | `select` + `options` | ít lựa chọn, muốn thấy hết → `radio-group` |
| "chọn nhiều kênh nhận tin" | `checkbox-group` | mỗi option `{ label, value }` |
| "đồng ý điều khoản" | `checkbox` | `required: true` để buộc tích |
| "bật thông báo" | `switch` + `dataType: "boolean"` | |
| "ngày / giờ / khoảng ngày" | `date-picker` / `time-picker` / `range-picker` | |
| "đính kèm tệp" | `file` | giới hạn dung lượng/định dạng cấu hình trong builder (`props.fileValidations`) |
| "chữ ký / mô tả định dạng" | `signature` / `wysiwyg-editor` | cả hàng (`colSpan` 12) |
| "tiêu đề / đoạn giải thích" | `text` | `content` là HTML; không thu dữ liệu; không in nhãn tên biến |

## 2. Control layout — cấu hình đúng khoá

Đoạn tiêu biểu từ `example-layout-controls.spec.json`:

```jsonc
// container dạng card + style tuỳ chỉnh; tiêu đề làm bằng `text` con đầu tiên
{ "type": "container", "name": "grp_customer", "container": { "type": "card", "border": true },
  "custom": { "className": "rounded-xl shadow-sm" } },
{ "type": "text", "name": "grp_customer_title", "parent": "grp_customer", "content": "<h3>Khách hàng</h3>" },
{ "type": "input", "name": "customer_name", "label": "Tên khách hàng", "colSpan": 6, "parent": "grp_customer", "required": true,
  "custom": { "label": { "className": "font-semibold" }, "control": { "className": "border-2 rounded-lg" } } },

// list: mỗi dòng MỘT control (mảng giá trị đơn). nested-list: mỗi dòng NHIỀU control (mảng object)
{ "type": "list", "name": "phones", "label": "Số điện thoại liên hệ",
  "list": { "minRows": 1, "initialRows": 1, "maxRows": 3, "addButtonLabel": "+ Thêm số" } },
{ "type": "tel", "name": "phone_item", "label": "Số điện thoại", "parent": "phones" },

// form-loop: lặp một khối theo mảng có sẵn (ở đây là mảng `members` của nested-list phía trên)
{ "type": "form-loop", "name": "member_loop",
  "loop": { "mode": "variable", "dataPath": "members", "itemAlias": "member", "emptyText": "Chưa có thành viên",
            "allowAdd": false, "allowRemove": false } },
{ "type": "text", "name": "loop_row", "parent": "member_loop", "content": "<p><b>{{member_name}}</b> — {{member_role}}</p>" }
```

Overlay — **đứng trước nút mở nó**, mở/đóng bằng step `dialog`:

```jsonc
{ "type": "dialog", "name": "confirm_dialog", "label": "Xác nhận gửi",
  "dialog": { "variant": "confirmation", "title": "Gửi đơn hàng?", "description": "Sau khi gửi bạn không thể sửa." } },   // KHÔNG có con
{ "type": "dialog", "name": "note_dialog", "label": "Ghi chú nội bộ", "dialog": { "variant": "form", "title": "Ghi chú nội bộ" } },
{ "type": "textarea", "name": "internal_note", "parent": "note_dialog" },                                                    // variant form/custom mới có con
{ "type": "drawer", "name": "help_drawer", "dialog": { "variant": "custom", "title": "Hướng dẫn", "side": "right" } },    // drawer: thêm side
{ "type": "bottom-sheet", "name": "tip_sheet", "dialog": { "variant": "info", "title": "Mẹo nhanh" } },
{ "type": "button", "name": "btn_note", "label": "Ghi chú",
  "events": [{ "event": "click", "flow": { "id": "open", "type": "dialog", "action": "open", "target": "note_dialog" } }] }
```

Cách đặt con theo loại cha (bảng ở SKILL.md › "Control layout"):

| Cha | Con khai | Ví dụ |
|---|---|---|
| `container`, `list`, `nested-list`, `form-loop`, `dialog/drawer/bottom-sheet` | `parent` | `"parent": "grp_customer"` |
| `tab`, `steps` | `parent` + `tabId` = id trong `tabs[]` / `steps[]` | `"tabId": "tab-contact"` |
| `columns` | `parent` + `tabId: "col-0"…` (bắt buộc) | `"tabId": "col-1"` |
| `grid` | `parent` (không `tabId`), lấp ô theo **thứ tự** | xem `../../dynaform-layout/assets/example-layout-recipes.spec.json` (#10) |

## 3. Lỗi hay gặp (kiểm bằng script)

| Triệu chứng | Nguyên nhân | Sửa |
|---|---|---|
| `ERROR … type "phone" không có trong registry` | dùng type không tồn tại | `tel` |
| `ERROR … select cần options[] (>= 2 mục) hoặc dataSource` | select không có nguồn | thêm `options` / `dataSource.api` |
| `ERROR … columns "x" cần tabId dạng col-0..col-N` | con của `columns` thiếu `tabId` | thêm `tabId` |
| Control đặt trong dialog `confirmation`/`info` không thấy đâu | gắn con vào variant không có con | đặt nội dung ở `dialog.title/description`, hoặc đổi variant `form`/`custom` |
| Nút mở dialog không có tác dụng | dialog đứng **sau** nút trong mảng, hoặc `target` sai `name` | dialog đứng trước, `target` = `name` dialog |

## 4. Control chuyên dụng — dựng khung rồi cấu hình trong builder

`table`, `timeline`, `descriptions`, `record-picker`, `record-gallery`, `stat-cards`, `sortable-list`, `matrix`, `sub-form`: script chỉ tạo khung; `props` truyền thẳng vào `editable_props.properties`. Ví dụ thật có `table` đầy đủ hành động hàng:
`../../dynaform-logic-events/assets/example-table-row-actions.spec.json`. Chỉ dùng `custom-embed` khi mọi cách trên không đáp ứng (kèm `reason`) — ví dụ chạy được: `../../dynaform-build-form/references/custom-embed.md`.
