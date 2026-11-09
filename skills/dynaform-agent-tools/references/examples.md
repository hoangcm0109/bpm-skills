# Ví dụ — agent & dynaform

Mọi URL/dữ liệu là giả (`https://gateway.example.com`), không token. Code bám đúng API của lib (`createSseRunAgentTurn`, `defineClientTool`, props `DynaformBuilder`, ref handle) và của mfe-dynaform.

## 1. Một lượt hội thoại trên dây

Người dùng: "Đổi nhãn Email thành Thư điện tử". Lượt 1 — gateway cần đọc form trước:

```
data: {"type":"run_start","run_id":"r_01","protocol":1}

data: {"type":"text","delta":"Mình xem form hiện tại trước."}

data: {"type":"tool_use","id":"tu_1","name":"get_form_state","input":{}}

data: {"type":"stop","reason":"tool_use"}

data: [DONE]
```

Editor chạy `get_form_state`, nối `assistant` + `user[tool_result]` vào `messages`, gọi lượt 2. Gateway đã có `id` của field nên sửa luôn, và tiện báo một server tool nó vừa chạy:

```
data: {"type":"server_tool","id":"st_1","name":"list_form_versions","status":"ok","summary":"3 version, mới nhất v7"}

data: {"type":"tool_use","id":"tu_2","name":"update_component","input":{"componentId":"a1b2","key":"label","value":"Thư điện tử"}}

data: {"type":"stop","reason":"tool_use"}

data: [DONE]
```

Lượt 3 — xong:

```
data: {"type":"text","delta":"Đã đổi nhãn thành \"Thư điện tử\"."}

data: {"type":"stop","reason":"end_turn"}

data: [DONE]
```

## 2. Hỏi xác nhận trước việc khó hoàn tác

```
data: {"type":"tool_use","id":"tu_9","name":"confirm_action","input":{"message":"Phát hành bản nháp lên DEV?"}}
data: {"type":"stop","reason":"tool_use"}
data: [DONE]
```

`tool_result` = `{"approved":true}` ⇒ agent mới gọi tiếp. `{"approved":false}` ⇒ dừng, hỏi người dùng muốn gì.

## 3. Gateway (khung, Node/TypeScript)

Không phụ thuộc framework; `llm.stream`, `serverTools` là của gateway.

```ts
import type { Request, Response } from "express";

type ToolDef = { name: string; description: string; input_schema: object };

export async function agentTurn(req: Request, res: Response) {
  const { system, tools: clientTools, messages, context } = req.body as {
    system: string; tools: ToolDef[]; messages: unknown[]; context?: { form?: { id?: string } };
  };
  const clientNames = new Set(clientTools.map((t) => t.name));

  res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" });
  const send = (e: object) => res.write(`data: ${JSON.stringify(e)}\n\n`);
  send({ type: "run_start", run_id: crypto.randomUUID(), protocol: 1 });

  let convo = messages;
  for (let i = 0; i < 8; i++) {
    // LLM thấy cả client tool (editor chạy) lẫn server tool (gateway chạy)
    const turn = await llm.complete({ system, messages: convo, tools: [...clientTools, ...serverTools.schemas] });

    for (const block of turn.content) {
      if (block.type === "text") send({ type: "text", delta: block.text });
    }
    const calls = turn.content.filter((b) => b.type === "tool_use");
    const forEditor = calls.filter((c) => clientNames.has(c.name));
    const forGateway = calls.filter((c) => !clientNames.has(c.name));

    if (forEditor.length > 0) {
      // Server tool của cùng lượt vẫn chạy được, nhưng kết quả phải quay lại LLM ở lượt sau ⇒ để editor gọi lại.
      for (const c of forEditor) send({ type: "tool_use", id: c.id, name: c.name, input: c.input });
      return end(res, send, "tool_use");
    }
    if (forGateway.length === 0) return end(res, send, "end_turn");

    const results = [];
    for (const c of forGateway) {
      send({ type: "server_tool", id: c.id, name: c.name, status: "running" });
      try {
        const out = await serverTools.run(c.name, c.input);          // vd gọi MCP dynaform-service
        send({ type: "server_tool", id: c.id, name: c.name, status: "ok", summary: summarize(out) });
        results.push({ type: "tool_result", tool_use_id: c.id, content: [{ type: "text", text: out }] });
      } catch (e) {
        send({ type: "server_tool", id: c.id, name: c.name, status: "error", summary: String(e) });
        results.push({ type: "tool_result", tool_use_id: c.id, is_error: true, content: [{ type: "text", text: String(e) }] });
      }
    }
    convo = [...convo, { role: "assistant", content: turn.content }, { role: "user", content: results }];
  }
  send({ type: "error", code: "too_many_steps", message: "Agent chạy quá nhiều bước", retryable: false });
  res.write("data: [DONE]\n\n"); res.end();
}

function end(res: Response, send: (e: object) => void, reason: "tool_use" | "end_turn") {
  send({ type: "stop", reason });
  res.write("data: [DONE]\n\n");
  res.end();
}
```

