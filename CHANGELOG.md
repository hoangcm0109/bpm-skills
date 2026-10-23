# Changelog

Phiên bản plugin (`version` trong manifest) tăng mỗi khi nội dung skill đổi — Claude Code chỉ cập nhật khi `version` tăng.
Cách cập nhật: xem [README → Cài đặt & cập nhật](README.md#cài-đặt--cập-nhật).

## 0.6.2 — 2026-10-23 (ví dụ đầy đủ cho từng skill + control `text` không in tên biến)

- **Ví dụ đầy đủ cho cả 8 skill**: mỗi skill có `references/examples.md`; 12 spec mới chạy được (build + validate sạch bằng `dynaform.mjs`): `dynaform-build-form` (`example-contact`, `example-wizard`), `dynaform-components` (`example-input-catalog`, `example-layout-controls`), `dynaform-validation` (`example-validation`), `dynaform-logic-events` (`example-rules`, `example-flows`, `example-table-row-actions`), `dynaform-layout` (`example-layout-recipes`), `dynaform-data-source` (`example-data-source`). `dynaform-embed-lib` có 13 ví dụ TSX bám export thật của lib; `dynaform-mfe-module` có ví dụ thêm domain mới từ endpoint tới route (mô phỏng domain `application` của mfe-dynaform). Mỗi `SKILL.md` link tới ví dụ; `AGENTS.md` + `README.md` ghi lệnh build toàn bộ spec ví dụ.
- Ví dụ ẩn/hiện field dùng `load` + `field_state: hide` rồi rule hiện lại (không dùng `hidden: true` tĩnh — theo `docs/ACTION_ENGINE.md` không bật lại được bằng logic).
- **`dynaform.mjs`**: `text` không còn tự gán `label` = tên biến (nhãn rỗng khi spec không đặt `label`) và mặc định `styles.showLabel: "no"`. Trước đây dòng tên biến (`form_title`, `sec_info_title`…) hiện phía trên nội dung Text. Muốn hiện nhãn: `label` + `styles: { "showLabel": "yes" }`.
- Lib `fe_dynaform`: Text có nhãn trùng tên biến của chính nó thì không in nhãn (form đã lưu trước đó hết hiện `form_title`…; nhãn đặt chủ ý vẫn hiện). `spec-format.md` ghi chú lại.

## 0.6.1 — 2026-10-22 (khớp `@dnu/dynaform-builder` v4.8.0)

- Lib đã phát hành tag **`v4.8.0`** (gồm `alignSelf`, step `confirm`, `dialog.fillFromRow` / `awaitSubmit`, hành động hàng của table chạy flow, sửa grid và CSS button): tag mẫu `v4.8.0` ở `dynaform-embed-lib` (kèm mục "Từ 4.8.0"), `dynaform-mfe-module`, README; ghi chú "lib mới hơn v4.7.0 / chưa có tag" đổi thành "lib ≥ 4.8.0". `dynaform-mfe-module` nêu rõ module có thể còn ở tag cũ — kiểm `package.json` của mfe-dynaform.

## 0.6.0 — 2026-10-22 (alignSelf, step confirm, row flow của table — lib `@dnu/dynaform-builder` v4.8.0)

Đồng bộ với các thay đổi mới của lib `fe_dynaform` (xem `.claude/memory-logs/2026-10-22.md` của lib).

- **`alignSelf`** (`start` mặc định | `center` | `end` | `stretch`, theo viewport): căn dọc control trong hàng lưới. Spec có khoá `alignSelf` → `styles.alignSelf` (`start` không ghi ra); script kiểm giá trị. `dynaform-layout`: mục giải thích, công thức "ô nhập + nút" dùng `alignSelf: "end"`, công thức "hàng bộ lọc", checklist.
- **Step `confirm`** (`message`, `title`, `confirmLabel`, `cancelLabel`, `destructive`) và **`dialog.fillFromRow` / `dialog.awaitSubmit`**: bảng step trong `dynaform-logic-events`; ngữ nghĩa **huỷ** (Hủy / đóng dialog đang chờ → flow dừng lặng lẽ, `catch` không chạy, `continueOnError` không cứu). `dynaform.mjs`: nhận `confirm`, kiểm `message`, kiểu của `fillFromRow` / `awaitSubmit`, cảnh báo `awaitSubmit` thiếu nút xác nhận.
- **Hành động từng dòng của `table` chạy action flow** (`props.table.actionColumn.actions[].flow`, `$row.data.<cột>` / `$row.key` / `$row.index`): `dynaform-logic-events` §7.16 (xoá có xác nhận + tải lại bảng, sửa bằng dialog chờ xác nhận, xem chi tiết), `dynaform-components` mục "Hành động từng dòng của table"; sửa mục giới hạn "action hàng chưa đi qua eventHandlers". `dynaform.mjs` kiểm flow trong hành động hàng (id step, tham chiếu, `confirm`…), cảnh báo khi còn trường cũ (`confirm` / `dialogTarget` / `dataSourceId` / `redirectUrl`) cạnh `flow`, và đổi `push_table.tableId` (name → id) cả trong flow của hành động hàng.

## 0.5.0 — 2026-10-22 (khớp `@dnu/dynaform-builder` v4.7.0)

Bổ sung kiến thức cho Agent Build Form: bố cục, control layout và toàn bộ event/action.

- **`dynaform-layout` viết lại**: mô hình lưới 12 cột (mỗi vùng chứa là một lưới riêng), `colSpan` + `colStart`, **bảng số cột cho từng loại control**, quy tắc xếp hàng, thang chọn container / columns / grid / tab / steps, 8 công thức (2-3-4 cột, 9+3, nút căn phải, 8+4, nhóm có khung, grid gộp ô), checklist. Ghi rõ lib tính **desktop trước** (`colSpan` gốc áp mọi cỡ; `md` < 1024px, `sm` < 768px theo container query).
- **Sửa lỗi sai trong skill cũ**: `overrides: { sm: { styles: {…} } }` bị lib bỏ qua — dạng đúng là `overrides.<vp>.properties.style`. Script nay nhận dạng gọn `{ sm: { colSpan: 12 } }` (và dạng cũ) rồi xuất đúng dạng của lib. Ví dụ Tỉnh/Quận trong `example-spec.json` 4+4 sửa thành 6+6.
- **Script `dynaform.mjs`**: mặc định `mobile: "stack"` (control colSpan < 12 tự xuống 12 cột khi < 768px; `"keep"` để tắt); `colStart`; type `grid` (con lấp ô theo thứ tự, `rows` tự tính, kiểm số ô), `list`/`nested-list`/`form-loop` nhận con; khoá spec `grid`, `list`, `loop`, `container`; overlay ghi đúng khoá theo type (`properties.dialog` / `drawer` + `side` / `bottomSheet`); cảnh báo hàng chưa đủ 12 cột; `overrides.lg` cảnh báo vô tác dụng.
- **`dynaform-components`**: mục "Control layout" mô tả từng control (container, columns 2/3/4, grid, tab, steps, dialog/drawer/bottom-sheet, list/nested-list, form-loop, sub-form): khoá cấu hình, cách đặt con (`tabId`, theo thứ tự, theo ô), giá trị hợp lệ, lỗi thường gặp. Ghi chú: tiêu đề `container` chưa lưu được vào JSON ở lib 4.7.0 (dùng control `text`).
- **`dynaform-logic-events` viết lại**: bảng event theo từng loại control (và event nào mang `$event.payload`), `condition`, `embed:*`, `menu:*`; tham chiếu đầy đủ 23 step với trường bắt buộc; `ValueSource` (literal/ref/template/map), mọi root đường dẫn (`$form`, `$steps`, `$row`, `$event`, `$error`, `$runtime`), điều kiện lồng `all`/`any`, `call_api` (auth, mapping, bodyMode, CORS), `push_table`, `for_each`, `parallel`, `try`; 15 công thức (submit, chọn → điền, nạp khi mở, dialog, xoá + làm mới bảng, tìm kiếm, for_each, tải file, embed → flow…); giới hạn đã biết (nút có flow `click` bỏ qua submit mặc định, export code bỏ `load`/flow phức tạp…). Mọi ví dụ được chạy qua script kiểm tra.
- **Script kiểm flow tự viết**: `events[].flow` được kiểm step type, id trùng, `branch.then` là một step, condition, `set_values`/`field_state`/`dialog` trỏ đúng `name`, `$steps.<id>` có trong flow, `call_api` thiếu `url`/`apiRef`, `navigate` bị `javascript:`…; event không hợp với type cảnh báo. `push_table.tableId` viết bằng name, script đổi sang id lúc build. Thêm toán tử `greaterThanOrEqual`/`lessThanOrEqual`, event `condition`.
- `stream-server.mjs`: không cảnh báo hàng chưa đủ 12 cột khi đang ghi dở.

## 0.4.0 — 2026-10-22 (khớp `@dnu/dynaform-builder` v4.7.0)

- **Control có sẵn trước, `custom-embed` là lựa chọn cuối**: `dynaform-build-form` (bước chọn component) và `dynaform-components` có thang chọn 4 bước và bảng "nhu cầu → control chuyên dụng" (`table`, `timeline`, `descriptions`, `record-*`, `stat-cards`, `sortable-list`, `matrix`, `form-loop`, `sub-form`…). Spec `custom-embed` **bắt buộc** có `reason`; thiếu thì script báo lỗi.
- **Embed ưu tiên React (TSX) + Tailwind**: spec có khoá `embed` (`code`, `inputs`, `outputs`, `events`, `valueType`, `height`, `sampleData`) → `properties.embed` (mặc định `mode: "sandbox"`, `framework: "react"`, `tailwind: true`; `code` ghi vào cả `source` và `js`). Script kiểm `inputs.field` / `outputs.to` / event đã khai báo, bắt lỗi cú pháp của `code` (JSX thô, `import`), cảnh báo class ghép lúc chạy, CSS thuần, Template/JS thuần. Tài liệu mới `references/custom-embed.md`. **Giới hạn**: script không biên dịch TSX và không sinh `tailwindCss` — người dùng phải mở form trong builder → Mã nhúng → Lưu.
- **Ưu tiên action flow, hạn chế `hidden`**: `dynaform-logic-events` có mục riêng (truyền dữ liệu bằng `$steps.<id>.output` / `$event.payload` / `set_values` trong một flow, không cất tín hiệu vào field ẩn); control `hidden` chỉ giữ cho payload submit / `dataUserFill`. Script cảnh báo mỗi control `hidden` và mỗi `customScript`.
- `dynaform.mjs`: registry thêm `custom-embed`, `timeline`, `descriptions`, `json-tree`, `code`, `form-loop`, `sub-form`, `record-picker`, `record-gallery`, `stat-cards`, `sortable-list` (trước đây bị từ chối "không có trong registry"). Dùng thêm `node:vm` **chỉ để biên dịch** (`new Script`) kiểm cú pháp — không chạy mã; cập nhật `SECURITY.md`, `AGENTS.md`, `docs/security/review-checklist.md` cho khớp.
- Lib v4.7.0: kéo mép trái của control để resize (ghi `colStart` + `colSpan`); `dynaform-layout` ghi chú `colStart`. Tag mẫu `v4.7.0` ở `dynaform-embed-lib`, `dynaform-mfe-module`, README.
- `dynaform-logic-events`: ghi chú theo `docs/ACTION_ENGINE.md` rằng field ẩn tĩnh (`hidden: true`) không bật lại được bằng logic — ví dụ "Cách 1" chưa được kiểm trên runtime thật.

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
