// Desarrollo: timestamp automático diario
const CACHE = `pwa-cache-${Date.now()}`;
// Producción: descomentar la línea siguiente y comentar la anterior
// const CACHE = "pwa-cache-v1";


self.addEventListener("install", e => {
	// Permite que el SW nuevo tome control sin esperar al viejo
	self.skipWaiting();
	e.waitUntil(
		caches.open(CACHE).then(cache => {
			// Precache los assets principales con rutas relativas al SW
			return cache.addAll([
				"./",
				"./index.html",
				"./styles.css",
				"./app.js",
				"./manifest.json",
				"./icons/icon.png",
				"./icons/screenshot-mobile.png",
				"./icons/screenshot-desktop.png"
			]);
		})
	);
});

// Limpiar cachés antiguos cuando se activa el nuevo SW
self.addEventListener("activate", e => {
	e.waitUntil(
		(async () => {
			const names = await caches.keys();
			await Promise.all(
				names.map(name => {
					if (name !== CACHE) {
						console.log("Borrando caché antiguo:", name);
						return caches.delete(name);
					}
				})
			);
			// Hace que el SW tome control de las páginas abiertas
			await self.clients.claim();
		})()
	);
});


// Cache-first para assets; fallback a index.html en navegaciones offline
self.addEventListener("fetch", e => {
	const req = e.request;
	// Si es navegación (HTML), intenta red y si falla, sirve el index
	if (req.mode === "navigate") {
		e.respondWith(
			fetch(req).catch(() => caches.match("./index.html"))
		);
		return;
	}
	// Para otros recursos, cache-first
	e.respondWith(
		caches.match(req).then(res => res || fetch(req))
	);
});