# Checklist review khi sửa bpm-skills

Áp dụng cho mọi PR chạm `skills/`, `docs/`, `.claude-plugin/`, `.codex-plugin/`, `.agents/`.

## A. Nội dung skill (`SKILL.md`, `references/`)

- [ ] Không có chỉ dẫn yêu cầu agent: tải/chạy mã từ mạng, đọc `.env`/khoá SSH/cookie/token, tắt sandbox hoặc permission, bỏ qua quy tắc khác.
- [ ] Không có bí mật, URL nội bộ có chữ ký, dữ liệu cá nhân thật trong ví dụ (dùng `example.com`, giá trị giả).
- [ ] Ví dụ API dùng domain công khai/giả; không trỏ máy nội bộ cụ thể (IP LAN, hostname server).
- [ ] Hành động có tác dụng phụ (lưu backend, publish, commit/push, đổi version) đều ghi rõ "hỏi người dùng trước".
- [ ] `description` trong frontmatter mô tả đúng phạm vi, không rộng đến mức kích hoạt ngoài ý muốn.
- [ ] Mọi khẳng định về lib bám nguồn thật; khẳng định chưa kiểm chứng được ghi rõ là chưa kiểm chứng.
- [ ] Bảng "bẫy hay gặp"/quy tắc không khuyến khích dùng `customScript` làm mặc định.

## B. Không có mã thực thi

- [ ] Không có file thực thi hoặc script trong `skills/` và gốc repo: `.mjs`, `.cjs`, `.js`, `.ts`, `.sh`, `.bash`, `.ps1`, `.bat`, `.cmd`, `.py`, `.rb`, `.exe`… Kiểm bằng cách liệt kê file trong `skills/` (chỉ được có `SKILL.md` và file `.md`).
- [ ] Không có chỉ dẫn bắt agent chạy lệnh shell, `node`, `npx`, `curl`, `git` nhân danh skill. Ví dụ code (TSX/JSON) trong tài liệu chỉ để đọc, không phải lệnh chạy.
- [ ] Không thêm dependency, `package.json`, workflow CI chạy mã trong repo mà chưa review bảo mật riêng.
- [ ] Nếu thật sự cần mã thực thi: tách thành thay đổi riêng, nêu lý do, cập nhật `SECURITY.md` + `using-skills.md` và review từng dòng (không mạng, không `child_process`/`eval`, không đọc biến môi trường).

## C. Manifest plugin

- [ ] `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json` cùng `name`/`version`.
- [ ] Không thêm `hooks`, `mcpServers`, `commands`, `agents` hay biến môi trường mà chưa được review riêng — bộ này hiện **không có**.
- [ ] `marketplace.json` `source` trỏ `./` (repo hiện tại), không trỏ repo bên ngoài.
- [ ] `repository` trỏ đúng repo GitHub chính thức; `homepage` là URL đã xác nhận.
- [ ] Đã chạy `claude plugin validate .` và `claude plugin validate .claude-plugin/plugin.json`.

## D. Tài liệu ví dụ

- [ ] Ví dụ form JSON/khoá gọn trong `references/` không chứa `run_script`/`customScript` trừ khi là ví dụ minh hoạ cảnh báo, có ghi chú rõ.
- [ ] Ví dụ JSON hợp lệ cú pháp, `id` là UUID giả, không có token/URL nội bộ.
- [ ] Không có file nhị phân hoặc file lớn không giải thích được.

## E. Release

- [ ] Tăng version đồng bộ ở 3 manifest, ghi thay đổi liên quan bảo mật trong mô tả PR.
- [ ] Gắn tag; người dùng cài theo tag (xem `using-skills.md`).
- [ ] Nếu đổi quyền cần cho skill hoặc thêm bất kỳ mã thực thi nào: cập nhật `SECURITY.md` và `using-skills.md`.
