---
name: dynaform-embed-lib
description: Nhúng thư viện @dnu/dynaform-builder vào app React/MFE — cài theo git tag, import style.css, DynaformBuilderProvider (backendUrl/shellUrl), DynaformBuilder (editor/preview/release), DynamicFormBuilder + dataFormDesign, props/events/ref, embedPolicy, chạy lib build local (start:linked). Dùng khi tích hợp, hiển thị/điền/submit form trong host app, hoặc debug lỗi tích hợp lib.
---

# Nhúng @dnu/dynaform-builder

Lib phát hành bằng **git tag** `vX.Y.Z` của repo `fe_dynaform`, `dist/lib` build sẵn và commit cùng tag.

## 1. Cài đặt

```jsonc
"@dnu/dynaform-builder": "git+http://git.dnu.edu.vn/dnu/fe_dynaform.git#v4.6.0"
```

(`v4.6.0` là tag mới nhất lúc viết skill. Các prop ghi "từ 4.5.0" ở dưới cần tag ≥ 4.5.0.)

- Luôn `git+http://` (http thường → `TAR_BAD_ARCHIVE`) và **pin tag**; không dùng `#main`/nhánh.
- Peer: `react`, `react-dom` ≥ 18. `@tanstack/react-query`, `@sth87/shadcn-design-system`, `lucide-react` đã bundle trong lib; host không cần bọc `QueryClientProvider` cho lib.
- Import CSS **một lần** ở entry: `import "@dnu/dynaform-builder/style.css";` (host không cần Tailwind để lib hiển thị đúng).
- Vite: `resolve.dedupe: ["react", "react-dom"]`. Webpack Module Federation: share `react`/`react-dom` singleton.
- Kiểm tra tag mới nhất trước khi ghi version — đừng bịa; đọc `package.json` của fe_dynaform hoặc `git ls-remote --tags`.

## 2. Cấu hình URL — `DynaformBuilderProvider`

```tsx
import { DynaformBuilderProvider } from "@dnu/dynaform-builder";

<DynaformBuilderProvider config={{ backendUrl: "https://<gateway>", shellUrl: "https://<shell>" }}>
  <App />
</DynaformBuilderProvider>
```

- `backendUrl` = **gốc gateway**: lib tự suy `…/query/v1/…` (GET) và `…/command/v1/…` (ghi). `shellUrl` = nơi redirect đăng nhập khi 401.
- `config` phải ổn định (useMemo) — đừng tạo object mới mỗi render.
- Tuỳ chọn khác: `setRuntimeConfig()`, `useDynaformConfig()`, `bootstrapStandaloneAuth`.

## 3. Component host-ready — `DynaformBuilder`

Tự gọi API (form-design, item-controls, variables, save…) rồi render engine.

```tsx
<DynaformBuilder idForm={id} environment="CORE" mode="editor" onSaved={…} onClose={…} embedPolicy={EMBED_POLICY} />
```

| `mode` | Hiển thị |
|---|---|
| `editor` (mặc định) | màn thiết kế, `fixed inset-0` |
| `preview` | overlay có header + nút đóng |
| `release` | runtime thuần cho người dùng cuối, theo kích thước parent |

Props chính: `idForm` (bắt buộc nếu không truyền `form`), `environment` (`DEV|CORE|PROD`… — có thì GET kèm `?environment=`), `onSaved`, `onSaveDraft`, `onSaveAsControl`,
`onError`, `onClose`, `onSubmitForm`, `onNext`/`onPrev`, `onCreateVariable`, `dataVariableExisting`, `embedPolicy`, `onMessage`, `debugTrace`, `showCloseButton`, `className`.
- Remount khi `idForm` hoặc `environment` đổi.
- **Từ 4.5.0** — thay được wrapper `DynamicFormBuilder` tự viết ở host:
  - `form`: form JSON host đã có (một version cụ thể, form vừa thực thi…) dùng trực tiếp, **không** gọi API chi tiết; ưu tiên hơn `idForm`. Giữ reference ổn định.
  - `dataUserFill` (preview/release): giá trị điền sẵn, key theo `name`. Giữ reference ổn định.
  - `hideSubmitButton` (mặc định `true`): ẩn nút Gửi của runtime; host tự có nút và lấy giá trị bằng `ref.current.onSubmit()` (null = không hợp lệ).
  - `ref`: `DynaformBuilder` là `forwardRef`, handle = `DynamicFormBuilderHandle` của lõi (`onSubmit`, `getFormJson`, undo/redo, `setViewport`…), dùng ở cả editor lẫn preview/release.
  - `isolatedState` (**4.5.1**, preview/release): state runtime riêng; bật khi nhiều form mount cùng trang (modal, task form).
