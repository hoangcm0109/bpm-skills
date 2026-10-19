# Changelog

Phiên bản plugin (`version` trong manifest) tăng mỗi khi nội dung skill đổi — Claude Code chỉ cập nhật khi `version` tăng.
Cách cập nhật: xem [README → Cài đặt & cập nhật](README.md#cài-đặt--cập-nhật).

## 0.2.0 — 2026-10-19 (khớp `@dnu/dynaform-builder` v4.5.2)

- `dynaform-embed-lib`: tag mẫu lên `v4.5.2`; `DynaformBuilder` có `ref` (forwardRef), `form`, `dataUserFill`, `hideSubmitButton` (4.5.0), `isolatedState` (4.5.1), `onError` (4.4.0); bảng lỗi thường gặp theo phiên bản lib; ghi chú thư mục nguồn `builder-core` / `builder-host` (đổi tên ở 4.4.1).
- `dynaform-build-form`: bước nạp form dùng được `DynaformBuilder form={…}`; mfe-dynaform không còn dialog tạo form (tạo trong workspace BPM); đường dẫn nguồn mới `src/lib/builder-core`.
- `dynaform-mfe-module`: bỏ `CreateFormDialog`, thêm nút "Đi tới workspace để tạo form" + biến `REACT_APP_BPM_URL`; module đang dùng lib `v4.5.2`.
- README: hướng dẫn cài đặt, cập nhật, kiểm tra version và quy trình phát hành.

## 0.1.0 — 2026-10-14

- Bản đầu: 8 skill dynaform (`build-form`, `components`, `validation`, `logic-events`, `layout`, `data-source`, `embed-lib`, `mfe-module`) cho Claude Code và Codex.