Lưu ý về lịch sử: editor chỉ ghi lại những gì nó **nhận được** (`text` và `tool_use` của client tool) rồi gửi lại ở lượt sau. Hệ quả: (1) `tool_use` của server tool nằm cùng message với `tool_use` của client tool bị bỏ khi phát cho editor — LLM sẽ gọi lại ở lượt sau, nên message `assistant` editor lưu vẫn nhất quán; (2) kết quả của server tool chỉ sống trong `convo` cục bộ của một lần gọi `agentTurn`, lượt sau gateway chỉ thấy phần `text` đã phát. Cần giữ nguyên kết quả server tool qua các lượt thì gateway tự lưu theo `run_id`/phiên của nó.

## 4. Host: nối agent vào `DynaformBuilder`

```tsx
import {
  DynaformBuilder, createSseRunAgentTurn, defineClientTool, okResult, errorResult,
  type ConfirmHandler,
} from "@dnu/dynaform-builder";

// module-level: editor chỉ đọc một lần lúc mount
const runAgentTurn = createSseRunAgentTurn({
  url: "https://gateway.example.com/agent/turn",
  credentials: "include",
  getHeaders: () => ({ Authorization: `Bearer ${readToken()}` }),   // readToken() của host
});

const hostNav = { current: null as null | ((to: string) => void) };   // router gắn vào lúc render

const clientTools = [
  defineClientTool({
    schema: {
      name: "open_version_list",
      description: "Opens the version list of a form. Unsaved editor changes are lost.",
      input_schema: { type: "object", properties: { root_form_id: { type: "string" } }, required: ["root_form_id"] },
    },
    risk: "destructive",                                              // luôn hỏi người dùng
    handler: (input) => {
      const id = String(input.root_form_id ?? "");
      if (!/^[\w-]{1,64}$/.test(id)) return errorResult("root_form_id is not a valid id.");
      hostNav.current?.(`/forms/${id}/versions`);
      return okResult("Opened.");
    },
  }),
];

export function EditorPage({ id }: { id: string }) {
  hostNav.current = useNavigate();                                    // react-router
  const confirm = useStableConfirm();                                 // trả Promise<boolean> từ dialog của host
  return <DynaformBuilder idForm={id} runAgentTurn={runAgentTurn} agentClientTools={clientTools} onAgentConfirm={confirm} />;
}
```

`useStableConfirm` phải trả **cùng một hàm** qua các lần render (lib chỉ đọc lúc mount); lưu `resolve` của dialog trong ref.

## 5. Chat UI ngoài (không dùng thanh chat của editor)

Widget có hội thoại và kết nối gateway riêng; chỉ cần "executor" cho client tool.

```ts
const handleRef = useRef<DynamicFormBuilderHandle>(null);
<DynaformBuilder ref={handleRef} idForm={id} agentClientTools={clientTools} onAgentConfirm={confirm} />

// widget:
const tools = await handleRef.current!.getAgentTools();               // gửi cho agent trong tools[]
handleRef.current!.beginAgentRun();                                   // cả run = một bước undo
try {
  for (const call of toolUsesFromAgent) {                             // chỉ client tool; server tool gateway tự chạy
    const result = await handleRef.current!.runAgentTool(call.name, call.input, { toolUseId: call.id });
    toolResults.push({ type: "tool_result", tool_use_id: call.id, content: result.content, is_error: result.isError });
  }
} finally {
  handleRef.current!.endAgentRun();
}
```

Trong mfe-dynaform, `window.DynaformAgentBridge` bọc đúng các method này (`getTools`, `runTool`, `beginRun`, `endRun`); lắng nghe `dynaform-agent-bridge:ready` để biết editor đã mount.

## 6. Luồng sửa form có lưu (server tool + editor)

Người dùng: "Tạo bản chỉnh sửa của form này rồi thêm trường Ghi chú".

1. Agent `confirm_action("Tạo bản nháp từ version hiện tại?")` → `approved:true`.
2. Server tool `create_form_draft {id}` → trả `{id: <draft>, existed}`; `server_tool` hiện ở chat.
3. Client tool `open_form_editor {id: <draft>, environment: "DEV"}` (host hỏi vì rời trang) → editor mở bản nháp.
4. Client tool `get_form_state` → `add_component {type:"textarea", label:"Ghi chú", ref:"note"}` → `validate_form`.
5. Agent báo "Đã thêm. Bấm Lưu rồi Phát hành để có version mới" — **lưu/phát hành do người dùng làm qua editor** (`draftFlow`), agent không gọi `save_form_design` với JSON của form đang mở.
