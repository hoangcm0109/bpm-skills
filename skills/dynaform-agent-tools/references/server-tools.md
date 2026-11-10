# 9 server tool của dynaform-service (MCP)

> Nguồn: schema của connector `dynaform-service` đang kết nối. Danh sách thật của một server: gọi `tools/list` — nếu khác bảng này thì tin `tools/list`.
> Đồng bộ lần cuối 2026-11-09. Source MCP cũ `src/modules/mcp` đã xoá khỏi `dynaform-service` (commit `927f207`); không còn file mô tả MCP trong repo đó.

Domain công khai: `https://test-forms.dnu.edu.vn` — đọc: `/query/v1`, ghi: `/command/v1`.

## Chế độ gọn `view=agent` (tiết kiệm token)

Response mặc định của các tool đọc rất dài (đo thật 2026-11-10: `list_item_controls` **102.010 ký tự**, `get_form_design` form 12 control khoảng **19K**, `list_form_designs` 20 form khoảng 35–45K). Backend `dynaform-service` (commit `0eb3ada`) thêm tham số **`view`** cho 5 endpoint đọc: `full` (mặc định, không đổi — UI dùng) hoặc `agent` (bản gọn). Giá trị khác ⇒ `400`.

| Tool | `view=agent` trả về | Cắt bỏ so với `full` |
|---|---|---|
| `list_item_controls` | nhóm `{code, display_name, data[]}`; mỗi control chỉ `type`, `display_name`, `category`, `sub_group_code` | `editable_props`, `locked_props`, `icon` (SVG), `default_values`, `logic_rules`, `validation_schema`, audit; nhóm rỗng. Đo thật: 102.010 → **4.432** ký tự |
| `list_form_designs` | `id`, `root_form_id`, `name`, `code`, `description`, `application_code`, `project_id`, `project_name`, `current_status`, `current_environment`, `current_version`, `version_counts`, `flow_publish`, `updated_date` | `settings`, `language`, `variable_schema`, `object_source_spec`, `layout_runtime`, `path_relationship`, audit, `information`, cột trùng (`status`, `environment`…) |
| `get_form_design` | **outline**: metadata (`id`, `name`, `status`, `environment`, `version`, `draft_revision`, `base_version`, `flow_publish`…) + `component_count` + cây `form_components` gồm `id`, `type`, `ref`, `label`, `required`, `col_span` (khi ≠ 12), `validations[]` (chỉ tên rule), `has_data_source`, `events` (số handler), `children[]`; `object_source_configs`/`hook_configs`/`integrations` chỉ là số đếm khi > 0 | `editable_props`, `variables`, rule/flow chi tiết, `settings`, `environments`… — **không round-trip được qua `save_form_design`** |
| `list_form_versions` | `version`, `status`, `is_current`, `id`, `form_id`, `activated_at`; thêm `limit` (mặc định **10** bản mới nhất mỗi môi trường, tối đa 100) | `design_id` (= `id`), `archived_at` null |
| `list_form_submissions` | `id`, `instance_id`, `form_id`, `callback_status`, `submitted_by_user_id`, `submitted_at`; `include_data=true` mới kèm `submission_data` | IP, `device_fingerprint`, `callback_response`, `ai_enrichment`, `validation_result`, `tenant_code` |

Quy tắc dùng:

- **Tra cứu / chọn form / xem cấu trúc** ⇒ `view=agent`. **Sửa form có sẵn qua `save_form_design`** (hoặc cần props, validation, flow chi tiết) ⇒ `get_form_design` với `view=full` (hoặc bỏ `view`), vì chỉ bản đầy đủ mới gửi lại được.
- Form đang mở trong editor thì **không** gọi `get_form_design`: dùng client tool `get_form_state` / `get_component` (đọc cả phần chưa lưu, nhỏ hơn nhiều).
- Cần chi tiết **một** control: dùng `get_component` ở editor, không kéo `view=full` của cả form.
- `list_item_controls` ít khi cần: client tool `list_component_types` đã trả danh sách type (của lib, khớp với editor đang chạy).

