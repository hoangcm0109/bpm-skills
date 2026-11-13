# Checklist tự kiểm trước khi giao JSON

Không có công cụ kiểm tự động — đi hết danh sách này **trên chính JSON bạn đã viết** rồi mới báo xong. Mỗi mục lỗi nên sửa ngay, không giao form còn lỗi.

## A. Cấu trúc và định danh

- [ ] Có `settings.setting.id` **bằng** `id` form; `form_components` là mảng.
- [ ] Mọi control là `{ "item_control": { … } }` và có đủ: `id`, `type`, `slug`, `group_code`, `category`, `display_name`, `icon`, `renderer_key`, `data_lang`, `sort_order`, `variables.name`, `editable_props`.
- [ ] `type` có trong bảng registry (`form-json.md` §3); 5 trường định danh khớp đúng dòng của type đó; `slug` = `<type>-field`; `data_lang` = `<type>-<name>`.
- [ ] `id` là UUID v4, **không trùng** giữa các control (đếm lại nếu sao chép khối).
- [ ] `variables.name` snake_case (`^[a-z][a-z0-9_]*$`), **không trùng** trong cả form (kể cả giữa gốc và bên trong dialog).
- [ ] `sort_order` đếm từ 1 trong từng cha, khớp thứ tự trong mảng.
- [ ] Không có `type` bịa (`phone`, `phone-input`…); số điện thoại là `tel`.

## B. Cha – con

- [ ] Con chỉ nằm trong `children_schema` của container thật (`container`, `tab`, `steps`, `columns`, `grid`, `list`, `nested-list`, `form-loop`, `dialog`, `drawer`, `bottom-sheet`).
- [ ] Cha `tab` / `steps`: mỗi con có `parent_tab_id` ∈ `id` của `properties.tabs` / `properties.steps`; `tab`/`steps` có mảng `tabs`/`steps` khai báo.
- [ ] Cha `columns`: `parent_tab_id` dạng `col-0`… nhỏ hơn `columns.count`; `columns.spans` có tổng đúng **12**; `renderer_key` = `DfsColumns<count>`.
- [ ] Cha `grid`: con **không** có `parent_tab_id`; số con ≤ số ô (`rows × cols`, trừ ô gộp); mỗi ô đúng một control; `cols` 1–6; `columnWidths` đủ `cols` phần tử.
- [ ] `dialog` / `drawer` / `bottom-sheet` đứng **trước** nút mở nó; có `dialog.variant`; chỉ variant `form`/`custom` có con.

## C. Giá trị và lựa chọn

- [ ] `select` / `radio-group` / `checkbox-group` / `tree-select` có `variables.data_source`: tĩnh với **≥ 2** mục (`label` và `value` đều là chuỗi) hoặc `connection_type: "api"`.
- [ ] Select phụ thuộc: `depends_on` trỏ tới `name` có thật; cấp cha đứng trước cấp con.
- [ ] Không có token/mật khẩu/`Authorization` trong `data_source`, `call_api`, `authConfig`; URL chỉ `https://` hoặc đường dẫn nội bộ.
- [ ] Địa chỉ API nội bộ / khác nhau theo môi trường viết bằng `@{NAME}` (biến đã có, tên IN_HOA_GẠCH_DƯỚI), không ghi cứng `http://…` của một môi trường; chỉ để địa chỉ cứng cho API công khai. Tên biến lấy từ người dùng — không tự đặt rồi coi như đã tồn tại; nhắc người dùng điền đủ giá trị DEV/STG/PROD (`dynaform-data-source` › Địa chỉ API theo môi trường).

## D. Validation

- [ ] `validation_schema[].type` thuộc: `required readOnly min max minLength maxLength contains notContains greater lower equals notEquals greaterEqual lowerEqual email url regex matchField`.
- [ ] Control `required: true` có **cả** `properties.required` và một phần tử `required` trong `validation_schema` (không trùng hai lần).
- [ ] `matchField.value` là `name` của field **đang tồn tại**.
- [ ] Thông báo lỗi tiếng Việt, ngắn, nói cách sửa.

