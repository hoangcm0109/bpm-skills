# Ví dụ đầy đủ — validation

Spec chạy được: [`assets/example-validation.spec.json`](../assets/example-validation.spec.json) ("Đăng ký tài khoản sinh viên", 2 nhóm, ~20 field).

```bash
S=skills/dynaform-build-form/scripts/dynaform.mjs
node $S build skills/dynaform-validation/assets/example-validation.spec.json --out /tmp/validation.json
node $S validate /tmp/validation.json
```

## 1. Rule nào đi với control nào

Lib chỉ đưa ra các rule dưới đây trong panel Validation của từng kiểu control (script vẫn chấp nhận mọi `type` hợp lệ). Ví dụ trong spec bám đúng bảng này.

| Control | Rule hợp lý | Trong ví dụ |
|---|---|---|
| `input` | `minLength` `maxLength` `contains` `notContains` `regex` `matchField` | `student_code` (regex), `full_name` (độ dài + `notContains "@"`) |
| `textarea` | `minLength` `maxLength` `contains` `notContains` `regex` | `note` (≤ 200 ký tự, không chứa `http`) |
| `email` | `email` `contains` `notContains` `regex` `matchField` | `email` (+ regex miền), `confirm_email` (`matchField`) |
| `password` | `minLength` `maxLength` `regex` `matchField` | `password`, `confirm_password` |
| `tel` | `minLength` `maxLength` `regex` | `phone` (regex 10 số) |
| `number` | `min` `max` `greater` `lower` `greaterEqual` `lowerEqual` `equals` | `credits` (10–24), `gpa` (0–4), `age` (17 < x < 60), `human_check` (= 7) |
| `url` | `url` | `portfolio_url` |
| mọi control | `required` — viết bằng `required: true` + `requiredMessage` | `agree`, `full_name`… |

## 2. Mẫu hay dùng

```jsonc
// Mã định dạng cố định
{ "type": "regex", "value": "^SV\\d{6}$", "errorMessage": "Mã sinh viên gồm SV + 6 chữ số, ví dụ SV123456" }

// Mật khẩu mạnh: nhiều rule, mỗi rule một thông báo riêng
"validations": [
  { "type": "minLength", "value": 8,  "errorMessage": "Mật khẩu tối thiểu 8 ký tự" },
  { "type": "maxLength", "value": 64, "errorMessage": "Mật khẩu tối đa 64 ký tự" },
  { "type": "regex", "value": "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$", "errorMessage": "Mật khẩu cần có chữ hoa, chữ thường và số" }
]

// Nhập lại: đặt ở field NHẬP LẠI, trỏ về field gốc bằng `name`
{ "type": "password", "name": "confirm_password", "required": true,
  "validations": [{ "type": "matchField", "value": "password", "errorMessage": "Mật khẩu nhập lại không khớp" }] }

// Khoảng số: hai rule độc lập
"validations": [
  { "type": "min", "value": 10, "errorMessage": "Tối thiểu 10 tín chỉ" },
  { "type": "max", "value": 24, "errorMessage": "Tối đa 24 tín chỉ" }
]
```

- Trong JSON, ký tự `\` phải viết `\\` (`"^0\\d{9}$"`).
- Lib cắt dấu `/` ở đầu/cuối pattern; viết pattern trần như ví dụ.
- Pattern sai cú pháp bị bỏ qua (lib chỉ `console.error`) — kiểm pattern bằng preview.

## 3. Bắt buộc theo điều kiện — đừng đặt `required: true` cứng

Field `tax_code` chỉ bắt buộc khi loại hồ sơ là doanh nghiệp. Đúng: giữ validation định dạng + bật/tắt bắt buộc bằng rule `require`/`optional`, và ẩn lúc mở bằng handler `load`:

```jsonc
{ "type": "input", "name": "tax_code", "label": "Mã số thuế",
  "events": [{ "event": "load", "flow": { "id": "init", "type": "field_state", "action": "hide", "targets": ["tax_code"] } }],
  "validations": [{ "type": "regex", "value": "^\\d{10}(-\\d{3})?$", "errorMessage": "Mã số thuế gồm 10 số (hoặc 10 số-3 số)" }],
  "rules": [{ "name": "Doanh nghiệp: hiện và bắt buộc mã số thuế", "match": "AND",
    "when": [{ "field": "account_type", "operator": "equals", "value": "company" }],
    "then": [{ "type": "show", "target": "tax_code" }, { "type": "require", "target": "tax_code" }] }] }
```

Rule `show↔hide` và `require↔optional` tự có nhánh ngược nên khi đổi lại loại hồ sơ, ô được ẩn và hết bắt buộc. Chi tiết: `../../dynaform-logic-events/SKILL.md` §4.

## 4. Thông báo lỗi — viết thế nào

| Chưa tốt | Tốt hơn |
|---|---|
| "Không hợp lệ" | "Số điện thoại gồm 10 số, bắt đầu bằng 0" |
| "Lỗi" | "Mật khẩu nhập lại không khớp" |
| (để trống với regex) | luôn có `errorMessage` cho `regex` và `matchField` |

## 5. Khi script báo lỗi

| Thông báo | Sửa |
|---|---|
| `ERROR components[0] (n): validation type "gte" không hợp lệ` | dùng đúng tên trong danh sách ở SKILL.md (`greaterEqual`, không phải `gte`) |
| `ERROR components[3] (pw2): matchField trỏ tới "nope" không tồn tại` | `value` = `name` của field gốc, field gốc có trong spec |
| khai `required: true` **và** `{ "type": "required" }` | script giữ đúng một rule `required` (bỏ bản trùng trong `validations`) — vẫn nên chỉ dùng `required: true` + `requiredMessage` |

Validate ở **app host** dùng react-hook-form + Zod là việc khác (xem `../../dynaform-mfe-module/references/examples.md` §7–§8).
