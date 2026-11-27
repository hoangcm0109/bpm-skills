---
name: dynaform-embed-lib
description: Nhúng thư viện @dnu/dynaform-builder vào app React/MFE — cài theo git tag, import style.css, DynamicFormBuilderProvider (backendUrl), DynamicFormBuilder (builder-host, editor/preview/release), DynamicCoreBuilder (builder-core) + dataFormDesign, bảng đổi tên v6, props/events/ref, embedPolicy, chạy lib build local (start:linked). Dùng khi tích hợp, hiển thị/điền/submit form trong host app, hoặc debug lỗi tích hợp lib.
user-invocable: false
---

# Nhúng @dnu/dynaform-builder

Lib phát hành bằng **git tag** `vX.Y.Z` của repo `fe_dynaform`, `dist/lib` build sẵn và commit cùng tag.

## 1. Cài đặt

```jsonc
"@dnu/dynaform-builder": "git+http://git.dnu.edu.vn/dnu/fe_dynaform.git#v6.1.0"
```

(`v6.1.0` là tag mới nhất lúc viết skill, `package.json` ở tag ghi `6.1.0`. Các prop ghi "từ 4.5.0" ở dưới cần tag ≥ 4.5.0. Repo chỉ có tag `v5.2.0` rồi nhảy tới `v5.6.7` — **không có tag riêng cho 5.3.0 → 5.6.6**; mọi tính năng của các bản đó nằm trong `v5.6.7`, xem "Từ 5.3.0" bên dưới.)

- **pnpm + tag có chú thích**: `pnpm install` ghi vào `pnpm-lock.yaml` mã của *tag object* (v6.1.0: `9348704…`), lần cài `--frozen-lockfile` sau sẽ lỗi. Thay bằng mã **commit** của tag (`git ls-remote <repo> 'refs/tags/v6.1.0^{}'` → `4ea089d…`) ở mọi chỗ trong lockfile.

- Luôn `git+http://` (http thường → `TAR_BAD_ARCHIVE`) và **pin tag**; không dùng `#main`/nhánh.
- Peer (**từ 5.0.0**, `feat!`): `react`, `react-dom` ≥ 18, `lucide-react` ≥ 0.562 < 2, `@sth87/shadcn-design-system` ≥ 0.2.7 < 0.4, `@tanstack/react-query` ^5, `@dnd-kit/core` ^6.1, `@dnd-kit/sortable` ^10, `@dnd-kit/utilities` ^3.2.2, `zod` ^4, `react-hook-form` ^7.56 — **host phải tự cài** (trước 5.0.0 các gói này bundle trong lib; lib ≤ 4.x không cần khai). Host không cần bọc `QueryClientProvider` riêng cho lib.
- Import CSS **một lần** ở entry: `import "@dnu/dynaform-builder/style.css";` (host không cần Tailwind để lib hiển thị đúng).
- Vite: `resolve.dedupe: ["react", "react-dom"]`. Webpack Module Federation: share `react`/`react-dom` singleton.
- Kiểm tra tag mới nhất trước khi ghi version — đừng bịa; đọc `package.json` của fe_dynaform hoặc `git ls-remote --tags`.

### Đổi tên ở v6.0.0 (breaking, không có alias)

Lib chia hai lớp: **builder-core** (`src/lib/builder-core`, bộ kéo thả + runtime, không gọi API) và **builder-host** (`src/lib/builder-host`, bọc core, tự gọi API dynaform). Core là con của host.

| Trước v6 | Từ v6 | Lớp |
|---|---|---|
| `DynamicFormBuilder` (+ `Props`, `Mode`, `Handle`) | `DynamicCoreBuilder` (+ `Props`, `Mode`, `Handle`) | builder-core |
| `DynaformBuilder` (+ `Props`, `Error`) | `DynamicFormBuilder` (+ `Props`, `Error`) | builder-host |
| `DynaformBuilderProvider` | `DynamicFormBuilderProvider` | builder-host |
| `DynamicFormBuilderHandle` (handle của core) | vẫn export, là alias của `DynamicCoreBuilderHandle` (dùng cho `ref` của host) | — |
| `shellUrl` trong config Provider, `bootstrapStandaloneAuth` | **bỏ** — lib không chuyển trang khi 401 nữa | builder-host |
| `docs/DYNAFORM_BUILDER_INTEGRATION.md` / `docs/DYNAMIC_FORM_BUILDER_INTEGRATION.md` | `docs/DYNAMIC_FORM_BUILDER_INTEGRATION.md` (host) / `docs/DYNAMIC_CORE_BUILDER_INTEGRATION.md` (core) | — |