> **Trạng thái kết nối (cập nhật 2026-11-10):** tham số `view` (và `limit`, `include_data`) có ở REST sau khi `dynaform-service` commit `0eb3ada` được deploy. Qua **MCP** chỉ gọi được khi connector `dynaform-service` khai báo thêm các tham số này trong schema tool — schema hiện tại **chưa** có (xem bảng tham số bên dưới). Kiểm bằng `tools/list`; nếu tool chưa có `view` thì tool vẫn trả bản `full` như cũ. Connector cũng đang in JSON thụt lề 2 khoảng trắng (`JSON.stringify(rows, null, 2)`), làm tăng thêm ~35–40% ký tự.


## Nhóm đọc (query, GET)

### `list_form_designs` — Danh sách form design

- **REST**: `GET https://test-forms.dnu.edu.vn/query/v1/form-designs`
- **Annotations**: readOnly=true, destructive=false, idempotent=true, openWorld=false
- **Mô tả**: Liệt kê form design có phân trang (mỗi lineage 1 bản hiện hành), kèm current_environment, current_version, version_counts. Không truyền environment ⇒ lấy môi trường cao nhất.

| Tham số | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `page` | integer | không | ≥ 1; default `1` | Trang, bắt đầu từ 1 |
| `limit` | integer | không | ≥ 1; ≤ 100; default `20` | Số bản ghi mỗi trang (1–100) |
| `search` | string | không |  | Từ khoá tìm kiếm |
| `status` | string | không |  | Trạng thái form |
| `environment` | string | không | enum: `DEV`, `STG`, `PROD`, `TEST`, `UAT`, `LAB` | Môi trường: DEV \| STG \| PROD \| TEST \| UAT \| LAB |
| `application_code` | string | không |  |  |
| `project_id` | string | không |  |  |
| `view` | string | không | enum: `full`, `agent`; default `full` | REST đã có; MCP chỉ khi connector khai báo — xem mục "Chế độ gọn" |

### `get_form_design` — Chi tiết form design

- **REST**: `GET https://test-forms.dnu.edu.vn/query/v1/form-designs/{id}`
- **Annotations**: readOnly=true, destructive=false, idempotent=true, openWorld=false
- **Mô tả**: Lấy đầy đủ form design (components, object source configs, hook configs). Không truyền environment ⇒ dò DEV rồi các env khác. Lưu ý: mỗi lần gọi được ghi audit form.view dưới tên chủ token.

| Tham số | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `id` | string | **có** | minLength 1 | id form (id core hoặc id env-local) |
| `environment` | string | không | enum: `DEV`, `STG`, `PROD`, `TEST`, `UAT`, `LAB` | Môi trường: DEV \| STG \| PROD \| TEST \| UAT \| LAB |
| `view` | string | không | enum: `full`, `agent`; default `full` | `agent` = outline (không round-trip được); sửa/lưu form ⇒ `full` |

### `list_form_versions` — Các version đã phát hành

- **REST**: `GET https://test-forms.dnu.edu.vn/query/v1/form-designs/{root_form_id}/versions`
- **Annotations**: readOnly=true, destructive=false, idempotent=true, openWorld=false
- **Mô tả**: Liệt kê các version đã phát hành của 1 form (theo root_form_id) ở các môi trường. Không truyền environment ⇒ quét DEV + tất cả env target.

| Tham số | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `root_form_id` | string | **có** | format uuid | root_form_id (UUID) của lineage form |
| `environment` | string | không | enum: `DEV`, `STG`, `PROD`, `TEST`, `UAT`, `LAB` | Môi trường: DEV \| STG \| PROD \| TEST \| UAT \| LAB |
| `view` | string | không | enum: `full`, `agent`; default `full` | `agent` = bỏ `design_id`/key null, giới hạn số version mỗi môi trường |
| `limit` | integer | không | ≥ 1; ≤ 100; default `10` | **Chỉ khi `view=agent`**: số version mới nhất mỗi môi trường |

### `list_item_controls` — Item control theo nhóm

- **REST**: `GET https://test-forms.dnu.edu.vn/query/v1/item-controls/grouped`
- **Annotations**: readOnly=true, destructive=false, idempotent=true, openWorld=false
- **Mô tả**: Lấy toàn bộ item control (loại control dùng trong form) gom theo nhóm.

| Tham số | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `org_code` | string | không |  | Mã tổ chức |
| `view` | string | không | enum: `full`, `agent`; default `full` | `agent` = chỉ `type`/`display_name`/`category`/`sub_group_code` (giảm ~96%) |

