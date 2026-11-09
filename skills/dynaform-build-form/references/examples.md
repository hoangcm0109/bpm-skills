# Ví dụ — dựng form từ yêu cầu

Không có công cụ chạy lệnh: ví dụ cho thấy cách **suy nghĩ từ yêu cầu → quyết định → JSON → tự kiểm → báo cáo**. Form hoàn chỉnh ở dạng JSON đầy đủ: [`example-contact-json.md`](example-contact-json.md).
Các ví dụ khác viết bằng **khoá gọn** (ký hiệu tài liệu) và quy đổi sang JSON theo `form-json.md` §10. Mọi URL là `https://api.example.com` (giả) — thay bằng API thật do người dùng cung cấp; **không** ghi token vào form (dùng `auth_config`/`authConfig.token_source: "system"`).

| Ví dụ | Dạng | Minh hoạ | Độ khó |
|---|---|---|---|
| `example-contact-json.md` | JSON đầy đủ | form nhỏ nhất đủ dùng: 2 cột, select tĩnh, validation, nút gửi chạy flow | ★ |
| `example-spec.md` | khoá gọn | container, tab, select phụ thuộc API, `matchField`, rule hiển thị, dialog | ★★ |
| `example-layout.md` | khoá gọn | **chỉ bố cục**: container, `columns` 3 cột, `tab`, `grid`, nút căn phải | ★★ |
| `example-wizard.md` | khoá gọn | wizard `steps` + `validateOnNext`, rule hiện/ẩn, dialog thành công, gửi bằng flow | ★★★ |

## Ví dụ 1 — "Tạo form liên hệ" (từ yêu cầu → JSON)

**Yêu cầu của người dùng**: "Form liên hệ tư vấn: họ tên, số điện thoại, email, chủ đề (tuyển sinh / học phí / học bổng / khác), nội dung. Bấm Gửi thì báo thành công."

**Quyết định trước khi gõ JSON**:

| Điểm | Chọn | Vì sao |
|---|---|---|
| Số điện thoại | `tel` | không có type `phone` |
| Chủ đề | `select` + `data_source` tĩnh | ít lựa chọn cố định; `value` là chuỗi tiếng Anh, `label` tiếng Việt |
| Bố cục | họ tên 6 + điện thoại 6; email 6 + chủ đề 6; nội dung 12 | giá trị ngắn → 2 cột; `textarea` → 12 |
| Nút | `reset-button` `colSpan "2"`, `colStart "9"` + `submit-button` `colSpan "2"` | căn phải cuối form |
| Gửi | flow trên nút: `validate_form` → `try { call_api, show_message, reset_form } catch { show_message lỗi }` | nút có flow `click` **không** tự validate/gửi — flow làm hết |
| Thông báo lỗi | tiếng Việt, nói cách sửa | "Số điện thoại gồm 10 số, bắt đầu bằng 0" |
| Mobile | mọi control `colSpan` < 12 thêm `overrides.sm … colSpan "12"` | xuống một cột khi khung < 768px |

Kết quả: [`example-contact-json.md`](example-contact-json.md).

**Báo cáo mẫu cho người dùng** (SKILL.md bước 7):

> Đã dựng form "Liên hệ tư vấn" (8 control gốc): `full_name` (bắt buộc, ≥ 3 ký tự), `phone` (bắt buộc, 10 số), `email`, `topic` (bắt buộc, 4 lựa chọn), `message` (≤ 500 ký tự), nút Làm lại/Gửi.
> Logic: nút Gửi chạy flow kiểm tra → `POST https://api.example.com/contacts` (token hệ thống) → thông báo → đặt lại form. **Cần bạn**: thay URL API thật và mở form trong preview để xác nhận — mình tự kiểm theo checklist, chưa có công cụ kiểm tự động và không gọi mạng.
> Không có `hidden`, `custom-embed`, `customScript`.

## Ví dụ 2 — Wizard nhiều bước

`example-wizard.md` dựng "Đăng ký tham dự hội thảo" 3 bước. Điểm đáng học:

- `steps` + `steps: [{id,label}]`; mọi con nằm trong `children_schema` của `steps` **và** có `parent_tab_id` đúng id bước. `stepsOptions.validateOnNext: true` chặn sang bước sau khi bước hiện tại chưa hợp lệ.
- Field chỉ hiện khi chọn "Doanh nghiệp": **ẩn lúc mở bằng handler `load` + `field_state: hide`** rồi `rules` hiện lại. Không dùng `hidden: true` tĩnh (không bật lại được bằng logic).
- Hộp thoại thành công `dialog` variant `success` đứng **trước** nút mở nó; nút `submit-button` có flow `validate_form` → `call_api` → `dialog open`.

## Ví dụ 3 — Nạp JSON vào đâu

| Cách | Làm |
|---|---|
| Xem/chỉnh trong builder | Mở form → nút *Open JSON* → dán JSON → kiểm trên canvas → Save |
| Chạy ở app host | `data.dataFormDesign` của `DynamicFormBuilder`, hoặc `form={…}` của `DynaformBuilder` — xem `../../dynaform-embed-lib/references/examples.md` §4, §6 |
| Có `custom` (Tailwind) hoặc `custom-embed` | mở trong builder một lần và Save để lib sinh `tailwindCss` |

Không tự lưu/publish form hay gọi API ghi khi người dùng chưa yêu cầu.

## Lỗi hay gặp khi tự kiểm — đọc thế nào

| Dấu hiệu khi rà JSON | Sửa |
|---|---|
| `type: "phone"` | không có trong registry → `tel` |
| Con của `columns` thiếu `parent_tab_id` | thêm `"col-0"`, `"col-1"`… (< `columns.count`) |
| `select` không có `data_source` hoặc < 2 mục | thêm `hard` (≥ 2 mục) hoặc `api` |
| `matchField.value` là nhãn/id | phải là **`name`** của field gốc |
| `grid` có nhiều con hơn số ô | tăng `rows`, bỏ gộp ô; mỗi ô đúng 1 control (cần nhiều control thì bọc `container`) |
| Hàng cộng `colSpan` ≠ 12 (vd 11/12) | chỉnh `colSpan` cho đủ 12 hoặc căn phải bằng `colStart` |
| Hai step cùng `id` trong handler | đặt `id` khác nhau (cả giữa `then` và `else`) |
| `dialog` step `awaitSubmit` mà dialog không có nút xác nhận | dialog cần footer action `confirm`/`submit` |
| Hai control cùng `id` hoặc cùng `name` | sao chép khối chưa đổi — UUID/`name` mới |
| JSON lỗi cú pháp (dư dấu phẩy, comment `//`) | JSON thuần, không comment |

## Ví dụ của các skill con (ký hiệu khoá gọn)

| Skill | Ví dụ | Nội dung |
|---|---|---|
| `dynaform-components` | `references/example-input-catalog.md`, `example-layout-controls.md` | mọi control nhập liệu; container/dialog/drawer/bottom-sheet/list/nested-list/form-loop/`custom` |
| `dynaform-validation` | `references/example-validation.md` | mọi rule theo từng kiểu control |
| `dynaform-logic-events` | `references/example-rules.md`, `example-flows.md`, `example-table-row-actions.md` | rule điều kiện; flow API/dialog/bảng; hành động từng dòng của table |
| `dynaform-layout` | `references/example-layout-recipes.md` | 11 công thức bố cục + responsive |
| `dynaform-data-source` | `references/example-data-source.md` | option tĩnh/API, Tỉnh → Quận → Xã |