Chú ý tên `DynamicFormBuilder` **đổi nghĩa**: trước v6 là core, từ v6 là host. Code ghim lib < 6 mà dùng `DynamicFormBuilder` là đang dùng core. Nâng host lên v6: đổi `DynamicFormBuilder` → `DynamicCoreBuilder` **trước**, rồi `DynaformBuilder` → `DynamicFormBuilder`, rồi bỏ `shellUrl`.

## 2. Cấu hình URL — `DynamicFormBuilderProvider`

```tsx
import { DynamicFormBuilderProvider } from "@dnu/dynaform-builder";

<DynamicFormBuilderProvider config={{ backendUrl: "https://<gateway>" }}>
  <App />
</DynamicFormBuilderProvider>
```

- `backendUrl` = **gốc gateway**: lib tự suy `…/query/v1/…` (GET) và `…/command/v1/…` (ghi). Có thể truyền riêng `queryUrl` / `commandUrl`.
- **Đăng nhập là việc của host** (từ 6.0.0): lib chỉ gửi cookie `access_token` của phiên host dạng `Authorization: Bearer`. 401 (như mọi lỗi khác) được ném thành `ApiError` — lib không chuyển trang, không xoá cookie. Lib < 6 có `shellUrl` (redirect `{shellUrl}/login` khi 401); từ 6.0.0 truyền `shellUrl` là lỗi typecheck.
- `config` phải ổn định (useMemo) — đừng tạo object mới mỗi render.
- Tuỳ chọn khác: `setRuntimeConfig()`, `useDynaformConfig()`.

## 3. Component host-ready — `DynamicFormBuilder`

Tự gọi API (form-design, item-controls, variables, save…) rồi render engine.

```tsx
<DynamicFormBuilder idForm={id} mode="editor" onSaved={…} onClose={…} embedPolicy={EMBED_POLICY} />
```

| `mode` | Hiển thị |
|---|---|
| `editor` (mặc định) | màn thiết kế, `fixed inset-0` |
| `preview` | overlay có header + nút đóng |
| `release` | runtime thuần cho người dùng cuối, theo kích thước parent |

Props chính: `idForm` (bắt buộc nếu không truyền `form`), `environment` (tuỳ chọn, `DEV|STG|PROD`… — có thì GET kèm `?environment=`; id form đã gắn với một môi trường nên thường không cần truyền), `onSaved`, `onSaveDraft`, `onSaveAsControl`,
`onError`, `onClose`, `onSubmitForm`, `onNext`/`onPrev`, `onCreateVariable`, `dataVariableExisting`, `envValues` (từ 5.8.0), `embedPolicy`, `onMessage`, `debugTrace`, `showCloseButton`, `className`.
- Remount khi `idForm` hoặc `environment` đổi.
- **Cache theo `mode` (lib ≥ 5.6.7)**: `preview`/`release` giữ form đã tải trong cache (xem lại thì hiện ngay; quá **60 giây** thì tải lại ngầm rồi thay nội dung khi xong; bỏ khỏi cache sau 10 phút), form nhúng (`loadFormById`) cũng được dùng chung request và giữ 60 giây (lỗi không được giữ). `editor` **không** dùng cache — luôn tải mới, vì editor không hydrate lại từ dữ liệu cũ; danh sách nhóm item control chỉ tải ở `editor`. Hệ quả: vừa lưu/publish xong mà mở `release` ngay có thể thấy bản cũ tối đa ~60 giây; cần ngay thì truyền `form` (xem bên dưới) thay vì `idForm`.
- **Từ 4.5.0** — thay được wrapper tự viết ở host quanh core:
  - `form`: form JSON host đã có (một version cụ thể, form vừa thực thi…) dùng trực tiếp, **không** gọi API chi tiết; ưu tiên hơn `idForm`. Giữ reference ổn định.
  - `dataUserFill` (preview/release): giá trị điền sẵn, key theo `name`. Giữ reference ổn định.
  - `hideSubmitButton` (mặc định `true`): ẩn nút Gửi của runtime; host tự có nút và lấy giá trị bằng `ref.current.onSubmit()` (null = không hợp lệ).
  - `ref`: `DynamicFormBuilder` là `forwardRef`, handle = `DynamicCoreBuilderHandle` của lõi (`onSubmit`, `getFormJson`, undo/redo, `setViewport`…), dùng ở cả editor lẫn preview/release.
  - `isolatedState` (**4.5.1**, preview/release): state runtime riêng; bật khi nhiều form mount cùng trang (modal, task form).
