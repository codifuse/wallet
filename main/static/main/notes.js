// notes.js - Система управления заметками с напоминаниями

let currentEditingNoteId = null;
let currentNotes = [];

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing notes system...');
    loadNotes();
    initNoteSystem();
    initReminderSystem();
    
    // Проверяем напоминания сразу при загрузке
    setTimeout(checkReminders, 2000);
});

// Инициализация всей системы заметок
function initNoteSystem() {
    initNoteModal();
    initViewNoteModal();
    
    // Добавляем обработчик для кнопки добавления заметки
    const addNoteBtn = document.querySelector('.add-note-btn');
    if (addNoteBtn) {
        console.log('Add note button found, adding event listener');
        addNoteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Add note button clicked');
            openAddNoteModal();
        });
    } else {
        console.error('Add note button not found!');
    }
}

// Загрузка списка заметок
function loadNotes() {
    console.log('Loading notes...');
    fetch('/get_notes/')
        .then(response => response.json())
        .then(data => {
            const notesList = document.getElementById('notesList');
            const emptyState = document.getElementById('emptyNotesState');
            
            if (!notesList) {
                console.error('Notes list container not found!');
                return;
            }

            // Всегда показываем контейнер заметок
            notesList.style.display = 'block';
            
            // Очищаем только заметки, но не весь контейнер
            const existingNotes = notesList.querySelectorAll('.note-item');
            existingNotes.forEach(note => note.remove());
            
            currentNotes = data.notes || [];

            if (currentNotes.length > 0) {
                // Есть заметки - скрываем пустое состояние
                if (emptyState) emptyState.style.display = 'none';
                
                // Добавляем заметки
                currentNotes.forEach(note => {
                    const noteElement = createNoteElement(note);
                    notesList.appendChild(noteElement);
                });
            } else {
                // Нет заметок - показываем пустое состояние
                if (emptyState) emptyState.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Ошибка загрузки заметок:', error);
            // В случае ошибки тоже показываем пустое состояние
            const emptyState = document.getElementById('emptyNotesState');
            if (emptyState) emptyState.style.display = 'block';
        });
}

function createNoteElement(note) {
    const noteDiv = document.createElement('div');
    noteDiv.className =
        'note-item relative bg-gray-800 hover:bg-gray-750 rounded-2xl p-4 border border-gray-700 transition-all cursor-pointer overflow-hidden';
    noteDiv.dataset.noteId = note.id;

    const hasReminder = note.reminder_date !== null;
    const reminderDate = hasReminder ? new Date(note.reminder_date) : null;
    const now = new Date();
    const isUpcomingReminder = hasReminder && reminderDate > now;

    const reminderText = hasReminder
        ? `${reminderDate.toLocaleString('ru-RU', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          })}`
        : 'Без напоминания';

    const truncatedTitle =
        note.title.length > 25 ? note.title.substring(0, 25) + '...' : note.title;

    noteDiv.innerHTML = `
        <div class="flex flex-col space-y-2 main-content">
            <h3 class="font-semibold text-lg text-white leading-snug">${escapeHtml(
                truncatedTitle
            )}</h3>

            <div class="text-xs text-gray-400 flex items-center space-x-1">
                <i class="fas fa-calendar-alt text-gray-500"></i>
                <span>${new Date(note.created_at).toLocaleDateString('ru-RU')}</span>
            </div>

            ${
                hasReminder
                    ? `
                <div class="text-xs text-blue-400 flex items-center space-x-2">
                    <i class="fas fa-bell ${
                        isUpcomingReminder ? 'animate-pulse' : ''
                    }"></i>
                    <span>${isUpcomingReminder ? 'Запланировано' : 'Напомнено'}</span>
                </div>
            `
                    : ''
            }

            <div class="relative bg-gray-800/60 rounded-xl p-3 border border-transparent">
                <div class="absolute left-0 top-0 h-full w-1 bg-blue-500 rounded-l-md"></div>
                <p class="text-gray-200 text-sm whitespace-pre-wrap ml-3 line-clamp-3">${escapeHtml(note.content || '')}</p>

            </div>

            <div class="text-sm text-gray-400 truncate w-full flex items-center space-x-2">
                <i class="fas fa-clock text-blue-400"></i>
                <span class="truncate">${escapeHtml(reminderText)}</span>
            </div>
        </div>

        <button class="absolute top-3 right-3 text-red-400 hover:text-red-300 p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg delete-note-btn" title="Удалить">
            <i class="fas fa-trash"></i>
        </button>

        <!-- Контейнер подтверждения удаления -->
        <div class="delete-confirm hidden absolute inset-0 bg-gray-900/95 flex flex-col items-center justify-center rounded-2xl border border-red-500/50 text-center p-4">
            <p class="text-red-400 mb-3 text-sm font-medium">Удалить эту заметку?</p>
            <div class="flex space-x-3">
                <button class="confirm-delete bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold">Удалить</button>
                <button class="cancel-delete bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium">Отмена</button>
            </div>
        </div>
    `;

    // Открытие при клике
    noteDiv.addEventListener('click', (e) => {
        if (!e.target.closest('.delete-note-btn') && !e.target.closest('.delete-confirm')) {
            openViewNoteModal(note);
        }
    });

    // Показ подтверждения удаления
    const deleteBtn = noteDiv.querySelector('.delete-note-btn');
    const confirmBox = noteDiv.querySelector('.delete-confirm');

    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        noteDiv.querySelector('.main-content').classList.add('opacity-30', 'pointer-events-none');
        confirmBox.classList.remove('hidden');
        confirmBox.classList.add('animate-fadeIn');
    });

    // Отмена
    confirmBox.querySelector('.cancel-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        confirmBox.classList.add('hidden');
        noteDiv.querySelector('.main-content').classList.remove('opacity-30', 'pointer-events-none');
    });

    // Удаление
    confirmBox.querySelector('.confirm-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        confirmBox.querySelector('.confirm-delete').textContent = 'Удаляется...';
        confirmBox.querySelector('.confirm-delete').disabled = true;

        fetch(`/delete_note/${note.id}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    noteDiv.classList.add('opacity-0', 'translate-x-5', 'transition-all');
                    setTimeout(() => noteDiv.remove(), 300);
                } else {
                    confirmBox.querySelector('.confirm-delete').textContent = 'Ошибка';
                }
            })
            .catch(() => {
                confirmBox.querySelector('.confirm-delete').textContent = 'Ошибка';
            });
    });

    return noteDiv;
}



// Открытие модалки для добавления заметки
function openAddNoteModal() {
    console.log('Opening add note modal');
    currentEditingNoteId = null;
    document.getElementById('noteModalTitle').textContent = 'Новая заметка';
    document.getElementById('noteTitleInput').value = '';
    document.getElementById('noteContentInput').value = '';
    
    // УБРАЛИ установку значения по умолчанию - поле будет пустым
    document.getElementById('reminderDateInput').value = '';
    
    animateModal(document.getElementById('noteModal'), true);

}


// Инициализация модального окна заметок
function initNoteModal() {
    const noteModal = document.getElementById('noteModal');
    const closeNoteModalBtns = document.querySelectorAll('.close-modal[data-modal="note"]');
    const saveNoteBtn = document.getElementById('saveNoteBtn');

    if (!noteModal) {
        console.error('Note modal not found!');
        return;
    }

    // Закрытие модалки заметки
    closeNoteModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            animateModal(noteModal, false);

        });
    });

    // Сохранение заметки
    if (saveNoteBtn) {
        saveNoteBtn.addEventListener('click', saveNote);
    } else {
        console.error('Save note button not found!');
    }

    // Закрытие по клику вне окна
    noteModal.addEventListener('click', function(e) {
        if (e.target === noteModal) {
           animateModal(noteModal, false);

        }
    });
}

// Открытие модалки редактирования заметки
function openEditNoteModal(note) {
    console.log('Opening edit note modal for note:', note.id);
    currentEditingNoteId = note.id;
    document.getElementById('noteModalTitle').textContent = 'Редактировать заметку';
    document.getElementById('noteTitleInput').value = note.title;
    document.getElementById('noteContentInput').value = note.content || '';
    
    if (note.reminder_date) {
        const reminderDate = new Date(note.reminder_date);
        
        // Форматируем дату для input[type=datetime-local]
        const year = reminderDate.getFullYear();
        const month = String(reminderDate.getMonth() + 1).padStart(2, '0');
        const day = String(reminderDate.getDate()).padStart(2, '0');
        const hours = String(reminderDate.getHours()).padStart(2, '0');
        const minutes = String(reminderDate.getMinutes()).padStart(2, '0');
        
        document.getElementById('reminderDateInput').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    } else {
        document.getElementById('reminderDateInput').value = '';
    }
    
   animateModal(document.getElementById('noteModal'), true);

}



// Сохранение заметки
function saveNote() {
    const title = document.getElementById('noteTitleInput').value.trim();
    const content = document.getElementById('noteContentInput').value.trim();
    const reminderDateValue = document.getElementById('reminderDateInput').value;

    if (!title) {
        showNoteNotification('Заголовок пуст!', 'error');
        return;
    }

    // Проверка даты на клиенте
    if (reminderDateValue) {
        const selectedDate = new Date(reminderDateValue);
        const now = new Date();
        
        if (selectedDate < now) {
            showNoteNotification('Дата в прошлом!', 'error');
            return;
        }
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    
    if (reminderDateValue) {
        // Получаем выбранную дату и время
        const selectedDate = new Date(reminderDateValue);
        
        // Форматируем дату в ISO строку с указанием временной зоны
        // Это гарантирует, что сервер получит правильное время
        const timezoneOffset = -selectedDate.getTimezoneOffset(); // в минутах
        const timezoneOffsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
        const timezoneOffsetMinutes = Math.abs(timezoneOffset) % 60;
        const timezoneSign = timezoneOffset >= 0 ? '+' : '-';
        
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        const hours = String(selectedDate.getHours()).padStart(2, '0');
        const minutes = String(selectedDate.getMinutes()).padStart(2, '0');
        
        // Форматируем дату с временной зоной
        const isoDate = `${year}-${month}-${day}T${hours}:${minutes}:00${timezoneSign}${String(timezoneOffsetHours).padStart(2, '0')}:${String(timezoneOffsetMinutes).padStart(2, '0')}`;
        
        formData.append('reminder_date', isoDate);
        
        console.log('Reminder date sent to server:', isoDate);
        console.log('Local time:', `${year}-${month}-${day} ${hours}:${minutes}`);
        console.log('Timezone offset:', timezoneOffset, 'minutes');
    }

    const url = currentEditingNoteId ? `/edit_note/${currentEditingNoteId}/` : '/add_note/';

    fetch(url, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            document.getElementById('noteModal').classList.add('hidden');
            loadNotes();
            showNoteNotification(currentEditingNoteId ? 'Заметка обновлена!' : 'Заметка создана!', 'success');
        } else {
            showNoteNotification(data.error || 'Ошибка при сохранении заметки', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showNoteNotification('Произошла ошибка при отправке формы: ' + error.message, 'error');
    });
}

// Открытие модалки редактирования заметки
function openEditNoteModal(note) {
    console.log('Opening edit note modal for note:', note.id);
    currentEditingNoteId = note.id;
    document.getElementById('noteModalTitle').textContent = 'Редактировать заметку';
    document.getElementById('noteTitleInput').value = note.title;
    document.getElementById('noteContentInput').value = note.content || '';
    
    if (note.reminder_date) {
        const reminderDate = new Date(note.reminder_date);
        
        // Форматируем дату для input[type=datetime-local] в правильном формате
        // Учитываем локальный часовой пояс браузера
        const localDate = new Date(reminderDate.getTime() - (reminderDate.getTimezoneOffset() * 60000));
        const localISODate = localDate.toISOString().slice(0, 16);
        
        document.getElementById('reminderDateInput').value = localISODate;
        console.log('Setting reminder date input to:', localISODate);
    } else {
        document.getElementById('reminderDateInput').value = '';
    }
    
    animateModal(document.getElementById('noteModal'), true);

}



// Открытие модалки редактирования заметки
function openEditNoteModal(note) {
    console.log('Opening edit note modal for note:', note.id);
    currentEditingNoteId = note.id;
    document.getElementById('noteModalTitle').textContent = 'Редактировать заметку';
    document.getElementById('noteTitleInput').value = note.title;
    document.getElementById('noteContentInput').value = note.content || '';
    
    if (note.reminder_date) {
        const reminderDate = new Date(note.reminder_date);
        
        // Форматируем дату для input[type=datetime-local] в правильном формате
        const year = reminderDate.getFullYear();
        const month = String(reminderDate.getMonth() + 1).padStart(2, '0');
        const day = String(reminderDate.getDate()).padStart(2, '0');
        const hours = String(reminderDate.getHours()).padStart(2, '0');
        const minutes = String(reminderDate.getMinutes()).padStart(2, '0');
        
        document.getElementById('reminderDateInput').value = `${year}-${month}-${day}T${hours}:${minutes}`;
        console.log('Setting reminder date input to:', `${year}-${month}-${day}T${hours}:${minutes}`);
    } else {
        document.getElementById('reminderDateInput').value = '';
    }
    
    animateModal(document.getElementById('noteModal'), true);

}


// Инициализация модалки просмотра заметки
function initViewNoteModal() {
    const viewNoteModal = document.getElementById('viewNoteModal');
    const closeViewNoteModalBtns = document.querySelectorAll('.close-modal[data-modal="viewNote"]');
    const editNoteBtn = document.getElementById('editNoteBtn');
    const deleteNoteBtn = document.getElementById('deleteNoteBtn');
    const hideReminderBtn = document.getElementById('hideReminderBtn');

    if (!viewNoteModal) {
        console.error('View note modal not found!');
        return;
    }

     // Закрытие модалки просмотра заметки через кнопку закрытия
    if (closeViewNoteBtn) {
        closeViewNoteBtn.addEventListener('click', () => {
            animateModal(viewNoteModal, false);
        });
    }

    // Редактировать заметку из модалки просмотра
    if (editNoteBtn) {
        editNoteBtn.addEventListener('click', () => {
            const noteId = viewNoteModal.dataset.noteId;
            const note = currentNotes.find(n => n.id == noteId);
            if (note) {
                animateModal(viewNoteModal, false);

                setTimeout(() => openEditNoteModal(note), 300);
            }
        });
    }

    // Удалить заметку из модалки просмотра
    if (deleteNoteBtn) {
        deleteNoteBtn.addEventListener('click', () => {
            const noteId = viewNoteModal.dataset.noteId;
            if (noteId) {
                animateModal(viewNoteModal, false);

                setTimeout(() => deleteNote(noteId), 300);
            }
        });
    }

    // Скрыть напоминание
    if (hideReminderBtn) {
        hideReminderBtn.addEventListener('click', () => {
            const noteId = viewNoteModal.dataset.noteId;
            if (noteId) {
                markNoteAsReminded(noteId);
            }
        });
    }

    // Закрытие по клику вне окна
    viewNoteModal.addEventListener('click', function(e) {
        if (e.target === viewNoteModal) {
            animateModal(viewNoteModal, false);

        }
    });
}

function openViewNoteModal(note, isFromReminder = false) {
    document.getElementById('viewNoteTitle').textContent = note.title;
    document.getElementById('viewNoteContent').textContent = note.content || '';
    document.getElementById('viewNoteModal').dataset.noteId = note.id;

    const createdDate = new Date(note.created_at);
    
    // Добавляем дату создания в модалку
    let viewNoteInfo = document.getElementById('viewNoteInfo');
    if (!viewNoteInfo) {
        const titleElement = document.getElementById('viewNoteTitle');
        viewNoteInfo = document.createElement('div');
        viewNoteInfo.id = 'viewNoteInfo';
        viewNoteInfo.className = 'flex items-center text-sm text-gray-400 mb-4';
        viewNoteInfo.innerHTML = `
            <i class="fas fa-calendar-plus mr-2"></i>
            <span>Создано: ${createdDate.toLocaleString('ru-RU')}</span>
        `;
        titleElement.parentNode.insertBefore(viewNoteInfo, titleElement.nextSibling);
    } else {
        viewNoteInfo.innerHTML = `
            <i class="fas fa-calendar-plus mr-2"></i>
            <span>Создано: ${createdDate.toLocaleString('ru-RU')}</span>
        `;
    }

    // Настройка отображения информации о напоминании
    const reminderInfo = document.getElementById('viewNoteReminderInfo');
    const reminderDateElement = document.getElementById('viewNoteReminderDate');

    if (note.reminder_date && !note.is_reminded) {
        const reminderDate = new Date(note.reminder_date);
        reminderDateElement.textContent = `Напоминание: ${reminderDate.toLocaleString('ru-RU')}`;
        reminderInfo.classList.remove('hidden');
    } else {
        reminderInfo.classList.add('hidden');
    }

    // УПРАВЛЕНИЕ КНОПКАМИ В ЗАВИСИМОСТИ ОТ РЕЖИМА
    const editNoteBtn = document.getElementById('editNoteBtn');
    const deleteNoteBtn = document.getElementById('deleteNoteBtn');
    const hideReminderBtn = document.getElementById('hideReminderBtn');
    const actionButtonsContainer = editNoteBtn.parentNode;

    if (isFromReminder) {
        // РЕЖИМ НАПОМИНАНИЯ - скрываем все кнопки действий
        editNoteBtn.classList.add('hidden');
        deleteNoteBtn.classList.add('hidden');
        hideReminderBtn.classList.add('hidden');
        
        // Создаем или показываем только кнопку закрытия
        let closeBtn = document.getElementById('closeNoteBtn');
        if (!closeBtn) {
            closeBtn = document.createElement('button');
            closeBtn.id = 'closeNoteBtn';
            closeBtn.className = 'btn-primary w-full mt-4';
            closeBtn.innerHTML = '<i class="fas fa-times mr-2"></i>Закрыть';
            closeBtn.addEventListener('click', () => {
                document.getElementById('viewNoteModal').classList.add('hidden');
            });
            actionButtonsContainer.appendChild(closeBtn);
        } else {
            closeBtn.classList.remove('hidden');
        }
    } else {
        // ОБЫЧНЫЙ РЕЖИМ - показываем все кнопки действий
        editNoteBtn.classList.remove('hidden');
        deleteNoteBtn.classList.remove('hidden');
        
        // Управляем видимостью кнопки скрытия напоминания
        if (note.reminder_date && !note.is_reminded) {
            hideReminderBtn.classList.remove('hidden');
        } else {
            hideReminderBtn.classList.add('hidden');
        }
        
        // Скрываем кнопку закрытия если она есть
        const closeBtn = document.getElementById('closeNoteBtn');
        if (closeBtn) {
            closeBtn.classList.add('hidden');
        }
    }

    animateModal(document.getElementById('viewNoteModal'), true);

}

// Удаление заметки
function deleteNote(noteId) {
    if (!confirm('Удалить заметку? Это действие нельзя отменить.')) {
        return;
    }

    fetch(`/delete_note/${noteId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadNotes();
            showNoteNotification('Заметка удалена!', 'success');
        } else {
            showNoteNotification(data.error || 'Ошибка при удалении заметки', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showNoteNotification('Произошла ошибка при удалении заметки', 'error');
    });
}

// Отметить заметку как напомненную (ручное скрытие)
function markNoteAsReminded(noteId) {
    fetch(`/mark_note_as_reminded/${noteId}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Закрываем модалку просмотра, если открыта
            const viewNoteModal = document.getElementById('viewNoteModal');
            if (viewNoteModal) {
                animateModal(viewNoteModal, false);

            }
            
            // Перезагружаем список заметок
            loadNotes();
            
            // Удаляем соответствующее уведомление, если оно еще есть
            const notificationContainer = document.getElementById('notificationContainer');
            if (notificationContainer) {
                const reminderNotification = notificationContainer.querySelector(`[data-reminder-id="${noteId}"]`);
                if (reminderNotification) {
                    reminderNotification.remove();
                }
            }
            
            showNoteNotification('Напоминание скрыто!', 'success');
        } else {
            showNoteNotification(data.error || 'Ошибка при скрытии напоминания', 'error');
        }
    })
    .catch(error => {
        console.error('Ошибка:', error);
        showNoteNotification('Произошла ошибка при скрытии напоминания', 'error');
    });
}

// Система напоминаний
function initReminderSystem() {
    checkReminders();
    // Проверяем каждые 2 минуты вместо 1 минуты для уменьшения нагрузки
    setInterval(checkReminders, 120000);
}

function checkReminders() {
    fetch('/get_pending_reminders/')
        .then(response => response.json())
        .then(data => {
            if (data.reminders && data.reminders.length > 0) {
                data.reminders.forEach(reminder => {
                    showReminderNotification(reminder);
                });
            }
        })
        .catch(error => {
            console.error('Ошибка при проверке напоминаний:', error);
        });
}

function showReminderNotification(reminder) {
    // Используем существующий контейнер для уведомлений
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) return;

    // Проверяем, нет ли уже уведомления с таким ID
    const existingNotification = notificationContainer.querySelector(`[data-reminder-id="${reminder.id}"]`);
    if (existingNotification) {
        console.log('Уведомление уже существует, пропускаем создание дубликата');
        return;
    }

    // Обрезаем текст заметки до 18 символов
    const truncatedTitle = reminder.title.length > 18 
        ? reminder.title.substring(0, 18) + '...' 
        : reminder.title;

    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = 'notification-inline flex items-center px-3 py-1.5 rounded-lg text-sm bg-gray-800/90 backdrop-blur-sm border border-gray-700 cursor-pointer hover:bg-gray-700/90 transition-all duration-200 active:scale-95';
    notification.dataset.reminderId = reminder.id;
    notification.style.cssText = 'pointer-events: auto; z-index: 1000;';
    notification.innerHTML = `
        <div class="flex items-center w-full">
            <i class="fas fa-bell mr-3 p-1 text-yellow-300 animate-pulse"></i>
            <div class="flex-1 p2">
                <div class="font-semibold text-white text-xs mb-0">Напоминание</div>
               
        </div>
    `;

    // При клике на уведомление открываем заметку
    notification.addEventListener('click', function(e) {
        console.log('Клик по уведомлению для заметки:', reminder.id);
        openReminderNote(reminder);
        this.remove();
    });

    // Добавляем в контейнер
    notificationContainer.appendChild(notification);

    // Анимация появления
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateY(0)';
    }, 10);
}

function openReminderNote(reminder) {
    // Отмечаем заметку как напомненную
    fetch(`/mark_note_as_reminded/${reminder.id}/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': getCSRFToken(),
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Показываем модалку с заметкой
            openViewNoteModal(reminder);
        }
    })
    .catch(error => {
        console.error('Ошибка при отметке напоминания:', error);
        // Все равно показываем заметку
        openViewNoteModal(reminder);
    });
}

