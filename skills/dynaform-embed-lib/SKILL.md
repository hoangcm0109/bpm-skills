---
name: dynaform-embed-lib
description: Nhúng thư viện @dnu/dynaform-builder vào app React/MFE — cài theo git tag, import style.css, DynaformBuilderProvider (backendUrl/shellUrl), DynaformBuilder (editor/preview/release), DynamicFormBuilder + dataFormDesign, props/events/ref, embedPolicy, chạy lib build local (start:linked). Dùng khi tích hợp, hiển thị/điền/submit form trong host app, hoặc debug lỗi tích hợp lib.
---

# Nhúng @dnu/dynaform-builder

Lib phát hành bằng **git tag** `vX.Y.Z` của repo `fe_dynaform`, `dist/lib` build sẵn và commit cùng tag.

## 1. Cài đặt

```jsonc
"@dnu/dynaform-builder": "git+http://git.dnu.edu.vn/dnu/fe_dynaform.git#v4.3.0"
```

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

Props chính: `idForm` (bắt buộc), `environment` (`DEV|CORE|PROD`… — có thì GET kèm `?environment=`), `onSaved`, `onSaveDraft`, `onSaveAsControl`,
`onClose`, `onSubmitForm`, `onNext`/`onPrev`, `onCreateVariable`, `dataVariableExisting`, `embedPolicy`, `onMessage`, `debugTrace`, `showCloseButton`, `className`.
- Remount khi `idForm` hoặc `environment` đổi.
- `embedPolicy` khai báo **ngoài component** (lib so sánh theo reference). `imageFetch: [origin…]` cho phép khung sandbox tải hộ ảnh `http`; lib tự thêm origin API của form + origin trang.
- `onMessage({ level, message })` nếu muốn dùng toast của host (nếu không lib tự hiện toast góc phải dưới).

## 4. Engine — `DynamicFormBuilder` (khi không dùng backend dynaform)

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
| Nhiều form trên 1 trang đè state nhau | thiếu `isolatedState` |

Tài liệu gốc: `docs/DYNAFORM_BUILDER_INTEGRATION.md`, `docs/DYNAMIC_FORM_BUILDER_INTEGRATION.md`, `docs/SDK_EVENTS.md`, `docs/lib-release-guide.md`.
