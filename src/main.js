import { greeting } from "./greeting.js";

const params = new URLSearchParams(window.location.search);
document.querySelector("#app").textContent = greeting(params.get("name"));