// Вспомогательные функции
function getCSRFToken() {
    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
    return csrfToken ? csrfToken.value : '';
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Обновленная функция уведомлений для notes.js с единым стилем
function showNoteNotification(message, type = 'success') {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        console.log(`${type}: ${message}`);
        return;
    }
    
    // Используем единый стиль для всех уведомлений
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    const iconColor = type === 'success' ? 'text-blue-400' : 'text-yellow-400';
    
    notificationContainer.innerHTML = `
        <div class="notification-inline flex items-center px-3 py-1.5 rounded-lg text-sm bg-gray-800/80 backdrop-blur-sm border border-gray-700 text-white">
            <i class="fas ${icon} mr-2 ${iconColor}"></i>
            <span>${message}</span>
        </div>
    `;
    
    setTimeout(() => {
        notificationContainer.innerHTML = '';
    }, 3000);
}


// Глобальная функция для открытия модалки из HTML атрибута onclick
window.openAddNoteModal = function() {
    console.log('Opening add note modal from empty state button');
    currentEditingNoteId = null;
    document.getElementById('noteModalTitle').textContent = 'Новая заметка';
    document.getElementById('noteTitleInput').value = '';
    document.getElementById('noteContentInput').value = '';
    document.getElementById('reminderDateInput').value = '';
    animateModal(document.getElementById('noteModal'), true);

};