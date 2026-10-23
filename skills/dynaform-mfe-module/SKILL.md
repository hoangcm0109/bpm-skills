---
name: dynaform-mfe-module
description: Quy ước làm việc trong repo mfe-dynaform (module federation remote dùng @dnu/dynaform-builder) — cấu trúc thư mục, API client, TanStack Query, form editor/preview, môi trường & publish, SectionedFormLayout, UI/UX list. Dùng khi sửa hoặc thêm trang/dialog/service trong mfe-dynaform, hoặc thêm luồng quản lý form (form manager, item control, host app).
---

# Làm việc trong mfe-dynaform

Remote microfrontend tên `dynaform`: React 19 + TS strict, Webpack 5 Module Federation, `react-router-dom`, Tailwind v4 + `@sth87/shadcn-design-system`, TanStack Query v5, React Hook Form + Zod.
Chạy được cả **standalone** và **trong shell** — mọi thay đổi phải giữ cả hai. Package manager: **pnpm**. Kiểm tra kiểu: `pnpm typecheck`.

> Nguồn sự thật của repo: `.skills/project-overview/SKILL.md` và `.skills/sectioned-form-layout/SKILL.md` trong mfe-dynaform. Skill này là bản tóm tắt để tra nhanh; khi mâu thuẫn, **file trong repo thắng**.

## Cấu trúc

| Thư mục | Vai trò |
|---|---|
| `src/app` | App shell, routes (`routes.constants`), hosted/preview |
| `src/pages/formManager/{list,versions,editor}` | danh sách form CORE, chi tiết + pipeline môi trường, trang editor/preview |
| `src/pages/{application,hostApp,itemControl,itemControlGroup}` | các domain còn lại |
| `src/components`, `components/dialogs`, `components/ui` | UI dùng chung, `AppDialog`, `FormInput/FormSelect/FormTextarea` |
| `src/hooks`, `src/hooks/formManager` | orchestration trang, `useListSearchParams` |
| `src/services/<domain>` | `*.service.ts`, `*.query.ts`, `*.mutations.ts` |
| `src/lib` | `apiClient`, `runtimeConfig` |
| `src/constants/api.ts` | `ENDPOINTS` — nơi duy nhất dựng đường dẫn API |
| `src/schemas` | Zod + `validate.ts` (validator dùng chung) |

## Quy tắc cốt lõi

1. **API**: dùng client trong `src/lib/apiClient.ts` (`queryClient` cho đọc, `commandsClient` cho ghi); endpoint khai ở `constants/api.ts`. Service mỏng; chuẩn hoá response ngay trong query (`safeArray`…) — không tin shape backend.
2. **Mutation**: toast + invalidate nằm trong mutation options factory. **Không import singleton `queryClient`** — lấy `useQueryClient()` rồi truyền vào factory (đúng khi chạy trong shell).
3. **List**: theo mẫu `ApplicationPage` — page chỉ ghép; filter/pagination/URL state trong hook dùng `useListSearchParams`; bảng bằng `DataTableCustom`; cột định danh ghim trái, `actions` ghim phải.
4. **Dialog/form**: `AppDialog`; form lớn có điều hướng section dùng `SectionedFormLayout` (+ `containedScroll`); mỗi section khai `fieldNames` để nhảy tới tab có lỗi; thêm `noValidate` và bọc `FormProvider` khi `displayMode="tab"`.
5. **Select**: luôn `Select` của design system (`FormSelect` khi gắn RHF); `PaginatedSelect` chỉ cho danh sách rất dài (icon picker).
6. **Style**: palette `text-ink800/700/600/500`, `border-ink300`, `bg-ink50/200`, `bg-primaryA-500`…; không hardcode hex, không slate/gray/zinc cho UI list. Icon: Lucide; icon-only button có `aria-label`.
7. **Text**: UI tiếng Việt, thuật ngữ IT/control giữ tiếng Anh; không rải chuỗi hardcode khi đã có constants.
8. **Hiển thị cắt chữ**: `TooltipText` + `formatDisplayValue`/`formatDateTime`, không dùng `title` native.

## Form editor / preview

- `pages/formManager/editor/FormEditorPage.tsx` render `DynaformBuilder` với `idForm`, `environment` (từ query `?environment=`), `mode`, `onClose` (quay về `location.state.returnTo`), `embedPolicy` khai báo ngoài component.
- URL lib cấu hình **duy nhất** qua `DynaformBuilderProvider` trong `app/App.tsx` (`backendUrl` = gốc gateway, `shellUrl`); CSS lib import ở `bootstrap.tsx`.
- **Không có dialog tạo form** trong module (đã gỡ `CreateFormDialog`): trang danh sách chỉ có nút "Đi tới workspace để tạo form", mở `{REACT_APP_BPM_URL}/workflow/workspaces` ở tab mới (`resolveBpmUrl()` trong `lib/runtimeConfig.ts`, `BPM_WORKSPACES_PATH` trong `constants/formManager.ts`). Chưa cấu hình `REACT_APP_BPM_URL` thì nút ẩn. Form mới được tạo bên trong một workspace của BPM, không tạo từ mfe-dynaform.
- Chỉ mở editor cho version **`draft`**; mở với `id` + môi trường của version đang chọn.
- Môi trường & publish: `ENDPOINTS.formDesign.{publish,changeStatus,edit,crossEnv}`; pipeline lấy từ `flow_publish` của form.
- Tag lib mới nhất: `v4.8.0`; module có thể còn ở tag cũ hơn (đã thấy `v4.7.0`) — kiểm tra `package.json` của mfe-dynaform trước khi nói về version.
- Sửa version lib: đổi tag trong `package.json` rồi cài lại; thử thay đổi lib chưa release bằng `pnpm start:linked` (xem `dynaform-embed-lib`).

## Quy trình sửa

1. Đọc trang/hook/service/type liên quan trước khi sửa; tái dùng thay vì tạo mới.
2. Thêm domain mới: constants/endpoint → service + query/mutation factory → hook trang → page → route.
3. Chạy `pnpm typecheck`; kiểm tra standalone (`pnpm start`) và, nếu đụng shell, `start:federated`.
4. Không đổi version `@dnu/dynaform-builder`, không thêm thư viện mới khi chưa được yêu cầu.

## Ví dụ đầy đủ

`references/examples.md` — thêm một domain mới đi hết chuỗi endpoint → type → service → query → mutation → hook trang → schema Zod → dialog `SectionedFormLayout` (tab mode) → page `DataTableCustom` → route, kèm `FormEditorPage` dùng `DynaformBuilder` và checklist trước khi báo xong. Mô phỏng đúng file thật của domain `application`.

## Liên quan

Dựng nội dung form: `dynaform-build-form`. Nhúng/props lib: `dynaform-embed-lib`.
