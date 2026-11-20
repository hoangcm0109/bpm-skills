# Quy tắc thiết kế chi tiết

Ký hiệu trong ví dụ là **khoá gọn** (`colSpan`, `parent`, `custom`…), quy đổi sang JSON theo `../../dynaform-build-form/references/form-json.md` §10. Dữ liệu trong ví dụ là dữ liệu giả.

## 1. Đầu form: tiêu đề + mô tả

Hai control `text` đầu form, đều `colSpan: 12`, `styles.showLabel: "no"`:

```jsonc
{ "type": "text", "name": "form_title", "content": "<h3>Đề nghị mua sắm</h3>",
  "custom": { "css": "& h3{font-size:1.5rem;font-weight:700;line-height:1.3;margin:0}" } },
{ "type": "text", "name": "form_desc",  "content": "<p>Điền thông tin để gửi lãnh đạo phê duyệt.</p>",
  "custom": { "css": "& p{font-size:.875rem;opacity:.65;margin:0}" } }
```

- **`<h3>`/`<h4>` trong `text` không có kiểu mặc định**: trên Chrome chúng render 14px, đậm 400 — giống hệt chữ thường, form mất hẳn phân cấp. Luôn kèm `custom.css` như trên (đã kiểm 2026-11-20).
- Tiêu đề là danh từ hành động ("Đề nghị mua sắm", "Đăng ký học bổng"), không viết "Form …".
- Mô tả một câu, nói điều người dùng sắp làm hoặc ai nhận. Không có gì để nói thì bỏ dòng mô tả, nhưng vẫn phải có tiêu đề.
- Form là một bước của workflow: tiêu đề có thể kèm bước ("Bước 1 — Đề nghị mua sắm"), nhưng mô tả vẫn nói người dùng làm gì ở bước này.

## 2. Card = một phần có nghĩa

Mỗi card là một `container` với `container.type: "card"`, `border: true`. Đầu card là tiêu đề, tuỳ chọn một dòng mô tả:

```jsonc
{ "type": "container", "name": "requester_info", "container": { "type": "card", "border": true },
  "styles": { "paddingTop": "20", "paddingRight": "20", "paddingBottom": "20", "paddingLeft": "20" } },
{ "type": "text", "name": "requester_info_title", "parent": "requester_info",
  "content": "<h4>1. Thông tin chung</h4>",
  "custom": { "css": "& h4{font-size:1rem;font-weight:600;margin:0}" } },
{ "type": "input", "name": "full_name", "parent": "requester_info", "label": "Người đề nghị", "colSpan": 6 }
```

- **Container không có padding mặc định** (lib: "the author sets it per side"). Có viền mà thiếu padding thì chữ và ô nhập dính sát mép card — đã gặp thật. Luôn đặt đủ 4 cạnh `styles.paddingTop/Right/Bottom/Left` (chuỗi số px, khuyến nghị `"20"`; đã kiểm trên Chrome 2026-11-20). Đây là khoá `properties.style.padding*`, khớp `editable_props.styles.*` (`form-json.md` §10).
- Số thứ tự ("1.", "2.") khi form có ≥ 3 phần; ít hơn thì bỏ số.
- Tiêu đề của chính `container` (`showTitle`) chưa lưu được vào JSON ở lib 4.7–4.8 — dùng `text` `<h4>` làm con đầu tiên (xem `../../dynaform-components/SKILL.md`).
- **4–8 field mỗi phần, tối đa 10.** Một phần là một card, hoặc một đoạn giữa hai `divider` trong một card (phương án B). Nhiều hơn thì tách theo nghĩa; ít hơn 3 thì gộp với phần kề trừ khi khác hẳn nghĩa.
- Không nhét hai phần vào một card rồi ngăn bằng `<h4>` nếu form cho phép tách (xem "Ràng buộc dữ liệu" trong `SKILL.md`); khi buộc phải giữ một card, ngăn bằng `divider` + `<h4>` + khoảng trống chứ không chỉ một dòng chữ.
- Các card cùng cấp phải **cùng kiểu**: cùng `border`, cùng cách đánh số, cùng vị trí tiêu đề. Một card có viền, một card không viền là lỗi.

## 3. Thứ tự

1. Nhận diện: ai, đơn vị nào (người dùng đã biết, điền nhanh nhất).
2. Bối cảnh: loại, mức độ, thời hạn.
3. Nội dung chính: mục đích, danh sách hàng, chi tiết.
4. Số liệu tổng: tổng tiền, kết quả.
5. Đính kèm.
6. Cam kết / xác nhận (checkbox).
7. Nút.

Trong một nhóm, field **bắt buộc đứng trước** field tuỳ chọn. Field phụ thuộc (hiện khi field khác có giá trị) đứng ngay dưới field điều khiển nó.

## 4. Nhịp cột

