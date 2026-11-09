# Viết form JSON trực tiếp (FormDesignJson)

Agent **viết thẳng** `FormDesignJson` — không có script sinh hay kiểm tra, mọi việc làm tay theo tài liệu này và tự kiểm bằng [`checklist.md`](checklist.md).
Định dạng dưới đây là dạng **rút gọn** mà loader của lib (`transformFormComponents`) đọc ra model **giống hệt** JSON đầy đủ do builder xuất (đã đối chiếu trên 12 form mẫu): bỏ các trường tự sinh lại, giữ các trường định danh.
Nguồn sự thật: `fe_dynaform` — `FormComponentModel.toGroupJSON` (xuất), `transformFormComponents` (đọc).

> **Ký hiệu "khoá gọn" trong các skill con.** Các skill `dynaform-components`, `-validation`, `-logic-events`, `-layout`, `-data-source` mô tả cấu hình bằng khoá ngắn
> (`name`, `label`, `colSpan`, `validations`, `events`, `rules`, `props`…) cho dễ đọc. Đó chỉ là **cách viết trong tài liệu**; JSON bạn xuất ra phải đúng vị trí ở §10 (bảng quy đổi).

## 1. Khung tài liệu

```jsonc
{
  "id": "<uuid v4 của form>",
  "name": "Tên form", "description": "",
  "settings": {
    "setting": { "name": "Tên form", "id": "<cùng id form>", "endpoint": "", "method": "POST",
                 "addUniqueIdentifier": false, "formKey": "", "size": "normal" },   // size: xs | sm | normal | lg | xl
    "theme": { "styles": { "type": "normal", "borderRadius": "0.5rem", "fontSize": "14px" },
               "colors": { "background": "#FFFFFF", "foreground": "#09090B", "primary": "#18181B", "primaryForeground": "#FAFAFA",
                           "secondary": "#F4F4F5", "secondaryForeground": "#18181B", "border": "#E4E4E7" } }
  },
  "form_components": [ { "item_control": { … } }, … ]     // thứ tự mảng = thứ tự hiển thị
}
```

`endpoint` = nơi submit (để trống nếu host tự xử lý); không đặt token/bí mật vào đây. Có thể thêm `bound_variables` (giá trị host nạp sẵn, key theo `key_path`).
JSON có thể nằm phẳng hoặc bọc trong `form_content`; khi **sửa** JSON có sẵn giữ nguyên các trường backend thêm (`application_code`, `environment`, `version`, `status`, `flow_publish`…).

## 2. Một control

Mọi control (kể cả container) viết dạng `{ "item_control": { … } }`:

```jsonc
{ "item_control": {
    "id": "<uuid v4 duy nhất>",
    "type": "input",
    "slug": "input-field",                // luôn = "<type>-field"
    "group_code": "basic", "category": "form", "display_name": "Text Field",
    "icon": "TextCursorInput", "renderer_key": "DfsTextField",     // 5 trường này tra ở §3
    "data_lang": "input-full_name",       // luôn = "<type>-<name>"
    "sort_order": 1,                       // 1, 2, 3… theo thứ tự trong CÙNG cha
    "parent_tab_id": "tab-1",              // CHỈ khi cha chia ngăn (tab / steps / columns), xem §4
    "variables": { "name": "full_name", "scope": "form", "display_label": "Họ và tên", "key_path": "full_name", "data_type": "string" },
    "editable_props": {
      "properties": { "label": "Họ và tên", "helpText": "", "hidden": false, "placeholder": "Nguyễn Văn A", "required": true },
      "styles": { "colSpan": "6" },
      "overrides": { "sm": { "properties": { "style": { "colSpan": "12" } } } }
    },
    "validation_schema": [ { "type": "required", "value": "yes", "errorMessage": "Vui lòng nhập họ tên" } ],
    "children_schema": [ /* control con, chỉ container */ ]
} }
```

Bắt buộc: `id`, `type`, `slug`, `group_code`, `category`, `display_name`, `icon`, `renderer_key`, `data_lang`, `sort_order`, `variables.name`, `editable_props`.
Bỏ được (lib tự sinh): `parent_id` (suy từ cây), `is_activated`, `is_deleted`, `locked_props`, `logic_rules`, `behavior`, `children_schema: []`, `validation_schema: []`, các trường của vỏ ngoài (`status`, `variable_name`, `kind`…).

