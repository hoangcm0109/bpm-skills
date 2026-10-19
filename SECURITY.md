# Bảo mật — bpm-skills

Tài liệu này mô tả rủi ro khi dùng bộ skill này và cách dùng an toàn. Chi tiết nằm trong `docs/security/`.

| Tài liệu | Dành cho |
|---|---|
| [`docs/security/using-skills.md`](docs/security/using-skills.md) | Người dùng/dev cài và chạy skill với agent (Claude Code, Codex) |
| [`docs/security/form-json-safety.md`](docs/security/form-json-safety.md) | Người dựng form: JSON do agent sinh ra có thể chứa script, URL API, HTML |
| [`docs/security/review-checklist.md`](docs/security/review-checklist.md) | Người sửa/thêm skill hoặc script trong repo này |

## Phạm vi

Repo chỉ chứa **hướng dẫn (markdown)**, **hai script Node** (`skills/dynaform-build-form/scripts/dynaform.mjs` và `stream-server.mjs`) và **manifest plugin**.
Không có dịch vụ chạy nền tự khởi động (`stream-server.mjs` chỉ chạy khi người dùng yêu cầu build dần), không có hook, không có MCP server, không có biến môi trường bắt buộc.

## Cam kết của script `dynaform.mjs`

Đã kiểm tra trong mã nguồn; mọi thay đổi vi phạm các điểm dưới đây phải được review kỹ:

- Chỉ import `node:fs` và `node:crypto`. **Không** gọi mạng, **không** `child_process`/`eval`/`Function`.
- Chỉ **đọc** đúng file truyền vào và chỉ **ghi** đúng đường dẫn sau `--out`. Không ghi nơi khác.
- Không đọc biến môi trường, không đọc file ngoài tham số.
- Không thực thi nội dung trong spec/form JSON (kể cả `customScript.code`): chỉ chép sang JSON đầu ra dưới dạng chuỗi.
- `crypto.randomUUID()` chỉ dùng để sinh id.

## Cam kết của script `stream-server.mjs` (cầu nối build dần, tuỳ chọn)

Ngoại lệ có phạm vi hẹp của quy tắc "không mạng", tách riêng khỏi `dynaform.mjs` để `dynaform.mjs` vẫn giữ nguyên các cam kết trên:

- Chỉ import `node:fs`, `node:http` và `dynaform.mjs`. **Không** `child_process`/`eval`/`Function`, không đọc biến môi trường, không gọi ra ngoài.
- Chỉ lắng nghe `127.0.0.1`; từ chối `Host` không phải localhost (chống DNS rebinding) và `Origin` ngoài localhost (trừ khi thêm `--allow-origin`).
- Chỉ nhận `GET` (`/events`, `/snapshot`, `/health`). Không có endpoint ghi, không nhận dữ liệu từ client.
- Chỉ **đọc** đúng file spec truyền vào; không ghi file.
- Không thực thi nội dung spec; chỉ build thành JSON rồi đẩy sang trình duyệt. Trang xem trước chạy form như runtime thật, nên `customScript`/`run_script` trong spec (nếu có) sẽ chạy trên trình duyệt người xem.
- Chỉ dành cho máy dev; không chạy trên máy chủ dùng chung.

## Rủi ro chính (tóm tắt)

1. **Prompt injection** — spec, form JSON, tài liệu hoặc phản hồi API do bên thứ ba cung cấp có thể chứa câu lệnh nhắm vào agent.
2. **Mã chạy trong form** — `customScript` / `run_script` là JavaScript thô, chạy trong trình duyệt người dùng cuối.
3. **Rò rỉ bí mật** — token, API key, URL nội bộ dán vào spec/JSON rồi bị commit hoặc đưa vào form công khai.
4. **Chuỗi cung ứng** — cài `@dnu/dynaform-builder` không pin tag; cài plugin từ nguồn không tin cậy.
5. **Ghi/ghi đè ngoài ý muốn** — agent lưu form lên backend hoặc đổi file khi người dùng chưa yêu cầu.

## Báo lỗi bảo mật

Không mở issue công khai cho lỗ hổng. Báo trực tiếp cho người bảo trì repo (Hoang Chu Minh) hoặc nhóm an toàn thông tin của Dai Nam University
qua kênh nội bộ, kèm: skill/file bị ảnh hưởng, các bước tái hiện, tác động dự kiến. Lỗ hổng nằm ở `@dnu/dynaform-builder` thì báo tại repo `fe_dynaform`.

## Hạn chế đã biết

- Script chỉ kiểm **cấu trúc** form; không đánh giá độ an toàn của URL API, script hay HTML bên trong.
- Việc cô lập script/embed là trách nhiệm của host (`logic-execution policy`, `embedPolicy`); skill chỉ hướng dẫn cấu hình.
- Skill không thay thế review bảo mật của form trước khi publish lên môi trường thật.
