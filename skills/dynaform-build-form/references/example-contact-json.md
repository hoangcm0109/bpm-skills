# Ví dụ đầy đủ — form "Liên hệ tư vấn" (JSON hoàn chỉnh)

Form JSON **đã mở rộng đầy đủ**, đúng định dạng ở [`form-json.md`](form-json.md): 8 control gốc (tiêu đề `text`, họ tên + điện thoại, email + chủ đề, nội dung, Làm lại + Gửi).
Đã nạp thử qua loader thật của lib (`transformFormComponents`) và cho ra model giống hệt bản đầy đủ do builder xuất. Dùng làm **mẫu** — đổi nội dung, đổi `id` (UUID mới cho form và cho từng control), giữ nguyên cấu trúc.

Điểm cần để ý khi đọc:

- Mỗi control có 5 trường định danh theo bảng registry (`group_code`, `category`, `display_name`, `icon`, `renderer_key`), `slug` = `<type>-field`, `data_lang` = `<type>-<name>`.
- `required: true` xuất hiện hai nơi: `properties.required` và phần tử `required` trong `validation_schema`.
- Control `colSpan` < 12 có `overrides.sm.properties.style.colSpan = "12"` để xuống một cột trên mobile.
- `select` `topic` dùng `variables.data_source` tĩnh (`connection_type: "hard"`); `value` là chuỗi.
- Nút **Gửi** có handler `click` chạy flow `validate_form` → `try { call_api, show_message, reset_form } catch { show_message lỗi }`. Nút có flow `click` **không** tự validate/gửi, nên flow làm hết. URL `https://api.example.com` là giả — thay bằng API thật do người dùng cung cấp; **không** ghi token vào form.