### `list_form_submissions` — Danh sách bài nộp form

- **REST**: `GET https://test-forms.dnu.edu.vn/query/v1/form-submissions`
- **Annotations**: readOnly=true, destructive=false, idempotent=true, openWorld=false
- **Mô tả**: Liệt kê form submission có phân trang, lọc theo form_id hoặc instance_id.

| Tham số | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `form_id` | string | không |  |  |
| `instance_id` | string | không |  |  |
| `page` | integer | không | ≥ 1; default `1` | Trang, bắt đầu từ 1 |
| `limit` | integer | không | ≥ 1; ≤ 100; default `20` | Số bản ghi mỗi trang (1–100) |
| `view` | string | không | enum: `full`, `agent`; default `full` | `agent` = bản tóm tắt, bỏ IP/fingerprint/callback/validation |
| `include_data` | boolean | không | chỉ có tác dụng khi `view=agent` | `true` ⇒ kèm `submission_data` |


## Nhóm ghi (command, POST)

### `save_form_design` — Lưu (tạo/cập nhật) form design

- **REST**: `POST https://test-forms.dnu.edu.vn/command/v1/form-designs/save`
- **Annotations**: readOnly=false, destructive=true, idempotent=false, openWorld=false
- **Bật bằng**: không cần cờ. Connector `dynaform-service` hiện tại đã đăng ký sẵn tool ghi (cờ `MCP_ENABLE_WRITE` thuộc bản MCP cũ đã xoá)
- **Mô tả**: Upsert form design ở DEV. Không truyền id ⇒ TẠO MỚI (trạng thái nháp). Có id ⇒ CẬP NHẬT, khi lưu bản nháp phải kèm expected_revision (lấy từ get_form_design) để tránh ghi đè. form_components là cây component/item control theo schema của dynaform-builder; server validate lại toàn bộ và trả lỗi 400 kèm chi tiết. Có ghi audit form.save.

| Tham số | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `id` | string | không | format uuid | Bỏ trống ⇒ tạo mới |
| `name` | string | **có** | minLength 1 | Tên form |
| `data_lang` | string | **có** | minLength 1 | Ngôn ngữ dữ liệu, vd "vi" |
| `application_code` | string | không |  | Mã ứng dụng (cần cho đăng ký version) |
| `project_id` | string | không | format uuid |  |
| `scope` | string | không |  | global \| tenant \| workspace \| project \| process \| local |
| `code` | string | không |  |  |
| `description` | string | không |  |  |
| `layout` | string | không |  |  |
| `status` | string | không |  | Chỉ có hiệu lực khi cập nhật (server kiểm tra chuyển trạng thái) |
| `environment` | string | không | enum: `DEV`, `STG`, `PROD`, `TEST`, `UAT`, `LAB` |  |
| `expected_revision` | integer | không | ≥ 0 | Bắt buộc khi lưu đè bản nháp |
| `apply_date` | string \| null | không |  | ISO time tự kích hoạt bản DRAFT |
| `bpm_process_id` | string | không |  |  |
| `bpm_process_code` | string | không |  |  |
| `host_app_id` | string | không |  |  |
| `form_content` | object | không |  |  |
| `settings` | object | không |  |  |
| `language` | any | không |  |  |
| `variable_schema` | object | không |  |  |
| `object_source_spec` | object | không |  |  |
| `layout_runtime` | object | không |  |  |
| `form_components` | array<object> | không |  | Cây component / item control / sub-form. Mỗi phần tử gốc cần vỏ ngoài `{ kind, data_lang, sort_order, variable_name, item_control }` — thiếu `data_lang` ⇒ 400 (xem `dynaform-build-form/references/form-json.md` §13) |
| `object_source_configs` | array<object> | không |  |  |
| `hook_configs` | array<object> | không |  |  |
| `integrations` | array<object> | không |  |  |

### `clone_form_design` — Nhân bản form design

