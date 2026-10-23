# Ví dụ đầy đủ — thêm một domain mới trong mfe-dynaform

Ví dụ dùng domain giả **`faculty`** (Khoa) để đi hết chuỗi: endpoint → type → service → query → mutation → hook trang → schema → dialog form → page → route,
rồi tới trang editor dùng `DynaformBuilder`. Mỗi đoạn mô phỏng đúng file thật của domain `application` (đọc mã gốc trước khi chép):
`services/application/*`, `hooks/application/useApplicationPage.ts`, `pages/application/ApplicationPage.tsx`,
`components/dialogs/CreateItemControlGroupDialog/*`, `pages/formManager/editor/FormEditorPage.tsx`, `app/App.tsx`.
Nguồn sự thật của repo vẫn là `.skills/project-overview/SKILL.md` + `.skills/sectioned-form-layout/SKILL.md` trong mfe-dynaform — khi mâu thuẫn, **file trong repo thắng**.

Quy trình đúng thứ tự (SKILL.md › "Quy trình sửa"): constants/endpoint → service + query/mutation factory → hook trang → page → route.
Chạy `pnpm typecheck` sau mỗi bước lớn; không thêm thư viện, không đổi version `@dnu/dynaform-builder` khi chưa được yêu cầu.

| Bước | File | Quy tắc đi kèm |
|---|---|---|
| 1 | `src/constants/api.ts` | `ENDPOINTS` là nơi **duy nhất** dựng đường dẫn API |
| 2 | `src/types/faculty.type.ts` | filter rỗng, payload, form values |
| 3 | `src/services/faculty/faculty.service.ts` | service mỏng, dùng `queryClient` (đọc) / `commandsClient` (ghi) |
| 4 | `src/services/faculty/faculty.query.ts` | chuẩn hoá response ngay trong `select` (`safeArray`) |
| 5 | `src/services/faculty/faculty.mutations.ts` | toast + invalidate trong factory; nhận `queryClient` qua tham số |
| 6 | `src/hooks/faculty/useFacultyPage.ts` | page chỉ ghép; filter/URL state nằm trong hook |
| 7 | `src/schemas/faculty.schema.ts` | Zod + `validateString` dùng chung |
| 8 | `components/dialogs/FacultyDialog/*` | `AppDialog` + `SectionedFormLayout` |
| 9 | `src/pages/faculty/FacultyPage.tsx` | `DataTableCustom`, cột định danh ghim trái, `actions` ghim phải |
| 10 | `routes.constants.ts` + `routes.config.ts` | thêm route |

## 1. Endpoint

```ts
// src/constants/api.ts
const root = "/v1";

enum PATHS {
  // …các path có sẵn…
  FACULTIES = root + "/faculties",
}

export const ENDPOINTS = {
  // …
  faculties: {
    search: () => PATHS.FACULTIES,
    create: () => PATHS.FACULTIES,
    update: (id: string) => `${PATHS.FACULTIES}/${id}`,
  },
};
```

## 2. Type

```ts
// src/types/faculty.type.ts
export interface Faculty {
  id?: string;
  code?: string;
  display_name?: string;
  is_deleted?: boolean;
  modified_date?: string;
}

export interface FacultyFilters {
  search: string;
}
export const EMPTY_FACULTY_FILTERS: FacultyFilters = { search: "" };

export interface FacultyFormValues {
  code: string;
  display_name: string;
}
export type CreateFacultyPayload = FacultyFormValues;
export type UpdateFacultyPayload = FacultyFormValues;
export interface UpdateFacultyRequest {
  id: string;
  payload: UpdateFacultyPayload;
}
```

## 3. Service — mỏng, không xử lý toast/cache

```ts
// src/services/faculty/faculty.service.ts
import { ENDPOINTS } from "@/constants/api";
import { commandsClient, queryClient } from "@/lib/apiClient";
import type { APIResponse } from "@/types";
import type { CreateFacultyPayload, Faculty, FacultyFilters, UpdateFacultyRequest } from "@/types/faculty.type";

export const facultyService = {
  search: (filters: FacultyFilters, page: number, limit: number) =>
    queryClient
      .get<APIResponse<Faculty[]>>(ENDPOINTS.faculties.search(), {
        params: { page, limit, ...(filters.search ? { search: filters.search } : {}) },
      })
      .then((res) => res.data),
  create: (payload: CreateFacultyPayload) =>
    commandsClient.post(ENDPOINTS.faculties.create(), payload).then((res) => res?.data),
  update: ({ id, payload }: UpdateFacultyRequest) =>
    commandsClient.put(ENDPOINTS.faculties.update(id), payload).then((res) => res?.data),
};
```

