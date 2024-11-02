"use client";

export async function ClearAllCaches() {
  if ("caches" in window) {
    // Delete all cache entries
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    console.log("All caches cleared.");

    // Unregister any active service workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      console.log("All service workers unregistered.");
    }
  } else {
    console.log("Cache API is not supported in this browser.");
  }
}

export async function ClearSpecificCache(cacheName: string) {
  if ("caches" in window) {
    const cache = await caches.open(cacheName);
    await cache.keys().then((keys) => {
      keys.forEach((request) => cache.delete(request));
    });
    console.log(`${cacheName} cache cleared.`);
  } else {
    console.log("Cache API is not supported in this browser.");
  }
}

export async function ClearManifestCache() {
  if ("caches" in window) {
    try {
      // Retrieve and delete all cache entries created by the service worker
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          // Customize cacheName if you know your cache naming convention
          return caches.delete(cacheName);
        })
      );
      console.log("Manifest caches cleared.");
    } catch (error) {
      console.error("Error clearing manifest caches:", error);
    }
  } else {
    console.log("Cache API is not supported in this browser.");
  }
}

export async function ClearSiteData() {
  // Clear Cache API storage
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    console.log("All caches cleared.");
  }

  // Unregister all service workers
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      await registration.unregister();
    }
    console.log("All service workers unregistered.");
  }

  // Clear localStorage
  localStorage.clear();
  console.log("localStorage cleared.");

  // Clear sessionStorage
  sessionStorage.clear();
  console.log("sessionStorage cleared.");

  // Clear IndexedDB databases
  if ("indexedDB" in window) {
    const databases = await indexedDB.databases();
    for (const db of databases) {
      await indexedDB.deleteDatabase((db as any).name);
    }
    console.log("All IndexedDB databases deleted.");
  }

  // Clear cookies
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  });
  console.log("All cookies cleared.");

  console.log("All site data cleared.");
}