Quy tắc:
- `id`: UUID v4 **mới cho từng control**, duy nhất trong form. Không đổi `id` của control đã có khi sửa JSON có sẵn.
- `variables.name`: snake_case `^[a-z][a-z0-9_]*$`, **duy nhất toàn form**. Mọi tham chiếu chéo (matchField, rule, flow, `dependsOn`, embed) dùng `name`, không dùng `id`.
- `variables.key_path` = `name`; `display_label` = nhãn; `scope` = `"form"`; `data_type` = `"string"` (mặc định) | `"number"` (type `number`) | `"boolean"` (`checkbox`, `switch`) | `"object"`…
- `default_values`: giá trị mặc định cố định (bỏ nếu không có).
- Nhãn, thông báo lỗi, placeholder tiếng Việt; `name`, `type`, mã kỹ thuật tiếng Anh.

## 3. Bảng registry — type → 5 trường định danh

`category` = `form` cho control nhập liệu, `content` cho nội dung tĩnh, `layout` cho bố cục. Mỗi dòng: `type` → `group_code` · `renderer_key` · `icon` · `display_name` · `category`.

| type | group_code | renderer_key | icon | display_name | category |
|---|---|---|---|---|---|
| container | layout | DfsContainer | Container | Container | layout |
| grid | layout | DfsGrid | LayoutGrid | Grid | layout |
| columns | layout | DfsColumns2 / 3 / 4 (theo số cột) | Columns2 | Columns | layout |
| tab | layout | DfsTabs | PanelTop | Tab | layout |
| steps | layout | DfsFormSteps | Footprints | Steps | layout |
| list | layout | DfsList | List | List | layout |
| nested-list | layout | DfsNestedList | ListTree | Nested list | layout |
| dialog | layout | DfsDialog | SquareStack | Dialog | layout |
| drawer | layout | DfsDrawer | PanelRight | Drawer | layout |
| bottom-sheet | layout | DfsBottomSheet | PanelBottom | Bottom Sheet | layout |
| form-loop | layout | DfsFormLoop | Repeat | Form Loop | layout |
| sub-form | layout | DfsSubForm | FileStack | Sub-form | content |
| text | basic | DfsText | Type | Text | content |
| link | basic | DfsLink | Link2 | Link | content |
| image | basic | DfsImage | Image | Image | content |
| divider | basic | DfsDivider | Minus | Divider | content |
| input | basic | DfsTextField | TextCursorInput | Text Field | form |
| textarea | basic | DfsTextareaField | Type | Textarea | form |
| number | basic | DfsNumberField | Hash | Number Field | form |
| email | basic | DfsEmailField | Mail | Email | form |
| password | basic | DfsPasswordField | Lock | Password | form |
| file | basic | DfsFileUploadField | Upload | File upload | form |
| tel | basic | DfsTelephoneField | Phone | Telephone | form |
| url | basic | DfsUrlField | Link | URL | form |
| checkbox | basic | DfsCheckboxField | CheckSquare | Checkbox | form |
| checkbox-group | basic | DfsCheckboxGroupField | ListChecks | Checkbox Group | form |
| radio-group | basic | DfsRadioGroupField | CircleDot | Radio Group | form |
| switch | basic | DfsSwitchField | ToggleRight | Switch | form |
| select | basic | DfsSelectField | ChevronDown | Select | form |
| tree-select | basic | DfsTreeSelectField | ListTree | Select Tree | form |
| range-slider | basic | DfsRangeSliderField | SlidersHorizontal | Range Slider | form |
| hidden | basic | DfsHiddenField | EyeOff | Hidden Field | form |
| button | basic | DfsButtonField | MousePointerClick | Button | form |
| submit-button | basic | DfsSubmitButtonField | Send | Submit Button | form |
| reset-button | basic | DfsResetButton | RotateCcw | Reset Button | form |
| matrix | advanced | DfsMatrixField | Grid3X3 | Matrix | form |
| signature | advanced | DfsSignatureField | PenLine | Signature | form |
| wysiwyg-editor | advanced | DfsWysiwygEditorField | FileText | WYSIWYG Editor | form |
| date-picker | advanced | DfsDatePickerField | CalendarDays | Date Picker | form |
| range-picker | advanced | DfsRangePicker | CalendarRange | Date Range Picker | form |
| time-picker | advanced | DfsTimePicker | Clock | Time Picker | form |
| calendar | advanced | DfsCalendar | Calendar | Calendar | form |
| table | advanced | DfsFormTable | Table | Table | content |
| timeline | advanced | DfsFormTimeline | History | Timeline | content |
| descriptions | advanced | DfsFormDescriptions | ListChecks | Descriptions | content |
| json-tree | advanced | DfsJsonTree | Braces | JSON Tree | form |
| code | advanced | code | Code2 | Code | form |
| record-picker | choose | DfsRecordPickerField | LayoutList | Record Picker | form |
| record-gallery | choose | DfsRecordGalleryField | GalleryVerticalEnd | Record Gallery | form |
| stat-cards | choose | DfsStatCardsField | ChartColumn | Stat Cards | form |
| sortable-list | choose | DfsSortableListField | ArrowDownUp | Sortable List | form |
| custom-embed | choose | DfsCustomEmbedField | CodeXml | Custom Embed | form |