## E. Bố cục

- [ ] `colSpan` / `colStart` là chuỗi `"1"`–`"12"` (`colStart` cũng được `"auto"`); `colStart + colSpan − 1 ≤ 12`.
- [ ] Mỗi hàng cộng `colSpan` đúng 12 (hàng thiếu thì chỉnh `colSpan` hoặc căn phải bằng `colStart`); nút căn phải: `colSpan` 2–4 + `colStart`.
- [ ] Control `colSpan` < 12 có `overrides.sm.properties.style.colSpan = "12"` (trừ khi chủ ý giữ nguyên trên mobile); không dùng `overrides.sm.styles`, không có khoá `lg`.
- [ ] `alignSelf` ∈ `start center end stretch`; nút cạnh ô nhập có nhãn dùng `end`.

## F. Sự kiện và flow

- [ ] `eventHandlers[]` mỗi phần tử `{ id, event, enabled, actions: [{ type: "flow", flow }] }`; `id` handler duy nhất trong control.
- [ ] `event` hợp lệ **và hợp với control** (xem `form-json.md` §8); `embed:<tên>` có tên trong `embed.events`.
- [ ] Mọi `name` được tham chiếu (`targets`, `target`, `to`, `$form.current.values.<name>`, `tableId` → **id**) đều tồn tại.
- [ ] Mọi `id` step khác nhau trong một handler; `$steps.<id>` trỏ tới step có thật và **đứng trước**; `branch.then` / `else` là **một** step.
- [ ] Nút có flow `click` tự lo validate/gửi (nút đó bỏ qua đường submit mặc định): có `validate_form` đầu flow nếu cần chặn dữ liệu sai.
- [ ] Không có `customScript` / `run_script` (trừ khi bắt buộc và đã hiện mã cho người dùng); không `switchTab` / `collapse`; `open_form` / `close_form` / `refetch` / `submit_form` chỉ dùng trong layout runtime.
- [ ] `dialog` step có `awaitSubmit` ⇒ dialog có nút xác nhận/gửi trong footer.
- [ ] Không dùng control `hidden` làm cờ/tín hiệu giữa event — dùng `set_values` / `$steps.<id>.output` / `$event.payload`. Còn `hidden` thì ghi lý do trong báo cáo.

## G. `custom-embed` (nếu có)

- [ ] Đã thử mọi control có sẵn (bảng "nhu cầu → control" ở `dynaform-components`) và ghi lý do trong báo cáo.
- [ ] `mode: "sandbox"`, `framework: "react"`, `tailwind: true`; `js` và `source` cùng mã; `inputs[].from.field` và `outputs[].to` trỏ `name` có thật; tên input/output/event khớp `^[A-Za-z][\w-]*$`.
- [ ] Mã dùng `DfbReact.html` + class Tailwind đủ tên, không `import` / `export`, không JSX thô, không class ghép `p-${n}`.
- [ ] Đã nói với người dùng: cần mở builder → *Sửa TSX / HTML (Tailwind)* → Lưu để sinh `tailwindCss`.

## H. Trước khi giao

- [ ] JSON **hợp lệ về cú pháp** (không dư dấu phẩy, không comment `//`, ngoặc cân).
- [ ] Có nút gửi (`submit-button` hoặc `button` có flow) nếu form cần gửi; không có hai `submit-button`.
- [ ] Nếu sẽ lưu qua MCP `save_form_design`: mỗi phần tử gốc của `form_components` có vỏ ngoài `kind: "component"`, `data_lang` (không rỗng, = `<type>-<name>`), `sort_order`, `variable_name` (`form-json.md` §13); không truyền `id` khi tạo mới.
- [ ] Báo cáo (SKILL.md bước 7) nêu rõ: các field, logic/flow, phần chưa làm được, mọi `custom-embed` / `hidden` / script / URL có trong form, field thu thập dữ liệu cá nhân.