- **Từ 5.0.0 → 5.2.0** (có tag): 5.0.0 đưa các gói dùng chung với host thành `peerDependencies` (xem mục 1); 5.1.0 editor tự phục hồi khi bản nháp đang sửa đã bị người khác publish; 5.2.0 canvas đặt control lên ô lưới tường minh, preview đổi kích thước được, container không đệm, soạn thảo văn bản đúng hiển thị. 4.9.0: đọc `category`/`sub_group_code` từ item control; 4.8.1–4.8.2: sửa nhãn khối text và externalize subpath react.
- **Từ 5.3.0** (nay đã nằm trong tag `v5.6.7`; trước đó chỉ có qua build local, shell nạp bằng `yarn build:lib:shell` → tgz):
  - 5.3.0 — `table`: `props.table.rowClickActionKey` (bấm dòng chạy flow của hành động); control bị ẩn bằng logic giải phóng cả ô lưới.
  - 5.4.0 — `call_api` `bodyEncoding: "multipart"`; control `file` `fileValidations.localOnly` (giữ `File` trong trình duyệt, form lưu `local-file://<id>`).
  - 5.5.0 — `table`: `cellType: "lines"` + `linesExpression` (nhiều dòng, `{ prefix, text, tone }`).
  - 5.6.0 / 5.6.1 — nút: `styles.buttonWidth` (`full`|`auto`) + `styles.buttonAlign` (`start`|`center`|`end`); 5.6.1 sửa căn lề (khung bọc nút `w-full`).
  - 5.6.2 — `select` nhận `attributes.disabled` (rule `disable`/`enable`, `field_state`, thuộc tính tĩnh).
  - 5.6.3 — `file`: xem trước trong dialog (PDF/ảnh iframe, Office qua `view.officeapps.live.com`), giá trị có sẵn hiện vào danh sách.
  - 5.6.4 — `reset-button` mặc định `type="reset"` (trước đây thành submit → mở modal "Dữ liệu form đã gửi").
  - 5.6.5 — PDF nhúng bằng blob; nút xem/tải/xoá file không còn gửi form.
  - 5.6.6 → 5.6.7 (git chỉ có tag `v5.6.7`, không tách được từng bản; task-log của lib gom chung một lần release) — `tab`: `tabs[].hideWhen` ẩn tab theo điều kiện (xem `dynaform-components`); cache theo `mode` ở `DynamicFormBuilder` (mục 3); `file` `localOnly` xem trước được bằng blob URL tạm (thu hồi khi đóng dialog) — theo chú thích trong code lib, file Word/Excel/PowerPoint cần URL công khai nên không xem trước được với `local-file://`.
  - Cần các tính năng trên thì pin `#v5.6.7` (hoặc mới hơn). Ngày 2026-11-26 cả ba host đã lên 6.0.0: `mfe-dynaform` và `mfe-workflow` ghim `#v6.0.0`, `mfe-shell-app` nạp `vendor/dnu-dynaform-builder-6.0.0.tgz` (kiểm lại `package.json` trước khi khẳng định).
  - Phần lib **chưa tag** (ví dụ agent bridge — `createSseRunAgentTurn`, `defineClientTool`, props `runAgentTurn`…: **không** có trong `v5.6.7`, mới là thay đổi chưa commit ở working tree của `fe_dynaform`): dùng qua shell bằng `yarn build:lib:shell` ở `fe_dynaform` (đóng gói `vendor/dnu-dynaform-builder-<ver>.tgz` vào `mfe-shell-app`, sửa `package.json`), rồi `pnpm install` ở shell và **khởi động lại shell** — cài khi dev server đang chạy làm thư mục lib biến mất, shell báo `ENOENT … dist/lib/style.css`. Runner `mfe-dynaform` ghim tag thì **không** có bản chưa tag.
