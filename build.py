import os
import argparse
import datetime
import re
import json

MODULE_ROOT = "modules"
HEADER_FILE = "header.js"
DEFAULT_OUTPUT = "combined_hooks.js"
LOG_FILE = "build.log"

def find_all_modules():
    module_paths = []
    for root, _, files in os.walk(MODULE_ROOT):
        for file in files:
            if file.endswith(".js"):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, MODULE_ROOT)
                module_paths.append(rel_path.replace("\\", "/"))
    return module_paths

def parse_metadata(path):
    metadata = {}
    with open(path) as f:
        for line in f:
            if not line.strip().startswith("//"):
                break
            if line.strip().startswith("// args:"):
                break  # Stop before args block
            match = re.match(r"//\s*(\w+):\s*(.+)", line)
            if match:
                key, value = match.groups()
                metadata[key.lower()] = value.strip()
    return metadata


def extract_args_metadata(path):
    args = []
    with open(path) as f:
        lines = f.readlines()
    in_args = False
    current = {}
    for line in lines:
        if line.strip().startswith("// args:"):
            in_args = True
            continue
        if in_args:
            if line.strip().startswith("// - key:"):
                if current:
                    args.append(current)
                current = {"key": line.strip().split(":", 1)[1].strip()}
            elif line.strip().startswith("//"):
                parts = line.strip()[3:].split(":", 1)
                if len(parts) == 2:
                    current[parts[0].strip()] = parts[1].strip()
            else:
                break
    if current:
        args.append(current)
    return args

def parse_config(config_arg):
    if not config_arg:
        return {}
    if os.path.isfile(config_arg):
        try:
            with open(config_arg) as f:
                return json.load(f)
        except Exception as e:
            print(f"[!] Failed to load config file: {e}")
            return {}
    try:
        return json.loads(config_arg)
    except json.JSONDecodeError:
        print("[!] Invalid JSON string in --config")
        return {}

def describe_module(name):
    all_modules = find_all_modules()
    match = [m for m in all_modules if m.endswith(f"{name}.js") or m == name]
    if not match:
        print(f"[!] Module not found: {name}")
        return
    path = os.path.join(MODULE_ROOT, match[0])
    meta = parse_metadata(path)
    args_meta = extract_args_metadata(path)

    print(f"\nModule: {match[0]}")
    for key, value in meta.items():
        print(f"{key.capitalize()}: {value}")
    if args_meta:
        print("\nArguments:")
        for arg in args_meta:
            print(f"- {arg.get('key')} ({arg.get('type')}): {arg.get('description')}")
            if "example" in arg:
                print(f"  Example: {arg['example']}")
    print()

def list_modules(tag_filter=None):
    print("Available modules:\n")
    for rel_path in find_all_modules():
        path = os.path.join(MODULE_ROOT, rel_path)
        meta = parse_metadata(path)
        name = meta.get("name", rel_path.replace(".js", ""))
        desc = meta.get("description", "(no description)")
        tags = meta.get("tags", "")
        if tag_filter and tag_filter.lower() not in tags.lower():
            continue
        print(f"- {meta.get('name', rel_path.replace('.js', ''))}: {meta.get('description', '(no description)')} [tags: {tags}]")
        # print(f"- {name}: {desc} [tags: {tags}]")

def load_module_code(rel_path):
    path = os.path.join(MODULE_ROOT, rel_path)
    if not os.path.isfile(path):
        print(f"[!] Module not found: {rel_path}")
        return None
    with open(path) as f:
        return f.read()

def resolve_module_paths(requested):
    all_modules = find_all_modules()
    resolved = []
    for name in requested:
        match = [m for m in all_modules if m.endswith(f"{name}.js") or m == name]
        if match:
            resolved.append(match[0])
        else:
            print(f"[!] Could not resolve module: {name}")
    return resolved

def build_script(modules, output_path, log_enabled, dry_run, config_arg):
    if not modules:
        print("[!] No modules specified. Aborting build.")
        return

    resolved_modules = resolve_module_paths(modules)
    if not resolved_modules:
        print("[!] No valid modules found. No output generated.")
        return

    module_code_blocks = []
    metadata_log = []

    for rel_path in resolved_modules:
        code = load_module_code(rel_path)
        if code:
            module_code_blocks.append(code)
            meta = parse_metadata(os.path.join(MODULE_ROOT, rel_path))
            meta["path"] = rel_path
            metadata_log.append(meta)

    config_dict = parse_config(config_arg)

    if dry_run:
        print("\n[DRY RUN] Modules to be included:")
        for meta in metadata_log:
            print(f"- {meta.get('name')} v{meta.get('version', '')} | {meta.get('description', '')}")
            print(f"  Path: {meta.get('path')}")
            if meta.get("classes"):
                print(f"  Classes: {meta.get('classes')}")
        print(f"[DRY RUN] Output would be: {output_path}")
        if config_dict:
            print(f"[DRY RUN] Config: {json.dumps(config_dict, indent=2)}")
        return

    with open(output_path, "w") as out:
        if config_dict:
            out.write("globalThis.FridaConfig = " + json.dumps(config_dict, indent=2) + ";\n\n")

        out.write("Java.perform(function () {\n\n")

        if os.path.isfile(HEADER_FILE):
            with open(HEADER_FILE) as header:
                out.write(header.read() + "\n\n")
        else:
            print(f"[!] Missing header file: {HEADER_FILE}")
            return

        out.write("\n\n".join(module_code_blocks))
        out.write("\n\nrunHooks();\n")
        out.write("});\n")

    print(f"[+] Build complete: {output_path} ({len(resolved_modules)} modules)")

    if log_enabled:
        with open(LOG_FILE, "a") as log:
            log.write(f"\n=== Build @ {datetime.datetime.now()} ===\n")
            log.write(f"Output: {output_path}\n")
            if config_dict:
                log.write("Config:\n")
                for key, value in config_dict.items():
                    log.write(f"  {key}: {value}\n")
            for meta in metadata_log:
                name = meta.get("name")
                version = meta.get("version", "")
                desc = meta.get("description", "")
                classes = meta.get("classes", "")
                log.write(f"- {name} v{version} | {desc}\n")
                if classes:
                    log.write(f"  Classes: {classes}\n")
            log.write("\n")
        print(f"[+] Log written to {LOG_FILE}")

def main():
    parser = argparse.ArgumentParser(description="Build modular Frida script")
    parser.add_argument("-m", "--modules", nargs="+", help="List of module names or paths")
    parser.add_argument("-o", "--output", default=DEFAULT_OUTPUT, help="Output file path")
    parser.add_argument("--list", action="store_true", help="List available modules with metadata")
    parser.add_argument("--describe", help="Show full metadata for a specific module")
    parser.add_argument("--tags", help="Filter --list by tag")
    parser.add_argument("--dry-run", action="store_true", help="Preview build without writing output")
    parser.add_argument("--nolog", action="store_true", help="Disable build logging")
    parser.add_argument("--config", help="JSON string or path to config file")

    args = parser.parse_args()

    if args.list:
        list_modules(tag_filter=args.tags)
        return

    if args.describe:
        describe_module(args.describe)
        return

    if not args.modules:
        print("[!] No modules specified. Use --list to view available modules.")
        return

    build_script(args.modules, args.output, log_enabled=not args.nolog, dry_run=args.dry_run, config_arg=args.config)

if __name__ == "__main__":
    main()