- Nền là **6 + 6**. Field ngắn (ngày, số, mã, tỉnh/quận/xã) 4 hoặc 3. Dòng dài + ô ngắn: 9 + 3.
- `textarea`, `wysiwyg-editor`, `file`, bảng, `nested-list`: 12.
- Cộng mỗi hàng đủ 12. Field lẻ không có cặp thì ghép với field cùng nghĩa gần nhất, hoặc đưa xuống cuối card thành hàng 12.
- Không để một field 12 đơn lẻ **xen giữa** các cặp 6+6 (ngoại lệ: `textarea` đi sau field điều khiển nó, ví dụ "Lý do cần gấp" ngay dưới "Mức độ khẩn").
- Tối đa 4 control một hàng, mỗi cái ≥ 3 cột.
- Mobile: control có `colSpan < 12` đều có `overrides.sm.colSpan = "12"` (`dynaform-build-form` đã yêu cầu).

## 5. Chữ trên form

| Thành phần | Quy tắc | Tốt | Chưa tốt |
|---|---|---|---|
| Nhãn | Danh từ ngắn ≤ 5 từ, không dấu hai chấm, đơn vị trong ngoặc | `Tổng giá trị dự toán (VND)` | `Nhập vào tổng giá trị dự toán của đơn:` |
| Placeholder | Ví dụ giá trị hoặc hành động, **không lặp nhãn** | `VD: 0912 345 678`, `Chọn phòng ban` | `Nhập số điện thoại` (dưới nhãn "Số điện thoại") |
| `helpText` | Chỉ khi có quy tắc, định dạng hoặc ngoại lệ | `Bắt buộc khi mức khẩn là Gấp` | `Vui lòng nhập tên` |
| Lỗi (`errorMessage`) | Nói cách sửa, ngắn | `Chọn phòng ban` | `Trường này không hợp lệ` |
| Nút | Động từ + đối tượng | `Gửi đề nghị` | `OK`, `Submit` |

Field bắt buộc: `properties.required: true` + rule `required`. Không đánh dấu bắt buộc nửa vời (có `*` mà không chặn).

## 6. Callout (cảnh báo / thông tin)

Callout là `text` có nền và viền, màu theo mức độ, dựng bằng **`custom.css`** (CSS thuần). Một callout ≤ 2 câu, bắt đầu bằng ký hiệu (⚠ ℹ ✕ ✓).

**Không dùng `custom.className` (Tailwind) khi viết JSON tay**: class chỉ ra CSS sau khi *builder biên dịch lúc lưu* (`custom.tailwindCss`, `fe_dynaform/docs/CUSTOM_STYLE.md` §4). Form ghi thẳng qua MCP không qua builder thì class có trên DOM (dạng `dfx:…`) nhưng **không có CSS** — callout chỉ là chữ thường. Đã thấy trên Chrome 2026-11-20. `custom.css` không cần biên dịch nên chạy ngay.

Nền và viền dùng `color-mix` trên màu gốc để vừa light vừa dark (chữ giữ màu theme, nền trong suốt một phần):

| Mức | Màu gốc |
|---|---|
| Thông tin | `#0ea5e9` |
| Cảnh báo | `#f59e0b` |
| Lỗi chặn | `#ef4444` |
| Ghi chú trung tính | dùng `#64748b` |

```jsonc
{ "type": "text", "name": "warn_budget", "parent": "items_card",
  "content": "<p>⚠ Tổng giá trị vượt ngân sách còn lại — cần bổ sung ngân sách trước khi gửi.</p>",
  "custom": { "css": "border:1px solid color-mix(in srgb,#f59e0b 45%,transparent);background:color-mix(in srgb,#f59e0b 12%,transparent);border-radius:.375rem;padding:.5rem .75rem;font-size:.875rem" },
  "styles": { "showLabel": "no" },
  "eventHandlers": [ /* load + condition → show/hide theo điều kiện, xem dynaform-logic-events */ ] }
```

(Đổi `#f59e0b` theo bảng trên cho mức khác.)

- **Không** viết `<p style="color:#b91c1c">`: chỉ đổi màu chữ, không thành callout, và màu cứng hỏng ở dark mode.
- Đặt callout ngay phía trên field liên quan, hoặc đầu card nếu nói về cả card.
- Ẩn mặc định, hiện theo điều kiện bằng handler `load` + `branch` (không dùng `hidden: true` — `dynaform-build-form` › Giới hạn).
- Ý kiến trả lại / ghi chú của bước trước trong workflow: là callout **cảnh báo** đầu form, hiện khi có nội dung. Không để ô `textarea` trần dưới tiêu đề.

## 7. Số liệu tổng

- Đứng cuối phần chứa nó, tách hàng riêng, 6 cột căn phải (`colStart: "7"`) hoặc 12 cột nếu đi kèm diễn giải.
- Nổi bật hơn field thường: `custom.control.css: "&{font-weight:600}"` (`&` là chính ô nhập; không dùng `className`, xem §6). Tổng tính tự động thì `readOnly`.
- Không đặt tổng cạnh field nhập tuỳ ý (VD tổng + VAT trộn lẫn) — nếu có thuế, đặt VAT **trên** tổng.

