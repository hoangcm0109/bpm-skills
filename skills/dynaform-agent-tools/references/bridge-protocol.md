# Giao thức bridge (version 1) — agent gateway ⇄ editor

Nguồn: `fe_dynaform/docs/AI_AGENT_BRIDGE.md`, code `src/lib/ai/bridge/`. Vòng lặp agent chạy **trong trình duyệt**: mỗi lượt editor hỏi gateway một lần, chạy các `tool_use` thuộc client tool, rồi hỏi lượt tiếp theo với `tool_result`. Lib không giữ API key — LLM nằm ở gateway.

```
chat bar ─► runEditingAgent ─ một lượt: { system, tools[], messages[], context } ─► gateway ─► LLM + server tool
                 ▲                                                                     │
                 └──────── SSE: text / tool_use / server_tool / stop ◄──────────────────┘
tool_use ─► dispatchToolUse ─► tool có sẵn │ tool của host │ cổng xác nhận ─► tool_result ─► lượt sau
```

## Request

`POST <url>`, `Content-Type: application/json`, `Accept: text/event-stream`:

```jsonc
{
  "protocol": 1,
  "system": "…",                    // system prompt của editing agent (gateway có thể bổ sung/thay)
  "tools": [{ "name": "get_form_state", "description": "…", "input_schema": { "type": "object", "properties": {} } }],
  "messages": [                     // toàn bộ hội thoại, dạng Anthropic tool-use ⇒ gateway có thể stateless
    { "role": "user", "content": [{ "type": "text", "text": "Đổi nhãn Email thành Thư điện tử" }] },
    { "role": "assistant", "content": [{ "type": "tool_use", "id": "tu_1", "name": "get_form_state", "input": {} }] },
    { "role": "user", "content": [{ "type": "tool_result", "tool_use_id": "tu_1", "content": [{ "type": "text", "text": "{…}" }], "is_error": false }] }
  ],
  "context": { "form": { "id": "<idForm>", "environment": "DEV", "draft_flow": true } }   // tuỳ chọn
}
```

`tools[]` = tool có sẵn + tool của host (+ `confirm_action` khi host có UI xác nhận). Gateway **thêm** server tool của nó vào danh sách gửi cho LLM, nhưng chỉ phát `tool_use` cho tool có trong `tools[]` của request.

## Response — SSE

Mỗi dòng `data: <một object JSON>`, kết thúc bằng `data: [DONE]`. Dòng khác `data:` (comment, `event:`) bị bỏ qua.

| Event | Trường | Ý nghĩa |
|---|---|---|
| `run_start` | `run_id`, `protocol?` | Tuỳ chọn; host nhận qua `onRunStart` (log/tương quan) |
| `text` | `delta` | Lời dẫn hiện ở thanh chat |
| `tool_use` | `id`, `name`, `input` (object, JSON **đầy đủ**) | **Client tool** để editor chạy |
| `server_tool` | `id`, `name`, `status` (`running`\|`ok`\|`error`), `summary?` | Tool **gateway** tự chạy — chỉ để hiển thị, không bao giờ là `tool_use` |
| `stop` | `reason`: `end_turn`\|`tool_use`\|`max_tokens`\|`other` | Hết lượt. Dùng `tool_use` khi còn client tool chờ chạy |
| `error` | `message`, `code?`, `retryable?` | Lượt lỗi; run dừng |

## Quy tắc cho gateway

1. `tool_use` **chỉ** cho tool có trong `tools[]` của request. Tool của gateway (MCP) phát bằng `server_tool` — vòng lặp editor trả "Unknown tool" cho `tool_use` lạ.
2. `tool_use.id` duy nhất; editor trả `tool_result` cùng `tool_use_id`. Idempotent: id đã có kết quả thì không chạy lại.
3. Phát `text` và `tool_use` đúng thứ tự LLM sinh ra. Gom `input_json_delta` rồi phát **một lần** khi đủ JSON.
4. `stop` là event cuối của lượt (trước `[DONE]`). Thiếu `stop`/`error`, transport tự thêm `stop` (`tool_use` nếu đã thấy tool_use, ngược lại `end_turn`).
5. Event lạ/dòng hỏng bị bỏ qua (tương thích tiến). Mã lỗi HTTP ≠ 2xx ⇒ lượt lỗi, thân phản hồi được cắt 500 ký tự trong thông báo.
6. Không đẩy kết quả server tool vào stream — chỉ `summary` ngắn.
7. Agent tự lặp server tool trong cùng một lượt được; chỉ `stop: tool_use` khi cần editor chạy client tool.

## Phía editor (host)

| Việc | API |
|---|---|
| Transport cho `runAgentTurn` | `createSseRunAgentTurn({ url, getHeaders?, credentials?, getContext?, onRunStart? })` |
| Gắn vào editor | props `DynaformBuilder`: `runAgentTurn`, `generateForm`, `agentClientTools`, `onAgentConfirm`, `agentContext` |
| Khai báo client tool | `defineClientTool({ schema, risk?, handler })` |
| Chat UI ngoài thanh chat | `ref.getAgentTools()`, `ref.runAgentTool(name, input, {toolUseId?, signal?})`, `ref.beginAgentRun()` / `ref.endAgentRun()` |
| Giới hạn | kết quả tool ≤ 60 000 ký tự (`MAX_TOOL_RESULT_CHARS`); `maxIterations` mặc định 25 mỗi run |

Editor chỉ đọc `runAgentTurn`, `agentClientTools`, `onAgentConfirm`, `agentContext` **một lần lúc mount** ⇒ khai báo ở module-level/`useMemo`; callback cần state React mới nhất phải đọc qua ref. Lib tự thêm `context.form = { id, environment, draft_flow }`.

Trong mfe-dynaform: `REACT_APP_AGENT_GATEWAY_URL` bật AI agent; transport dùng cookie `access_token` làm Bearer; `window.DynaformAgentBridge` (`getTools`, `runTool`, `beginRun`, `endRun`) + sự kiện `dynaform-agent-bridge:ready` / `:gone` cho chat UI ngoài.