- **Từ 5.8.0 → 5.8.3** (có tag; mục này chỉ ghi phần **biến môi trường** — các thay đổi 5.7.x chưa đối chiếu ở đây): form viết địa chỉ API bằng `@{NAME}` / `${NAME}` (cách dùng và luật tên: `dynaform-data-source` › Địa chỉ API theo môi trường).
  - 5.8.0 — lib thay `@{NAME}` ngay trước khi gửi request chạy ở trình duyệt (`call_api`, select, bảng, submit) bằng giá trị trong `env_values` (gốc form hoặc `form_content`, do endpoint render trả cạnh `bound_variables`); prop **`envValues`** (`Record<string, string>`) của `DynamicFormBuilder` ghi đè `env_values`; ô "Biến môi trường" trong Data Source (chọn/tạo biến, bảng xem trước DEV/STG/PROD).
  - 5.8.1 — ô URL của step `call_api` cũng chọn được biến môi trường; menu "Thêm bước" cuộn được khi mở trong dialog.
  - 5.8.2 — sửa `call_api` có URL là `@{NAME}` bị chặn nhầm là "tham số đường dẫn chưa điền" (không gửi request, lỗi bị `continueOnError` nuốt).
  - 5.8.3 — **mở theo `idForm` mà host không truyền `envValues` và form chưa có `env_values`** thì lib tự gọi `GET v1/env-variables` và dùng giá trị của môi trường form đang chạy (`environment` truyền vào, không có thì `environment` của form, mặc định `DEV`). Trước 5.8.3 host mở theo `idForm` phải tự truyền `envValues`. Truyền `envValues` thì lib **không** gọi. Chỉ `DEV`/`STG`/`PROD` có giá trị; môi trường khác (`UAT`, `CORE`…) thì `@{NAME}` giữ nguyên.
  - Lưu ý khi host mở theo `idForm`: endpoint `v1/env-variables` trả giá trị **cả ba môi trường** cho trình duyệt (chỉ dùng của môi trường hiện tại) và token của người dùng cuối phải gọi được endpoint này; không gọi được thì lib bỏ qua im lặng. Nếu không muốn lộ, host dùng endpoint render (server trả `env_values` đúng một môi trường) hoặc truyền `envValues` sẵn.
  - Chưa thay biến (còn nguyên `@{NAME}`): `queries` của layout runtime, nút submit kiểu cũ, `navigate.download`, upload file, bảng tải từ xa — chưa kiểm hết.
- **Từ 5.9.0**: container `styles.showShadow: "no"` (card có viền mà không bóng).
- **Từ 6.0.0** (`feat!`, có tag): đổi tên hai lớp và bỏ `shellUrl` / `bootstrapStandaloneAuth` — bảng "Đổi tên ở v6.0.0" ở mục 1. Không đổi props hay hành vi khác.
- **Từ 6.1.0** (có tag): control hiển thị cho màn dashboard — `chart` (cột / đường / vùng / tròn / donut), `gauge` (đồng hồ đo) và thẻ KPI của `stat-cards` (`format`, `unit`, `deltaPath`, `deltaInverted`, `sparklinePath`); `chart` tự gọi API được (`data.mode: "request"`). Chi tiết: `dynaform-components` › "Dashboard". `recharts` được bundle trong một chunk riêng (~620 kB, chỉ tải khi form có biểu đồ) nên host **không** phải cài thêm gói. Form cũ không đổi; lib < 6.1.0 gặp `chart`/`gauge` sẽ báo "type không có trong registry".
- **Từ 4.8.0**: `properties.style.alignSelf` (căn dọc control trong hàng lưới), hành động từng dòng của `table` chạy action flow (`actions[].flow`, `$row`), step `confirm`, `dialog.fillFromRow` / `awaitSubmit`; grid giữ đúng ô khi lưu/nạp và không xoá control khi thả; CSS "Ô nhập" của button không còn ăn thanh công cụ canvas. Form lưu bằng bản cũ vẫn chạy (cấu hình hành động hàng cũ tự chuyển thành flow khi bấm).
- **Từ 4.6.0**: `ref.current.loadFormJson(json, { snapshot?, progress? })` thay toàn bộ form của editor từ host (build dần; editor chỉ đọc `dataFormDesign` lúc mount); canvas có hiệu ứng build dần. Mọi control nhận **CSS thuần + class Tailwind** (`properties.custom`, panel "CSS tuỳ chỉnh" ở tab Thiết kế; host tắt bằng `embedPolicy.allowCustomCss: false`). Control `table-filter` đã **gỡ** (không migrate): form cũ hiện khung cảnh báo tại chỗ đó.
- `onError` (**4.4.0**, editor): gọi khi lưu form / lưu thành control thất bại; lib đã tự toast message chi tiết của server và `console.error` toàn bộ response. `error` = `{ action, message, status?, details[], body?, cause }` để host ghi log riêng.

