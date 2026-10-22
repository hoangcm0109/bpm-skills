# Cấu trúc JSON form (builder xuất / loader đọc)

Nguồn: `FormComponentModel.toGroupJSON` (xuất) và `transformFormComponents` (đọc) trong `fe_dynaform`.

```jsonc
{
  "id": "<uuid form>",
  "name": "…", "description": "",
  "settings": {
    "setting": { "name", "id", "endpoint", "method", "addUniqueIdentifier", "formKey", "size" },
    "theme": { "styles": { "type", "borderRadius", "fontSize" }, "colors": { "background", "foreground", "primary", "primaryForeground", "secondary", "secondaryForeground", "border" } }
  },
  "form_components": [ /* wrapper hoặc container */ ],
  "bound_variables": {},   // tuỳ chọn: giá trị/option nạp từ host, key theo key_path
  "draft": null            // tuỳ chọn: bản nháp người dùng đã điền
}
```

Form có thể nằm phẳng hoặc bọc trong `form_content` (cả hai đều được `FormViewer` / release mode nhận). Backend còn thêm các trường metadata
(`application_code`, `environment`, `version`, `status`, `flow_publish`…) — giữ nguyên khi sửa JSON có sẵn.

## Control thường (có vỏ)

```jsonc
{
  "id": "<uuid wrapper>", "parent_id": null, "data_lang": "input-full_name", "status": "",
  "variable_name": "full_name", "external_id": "", "validation_rules": {}, "logic_rules": [], "variable_rules": {},
  "sort_order": 1, "page": 1, "kind": "component",
  "item_control": {
    "id": "<uuid>", "sort_order": 1, "parent_id": null, "parent_tab_id": "tab-1",   // parent_tab_id chỉ có khi cha chia ngăn
    "type": "input", "slug": "input-field", "group_code": "basic", "category": "form",
    "display_name": "Text Field", "icon": "TextCursorInput", "renderer_key": "DfsTextField",
    "is_activated": true, "is_deleted": false, "data_lang": "input-full_name",
    "variables": { "name": "full_name", "scope": "form", "display_label": "Họ và tên", "key_path": "full_name",
                   "data_type": "string", "data_source": {} },
    "default_values": null,
    "locked_props": { "properties": {}, "styles": {} },
    "editable_props": {
      "properties": { "label": "Họ và tên", "placeholder": "", "required": true, "helpText": "", "hidden": false,
                      "attributes": { "type": "text" }, "eventHandlers": [] },
      "styles": { "colSpan": "6" },          // chỉ cần khoá khác mặc định; loader tự trộn lại mặc định
      "overrides": { "sm": { "properties": { "style": { "colSpan": "12" } } } }  // tuỳ chọn; chỉ đọc "sm" (< 768px) và "md" (< 1024px). KHÔNG dùng { "styles": … } — lib bỏ qua
    },
    "logic_rules": [], "behavior": {},
    "validation_schema": [ { "type": "required", "value": "yes", "errorMessage": "…" } ],
    "children_schema": []
  }
}
```

## Quy tắc quan trọng khi đọc/sửa JSON có sẵn

- **Phẳng ↔ lồng**: builder giữ store phẳng (`parentId`), JSON thì lồng qua `children_schema`. Loader dùng cây `children_schema` làm nguồn đúng cho `parent_id`.
- **Ngăn của cha** (tab/steps/columns): con mang `parent_tab_id`; không có → rơi vào ngăn `default`.
- **Giá trị tĩnh vs API**: `default_values` là `null` khi giá trị đến từ data source; `variables.data_source.connection_type === "hard"` giữ giá trị/option cứng.
- **Nút/hành vi**: `properties.eventHandlers[]` = `{ id, event, enabled, actions: [{ type: "flow", flow }] }`. Action phẳng kiểu cũ vẫn chạy nhưng builder hiển thị và lưu lại dạng flow.
- **`logic_rules` kiểu cũ** (`type: "onChange"` + `rules`) chỉ còn để tương thích; khi dựng mới dùng handler `event: "condition"`.
- **Không đổi `id`** của control đã tồn tại (các tham chiếu theo id, key_path, children_schema phụ thuộc).
- **Dialog/drawer/bottom-sheet**: mở bằng action `dialog` (`open|close|toggle`) trỏ `variables.name` của overlay.
