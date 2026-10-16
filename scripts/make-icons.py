#!/usr/bin/env python3
"""生成扩展图标（16 / 48 / 128）。

源图 `icons/icon-source.png` 是 256x256 的应用图标（与 NAS 端同一套品牌素材，
已套用平台圆角轮廓、四角透明）。

用法：
    python3 scripts/make-icons.py

产出：
    icons/icon16.png / icon48.png / icon128.png
"""

from __future__ import annotations

import pathlib

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
SOURCE = ROOT / "icons" / "icon-source.png"
SIZES = (16, 48, 128)


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"缺少源图 {SOURCE.relative_to(ROOT)}")

    src = Image.open(SOURCE).convert("RGBA")
    if src.size != (256, 256):
        raise SystemExit(f"源图应为 256x256，实际 {src.size}")

    for size in SIZES:
        out = ROOT / "icons" / f"icon{size}.png"
        # LANCZOS 降采样能保住圆角边缘的抗锯齿；16px 下细节会糊，
        # 但工具栏本来就只认轮廓与配色。
        src.resize((size, size), Image.LANCZOS).save(out, "PNG", optimize=True)
        print(f"wrote {out.relative_to(ROOT)} ({out.stat().st_size} B)")


if __name__ == "__main__":
    main()
