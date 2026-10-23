# Ví dụ đầy đủ — nhúng `@dnu/dynaform-builder`

Mọi ví dụ bám đúng props/export thật của lib (đối chiếu `src/lib/index.ts`, `src/lib/builder-host/DynaformBuilder.tsx`,
`docs/DYNAMIC_FORM_BUILDER_INTEGRATION.md` trong `fe_dynaform`; mẫu host thật: `mfe-dynaform/src/app/App.tsx`,
`pages/formManager/editor/FormEditorPage.tsx`). Tag lib ghi ở SKILL.md — kiểm `package.json` trước khi chép version.
Dữ liệu trong ví dụ là giả; URL/gateway thay bằng của bạn, **không** ghi token vào mã.

| # | Tình huống | Thành phần |
|---|---|---|
| 1 | Cài đặt + import CSS | `package.json`, entry |
| 2 | Cấu hình URL cho cả app | `DynaformBuilderProvider` |
| 3 | Màn thiết kế form có backend dynaform | `DynaformBuilder mode="editor"` |
| 4 | Điền và gửi form cho người dùng cuối (host có nút riêng) | `DynaformBuilder mode="release"` + `ref` |
| 5 | Nhiều form trên một trang (modal, task form) | `isolatedState` |
| 6 | Không có backend dynaform — chỉ chạy một form JSON | `DynamicFormBuilder` |
| 7 | Tự đưa request qua axios / thêm auth | `config.http` |
| 8 | Thay widget của control bằng component của host | `controls` + `rawControl` |
| 9 | Control mới của host (`x-…`) | `defineControl` |
| 10 | Host dựng/đồng bộ form vào editor đang mở | `ref.loadFormJson` |
| 11 | Chính sách cho `custom-embed`, CSS tuỳ chỉnh | `embedPolicy` |
| 12 | Chạy lib build local (không cần tag) | script dev |
| 13 | Bắt lỗi lưu form | `onError` |

## 1. Cài đặt + import CSS

```jsonc
// package.json của host
"@dnu/dynaform-builder": "git+http://git.dnu.edu.vn/dnu/fe_dynaform.git#v4.8.0"
```

```tsx
// src/bootstrap.tsx (hoặc entry): import CSS đúng MỘT lần
import "@dnu/dynaform-builder/style.css";
import { createRoot } from "react-dom/client";
import App from "./app/App";

createRoot(document.getElementById("root")!).render(<App />);
```

Vite: thêm `resolve: { dedupe: ["react", "react-dom"] }`. Webpack Module Federation: `shared: { react: { singleton: true }, "react-dom": { singleton: true } }`.

## 2. Cấu hình URL — `DynaformBuilderProvider`

```tsx
import { useMemo } from "react";
import { DynaformBuilderProvider } from "@dnu/dynaform-builder";

export default function App() {
  // dist của lib build sẵn nên env của host KHÔNG có tác dụng: phải truyền URL qua Provider.
  // config phải ổn định (useMemo) — tạo object mới mỗi render sẽ làm lib cấu hình lại.
  const config = useMemo(
    () => ({
      backendUrl: "https://gateway.example.com", // GỐC gateway; lib tự suy …/query/v1/… và …/command/v1/…
      shellUrl: "https://shell.example.com",     // nơi redirect đăng nhập khi 401
    }),
    [],
  );
  return (
    <DynaformBuilderProvider config={config}>
      <Routes />
    </DynaformBuilderProvider>
  );
}
```

## 3. Màn thiết kế — `mode="editor"`

```tsx
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { DynaformBuilder } from "@dnu/dynaform-builder";
import type { DynaformBuilderError, EmbedPolicy } from "@dnu/dynaform-builder";

// Khai báo NGOÀI component: lib so sánh embedPolicy theo reference.
const EMBED_POLICY: EmbedPolicy = {
  imageFetch: ["https://files.example.com"], // origin cho phép khung sandbox tải hộ ảnh http
};

export default function FormEditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [search] = useSearchParams();
  const { id = "" } = useParams<{ id: string }>();
  const environment = search.get("environment") ?? undefined; // thiếu thì không truyền

  const handleClose = () => {
    const { returnTo } = (location.state as { returnTo?: string } | null) ?? {};
    navigate(returnTo ?? "/forms");
  };

  const handleError = (error: DynaformBuilderError) => {
    // lib đã tự toast message của server; đây chỉ để host ghi log riêng.
    console.warn(`[dynaform] ${error.action} lỗi ${error.status ?? ""}: ${error.message}`, error.details);
  };

  return (
    <DynaformBuilder
      idForm={id}
      environment={environment}
      mode="editor"
      onClose={handleClose}
      onSaved={(saved) => console.info("Đã lưu", saved)}
      onError={handleError}
      embedPolicy={EMBED_POLICY}
    />
  );
}
```

- Remount khi `idForm` hoặc `environment` đổi. `mode="preview"` → overlay có header + nút đóng.
- Editor `fixed inset-0`: đặt trang này ngoài layout có header riêng, hoặc dùng `className`.

## 4. Người dùng cuối điền và gửi — `mode="release"`

