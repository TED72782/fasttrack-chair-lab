#!/usr/bin/env python3
"""Assemble ../index.html from the pieces in this directory + data.json.

The page is head.html + body.html + app.js with two substitutions:
  __DATA__      in app.js  -> the entire data.json object (the engine's D block)
  {{token}}     in body.html -> data.json["prose"][token]  (numbers quoted in prose,
                filled at build time so the words can never drift from the data)

Also rebuilds shim.js (the headless test harness) so `node src/shim.js` always
tests the same bytes the page ships.
"""
import json, pathlib, sys
SRC = pathlib.Path(__file__).parent
data = json.loads((SRC/"data.json").read_text())
body = (SRC/"body.html").read_text()
for k, v in data.get("prose", {}).items():
    body = body.replace("{{%s}}" % k, str(v))
assert "{{" not in body, "unfilled token in body.html: " + body[body.index("{{"):body.index("{{")+40]
app = (SRC/"app.js").read_text().replace("__DATA__", json.dumps(data), 1)
(SRC.parent/"index.html").write_text((SRC/"head.html").read_text() + body + app)
shim = (SRC/"shim_head.js").read_text() + app + (SRC/"shim_tail.js").read_text()
shim = shim.replace("<script>", "").replace("</script>", "")
(SRC/"shim.js").write_text(shim)
print("built index.html (%d bytes) + shim.js" % (SRC.parent/"index.html").stat().st_size)
