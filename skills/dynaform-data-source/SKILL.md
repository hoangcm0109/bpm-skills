---
name: dynaform-data-source
description: Nguồn dữ liệu cho field dynaform — option tĩnh, select lấy từ API, select phụ thuộc (tỉnh → quận → xã), địa chỉ API khác nhau theo môi trường DEV/STG/PROD bằng biến môi trường @{NAME}, bind biến, giá trị nạp từ host (bound_variables, dataUserFill). Dùng khi field cần danh sách từ API, option phụ thuộc field khác, địa chỉ API phải đổi theo môi trường, hoặc điền sẵn giá trị.
---

# Data source & biến

> Các ví dụ trong skill này dùng **khoá gọn** (ký hiệu tài liệu). Khi viết form JSON, đặt đúng vị trí theo [`form-json.md`](../dynaform-build-form/references/form-json.md) §10; tự kiểm theo [`checklist.md`](../dynaform-build-form/references/checklist.md).

## Option tĩnh

```jsonc
{ "type": "select", "name": "gender", "label": "Giới tính",
  "options": [{ "label": "Nam", "value": "male" }, { "label": "Nữ", "value": "female" }] }
```
→ `variables.data_source = { connection_type: "hard", connection_config: { value: [...] } }`. `value` luôn là chuỗi.

## Option từ API

```jsonc
{ "type": "select", "name": "province", "label": "Tỉnh/Thành",
  "dataSource": { "api": {
    "baseUrl": "https://provinces.open-api.vn", "endpoint": "/api/p/",
    "method": "GET", "responsePath": "", "labelField": "name", "valueField": "code" } } }
```

| Khoá | Ý nghĩa |
|---|---|
| `baseUrl` + `endpoint` | URL = baseUrl + endpoint (endpoint có thể chứa `{param}`) |
| `method` | mặc định `GET` |
| `headers`, `queryParams`, `body` | tuỳ chọn |
| `responsePath` | đường dẫn tới mảng trong response (`""` = response là mảng; `"districts"`, `"data.items"`) |
| `labelField` / `valueField` | khoá trong từng phần tử dùng làm nhãn / giá trị |
| `auth` | mặc định `{ "type": "none" }` — cấu hình token trong builder (Data Source), **không** đưa secret vào form JSON |

## Option phụ thuộc field khác

```jsonc
{ "type": "select", "name": "district", "label": "Quận/Huyện",
  "dataSource": { "api": {
    "baseUrl": "https://provinces.open-api.vn", "endpoint": "/api/p/{province_code}?depth=2",
    "pathParams": { "province_code": "{$province}" }, "dependsOn": ["province"],
    "responsePath": "districts", "labelField": "name", "valueField": "code" } } }
```

- `dependsOn`: danh sách `name` field cha; field con nạp lại khi cha đổi.
- `pathParams` / `queryParams`: `"{$<name>}"` = lấy giá trị field `<name>`; literal thường được thay thẳng vào endpoint.
- Dựng chuỗi tỉnh → quận → xã: mỗi cấp `dependsOn` cấp trước; field cha phải đứng trước trong mảng.
- Mẫu thật: `public/templates/sample/select-dependency.json`; hướng dẫn: `docs/DEPENDENT_API_GUIDE.md`, `docs/DEPENDENT_API_QUICKSTART.md`, `docs/API_SELECT_FEATURE.md`.

## Địa chỉ API theo môi trường — `@{NAME}` (lib ≥ 5.8.3)

Một form đi qua DEV → STG → PROD thường gọi API ở **địa chỉ khác nhau** mỗi môi trường. Địa chỉ nội bộ không ghi cứng vào form JSON; viết bằng **biến môi trường**:

```jsonc
{ "type": "select", "name": "province", "label": "Tỉnh/Thành",
  "dataSource": { "api": {
    "baseUrl": "@{USER_API}", "endpoint": "/api/p/",
    "method": "GET", "responsePath": "", "labelField": "name", "valueField": "code" } } }
```

