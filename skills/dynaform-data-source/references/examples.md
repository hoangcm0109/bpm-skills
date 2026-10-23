# Ví dụ đầy đủ — nguồn dữ liệu & điền sẵn giá trị

Spec chạy được: [`assets/example-data-source.spec.json`](../assets/example-data-source.spec.json) ("Hồ sơ cư trú").

```bash
S=skills/dynaform-build-form/scripts/dynaform.mjs
node $S build skills/dynaform-data-source/assets/example-data-source.spec.json --out /tmp/data-source.json
node $S validate /tmp/data-source.json
```

Script **không gọi mạng** (chỉ kiểm cấu trúc): luôn nhắc người dùng thử API trong preview và đảm bảo API cho phép CORS.

## 1. Option tĩnh

```jsonc
{ "type": "select", "name": "gender", "label": "Giới tính", "colSpan": 6, "default": "male",
  "options": [{ "label": "Nam", "value": "male" }, { "label": "Nữ", "value": "female" }, { "label": "Khác", "value": "other" }] }
```

JSON đầu ra: `variables.data_source = { connection_type: "hard", connection_config: { value: [...] } }`. `value` luôn là **chuỗi**; `default` phải trùng một `value`.

## 2. Option từ API công khai

```jsonc
{ "type": "select", "name": "province", "label": "Tỉnh/Thành", "colSpan": 4, "required": true,
  "dataSource": { "api": { "baseUrl": "https://provinces.open-api.vn", "endpoint": "/api/p/", "method": "GET",
    "responsePath": "", "labelField": "name", "valueField": "code" } } }
```

`responsePath: ""` = response chính là mảng. Mỗi phần tử cần `labelField` (nhãn) và `valueField` (giá trị). Không đưa token vào spec — Data Source có `auth: { "type": "none" }` mặc định; cấu hình xác thực trong builder (Data Source).

## 3. Chuỗi phụ thuộc Tỉnh → Quận → Xã

```jsonc
{ "type": "select", "name": "district", "label": "Quận/Huyện", "colSpan": 4, "required": true,
  "dataSource": { "api": { "baseUrl": "https://provinces.open-api.vn", "endpoint": "/api/p/{province_code}?depth=2",
    "pathParams": { "province_code": "{$province}" }, "dependsOn": ["province"],
    "responsePath": "districts", "labelField": "name", "valueField": "code" } } },
{ "type": "select", "name": "ward", "label": "Phường/Xã", "colSpan": 4,
  "dataSource": { "api": { "baseUrl": "https://provinces.open-api.vn", "endpoint": "/api/d/{district_code}?depth=2",
    "pathParams": { "district_code": "{$district}" }, "dependsOn": ["district"],
    "responsePath": "wards", "labelField": "name", "valueField": "code" } } }
```

| Khoá | Ý nghĩa |
|---|---|
| `endpoint` có `{param}` | placeholder điền bằng `pathParams` |
| `pathParams.province_code: "{$province}"` | `{$<name>}` = giá trị hiện tại của field `<name>` |
| `dependsOn: ["province"]` | field con **nạp lại** khi cha đổi; cha phải đứng **trước** trong mảng |
| `responsePath: "districts"` | đường dẫn tới mảng trong response (`"data.items"` nếu lồng sâu hơn) |

Không cần flow để làm select phụ thuộc — `dependsOn` lo việc đó. Chọn lại tỉnh thì quận/xã được nạp lại. Mẫu thật: `public/templates/sample/select-dependency.json` trong `fe_dynaform`.

## 4. Điền sẵn giá trị & khoá khi sửa

| Nhu cầu | Cách | Ví dụ trong spec / host |
|---|---|---|
| Giá trị mặc định cố định | `default` trong spec | `gender` mặc định `male` |
| Điền theo bản ghi (chế độ sửa) | host truyền `data.dataUserFill` (key = `name`) + `formMode: "edit"` | xem dưới |
| Khoá khi sửa | `attributes: { "readonlyOnEdit": true }` | `resident_code` |
| Biến có sẵn của host | `data.dataVariableExisting` → "Select Existing" khi bind biến trong editor | |
| Giá trị host cấp sẵn | `bound_variables` trong form JSON, key theo `key_path` | |

Phía host (chi tiết ở `../../dynaform-embed-lib/references/examples.md` §4, §6):

```tsx
const dataUserFill = useMemo(
  () => ({
    resident_code: record.code,      // key theo `name` của control
    gender: record.gender,           // phải trùng một `value` của options
    province: record.provinceCode,   // select API: giá trị = `valueField`
    district: record.districtCode,
    ward: record.wardCode,
  }),
  [record],
);

<DynaformBuilder form={formJson} dataUserFill={dataUserFill} mode="release" isolatedState />
// DynamicFormBuilder: config={{ mode: "release", formMode: "edit" }} data={{ dataFormDesign: formJson, dataUserFill }}
```

Thứ tự ưu tiên điền sẵn: `dataUserFill` > bản nháp > `bound_variables`. Với select phụ thuộc, điền cả chuỗi (tỉnh, quận, xã) để cấp dưới có giá trị khớp danh sách đã nạp lại.

## 5. Khi nào KHÔNG dùng `dataSource` trong spec

| Tình huống | Làm |
|---|---|
| Bảng dữ liệu động (`table`) | cấu hình Data Source trong builder — `docs/DATA_TABLE.md` |
| API cần token / header đặc biệt | cấu hình trong builder; flow dùng `authConfig.token_source: "system"` |
| Điền ô khác sau khi chọn (không phải danh sách) | flow `change` → `call_api` → `set_values` — `../../dynaform-logic-events/assets/example-flows.spec.json` (`student_id`) |

## 6. Lưu ý bảo mật

Chỉ dùng domain API đã được duyệt; dữ liệu trả về luôn là **không tin cậy** (`docs/security/form-json-safety.md`). Không hardcode URL nội bộ/secret trong spec — ví dụ trên dùng API công khai hoặc `https://api.example.com`.
