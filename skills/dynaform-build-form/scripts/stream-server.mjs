#!/usr/bin/env node
/**
 * stream-server.mjs — cầu nối DEV để trình duyệt xem form hiện dần trong lúc agent đang viết spec.
 *
 *   node stream-server.mjs <spec.json> [--port 4747] [--allow-origin <origin>]...
 *
 * Theo dõi file spec; mỗi lần file đổi thì build lại (bỏ qua phần tham chiếu tới field chưa có) rồi đẩy
 * snapshot FormDesignJson qua SSE tại GET http://127.0.0.1:<port>/events. Trang xem trước của mfe-dynaform
 * (`/form-manager/stream`) kết nối vào đây.
 *
 * Giới hạn an toàn (xem SECURITY.md → "Cầu nối stream"):
 *  - Chỉ lắng nghe 127.0.0.1; chặn Host lạ (DNS rebinding) và Origin ngoài localhost (trừ `--allow-origin`).
 *  - Chỉ ĐỌC đúng file spec truyền vào; không ghi file, không nhận dữ liệu từ client, không exec, không đọc env.
 *  - Nội dung spec chỉ được build thành JSON và đẩy đi, không bao giờ được thực thi.
 *
 * Spec dừng stream bằng cách đặt `"complete": true` ở cấp gốc: khi đó build chặt (checkSpec + checkForm).
 */
import { readFileSync, watchFile, unwatchFile } from "node:fs";
import { createServer } from "node:http";
import { buildForm, checkForm, checkSpec } from "./dynaform.mjs";

const POLL_MS = 200;
const KEEPALIVE_MS = 15000;
const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

// ── Build lenient ───────────────────────────────────────────────────────────────────────────
/**
 * Giữ lại phần spec đã dựng được ở thời điểm này:
 *  - component có `parent` chưa xuất hiện (hoặc đang bị hoãn) → hoãn;
 *  - validation/rule/action/dependsOn trỏ tới field chưa có → bỏ tạm (sẽ có lại ở lần build sau).
 * Trả về spec đã cắt + danh sách `pending` để báo người xem.
 */
export function pruneSpec(spec) {
  const comps = Array.isArray(spec?.components) ? spec.components : [];
  const pending = [];
  const kept = [];
  const names = new Set();
  for (const raw of comps) {
    if (!raw || typeof raw !== "object" || typeof raw.name !== "string") continue;
    if (raw.parent !== undefined && !names.has(raw.parent)) {
      pending.push({ name: raw.name, reason: `chờ container "${raw.parent}"` });
      continue;
    }
    kept.push(structuredClone(raw));
    names.add(raw.name);
  }

  const waiting = new Set(comps.filter((c) => typeof c?.name === "string" && !names.has(c.name)).map((c) => c.name));
  const note = (name, ref) => {
    if (!names.has(ref)) pending.push({ name, reason: `logic chờ field "${ref}"${waiting.has(ref) ? "" : " (chưa khai báo)"}` });
  };

  for (const c of kept) {
    if (Array.isArray(c.validations))
      c.validations = c.validations.filter((v) => {
        if (v?.type !== "matchField") return true;
        note(c.name, v.value);
        return names.has(v.value);
      });
    if (Array.isArray(c.rules))
      c.rules = c.rules.filter((r) => {
        const refs = [...(r?.when ?? []).map((w) => w?.field), ...(r?.then ?? []).map((a) => a?.target)].filter(Boolean);
        refs.forEach((ref) => note(c.name, ref));
        return refs.every((ref) => names.has(ref));
      });
    if (Array.isArray(c.events))
      for (const h of c.events)
        if (Array.isArray(h?.actions))
          h.actions = h.actions.filter((a) => {
            if (!a?.target) return true;
            note(c.name, a.target);
            return names.has(a.target);
          });
    const dep = c.dataSource?.api?.dependsOn;
    if (Array.isArray(dep)) {
      dep.forEach((d) => note(c.name, d));
      c.dataSource.api.dependsOn = dep.filter((d) => names.has(d));
      if (!c.dataSource.api.dependsOn.length) delete c.dataSource.api.dependsOn;
    }
  }
  const uniq = [...new Map(pending.map((p) => [`${p.name}|${p.reason}`, p])).values()];
  return { spec: { ...spec, components: kept }, pending: uniq };
}

const summarize = (spec) =>
  (Array.isArray(spec?.components) ? spec.components : [])
    .filter((c) => c && typeof c.name === "string")
    .map((c) => ({ name: c.name, type: String(c.type ?? ""), label: String(c.label ?? ""), parent: c.parent ?? null }));

