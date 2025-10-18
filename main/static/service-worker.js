// service-worker.js - Обновленная версия для напоминаний заметок

self.addEventListener("push", (event) => {
  console.log("📩 PUSH EVENT получен от заметки:", event);

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error("Ошибка парсинга данных уведомления:", e);
      return;
    }
  }

  // Проверяем, что это уведомление от заметки
  if (data.type !== 'note_reminder') {
    console.log('Пропускаем уведомление не от заметки:', data.type);
    return;
  }

  const title = data.title || "Напоминание о заметке";
  const options = {
    body: data.body || "У вас есть напоминание",
    icon: "/static/main/icons/icon-192x192.png",
    badge: "/static/main/icons/icon-192x192.png",
    data: { 
      url: data.url || "/",
      noteId: data.noteId,
      type: 'note_reminder'
    },
    vibrate: [100, 50, 100],
    requireInteraction: true,
    tag: `note-reminder-${data.noteId}`, // Группируем уведомления по ID заметки
    actions: [
      {
        action: 'open',
        title: 'Открыть заметку'
      },
      {
        action: 'dismiss',
        title: 'Отложить'
      }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  
  const noteId = event.notification.data?.noteId;
  const targetUrl = event.notification.data?.url || "/";
  
  console.log("🔗 Клик по уведомлению заметки:", noteId);

  // Обработка действий в уведомлении
  if (event.action === 'open') {
    // Открываем заметку
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            // Отправляем сообщение для открытия заметки
            client.postMessage({
              type: 'OPEN_NOTE',
              noteId: noteId
            });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  } else if (event.action === 'dismiss') {
    // Помечаем напоминание как отложенное
    event.waitUntil(
      fetch(`/api/notes/${noteId}/snooze/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }).catch(err => console.error('Ошибка откладывания:', err))
    );
  } else {
    // Обычный клик по уведомлению
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            client.postMessage({
              type: 'OPEN_NOTE',
              noteId: noteId
            });
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
    );
  }
});

// Обработка сообщений от главного окна
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});