- **REST**: `POST https://test-forms.dnu.edu.vn/command/v1/form-designs/{id}/clone`
- **Annotations**: readOnly=false, destructive=false, idempotent=false, openWorld=false
- **Bật bằng**: không cần cờ. Connector `dynaform-service` hiện tại đã đăng ký sẵn tool ghi (cờ `MCP_ENABLE_WRITE` thuộc bản MCP cũ đã xoá)
- **Mô tả**: Clone form thành FORM MỚI ĐỘC LẬP (lineage mới, dạng DRAFT ở DEV) từ version ở môi trường cao nhất form nguồn đã đạt. Không sửa form nguồn. Có ghi audit form.clone.

| Tham số | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `id` | string | **có** | minLength 1 | id form nguồn |
| `application_code` | string | **có** | minLength 1 | Mã ứng dụng của form mới (bắt buộc) |
| `version` | integer | không | ≥ 1 | Bỏ trống ⇒ version mới nhất |
| `name` | string | không |  | Tên form mới, bỏ trống ⇒ giữ tên nguồn |
| `slug` | string | không | pattern `^[a-z0-9-]+$` | Chỉ [a-z0-9-] |
| `scope` | string | không |  |  |
| `project_id` | string | không | format uuid |  |
| `bpm_process_id` | string | không |  |  |
| `bpm_process_code` | string | không |  |  |
| `host_app_id` | string | không |  |  |

### `create_form_draft` — Tạo bản chỉnh sửa (draft)

- **REST**: `POST https://test-forms.dnu.edu.vn/command/v1/form-designs/{id}/draft`
- **Annotations**: readOnly=false, destructive=false, idempotent=true, openWorld=false
- **Bật bằng**: không cần cờ. Connector `dynaform-service` hiện tại đã đăng ký sẵn tool ghi (cờ `MCP_ENABLE_WRITE` thuộc bản MCP cũ đã xoá)
- **Mô tả**: Tạo bản nháp CHƯA ĐÁNH VERSION ở DEV từ version `id` (DEV/STG/PROD đều được). Mỗi form chỉ có 1 bản nháp: đã có thì trả lại bản đó với existed=true. Sau đó sửa nội dung bằng save_form_design (kèm expected_revision) rồi phát hành bằng publish_form_draft. Có ghi audit form.create_draft.

| Tham số | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `id` | string | **có** | format uuid | id version nguồn (UUID) |

### `publish_form_draft` — Phát hành bản nháp

- **REST**: `POST https://test-forms.dnu.edu.vn/command/v1/form-designs/{id}/publish-draft`
- **Annotations**: readOnly=false, destructive=true, idempotent=false, openWorld=false
- **Bật bằng**: không cần cờ. Connector `dynaform-service` hiện tại đã đăng ký sẵn tool ghi (cờ `MCP_ENABLE_WRITE` thuộc bản MCP cũ đã xoá)
- **Mô tả**: Phát hành bản nháp ở DEV: đánh version (MAX+1) và đưa về ARCHIVED (không tự kích hoạt). DEV đã có version mới hơn base_version ⇒ lỗi 409 VERSION_CONFLICT; chỉ gửi lại force=true KHI người dùng đã xác nhận rõ. Không đẩy lên STG/PROD. Có ghi audit form.publish_draft.

| Tham số | Kiểu | Bắt buộc | Ràng buộc | Mô tả |
|---|---|---|---|---|
| `id` | string | **có** | format uuid | id bản nháp (UUID) |
| `base_version` | integer | không | ≥ 0 | Version mới nhất client thấy lúc mở nháp |
| `force` | boolean | không |  | true ⇒ phát hành dù DEV có version mới hơn |

## Ghi chú phạm vi

- **Không có tool xoá form**: connector không có tool delete, và backend `dynaform-service` không có route DELETE trong `form-design.command.controller.ts`.
- **Chưa có tool cho** `edit`, `status`, `rollback`, `publish` trực tiếp, `by-bpm/...` đang có trong backend `form-design.command.controller.ts`.
- `CORE` là môi trường đã bỏ (gộp vào `DEV`). Source backend hiện tại (`env-datasource.resolver.ts`) từ chối `CORE`; mô tả/enum tool trên connector có thể vẫn ghi `CORE` — không truyền, dùng `DEV` hoặc bỏ trống.
- `save_form_design`: `form_components` đòi vỏ ngoài `{ kind, data_lang, sort_order, variable_name, item_control }` cho mỗi phần tử gốc (đã kiểm 2026-11-09 với form login 5 control phẳng); xem `dynaform-build-form/references/form-json.md` §13.