Host có nút Gửi riêng (ví dụ nằm trong footer modal). Lib **ẩn nút Gửi** mặc định (`hideSubmitButton: true`).

```tsx
import { useMemo, useRef, useState } from "react";
import { DynaformBuilder } from "@dnu/dynaform-builder";
import type { DynamicFormBuilderHandle } from "@dnu/dynaform-builder";

type Props = { formJson: Record<string, unknown>; student: { fullName: string; email: string } };

export function ApplyForm({ formJson, student }: Props) {
  const ref = useRef<DynamicFormBuilderHandle>(null);
  const [busy, setBusy] = useState(false);

  // Giá trị điền sẵn: key theo `name` của control; giữ reference ổn định.
  const dataUserFill = useMemo(
    () => ({ full_name: student.fullName, email: student.email }),
    [student.fullName, student.email],
  );

  const handleSubmit = async () => {
    const values = await ref.current?.onSubmit(); // null = form chưa hợp lệ (lib đã hiện lỗi)
    if (!values) return;
    setBusy(true);
    try {
      await fetch("https://api.example.com/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ height: 520 }}>{/* parent PHẢI có chiều cao */}
      <DynaformBuilder ref={ref} form={formJson} dataUserFill={dataUserFill} mode="release" isolatedState />
      <button type="button" disabled={busy} onClick={handleSubmit}>Gửi hồ sơ</button>
    </div>
  );
}
```

- `form` (lib ≥ 4.5.0): dùng thẳng form JSON host đã có, **không** gọi API chi tiết; ưu tiên hơn `idForm`. Giữ reference ổn định (`useMemo`/state).
- Muốn hiện nút Gửi mặc định của runtime thay vì nút của host: `hideSubmitButton={false}`. Các callback `onSubmitForm` / `onNext` / `onPrev` chỉ áp dụng cho `mode="preview"` — ở `release` hãy lấy giá trị bằng `ref.current.onSubmit()`.

## 5. Nhiều form trên một trang

```tsx
<DynaformBuilder form={taskForm}    mode="release" isolatedState />
<DynaformBuilder form={commentForm} mode="release" isolatedState />
```

Thiếu `isolatedState` thì hai form dùng chung state runtime (field_state, busy…) và đè nhau. Với `DynamicFormBuilder` là `config.isolatedState`.

## 6. Engine thuần — `DynamicFormBuilder` (không có backend dynaform)

```tsx
import { useMemo, useRef } from "react";
import { DynamicFormBuilder } from "@dnu/dynaform-builder";
import type { DynamicFormBuilderHandle, FormDesignJson } from "@dnu/dynaform-builder";

// config / data / controls / events khai báo ổn định (module-level hoặc useMemo)
const CONFIG = { mode: "release", formMode: "create", viewport: "lg", hideSubmitButton: false } as const;

export function SurveyForm({ formJson }: { formJson: FormDesignJson }) {
  const ref = useRef<DynamicFormBuilderHandle>(null);
  const data = useMemo(() => ({ dataFormDesign: formJson }), [formJson]);

  return (
    <div style={{ width: "100%", height: 480 }}>
      <DynamicFormBuilder
        ref={ref}
        config={CONFIG}
        data={data}
        onSubmit={(values) => fetch("https://api.example.com/surveys", { method: "POST", body: JSON.stringify(values) })}
        onValidateError={(errors) => console.warn("Chưa hợp lệ", errors)}
        onChange={({ name, value }) => console.debug("đổi", name, value)}
      />
    </div>
  );
}
```

Thứ tự điền sẵn: `dataUserFill` > bản nháp > `bound_variables`. Chế độ sửa: `formMode: "edit"` khoá ô `readonlyOnEdit`; `readOnlyFields: ["code"]` khoá theo tên.

## 7. Request đi qua axios / thêm auth — `config.http`

```tsx
import { api } from "./axios"; // instance axios của host (đã gắn interceptor token)

const CONFIG = {
  mode: "release",
  http: async ({ url, method, headers, body, query, signal }) => {
    const res = await api.request({ url, method, headers, data: body, params: query, signal });
    return { data: res.data, status: res.status }; // lỗi thì throw
  },
} as const;
```

Mọi request dữ liệu (option select, bảng, call_api, `load`) đi qua đúng một transport này. Mặc định là `fetch` trực tiếp → API phải cho CORS;
Data Source `token_source: "system"` đọc cookie `access_token` (không HttpOnly) của host.

## 8. Thay widget của control — `controls`

```tsx
import { DynamicFormBuilder, rawControl } from "@dnu/dynaform-builder";
import type { ControlOverrides, ControlPropsByType } from "@dnu/dynaform-builder";

function BrandInput({ field, id, placeholder, readOnly, disabled }: ControlPropsByType["input"]) {
  return (
    <input
      id={id}
      ref={field.ref}
      value={field.value ?? ""}
      placeholder={placeholder}
      readOnly={readOnly}
      disabled={disabled}
      onBlur={field.onBlur}
      onChange={(e) => field.onChange(e.target.value)} // truyền GIÁ TRỊ, không truyền event
    />
  );
}

// Module level: reference ổn định, nếu không control remount mỗi lần render.
const controls: ControlOverrides = {
  input: BrandInput,                       // mức 1: props đã giải sẵn (label, lỗi, lưới, event do lib lo)
  "record-gallery": rawControl(MyGallery), // mức 3: tự lo mọi thứ (MyGallery là component của host)
};

<DynamicFormBuilder controls={controls} config={CONFIG} data={data} />
```

