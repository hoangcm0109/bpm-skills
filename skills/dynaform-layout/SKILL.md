---
name: dynaform-layout
description: Bố cục form dynaform — lưới 12 cột (colSpan), viewport sm/md/lg và override responsive, container/tab/steps/columns/dialog, thứ tự và nhóm field, theme/settings. Dùng khi sắp xếp field thành hàng/nhóm, chia tab hoặc wizard, chỉnh hiển thị mobile, hoặc đổi theme form.
---

# Bố cục form

## Lưới 12 cột

- Mỗi component có `colSpan` 1–12 (mặc định 12 = cả hàng). Field cùng hàng khi tổng `colSpan` ≤ 12.
- Gợi ý: 2 field/hàng = `6`, 3 field = `4`, field dài (địa chỉ, ghi chú, textarea, bảng) = `12`.
- `colStart` (`"auto"` hoặc cột bắt đầu 1–12) đặt vị trí cột của control trong hàng; builder ≥ 4.7.0 ghi `colStart` + `colSpan` khi kéo **mép trái** của control (kéo mép phải chỉ đổi `colSpan`). Cùng khoá `properties.style.colStart` mà nhóm Grid ở sidebar chỉnh. Trong spec đặt qua `styles: { "colStart": "7" }`; thường không cần — để `auto` và sắp thứ tự trong mảng.
- Viewport: `sm` mobile (mặc định/base), `md` tablet, `lg` desktop. `lg` rơi về override của `md` nếu không có của riêng nó.
- Override theo viewport trong spec:
  ```jsonc
  "colSpan": 4,
  "overrides": { "sm": { "styles": { "colSpan": "12" } } }
  ```

## Nhóm và ngăn

| Mục đích | Dùng | Cách khai báo |
|---|---|---|
| Gom field thành khối có viền/tiêu đề | `container` | con: `"parent": "<name>"` |
| Chia tab | `tab` | `"tabs": [{ "id": "tab-1", "label": "…" }]`; con: `parent` + `tabId` |
| Wizard nhiều bước | `steps` | `"steps": [{ "id": "step-1", "label": "…" }]`, `stepsOptions` tuỳ chọn; con: `parent` + `tabId` |
| 2–4 cột cạnh nhau | `columns` | `"columns": { "count": 3, "spans": [4,4,4] }`; con: `tabId: "col-0".."col-2"` |
| Popup | `dialog` / `drawer` / `bottom-sheet` | variant `form`/`custom` mới có con; đứng trước nút mở |

Ví dụ chạy được (container + columns + tab): `skills/dynaform-build-form/assets/example-layout.spec.json`.
Con của `columns`/`tab` có `colSpan` tính **trong ngăn của nó** (mặc định 12 = đầy ngăn).

Ràng buộc script kiểm tra: cha đứng trước con; `tabId` thuộc đúng cha; `columns.spans` tổng 12.

## Chọn cấu trúc

- Form ≤ ~8 field: phẳng, 2 cột.
- Form dài có nhóm nghĩa rõ: `container` theo nhóm (Thông tin cá nhân, Liên hệ…) — nhìn gọn, dễ đặt rule hiện/ẩn cả nhóm.
- Nhiều phần độc lập, người dùng không cần thấy cùng lúc: `tab`.
- Quy trình tuần tự có kiểm tra từng bước: `steps` + `stepsOptions.validateOnNext: true`.
- Tránh lồng quá 2–3 cấp; mỗi cấp lồng làm tăng độ dài `key_path` (`cha.con`).

## Settings & theme

`settings.setting`: `size` (`xs|sm|normal|lg|xl`), `formKey`, `endpoint`, `method`.
`settings.theme`: `styles.type` (`normal`|`float`), `borderRadius`, `fontSize`, và 7 màu (`background foreground primary primaryForeground secondary secondaryForeground border`).
Bỏ qua = theme mặc định. UI form của người dùng cuối phải đọc được ở cả light/dark — dùng màu theme, tránh hardcode trong `props`.

## Hiển thị phụ

`styles` hay dùng: `showLabel: "no"` (ẩn nhãn), `labelPosition`, `visible: "no"` (ẩn; tương đương `hidden: true`), `asCard`.
Tài liệu: `docs/CONTAINER_DRAG_DROP.md`, `docs/CANVAS_NAVIGATION.md`, `public/templates/sample/*.json` (mẫu form thật).