Type không có trong bảng = không dùng (đừng bịa `type`; `phone` không tồn tại, dùng `tel`). Control cấu hình sâu (`table`, `matrix`, `sub-form`, `record-*`, `timeline`, `descriptions`…): viết khung + `properties` theo skill `dynaform-components`; phần còn lại cấu hình trong builder.

## 4. Cây cha–con

Con nằm trong `children_schema` của cha (mỗi phần tử cũng là `{ "item_control": … }`); `sort_order` đếm lại từ 1 trong từng cha. **Cha khai báo trước con** — vì con nằm trong cha nên điều này tự thoả.

| Cha | Con cần | Ghi chú |
|---|---|---|
| `container`, `list`, `nested-list`, `form-loop`, `dialog`, `drawer`, `bottom-sheet` | — | chỉ nằm trong `children_schema` |
| `tab` | `parent_tab_id` = `id` trong `properties.tabs` | `"tabs": [{ "id": "tab-1", "label": "Thông tin" }, …]` |
| `steps` | `parent_tab_id` = `id` trong `properties.steps` | `"steps": [{ "id": "step-1", "label": "Bước 1" }, …]`; tuỳ chọn `stepsOptions` |
| `columns` | `parent_tab_id` = `"col-0"`, `"col-1"`… (< số cột) | `"columns": { "count": 2..4, "spans": [tổng 12], "gap": "1rem", "stackOnMobile": "yes" }`; `renderer_key` = `DfsColumns<count>` |
| `grid` | **không** có `parent_tab_id` | con lấp ô theo thứ tự (hàng trước, cột sau), **mỗi ô một con** (cần nhiều control trong một ô thì bọc bằng `container`); cấu hình ở §6 |

- `dialog` / `drawer` / `bottom-sheet`: đặt **trước** nút/handler mở chúng; không chiếm chỗ trong lưới. Chỉ variant `form` / `custom` mới có con; `confirmation` / `info` dùng `dialog.title` / `dialog.description`.
- Hàng 12 cột của một vùng chứa: cộng `colSpan` các con liên tiếp, đủ 12 thì xuống hàng (6+6, 4+4+4, 8+4…).

## 5. `editable_props.properties`

Chung: `label`, `helpText`, `hidden` (`true` ⇒ ẩn hiển thị, rule/flow `show` bật lại được), `placeholder`, `required`, `disabled`, `readonly`, `attributes` (vd `{ "type": "text" }`), `content` (HTML cho `text`).
Theo type — mỗi khoá nằm cùng cấp trong `properties`:

