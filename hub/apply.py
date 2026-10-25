"""Merge a project status block (JSON file) into hub/status.json and refresh hub/export/.

Usage: python3 hub/apply.py hub/inbox/<id>.json [--focus "text"]
"""
import json, sys, datetime, pathlib

HUB = pathlib.Path(__file__).parent
status_path = HUB / "status.json"
d = json.loads(status_path.read_text())
args = sys.argv[1:]
focus = None
if "--focus" in args:
    i = args.index("--focus"); focus = args[i + 1]; del args[i:i + 2]
for path in args:
    block = json.loads(pathlib.Path(path).read_text())
    for i, p in enumerate(d["projects"]):
        if p["id"] == block["id"]:
            d["projects"][i] = {**p, **block}
            break
    else:
        d["projects"].append(block)
if focus:
    d["focus"] = focus
d["updated"] = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
status_path.write_text(json.dumps(d, indent=2) + "\n")

keys = ["id", "name", "tagline", "status", "progress", "phase", "now", "next", "plan", "overnight", "asOf"]
rows = [{k: p.get(k, "") for k in keys} for p in d["projects"]]
(HUB / "export").mkdir(exist_ok=True)
(HUB / "export" / "projects.json").write_text(json.dumps(rows, indent=1))
(HUB / "export" / "focus.json").write_text(json.dumps([{"focus": d["focus"], "updated": d["updated"]}]))
print("updated", d["updated"])
