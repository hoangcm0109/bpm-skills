# Bảo mật — bpm-skills

Tài liệu này mô tả rủi ro khi dùng bộ skill này và cách dùng an toàn. Chi tiết nằm trong `docs/security/`.

| Tài liệu | Dành cho |
|---|---|
| [`docs/security/using-skills.md`](docs/security/using-skills.md) | Người dùng/dev cài và chạy skill với agent (Claude Code, Codex) |
| [`docs/security/form-json-safety.md`](docs/security/form-json-safety.md) | Người dựng form: JSON do agent sinh ra có thể chứa script, URL API, HTML |
| [`docs/security/review-checklist.md`](docs/security/review-checklist.md) | Người sửa/thêm skill trong repo này |

## Phạm vi

Repo chỉ chứa **hướng dẫn (markdown)** và **manifest plugin**. **Không có script hay mã thực thi nào** (không `.mjs`/`.js`/`.sh`/`.py`…): skill chỉ là tài liệu để agent đọc, nên cài skill không làm agent chạy thêm lệnh nào của repo này.
Không có dịch vụ chạy nền, không có hook, không có MCP server, không có biến môi trường bắt buộc, không mở cổng mạng.

Cam kết cho mọi thay đổi trong repo: **không thêm file thực thi** (kể cả script "tiện ích") và không thêm chỉ dẫn bắt agent chạy lệnh shell. Cần công cụ thì viết bản mô tả bằng markdown; nếu thật sự phải có mã, đó là một thay đổi riêng cần review bảo mật (xem `review-checklist.md`).

## Rủi ro chính (tóm tắt)

1. **Prompt injection** — yêu cầu, form JSON, tài liệu hoặc phản hồi API do bên thứ ba cung cấp có thể chứa câu lệnh nhắm vào agent.
2. **Mã chạy trong form** — `customScript` / `run_script` là JavaScript thô, chạy trong trình duyệt người dùng cuối.
3. **Rò rỉ bí mật** — token, API key, URL nội bộ dán vào form JSON/prompt rồi bị commit hoặc đưa vào form công khai.
4. **Chuỗi cung ứng** — cài `@dnu/dynaform-builder` không pin tag; cài plugin từ nguồn không tin cậy.
5. **Ghi/ghi đè ngoài ý muốn** — agent lưu form lên backend hoặc đổi file khi người dùng chưa yêu cầu.

## Báo lỗi bảo mật

Không mở issue công khai cho lỗ hổng. Báo trực tiếp cho người bảo trì repo (Hoang Chu Minh) hoặc nhóm an toàn thông tin của Dai Nam University
qua kênh nội bộ, kèm: skill/file bị ảnh hưởng, các bước tái hiện, tác động dự kiến. Lỗ hổng nằm ở `@dnu/dynaform-builder` thì báo tại repo `fe_dynaform`.

## Hạn chế đã biết

- Không có công cụ kiểm tự động form JSON: agent tự kiểm theo `skills/dynaform-build-form/references/checklist.md`, và không đánh giá độ an toàn của URL API, script hay HTML bên trong — người dùng phải xem lại (`form-json-safety.md`).
- Việc cô lập script/embed là trách nhiệm của host (`logic-execution policy`, `embedPolicy`); skill chỉ hướng dẫn cấu hình.
- Skill không thay thế review bảo mật của form trước khi publish lên môi trường thật.