## 4. Query — chuẩn hoá response, không tin shape backend

```ts
// src/services/faculty/faculty.query.ts
import { queryOptions } from "@tanstack/react-query";
import type { SafeDataList } from "@/types";
import type { Faculty, FacultyFilters } from "@/types/faculty.type";
import { safeArray } from "@/utils/helpers";
import { facultyService } from "./faculty.service";

export const EMPTY_FACULTY_LIST: SafeDataList<Faculty> = {
  data: [],
  meta: { current_page: 1, items_per_page: 10, total_items: 0, limit: 10 },
};

export const facultyQueryKeys = {
  all: ["faculties"] as const,
  search: (filters: FacultyFilters, page: number, limit: number) =>
    [...facultyQueryKeys.all, "search", filters, page, limit] as const,
};

export const facultyQuery = {
  search: (filters: FacultyFilters, page: number, limit: number) =>
    queryOptions({
      queryKey: facultyQueryKeys.search(filters, page, limit),
      queryFn: () => facultyService.search(filters, page, limit),
      select: (res): SafeDataList<Faculty> => ({
        data: safeArray(res?.data),
        meta: {
          current_page: res?.current_page || 1,
          items_per_page: res?.items_per_page || 10,
          total_items: res?.total_items || 0,
          limit,
        },
      }),
      staleTime: 0,
      refetchOnMount: "always",
    }),
};
```

## 5. Mutation — toast + invalidate nằm trong factory

```ts
// src/services/faculty/faculty.mutations.ts
import { toast } from "@sth87/shadcn-design-system";
import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import type { CreateFacultyPayload, UpdateFacultyRequest } from "@/types/faculty.type";
import { facultyQueryKeys } from "./faculty.query";
import { facultyService } from "./faculty.service";

const errorText = (error: unknown) => (error instanceof Error ? error.message : "Lỗi không xác định");

export const facultyMutations = {
  // NHẬN queryClient qua tham số — không import singleton `queryClient` (đúng khi chạy trong shell).
  create: (queryClient: QueryClient) =>
    mutationOptions({
      mutationKey: ["faculty-mutations", "create"],
      mutationFn: (payload: CreateFacultyPayload) => facultyService.create(payload),
      onSuccess: () => {
        toast.success("Đã tạo khoa");
        queryClient.invalidateQueries({ queryKey: facultyQueryKeys.all });
      },
      onError: (error) => toast.error(`Tạo khoa thất bại: ${errorText(error)}`),
    }),
  update: (queryClient: QueryClient) =>
    mutationOptions({
      mutationKey: ["faculty-mutations", "update"],
      mutationFn: (request: UpdateFacultyRequest) => facultyService.update(request),
      onSuccess: () => {
        toast.success("Đã cập nhật khoa");
        queryClient.invalidateQueries({ queryKey: facultyQueryKeys.all });
      },
      onError: (error) => toast.error(`Cập nhật khoa thất bại: ${errorText(error)}`),
    }),
};
```

## 6. Hook trang — page chỉ ghép, state ở hook

