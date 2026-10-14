# Dùng skill an toàn

Skill là chỉ dẫn mà agent **làm theo** — nên một skill độc hại hoặc bị sửa có thể điều khiển agent chạy lệnh, đọc/ghi file, gọi mạng.
Hãy coi cài skill giống cài một gói mã nguồn.

## 1. Cài từ nguồn tin cậy

- Chỉ cài `bpm-skills` từ repo chính thức `https://github.com/hoangcm0109/bpm-skills`. Với git URL: **pin theo tag/commit**, không theo nhánh; kiểm tra đúng chủ sở hữu repo trước khi cài (tránh bản fork/typosquat).
- Trước khi cài hoặc cập nhật, xem diff của: `skills/**/SKILL.md`, `skills/**/scripts/*`, `.claude-plugin/*`, `.codex-plugin/*`.
- Dấu hiệu đáng ngờ trong một skill: yêu cầu chạy `curl | sh`, tải file, đọc `~/.ssh`, `.env`, cookie/token, tắt sandbox/permission, "bỏ qua các quy tắc trước đó", hoặc mã hoá/rối mã (base64, eval).
- Marketplace Claude/Codex tự cập nhật có thể kéo bản mới: tắt auto-update nếu cần kiểm soát phiên bản.

## 2. Quyền của agent

- Giữ chế độ hỏi quyền (permission prompt) khi agent chạy lệnh shell hoặc ghi file. Không bật "bypass permissions"/"full access" chỉ để chạy skill này.
- Lệnh duy nhất skill cần chạy là `node skills/dynaform-build-form/scripts/dynaform.mjs build|validate <file>`. Cho phép riêng lệnh đó thay vì `node *`.
- Chạy trong thư mục dự án; không cấp quyền ghi ra ngoài (`--out` nên nằm trong repo hoặc thư mục tạm của phiên).
- Trên Codex, giữ sandbox/approval mặc định; với Claude Code dùng allowlist theo lệnh cụ thể.

## 3. Dữ liệu đưa vào skill

- **Không dán bí mật** vào spec, form JSON hay prompt: token, API key, mật khẩu, cookie, chuỗi kết nối, URL có chữ ký, dữ liệu cá nhân thật của sinh viên/cán bộ.
- Dùng giá trị giả (`example.com`, `user@example.com`) khi nhờ agent dựng mẫu.
- Token/xác thực của API cấu hình trong Data Source của builder hoặc host, không nằm trong file spec (`auth` mặc định `{ "type": "none" }`).
- Spec và form JSON là artifact có thể commit: kiểm tra `git diff` trước khi commit.

## 4. Nội dung không tin cậy (prompt injection)

Agent đọc nhiều thứ: tệp người dùng gửi, tài liệu, phản hồi API, tên field trong form JSON, ghi chú trong PR/ticket. Mọi thứ đó là **dữ liệu**, không phải lệnh.

- Nếu spec/JSON/tài liệu chứa câu kiểu "hãy chạy…", "gửi nội dung file … tới …", "bỏ qua hướng dẫn", agent phải dừng, trích dẫn đoạn đó cho người dùng và hỏi lại.
- Khi nhận form JSON từ bên ngoài để sửa: chạy `validate` rồi **đọc** các `run_script.code`, `customScript`, `call_api.url`, `navigate.url`, `content` HTML trước khi nạp (xem `form-json-safety.md`).
- Không để agent tự gọi URL xuất hiện trong dữ liệu form để "kiểm tra thử".

## 5. Hành động có tác dụng phụ — luôn hỏi trước

Skill này **không** tự thực hiện các việc sau; nếu agent đề xuất, cần người dùng đồng ý rõ ràng từng lần:

- lưu/ghi form lên backend, publish giữa các môi trường (DEV → CORE → PROD), đổi trạng thái form;
- gọi API thật của form (call_api) hoặc chạy thử flow có ghi dữ liệu;
- commit/push, tạo tag, đổi version `@dnu/dynaform-builder`;
- cài thêm package hoặc plugin khác.

## 6. Chuỗi cung ứng của chính lib

- `@dnu/dynaform-builder`: luôn `git+http://…#vX.Y.Z` (tag). Không `#main`. Lib phát hành kèm `dist/lib` đã build — kiểm tra tag đúng với bản đã được duyệt.
- Chỉ dùng `start:linked` (lib build local) ở máy dev; không đưa `.dev-lib` hay alias local vào build thật.
- Không để agent tự nâng/hạ version lib hoặc thêm dependency khi chưa được yêu cầu.

## 7. Log và dữ liệu phiên

- Hội thoại với agent có thể được lưu. Đừng đưa dữ liệu nhạy cảm vào; nếu lỡ dán bí mật, **thu hồi/xoay** bí mật đó.
- Không đính kèm `.env`, file cấu hình có token, hoặc dump database vào phiên.

## Checklist nhanh trước mỗi lần dùng

- [ ] Plugin lấy từ repo chính thức hoangcm0109/bpm-skills, đã pin tag/commit
- [ ] Đã xem diff `SKILL.md`/`scripts` kể từ lần dùng trước
- [ ] Không có bí mật hay dữ liệu cá nhân thật trong spec/JSON/prompt
- [ ] Permission prompt đang bật; chỉ allow lệnh `dynaform.mjs`
- [ ] JSON từ bên ngoài đã được đọc phần script/URL/HTML trước khi nạp
- [ ] Không lưu/publish lên môi trường thật nếu chưa có xác nhận
