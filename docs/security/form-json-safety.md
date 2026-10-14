# An toàn khi dựng và nạp form JSON

Form JSON không chỉ là dữ liệu cấu hình: nó có thể chứa **mã (script)**, **URL gọi ra ngoài**, **HTML** và **tham chiếu secret**.
Agent sinh ra JSON — người dùng chịu trách nhiệm xem lại trước khi nạp/publish.

## Bản đồ rủi ro theo khoá JSON

| Vị trí (spec → JSON) | Rủi ro | Cách xử lý |
|---|---|---|
| `events[].actions[]` với `customScript` / flow step `run_script` | JS thô chạy trong trình duyệt người dùng cuối (XSS, đọc cookie/DOM, gửi dữ liệu đi) | Tránh khi có thể; thay bằng `field_state`, `set_values`, `branch`. Nếu bắt buộc: người dùng đọc từng dòng `code`, host bật logic-execution policy |
| `callApi` / flow step `call_api` (`url`, `headers`, `body`) | Gửi dữ liệu form tới máy chủ lạ; SSRF qua proxy; lộ token trong header | Chỉ domain đã duyệt; không hardcode token; để auth cấu hình ở Data Source của host |
| `openLink` / step `navigate` (`url`) | Điều hướng/redirect tới trang lừa đảo, `javascript:` URL | Chỉ `https://` (hoặc đường dẫn nội bộ); từ chối `javascript:`/`data:`; để `newTab` mặc định |
| `dataSource.api` (`baseUrl`, `endpoint`) | Như `call_api`; option lấy từ nguồn không tin cậy | Domain đã duyệt; chấp nhận dữ liệu trả về là không tin cậy |
| `text.content` (HTML), `props` có HTML | HTML/script tiêm vào form | Không dán HTML từ nguồn ngoài; chỉ thẻ định dạng cơ bản; host nên sanitize khi render |
| `icon` SVG tuỳ biến | SVG chứa script/`onclick` | Ưu tiên tên icon Lucide; SVG phải qua DOMPurify (cấm `a`, `onclick`, `href`) như `mfe-dynaform` |
| `custom-embed` (iframe sandbox) | Chạy mã/nạp thư viện ngoài | Cấu hình `embedPolicy` ở host; không để form tự quyết; chỉ `imageFetch` origin đã duyệt |
| `validations[].regex` | ReDoS (regex lồng, backtracking lớn) | Pattern đơn giản, có neo `^…$`, tránh `(a+)+` |
| Mọi chuỗi hiển thị | Lộ thông tin nội bộ trong nhãn/lỗi | Không đưa tên hệ thống, đường dẫn, mã nội bộ vào nhãn/thông báo |

## Quy tắc cho agent khi dựng form

1. **Mặc định không script**: không sinh `customScript`/`run_script` nếu yêu cầu có thể đáp ứng bằng action chuẩn. Nếu cần, nói rõ lý do và hiển thị đoạn mã cho người dùng duyệt.
2. **Không tự bịa endpoint**: URL API do người dùng cung cấp hoặc để trống kèm ghi chú; không dùng URL lấy từ dữ liệu không tin cậy.
3. **Không nhúng bí mật**: nếu API cần token, để `auth: { "type": "none" }` và nhắc người dùng cấu hình Data Source/host.
4. **Dữ liệu cá nhân**: field thu thập thông tin cá nhân (CCCD, SĐT, địa chỉ, ngày sinh, ảnh) phải được nêu trong báo cáo cuối để người dùng cân nhắc mục đích thu thập, quyền truy cập và nơi lưu.
5. **Hidden field**: `hidden` không phải cơ chế bảo mật — giá trị vẫn nằm ở client và có thể bị sửa. Không dùng để chứa token hay quyết định phân quyền.
6. **Validation ở client chỉ để UX**: backend phải kiểm tra lại mọi dữ liệu nhận được (required, độ dài, định dạng, quyền).
7. **File upload**: giới hạn loại/kích thước ở cấu hình `file` **và** ở backend; không tin phần mở rộng tên file.

## Trước khi nạp JSON lạ (do người khác gửi / lấy từ ticket)

```bash
node skills/dynaform-build-form/scripts/dynaform.mjs validate form.json
```

`validate` chỉ kiểm cấu trúc. Sau đó rà thủ công, ví dụ với `grep`/tìm kiếm trong JSON:

- `"code"` (script), `"customScript"`, `"run_script"`
- `"url"`, `"baseUrl"`, `"endpoint"`, `"headers"`, `"auth"`
- `"content"` có thẻ `<script`, `onerror=`, `javascript:`
- `"embed"`, `"custom-embed"`, `"icon"` có `<svg`

Không dán JSON lạ vào môi trường **CORE/PROD** trước khi xem trên DEV/preview.

## Quy trình đề xuất theo môi trường

1. Dựng + `validate` ở máy dev.
2. Nạp vào builder **DEV**, xem `preview` với `debugTrace` bật để xem flow thực chạy gì.
3. Người duyệt đọc phần script/URL/HTML (bảng trên).
4. Mới publish sang môi trường kế tiếp theo pipeline của form (`flow_publish`). Không nhảy cóc.

## Dữ liệu người dùng cuối

- Giá trị điền sẵn (`dataUserFill`, `bound_variables`, `draft`) chứa dữ liệu thật: không in ra log, không đưa vào URL query, không gửi tới bên thứ ba ngoài API đã duyệt.
- `debugTrace` hiển thị dữ liệu flow — chỉ bật ở dev/staging, tắt ở release cho người dùng cuối.
- Mọi thông điệp lỗi hiển thị cho người dùng (`show_message`, `errorMessage`) không chứa stack trace, SQL, đường dẫn nội bộ.