```ts
// src/hooks/faculty/useFacultyPage.ts
import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParamsState } from "@/hooks/useSearchParamsState";
import { facultyMutations } from "@/services/faculty/faculty.mutations";
import { EMPTY_FACULTY_LIST, facultyQuery } from "@/services/faculty/faculty.query";
import { EMPTY_FACULTY_FILTERS, type CreateFacultyPayload, type Faculty, type FacultyFormValues } from "@/types/faculty.type";

const EMPTY_FORM: FacultyFormValues = { code: "", display_name: "" };

export const useFacultyPage = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Faculty | null>(null);

  // URL state: filter + phân trang đồng bộ lên query string
  const { filter, apiParams, pagination, setFilterField, setPagination, handleSearch, resetFilter } =
    useSearchParamsState({ defaultFilter: EMPTY_FACULTY_FILTERS, syncUrl: true, debounce: false });

  const { data: faculties = EMPTY_FACULTY_LIST, isFetching } = useQuery(
    facultyQuery.search(apiParams.filters, apiParams.page, apiParams.limit),
  );

  const { mutate: createFaculty, isPending: isCreating } = useMutation(facultyMutations.create(queryClient));
  const { mutate: updateFaculty, isPending: isUpdating } = useMutation(facultyMutations.update(queryClient));

  const handleCreate = useCallback(
    (payload: CreateFacultyPayload) => createFaculty(payload, { onSuccess: () => setIsCreateOpen(false) }),
    [createFaculty],
  );
  const handleUpdate = useCallback(
    (payload: CreateFacultyPayload) => {
      if (!editing?.id) return;
      updateFaculty({ id: String(editing.id), payload }, { onSuccess: () => setEditing(null) });
    },
    [editing?.id, updateFaculty],
  );

  const editingValues = useMemo<FacultyFormValues>(
    () => (editing ? { code: editing.code ?? "", display_name: editing.display_name ?? "" } : EMPTY_FORM),
    [editing],
  );

  return {
    list: { faculties, isFetching },
    filters: { values: filter, update: setFilterField, search: handleSearch, reset: resetFilter },
    pagination: {
      limit: pagination.pageSize,
      page: pagination.pageIndex + 1,
      set: (page: number, limit: number) => setPagination({ pageIndex: page - 1, pageSize: limit }),
    },
    create: { open: isCreateOpen, isPending: isCreating, openDialog: () => setIsCreateOpen(true), cancel: () => !isCreating && setIsCreateOpen(false), submit: handleCreate },
    edit: { faculty: editing, values: editingValues, isPending: isUpdating, cancel: () => !isUpdating && setEditing(null), submit: handleUpdate, setFaculty: setEditing },
  };
};
```

## 7. Schema Zod

```ts
// src/schemas/faculty.schema.ts
import { z } from "zod";
import { validateString } from "@/schemas/Validate/index";

export const facultySchema = z.object({
  code: validateString({ label: "Mã khoa", required: true }),
  display_name: validateString({ label: "Tên khoa", required: true }),
});
```

## 8. Dialog + form có điều hướng section (`SectionedFormLayout`, tab mode)

```tsx
// src/components/dialogs/FacultyDialog/FacultyForm.tsx
import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { Info } from "lucide-react";
import SectionedFormLayout from "@/components/forms/SectionedFormLayout";
import type { SectionedFormLayoutSection } from "@/components/forms/SectionedFormLayout";
import { facultySchema } from "@/schemas/faculty.schema";
import type { FacultyFormValues } from "@/types/faculty.type";
import { FacultyGeneralSection } from "./FacultyGeneralSection"; // chứa FormInput code / display_name

export const FACULTY_FORM_ID = "faculty-form";

type Props = {
  open: boolean;
  isPending: boolean;
  initialValues: FacultyFormValues;
  onSubmit: (values: FacultyFormValues) => void;
};

export default function FacultyForm({ open, isPending, initialValues, onSubmit }: Props) {
  const form = useForm<FacultyFormValues>({
    resolver: zodResolver(facultySchema),
    mode: "onChange",
    defaultValues: initialValues,
    shouldFocusError: true,
  });

  useEffect(() => {
    if (open) form.reset(initialValues); // mở lại dialog luôn bắt đầu từ giá trị khởi tạo
  }, [open, initialValues, form]);

  const sections: SectionedFormLayoutSection[] = [
    {
      id: "general",
      tabLabel: "Thông tin",
      title: "Thông tin",
      icon: Info,
      fieldNames: ["code", "display_name"], // BẮT BUỘC: để nhảy tới tab có lỗi khi submit
      component: <FacultyGeneralSection isPending={isPending} />,
    },
  ];

  return (
    <FormProvider {...form}>{/* bắt buộc khi displayMode="tab" */}
      <form
        id={FACULTY_FORM_ID}
        className="flex h-full min-h-0 flex-col overflow-hidden"
        noValidate // bắt buộc: tab ẩn không focus được nên HTML5 validate sẽ im lặng chặn submit
        onSubmit={form.handleSubmit((values) => !isPending && onSubmit(values))}
      >
        <SectionedFormLayout sections={sections} displayMode="tab" />
      </form>
    </FormProvider>
  );
}
```

