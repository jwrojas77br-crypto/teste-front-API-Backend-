// Desarrollo: timestamp automático diario
const CACHE = `pwa-cache-${new Date().toISOString().split('T')[0]}`;
// Producción: descomentar la línea siguiente y comentar la anterior
// const CACHE = "pwa-cache-v1";


self.addEventListener("install", e => {
e.waitUntil(
	caches.open(CACHE).then(cache => {
		// Precache los assets principales con rutas relativas al SW
		return cache.addAll([
			"./",
			"./index.html",
			"./styles.css",
			"./app.js",
			"./manifest.json"
		]);
	})
);
});

// Limpiar cachés antiguos cuando se activa el nuevo SW
self.addEventListener("activate", e => {
e.waitUntil(
	caches.keys().then(names => {
		return Promise.all(
			names.map(name => {
				if (name !== CACHE) {
					console.log("Borrando caché antiguo:", name);
					return caches.delete(name);
				}
			})
		);
	})
);
});


self.addEventListener("fetch", e => {
e.respondWith(
caches.match(e.request).then(res => {
return res || fetch(e.request);
})
);
});