import { TrayIcon, type TrayIconEvent } from "@tauri-apps/api/tray";
import { Menu } from "@tauri-apps/api/menu";
import { debug } from "@tauri-apps/plugin-log";

(async () => {

  const menu = Menu.new({
    items: [
      {
        id: "quit",
        text: "Quit",
      },
    ],
  });

  const options = {
    menu: await menu,
    menuOnLeftClick: true,
    action: (event: TrayIconEvent) => {
      switch (event.type) {
        case "Click":
          debug(
            `mouse ${event.button} button pressed, state: ${event.buttonState}`
          );
          break;
        case "DoubleClick":
          debug(`mouse ${event.button} button pressed`);
          break;
        case "Enter":
          debug(
            `mouse hovered tray at ${event.rect.position.x}, ${event.rect.position.y}`
          );
          break;
        case "Move":
          debug(
            `mouse moved on tray at ${event.rect.position.x}, ${event.rect.position.y}`
          );
          break;
        case "Leave":
          debug(
            `mouse left tray at ${event.rect.position.x}, ${event.rect.position.y}`
          );
          break;
      }
    },
  };

  TrayIcon.new(options);

})();
