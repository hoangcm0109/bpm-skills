# Client tool — chạy trong editor

Nguồn: `fe_dynaform/src/lib/ai/agent/tools.ts` (tool có sẵn), `src/lib/ai/bridge/` (confirm, dispatcher). Mỗi lượt, editor gửi `tools[]` = tool có sẵn + tool của host (+ `confirm_action` nếu host có UI xác nhận). Agent gọi bằng `tool_use`; editor trả `tool_result` (`is_error: true` khi lỗi).

Mọi lệnh ghi được **đọc lại để kiểm tra** — field bị khoá hoặc giá trị không hợp lệ trả lỗi chứ không "thành công giả". Cả một run của agent là **một bước undo**. Kết quả quá 60 000 ký tự bị cắt.

## Đọc

| Tool | Input | Trả về |
|---|---|---|
| `get_form_state` | — | Snapshot gọn: mỗi component có `id` (rút gọn), `type`, `label`, `ref`, `parentId`, `parentTabId`, `colSpan` (nếu ≠ 12). Gọi đầu tiên |
| `list_component_types` | `category?`: `form`\|`content`\|`layout`\|`all` | Type được phép thêm + `intent` |
| `list_field_refs` | — | Các field đã bind theo `ref` (`variables.name`) để dùng trong điều kiện/sự kiện |
| `get_component` | `componentId` | JSON đầy đủ một control (properties, attributes, validations, options, eventHandlers/flow) |
| `get_selection` | — | `{selected: {id,type,label,ref}}` hoặc `{selected:null}` — khi người dùng nói "field này" |
| `get_form_json` | `include?`: `meta` (mặc định) \| `full` | Form như editor sẽ lưu (gồm phần chưa lưu). `meta` bỏ cây component |
| `list_data_sources` | — | `id`, `name`, `connection_type`, `description`, `depends_on`, `scope`, `status`. **Không** có cấu hình kết nối/credential |
| `validate_form` | — | `{ok, componentCount, issues[]}`: type lạ, tham chiếu tới field không tồn tại, flow không hợp lệ |

## Ghi

| Tool | Input | Ghi chú |
|---|---|---|
| `add_component` | `type`, `label`, `ref` (bắt buộc); `containerId?`, `tabId?`, `afterId?`, `required?` | `ref` snake_case, duy nhất. Trả `newId` rút gọn. `afterId` = chèn ngay sau anh em có sẵn (thay thế field tại chỗ) |
| `update_component` | `componentId`, `key`, `value`; `viewport?` (`sm`\|`md`\|`lg`) | Một thuộc tính mỗi lần. `key` ∈ `label`, `placeholder`, `colSpan`, `colStart`, `alignSelf`, `visible`, `labelPosition`, `labelAlign`, `type`, `required`, `disabled`, `readonly`, `name`, `defaultValue`, `content` (+ `logic`, `eventHandlers`, `validations`, `options` do tool `set_*` ghi). Không `viewport` = giá trị gốc cho mọi màn |
| `remove_component` | `componentId` | Xoá cả con; tự dọn điều kiện/sự kiện tham chiếu tới nó |
| `move_component` | `componentId`; `toContainerId?`, `tabId?`, `toIndex?` | Vào container / ra root / đổi thứ tự root |
| `duplicate_component` | `componentId` | Trả id mới |
| `undo` | — | Hoàn tác bước undo gần nhất |
| `set_validations` | `componentId`, `validations[]` `{type, value?, errorMessage?}` | **Thay thế** toàn bộ. `type` ∈ `required`, `readOnly`, `min`, `max`, `minLength`, `maxLength`, `contains`, `notContains`, `greater`, `lower`, `equals`, `notEquals`, `greaterEqual`, `lowerEqual`, `email`, `url`, `regex`, `matchField`. `matchField.value` = **ref** của field đích |
| `set_options` | `componentId`, `options[]` `{label, value, labelDescription?, checked?}` | **Thay thế** option của select/radio/checkbox-group |
| `set_condition` | `componentId`, `rules[]` `{name?, match: AND\|OR, conditions[{field, operator, value?}], actions[{type, target, value?}]}` | Quy tắc hiện/ẩn/bật/tắt kiểu cũ; thay các handler `condition` của component. `field`/`target` là ref |
| `set_event` | `componentId`, `event`, `actions[]` | Thêm handler (không thay). `event`: `click`, `dblclick`, `hover`, `change`, `load`, `open`, `close`, `control:<tên>`. `actions[].type`: `show`, `hide`, `enable`, `disable`, `require`, `optional`, `setValue`, `openModal`, `closeModal`, `toggleModal`, `switchTab`, `collapse` |
| `set_event_flow` | `componentId`, `event`, `flow`, `replace?` (mặc định `true`) | Gắn **flow** (cây step) vào sự kiện. Kiểm bằng `validateFlow` trước khi ghi. Mặc định thay các handler cùng sự kiện |
| `load_form_json` | `json` (object/array hoặc chuỗi JSON), `replace?` | Thay **cả form**. Form không rỗng thì bắt buộc `replace:true`. Dựng form nhanh hơn nhiều lần `add_component` |
| `select_component` | `componentId?` | Chọn control để người dùng thấy; bỏ `componentId` = bỏ chọn |

