# Ví dụ đầy đủ — dựng form từ yêu cầu

Mỗi ví dụ là một spec chạy được trong `assets/` (các skill con có thêm spec riêng — xem bảng cuối). Chạy đúng như quy trình ở SKILL.md:

```bash
node <skill>/scripts/dynaform.mjs build <skill>/assets/example-contact.spec.json --out /tmp/form.json
node <skill>/scripts/dynaform.mjs validate /tmp/form.json
```

`<skill>` = thư mục `skills/dynaform-build-form`. Mọi URL trong ví dụ là `https://api.example.com` (giả) — thay bằng API thật do người dùng cung cấp; **không** ghi token vào spec (dùng `authConfig.token_source: "system"`).

| Spec | Minh hoạ | Độ khó |
|---|---|---|
| `example-contact.spec.json` | form nhỏ nhất đủ dùng: 2 cột, select tĩnh, validation, nút gửi chạy flow | ★ |
| `example-spec.json` | container, tab, select phụ thuộc API, `matchField`, rule hiển thị, dialog | ★★ |
| `example-layout.spec.json` | **chỉ bố cục**: container, `columns` 3 cột, `tab`, `grid`, nút căn phải | ★★ |
| `example-wizard.spec.json` | wizard `steps` + `validateOnNext`, rule hiện/ẩn, dialog thành công, gửi bằng flow | ★★★ |

## Ví dụ 1 — "Tạo form liên hệ" (từ yêu cầu → spec)

**Yêu cầu của người dùng**: "Form liên hệ tư vấn: họ tên, số điện thoại, email, chủ đề (tuyển sinh / học phí / học bổng / khác), nội dung. Bấm Gửi thì báo thành công."

**Quyết định khi viết spec** (đây là phần cần làm trước khi gõ JSON):

| Điểm | Chọn | Vì sao |
|---|---|---|
| Số điện thoại | `tel` | không có type `phone` |
| Chủ đề | `select` + `options` tĩnh | ít lựa chọn cố định; `value` là chuỗi tiếng Anh, `label` tiếng Việt |
| Bố cục | họ tên 6 + điện thoại 6; email 6 + chủ đề 6; nội dung 12 | giá trị ngắn → 2 cột; `textarea` → 12 |
| Nút | `reset-button` `colSpan: 2, colStart: 9` + `submit-button` `colSpan: 2` | căn phải cuối form |
| Gửi | flow trên nút: `validate_form` → `try { call_api, show_message, reset_form } catch { show_message lỗi }` | nút có flow `click` **không** tự validate/gửi — flow làm hết |
| Thông báo lỗi | tiếng Việt, nói cách sửa | "Số điện thoại gồm 10 số, bắt đầu bằng 0" |

Kết quả: [`assets/example-contact.spec.json`](../assets/example-contact.spec.json). Đầu ra của script:

```
OK    8 root control(s) -> /tmp/form.json
OK    hợp lệ
```

**Báo cáo mẫu cho người dùng** (SKILL.md bước 7):

> Đã dựng form "Liên hệ tư vấn" (8 control gốc): `full_name` (bắt buộc, ≥ 3 ký tự), `phone` (bắt buộc, 10 số), `email`, `topic` (bắt buộc, 4 lựa chọn), `message` (≤ 500 ký tự), nút Làm lại/Gửi.
> Logic: nút Gửi chạy flow kiểm tra → `POST https://api.example.com/contacts` (token hệ thống) → thông báo → đặt lại form. **Cần bạn**: thay URL API thật và test trong preview (script không gọi mạng).
> Không có `hidden`, `custom-embed`, `customScript`.

## Ví dụ 2 — Wizard nhiều bước

`example-wizard.spec.json` dựng "Đăng ký tham dự hội thảo" 3 bước. Điểm đáng học:

- `steps` + `steps: [{id,label}]`; mọi con khai `parent: "wizard"` **và** `tabId` đúng id bước. `stepsOptions.validateOnNext: true` chặn sang bước sau khi bước hiện tại chưa hợp lệ.
- Field chỉ hiện khi chọn "Doanh nghiệp": **ẩn lúc mở bằng handler `load` + `field_state: hide`** rồi `rules` hiện lại. Không dùng `hidden: true` tĩnh (không bật lại được bằng logic).
- Hộp thoại thành công `dialog` variant `success` đứng **trước** nút mở nó; nút `submit-button` có flow `validate_form` → `call_api` → `dialog open`.

```bash
node <skill>/scripts/dynaform.mjs build <skill>/assets/example-wizard.spec.json --out /tmp/wizard.json
# OK    4 root control(s) -> /tmp/wizard.json   (text, steps, dialog, submit-button)
```

## Ví dụ 3 — Nạp JSON vào đâu

| Cách | Làm |
|---|---|
| Xem/chỉnh trong builder | Mở form → nút *Open JSON* → dán `form.json` → kiểm trên canvas → Save |
| Chạy ở app host | `data.dataFormDesign` của `DynamicFormBuilder`, hoặc `form={…}` của `DynaformBuilder` — xem `../../dynaform-embed-lib/references/examples.md` §4, §6 |
| Có `custom` (Tailwind) hoặc `custom-embed` | mở trong builder một lần và Save để lib sinh `tailwindCss` |

Không tự lưu/publish form hay gọi API ghi khi người dùng chưa yêu cầu.

## Khi script báo lỗi — đọc thế nào

| Thông báo | Sửa |
|---|---|
| `ERROR components[0] (p1): type "phone" không có trong registry` | dùng `tel` |
| `ERROR components[2] (in1): columns "cols" cần tabId dạng col-0..col-1` | con của `columns` thêm `tabId: "col-0"…` |
| `ERROR components[4] (sel): select cần options[] (>= 2 mục) hoặc dataSource` | thêm `options` hoặc `dataSource.api` |
| `ERROR components[3] (pw2): matchField trỏ tới "nope" không tồn tại` | `value` phải là **`name`** của field gốc |
| `ERROR grid "x": 3 con nhưng chỉ có 2 ô…` | thêm `rows`, hoặc bỏ gộp ô; mỗi ô đúng 1 control |
| `WARN hàng ở gốc form … 11/12` | chỉnh `colSpan` cho đủ 12 hoặc dùng `colStart` |
| `WARN … awaitSubmit: dialog phải có nút xác nhận / gửi` | nhắc cố định: dialog cần footer action `confirm`/`submit` |

## Ví dụ của các skill con (cùng quy trình build/validate)

| Skill | Spec | Nội dung |
|---|---|---|
| `dynaform-components` | `assets/example-input-catalog.spec.json`, `example-layout-controls.spec.json` | mọi control nhập liệu; container/dialog/drawer/bottom-sheet/list/nested-list/form-loop/`custom` |
| `dynaform-validation` | `assets/example-validation.spec.json` | mọi rule theo từng kiểu control |
| `dynaform-logic-events` | `assets/example-rules.spec.json`, `example-flows.spec.json`, `example-table-row-actions.spec.json` | rule điều kiện; flow API/dialog/bảng; hành động từng dòng của table |
| `dynaform-layout` | `assets/example-layout-recipes.spec.json` | 11 công thức bố cục + responsive |
| `dynaform-data-source` | `assets/example-data-source.spec.json` | option tĩnh/API, Tỉnh → Quận → Xã |
