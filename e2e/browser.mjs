// A small Chrome driver for the end-to-end tests: opens a page at a given width in the installed Chrome and runs JavaScript in it.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CHROME = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 9400 + Math.floor(Math.random() * 500);

/** Starts headless Chrome and returns `open(url, options)` and `close()`. */
export async function launch() {
  const profile = mkdtempSync(join(tmpdir(), "e2e-chrome-"));
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "about:blank"], { stdio: "ignore" });
  await waitFor(() => fetch(`http://127.0.0.1:${PORT}/json/version`).then((res) => res.ok));

  async function open(url, { width = 390, reducedMotion = false } = {}) {
    const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
    const page = await connect(target.webSocketDebuggerUrl);
    await page.send("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    await page.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: reducedMotion ? "reduce" : "no-preference" }] });
    await page.send("Page.enable");
    const loaded = page.once("Page.loadEventFired");
    const { errorText } = await page.send("Page.navigate", { url });
    if (errorText) throw new Error(`${url}: ${errorText}`);
    await loaded;
    return {
      /** Runs `fn` in the page and returns its result. */
      run: async (fn) => {
        const { result, exceptionDetails } = await page.send("Runtime.evaluate", { expression: `(${fn})()`, returnByValue: true, awaitPromise: true });
        if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? exceptionDetails.text);
        return result.value;
      },
      close: () => page.close(),
    };
  }

  async function close() {
    const exited = new Promise((resolve) => chrome.once("exit", resolve));
    chrome.kill();
    await exited;
    rmSync(profile, { recursive: true, force: true });
  }

  return { open, close };
}

/** A DevTools connection: `send` a command and wait for its reply, or wait `once` for an event. */
async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => ((socket.onopen = resolve), (socket.onerror = reject)));
  const waiting = new Map();
  let id = 0;
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    const key = message.id ?? message.method;
    waiting.get(key)?.(message.result ?? message.params);
    waiting.delete(key);
  };
  const reply = (key) => new Promise((resolve) => waiting.set(key, resolve));
  return {
    send: (method, params = {}) => {
      socket.send(JSON.stringify({ id: ++id, method, params }));
      return reply(id);
    },
    once: (event) => reply(event),
    close: () => socket.close(),
  };
}

async function waitFor(check, tries = 40) {
  for (let i = 0; i < tries; i++) {
    if (await check().catch(() => false)) return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Chrome did not start");
}