`flow`: step gốc `{id, type: "sequence", steps:[…]}`; mỗi step có `id` duy nhất và `type` ∈ `validate_form`, `call_api`, `push_table`, `set_values`, `field_state`, `dialog`, `confirm`, `switch_tab`, `collapse`, `run_script`, `show_message`, `navigate`, `emit_event`, `embed_command`, `reset_form`, `submit_form`, `open_form`, `close_form`, `refetch`, `sequence`, `parallel`, `for_each`, `branch`, `try`. Dạng đầy đủ và công thức: skill `dynaform-logic-events`. (`switch_tab`, `collapse`, `submit_form`, `open_form`, `close_form` hiện bị `validateFlow` báo chưa hỗ trợ khi chạy.)

## Hỏi người dùng

| Tool | Input | Trả về |
|---|---|---|
| `confirm_action` | `message` | `{approved: boolean}`. Chỉ có khi host cung cấp UI xác nhận. `approved:false` ⇒ **dừng**, không làm việc đó |

## Tool của host

Host khai báo bằng `defineClientTool({ schema, risk, handler })`; `risk` = `read` \| `write` \| `destructive` (mặc định `write`). `destructive` luôn qua UI xác nhận của host; không có UI ⇒ bị từ chối. Tên tool khớp `^[a-zA-Z][a-zA-Z0-9_-]{0,63}$`, không trùng tool có sẵn.

mfe-dynaform đăng ký:

| Tool | Risk | Input | Việc |
|---|---|---|---|
| `open_form_detail` | destructive | `root_form_id` | Rời editor, mở trang chi tiết form (môi trường + version) |
| `open_form_editor` | destructive | `id`, `environment?` | Rời editor, mở một version khác trong editor |
| `refresh_form_lists` | write | — | Làm mới danh sách form/version (sau khi server tool đổi dữ liệu) |

## Mẫu thao tác

- **Sửa một thuộc tính**: `get_form_state` → `update_component`.
- **Thay/tách field tại chỗ**: `get_form_state` (ghi `id`, `parentId`, `tabId` của field cũ) → `add_component` field mới đầu tiên với `afterId` = field cũ, các field sau `afterId` = field mới trước đó → `remove_component` field cũ **cuối cùng**.
- **Dựng cả form**: `get_form_state` → `load_form_json` (`replace:true` nếu cần) → `validate_form` → sửa lỗi nó báo.
- **Điều kiện hiện/ẩn**: `list_field_refs` → `set_condition` (hoặc flow `load` + `field_state` theo skill `dynaform-logic-events`).
- Không thêm `submit-button` thứ hai: kiểm `get_form_state` trước.
