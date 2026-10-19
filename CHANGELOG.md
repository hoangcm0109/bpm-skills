# Changelog

Phiên bản plugin (`version` trong manifest) tăng mỗi khi nội dung skill đổi — Claude Code chỉ cập nhật khi `version` tăng.
Cách cập nhật: xem [README → Cài đặt & cập nhật](README.md#cài-đặt--cập-nhật).

## 0.3.0 — 2026-10-19 (khớp `@dnu/dynaform-builder` v4.6.0)

- **Style tuỳ chỉnh**: spec có khoá `custom` (`className` Tailwind + `css` thuần cho khung ngoài, `control` cho chính ô nhập, `label` cho nhãn) → `properties.custom`; `dynaform.mjs` ghi thẳng vào `editable_props.properties`. `dynaform-components` có mục "Style tuỳ chỉnh" (không tự điền `tailwindCss`/`twHash`, builder sinh khi nạp form).
- `dynaform-embed-lib`: tag mẫu `v4.6.0`; `loadFormJson` và hiệu ứng build dần (4.6.0), `embedPolicy.allowCustomCss`, control `table-filter` đã gỡ; thêm dòng vào bảng lỗi. `dynaform-mfe-module` / README: module dùng lib `v4.6.0`.
- `dynaform-components`: bỏ `docs/TABLE_FILTER.md` khỏi danh sách tài liệu (file đã xoá), thêm `docs/CUSTOM_STYLE.md`.
- `dynaform-build-form`: chế độ **build dần** — `scripts/stream-server.mjs` theo dõi file spec và đẩy snapshot qua SSE (chỉ `127.0.0.1`) để trang `/form-manager/stream` của mfe-dynaform vẽ form lớn lên theo từng đợt; quy trình ở `references/stream-preview.md`.
- Trang xem trước có thêm tab **Editor** (canvas builder cập nhật dần qua `loadFormJson` của lib ≥ 4.6.0); `stream-server.mjs` đọc được file spec có BOM.
- `dynaform.mjs`: `buildForm(spec, { stableIds })` sinh id tất định theo `name` (build lặp lại giữ nguyên id). Hành vi build thường không đổi.
- `SECURITY.md` / `docs/security/review-checklist.md` / `AGENTS.md`: ghi cam kết riêng cho `stream-server.mjs`.

## 0.2.0 — 2026-10-19 (khớp `@dnu/dynaform-builder` v4.5.2)

- `dynaform-embed-lib`: tag mẫu lên `v4.5.2`; `DynaformBuilder` có `ref` (forwardRef), `form`, `dataUserFill`, `hideSubmitButton` (4.5.0), `isolatedState` (4.5.1), `onError` (4.4.0); bảng lỗi thường gặp theo phiên bản lib; ghi chú thư mục nguồn `builder-core` / `builder-host` (đổi tên ở 4.4.1).
- `dynaform-build-form`: bước nạp form dùng được `DynaformBuilder form={…}`; mfe-dynaform không còn dialog tạo form (tạo trong workspace BPM); đường dẫn nguồn mới `src/lib/builder-core`.
- `dynaform-mfe-module`: bỏ `CreateFormDialog`, thêm nút "Đi tới workspace để tạo form" + biến `REACT_APP_BPM_URL`; module đang dùng lib `v4.5.2`.
- README: hướng dẫn cài đặt, cập nhật, kiểm tra version và quy trình phát hành.

## 0.1.0 — 2026-10-14

- Bản đầu: 8 skill dynaform (`build-form`, `components`, `validation`, `logic-events`, `layout`, `data-source`, `embed-lib`, `mfe-module`) cho Claude Code và Codex.
