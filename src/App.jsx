import React, { useState, useRef, useEffect } from "react";
import MonacoEditor from "react-monaco-editor";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// --- Utility: Transpile React JSX using Babel Standalone ---
import * as Babel from "@babel/standalone";
function transpileReactJSX(code) {
  try {
    return Babel.transform(code, { presets: ["react"] }).code;
  } catch (e) {
    return "// Error: " + e.message;
  }
}

// --- Utility: Run Python using Brython ---
function runPython(code, setOutput, setConsoleLogs) {
  setOutput(`
    <html>
      <body>
        <script type="text/python">
          ${code}
        </script>
        <script src="https://cdn.jsdelivr.net/npm/brython@3.12.3/brython.min.js"></script>
        <script>window.onload = function(){brython();}</script>
      </body>
    </html>
  `);
  setConsoleLogs(["Python execution started"]);
}

// --- Utility: Download and Upload ZIP ---
async function downloadAsZip(files) {
  const zip = new JSZip();
  Object.entries(files).forEach(([filename, content]) => {
    zip.file(filename, content);
  });
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "code.zip");
}
async function uploadZip(file, setFiles) {
  const zip = await JSZip.loadAsync(file);
  const newFiles = {};
  await Promise.all(
    Object.keys(zip.files).map(async (filename) => {
      newFiles[filename] = await zip.files[filename].async("string");
    })
  );
  setFiles(newFiles);
}

// --- Theme Toggle ---
function ThemeToggle({ theme, setTheme }) {
  return (
    <button
      className="theme-toggle"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      style={{ marginLeft: "1rem" }}
    >
      {theme === "dark" ? "🌙 Dark" : "🌞 Light"}
    </button>
  );
}

// --- Toolbar ---
function Toolbar({
  autoRun,
  setAutoRun,
  files,
  setFiles,
  setOutput,
  setConsoleLogs,
  onRun,
  onDownload,
  onUpload
}) {
  return (
    <div className="toolbar">
      <button onClick={onRun}>Run</button>
      <button onClick={onDownload}>Download ZIP</button>
      <label className="upload-btn">
        Upload ZIP
        <input
          type="file"
          accept=".zip"
          style={{ display: "none" }}
          onChange={e => {
            if (e.target.files[0]) onUpload(e.target.files[0]);
          }}
        />
      </label>
      <label style={{ marginLeft: "1rem" }}>
        <input
          type="checkbox"
          checked={autoRun}
          onChange={e => setAutoRun(e.target.checked)}
        />
        Auto Run
      </label>
    </div>
  );
}

// --- Multi-tab Code Editor ---
function EditorTabs({ files, activeTab, setActiveTab, setFiles }) {
  const getLanguage = filename => {
    if (filename.endsWith(".js") || filename.endsWith(".jsx")) return "javascript";
    if (filename.endsWith(".css")) return "css";
    if (filename.endsWith(".py")) return "python";
    if (filename.endsWith(".html")) return "html";
    return "plaintext";
  };
  return (
    <div className="editor-tabs">
      <div className="tab-list">
        {Object.keys(files).map(filename => (
          <button
            key={filename}
            className={filename === activeTab ? "active" : ""}
            onClick={() => setActiveTab(filename)}
          >
            {filename}
          </button>
        ))}
      </div>
      <MonacoEditor
        height="400"
        language={getLanguage(activeTab)}
        theme="vs-dark"
        value={files[activeTab]}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          wordWrap: "on",
          autoClosingBrackets: "always"
        }}
        onChange={val => setFiles({ ...files, [activeTab]: val })}
      />
    </div>
  );
}

// --- Output Panel ---
function OutputPanel({ output }) {
  return (
    <div className="output-panel">
      <iframe
        sandbox="allow-scripts allow-same-origin"
        srcDoc={output}
        title="Live Output"
        width="100%"
        height="300"
        style={{ border: "1px solid #444" }}
      />
    </div>
  );
}