| Cho type | Khoá |
|---|---|
| `tab` / `steps` | `tabs` (mỗi tab có thể thêm `hideWhen`, lib ≥ 5.6.7 — chỉ `tab`; xem `dynaform-components` › `tab`) / `steps` + `stepsOptions` `{ showPrevious, defaultPreviousLabel, defaultNextLabel, finishLabel, showProgress, validateOnNext, progressVariant }` |
| `columns` | `columns` `{ count, spans, gap, stackOnMobile }` |
| `grid` | `grid` `{ cols (1..6), rows, columnWidths: ["1fr",…] (đủ `cols` phần tử), gap: "1rem", stackOnMobile: "yes", spans?: { "<ô>": { r, c } } }`; `rows` = ⌈số con ÷ cols⌉ nếu không gộp ô |
| `list` / `nested-list` | `list` `{ minRows: 1, initialRows: 1, addButtonLabel: "+ Add", maxRows? }` |
| `form-loop` | `loop` `{ mode: "variable", dataPath: "", itemAlias: "item", emptyText: "", allowAdd: false, allowRemove: false, addButtonLabel: "+ Add", sampleData: "" }` |
| `dialog` | `dialog` `{ variant: "confirmation"\|"form"\|"info"\|"custom", title, description }` |
| `drawer` | `drawer` `{ side: "right", …như dialog }` |
| `bottom-sheet` | `bottomSheet` `{ …như dialog }` |
| `container` | kiểu hiển thị nằm ở `styles` (§7): `containerType` (`div`\|`card`\|`fieldset`), `showBorder` (`yes`\|`no`), `borderType`. Tiêu đề container **không lưu được** — dùng control `text` |
| mọi control | `custom` `{ className, css, control: {className, css}, label: {className, css} }` (CSS thuần + class Tailwind; skill `dynaform-components` › Style tuỳ chỉnh) |
| `table`, `file`, nút… | cấu hình sâu theo skill `dynaform-components` (`table.rowClickActionKey`, cột `cellType: "lines"`, `fileValidations.localOnly`; nút: `variant`, `color`) |
| `custom-embed` | `embed` — xem §9 |
| mọi control có hành vi | `eventHandlers` — xem §8 |

## 6. Giá trị `select` / `radio-group` / `checkbox-group` / `tree-select` (`variables.data_source`)

Bắt buộc có một trong hai (ít nhất 2 lựa chọn với tĩnh).

Tĩnh:
```jsonc
"data_source": { "connection_type": "hard", "status": "active", "request_config": {}, "response_mapping": [],
                 "timeout_ms": 0, "retry_attempts": 0, "cache_ttl_seconds": 0, "name": "Chủ đề",
                 "connection_config": { "value": [ { "label": "Tuyển sinh", "value": "admission" }, { "label": "Học phí", "value": "tuition", "checked": true } ] } }
```
`value` luôn là **chuỗi**; `checked: true` = chọn sẵn. `name` = nhãn control.

Từ API (token/bí mật **không** ghi vào form — `auth_config` dùng `{ "type": "none" }` hoặc nguồn hệ thống do host cấp):
```jsonc
"data_source": { "connection_type": "api", "name": "Tỉnh/Thành", "status": "active", "timeout_ms": 5000, "retry_attempts": 2, "description": "",
                 "depends_on": ["province"],                                   // chỉ khi phụ thuộc field khác (name của field cha)
                 "request_config": { "method": "GET", "headers": {}, "endpoint": "/provinces/{province}/districts",
                                     "path_params": { "province": "{$province}" }, "query_params": {} },
                 "response_mapping": [ { "path": "data", "label": "name", "value": "code", "variable": "district" } ],   // variable = name của chính field
                 "connection_config": { "base_url": "https://api.example.com", "auth_config": { "type": "none" } } }
```
Cấp cha đứng trước cấp con. Chi tiết (phụ thuộc, điền sẵn, `data.dataUserFill`): skill `dynaform-data-source`.

## 7. `styles` và `overrides` (bố cục)

`styles` chỉ cần khoá khác mặc định (giá trị là **chuỗi**): `colSpan` (`"1"`–`"12"`, mặc định 12), `colStart` (`"auto"` hoặc `"1"`–`"12"`; `colStart + colSpan − 1 ≤ 12`), `alignSelf` (`start` mặc định, không ghi | `center` | `end` | `stretch`), `showLabel` (`yes`\|`no`; `text` và `custom-embed` đặt `"no"`), `labelPosition`, `visible`, và với nút `icon`, `iconPosition`, `buttonWidth`, `buttonAlign`.

`overrides` theo cỡ màn hình, **desktop trước** (giá trị gốc áp mọi cỡ): chỉ lib đọc `md` (< 1024px) và `sm` (< 768px), đặt trong `properties.style`:
```jsonc
"overrides": { "md": { "properties": { "style": { "colSpan": "6" } } }, "sm": { "properties": { "style": { "colSpan": "12" } } } }
```
**Mặc định nên làm**: control nào có `colSpan` < 12 thì thêm `sm.colSpan = "12"` (và `sm.colStart = "auto"` nếu có `colStart`) để xuống một cột trên mobile. Không viết `overrides.sm.styles` — lib bỏ qua. Công thức bố cục, số cột theo control: skill `dynaform-layout`.

## 8. Validation, sự kiện, logic

