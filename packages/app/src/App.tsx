import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { attachLogger, debug, info } from "@tauri-apps/plugin-log";
import "./App.css";
import { useDataStream } from "./hooks/useDataStream";
// import "./ui/tray";
// import "./ui/window";

function App() {
  const { stacks } = useDataStream([
    // "docker:containers",
    // "docker:networks",
    "docker:stacks",
  ]);

  const [debugInfo, setDebugInfo] = useState("DEBUG");
  const [_isWindowActive, setWindowActive] = useState(false);
  const [_isFileActive, setFileActive] = useState(false);
  const [_mouseX, setMouseX] = useState(0);

  // async function stackStart(stackBundlePath: string) {
  //   await invoke("stack_start", { path: stackBundlePath });
  //   setFileActive(false);
  // }

  // useEffect(() => {
  //   attachLogger(({ message, level }) => {
  //     if (level > 2) {
  //       const msg = message.replace(/^\S+\s/, "");
  //       setDebugInfo(msg);
  //     }
  //   });

  //   const webview = getCurrentWebview();
  //   webview.listen("tauri://stack-file-opened", (event) => {
  //     debug(`Received event: ${event.event}`);
  //   });

  //   document.addEventListener("mouseover", () => {
  //     debug("Mouse over");
  //     invoke("mouse_over");
  //     setWindowActive(true);
  //   });
  //   document.addEventListener("mouseout", () => {
  //     debug("Mouse out");
  //     invoke("mouse_leave");
  //     setWindowActive(false);
  //   });

  //   // getCurrentWebview().onDragDropEvent((event) => {
  //   //   if (event.payload.type === "over") {
  //   //     setMouseX(event.payload.position.x);
  //   //     setFileActive(true);
  //   //     invoke("mouse_over");
  //   //   } else if (event.payload.type === "drop") {
  //   //     info("File dropped");
  //   //     setDebugInfo(JSON.stringify(event.payload.paths));
  //   //     // Update the current file after a file is dropped

  //   //     const path = event.payload.paths[0];
  //   //     stackStart(path);
  //   //   } else {
  //   //     debug("File drop cancelled");
  //   //   }
  //   // });
  // }, []);

  return (
    <main className="container">
      <div>{debugInfo}</div>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          fontWeight: "bold",
          paddingRight: 8,
        }}
      >
        {stacks?.length}
      </div>
      {/* {isConnected ? "🔌" : "🙅‍♂️"} */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: 8,
        }}
      >
        {stacks?.join(", ")}
      </div>
    </main>
  );
}

export default App;
