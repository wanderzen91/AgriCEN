const CACHE_NAME = 'map-cache-v1';
const RESOURCES_TO_CACHE = [
    '/static/sig/depts_na.geojson',  // GeoJSON
    '/sites_cen_geojson', // Vue SQL
    '/static/images/tracteur.gif', // Image de chargement
];

// Installation du Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(RESOURCES_TO_CACHE);
        })
    );
});

// Activation du Service Worker
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
            );
        })
    );
});

// Interception des requêtes
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request).then(networkResponse => {
                // Mettre en cache la réponse si elle est nouvelle
                if (event.request.url.endsWith('.geojson') || event.request.url.includes('/sites_cen_geojson')) {
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, networkResponse.clone());
                    });
                }
                return networkResponse;
            });
        }).catch(() => {
            // Optionnel : fournir une réponse alternative en cas d'erreur
            if (event.request.url.endsWith('.geojson')) {
                return new Response(JSON.stringify({ error: 'GeoJSON non disponible' }), {
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        })
    );
});