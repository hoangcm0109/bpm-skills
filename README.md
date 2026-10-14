# bpm-skills

Agent skills cho hệ sinh thái BPM của Dai Nam University — hiện tập trung vào **form dynaform**:

- thư viện `@dnu/dynaform-builder` (repo `fe_dynaform`)
- module sử dụng thư viện: `mfe-dynaform`

Một repo, một plugin, dùng được cho **Claude Code** và **Codex**.

## Skill

| Skill | Cụm chức năng |
|---|---|
| [`dynaform-build-form`](skills/dynaform-build-form/SKILL.md) | Điểm vào: yêu cầu → spec → form JSON → kiểm tra → nạp. Có script `dynaform.mjs` |
| [`dynaform-components`](skills/dynaform-components/SKILL.md) | Danh mục component & chọn type |
| [`dynaform-validation`](skills/dynaform-validation/SKILL.md) | Validation, matchField, thông báo lỗi |
| [`dynaform-logic-events`](skills/dynaform-logic-events/SKILL.md) | Rule điều kiện, event, action engine |
| [`dynaform-layout`](skills/dynaform-layout/SKILL.md) | Lưới 12 cột, container/tab/steps, theme |
| [`dynaform-data-source`](skills/dynaform-data-source/SKILL.md) | Option tĩnh/API/phụ thuộc, giá trị điền sẵn |
| [`dynaform-embed-lib`](skills/dynaform-embed-lib/SKILL.md) | Cài đặt & nhúng lib vào app/MFE |
| [`dynaform-mfe-module`](skills/dynaform-mfe-module/SKILL.md) | Quy ước trong repo mfe-dynaform |

## Cài đặt

### Claude Code

```text
/plugin marketplace add D:\workspace\bpm-skills
/plugin install bpm-skills@bpm-skills
```

(hoặc `/plugin marketplace add hoangcm0109/bpm-skills` để cài từ GitHub). Sau khi cài, skill xuất hiện dạng `bpm-skills:dynaform-build-form`.

### Codex

Manifest: `.codex-plugin/plugin.json` (skills ở `./skills/`) và marketplace `.agents/plugins/marketplace.json`.
Thêm marketplace từ git trong `~/.codex/config.toml`:

```toml
[marketplaces.bpm-skills]
source_type = "git"
source = "https://github.com/hoangcm0109/bpm-skills.git"

[plugins."bpm-skills@bpm-skills"]
enabled = true
```

### Dùng trực tiếp không qua plugin

Chép (hoặc symlink) thư mục `skills/<tên>` vào `.claude/skills/` hoặc `.agents/skills/` của dự án.

## Script

```bash
# spec gọn -> form JSON (có kiểm tra)
node skills/dynaform-build-form/scripts/dynaform.mjs build skills/dynaform-build-form/assets/example-spec.json --out form.json
# ví dụ chỉ bố cục: container + columns + tab
node skills/dynaform-build-form/scripts/dynaform.mjs build skills/dynaform-build-form/assets/example-layout.spec.json --out layout.json
# kiểm tra spec hoặc form JSON bất kỳ
node skills/dynaform-build-form/scripts/dynaform.mjs validate form.json
```

Yêu cầu Node ≥ 18, không cần cài package.

## Bảo mật

Skill điều khiển hành vi của agent và form JSON có thể chứa script/URL — đọc [`SECURITY.md`](SECURITY.md) trước khi dùng:
[dùng skill an toàn](docs/security/using-skills.md) · [an toàn form JSON](docs/security/form-json-safety.md) · [checklist review](docs/security/review-checklist.md).

## Cấu trúc

```text
.claude-plugin/    plugin.json + marketplace.json (Claude Code)
.codex-plugin/     plugin.json (Codex)
.agents/plugins/   marketplace.json (Codex)
skills/            mỗi thư mục = một skill (SKILL.md, references/, scripts/, assets/)
AGENTS.md          quy tắc khi sửa repo này
SECURITY.md        chính sách bảo mật; docs/security/ chứa hướng dẫn chi tiết
```

## Nguồn sự thật

Skill được viết từ code thật: `fe_dynaform` (`src/models/FormComponent.ts`, `src/lib/dynamic-form-builder`, `src/lib/ai`, `docs/`)
và `mfe-dynaform` (`.skills/`, `src/pages/formManager`). Khi lib đổi (đặc biệt shape JSON, action engine, registry component),
cập nhật `scripts/dynaform.mjs` và các skill tương ứng.
