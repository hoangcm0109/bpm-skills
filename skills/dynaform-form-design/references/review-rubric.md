# Thang chấm thẩm mỹ form

Agent tự chấm **sau khi viết JSON** (và sau khi mở preview nếu có công cụ). Tổng 20 điểm. **≥ 16 và không có lỗi chết** mới được giao; không đạt thì sửa rồi chấm lại. Ghi điểm vào báo cáo cuối.

## Chấm điểm

| Mục | Tối đa | Đạt đủ điểm khi |
|---|---|---|
| Phân cấp | 4 | Có tiêu đề form, mô tả 1 câu; mỗi phần có tiêu đề cùng kiểu; số thứ tự nhất quán |
| Nhóm | 4 | Mỗi phần một nghĩa, 4–8 field (≤ 10); không có phần nằm chung card chỉ ngăn bằng một dòng chữ; thứ tự theo luồng nghĩ. Dồn nhiều phần vào một card (phương án B) và các card không đồng đều trừ 1 |
| Nhịp | 4 | Mọi hàng cộng đủ 12; nền 6+6; textarea cuối card; không field 12 lẻ xen giữa cặp (trừ `textarea` đi sau field điều khiển nó); ≤ 4 control/hàng |
| Chữ | 3 | Nhãn ≤ 5 từ; placeholder không lặp nhãn; `helpText` chỉ có khi có quy tắc; lỗi nói cách sửa |
| Trạng thái | 2 | Callout đúng mức, có nền/viền, ẩn theo điều kiện; số liệu tổng nổi bật, đặt cuối phần |
| Hành động | 2 | Một nút chính cuối form, căn phải; nút phụ bên trái; nút cục bộ `alignSelf: end` |
| Mobile | 1 | Mọi control `colSpan < 12` có `overrides.sm.colSpan = "12"`; card lồng ≤ 2 cấp |

Mỗi vi phạm trừ 1 điểm của mục tương ứng, không xuống dưới 0.

## Lỗi chết (dính một lỗi là không giao)

- Hardcode màu bằng `style="color:#…"` / `attributes.style`; hoặc dùng `custom.className` Tailwind trong JSON tay thay vì `custom.css` (không có CSS nếu form chưa qua builder).
- Container có viền nhưng không đặt `styles.padding*` (chữ và ô nhập dính sát mép card).
- Tiêu đề `<h3>`/`<h4>` không có `custom.css` (render như chữ thường, mất phân cấp).
- Ô `textarea`/field mồ côi ngoài card, nằm trơ ngay dưới tiêu đề.
- Một phần hơn 10 field, hoặc nhiều phần có tiêu đề riêng nằm chung một card mà không có phân cách thật (`divider`).
- Hàng không cộng đủ 12 (trống nửa hàng) không có chủ đích.
- Không có tiêu đề form.
- Nút chính nằm giữa form hoặc hơn 3 nút.
- Dùng `hidden: true` để ẩn ban đầu thay vì handler `load`.
- Tách thêm card trong form workflow / host-bound mà chưa xác nhận đổi cấp dữ liệu (`../SKILL.md` › Ràng buộc dữ liệu).

## Rà bằng ảnh preview (khi có công cụ trình duyệt / preview)

JSON đúng chưa chắc nhìn đẹp, nên nếu mở được preview thì rà thêm:

1. Chụp desktop (≥ 1280px) và mobile. Trang preview (`/dynaform/form-manager/preview/<id>`) có hai tay nắm hai bên khung form: kéo vào để thu khung xuống ~430px mô phỏng mobile (đổi kích thước cửa sổ Chrome đang tối đa hoá thì viewport không đổi). Callout chỉ hiện khi thoả điều kiện nên nhập thử giá trị để kích hoạt.
2. Soi năm điểm: (a) mắt đi từ tiêu đề xuống nút có tự nhiên không; (b) ranh giới giữa các card có thấy rõ không; (c) có hàng nào trống nửa hay lệch không; (d) callout có nền/viền hay chỉ đổi màu chữ; (e) mobile có cột nào còn ngang hàng không.
3. Chấm lại theo bảng trên bằng điều quan sát được, sửa JSON, chụp lại. Tối đa 2 vòng.
4. Không mở được preview thì ghi rõ trong báo cáo: "chưa rà bằng ảnh".
