#!/usr/bin/env node
/**
 * dynaform.mjs — sinh và kiểm tra form JSON của @dnu/dynaform-builder (không phụ thuộc thư viện ngoài).
 *
 *   node dynaform.mjs build    <spec.json> [--out form.json]   spec gọn  -> FormDesignJson
 *   node dynaform.mjs validate <form.json | spec.json>          kiểm tra, exit 1 nếu có lỗi
 *
 * Định dạng đầu ra bám theo FormComponentModel.toGroupJSON (fe_dynaform) và được đọc lại bởi
 * transformFormComponents. Xem references/spec-format.md để biết cú pháp spec.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { Script } from "node:vm";

// ── Registry: type → thông tin item_control (lấy từ src/config/component-groups.ts) ──────────
const R = (group, renderer, icon, display, category = "form") => ({ group, renderer, icon, display, category });
export const TYPE_REGISTRY = {
  container: R("layout", "DfsContainer", "Container", "Container", "layout"),
  grid: R("layout", "DfsGrid", "LayoutGrid", "Grid", "layout"),
  columns: R("layout", "DfsColumns2", "Columns2", "Columns", "layout"),
  tab: R("layout", "DfsTabs", "PanelTop", "Tab", "layout"),
  steps: R("layout", "DfsFormSteps", "Footprints", "Steps", "layout"),
  list: R("layout", "DfsList", "List", "List", "layout"),
  "nested-list": R("layout", "DfsNestedList", "ListTree", "Nested list", "layout"),
  dialog: R("layout", "DfsDialog", "SquareStack", "Dialog", "layout"),
  drawer: R("layout", "DfsDrawer", "PanelRight", "Drawer", "layout"),
  "bottom-sheet": R("layout", "DfsBottomSheet", "PanelBottom", "Bottom Sheet", "layout"),
  text: R("basic", "DfsText", "Type", "Text", "content"),
  input: R("basic", "DfsTextField", "TextCursorInput", "Text Field"),
  textarea: R("basic", "DfsTextareaField", "Type", "Textarea"),
  number: R("basic", "DfsNumberField", "Hash", "Number Field"),
  email: R("basic", "DfsEmailField", "Mail", "Email"),
  password: R("basic", "DfsPasswordField", "Lock", "Password"),
  file: R("basic", "DfsFileUploadField", "Upload", "File upload"),
  tel: R("basic", "DfsTelephoneField", "Phone", "Telephone"),
  url: R("basic", "DfsUrlField", "Link", "URL"),
  checkbox: R("basic", "DfsCheckboxField", "CheckSquare", "Checkbox"),
  "checkbox-group": R("basic", "DfsCheckboxGroupField", "ListChecks", "Checkbox Group"),
  "radio-group": R("basic", "DfsRadioGroupField", "CircleDot", "Radio Group"),
  switch: R("basic", "DfsSwitchField", "ToggleRight", "Switch"),
  select: R("basic", "DfsSelectField", "ChevronDown", "Select"),
  "tree-select": R("basic", "DfsTreeSelectField", "ListTree", "Select Tree"),
  "range-slider": R("basic", "DfsRangeSliderField", "SlidersHorizontal", "Range Slider"),
  hidden: R("basic", "DfsHiddenField", "EyeOff", "Hidden Field"),
  link: R("basic", "DfsLink", "Link2", "Link", "content"),
  image: R("basic", "DfsImage", "Image", "Image", "content"),
  divider: R("basic", "DfsDivider", "Minus", "Divider", "content"),
  button: R("basic", "DfsButtonField", "MousePointerClick", "Button"),
  "submit-button": R("basic", "DfsSubmitButtonField", "Send", "Submit Button"),
  "reset-button": R("basic", "DfsResetButton", "RotateCcw", "Reset Button"),
  matrix: R("advanced", "DfsMatrixField", "Grid3X3", "Matrix"),
  signature: R("advanced", "DfsSignatureField", "PenLine", "Signature"),
  "wysiwyg-editor": R("advanced", "DfsWysiwygEditorField", "FileText", "WYSIWYG Editor"),
  "date-picker": R("advanced", "DfsDatePickerField", "CalendarDays", "Date Picker"),
  "range-picker": R("advanced", "DfsRangePicker", "CalendarRange", "Date Range Picker"),
  "time-picker": R("advanced", "DfsTimePicker", "Clock", "Time Picker"),
  calendar: R("advanced", "DfsCalendar", "Calendar", "Calendar"),
  table: R("advanced", "DfsFormTable", "Table", "Table", "content"),
  // Control cấu hình sâu — script chỉ dựng khung, cấu hình chi tiết (props) hoặc làm trong builder.
  timeline: R("advanced", "DfsFormTimeline", "History", "Timeline", "content"),
  descriptions: R("advanced", "DfsFormDescriptions", "ListChecks", "Descriptions", "content"),
  "json-tree": R("advanced", "DfsJsonTree", "Braces", "JSON Tree"),
  code: R("advanced", "code", "Code2", "Code"),
  "form-loop": R("layout", "DfsFormLoop", "Repeat", "Form Loop", "layout"),
  "sub-form": R("layout", "DfsSubForm", "FileStack", "Sub-form", "content"),
  "record-picker": R("choose", "DfsRecordPickerField", "LayoutList", "Record Picker"),
  "record-gallery": R("choose", "DfsRecordGalleryField", "GalleryVerticalEnd", "Record Gallery"),
  "stat-cards": R("choose", "DfsStatCardsField", "ChartColumn", "Stat Cards"),
  "sortable-list": R("choose", "DfsSortableListField", "ArrowDownUp", "Sortable List"),
  // Dùng CUỐI CÙNG: chỉ khi không control nào ở trên đáp ứng được (xem dynaform-components › custom-embed).
  "custom-embed": R("choose", "DfsCustomEmbedField", "CodeXml", "Custom Embed"),
};

/** Container có con; giá trị = cách chia "ngăn" của children. */
const CONTAINER_KIND = {
  container: "flat",
  dialog: "flat",
  drawer: "flat",
  "bottom-sheet": "flat",
  tab: "panels", // properties.tabs[].id  -> parent_tab_id
  steps: "panels", // properties.steps[].id -> parent_tab_id
  columns: "columns", // col-0, col-1, ...
};
const OPTION_TYPES = new Set(["select", "radio-group", "checkbox-group", "tree-select"]);
const VALIDATION_TYPES = new Set([
  "required", "readOnly", "min", "max", "minLength", "maxLength", "contains", "notContains",
  "greater", "lower", "equals", "notEquals", "greaterEqual", "lowerEqual", "email", "url", "regex", "matchField",
]);
const OPERATORS = new Set([
  "equals", "notEquals", "isEmpty", "isNotEmpty", "greaterThan", "lessThan", "contains", "notContains",
]);
const REF_ACTIONS = new Set([
  "show", "hide", "enable", "disable", "require", "optional", "setValue",
  "openModal", "closeModal", "toggleModal", "switchTab", "collapse",
]);
const OTHER_ACTIONS = new Set(["openLink", "callApi", "customScript", "flow"]);
const EVENTS = new Set(["click", "dblclick", "hover", "change", "load", "open", "close"]);
const NAME_RE = /^[a-z][a-z0-9_]*$/;
const EMBED_NAME_RE = /^[A-Za-z][\w-]*$/; // tên input / output / event của custom-embed (khớp lib)
const EMBED_VALUE_TYPES = new Set(["none", "string", "number", "boolean", "array", "object"]);

