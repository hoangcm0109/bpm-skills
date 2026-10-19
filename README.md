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

## Cài đặt & cập nhật

Phiên bản hiện tại: **0.2.0** (xem [`CHANGELOG.md`](CHANGELOG.md)) — khớp lib `@dnu/dynaform-builder` tag `v4.5.2`.

### Claude Code

**Cài lần đầu** (gõ trong Claude Code, hoặc dùng CLI tương ứng):

```text
/plugin marketplace add hoangcm0109/bpm-skills
/plugin install bpm-skills@bpm-skills
```

```bash
claude plugin marketplace add hoangcm0109/bpm-skills
claude plugin install bpm-skills@bpm-skills
```

**Cập nhật lên bản mới nhất** — hai bước (kéo marketplace về, rồi cập nhật plugin), sau đó khởi động lại Claude Code:

```bash
claude plugin marketplace update bpm-skills
claude plugin update bpm-skills@bpm-skills
```

Hai lệnh trên cũng có trong menu `/plugin` của Claude Code. Skill mới chỉ có hiệu lực ở phiên mở **sau** khi cập nhật.

Kiểm tra đã lên đúng bản:

```bash
claude plugin list        # dòng bpm-skills@bpm-skills phải hiện Version: 0.2.0
```

Lưu ý:

- Claude Code chỉ nhận bản mới khi `version` trong `.claude-plugin/plugin.json` **tăng**. Nếu `update` báo đã là bản mới nhất mà repo vừa có commit mới, nghĩa là commit đó chưa bump version.
- Đã clone repo về máy thì thay `hoangcm0109/bpm-skills` bằng đường dẫn thư mục clone khi `marketplace add`.
- Auto-update của marketplace chỉnh trong menu `/plugin`. Muốn xem diff trước khi lên bản mới thì để tắt và cập nhật tay — xem [`docs/security/using-skills.md`](docs/security/using-skills.md).
- Skill xuất hiện dạng `bpm-skills:dynaform-build-form`, … Gỡ bản cũ nếu lỗi cache: `claude plugin uninstall bpm-skills@bpm-skills` rồi cài lại.

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

Cập nhật: để Codex kéo lại marketplace từ git (dùng lệnh `marketplace` trong CLI Codex của bạn — chưa kiểm chứng ở repo này), rồi mở phiên Codex mới. Nếu không có lệnh cập nhật, xoá thư mục cache của marketplace `bpm-skills` trong `~/.codex/` để Codex clone lại.

### Dùng trực tiếp không qua plugin

Chép (hoặc symlink) thư mục `skills/<tên>` vào `.claude/skills/` hoặc `.agents/skills/` của dự án. Cập nhật = `git pull` repo rồi chép lại (symlink thì chỉ cần `git pull`).

### Người bảo trì: phát hành bản mới

1. Sửa skill, chạy lại lệnh kiểm tra trong [`AGENTS.md`](AGENTS.md).
2. Bump `version` đồng bộ ở `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `.codex-plugin/plugin.json`; ghi vào `CHANGELOG.md`.
3. Commit + push `main`. Người dùng chạy hai lệnh cập nhật ở trên.

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

Skill được viết từ code thật: `fe_dynaform` (`src/models/FormComponent.ts`, `src/lib/builder-core` + `src/lib/builder-host`, `src/lib/ai`, `docs/`)
và `mfe-dynaform` (`.skills/`, `src/pages/formManager`). Khi lib đổi (đặc biệt shape JSON, action engine, registry component),
cập nhật `scripts/dynaform.mjs` và các skill tương ứng.