```tsx
const ref = useRef<DynamicCoreBuilderHandle>(null);
<DynamicFormBuilder ref={ref} form={formJson} dataUserFill={values} mode="release" isolatedState />
const values = await ref.current?.onSubmit();
```
- `embedPolicy` khai báo **ngoài component** (lib so sánh theo reference). `imageFetch: [origin…]` cho phép khung sandbox tải hộ ảnh `http`; lib tự thêm origin API của form + origin trang.
- `onMessage({ level, message })` nếu muốn dùng toast của host (nếu không lib tự hiện toast góc phải dưới).

## 4. Engine — `DynamicCoreBuilder` (khi không dùng backend dynaform)

Chỉ cần engine thuần (không muốn lib tự gọi API): dùng `DynamicCoreBuilder`. Nếu chỉ cần chạy một form JSON có sẵn mà vẫn muốn lib lo `ref`/state/toast, ưu tiên `DynamicFormBuilder form={…}` (mục 3, từ 4.5.0) thay vì tự bọc.

```tsx
import { DynamicCoreBuilder } from "@dnu/dynaform-builder";
import type { FormDesignJson } from "@dnu/dynaform-builder";

<div style={{ height: 600 }}>   {/* parent PHẢI có chiều cao */}
  <DynamicCoreBuilder
    config={{ mode: "release", formMode: "create", viewport: "lg" }}
    data={{ dataFormDesign: formJson, dataUserFill: { full_name: "…" } }}
    onSubmit={(values) => api.submit(values)}
    onChange={({ name, value, data }) => …}
  />
</div>
```

- `config.mode`: `editor` | `preview` | `release`. `release` cần `data.dataFormDesign` (form JSON hoặc layout schema).
- `config` / `data` / `controls` / `events` khai báo ổn định (module-level hoặc useMemo).
- Release: `readOnly`, `readOnlyFields`, `hideSubmitButton`, `isolatedState` (**bắt buộc** khi nhiều form trên 1 trang), `rehydrate`, `debugTrace`.
- Callback: `onSave`, `onSaveDraft`, `onClose`, `onSubmit`, `onNext`, `onPrev`, `onSaveDraftSubmission`, `onChange`, `onValidateError`.
- Ref (`DynamicCoreBuilderHandle`): `onSubmit(cb?)` trả `Promise<data|null>` (null = không hợp lệ), `onNext`, `onPrev`, `onSave`, `trigger(event)`, undo/redo…
- `config.http`: transport cho mọi request dữ liệu (mặc định fetch trực tiếp → cần CORS); truyền hàm riêng để thêm auth/base URL/proxy. `createProxyRuntimeAdapter` gửi qua `/api/proxy` của host.
- Thay widget của control: `controls={{ input: MyInput }}` (xem `docs/CONTROL_OVERRIDES.md`); control mới `defineControl(...)` tiền tố `x-`.
- AI: truyền `data.generateForm` / `data.runAgentTurn` để bật panel AI (lib không giữ API key — LLM chạy ở host/server).

## 5. Form JSON đưa vào đâu

JSON từ `dynaform-build-form` → `data.dataFormDesign` (hoặc dán qua Open JSON trong editor). Giá trị điền sẵn: `data.dataUserFill` (key theo `name`).

## 6. Dev với lib build local (không cần tag)

