/**
 * Service Worker - كشف المخيم
 * الهدف: تخزين نسخة التطبيق فعلياً أول ما يفتح أونلاين، وضمان فتحه بدون إنترنت بعد هيك دايماً.
 */

const CACHE_NAME = 'kashf-almukhayam-cache-v1';
const APP_SHELL = ['./', './index.html'];

// وقت التثبيت: نخزن نسخة التطبيق فوراً
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}) // ما نوقف التثبيت حتى لو فشل تخزين شي بسيط
  );
  self.skipWaiting(); // يفعّل النسخة الجديدة فوراً بدون انتظار إغلاق كل التبويبات
});

// وقت التفعيل: نمسح أي نسخة كاش قديمة
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// عند كل طلب: نحاول الإنترنت الأول (نحصل دايماً على آخر نسخة لو متوفر نت)،
// ولو فشل (بدون نت)، نرجع للنسخة المخزنة محلياً بدل ما يطلع خطأ "لا يوجد اتصال"
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
      )
  );
});