```tsx
// src/components/dialogs/FacultyDialog/FacultyDialog.tsx
import { Button } from "@sth87/shadcn-design-system";
import AppDialog from "@/components/dialogs/AppDialog";
import FacultyForm, { FACULTY_FORM_ID } from "./FacultyForm";
import type { FacultyFormValues } from "@/types/faculty.type";

type Props = {
  open: boolean;
  isPending: boolean;
  title: string;
  labelSubmit: string;
  initialValues: FacultyFormValues;
  onSubmit: (values: FacultyFormValues) => void;
  onCancel: () => void;
};

export default function FacultyDialog({ open, isPending, title, labelSubmit, initialValues, onSubmit, onCancel }: Props) {
  return (
    <AppDialog
      open={open}
      closeDisabled={isPending}
      closeOnOutside={false}
      focusContentOnOpen
      containedScroll
      onOpenChange={(next) => !next && onCancel()}
      title={title}
      footer={
        <div className="flex w-full justify-end gap-2">
          <Button type="button" disabled={isPending} onClick={onCancel}>Hủy</Button>
          {/* nút submit nằm NGOÀI <form>, nối bằng thuộc tính form= */}
          <Button type="submit" form={FACULTY_FORM_ID} disabled={isPending}>{labelSubmit}</Button>
        </div>
      }
    >
      <FacultyForm open={open} isPending={isPending} initialValues={initialValues} onSubmit={onSubmit} />
    </AppDialog>
  );
}
```

## 9. Page — chỉ ghép hook + bảng + dialog

```tsx
// src/pages/faculty/FacultyPage.tsx
import { useMemo } from "react";
import { Button, useDataTable } from "@sth87/shadcn-design-system";
import type { ColumnDef } from "@tanstack/react-table";
import { Pencil, Plus } from "lucide-react";
import DataTableCustom from "@/components/data-table-custom";
import FacultyDialog from "@/components/dialogs/FacultyDialog/FacultyDialog";
import { TooltipText } from "@/components/ui/TooltipText";
import { LIST_HEADER_CLASS, LIST_TITLE_CLASS } from "@/constants/formManager";
import { useFacultyPage } from "@/hooks/faculty/useFacultyPage";
import type { Faculty } from "@/types/faculty.type";
import { formatDisplayValue } from "@/utils/format";

export default function FacultyPage() {
  const { list, create, edit, pagination } = useFacultyPage();

  const columns = useMemo<ColumnDef<Faculty>[]>(
    () => [
      {
        id: "code",
        accessorKey: "code",
        meta: { label: "Mã khoa" },
        header: () => <span className={LIST_HEADER_CLASS}>Mã khoa</span>,
        size: 160,
        cell: ({ row }) => (
          // cắt chữ bằng TooltipText + formatDisplayValue, không dùng title native
          <TooltipText value={formatDisplayValue(row.original?.code)} className={`${LIST_TITLE_CLASS} block truncate`} />
        ),
      },
      {
        id: "display_name",
        accessorKey: "display_name",
        meta: { label: "Tên khoa" },
        header: () => <span className={LIST_HEADER_CLASS}>Tên khoa</span>,
        size: 280,
        cell: ({ row }) => <TooltipText value={formatDisplayValue(row.original?.display_name)} className="block truncate" />,
      },
      {
        id: "actions",
        meta: { label: "Thao tác" },
        header: () => <div className={`${LIST_HEADER_CLASS} text-right`}>Thao tác</div>,
        size: 90,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="sm" color="primary" aria-label="Sửa khoa" onClick={() => edit.setFaculty(row.original)}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [edit],
  );

  const { table } = useDataTable({
    data: list.faculties.data,
    columns,
    getRowId: (row, index) => (row?.id ? String(row.id) : `faculty-${index}`),
    initialState: { columnPinning: { left: ["code"], right: ["actions"] } }, // định danh ghim trái, actions ghim phải
    state: { pagination: { pageSize: pagination.limit, pageIndex: pagination.page - 1 } },
    manualPagination: true,
    pageCount:
      list.faculties.meta.items_per_page > 0
        ? Math.ceil(list.faculties.meta.total_items / list.faculties.meta.items_per_page)
        : -1,
    onPaginationChange: (updater) => {
      const current = { pageIndex: pagination.page - 1, pageSize: pagination.limit };
      const next = typeof updater === "function" ? updater(current) : updater;
      pagination.set(next.pageSize !== pagination.limit ? 1 : next.pageIndex + 1, next.pageSize);
    },
  });

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-lg font-semibold text-ink800">Khoa</h1>
        <Button onClick={create.openDialog} className="rounded-full! bg-primaryA-500! text-white! hover:bg-primaryA-600! py-0!" size="sm">
          <Plus className="h-4 w-4" />
          <span>Tạo mới</span>
        </Button>
      </div>

      <DataTableCustom
        table={table}
        isFetching={list.isFetching}
        totalItems={list.faculties.meta.total_items}
        emptyTitle="Chưa có khoa nào"
        emptyDescription="Không tìm thấy khoa phù hợp với bộ lọc hiện tại."
      />

      <FacultyDialog open={create.open} isPending={create.isPending} title="Tạo mới khoa" labelSubmit="Tạo khoa"
        initialValues={{ code: "", display_name: "" }} onSubmit={create.submit} onCancel={create.cancel} />
      <FacultyDialog open={!!edit.faculty} isPending={edit.isPending} title="Sửa khoa" labelSubmit="Cập nhật"
        initialValues={edit.values} onSubmit={edit.submit} onCancel={edit.cancel} />
    </>
  );
}
```