/** Spec thô → snapshot gửi cho trình xem. Trả null nếu file chưa parse được (đang ghi dở). */
export function computeSnapshot(text, seq) {
  let spec;
  try {
    spec = JSON.parse(text.replace(/^﻿/, "")); // file ghi từ PowerShell/Windows có thể mang BOM
  } catch {
    return null;
  }
  if (!spec || typeof spec !== "object") return null;
  const complete = spec.complete === true;
  const total = Array.isArray(spec.components) ? spec.components.length : 0;
  const base = { seq, complete, total, name: String(spec.name ?? ""), warnings: [], errors: [], pending: [] };

  if (complete) {
    const spec1 = checkSpec(spec);
    if (spec1.errors.length) return { ...base, ok: false, errors: spec1.errors, warnings: spec1.warnings, components: summarize(spec) };
    const form = buildForm(spec, { stableIds: true });
    const form1 = checkForm(form);
    return {
      ...base, ok: form1.errors.length === 0, errors: form1.errors, warnings: spec1.warnings,
      shown: total, components: summarize(spec), form,
    };
  }

  const { spec: pruned, pending } = pruneSpec(spec);
  const chk = checkSpec(pruned);
  const components = summarize(pruned);
  if (chk.errors.length) return { ...base, ok: false, errors: chk.errors, pending, shown: components.length, components };
  return {
    ...base, ok: true, pending, shown: components.length, components,
    // Đang ghi dở: hàng chưa đủ 12 cột và thiếu nút submit là bình thường, chỉ báo khi `complete: true`.
    warnings: chk.warnings.filter((w) => w !== "form chưa có nút submit" && !w.startsWith("hàng ")),
    form: buildForm(pruned, { stableIds: true }),
  };
}

// ── Server ──────────────────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const out = { file: null, port: 4747, origins: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--port") out.port = Number(argv[++i]);
    else if (argv[i] === "--allow-origin") out.origins.push(argv[++i]);
    else if (!out.file) out.file = argv[i];
  }
  return out;
}

function main() {
  const { file, port, origins } = parseArgs(process.argv.slice(2));
  if (!file || !Number.isInteger(port) || port < 1024 || port > 65535) {
    console.error("usage: stream-server.mjs <spec.json> [--port 4747] [--allow-origin <origin>]");
    process.exit(2);
  }
  const allowedOrigin = (o) => LOCAL_ORIGIN.test(o) || origins.includes(o);
  const clients = new Set();
  let lastText = null;
  let seq = 0;
  let latest = null; // snapshot mới nhất (kể cả lỗi)

  const send = (res, snap) => res.write(`id: ${snap.seq}\nevent: snapshot\ndata: ${JSON.stringify(snap)}\n\n`);

  const refresh = () => {
    let text;
    try {
      text = readFileSync(file, "utf8");
    } catch {
      return; // file chưa tồn tại / đang bị khoá
    }
    if (text === lastText) return;
    const snap = computeSnapshot(text, seq + 1);
    if (!snap) return; // JSON dở dang: đợi lần ghi tiếp theo
    lastText = text;
    seq += 1;
    latest = snap;
    for (const res of clients) send(res, snap);
    const tail = snap.ok ? "" : ` | LỖI: ${snap.errors[0]}`;
    console.error(`#${snap.seq} hiển thị ${snap.shown ?? 0}/${snap.total}${snap.pending.length ? `, chờ ${snap.pending.length}` : ""}${snap.complete ? " [complete]" : ""}${tail}`);
  };

  const server = createServer((req, res) => {
    const host = String(req.headers.host ?? "");
    const origin = req.headers.origin;
    if (!/^(127\.0\.0\.1|localhost|\[::1\]):\d+$/.test(host)) return res.writeHead(403).end("forbidden host");
    if (origin && !allowedOrigin(origin)) return res.writeHead(403).end("forbidden origin");
    const cors = origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {};
    if (req.method === "OPTIONS") return res.writeHead(204, { ...cors, "Access-Control-Allow-Methods": "GET" }).end();
    if (req.method !== "GET") return res.writeHead(405, { Allow: "GET" }).end();

    const path = (req.url ?? "").split("?")[0];
    if (path === "/events") {
      res.writeHead(200, { ...cors, "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
      res.write("retry: 2000\n\n");
      if (latest) send(res, latest);
      clients.add(res);
      req.on("close", () => clients.delete(res));
    } else if (path === "/snapshot") {
      res.writeHead(200, { ...cors, "Content-Type": "application/json" }).end(JSON.stringify(latest));
    } else if (path === "/health") {
      res.writeHead(200, { ...cors, "Content-Type": "application/json" }).end(JSON.stringify({ ok: true, seq, clients: clients.size }));
    } else res.writeHead(404).end();
  });

  const keepalive = setInterval(() => clients.forEach((res) => res.write(": ping\n\n")), KEEPALIVE_MS);
  keepalive.unref();
  watchFile(file, { interval: POLL_MS }, refresh);
  refresh();

  server.listen(port, "127.0.0.1", () => {
    console.error(`stream-server: theo dõi ${file}`);
    console.error(`stream-server: SSE tại http://127.0.0.1:${port}/events (chỉ localhost) — Ctrl+C để dừng`);
  });
  server.on("error", (e) => {
    console.error(`stream-server: ${e.code === "EADDRINUSE" ? `cổng ${port} đang bận (thử --port khác)` : e.message}`);
    process.exit(1);
  });
  const stop = () => {
    unwatchFile(file, refresh);
    clients.forEach((res) => res.end());
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500).unref();
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}

const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/").split("/").pop());
if (isMain) main();