const DEFAULT_THEME = {
  styles: { type: "normal", borderRadius: "0.5rem", fontSize: "14px" },
  colors: {
    background: "#FFFFFF", foreground: "#09090B", primary: "#18181B", primaryForeground: "#FAFAFA",
    secondary: "#F4F4F5", secondaryForeground: "#18181B", border: "#E4E4E7",
  },
};

// ── Kiểm tra spec ───────────────────────────────────────────────────────────────────────────
export function checkSpec(spec) {
  const errors = [];
  const warnings = [];
  const comps = Array.isArray(spec?.components) ? spec.components : null;
  if (!comps) return { errors: ["spec.components phải là mảng"], warnings };
  const byName = new Map();
  comps.forEach((c, i) => {
    const at = `components[${i}]${c?.name ? ` (${c.name})` : ""}`;
    if (!c || typeof c !== "object") return errors.push(`${at}: không phải object`);
    if (!TYPE_REGISTRY[c.type]) errors.push(`${at}: type "${c.type}" không có trong registry`);
    if (!c.name || !NAME_RE.test(c.name)) errors.push(`${at}: name phải là snake_case (a-z0-9_), bắt đầu bằng chữ`);
    else if (byName.has(c.name)) errors.push(`${at}: name "${c.name}" bị trùng`);
    else byName.set(c.name, { c, i });
  });
  comps.forEach((c, i) => {
    if (!c || typeof c !== "object") return;
    const at = `components[${i}] (${c.name})`;
    if (c.colSpan !== undefined && !(Number.isInteger(+c.colSpan) && +c.colSpan >= 1 && +c.colSpan <= 12))
      errors.push(`${at}: colSpan phải là số nguyên 1..12`);
    if (OPTION_TYPES.has(c.type) && !c.dataSource) {
      if (!Array.isArray(c.options) || c.options.length < 2)
        errors.push(`${at}: ${c.type} cần options[] (>= 2 mục) hoặc dataSource`);
      else for (const o of c.options)
        if (o?.label === undefined || o?.value === undefined) errors.push(`${at}: mỗi option cần label và value`);
    }
    for (const v of c.validations ?? []) {
      if (!VALIDATION_TYPES.has(v?.type)) errors.push(`${at}: validation type "${v?.type}" không hợp lệ`);
      if (v?.type === "matchField") {
        if (!byName.has(v.value)) errors.push(`${at}: matchField trỏ tới "${v.value}" không tồn tại`);
      }
    }
    if (c.parent !== undefined) {
      const p = byName.get(c.parent);
      if (!p) errors.push(`${at}: parent "${c.parent}" không tồn tại`);
      else {
        if (p.i >= i) errors.push(`${at}: parent "${c.parent}" phải đứng TRƯỚC con trong mảng`);
        const kind = CONTAINER_KIND[p.c.type];
        if (!kind) errors.push(`${at}: "${c.parent}" (${p.c.type}) không phải container`);
        else if (kind === "panels") {
          const panels = (p.c.type === "tab" ? p.c.tabs : p.c.steps) ?? [];
          if (!c.tabId || !panels.some((t) => t.id === c.tabId))
            errors.push(`${at}: cần tabId thuộc ${p.c.type} "${c.parent}" (${panels.map((t) => t.id).join(", ") || "chưa khai báo"})`);
        } else if (kind === "columns") {
          const n = p.c.columns?.count ?? 2;
          if (!/^col-\d+$/.test(c.tabId ?? "") || +c.tabId.slice(4) >= n)
            errors.push(`${at}: columns "${c.parent}" cần tabId dạng col-0..col-${n - 1}`);
        }
      }
    }
    if ((c.type === "tab" || c.type === "steps") && !Array.isArray(c.type === "tab" ? c.tabs : c.steps))
      errors.push(`${at}: ${c.type} cần ${c.type === "tab" ? "tabs" : "steps"}: [{ id, label }]`);
    if (c.type === "columns" && c.columns?.spans) {
      const sum = c.columns.spans.reduce((a, b) => a + b, 0);
      if (sum !== 12) errors.push(`${at}: columns.spans phải có tổng 12 (hiện ${sum})`);
    }
    const refs = [];
    for (const h of c.events ?? []) {
      if (!EVENTS.has(h?.event) && !/^(control|embed|menu):.+/.test(h?.event ?? ""))
        errors.push(`${at}: event "${h?.event}" không hợp lệ`);
      refs.push(...(h.actions ?? []));
    }
    for (const r of c.rules ?? []) {
      for (const cond of r.when ?? []) {
        if (!byName.has(cond.field)) errors.push(`${at}: rules.when.field "${cond.field}" không tồn tại`);
        if (!OPERATORS.has(cond.operator)) errors.push(`${at}: operator "${cond.operator}" không hợp lệ`);
      }
      refs.push(...(r.then ?? []));
    }
    for (const a of refs) {
      if (!REF_ACTIONS.has(a?.type) && !OTHER_ACTIONS.has(a?.type)) errors.push(`${at}: action "${a?.type}" không hợp lệ`);
      if (REF_ACTIONS.has(a?.type) && !byName.has(a.target)) errors.push(`${at}: action ${a.type} trỏ tới "${a.target}" không tồn tại`);
    }
    for (const a of refs) if (a?.type === "switchTab" || a?.type === "collapse")
      warnings.push(`${at}: action ${a.type} chưa có tác dụng ở runtime (action engine) — dùng set_values/flow thay thế`);
    if (c.dataSource?.api?.dependsOn)
      for (const d of c.dataSource.api.dependsOn) if (!byName.has(d)) errors.push(`${at}: dataSource.dependsOn "${d}" không tồn tại`);
    if (c.type === "dialog" && c.parent === undefined && !c.dialog?.variant) warnings.push(`${at}: dialog nên khai báo dialog.variant`);
    if (c.type === "hidden")
      warnings.push(`${at}: control "hidden" — ưu tiên action flow (set_values, $steps.<id>.output, $event.payload) thay vì cất trạng thái vào field ẩn. Chỉ giữ khi giá trị phải nằm trong payload submit mà không có nguồn hiển thị, hoặc host nạp sẵn (dataUserFill)${c.reason ? ` — lý do: ${c.reason}` : "; ghi lý do vào khoá reason"}`);
    for (const a of refs) if (a?.type === "customScript")
      warnings.push(`${at}: customScript — ưu tiên flow có sẵn step (set_values, call_api, branch…); chỉ dùng script khi không step nào làm được`);
    if (c.type === "custom-embed") checkEmbedSpec(c, at, byName, errors, warnings);
    else if (c.embed !== undefined) errors.push(`${at}: khoá "embed" chỉ dùng cho type custom-embed`);
  });
  if (!comps.some((c) => c?.type === "submit-button" || c?.type === "button")) warnings.push("form chưa có nút submit");
  return { errors, warnings };
}