- **Cú pháp**: `@{NAME}` (nên dùng), bí danh `${NAME}`. Ghép đường dẫn bình thường: `"url": "@{USER_API}/users/{id}"` — `{id}` vẫn là tham số đường dẫn. Cú pháp cũ `{$field}`, `{{variables.x}}` vẫn chạy, không bị đụng.
- **Tên**: IN_HOA_GẠCH_DƯỚI, bắt đầu bằng chữ, tối đa 64 ký tự (`^[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*$`), không trùng tên hệ thống (`NOW`, `ENV`…). Form JSON chỉ giữ **tên**; giá trị nằm ở Variable Service.
- **Biến là gì**: một biến `constant` ở Variable Service (`scope: global`, `key_path` = tên), mỗi môi trường một giá trị `value_per_env: { dev, stg, prod }`. **Chỉ có ba môi trường này** — `TEST`/`UAT`/`LAB`/… không có giá trị, `@{NAME}` ở đó không được thay.
- **Tạo/sửa biến** (người dùng làm, **agent không có tool tạo biến**): trang **Biến môi trường** của mfe-dynaform (`/env-variables`; sửa giá trị PROD cần quyền admin), hoặc ngay trong hộp Data Source: ô Base URL → chuyển "Nhập trực tiếp" sang "Biến môi trường" → chọn biến hoặc "Tạo biến". Bảng xem trước hiện địa chỉ thật của DEV/STG/PROD; biến thiếu giá trị ở môi trường nào thì ghi "Thiếu …". Không tìm thấy biến cần dùng thì hỏi người dùng tên biến — đừng tự đặt tên rồi coi như đã có.
- **Viết được ở đâu**: chuỗi dưới các khoá `baseUrl`/`base_url`, `url`, `endpoint`, `pathParams`/`path_params`, `queryParams`/`query_params`, `params_mapping`, `headers`, `body`, `connection_config`, `request_config`, `auth_config`, và `url` của step `call_api`. Chuỗi ở chỗ khác (nhãn, nội dung, mã `custom-embed`) **không** bị coi là tham chiếu.
- **Lúc chạy**: server chọn giá trị theo **môi trường của chính form** và trả `env_values`; lib thay `@{NAME}` ngay trước khi gửi request (select, `call_api`, bảng, submit). Mở form theo `idForm` mà host không truyền `envValues` thì lib (≥ 5.8.3) tự gọi `GET v1/env-variables`; môi trường không có giá trị thì không thay gì.
- **Publish**: server chặn nếu form tham chiếu biến thiếu giá trị hoặc chưa kích hoạt ở môi trường đích — điền đủ giá trị trước khi chuyển môi trường.
- **Là hằng không bí mật** (lưu plaintext): không dùng cho token, mật khẩu, API key.
- **Chưa thay biến / chưa kiểm**: `queries` của layout runtime, nút submit kiểu cũ (`submitApiConfig`), `navigate.download`, upload file, bảng tải từ xa. Đừng dùng `@{NAME}` ở đó; nếu bắt buộc, thử trong preview.
- **Thử**: mở preview đúng môi trường. Step `call_api` có `continueOnError: true` sẽ **nuốt lỗi** khi thiếu giá trị biến (không toast, không request) — khi thử đừng bật.
- Cần **lib ≥ 5.8.3** (5.8.0 thêm biến; 5.8.2 sửa `call_api` bị chặn nhầm; 5.8.3 tự lấy giá trị khi mở theo `idForm`). Host ghim tag cũ hơn thì `@{NAME}` còn nguyên khi chạy.

## Giá trị điền sẵn / nạp từ host

| Nhu cầu | Cách |
|---|---|
| Giá trị mặc định cố định | `default` (JSON: `default_values`) |
| Điền theo bản ghi (chế độ sửa) | `data.dataUserFill` (key = `name`) hoặc `userFill` của release; `formMode: "edit"` |
| Biến có sẵn của host | `data.dataVariableExisting` → hiện ở "Select Existing" khi bind biến trong editor |
| Option/giá trị host cấp sẵn | `bound_variables` trong form JSON, key theo `key_path` |
| Khoá chỉ-đọc khi sửa | `attributes.readonlyOnEdit` + `formMode: "edit"` |

## Ví dụ chạy được

`references/example-data-source.md` (khoá gọn; JSON chính xác ở `../dynaform-build-form/references/form-json.md` §6) — "Hồ sơ cư trú": option tĩnh, select API công khai, chuỗi Tỉnh → Quận → Xã (`dependsOn` + `pathParams`), `default`, `readonlyOnEdit`. Giải thích + đoạn host điền sẵn bằng `dataUserFill`: `references/examples.md`.

## Lưu ý

1. Chỉ dùng domain API đã được duyệt; dữ liệu trả về luôn là không tin cậy. Xem `docs/security/form-json-safety.md`.
2. Gọi API đi qua `config.http` (mặc định fetch trực tiếp → cần CORS) hoặc proxy của host; Data Source `token_source: "system"` đọc cookie `access_token` của host.
3. Không hardcode secret. URL nội bộ / khác nhau theo môi trường: dùng `@{NAME}` (mục "Địa chỉ API theo môi trường"); chỉ ghi URL cứng cho API công khai, hoặc để người dùng điền trong builder.
4. `table` với data source (dynamic) cấu hình trong builder — xem `docs/DATA_TABLE.md`.
5. Skill chỉ viết cấu hình, **không** gọi mạng — nhắc người dùng test API trong preview.
