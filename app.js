const API_URL = "https://script.google.com/macros/s/AKfycbw4zS1nd-H-iscN91KgWiVCCjp7fHt_mGPbMw_zLCij1EPx-ISfFFloifWFt3LWz44a/exec"; // URL de Apps Script


if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("./sw.js", { scope: "./" })
			.then(reg => console.log("SW registrado:", reg.scope))
			.catch(err => console.error("Error registrando SW:", err));
	});
}


async function sendData() {
const name = document.getElementById("name").value;


await fetch(`${API_URL}?action=add&name=${name}`);


loadData();
}


async function loadData() {
const res = await fetch(`${API_URL}?action=list`);
const data = await res.json();


const list = document.getElementById("list");
list.innerHTML = "";


data.forEach(row => {
const li = document.createElement("li");
li.textContent = row[1];
list.appendChild(li);
});
}


loadData();

// Guardar con Enter en el campo
document.getElementById("name").addEventListener("keypress", (e) => {
	if (e.key === "Enter") {
		sendData();
		document.getElementById("name").value = "";
	}
});