## 8. Danh sách lặp (`nested-list`, `list`, `table`)

- Có tiêu đề phần phía trên, danh sách chiếm 12.
- Hàng desktop ≤ 5 cột, cộng 12 (vd 5+2+2+3). Nhãn cột ngắn.
- Mỗi cột cần `overrides.sm.colSpan = "12"`. **Quan sát trên Chrome (lib 5.8.x, khung ~430px):** dù đã có `sm = 12`, dòng `nested-list` vẫn giữ 4 cột nên ô ĐVT bị cắt còn "C.." và nhãn "Số lượng" xuống dòng. Giữ nhãn cột ngắn, ≤ 4 cột, cột chọn (select) ≥ 2 cột; chưa có cách ép xuống dòng đã kiểm.
- Nút "Thêm dòng" dùng nhãn của control, không tự dựng nút riêng.

## 9. Nút hành động

- **Một nút chính** (`submit-button`) ở cuối form, căn phải (2–4 cột + `colStart`) trên desktop, 12 cột trên mobile.
- Nút phụ (Lưu nháp, Làm lại) nằm **bên trái** nút chính, cùng hàng. Tối đa 3 nút.
- Nút chính đứng sau cam kết. Cam kết là `checkbox` 12 cột, đặt ngay trên hàng nút. **`checkbox` hiện nhãn hai lần** (một lần phía trên, một lần cạnh ô tick) nếu để `showLabel` mặc định: đặt `styles.showLabel: "no"` để chỉ còn nhãn cạnh ô tick (đã kiểm 2026-11-20).
- Nút cục bộ (Áp dụng, Tra cứu) đứng cạnh ô nhập của nó với `alignSelf: "end"`, không đặt giữa form như nút gửi.
- Cụm nhiều nút sát nhau: công thức trong `../../dynaform-layout/SKILL.md` §5.

## 10. Ẩn/hiện theo điều kiện

- Nhóm hiện theo điều kiện: **bọc cả nhóm vào card rồi ẩn card** (một rule), không ẩn lẻ từng field.
- Field phụ thuộc đứng ngay dưới field điều khiển.
- Hiện/ẩn ban đầu: handler `load` (không `hidden: true`).

## 11. Form là bước của workflow

- Tiêu đề kèm số bước; một dòng mô tả nói việc cần làm ở bước này.
- Nội dung bước trước đã có (người đề nghị, tổng tiền…): hiển thị bằng `descriptions` chỉ đọc ở đầu form, không lặp lại thành field nhập.
- Ý kiến trả lại: callout cảnh báo (mục 6).
- Nút Next/Gửi có thể do host cung cấp (như trang giả lập) — khi đó không thêm nút gửi thứ hai vào form.

## 12. Trạng thái kiểm chứng

Đối chiếu ngày 2026-11-20:

| Nội dung | Căn cứ |
|---|---|
| Card/tab/steps/columns/grid lồng dữ liệu khi có `variables.name` | Đọc mã `fe_dynaform/src/lib/nest-form-values.ts` |
| Container có viền cần padding 4 cạnh | Đọc mã `form-container.tsx` + **thấy trên Chrome** (preview, 2026-11-20): thiếu thì sát mép, `"20"` thì ổn |
| `<h3>`/`<h4>` trong `text` render như chữ thường | **Chrome**: computed 14px / 400; thêm `custom.css` thì đậm, to rõ |
| `custom.className` (Tailwind) không ra CSS nếu form chưa qua builder | **Chrome**: class `dfx:…` có trên DOM, computed nền trong suốt, không có rule `.dfx\:…`; khớp `CUSTOM_STYLE.md` §4 |
| Callout thông tin bằng `text` + `custom.css` hiện nền + viền | **Chrome**: nền xanh nhạt + viền, đúng điều kiện `> 100 triệu` |
| Callout cảnh báo (`warn_budget`) và "Ý kiến trả lại" hiện nền + viền | **Chưa kiểm hiển thị** (cần dữ liệu host nạp / ngân sách còn lại); dùng cùng CSS với callout thông tin, chỉ đổi màu gốc |
| Hai `divider` hiện trong card, ba phần tách rõ | **Chrome**: đường kẻ mảnh hiện đúng |
| Form xuống một cột trên khung hẹp (~430px, kéo tay nắm hai bên preview) | **Chrome**: các cặp 6+6 xếp một cột; dòng `nested-list` thì giữ 4 cột (xem §8) |
| `checkbox` hiện nhãn hai lần, `showLabel: "no"` sửa được | **Chrome** |
| `save_form_design` nhận `divider` (`slug: "divider-field"` tự đặt) | **Đã lưu và đọc lại được** trên DEV |
| Layout không tên (`columns`/`tab`) lưu được qua `save_form_design` | **Chưa kiểm** |
