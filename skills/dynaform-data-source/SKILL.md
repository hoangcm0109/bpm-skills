---
name: dynaform-data-source
description: Nguồn dữ liệu cho field dynaform — option tĩnh, select lấy từ API, select phụ thuộc (tỉnh → quận → xã), bind biến, giá trị nạp từ host (bound_variables, dataUserFill). Dùng khi field cần danh sách từ API, option phụ thuộc field khác, hoặc điền sẵn giá trị.
---

# Data source & biến

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
| `auth` | mặc định `{ "type": "none" }` — cấu hình token trong builder (Data Source), **không** đưa secret vào spec |

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

## Giá trị điền sẵn / nạp từ host

| Nhu cầu | Cách |
|---|---|
| Giá trị mặc định cố định | `default` trong spec |
| Điền theo bản ghi (chế độ sửa) | `data.dataUserFill` (key = `name`) hoặc `userFill` của release; `formMode: "edit"` |
| Biến có sẵn của host | `data.dataVariableExisting` → hiện ở "Select Existing" khi bind biến trong editor |
| Option/giá trị host cấp sẵn | `bound_variables` trong form JSON, key theo `key_path` |
| Khoá chỉ-đọc khi sửa | `attributes.readonlyOnEdit` + `formMode: "edit"` |

## Ví dụ chạy được

`assets/example-data-source.spec.json` — "Hồ sơ cư trú": option tĩnh, select API công khai, chuỗi Tỉnh → Quận → Xã (`dependsOn` + `pathParams`), `default`, `readonlyOnEdit`. Giải thích + đoạn host điền sẵn bằng `dataUserFill`: `references/examples.md`.

## Lưu ý

1. Chỉ dùng domain API đã được duyệt; dữ liệu trả về luôn là không tin cậy. Xem `docs/security/form-json-safety.md`.
2. Gọi API đi qua `config.http` (mặc định fetch trực tiếp → cần CORS) hoặc proxy của host; Data Source `token_source: "system"` đọc cookie `access_token` của host.
3. Không hardcode URL nội bộ/secret; chỉ ghi URL công khai hoặc để người dùng điền trong builder.
4. `table` với data source (dynamic) cấu hình trong builder — xem `docs/DATA_TABLE.md`.
5. Kết quả `validate` chỉ kiểm cấu trúc, **không** gọi mạng — nhắc người dùng test API trong preview.