Ở `fe_dynaform`: `yarn build:lib:local` (một lần) hoặc `yarn dev:lib` (watch) → `.dev-lib/`. Ở host: script start kiểu `LINK_DYNAFORM_LIB=true` (mfe-dynaform: `pnpm start:linked`) alias lib sang `.dev-lib`. Không sửa dependency/lockfile; chỉ dùng mode development.
Đổi vị trí checkout bằng `DEV_LOCAL_LIB_PATH`.

## 7. Lỗi thường gặp

| Triệu chứng | Nguyên nhân |
|---|---|
| UI không có style | quên import `style.css` |
| Canvas cao 0px | parent không có chiều cao |
| Form remount liên tục | `config`/`data`/`controls` tạo object mới mỗi render |
| Lỗi hook/ref chỉ trên React 18 | `ref` gắn vào component không `forwardRef` (lib đã xử lý; kiểm tra control override của host) |
| 401 liên tục | sai `backendUrl`, hoặc cookie `access_token` của phiên host không có/hết hạn (lib ≥ 6 chỉ ném `ApiError`, host tự đưa về đăng nhập) |
| `shellUrl` / `DynaformBuilder` không tồn tại khi typecheck | lib ≥ 6.0.0 đã đổi tên và bỏ `shellUrl` — bảng đổi tên ở mục 1 |
| `pnpm install --frozen-lockfile` lỗi sau khi nâng tag | lockfile giữ mã tag object; thay bằng mã commit của tag (mục 1) |
| Ảnh `http` trong custom embed không hiện | thiếu origin trong `embedPolicy.imageFetch` / trang `https` chặn mixed content |
| Nhiều form trên 1 trang đè state nhau | thiếu `isolatedState` (cả `DynamicCoreBuilder` lẫn `DynamicFormBuilder` ≥ 4.5.1) |
| Lưu form lỗi nhưng chỉ thấy "Request failed" | lib < 4.4.0; nâng tag để có message chi tiết của server + `onError` |
| `ref.current` luôn `null` / prop `form`, `dataUserFill` không có tác dụng | lib < 4.5.0 |
| Lưu lại form làm các container về `sort_order` 1 | lib < 4.5.2 (loader làm rơi `sort_order`); nâng tag |
| `loadFormJson` không tồn tại / `custom` (CSS) không có tác dụng | lib < 4.6.0 |
| Class Tailwind trong `properties.custom` không hiện ở viewer | form chưa qua editor nên chưa có `tailwindCss`; mở trong builder và Save |

Thư mục nguồn của lib (từ 4.4.1): `src/lib/builder-core/` (`DynamicCoreBuilder`, modes, SDK events, transform, embed) và `src/lib/builder-host/` (`DynamicFormBuilder`: REST + react-query + save). Hai thư mục này **không** trùng nhau: host render core, không ngược lại. Tên package không đổi; tên export đổi ở 6.0.0 (mục 1).

## 7b. AI agent sửa form trong editor

Props `DynamicFormBuilder` (chỉ mode editor, cần lib có agent bridge): `runAgentTurn` (thường tạo bằng `createSseRunAgentTurn({ url, getHeaders })`), `generateForm`, `agentClientTools` (tạo bằng `defineClientTool`), `onAgentConfirm`, `agentContext`. Editor chỉ đọc chúng **một lần lúc mount** ⇒ khai báo module-level/`useMemo`. Chat UI ngoài dùng `ref.getAgentTools()` / `runAgentTool()` / `beginAgentRun()` / `endAgentRun()`. Chi tiết, giao thức SSE và danh sách tool: skill `dynaform-agent-tools`.

## 8. Ví dụ đầy đủ

`references/examples.md` — 13 ví dụ TSX bám đúng props thật của lib: cài đặt + CSS, Provider, màn editor, release có nút riêng + `ref.onSubmit()`, nhiều form trên một trang (`isolatedState`), `DynamicCoreBuilder` thuần, `config.http` (axios), `controls` / `rawControl` / `defineControl`, `loadFormJson`, `embedPolicy`, lib build local, `onError`.

Tài liệu gốc: `docs/DYNAMIC_FORM_BUILDER_INTEGRATION.md`, `docs/DYNAMIC_CORE_BUILDER_INTEGRATION.md`, `docs/SDK_EVENTS.md`, `docs/lib-release-guide.md`.
