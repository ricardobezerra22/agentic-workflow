import { greeting, farewell } from "./greeting.js";

const params = new URLSearchParams(window.location.search);
document.querySelector("#app").textContent = greeting(params.get("name"));
document.querySelector("#farewell").textContent = farewell(params.get("name"));
