from __future__ import annotations

import argparse
import importlib
import json
import os
import site
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


ENV_PATH_KEYS = [
    "PYTSL_SDK_PATH",
    "TSL_CLIENT_DIR",
    "TSL_CLIENT_HOME",
    "TSL_HOME",
    "TINYSOFT_HOME",
    "TINYSOFT_PATH",
]


def expected_module_name(version_info: Optional[tuple[int, int]] = None) -> str:
    major, minor = version_info or (sys.version_info.major, sys.version_info.minor)
    return f"TSLPy{major}{minor}"


def _dedupe_paths(paths: Iterable[Path]) -> List[Path]:
    result: List[Path] = []
    seen = set()
    for path in paths:
        if not path:
            continue
        try:
            resolved = path.expanduser().resolve()
        except Exception:
            resolved = path
        key = str(resolved).lower()
        if key not in seen:
            seen.add(key)
            result.append(resolved)
    return result


def default_candidate_dirs() -> List[Path]:
    paths: List[Path] = []
    for key in ENV_PATH_KEYS:
        value = os.getenv(key)
        if value:
            paths.append(Path(value))
    for path_text in sys.path:
        if path_text and any(token in path_text.lower() for token in ["tsl", "tinysoft", "analyse"]):
            paths.append(Path(path_text))
    if os.name == "nt":
        paths.extend(
            [
                Path("C:/AnalyseNG.NET"),
                Path("C:/Program Files/AnalyseNG.NET"),
                Path("C:/Program Files (x86)/AnalyseNG.NET"),
            ]
        )
    return _dedupe_paths(paths)


def _iter_search_dirs(root: Path, max_depth: int) -> Iterable[Path]:
    if not root.exists() or not root.is_dir():
        return
    yield root
    if max_depth <= 0:
        return
    stack = [(root, 0)]
    while stack:
        parent, depth = stack.pop()
        if depth >= max_depth:
            continue
        try:
            children = list(parent.iterdir())
        except OSError:
            continue
        for child in children:
            if child.is_dir():
                yield child
                stack.append((child, depth + 1))


def discover_tslpy_dirs(paths: Iterable[Path], expected_module: Optional[str] = None, max_depth: int = 1) -> List[Dict[str, Any]]:
    expected = expected_module or expected_module_name()
    discovered: List[Dict[str, Any]] = []
    seen_dirs = set()
    for root in _dedupe_paths(paths):
        for folder in _iter_search_dirs(root, max_depth):
            key = str(folder).lower()
            if key in seen_dirs:
                continue
            seen_dirs.add(key)
            pyds = sorted(folder.glob("TSLPy*.pyd"))
            if not pyds:
                continue
            names = [pyd.stem for pyd in pyds]
            discovered.append(
                {
                    "path": str(folder),
                    "modules": names,
                    "expected_module": expected,
                    "has_expected": expected in names,
                    "expected_path": str(folder / f"{expected}.pyd") if expected in names else "",
                }
            )
    return discovered


def probe_import(sdk_path: Path, module_name: Optional[str] = None) -> Dict[str, Any]:
    module = module_name or expected_module_name()
    sdk = sdk_path.expanduser().resolve()
    result: Dict[str, Any] = {
        "sdk_path": str(sdk),
        "module_name": module,
        "python": sys.executable,
        "python_version": sys.version.split()[0],
        "ok": False,
        "error": "",
        "module_file": "",
        "entrypoints": {},
    }
    if not sdk.exists() or not sdk.is_dir():
        result["error"] = "sdk_path_not_directory"
        return result
    if str(sdk) not in sys.path:
        sys.path.insert(0, str(sdk))
    dll_handle = None
    if os.name == "nt" and hasattr(os, "add_dll_directory"):
        try:
            dll_handle = os.add_dll_directory(str(sdk))
        except Exception as exc:
            result["dll_path_error"] = f"{type(exc).__name__}: {exc}"
    try:
        imported = importlib.import_module(module)
        result["ok"] = True
        result["module_file"] = str(getattr(imported, "__file__", ""))
        result["entrypoints"] = {
            "connect": [name for name in ["ConnectServer", "LoginServer", "DefaultConnectAndLogin"] if hasattr(imported, name)],
            "execute": [name for name in ["RemoteExecute", "LocalExecute", "RemoteCallFunc", "LocalCallFunc"] if hasattr(imported, name)],
        }
    except Exception as exc:
        result["error"] = f"{type(exc).__name__}: {exc}"
    finally:
        if dll_handle is not None:
            try:
                dll_handle.close()
            except Exception:
                pass
    return result


def write_user_pth(sdk_path: Path, pth_name: str = "tslpy_runtime.pth") -> Dict[str, Any]:
    user_site = Path(site.getusersitepackages())
    user_site.mkdir(parents=True, exist_ok=True)
    pth_path = user_site / pth_name
    sdk = sdk_path.expanduser().resolve()
    pth_path.write_text(str(sdk) + "\n", encoding="utf-8")
    return {
        "ok": True,
        "pth_path": str(pth_path),
        "sdk_path": str(sdk),
        "note": "This links the selected Tinysoft/AnalyseNG SDK directory into the current Python user's site-packages.",
    }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Assist with binding a local Tinysoft/TSLPy runtime to the selected Python.")
    parser.add_argument("--sdk-path", action="append", default=[], help="Candidate Tinysoft/AnalyseNG directory containing TSLPy*.pyd.")
    parser.add_argument("--search-root", action="append", default=[], help="Directory to scan for TSLPy*.pyd, up to --max-depth.")
    parser.add_argument("--max-depth", type=int, default=1, help="Max search depth for --search-root directories.")
    parser.add_argument("--module", default="", help="Expected module name, e.g. TSLPy312. Defaults to current Python version.")
    parser.add_argument("--write-pth", action="store_true", help="Write a user site-packages .pth file for the first importable SDK path.")
    return parser


def run(args: argparse.Namespace) -> Dict[str, Any]:
    module = args.module or expected_module_name()
    explicit_dirs = [Path(p) for p in args.sdk_path if p]
    search_roots = [Path(p) for p in args.search_root if p]
    discovered = discover_tslpy_dirs([*explicit_dirs, *search_roots, *default_candidate_dirs()], module, args.max_depth)

    probes: List[Dict[str, Any]] = []
    candidate_paths = _dedupe_paths([Path(item["path"]) for item in discovered] + explicit_dirs)
    for path in candidate_paths:
        probes.append(probe_import(path, module))

    importable = [probe for probe in probes if probe.get("ok")]
    install: Dict[str, Any] = {"ok": False, "skipped": True}
    if args.write_pth:
        if importable:
            install = write_user_pth(Path(importable[0]["sdk_path"]))
        else:
            install = {"ok": False, "skipped": False, "error": "no_importable_sdk_path"}

    return {
        "command": "tslpy-runtime",
        "python": sys.executable,
        "python_version": sys.version.split()[0],
        "expected_module": module,
        "status": "pass" if importable else "fail",
        "discovered": discovered,
        "probes": probes,
        "recommended_sdk_path": importable[0]["sdk_path"] if importable else "",
        "install": install,
        "explanation": (
            "TSLPy is a native module supplied by the local Tinysoft/AnalyseNG installation. "
            "This tool binds an existing installation to Python; it does not download or redistribute TSLPy."
        ),
    }


def main(argv: Optional[List[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    payload = run(args)
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0 if payload.get("status") == "pass" else 1


if __name__ == "__main__":
    raise SystemExit(main())