Ghi chú style: palette `text-ink800`, `bg-primaryA-500`… (không hardcode hex, không slate/gray/zinc cho UI list); icon-only button có `aria-label`;
select luôn dùng `Select` của design system (`FormSelect` khi gắn RHF); `PaginatedSelect` chỉ cho danh sách rất dài.

## 10. Route

```ts
// src/app/routes.constants.ts
export const ROUTES = {
  // …
  faculty: { index: "faculty" },
} as const;
```

```ts
// src/app/routes.config.ts — thêm vào children của OperationalPageLayout
import FacultyPage from "../pages/faculty/FacultyPage";
// …
{ path: ROUTES.faculty.index, element: React.createElement(FacultyPage) },
```

Link tới route dùng `buildRouteUrl(ROUTES.faculty.index)` (tự thêm prefix `/dynaform`); route có tham số: `buildRouteUrl(ROUTES.formManager.editor.index, { id })`.

## 11. Trang editor/preview/release dùng `DynaformBuilder`

```tsx
// src/pages/formManager/editor/FormEditorPage.tsx (rút gọn)
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DynaformBuilder } from "@dnu/dynaform-builder";
import { ROUTES, buildRouteUrl } from "@/app/routes.constants";
import { FORM_ENVIRONMENT_QUERY_KEY, type FormManagerLocationState } from "@/types/formManager.type";
import { parseFormEnvTab } from "@/utils/formManagerUtils";

// Khai báo NGOÀI component: lib so sánh embedPolicy theo reference.
const EMBED_POLICY = {
  imageFetch: (process.env.REACT_APP_EMBED_IMAGE_ORIGINS || "").split(",").map((o) => o.trim()).filter(Boolean),
};

export default function FormEditorPage({ forceMode }: { forceMode?: "editor" | "preview" | "release" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { id: paramId } = useParams<{ id: string }>();

  const id = (paramId ?? "").split(/[?&]/)[0]; // phòng thủ: id lỡ dính query
  const rawEnvironment = searchParams.get(FORM_ENVIRONMENT_QUERY_KEY);
  const environment = rawEnvironment ? parseFormEnvTab(rawEnvironment) : undefined; // thiếu thì không truyền

  const handleClose = () => {
    const { returnTo } = (location.state as FormManagerLocationState | null) ?? {};
    navigate(returnTo || buildRouteUrl(ROUTES.formManager.index)); // quay lại đúng trang đã mở editor
  };

  return (
    <DynaformBuilder
      idForm={id}
      environment={environment}
      mode={forceMode ?? "editor"}
      onClose={handleClose}
      embedPolicy={EMBED_POLICY}
    />
  );
}
```

Chỉ mở editor cho version `draft`, với `id` + môi trường của version đang chọn. Cấu hình URL lib **duy nhất** qua `DynaformBuilderProvider` trong `app/App.tsx`
(`backendUrl` = gốc gateway, `shellUrl`, bọc bằng `useMemo`); CSS lib import ở `bootstrap.tsx` — xem `../../dynaform-embed-lib/references/examples.md` §1–§3.

## Checklist trước khi báo xong

- [ ] `pnpm typecheck` sạch; chạy được standalone (`pnpm start`) và, nếu đụng shell, `start:federated`.
- [ ] Không import singleton `queryClient` trong mutation; không đường dẫn API rải ngoài `ENDPOINTS`.
- [ ] `noValidate` + `FormProvider` + `fieldNames` cho từng section khi dùng tab mode.
- [ ] Chuỗi hiển thị tiếng Việt (thuật ngữ IT giữ tiếng Anh); icon-only button có `aria-label`.
- [ ] Không đổi version `@dnu/dynaform-builder`, không thêm thư viện mới khi chưa được yêu cầu.
