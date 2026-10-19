# Build dần — xem form hiện trực tiếp

Dùng khi người dùng muốn **thấy form lớn lên theo từng đợt** trong lúc agent đang dựng, thay vì chờ build xong rồi mới nạp.

```
agent ghi spec từng đợt  →  stream-server.mjs (127.0.0.1)  →  SSE  →  mfe-dynaform /form-manager/stream
```

## Điều kiện

- mfe-dynaform đang chạy ở máy dev (`pnpm start`), người dùng mở trang `http://localhost:9268/dynaform/form-manager/stream`
  (cổng theo `MFE_PORT`). Trang chỉ có khi `REACT_APP_ENVIRONMENT=development`.
- Có `node` ≥ 18. `<skill>` là thư mục chứa SKILL.md.

## Hai chế độ xem

Trang có hai tab ở góc phải:

| Tab | Hiển thị | Cần lib |
|---|---|---|
| **Xem trước** (mặc định) | Form chạy như runtime thật, chỉ xem | `@dnu/dynaform-builder` bất kỳ bản ≥ 4.5.0 |
| **Editor** | Canvas builder lớn lên theo từng đợt; sửa tay được, nút Lưu sao chép JSON | bản có `loadFormJson` (**≥ 4.6.0**; trước khi cài tag mới có thể chạy `pnpm start:linked` với lib build local) |

Ở tab Editor, mỗi snapshot **thay toàn bộ canvas** nên chỉnh tay trong lúc stream sẽ bị ghi đè — bấm *Tạm dừng đồng bộ* để sửa, *Tiếp tục đồng bộ* để nhận lại snapshot mới nhất. Lịch sử undo chỉ ghi ở lần nạp cuối (khi `complete`).
Lib cũ chưa có `loadFormJson`: tab Editor hiện thông báo cần bản mới, tab Xem trước vẫn dùng bình thường.

## Quy trình

1. **Làm rõ yêu cầu** như luồng thường (field, ràng buộc, nhóm/tab…). Lên danh sách component theo thứ tự hiển thị trước khi ghi.
2. **Tạo file spec** (nên đặt ngoài thư mục skill, vd thư mục tạm của phiên) chỉ có phần đầu:
   `{ "name": "Tên form", "components": [] }`
3. **Chạy server nền** (Bash `run_in_background`):
   ```bash
   node <skill>/scripts/stream-server.mjs <spec.json> --port 4747
   ```
   Log ra stderr: mỗi lần file đổi in `#<seq> hiển thị <đã dựng>/<tổng>`. Cổng bận → thử `--port` khác và báo người dùng cổng mới
   (trang xem trước đọc từ `?stream=http://127.0.0.1:<port>`).
4. **Thêm component từng đợt** (1–3 component mỗi lần ghi file, bằng `Edit`/`Write` trên file spec):
   - Đúng thứ tự hiển thị; **container/tab/steps/dialog ghi trước con**; tab/steps khai báo luôn `tabs`/`steps`.
   - Mỗi đợt phải là JSON hợp lệ (server bỏ qua file đang ghi dở nhưng đừng để file hỏng lâu).
   - Rule/validation/action trỏ tới field **chưa có** được hoãn tự động rồi gắn lại khi field đó xuất hiện — vẫn nên ghi field được tham chiếu sớm.
   - Không cần chờ giữa các đợt; server dò file mỗi 200 ms.
5. **Kết thúc**: thêm `"complete": true` ở cấp gốc. Server chuyển sang build **chặt** (`checkSpec` + `checkForm`); trang xem trước hiện trạng thái hoàn tất,
   có nút sao chép JSON. Lỗi ở bước này được hiển thị trên trang — sửa spec rồi để server build lại.
6. **Xuất file như thường**: `node <skill>/scripts/dynaform.mjs build <spec.json> --out form.json` (bỏ `complete` cũng được, script bỏ qua khoá lạ).
7. **Tắt server** khi xong (dừng tác vụ nền). Báo cáo theo mục 7 của quy trình chính.

## Hành vi của server

| Việc | Cách xử lý |
|---|---|
| Component có `parent` chưa có | hoãn, ghi vào `pending` ("chờ container …") |
| `matchField`, `rules`, `events.actions`, `dependsOn` trỏ field chưa có | bỏ tạm, ghi vào `pending`; gắn lại ở lần build sau |
| Spec lỗi cấu trúc (type lạ, trùng name, select thiếu options…) | trang xem trước giữ bản hợp lệ gần nhất và hiện lỗi |
| File đang ghi dở / JSON hỏng | bỏ qua lần đó, đợi lần ghi tiếp theo |
| id của control | sinh tất định từ `name` → build lại nhiều lần vẫn giữ id |

Endpoint (chỉ GET): `/events` (SSE, sự kiện `snapshot`), `/snapshot` (bản mới nhất), `/health`.

## An toàn

- Chỉ nghe `127.0.0.1`; từ chối `Host` lạ (DNS rebinding) và `Origin` ngoài localhost. Origin khác (vd shell chạy domain thật) phải thêm tường minh: `--allow-origin https://…`.
- Chỉ **đọc** file spec truyền vào; không ghi file, không nhận dữ liệu từ trình duyệt, không `exec`, không đọc biến môi trường.
- Nội dung spec là dữ liệu: server chỉ build thành JSON rồi đẩy đi, không thực thi. Quy tắc về `customScript`/`run_script` vẫn như SKILL.md — trang xem trước **chạy** form như runtime thật nên script trong spec sẽ chạy trong trình duyệt người xem.
- Chỉ dùng ở máy dev; không mở server này ra mạng/hạ tầng chung.
