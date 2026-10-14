---
name: dynaform-validation
description: Quy tắc validation của form dynaform — required, minLength/maxLength, min/max, email, url, regex, matchField (xác nhận mật khẩu), thông báo lỗi tiếng Việt. Dùng khi thêm/sửa ràng buộc cho field, khi form không chặn submit, hoặc khi cần so khớp 2 field.
---

# Validation trong dynaform

Validation là mảng `validations` trên từng component (spec) ↔ `item_control.validation_schema` (JSON). Lib dùng Zod v4 để biên dịch rule thành schema chạy ở preview/release.

## Rule hợp lệ (`type`)

`required`, `readOnly`, `min`, `max`, `minLength`, `maxLength`, `contains`, `notContains`, `greater`, `lower`,
`equals`, `notEquals`, `greaterEqual`, `lowerEqual`, `email`, `url`, `regex`, `matchField`.

```jsonc
"validations": [
  { "type": "minLength", "value": 8, "errorMessage": "Mật khẩu tối thiểu 8 ký tự" },
  { "type": "regex", "value": "^0\\d{9}$", "errorMessage": "Số điện thoại 10 số, bắt đầu bằng 0" },
  { "type": "matchField", "value": "password", "errorMessage": "Mật khẩu không khớp" }
]
```

| Rule | `value` | Ghi chú |
|---|---|---|
| `required` | `"yes"` | Thường đặt qua `required: true` (+ `requiredMessage`) — script tự thêm; **đừng khai báo trùng** |
| `minLength` / `maxLength` | số | cho text |
| `min` / `max` | số | cho `number` |
| `email`, `url` | — | |
| `regex` | chuỗi pattern | nhớ escape `\\` trong JSON |
| `matchField` | **`name`** của field cần khớp | không phải id; field đích phải tồn tại |
| `equals`, `notEquals`, `greater`, `lower`… | literal so sánh | |

## Quy tắc

1. `errorMessage` viết tiếng Việt, ngắn, nói rõ cách sửa; không để rỗng với rule không hiển nhiên (regex, matchField).
2. `matchField` đặt ở field **nhập lại** (confirm), trỏ về field gốc. Được kiểm ở mức form (superRefine).
3. Field ẩn bằng rule `hidden`/`show` mà vẫn cần bắt buộc khi hiện: dùng action `require`/`optional` trong rule thay vì `required: true` cứng (xem `dynaform-logic-events`).
4. `email`/`url`/`tel`: ưu tiên dùng đúng `type` component (đã có kiểu dữ liệu), thêm rule khi cần thông báo riêng.
5. Với form dùng `SectionedFormLayout` ở app host (react-hook-form), validation của host là việc khác — xem `dynaform-mfe-module`.

## Kiểm tra

`node skills/dynaform-build-form/scripts/dynaform.mjs validate <file>` báo `validation type không hợp lệ` và `matchField trỏ tới field không tồn tại`.
Tài liệu gốc: `docs/ZOD_VALIDATION_GUIDE.md`, `docs/FORM_VALIDATION_GUIDE.md` trong fe_dynaform.