/** Kiểm tra `embed` của custom-embed: chỉ dùng khi control có sẵn không đáp ứng; khi dùng thì React (TSX) + Tailwind. */
function checkEmbedSpec(c, at, byName, errors, warnings) {
  if (typeof c.reason !== "string" || !c.reason.trim())
    errors.push(`${at}: custom-embed cần "reason" — nêu control có sẵn nào đã cân nhắc và vì sao không đáp ứng (xem dynaform-components › Khi nào mới dùng custom-embed)`);
  else warnings.push(`${at}: dùng custom-embed — lý do: ${c.reason}`);
  const e = c.embed;
  if (!e || typeof e !== "object") return errors.push(`${at}: custom-embed cần embed: { code, inputs?, outputs?, events? }`);
  const mode = e.mode ?? "sandbox";
  if (mode !== "sandbox" && mode !== "template") errors.push(`${at}: embed.mode phải là "sandbox" | "template"`);
  const react = mode === "sandbox" && e.framework !== "none";
  if (!react) warnings.push(`${at}: ưu tiên embed React + Tailwind (mode "sandbox", framework mặc định "react"); Template / JS thuần chỉ cho khối tĩnh rất đơn giản`);
  if (e.valueType !== undefined && !EMBED_VALUE_TYPES.has(e.valueType)) errors.push(`${at}: embed.valueType phải là ${[...EMBED_VALUE_TYPES].join(" | ")}`);
  if (e.tailwind === false) warnings.push(`${at}: embed.tailwind=false — ưu tiên Tailwind, CSS thuần chỉ là phần thêm`);
  if (typeof e.css === "string" && e.css.trim()) warnings.push(`${at}: embed.css (CSS thuần) — ưu tiên class Tailwind trong code`);
  if (react) {
    const code = e.code ?? e.js;
    if (typeof code !== "string" || !code.trim()) errors.push(`${at}: embed React cần embed.code (hoặc embed.js)`);
    else {
      try { new Script(code, { filename: `${c.name}.embed.js` }); } // chỉ biên dịch để bắt lỗi cú pháp, KHÔNG chạy
      catch (err) {
        errors.push(`${at}: embed.code không phải JavaScript hợp lệ (${err.message}). Script không biên dịch TSX — dùng thẻ DfbReact.html\`<div class="…">…</div>\` thay JSX, không dùng import/export`);
      }
      if (/class(?:Name)?=["'`]?[^"'`>]*\$\{/.test(code))
        warnings.push(`${at}: class ghép lúc chạy (class="…\${…}") không được Tailwind sinh CSS — viết đủ tên class`);
      if (!/\bDfbReact\b/.test(code)) warnings.push(`${at}: embed.code chưa dùng DfbReact (const { html, render, useDfbData } = DfbReact; … render(App))`);
    }
  }
  const seen = new Set();
  for (const [i, inp] of (e.inputs ?? []).entries()) {
    if (!EMBED_NAME_RE.test(inp?.name ?? "")) errors.push(`${at}: embed.inputs[${i}].name không hợp lệ`);
    else if (seen.has(inp.name)) errors.push(`${at}: embed.inputs trùng name "${inp.name}"`);
    else seen.add(inp.name);
    if (inp?.field !== undefined && !byName.has(inp.field)) errors.push(`${at}: embed.inputs[${i}].field "${inp.field}" không tồn tại`);
    if (inp?.field === undefined && inp?.ref === undefined) errors.push(`${at}: embed.inputs[${i}] cần field (name của field) hoặc ref (đường dẫn layout)`);
  }
  for (const [i, out] of (e.outputs ?? []).entries()) {
    if (!EMBED_NAME_RE.test(out?.name ?? "")) errors.push(`${at}: embed.outputs[${i}].name không hợp lệ`);
    if (!byName.has(out?.to)) errors.push(`${at}: embed.outputs[${i}].to "${out?.to}" không tồn tại`);
  }
  const declared = new Set(e.events ?? []);
  for (const ev of declared) if (!EMBED_NAME_RE.test(ev)) errors.push(`${at}: embed.events "${ev}" không hợp lệ`);
  for (const h of c.events ?? []) {
    const m = /^embed:(.+)$/.exec(h?.event ?? "");
    if (m && !declared.has(m[1])) errors.push(`${at}: event "${h.event}" chưa khai báo trong embed.events`);
  }
  if (e.tailwind !== false)
    warnings.push(`${at}: tailwindCss chưa được sinh — mở form trong builder → Mã nhúng → Lưu (biên dịch TSX + Tailwind) trước khi dùng`);
}

/** spec.embed → properties.embed (khớp EmbedControlConfig của lib). Không sinh tailwindCss: chỉ builder biên dịch được. */
function buildEmbedConfig(e) {
  const mode = e.mode ?? "sandbox";
  const react = mode === "sandbox" && e.framework !== "none";
  const code = e.code ?? e.source;
  const cfg = {
    schemaVersion: 1, mode, valueType: e.valueType ?? "none",
    html: e.html ?? (react ? '<div id="root"></div>' : ""),
    css: e.css ?? "",
    inputs: (e.inputs ?? []).map((i) => ({ name: i.name, from: i.field !== undefined ? { field: i.field } : { ref: i.ref } })),
    outputs: (e.outputs ?? []).map((o) => ({ name: o.name, to: o.to })),
    events: e.events ?? [], permissions: e.permissions ?? [],
    height: e.height ?? { mode: "auto" }, designMode: e.designMode ?? "live",
    tailwind: e.tailwind !== false,
  };
  if (mode === "sandbox") cfg.js = e.js ?? code ?? "";
  if (react) { cfg.framework = "react"; if (code) cfg.source = code; } // source = js: JS hợp lệ cũng là TSX hợp lệ
  if (Array.isArray(e.libs)) cfg.libs = e.libs;
  if (e.sampleData) cfg.sampleData = e.sampleData;
  return cfg;
}

// ── Build ───────────────────────────────────────────────────────────────────────────────────
function buildDataSource(c) {
  const name = c.label ?? c.name;
  if (c.dataSource?.api) {
    const a = c.dataSource.api;
    return {
      name, status: "active", timeout_ms: 5000, description: "",
      ...(a.dependsOn?.length ? { depends_on: a.dependsOn } : {}),
      request_config: {
        method: a.method ?? "GET", headers: a.headers ?? {}, endpoint: a.endpoint ?? "",
        ...(a.pathParams ? { path_params: a.pathParams } : {}),
        ...(a.queryParams ? { query_params: a.queryParams } : {}),
        ...(a.body !== undefined ? { body: a.body } : {}),
      },
      retry_attempts: 2, connection_type: "api",
      response_mapping: [{ path: a.responsePath ?? "", label: a.labelField ?? "label", value: a.valueField ?? "value", variable: c.name }],
      connection_config: { base_url: a.baseUrl ?? "", auth_config: a.auth ?? { type: "none" } },
    };
  }
  if (Array.isArray(c.options) && OPTION_TYPES.has(c.type)) {
    return {
      name, connection_type: "hard",
      connection_config: { value: c.options.map((o) => ({ label: String(o.label), value: String(o.value), ...(o.checked ? { checked: true } : {}) })) },
      request_config: {}, response_mapping: [], timeout_ms: 0, retry_attempts: 0, cache_ttl_seconds: 0, status: "active",
    };
  }
  return {};
}

// ── Action → flow step (khớp lib/action-flow/legacy/legacy-actions.ts) ──────────────────────
const OPERATOR_MAP = {
  equals: "eq", notEquals: "neq", isEmpty: "empty", isNotEmpty: "not_empty",
  greaterThan: "gt", lessThan: "lt", contains: "contains", notContains: "not_contains",
};
const INVERSE = { show: "hide", hide: "show", enable: "disable", disable: "enable", require: "optional", optional: "require" };
const FIELD_STATE = new Set(["show", "hide", "enable", "disable", "require", "optional"]);
const DIALOG_ACTION = { openModal: "open", closeModal: "close", toggleModal: "toggle" };

function actionsToFlow(actions, flowId = "flow") {
  const counters = {};
  const nextId = (t) => `${t}_${(counters[t] = (counters[t] ?? 0) + 1)}`;
  const steps = [];
  for (const a of actions ?? []) {
    if (a.type === "flow") { steps.push(a.flow); continue; }
    if (FIELD_STATE.has(a.type)) steps.push({ id: nextId("field_state"), type: "field_state", action: a.type, targets: [a.target] });
    else if (a.type === "setValue")
      steps.push({ id: nextId("set_values"), type: "set_values", mappings: [{
        to: a.target,
        from: a.valueType === "field" ? { type: "ref", path: `$form.current.values.${a.value}` } : { type: "literal", value: a.value ?? "" },
      }] });
    else if (DIALOG_ACTION[a.type]) steps.push({ id: nextId("dialog"), type: "dialog", action: DIALOG_ACTION[a.type], target: a.target });
    else if (a.type === "openLink") steps.push({ id: nextId("navigate"), type: "navigate", url: a.url, newTab: a.newTab !== false });
    else if (a.type === "customScript") steps.push({ id: nextId("run_script"), type: "run_script", code: a.code, continueOnError: true });
    else if (a.type === "callApi")
      steps.push({ id: nextId("call_api"), type: "call_api", url: a.url, method: a.method ?? "GET", ...(a.headers ? { headers: a.headers } : {}), ...(a.body !== undefined ? { body: a.body } : {}) });
  }
  return { id: flowId, type: "sequence", label: "Luồng xử lý", steps };
}

function ruleToHandler(r, name, i) {
  const conds = (r.when ?? []).map((w) => {
    const operator = OPERATOR_MAP[w.operator] ?? "eq";
    const left = { type: "ref", path: `$form.current.values.${w.field}` };
    return ["empty", "not_empty"].includes(operator) ? { left, operator } : { left, operator, right: { type: "literal", value: w.value ?? "" } };
  });
  const condition = conds.length === 1 ? conds[0] : r.match === "OR" ? { any: conds } : { all: conds };
  const undo = (r.then ?? []).filter((a) => INVERSE[a.type] && a.target).map((a) => ({ ...a, type: INVERSE[a.type] }));
  const label = r.name ?? `Rule ${i + 1}`;
  const branch = { id: "branch_1", type: "branch", label, condition, then: actionsToFlow(r.then, "flow_then") };
  if (undo.length) branch.else = actionsToFlow(undo, "flow_else");
  return {
    id: r.id ?? `eh_rule_${name}_${i + 1}`, event: "condition", enabled: true,
    actions: [{ type: "flow", flow: { id: "flow", type: "sequence", label, steps: [branch] } }],
  };
}

function buildItemControl(c, order, ids) {
  const reg = TYPE_REGISTRY[c.type];
  const id = ids.get(c.name);
  const props = {
    label: c.label ?? c.name,
    helpText: c.helpText ?? "",
    hidden: c.hidden === true,
    ...(c.placeholder !== undefined ? { placeholder: c.placeholder } : {}),
    ...(c.required ? { required: true } : {}),
    ...(c.disabled ? { disabled: true } : {}),
    ...(c.readonly ? { readonly: true } : {}),
    ...(c.attributes ? { attributes: c.attributes } : {}),
    ...(c.content !== undefined ? { content: c.content } : {}),
    ...(c.tabs ? { tabs: c.tabs } : {}),
    ...(c.steps ? { steps: c.steps } : {}),
    ...(c.stepsOptions ? { stepsOptions: c.stepsOptions } : {}),
    ...(c.columns ? { columns: { count: 2, gap: "1rem", stackOnMobile: "yes", ...c.columns } } : {}),
    ...(c.dialog ? { dialog: c.dialog } : {}),
    ...(c.custom ? { custom: c.custom } : {}),
    ...(c.type === "custom-embed" && c.embed ? { embed: buildEmbedConfig(c.embed) } : {}),
    ...(c.props ?? {}),
  };
  const handlers = [
    ...(c.events ?? []).map((h, i) => ({
      id: h.id ?? `eh_${c.name}_${i + 1}`, event: h.event, enabled: h.enabled !== false,
      actions: [{ type: "flow", flow: h.flow ?? actionsToFlow(h.actions) }],
    })),
    ...(c.rules ?? []).map((r, i) => ruleToHandler(r, c.name, i)),
  ];
  if (handlers.length) props.eventHandlers = handlers;
  const styles = { colSpan: String(c.colSpan ?? 12), ...(c.type === "custom-embed" ? { showLabel: "no", labelPosition: "top" } : {}), ...(c.styles ?? {}) };
  const required = c.required ? [{ type: "required", value: "yes", errorMessage: c.requiredMessage ?? "" }] : [];
  const validations = [...required, ...(c.validations ?? []).filter((v) => !(c.required && v.type === "required"))];
  const dataLang = `${c.type}-${c.name}`;
  return {
    id, sort_order: order, parent_id: c.parent ? ids.get(c.parent) : null,
    ...(c.parent && c.tabId ? { parent_tab_id: c.tabId } : {}),
    type: c.type, slug: `${c.type}-field`, group_code: reg.group, category: reg.category, display_name: reg.display,
    icon: reg.icon, is_activated: true, is_deleted: false,
    renderer_key: c.type === "columns" ? `DfsColumns${Math.min(4, Math.max(2, c.columns?.count ?? 2))}` : reg.renderer,
    data_lang: dataLang,
    variables: {
      name: c.name, scope: "form", display_label: c.label ?? c.name, key_path: c.name,
      data_type: c.dataType ?? (c.type === "number" ? "number" : c.type === "switch" || c.type === "checkbox" ? "boolean" : "string"),
      data_source: buildDataSource(c),
    },
    default_values: c.default ?? null,
    locked_props: { properties: {}, styles: {} },
    editable_props: { properties: props, styles, ...(c.overrides ? { overrides: c.overrides } : {}) },
    logic_rules: [], behavior: {}, validation_schema: validations, children_schema: [],
  };
}

/** UUID tất định theo (seed, key) — dùng cho chế độ stream để mỗi lần build lại vẫn giữ nguyên id. */
function stableUuid(seed, key) {
  const h = createHash("sha1").update(`${seed}:${key}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

/** `opts.stableIds`: id sinh từ name thay vì ngẫu nhiên (build lặp lại cho kết quả giống hệt nhau). */
export function buildForm(spec, opts = {}) {
  const comps = spec.components;
  const seed = spec.id ?? spec.name ?? "form";
  const uid = (key) => (opts.stableIds ? stableUuid(seed, key) : randomUUID());
  const ids = new Map(comps.map((c) => [c.name, uid(`item:${c.name}`)]));
  const order = new Map();
  const controls = new Map(); // name -> item_control
  const roots = [];
  comps.forEach((c) => {
    const key = c.parent ?? "";
    const n = (order.get(key) ?? 0) + 1;
    order.set(key, n);
    const ic = buildItemControl(c, n, ids);
    controls.set(c.name, ic);
    const wrapper = CONTAINER_KIND[c.type]
      ? ic // container: không có vỏ ngoài (đúng như builder xuất)
      : {
          id: uid(`wrap:${c.name}`), parent_id: ic.parent_id, data_lang: ic.data_lang, status: "", variable_name: c.name,
          external_id: "", validation_rules: {}, logic_rules: [], variable_rules: {}, sort_order: n, page: 1,
          kind: "component", item_control: ic,
        };
    if (c.parent) controls.get(c.parent).children_schema.push(wrapper);
    else roots.push(wrapper);
  });
  const id = spec.id ?? uid("form");
  return {
    id, name: spec.name ?? "Untitled form", description: spec.description ?? "",
    settings: {
      setting: {
        name: spec.name ?? "", id, endpoint: spec.endpoint ?? "", method: spec.method ?? "POST",
        addUniqueIdentifier: false, formKey: spec.formKey ?? "", size: spec.size ?? "normal",
      },
      theme: spec.theme ?? DEFAULT_THEME,
    },
    form_components: roots,
  };
}

/** Duyệt step tree, gọi cb với mọi tên field/dialog được tham chiếu. */
function collectRefs(step, cb) {
  if (!step || typeof step !== "object") return;
  if (step.type === "field_state") (step.targets ?? []).forEach((t) => cb(t, "field_state"));
  if (step.type === "dialog" && step.target) cb(step.target, "dialog");
  if (step.type === "set_values") (step.mappings ?? []).forEach((m) => m.to && cb(m.to, "set_values"));
  const walkCond = (c) => {
    if (!c) return;
    (c.all ?? c.any ?? []).forEach(walkCond);
    const p = c.left?.path;
    if (typeof p === "string" && p.startsWith("$form.current.values.")) cb(p.slice("$form.current.values.".length).split(".")[0], "condition");
  };
  walkCond(step.condition);
  for (const k of ["steps", "catch", "finally"]) (step[k] ?? []).forEach((s) => collectRefs(s, cb));
  for (const k of ["then", "else"]) collectRefs(step[k], cb);
}

// ── Kiểm tra form JSON đã build ─────────────────────────────────────────────────────────────
export function checkForm(form) {
  const errors = [];
  const root = form.form_content ?? form;
  const list = root.form_components;
  if (!Array.isArray(list)) return { errors: ["thiếu form_components[]"], warnings: [] };
  const ids = new Set();
  const names = new Map();
  const flat = [];
  const walk = (w, parent) => {
    const ic = w.item_control ?? w;
    flat.push({ ic, parent });
    if (ids.has(ic.id)) errors.push(`id trùng: ${ic.id}`);
    ids.add(ic.id);
    const nm = ic.variables?.name;
    if (nm) {
      if (names.has(nm)) errors.push(`variables.name trùng: ${nm}`);
      names.set(nm, ic);
    }
    for (const ch of ic.children_schema ?? []) walk(ch, ic);
  };
  list.forEach((w) => walk(w, null));
  for (const { ic, parent } of flat) {
    const at = `${ic.type}(${ic.variables?.name ?? ic.id})`;
    if (!TYPE_REGISTRY[ic.type]) errors.push(`${at}: type không có trong registry`);
    if (!ic.variables?.name && ic.category === "form" && !["submit-button", "button", "reset-button"].includes(ic.type))
      errors.push(`${at}: thiếu variables.name`);
    if (OPTION_TYPES.has(ic.type)) {
      const ds = ic.variables?.data_source ?? {};
      const hard = ds.connection_config?.value;
      if (!(Array.isArray(hard) && hard.length >= 2) && ds.connection_type !== "api")
        errors.push(`${at}: thiếu options (hard >= 2 mục hoặc data_source api)`);
    }
    if (parent && CONTAINER_KIND[parent.type] === "panels") {
      const panels = parent.editable_props?.properties?.[parent.type === "tab" ? "tabs" : "steps"] ?? [];
      if (!panels.some((p) => p.id === ic.parent_tab_id)) errors.push(`${at}: parent_tab_id "${ic.parent_tab_id}" không thuộc ${parent.type}`);
    }
    for (const v of ic.validation_schema ?? [])
      if (v.type === "matchField" && !names.has(v.value)) errors.push(`${at}: matchField -> "${v.value}" không tồn tại`);
    for (const h of ic.editable_props?.properties?.eventHandlers ?? [])
      for (const a of h.actions ?? [])
        if (a.type === "flow") collectRefs(a.flow, (t, kind) => {
          if (!names.has(t)) errors.push(`${at}: ${kind} -> "${t}" không tồn tại`);
        });
  }
  const warnings = [];
  for (const { ic } of flat) {
    const at = `${ic.type}(${ic.variables?.name ?? ic.id})`;
    if (ic.type === "hidden") warnings.push(`${at}: control "hidden" — ưu tiên action flow; chỉ giữ khi thật sự cần (payload submit / dataUserFill)`);
    if (ic.type === "custom-embed") {
      const emb = ic.editable_props?.properties?.embed;
      warnings.push(`${at}: custom-embed — chỉ dùng khi control có sẵn không đáp ứng; ưu tiên React + Tailwind`);
      if (emb?.tailwind && !emb.tailwindCss) warnings.push(`${at}: chưa có tailwindCss — mở trong builder → Mã nhúng → Lưu`);
      if (emb && !(emb.mode === "sandbox" && emb.framework === "react")) warnings.push(`${at}: embed chưa phải React (sandbox + framework "react")`);
    }
  }
  return { errors, warnings };
}

// ── CLI ─────────────────────────────────────────────────────────────────────────────────────
function report({ errors, warnings }) {
  warnings.forEach((w) => console.error(`WARN  ${w}`));
  errors.forEach((e) => console.error(`ERROR ${e}`));
  return errors.length === 0;
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop());
if (isMain) {
  const [cmd, file, ...rest] = process.argv.slice(2);
  if (!["build", "validate"].includes(cmd) || !file) {
    console.error("usage: dynaform.mjs build <spec.json> [--out form.json] | validate <file.json>");
    process.exit(2);
  }
  const json = JSON.parse(readFileSync(file, "utf8"));
  if (cmd === "build") {
    if (!report(checkSpec(json))) process.exit(1);
    const form = buildForm(json);
    if (!report({ errors: checkForm(form).errors, warnings: [] })) process.exit(1); // cảnh báo đã in ở bước kiểm spec
    const out = rest[rest.indexOf("--out") + 1];
    const text = JSON.stringify(form, null, 2);
    if (rest.includes("--out") && out) {
      writeFileSync(out, text);
      console.error(`OK    ${form.form_components.length} root control(s) -> ${out}`);
    } else process.stdout.write(text + "\n");
  } else {
    const result = json.components && !json.form_components ? checkSpec(json) : checkForm(json);
    if (!report(result)) process.exit(1);
    console.error("OK    hợp lệ");
  }
}