```json
{
  "id": "edba1cbf-095c-4584-8add-9be1f971ea33",
  "name": "Liên hệ tư vấn",
  "description": "Ví dụ nhỏ nhất đủ dùng: 2 cột, select tĩnh, textarea, validation, nút gửi có flow validate → API → thông báo",
  "settings": {
    "setting": {
      "name": "Liên hệ tư vấn",
      "id": "edba1cbf-095c-4584-8add-9be1f971ea33",
      "endpoint": "https://api.example.com/contacts",
      "method": "POST",
      "addUniqueIdentifier": false,
      "formKey": "",
      "size": "normal"
    },
    "theme": {
      "styles": {"type":"normal","borderRadius":"0.5rem","fontSize":"14px"},
      "colors": {
        "background": "#FFFFFF",
        "foreground": "#09090B",
        "primary": "#18181B",
        "primaryForeground": "#FAFAFA",
        "secondary": "#F4F4F5",
        "secondaryForeground": "#18181B",
        "border": "#E4E4E7"
      }
    }
  },
  "form_components": [
    {
      "item_control": {
        "id": "3b48a1f0-81c3-45d6-82bd-2b0386c9a65c",
        "type": "text",
        "slug": "text-field",
        "group_code": "basic",
        "category": "content",
        "display_name": "Text",
        "icon": "Type",
        "renderer_key": "DfsText",
        "data_lang": "text-title_text",
        "sort_order": 1,
        "variables": {
          "name": "title_text",
          "scope": "form",
          "display_label": "title_text",
          "key_path": "title_text",
          "data_type": "string"
        },
        "editable_props": {
          "properties": {
            "label": "",
            "helpText": "",
            "hidden": false,
            "content": "<h2>Liên hệ tư vấn</h2><p>Chúng tôi phản hồi trong 1 ngày làm việc.</p>"
          },
          "styles": {"colSpan":"12","showLabel":"no"}
        }
      }
    },
    {
      "item_control": {
        "id": "3f170c48-9b37-483c-822b-901aa5bb9572",
        "type": "input",
        "slug": "input-field",
        "group_code": "basic",
        "category": "form",
        "display_name": "Text Field",
        "icon": "TextCursorInput",
        "renderer_key": "DfsTextField",
        "data_lang": "input-full_name",
        "sort_order": 2,
        "variables": {
          "name": "full_name",
          "scope": "form",
          "display_label": "Họ và tên",
          "key_path": "full_name",
          "data_type": "string"
        },
        "editable_props": {
          "properties": {"label":"Họ và tên","helpText":"","hidden":false,"placeholder":"Nguyễn Văn A","required":true},
          "styles": {"colSpan":"6"},
          "overrides": {"sm":{"properties":{"style":{"colSpan":"12"}}}}
        },
        "validation_schema": [
          {"type":"required","value":"yes","errorMessage":"Vui lòng nhập họ và tên"},
          {"type":"minLength","value":3,"errorMessage":"Họ và tên tối thiểu 3 ký tự"}
        ]
      }
    },
    {
      "item_control": {
        "id": "cf560660-4096-42aa-83bf-bfdaf640e7be",
        "type": "tel",
        "slug": "tel-field",
        "group_code": "basic",
        "category": "form",
        "display_name": "Telephone",
        "icon": "Phone",
        "renderer_key": "DfsTelephoneField",
        "data_lang": "tel-phone",
        "sort_order": 3,
        "variables": {
          "name": "phone",
          "scope": "form",
          "display_label": "Số điện thoại",
          "key_path": "phone",
          "data_type": "string"
        },
        "editable_props": {
          "properties": {"label":"Số điện thoại","helpText":"","hidden":false,"placeholder":"0912345678","required":true},
          "styles": {"colSpan":"6"},
          "overrides": {"sm":{"properties":{"style":{"colSpan":"12"}}}}
        },
        "validation_schema": [
          {"type":"required","value":"yes","errorMessage":"Vui lòng nhập số điện thoại"},
          {"type":"regex","value":"^0\\d{9}$","errorMessage":"Số điện thoại gồm 10 số, bắt đầu bằng 0"}
        ]
      }
    },
    {
      "item_control": {
        "id": "fc1e56e7-08eb-48cb-8db0-c60e0e8127ab",
        "type": "email",
        "slug": "email-field",
        "group_code": "basic",
        "category": "form",
        "display_name": "Email",
        "icon": "Mail",
        "renderer_key": "DfsEmailField",
        "data_lang": "email-email",
        "sort_order": 4,
        "variables": {"name":"email","scope":"form","display_label":"Email","key_path":"email","data_type":"string"},
        "editable_props": {
          "properties": {"label":"Email","helpText":"","hidden":false},
          "styles": {"colSpan":"6"},
          "overrides": {"sm":{"properties":{"style":{"colSpan":"12"}}}}
        },
        "validation_schema": [{"type":"email","errorMessage":"Email chưa đúng định dạng"}]
      }
    },
    {
      "item_control": {
        "id": "ca8e670c-441c-4d1c-8f77-abe24832cc48",
        "type": "select",
        "slug": "select-field",
        "group_code": "basic",
        "category": "form",
        "display_name": "Select",
        "icon": "ChevronDown",
        "renderer_key": "DfsSelectField",
        "data_lang": "select-topic",
        "sort_order": 5,
        "variables": {
          "name": "topic",
          "scope": "form",
          "display_label": "Chủ đề cần tư vấn",
          "key_path": "topic",
          "data_type": "string",
          "data_source": {
            "name": "Chủ đề cần tư vấn",
            "connection_type": "hard",
            "connection_config": {
              "value": [
                {"label":"Tuyển sinh","value":"admission"},
                {"label":"Học phí","value":"tuition"},
                {"label":"Học bổng","value":"scholarship"},
                {"label":"Khác","value":"other"}
              ]
            },
            "request_config": {},
            "response_mapping": [],
            "timeout_ms": 0,
            "retry_attempts": 0,
            "cache_ttl_seconds": 0,
            "status": "active"
          }
        },
        "editable_props": {
          "properties": {"label":"Chủ đề cần tư vấn","helpText":"","hidden":false,"required":true},
          "styles": {"colSpan":"6"},
          "overrides": {"sm":{"properties":{"style":{"colSpan":"12"}}}}
        },
        "validation_schema": [{"type":"required","value":"yes","errorMessage":"Vui lòng chọn chủ đề"}]
      }
    },
    {
      "item_control": {
        "id": "f1bec3c5-4590-4a3e-8d2f-0829da761ba6",
        "type": "textarea",
        "slug": "textarea-field",
        "group_code": "basic",
        "category": "form",
        "display_name": "Textarea",
        "icon": "Type",
        "renderer_key": "DfsTextareaField",
        "data_lang": "textarea-message",
        "sort_order": 6,
        "variables": {
          "name": "message",
          "scope": "form",
          "display_label": "Nội dung",
          "key_path": "message",
          "data_type": "string"
        },
        "editable_props": {
          "properties": {"label":"Nội dung","helpText":"","hidden":false,"placeholder":"Bạn cần hỗ trợ điều gì?"},
          "styles": {"colSpan":"12"}
        },
        "validation_schema": [{"type":"maxLength","value":500,"errorMessage":"Tối đa 500 ký tự"}]
      }
    },
    {
      "item_control": {
        "id": "e9ee40c5-f2cd-4713-854b-0c29740acdb3",
        "type": "reset-button",
        "slug": "reset-button-field",
        "group_code": "basic",
        "category": "form",
        "display_name": "Reset Button",
        "icon": "RotateCcw",
        "renderer_key": "DfsResetButton",
        "data_lang": "reset-button-btn_reset",
        "sort_order": 7,
        "variables": {
          "name": "btn_reset",
          "scope": "form",
          "display_label": "Làm lại",
          "key_path": "btn_reset",
          "data_type": "string"
        },
        "editable_props": {
          "properties": {"label":"Làm lại","helpText":"","hidden":false},
          "styles": {"colSpan":"2","colStart":"9"},
          "overrides": {"sm":{"properties":{"style":{"colSpan":"12","colStart":"auto"}}}}
        }
      }
    },
    {
      "item_control": {
        "id": "e897c019-0581-4f24-87c7-139cb7de682f",
        "type": "submit-button",
        "slug": "submit-button-field",
        "group_code": "basic",
        "category": "form",
        "display_name": "Submit Button",
        "icon": "Send",
        "renderer_key": "DfsSubmitButtonField",
        "data_lang": "submit-button-btn_submit",
        "sort_order": 8,
        "variables": {
          "name": "btn_submit",
          "scope": "form",
          "display_label": "Gửi liên hệ",
          "key_path": "btn_submit",
          "data_type": "string"
        },
        "editable_props": {
          "properties": {
            "label": "Gửi liên hệ",
            "helpText": "",
            "hidden": false,
            "eventHandlers": [
              {
                "id": "eh_btn_submit_1",
                "event": "click",
                "enabled": true,
                "actions": [
                  {
                    "type": "flow",
                    "flow": {
                      "id": "submit",
                      "type": "sequence",
                      "steps": [
                        {"id":"valid","type":"validate_form","notify":true},
                        {
                          "id": "send",
                          "type": "try",
                          "steps": [
                            {
                              "id": "post",
                              "type": "call_api",
                              "url": "https://api.example.com/contacts",
                              "method": "POST",
                              "bodyMode": "form",
                              "authConfig": {"type":"bearer","token_source":"system"}
                            },
                            {
                              "id": "ok",
                              "type": "show_message",
                              "level": "success",
                              "message": "Đã gửi liên hệ, chúng tôi sẽ phản hồi sớm."
                            },
                            {"id":"clear","type":"reset_form"}
                          ],
                          "catch": [{"id":"fail","type":"show_message","level":"error","message":"Gửi thất bại: {{$error.message}}"}]
                        }
                      ]
                    }
                  }
                ]
              }
            ]
          },
          "styles": {"colSpan":"2"},
          "overrides": {"sm":{"properties":{"style":{"colSpan":"12"}}}}
        }
      }
    }
  ]
}
```