JSON form không đổi. Component ném lỗi → lib tự rơi về control gốc. Chi tiết: `docs/CONTROL_OVERRIDES.md`.

## 9. Control mới của host — `defineControl`

```tsx
import { defineControl } from "@dnu/dynaform-builder";
import type { ControlOverrides, CustomControlRenderProps } from "@dnu/dynaform-builder";

function StarRating({ field, props }: CustomControlRenderProps<number, { max: number }>) {
  return (
    <div>
      {Array.from({ length: props.max }, (_, i) => i + 1).map((star) => (
        <button key={star} type="button" onClick={() => field.onChange(star)}>★</button>
      ))}
    </div>
  );
}

const controls: ControlOverrides = {
  "x-star-rating": defineControl<{ max: number }, number>({
    label: "Đánh giá sao",
    icon: "Star",
    valueType: "number",   // string | number | boolean | any | { kind: "array", of } | { kind: "object", shape }
    defaultProps: { max: 5 },
    version: 1,
    render: StarRating,
  }),
  // Control hiển thị tĩnh (không có giá trị): category "content"
  "x-banner": defineControl({ category: "content", label: "Banner", render: Banner }),
};
```

Control xuất hiện trong palette (nhóm "Tuỳ biến"), chạy ở editor/preview/release. Hai builder trên một trang phải dùng chung **cùng một** kết quả `defineControl(...)` (khai báo ở module-level). Sự kiện riêng (`events`), `propsSchema`, kiểu giá trị object: `docs/DYNAMIC_FORM_BUILDER_INTEGRATION.md` › "New control types".

Tiền tố `x-` là bắt buộc. Script `dynaform.mjs` **không biết** type `x-…`: validate sẽ báo, cần thêm vào registry nếu dựng bằng script.

## 10. Host đồng bộ form vào editor đang mở — `loadFormJson` (≥ 4.6.0)

```tsx
const ref = useRef<DynamicFormBuilderHandle>(null);
<DynaformBuilder ref={ref} mode="editor" idForm={id} />

// Nhận từng bản snapshot (ví dụ agent dựng dần):
ref.current?.loadFormJson(partialJson, { snapshot: false, progress: { done: 3, total: 8 } }); // không ghi undo
ref.current?.loadFormJson(finalJson);                                                        // lần cuối: 1 bước undo
```

Editor chỉ đọc `data.dataFormDesign` lúc mount; muốn thay nội dung về sau phải gọi hàm này. Sai định dạng → throw (thông báo tiếng Việt như *Open JSON*).
Ở `release` hàm chỉ cảnh báo và không làm gì.

## 11. Chính sách `custom-embed` và CSS tuỳ chỉnh

```tsx
import type { EmbedPolicy } from "@dnu/dynaform-builder";

const EMBED_POLICY: EmbedPolicy = {
  allowSandbox: true,                                  // false: embed có script hiện thông báo thay vì chạy
  allowCustomCss: true,                                // false: bỏ qua CSS/Tailwind tác giả form thêm cho mọi control
  scriptAllowlist: ["https://cdn.jsdelivr.net/npm/"],  // thư viện ngoài (chỉ https)
  imgSrc: ["data:", "https://images.example.com"],     // CSP img-src của khung
  imageFetch: ["https://files.example.com"],           // origin để host tải hộ ảnh http cho embed
  maxEmbedsPerForm: 6,
};
// DynaformBuilder: prop `embedPolicy`; DynamicFormBuilder: `config.embedPolicy`.
```

## 12. Dev với lib build local (không cần tag)

```bash
# trong fe_dynaform
yarn build:lib:local        # build một lần vào .dev-lib/
yarn dev:lib                # hoặc watch

# trong host (mfe-dynaform)
pnpm start:linked           # LINK_DYNAFORM_LIB=true: alias lib sang .dev-lib
```

Không sửa dependency/lockfile; chỉ dùng mode development. Đổi vị trí checkout: biến môi trường `DEV_LOCAL_LIB_PATH`.

## 13. Bắt lỗi lưu form

```tsx
<DynaformBuilder
  mode="editor"
  idForm={id}
  onError={(error) => {
    // error = { action: "save" | "save-as-control", message, status?, details[], body?, cause }
    reportToLogger({ where: `dynaform.${error.action}`, status: error.status, message: error.message });
  }}
/>
```

Lib đã tự toast message chi tiết của server và `console.error` toàn bộ response — `onError` chỉ để host ghi log/telemetry riêng.

---

Lỗi tích hợp thường gặp: bảng cuối SKILL.md (`UI không có style`, `canvas cao 0px`, `form remount liên tục`, `401 liên tục`…).
