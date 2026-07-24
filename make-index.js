/**
 * Builds index.html from SteamboatTemperatureCentury.jsx.
 * The JSX is compiled here rather than in the visitor's browser, so the page
 * no longer downloads or runs Babel.
 *
 *   npm install @babel/standalone
 *   node make-index.js
 */
const fs = require("fs");
const path = require("path");
const babel = require("@babel/standalone");

const SRC = process.argv[2] || "SteamboatTemperatureCentury.jsx";
const OUT = process.argv[3] || "index.html";

const jsx = fs.readFileSync(SRC, "utf8");
const body = jsx
  .split("\n")
  .filter(line => !line.startsWith("import React"))
  .join("\n")
  .replace("export default function SteamboatTemperatureCentury()", "function SteamboatTemperatureCentury()");

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
if (/(^|\n)\s*(import|export)\s/.test(code)) throw new Error("module syntax in output: will not run in a classic script");
if (/<[A-Za-z]/.test(code.split("\n").slice(0, 5).join(""))) throw new Error("JSX left in output");
if (code.includes("</scr" + "ipt")) throw new Error("closing script tag in payload");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>A century of mountain temperatures | Steamboat Springs</title>
<meta name="description" content="One hundred years of NOAA daily temperature records for Steamboat Springs, Colorado." />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="fetch" href="./steamboat-daily.csv" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
<style>
  html, body { margin: 0; padding: 0; background: #f5f1e8; }
  * { box-sizing: border-box; }
</style>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
</head>
<body>
<div id="root"></div>
<script>
${code}
</script>
</body>
</html>
`;

fs.writeFileSync(OUT, html);
console.log(`wrote ${OUT} (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB), no Babel required at runtime`);