**`validation_schema`**: `[{ "type", "value"?, "errorMessage"? }]`. `required: true` → ngoài `properties.required` còn phải có `{ "type": "required", "value": "yes", "errorMessage": "…" }` ở đây (đừng khai báo trùng). Type hợp lệ: `required readOnly min max minLength maxLength contains notContains greater lower equals notEquals greaterEqual lowerEqual email url regex matchField` — `matchField.value` = **`name`** của field gốc. Chi tiết: skill `dynaform-validation`.

**`properties.eventHandlers`**: mỗi handler chạy đúng **một flow**:
```jsonc
{ "id": "eh_<name>_1", "event": "click", "enabled": true,
  "actions": [ { "type": "flow", "flow": { "id": "flow", "type": "sequence", "steps": [ /* step */ ] } } ] }
```
`event`: `click dblclick hover change load open close condition`, hoặc `embed:<tên>` / `menu:<id>` / `control:<tên>`. Event phải hợp với control (`input`… → `change`; nút → `click`; `dialog` → `open`/`close`; mọi control trừ overlay có `load`). `id` step **duy nhất trong cùng handler**; `branch.then` / `else` là **MỘT** step (bọc nhiều bước bằng `sequence`). Danh sách step, ValueSource (`literal`/`ref`/`template`/`map`), `$form`/`$steps`/`$event`/`$row`, công thức: skill `dynaform-logic-events`.

Đổi tên field/dialog bằng **`name`** trong `targets`, `target`, `to`, `$form.current.values.<name>`. Riêng `push_table.tableId` phải là **`item_control.id`** của table/record-gallery (không phải name).

Hành động phẳng → step (khi cần viết nhanh một handler đơn giản):

| Hành động | Step |
|---|---|
| `show hide enable disable require optional` + `target` | `{ id, type: "field_state", action: "<hành động>", targets: ["<name>"] }` |
| `setValue` | `{ id, type: "set_values", mappings: [{ to: "<name>", from: { type: "literal", value: "…" } }] }` (`from` = `{ type: "ref", path: "$form.current.values.<name>" }` để lấy từ field khác) |
| `openModal closeModal toggleModal` | `{ id, type: "dialog", action: "open"\|"close"\|"toggle", target: "<name overlay>" }` |
| `openLink` | `{ id, type: "navigate", url, newTab: true }` |
| `callApi` | `{ id, type: "call_api", url, method, headers?, body? }` |
| `customScript` | `{ id, type: "run_script", code }` — **mặc định không dùng**; nếu bắt buộc phải hiện mã cho người dùng duyệt |

**Rule hiện/ẩn theo điều kiện** = handler `event: "condition"` bọc một `branch`: `then` = các action, `else` = action **nghịch đảo** (`show↔hide`, `enable↔disable`, `require↔optional`):
```jsonc
{ "id": "eh_company_name_1", "event": "condition", "enabled": true,
  "actions": [ { "type": "flow", "flow": { "id": "flow", "type": "sequence", "label": "Hiện tên công ty khi là doanh nghiệp", "steps": [
    { "id": "branch_1", "type": "branch", "label": "Hiện tên công ty khi là doanh nghiệp",
      "condition": { "left": { "type": "ref", "path": "$form.current.values.customer_type" }, "operator": "eq", "right": { "type": "literal", "value": "business" } },
      "then": { "id": "flow_then", "type": "sequence", "steps": [ { "id": "field_state_1", "type": "field_state", "action": "show", "targets": ["company_name"] } ] },
      "else": { "id": "flow_else", "type": "sequence", "steps": [ { "id": "field_state_2", "type": "field_state", "action": "hide", "targets": ["company_name"] } ] } } ] } } ] }
```
Mọi `id` step trong một handler phải khác nhau (kể cả giữa `then` và `else`).
Nhiều điều kiện: `condition: { "all": [c1, c2] }` (AND) hoặc `{ "any": [c1, c2] }` (OR). Toán tử: `equals→eq notEquals→neq greaterThan→gt greaterThanOrEqual→gte lessThan→lt lessThanOrEqual→lte contains notContains→not_contains isEmpty→empty isNotEmpty→not_empty` (`empty`/`not_empty` không có `right`).
**Ẩn lúc mở**: đừng dùng `hidden: true` tĩnh nếu sau đó rule cần bật lại — thêm handler `load` với `field_state: hide`, rồi rule `show`.
`switchTab` / `collapse` hiện chưa có tác dụng ở runtime — dùng `field_state`/`set_values` thay thế.

