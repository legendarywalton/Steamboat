/**
 * Builds index.html from SteamboatTemperatureCentury.jsx.
 *
 * The JSX is compiled here rather than in the visitor's browser, and React is
 * inlined from node_modules rather than loaded from a CDN, so the page has no
 * runtime network dependency other than its own data file. That is what makes
 * it work from file://, from a sandboxed preview pane, and on networks that
 * block unpkg.
 *
 *   npm install @babel/standalone react@18 react-dom@18
 *   node make-index.js
 */
const fs = require("fs");
const path = require("path");

const VENDOR = [
  ["React", "react/umd/react.production.min.js"],
  ["ReactDOM", "react-dom/umd/react-dom.production.min.js"],
];

function readVendor() {
  return VENDOR.map(([globalName, rel]) => {
    const candidates = [
      path.join(__dirname, "node_modules", rel),
      path.join(__dirname, "vendor", path.basename(rel)),
    ];
    const hit = candidates.find((p) => fs.existsSync(p));
    if (!hit) {
      throw new Error(
        `Cannot find ${rel}. Run: npm install react@18 react-dom@18\n` +
          `Looked in:\n  ${candidates.join("\n  ")}`
      );
    }
    const src = fs.readFileSync(hit, "utf8");
    if (src.includes("</scr" + "ipt")) {
      throw new Error(`${rel} contains a closing script tag and cannot be inlined as-is`);
    }
    return { globalName, src, from: hit };
  });
}

// The boot trap runs before anything else. A blank page with no console access
// is the worst failure mode on mobile, so any error that reaches the window
// gets painted into the document where it can actually be read.
const BOOT_TRAP = `(function () {
  function paint(msg) {
    var el = document.getElementById("boot-error");
    if (!el) {
      el = document.createElement("pre");
      el.id = "boot-error";
      el.style.cssText = "margin:0;padding:18px 20px;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#9B1B1B;background:#FAFAF8;border-bottom:1px solid #0A0A0A;white-space:pre-wrap;word-break:break-word";
      (document.body || document.documentElement).appendChild(el);
    }
    el.appendChild(document.createTextNode(msg + "\\n"));
  }
  window.__paintBootError = paint;
  window.addEventListener("error", function (e) {
    var where = e.filename ? e.filename + ":" + e.lineno + ":" + e.colno : "unknown source";
    paint("Error: " + (e.message || "unknown") + "\\n  at " + where);
  });
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    paint("Unhandled promise rejection: " + ((r && (r.stack || r.message)) || r));
  });
})();`;

const REACT_GUARD = `if (typeof React === "undefined" || typeof ReactDOM === "undefined") {
  window.__paintBootError("React did not initialise. The inlined bundles are present but did not evaluate, which usually means a Content-Security-Policy on the host is blocking inline scripts.");
}`;

function readLogo() {
  const p = path.join(__dirname, "steamboat-logo.png");
  if (!fs.existsSync(p)) return "null";
  const b64 = fs.readFileSync(p).toString("base64");
  return JSON.stringify("data:image/png;base64," + b64);
}

function buildHtml(code) {
  const vendor = readVendor();
  const logo = readLogo();
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>A Century of Steamboat temperatures</title>
<meta name="description" content="One hundred years of NOAA daily temperature records for Steamboat Springs, Colorado." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="fetch" href="./steamboat-daily.csv" />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
<style>
  html, body { margin: 0; padding: 0; background: #FAFAF8; }
  * { box-sizing: border-box; }
  /* Signature mark. Kept in the shell so the component stays free of it. */
  h1::after { content: "."; color: #9B1B1B; }
  input[type="range"] { accent-color: #FAFAF8; }
</style>
<script>
${BOOT_TRAP}
</script>
</head>
<body>
<div id="root"></div>
${vendor.map((v) => `<script>\n${v.src}\n</script>`).join("\n")}
<script>
${REACT_GUARD}
window.__LOGO = ${logo};
</script>
<script>
${code}
</script>
</body>
</html>
`;
}

function compile(srcPath) {
  const babel = require("@babel/standalone");
  const jsx = fs.readFileSync(srcPath, "utf8");
  const body = jsx
    .split("\n")
    .filter((line) => !line.startsWith("import React"))
    .join("\n")
    .replace(
      "export default function SteamboatTemperatureCentury()",
      "function SteamboatTemperatureCentury()"
    );

  const payload = `const { useEffect, useMemo, useRef, useState } = React;\n\n${body}\n
ReactDOM.createRoot(document.getElementById("root")).render(
  <SteamboatTemperatureCentury />
);
`;

  // runtime: "classic" is required. Babel 8 defaults preset-react to the automatic
  // runtime, which emits `import ... from "react/jsx-runtime"` and cannot run inside
  // a plain <script> tag.
  const { code } = babel.transform(payload, {
    presets: [["react", { runtime: "classic" }]],
    compact: false,
  });
  if (/(^|\n)\s*(import|export)\s/.test(code))
    throw new Error("module syntax in output: will not run in a classic script");
  if (/<[A-Za-z]/.test(code.split("\n").slice(0, 5).join("")))
    throw new Error("JSX left in output");
  if (code.includes("</scr" + "ipt")) throw new Error("closing script tag in payload");
  // Backslash escapes are not processed in JSX text children, so a literal
  // \u00b7 typed as JSX text ships to the browser as the six characters.
  if (/\\\\u[0-9a-fA-F]{4}/.test(code))
    throw new Error(
      "literal \\uXXXX escape in output: use the actual character in JSX text, not a backslash escape"
    );
  return code;
}

if (require.main === module) {
  const SRC = process.argv[2] || "SteamboatTemperatureCentury.jsx";
  const OUT = process.argv[3] || "index.html";
  const html = buildHtml(compile(SRC));
  fs.writeFileSync(OUT, html);
  console.log(
    `wrote ${OUT} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB), self-contained: no CDN, no Babel at runtime`
  );
}

module.exports = { buildHtml, compile };
