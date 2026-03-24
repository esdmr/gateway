"use strict";

for (const i of document.querySelectorAll(".notification_close")) {
  i.addEventListener("click", () => {
    i.parentElement?.remove();
  });
}