// --- Console Panel ---
function ConsolePanel({ logs }) {
  return (
    <div className="console-panel">
      <pre>
        {logs.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </pre>
    </div>
  );
}

// --- App Initial State ---
const initialFiles = {
  "index.html": `<!DOCTYPE html>
<html>
  <head>
    <title>Live Playground</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <div id="root"></div>
    <script src="script.js"></script>
  </body>
</html>`,
  "style.css": `body { font-family: sans-serif; background: #222; color: #eee; }`,
  "script.js": `console.log("Hello from JavaScript!");`,
  "App.jsx": `import React from "react";

export default function App() {
  return <h1>Hello from React!</h1>;
}`,
  "app.py": `print("Hello from Python!")`
};

// --- Main App Component ---
function App() {
  const [files, setFiles] = useState({ ...initialFiles });
  const [activeTab, setActiveTab] = useState("index.html");
  const [output, setOutput] = useState("");
  const [consoleLogs, setConsoleLogs] = useState([]);
  const [autoRun, setAutoRun] = useState(true);
  const [theme, setTheme] = useState(
    window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  );
  const debounceRef = useRef(null);

  // --- Build Preview Logic ---
  const buildPreview = async (opts = { logToConsole: true }) => {
    let html = files["index.html"] || "";
    let css = files["style.css"] || "";
    let js = files["script.js"] || "";
    let jsx = files["App.jsx"] || "";
    let py = files["app.py"] || "";

    if (opts.logToConsole) setConsoleLogs([]);

    // Python
    if (activeTab === "app.py" || (py && py.trim())) {
      runPython(py, setOutput, setConsoleLogs);
      return;
    }

    // React/JS/HTML/CSS
    let scriptBlock = "";
    if (activeTab === "App.jsx" || (jsx && jsx.trim())) {
      try {
        const transpiled = transpileReactJSX(jsx);
        scriptBlock = `
          <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
          <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
          <div id="root"></div>
          <script>
            ${transpiled}
            ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App));
          </script>
        `;
      } catch (e) {
        setConsoleLogs(logs => [...logs, "React Transpile Error: " + e.message]);
      }
    } else if (js && js.trim()) {
      scriptBlock = `<script>${js}</script>`;
    }

    const doc = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>${css}</style>
        </head>
        <body>
          <div id="root"></div>
          ${scriptBlock}
        </body>
      </html>
    `;
    setOutput(doc);
  };

  // --- Debounced Auto-Run ---
  useEffect(() => {
    if (autoRun) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => buildPreview(), 500);
    }
    // eslint-disable-next-line
  }, [files, activeTab, autoRun]);

  // --- Theme Handling ---
  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const handleRun = () => buildPreview();
  const handleDownload = () => downloadAsZip(files);
  const handleUpload = async file => {
    await uploadZip(file, setFiles);
  };

  return (
    <div className={`app-container ${theme}`}>
      <Toolbar
        autoRun={autoRun}
        setAutoRun={setAutoRun}
        files={files}
        setFiles={setFiles}
        setOutput={setOutput}
        setConsoleLogs={setConsoleLogs}
        onRun={handleRun}
        onDownload={handleDownload}
        onUpload={handleUpload}
      />
      <ThemeToggle theme={theme} setTheme={setTheme} />
      <div className="main-panel">
        <EditorTabs
          files={files}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          setFiles={setFiles}
        />
        <div className="side-panel">
          <OutputPanel output={output} />
          <ConsolePanel logs={consoleLogs} />
        </div>
      </div>
      <style>
        {`
        .app-container {
          min-height: 100vh;
          background: var(--bg, #18191a);
          color: var(--fg, #fafafa);
        }
        .app-container.light {
          --bg: #fafafa;
          --fg: #18191a;
        }
        .app-container.dark {
          --bg: #18191a;
          --fg: #fafafa;
        }
        .toolbar {
          padding: 0.75rem;
          background: #23272f;
          color: #fff;
          display: flex;
          gap: 1rem;
          align-items: center;
        }
        .upload-btn {
          cursor: pointer;
        }
        .main-panel {
          display: flex;
          flex-direction: row;
        }
        .editor-tabs {
          flex: 2;
          min-width: 0;
          background: #21232a;
        }
        .tab-list {
          display: flex;
          background: #18191a;
          border-bottom: 1px solid #363b42;
        }
        .tab-list button {
          background: none;
          border: none;
          color: inherit;
          padding: 0.5rem 1.25rem;
          cursor: pointer;
          font-size: 1rem;
        }
        .tab-list button.active {
          background: #363b42;
          color: #00d8ff;
          font-weight: bold;
        }
        .side-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .output-panel {
          flex: 2;
          background: #101213;
          padding: 0.5rem;
          border-bottom: 1px solid #363b42;
        }
        .console-panel {
          flex: 1;
          background: #111;
          color: #13e213;
          font-size: 0.96rem;
          padding: 0.5rem;
          overflow-y: auto;
        }
        .theme-toggle {
          margin-left: 1rem;
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
          color: inherit;
        }
        @media (max-width: 768px) {
          .main-panel {
            flex-direction: column;
          }
          .side-panel {
            flex-direction: row;
            height: 300px;
          }
          .output-panel, .console-panel {
            flex: 1;
            height: 100%;
          }
        }
        `}
      </style>
    </div>
  );
}

export default App;
