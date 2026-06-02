// 최소 서비스 워커 — PWA 설치 가능성 + 가벼운 오프라인 캐시
// 전략: 정적 자산은 cache-first, 그 외 요청은 network-first(실패 시 캐시 폴백)

const CACHE_VERSION = "mbti-cache-v1";

// 설치 시 미리 캐시할 핵심 자산(오프라인 최소 셸)
const PRECACHE_URLS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// 설치: 핵심 자산 프리캐시
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 활성화: 이전 버전 캐시 정리
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// 정적 자산 판별 — 이미지/아이콘/매니페스트는 cache-first 대상
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    request.destination === "image" ||
    request.destination === "style" ||
    request.destination === "script" ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // GET 요청만 캐시 처리 — POST 등은 그대로 통과(인증/폼 안전)
  if (request.method !== "GET") return;

  // 동일 출처 요청만 처리
  if (new URL(request.url).origin !== self.location.origin) return;

  if (isStaticAsset(request)) {
    // cache-first: 캐시에 있으면 즉시 반환, 없으면 네트워크 후 캐시에 저장
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        });
      })
    );
    return;
  }

  // 그 외(문서 등): network-first, 실패 시 캐시 폴백
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match("/")))
  );
});