## 9. `custom-embed`

Lối thoát **cuối cùng** (khi mọi control có sẵn không đáp ứng); ghi lý do trong báo cáo. `properties.embed`:
```jsonc
"embed": { "schemaVersion": 1, "mode": "sandbox", "framework": "react", "valueType": "none", "html": "<div id=\"root\"></div>", "css": "",
           "inputs": [ { "name": "keyword", "from": { "field": "keyword" } } ],     // hoặc "from": { "ref": "<đường dẫn layout>" }
           "outputs": [ { "name": "picked", "to": "picked_id" } ],                  // to = name field đích (phải tồn tại)
           "events": ["select"], "permissions": [], "height": { "mode": "auto" }, "designMode": "live", "tailwind": true,
           "js": "<code>", "source": "<code>" }
```
`js` và `source` cùng chứa mã React. `styles`: `showLabel: "no"`, `labelPosition: "top"`. **Không** có `tailwindCss` — người dùng phải mở form trong builder → chọn control → *Sửa TSX / HTML (Tailwind)* → Lưu để builder sinh. Cách viết `code`: [`custom-embed.md`](custom-embed.md).

## 10. Bảng quy đổi: khoá gọn (trong tài liệu) → JSON

| Khoá gọn | Vị trí trong `item_control` |
|---|---|
| `type` | `type` (+ 5 trường định danh §3) |
| `name` | `variables.name`, `variables.key_path`, `data_lang` = `<type>-<name>` |
| `label` | `editable_props.properties.label` và `variables.display_label` (`text`: để `""`) |
| `placeholder`, `helpText`, `hidden`, `disabled`, `readonly`, `attributes`, `content` | `editable_props.properties.*` |
| `required` / `requiredMessage` | `properties.required: true` **và** `validation_schema[{type:"required", value:"yes", errorMessage}]` |
| `validations` | `validation_schema[]` |
| `colSpan`, `colStart`, `alignSelf`, `styles` | `editable_props.styles.*` (giá trị là chuỗi) |
| `overrides` (`{ sm: { colSpan: 12 } }`) | `editable_props.overrides.sm.properties.style.colSpan` |
| `default` | `default_values` |
| `dataType` | `variables.data_type` |
| `options` | `variables.data_source` tĩnh (§6) |
| `dataSource.api` | `variables.data_source` API (§6) |
| `events` (`{ event, flow }`) | `properties.eventHandlers[]` (§8) |
| `rules` (`when` / `then`) | `properties.eventHandlers[]` với `event: "condition"` + `branch` (§8) |
| `parent`, `tabId` | vị trí trong `children_schema` của cha + `parent_tab_id` (§4) |
| `tabs`, `steps`, `stepsOptions`, `columns`, `grid`, `list`, `loop`, `dialog`, `custom`, `embed`, `props` | `editable_props.properties.<khoá>` (`dialog` của `drawer` → `properties.drawer`, của `bottom-sheet` → `properties.bottomSheet`) |
| `container` `{ type, border, borderType }` | `styles.containerType`, `styles.showBorder` (`"yes"`/`"no"`), `styles.borderType` |
| `reason` | không ghi vào JSON — chỉ nêu trong báo cáo |

## 11. Đọc / sửa JSON có sẵn (do builder xuất)

- **Phẳng ↔ lồng**: builder giữ store phẳng (`parentId`), JSON lồng qua `children_schema`; loader lấy cây `children_schema` làm nguồn đúng cho `parent_id`.
- **Ngăn của cha** (tab/steps/columns): con mang `parent_tab_id`; không có thì rơi vào ngăn `default`.
- **Giá trị tĩnh vs API**: `default_values` là `null` khi giá trị đến từ data source; `variables.data_source.connection_type === "hard"` giữ giá trị/option cứng.
- **Bản đầy đủ do builder xuất** có thêm vỏ ngoài (`kind`, `variable_name`, `status`, `page`…), `parent_id`, `locked_props`, `logic_rules`, `behavior` — giữ nguyên khi sửa, đừng xoá.
- **`logic_rules` kiểu cũ** (`type: "onChange"` + `rules`) chỉ còn để tương thích; dựng mới dùng handler `event: "condition"`. Action phẳng kiểu cũ vẫn chạy nhưng builder hiển thị và lưu lại dạng flow.
- **Không đổi `id`** của control đã tồn tại (tham chiếu theo id, `key_path`, `children_schema` phụ thuộc vào nó).
- **Dialog/drawer/bottom-sheet**: mở bằng step `dialog` (`open|close|toggle`) trỏ `variables.name` của overlay.

