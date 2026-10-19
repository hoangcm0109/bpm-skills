# Checklist review khi sửa bpm-skills

Áp dụng cho mọi PR chạm `skills/`, `.claude-plugin/`, `.codex-plugin/`, `.agents/`.

## A. Nội dung skill (`SKILL.md`, `references/`)

- [ ] Không có chỉ dẫn yêu cầu agent: tải/chạy mã từ mạng, đọc `.env`/khoá SSH/cookie/token, tắt sandbox hoặc permission, bỏ qua quy tắc khác.
- [ ] Không có bí mật, URL nội bộ có chữ ký, dữ liệu cá nhân thật trong ví dụ (dùng `example.com`, giá trị giả).
- [ ] Ví dụ API dùng domain công khai/giả; không trỏ máy nội bộ cụ thể (IP LAN, hostname server).
- [ ] Hành động có tác dụng phụ (lưu backend, publish, commit/push, đổi version) đều ghi rõ "hỏi người dùng trước".
- [ ] `description` trong frontmatter mô tả đúng phạm vi, không rộng đến mức kích hoạt ngoài ý muốn.
- [ ] Mọi khẳng định về lib bám nguồn thật; khẳng định chưa kiểm chứng được ghi rõ là chưa kiểm chứng.
- [ ] Bảng "bẫy hay gặp"/quy tắc không khuyến khích dùng `customScript` làm mặc định.

## B. Script (`scripts/dynaform.mjs`)

- [ ] Chỉ import module chuẩn cần thiết (`node:fs`, `node:crypto`); không thêm dependency ngoài.
- [ ] Không có `child_process`, `eval`, `new Function`, `fetch`/`http(s)`, `net`, đọc `process.env`.
- [ ] Chỉ đọc file truyền vào; chỉ ghi `--out`; không tạo thư mục/ghi nơi khác.
- [ ] Không thực thi hay nội suy `code`/`url`/HTML từ spec; chỉ chép nguyên văn sang đầu ra.
- [ ] Lỗi in ra không kèm nội dung nhạy cảm của spec ngoài tên field.
- [ ] Đã chạy lại:
  ```bash
  node skills/dynaform-build-form/scripts/dynaform.mjs build skills/dynaform-build-form/assets/example-spec.json --out /tmp/form.json
  node skills/dynaform-build-form/scripts/dynaform.mjs validate /tmp/form.json
  ```
- [ ] Ca lỗi vẫn exit 1 (trùng name, ref treo, type lạ, select thiếu options).

## B2. Script cầu nối (`scripts/stream-server.mjs`)

- [ ] Chỉ import `node:fs`, `node:http` và `./dynaform.mjs`; không `child_process`, `eval`, `new Function`, `fetch`, `net` ra ngoài, không đọc `process.env`.
- [ ] Chỉ `listen` trên `127.0.0.1`; kiểm `Host` và `Origin`; chỉ phục vụ `GET`; không endpoint ghi.
- [ ] Chỉ đọc file spec truyền vào; không ghi file.
- [ ] Đã thử: Host lạ → 403, Origin ngoài localhost → 403, file spec đang ghi dở không làm server sập.

## C. Manifest plugin

- [ ] `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json` cùng `name`/`version`.
- [ ] Không thêm `hooks`, `mcpServers`, `commands`, `agents` hay biến môi trường mà chưa được review riêng — bộ này hiện **không có**.
- [ ] `marketplace.json` `source` trỏ `./` (repo hiện tại), không trỏ repo bên ngoài.
- [ ] `repository` trỏ đúng repo GitHub chính thức; `homepage` là URL đã xác nhận.
- [ ] Đã chạy `claude plugin validate .` và `claude plugin validate .claude-plugin/plugin.json`.

## D. Tài liệu ví dụ & assets

- [ ] `assets/*.json` không chứa `run_script`/`customScript` trừ khi là ví dụ minh hoạ cảnh báo, có ghi chú rõ.
- [ ] Không có file nhị phân hoặc file lớn không giải thích được.

## E. Release

- [ ] Tăng version đồng bộ ở 3 manifest, ghi thay đổi liên quan bảo mật trong mô tả PR.
- [ ] Gắn tag; người dùng cài theo tag (xem `using-skills.md`).
- [ ] Nếu đổi hành vi script hoặc quyền cần cho skill: cập nhật `SECURITY.md` và `using-skills.md`.