- **Từ 4.6.0**: `ref.current.loadFormJson(json, { snapshot?, progress? })` thay toàn bộ form của editor từ host (build dần; editor chỉ đọc `dataFormDesign` lúc mount); canvas có hiệu ứng build dần. Mọi control nhận **CSS thuần + class Tailwind** (`properties.custom`, panel "CSS tuỳ chỉnh" ở tab Thiết kế; host tắt bằng `embedPolicy.allowCustomCss: false`). Control `table-filter` đã **gỡ** (không migrate): form cũ hiện khung cảnh báo tại chỗ đó.
- `onError` (**4.4.0**, editor): gọi khi lưu form / lưu thành control thất bại; lib đã tự toast message chi tiết của server và `console.error` toàn bộ response. `error` = `{ action, message, status?, details[], body?, cause }` để host ghi log riêng.

```tsx
const ref = useRef<DynamicFormBuilderHandle>(null);
<DynaformBuilder ref={ref} form={formJson} dataUserFill={values} mode="release" isolatedState />
const values = await ref.current?.onSubmit();
```
- `embedPolicy` khai báo **ngoài component** (lib so sánh theo reference). `imageFetch: [origin…]` cho phép khung sandbox tải hộ ảnh `http`; lib tự thêm origin API của form + origin trang.
- `onMessage({ level, message })` nếu muốn dùng toast của host (nếu không lib tự hiện toast góc phải dưới).

## 4. Engine — `DynamicFormBuilder` (khi không dùng backend dynaform)

Chỉ cần engine thuần (không muốn lib tự gọi API): dùng `DynamicFormBuilder`. Nếu chỉ cần chạy một form JSON có sẵn mà vẫn muốn lib lo `ref`/state/toast, ưu tiên `DynaformBuilder form={…}` (mục 3, từ 4.5.0) thay vì tự bọc.

```tsx
import { DynamicFormBuilder } from "@dnu/dynaform-builder";
import type { FormDesignJson } from "@dnu/dynaform-builder";

<div style={{ height: 600 }}>   {/* parent PHẢI có chiều cao */}
  <DynamicFormBuilder
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
- Ref (`DynamicFormBuilderHandle`): `onSubmit(cb?)` trả `Promise<data|null>` (null = không hợp lệ), `onNext`, `onPrev`, `onSave`, `trigger(event)`, undo/redo…
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
| 401 liên tục | sai `shellUrl`/`backendUrl`, hoặc cookie `access_token` không gửi |
| Ảnh `http` trong custom embed không hiện | thiếu origin trong `embedPolicy.imageFetch` / trang `https` chặn mixed content |
| Nhiều form trên 1 trang đè state nhau | thiếu `isolatedState` (cả `DynamicFormBuilder` lẫn `DynaformBuilder` ≥ 4.5.1) |
| Lưu form lỗi nhưng chỉ thấy "Request failed" | lib < 4.4.0; nâng tag để có message chi tiết của server + `onError` |
| `ref.current` luôn `null` / prop `form`, `dataUserFill` không có tác dụng | lib < 4.5.0 |
| Lưu lại form làm các container về `sort_order` 1 | lib < 4.5.2 (loader làm rơi `sort_order`); nâng tag |
| `loadFormJson` không tồn tại / `custom` (CSS) không có tác dụng | lib < 4.6.0 |
| Class Tailwind trong `properties.custom` không hiện ở viewer | form chưa qua editor nên chưa có `tailwindCss`; mở trong builder và Save |

Thư mục nguồn của lib (từ 4.4.1): `src/lib/builder-core/` (`DynamicFormBuilder`, modes, SDK events, transform, embed) và `src/lib/builder-host/` (`DynaformBuilder`: REST + react-query + save). Hai thư mục này **không** trùng nhau: host render core, không ngược lại. Export public và tên package không đổi.

Tài liệu gốc: `docs/DYNAFORM_BUILDER_INTEGRATION.md`, `docs/DYNAMIC_FORM_BUILDER_INTEGRATION.md`, `docs/SDK_EVENTS.md`, `docs/lib-release-guide.md`.