## 12. Lib tự điền — không cần viết

Giá trị mặc định của mọi thuộc tính (loader trộn lại), `parent_id`, `locked_props`, `logic_rules`, `behavior`, vỏ ngoài (`status`, `page`, `kind`…), `variables.data_source: {}` khi không có nguồn.
Khi người dùng mở JSON trong builder và Save, builder xuất lại bản đầy đủ — đó là bản nên lưu lên backend.

## 13. Gói JSON khi lưu qua MCP `save_form_design`

Định dạng ở §1–§2 là của **loader lib** (dán vào builder). Backend (`SaveFormDesignDto` của `dynaform-service`) kiểm tra chặt hơn: mỗi phần tử **gốc** của `form_components` phải có **vỏ ngoài** kèm `data_lang` ở cấp ngoài. Gửi `{ "item_control": {…} }` trần sẽ bị `400`:
`form_components.0.data_lang should not be empty, form_components.0.data_lang must be a string`.

```jsonc
{ "kind": "component",
  "data_lang": "input-username",      // = item_control.data_lang = "<type>-<name>"; BẮT BUỘC, không rỗng
  "sort_order": 2,                    // = item_control.sort_order
  "variable_name": "username",        // = item_control.variables.name
  "item_control": { /* nguyên khối §2 */ } }
```

Quy tắc khi gọi tool:
- Tham số cấp form: `name`, `data_lang` (`"vi"` — của **form**, khác `data_lang` của control), `settings`, `form_components`; thêm `environment: "DEV"` nếu cần nêu rõ. **Không** truyền `id` khi tạo mới (có `id` = cập nhật, phải kèm `expected_revision`). Không truyền `CORE` (đã bỏ).
- Chỉ truyền `settings` + `form_components` (+ `name`, `description`); không gửi nguyên tài liệu §1 có `id` ở gốc. Server tự cấp `id` form, `application_code`, `code`, `status: "draft"` — `settings.setting.id` giữ nguyên giá trị đã gửi, **không** tự đồng bộ theo id server cấp.
- Server tự thêm vào bản lưu: `source`, `path_relationship`, `logic_rules: []`, `children_schema: []`, `validation_rules: null`. Không cần viết.
- Đã kiểm thực tế (2026-11-09, DEV) với 5 control phẳng: `text`, `input`, `password`, `checkbox`, `submit-button` — lưu được, `get_form_design` trả đủ `validation_schema`/`editable_props`.
- **Cây lồng**: con của `container` nằm trong `item_control.children_schema` của cha, và **mỗi con cũng phải có vỏ ngoài** `{ kind, data_lang, sort_order, variable_name, item_control }` (`sort_order` đếm lại từ 1 trong từng cha). Đã kiểm (2026-11-09, DEV): container + 2 con `input`/`password` lưu được; server tự điền `parent_id`, `source: "children_schema"`, `path_relationship: "<id cha>/<id con>"`.
- **`eventHandlers`** đặt trong `item_control.editable_props.properties` như §8 — đã kiểm với nút `click` chạy flow `validate_form` → `show_message`, đọc lại còn nguyên cấu trúc.
- **Dữ liệu đọc lại khác dữ liệu gửi lên**: `get_form_design` trả container ở gốc dạng **flat** (không còn `item_control` bọc), còn control lá và con trong `children_schema` trả dạng wrapper. Muốn sửa form có sẵn thì giữ nguyên `id` của từng control và khi gửi lại vẫn bọc vỏ ngoài như trên.
- **Chưa kiểm**: `tab`/`steps`/`columns` (`parent_tab_id`), `grid`, `dialog`, `select` có `data_source`, `custom-embed`. Gặp `400`, đọc `err_mess` (nêu rõ `form_components.<chỉ số>.<trường>`) và đối chiếu `SaveFormDesignDto` trong `dynaform-service` thay vì đoán.
- Đường khác server chấp nhận: "V2 flat" — phần tử gốc chính là item_control (có `slug`/`renderer_key` ở cấp trên, không có `item_control` bọc). Chưa kiểm; dùng vỏ ngoài ở trên.
