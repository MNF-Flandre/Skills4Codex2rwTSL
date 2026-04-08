from __future__ import annotations

from pathlib import Path

SOURCE_ENCODINGS = ("utf-8-sig", "utf-8", "gb18030", "gbk", "cp936")


def read_text_auto(path: str | Path) -> str:
    source_path = Path(path)
    data = source_path.read_bytes()
    errors: list[str] = []
    for encoding in SOURCE_ENCODINGS:
        try:
            return data.decode(encoding)
        except UnicodeDecodeError as exc:
            errors.append(f"{encoding}: {exc}")
    joined = "; ".join(errors)
    raise UnicodeDecodeError(
        "tsl-source",
        data,
        0,
        min(len(data), 1),
        f"unable to decode {source_path}; tried {', '.join(SOURCE_ENCODINGS)}; {joined}",
    )
