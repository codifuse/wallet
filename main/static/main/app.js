// -----------------------------
// Утилиты и глобальные переменные
// -----------------------------
let currentFilter = 'week';
let currentPage = 1;
let hasMoreTransactions = true;
let isLoading = false;
let currentCategory = 'all';
const PAGE_SIZE = 10;

window.categories = window.categories || [];
window.initialBalances = window.initialBalances || { total: 0, income: 0, expense: 0 };
window.initialReservePercentage = window.initialReservePercentage || 0;
window.initialTargetReserve = window.initialTargetReserve || 0;


// -----------------------------
// Уведомления и мелкие UI-помощники
// -----------------------------
function showSuccessNotification(message) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    const notification = document.createElement('div');
    notification.className = 'notification-inline flex items-center px-3 py-1.5 rounded-lg text-sm bg-gray-800/80 backdrop-blur-sm border border-gray-700';
    notification.innerHTML = `<span><i class="fas fa-bell mr-2 text-blue-400"></i> ${message}</span>`;
container.appendChild(notification);

// Обеспечим наложение поверх предыдущих
notification.style.zIndex = Date.now(); // чуть выше с каждым разом

setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
}, 2000);

}

// -----------------------------
// Модалки
// -----------------------------
function animateModal(modalEl, show = true) {
    if (!modalEl) return;

    if (show) {
        modalEl.classList.remove('hidden');
        modalEl.classList.add('animate-overlayFadeIn');

        // Блокируем скролл фона
        document.body.classList.add('modal-open');

        const content = modalEl.querySelector('.modal-content');
        if (content) {
            content.classList.remove('animate-modalHide');
            content.classList.add('animate-modalShow');
        }
    } else {
        const content = modalEl.querySelector('.modal-content');
        if (content) {
            content.classList.remove('animate-modalShow');
            content.classList.add('animate-modalHide');
        }

        // Разблокируем скролл через небольшой таймаут
        setTimeout(() => {
            modalEl.classList.add('hidden');
            document.body.classList.remove('modal-open');
        }, 200);
    }
}


// -----------------------------
// Балансы и резерв
// -----------------------------
function updateBalanceDisplay() {
    const totalEl = document.getElementById('totalBalance');
    const incomeEl = document.getElementById('monthIncome');
    const expenseEl = document.getElementById('monthExpense');
    const reserveEl = document.getElementById('reserveAmount');
    
    if (totalEl && window.initialBalances) {
        const rawValue = window.initialBalances.total || 0;
        totalEl.textContent = formatAmount(rawValue);
        totalEl.setAttribute('data-raw-value', rawValue);
    }
    
    if (incomeEl && window.initialBalances) {
        const rawValue = window.initialBalances.income || 0;
        incomeEl.textContent = formatAmount(rawValue) + ' с';
        incomeEl.setAttribute('data-raw-value', rawValue);
    }
    
    if (expenseEl && window.initialBalances) {
        const rawValue = window.initialBalances.expense || 0;
        expenseEl.textContent = formatAmount(rawValue) + ' с';
        expenseEl.setAttribute('data-raw-value', rawValue);
    }
    
    if (reserveEl && window.initialBalances) {
        const rawValue = window.initialBalances.total_reserve || 0;
        reserveEl.textContent = formatAmount(rawValue);
        reserveEl.setAttribute('data-raw-value', rawValue);
    }
    
    updateSavingsDisplay();
}

// -----------------------------
// Обновление отображения сбережений в вкладке статистики
// -----------------------------


// Обновленная функция для отображения сбережений
function updateSavingsDisplay() {
    try {
        const currentReserveValue = window.initialBalances.total_reserve || 0;
        const monthlyReserveValue = window.initialBalances.monthly_reserve || 0;
        const targetReserveValue = window.initialTargetReserve || 0;
        const remainingValue = Math.max(0, targetReserveValue - currentReserveValue);
        const progressPercentage = targetReserveValue > 0 ? 
            Math.min(100, (currentReserveValue / targetReserveValue) * 100) : 0;

        // Обновляем текущий резерв
        const currentReserveEl = document.getElementById('currentReserveAmount');
        if (currentReserveEl) {
            currentReserveEl.textContent = formatAmount(currentReserveValue);
            currentReserveEl.setAttribute('data-raw-value', currentReserveValue);
        }

        // Обновляем отложено в этом месяце
        const monthlyReserveEl = document.getElementById('monthlyReserveAmount');
        if (monthlyReserveEl) {
            monthlyReserveEl.textContent = formatAmount(monthlyReserveValue);
            monthlyReserveEl.setAttribute('data-raw-value', monthlyReserveValue);
        }

        // Обновляем всего накоплено
        const totalReserveEl = document.getElementById('totalReserveAmount');
        if (totalReserveEl) {
            totalReserveEl.textContent = formatAmount(currentReserveValue);
            totalReserveEl.setAttribute('data-raw-value', currentReserveValue);
        }

        // Обновляем целевой резерв
        const targetReserveEl = document.getElementById('targetReserveAmount');
        if (targetReserveEl) {
            targetReserveEl.textContent = formatAmount(targetReserveValue);
            targetReserveEl.setAttribute('data-raw-value', targetReserveValue);
        }

        // Обновляем осталось до цели
        const remainingEl = document.getElementById('remainingToTarget');
        if (remainingEl) {
            remainingEl.textContent = formatAmount(remainingValue);
            remainingEl.setAttribute('data-raw-value', remainingValue);
        }

        // Обновляем текст "Осталось: X с"
        const remainingTextEl = document.getElementById('remainingToTargetText');
        if (remainingTextEl) {
            remainingTextEl.innerHTML = `Осталось: <span id="remainingToTarget" data-raw-value="${remainingValue}">${formatAmount(remainingValue)}</span> с`;
        }

        // Обновляем прогресс-бар и текст прогресса
        const progressBar = document.getElementById('reserveProgressBar');
        const progressText = document.getElementById('reserveProgressText');
        
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
        }
        if (progressText) {
            progressText.textContent = `${progressPercentage.toFixed(1)}%`;
        }

        // ОБНОВЛЯЕМ ЦЕЛЕВОЙ ПРОГРЕСС-БАР
        const targetProgressBar = document.getElementById('targetProgressBar');
        if (targetProgressBar) {
            targetProgressBar.style.width = `${progressPercentage}%`;
        }

        // ОБНОВЛЯЕМ ДИНАМИЧЕСКИЕ ЭЛЕМЕНТЫ ЦЕЛЕВОГО РЕЗЕРВА
        const targetCurrentReserveEl = document.getElementById('targetCurrentReserve');
        if (targetCurrentReserveEl) {
            targetCurrentReserveEl.textContent = formatAmount(currentReserveValue) + ' с';
            targetCurrentReserveEl.setAttribute('data-raw-value', currentReserveValue);
        }

        const targetRemainingEl = document.getElementById('targetRemaining');
        if (targetRemainingEl) {
            targetRemainingEl.textContent = formatAmount(remainingValue) + ' с';
            targetRemainingEl.setAttribute('data-raw-value', remainingValue);
        }

        const targetProgressPercentEl = document.getElementById('targetProgressPercent');
        if (targetProgressPercentEl) {
            targetProgressPercentEl.textContent = `${progressPercentage.toFixed(1)}%`;
        }

        // ОБНОВЛЯЕМ МОТИВАЦИОННОЕ СООБЩЕНИЕ
        updateMotivationMessage(progressPercentage);

    } catch (e) {
        console.error('updateSavingsDisplay error', e);
    }
}

// Функция для обновления мотивационного сообщения
function updateMotivationMessage(progressPercentage) {
    const motivationMessageEl = document.getElementById('motivationMessage');
    if (!motivationMessageEl) return;

    let messageHtml = '';

    if (progressPercentage === 100) {
        messageHtml = `
            <div class="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-2 border border-green-500/30">
                <p class="text-xs text-green-400 font-semibold">
                    <i class="fas fa-trophy mr-1"></i>Поздравляем! Цель достигнута!
                </p>
            </div>
        `;
    } else if (progressPercentage > 75) {
        messageHtml = `
            <p class="text-xs text-yellow-400 animate-pulse">
                <i class="fas fa-fire mr-1"></i>Осталось совсем немного!
            </p>
        `;
    } else if (progressPercentage > 50) {
        messageHtml = `
            <p class="text-xs text-blue-400">
                <i class="fas fa-rocket mr-1"></i>Отличный прогресс!
            </p>
        `;
    } else if (progressPercentage > 25) {
        messageHtml = `
            <p class="text-xs text-purple-400">
                <i class="fas fa-seedling mr-1"></i>Продолжайте в том же духе!
            </p>
        `;
    } else {
        messageHtml = `
            <p class="text-xs text-gray-400">
                <i class="fas fa-flag mr-1"></i>Начните свой путь к цели
            </p>
        `;
    }

    motivationMessageEl.innerHTML = messageHtml;
}

// -----------------------------
// Форматирование всех элементов резерва при загрузке
// -----------------------------
// Форматирование всех элементов резерва при загрузке
function formatAllReserveElements() {
    const reserveElements = [
        'currentReserveAmount',
        'monthlyReserveAmount',
        'totalReserveAmount',
        'targetReserveAmount',
        'remainingToTarget',
        'targetCurrentReserve',
        'targetRemaining'
    ];

    reserveElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const rawValue = element.getAttribute('data-raw-value') || element.textContent.replace(/[^\d]/g, '');
            if (rawValue) {
                element.textContent = formatAmount(rawValue);
                element.setAttribute('data-raw-value', rawValue);
            }
        }
    });
    
    // Также форматируем прогресс при загрузке
    const progressText = document.getElementById('reserveProgressText');
    if (progressText) {
        const currentValue = parseFloat(progressText.textContent) || 0;
        progressText.textContent = `${currentValue.toFixed(1)}%`;
    }
}


// -----------------------------
// Улучшенная функция форматирования
// -----------------------------
function formatAmount(amount) {
    // Если значение уже отформатировано (содержит пробелы), возвращаем как есть
    if (typeof amount === 'string' && amount.includes(' ')) {
        return amount;
    }
    
    const number = typeof amount === 'string' ? 
        parseFloat(amount.replace(/\s/g, '').replace(',', '.')) : 
        amount || 0;
    
    // Округляем до целого числа
    const rounded = Math.round(number);
    
    // Форматируем с пробелами между тысячами
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}




// -----------------------------
// Форматирование всех элементов резерва
// -----------------------------
function formatAllReserveElements() {
    const reserveElements = [
        'currentReserveAmount',
        'monthlyReserveAmount',
        'totalReserveAmount',
        'targetReserveAmount',
        'remainingToTarget'
    ];

    reserveElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            const rawValue = element.getAttribute('data-raw-value') || element.textContent;
            element.textContent = formatAmount(rawValue);
            element.setAttribute('data-raw-value', rawValue);
        }
    });
}



function updateReserveDisplay() {
    try {
        const reserveAmountEl = document.getElementById('reserveAmount');
        const reservePercentDisplay = document.getElementById('reservePercentageDisplay') || document.getElementById('currentReservePercent');
        
        if (!reserveAmountEl) return;
        
        // Используем фактический резерв из initialBalances
        const reserveValue = window.initialBalances.total_reserve || 0;
        
        // Форматируем значение резерва
        reserveAmountEl.textContent = formatAmount(reserveValue);
        reserveAmountEl.setAttribute('data-raw-value', reserveValue);
        
        if (reservePercentDisplay) {
            reservePercentDisplay.textContent = window.initialReservePercentage + '%';
        }
        
    } catch (e) {
        console.error('updateReserveDisplay error', e);
    }
}



// -----------------------------
// Добавление транзакции в DOM
// -----------------------------

window.addTransactionToList = function(transaction, animate = true, append = false) {
    const transactionsContainer = document.getElementById('transactionsListContainer');
    if (!transactionsContainer) return;

    const transactionDate = new Date(transaction.created_at || transaction.created || Date.now());
    const formattedDate = transactionDate.toLocaleDateString('ru-RU');
    const formattedTime = transactionDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    // Универсальная структура с датой всегда под суммой
    let amountDisplay = '';
    if (transaction.type === 'income') {
        if (transaction.reserve_amount > 0) {
            amountDisplay = `
                <div class="text-right">
                    <div class="space-y-1">
                        <p class="text-green-400 font-semibold">+${formatAmount(transaction.amount)} с</p>
                        <p class="text-blue-400 text-xs">резерв: ${formatAmount(transaction.reserve_amount)} с</p>
                        <p class="text-xs text-gray-400">${formattedDate} ${formattedTime}</p>
                    </div>
                </div>
            `;
        } else {
            amountDisplay = `
                <div class="text-right">
                    <div class="space-y-1">
                        <p class="text-green-400 font-semibold">+${formatAmount(transaction.amount)} с</p>
                        <p class="text-xs text-gray-400">${formattedDate} ${formattedTime}</p>
                    </div>
                </div>
            `;
        }
    } else {
        amountDisplay = `
            <div class="text-right">
                <div class="space-y-1">
                    <p class="text-red-400 font-semibold">-${formatAmount(transaction.amount)} с</p>
                    <p class="text-xs text-gray-400">${formattedDate} ${formattedTime}</p>
                </div>
            </div>
        `;
    }

    const html = `
        <div class="transaction-item bg-gray-800 rounded-lg p-3 flex justify-between items-center ${animate ? 'animate-fadeIn' : ''}"
             data-category-id="${transaction.category_id || transaction.categoryId || 'unknown'}"
             data-transaction-id="${transaction.id || ''}">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center" 
                     style="background-color: ${transaction.category_color || '#999'}22; color: ${transaction.category_color || '#999'}">
                    <i class="${transaction.category_icon || 'fas fa-circle'}"></i>
                </div>
                <div>
                    <p class="font-medium">${transaction.category_name || transaction.category || 'Прочее'}</p>
                    ${transaction.description ? `<p class="text-xs text-gray-400 line-clamp-1 [max-width:20ch]">${transaction.description}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-3">
                ${amountDisplay}
                <button class="delete-transaction-btn text-red-400 hover:text-red-300 p-2 transition-colors" 
                        data-transaction-id="${transaction.id || ''}" title="Удалить транзакцию">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
        </div>
    `;

    // ИЗМЕНЕНИЕ: Добавляем транзакцию в начало или конец в зависимости от параметра append
    if (append) {
        transactionsContainer.insertAdjacentHTML('beforeend', html);
    } else {
        transactionsContainer.insertAdjacentHTML('afterbegin', html);
    }

    // скрыть пустые состояния
    hideEmptyStates();
    updateWelcomeHint();
};




// -----------------------------
// Пустые состояния
// -----------------------------
function hideEmptyStates() {
    const emptyAll = document.getElementById('emptyStateAll');
    const emptyFiltered = document.getElementById('emptyStateFiltered');
    if (emptyAll) emptyAll.classList.add('hidden');
    if (emptyFiltered) emptyFiltered.classList.add('hidden');
}

function showEmptyState() {
    const emptyAll = document.getElementById('emptyStateAll');
    const emptyFiltered = document.getElementById('emptyStateFiltered');
    if (currentCategory === 'all') {
        if (emptyAll) emptyAll.classList.remove('hidden');
        if (emptyFiltered) emptyFiltered.classList.add('hidden');
    } else {
        if (emptyFiltered) emptyFiltered.classList.remove('hidden');
        if (emptyAll) emptyAll.classList.add('hidden');
    }
}

// -----------------------------
// Загрузка транзакций (единственная реализация)
// -----------------------------
async function loadTransactions() {
    if (isLoading) return;
    isLoading = true;

    const transactionsContainer = document.getElementById('transactionsListContainer');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    if (!transactionsContainer) {
        console.error('transactionsListContainer not found');
        isLoading = false;
        return;
    }

    if (currentPage === 1) {
        transactionsContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                <p class="text-gray-400 text-sm mt-2">Загрузка...</p>
            </div>
        `;
    }

    try {
        const resp = await fetch(`/get_transactions/?filter=${currentFilter}&page=${currentPage}&limit=${PAGE_SIZE}&category=${currentCategory}`, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        if (!resp.ok) {
            console.error('Server error when fetching transactions:', resp.status, resp.statusText);
            if (currentPage === 1) {
                transactionsContainer.innerHTML = `<div class="text-center py-8 text-red-400"><i class="fas fa-exclamation-triangle text-2xl mb-2"></i><p>Ошибка загрузки (сервер вернул ${resp.status}).</p></div>`;
            }
            hasMoreTransactions = false;
            if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
            return;
        }

        const data = await resp.json();
        if (data.success) {
            if (currentPage === 1) transactionsContainer.innerHTML = '';
            
            if (data.transactions && data.transactions.length > 0) {
                // УБИРАЕМ СОРТИРОВКУ - сервер должен возвращать уже отсортированные данные
                // от новых к старым
                data.transactions.forEach(tx => window.addTransactionToList(tx, false, true));
                
                hasMoreTransactions = !!data.has_more;
                if (loadMoreContainer) loadMoreContainer.classList.toggle('hidden', !hasMoreTransactions);
                hideEmptyStates();
                updateWelcomeHint();
                if (hasMoreTransactions) currentPage++;
            } else {
                if (currentPage === 1) {
                    transactionsContainer.innerHTML = '';
                    showEmptyState();
                    updateWelcomeHint();
                    if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
                } else {
                    if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
                }
                hasMoreTransactions = false;
            }
        } else {
            console.error('API returned success:false for transactions:', data);
            if (currentPage === 1) {
                transactionsContainer.innerHTML = `<div class="text-center py-8 text-red-400"><i class="fas fa-exclamation-triangle text-2xl mb-2"></i><p>Ошибка загрузки данных</p></div>`;
            }
            if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
            hasMoreTransactions = false;
        }
    } catch (error) {
        console.error('Ошибка при загрузке транзакций:', error);
        if (currentPage === 1) {
            transactionsContainer.innerHTML = `<div class="text-center py-8 text-red-400"><i class="fas fa-exclamation-triangle text-2xl mb-2"></i><p>Ошибка загрузки</p></div>`;
        }
        if (loadMoreContainer) loadMoreContainer.classList.add('hidden');
        hasMoreTransactions = false;
    } finally {
        isLoading = false;
    }
}

// Загрузить ещё
async function loadMoreTransactions() {
    if (isLoading || !hasMoreTransactions) return;
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.innerHTML = '<div class="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>';
    }
    await loadTransactions();
    if (loadMoreBtn) {
        loadMoreBtn.disabled = false;
        loadMoreBtn.textContent = 'Загрузить еще';
    }
}

// -----------------------------
// Инициализация фильтров и табов категорий
// -----------------------------
function updateCategoryTabsHandlers() {
    const tabs = document.querySelectorAll('.tab');
    // переподвешиваем обработчики (делаем клон чтобы убрать старые)
    tabs.forEach(tab => {
        const clone = tab.cloneNode(true);
        tab.parentNode.replaceChild(clone, tab);
    });
    const updatedTabs = document.querySelectorAll('.tab');
    updatedTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            updatedTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            const categoryId = this.dataset.category;
            currentCategory = categoryId || 'all';
            currentPage = 1;
            hasMoreTransactions = true;
            loadTransactions();
        });
    });
}

function initTransactionFilter() {
    const filterToggle = document.getElementById('filterToggleBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const filterOptions = document.querySelectorAll('.filter-option');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    if (filterToggle && filterDropdown) {
        filterToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            filterDropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', () => filterDropdown.classList.add('hidden'));
    }

    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            const filter = this.dataset.filter;
            currentFilter = filter || 'week';
            currentPage = 1;
            hasMoreTransactions = true;
            const currentText = document.getElementById('currentFilterText');
            if (currentText) currentText.textContent = this.textContent.trim();
            filterDropdown.classList.add('hidden');
            loadTransactions();
        });
    });

    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreTransactions);
    }

    // авто-инициализация при загрузке если пусто
    setTimeout(() => {
        const container = document.getElementById('transactionsListContainer');
        if (container && container.children.length === 0) {
            loadTransactions();
        }
    }, 300);
}



// -----------------------------
// Удаление транзакций (инлайн-подтверждение)
// -----------------------------
function deleteTransaction(transactionId) {
    const el = document.querySelector(`.delete-transaction-btn[data-transaction-id="${transactionId}"]`);
    if (!el) return;
    const item = el.closest('.transaction-item');
    if (!item) return;

    // Сохраняем оригинальное содержимое и информацию о транзакции
    const originalContent = item.innerHTML;
    const transactionType = item.querySelector('.font-semibold').classList.contains('text-green-400') ? 'income' : 'expense';
    const amountText = item.querySelector('.font-semibold').textContent;
    const amount = parseFloat(amountText.replace(/[^\d,]/g, '').replace(',', '.')) || 0;

    // Создаем контент подтверждения удаления
    item.innerHTML = `
        <div class="flex items-center justify-between w-full animate-popIn">
            <div class="flex items-center space-x-2">
                <i class="fas fa-trash text-red-400"></i>
                <span class="text-gray-200 text-sm font-medium">Удалить операцию?</span>
            </div>
            <div class="flex items-center space-x-2">
                <button class="cancel-delete-btn bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all">
                    Нет
                </button>
                <button class="confirm-delete-btn bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                        data-transaction-id="${transactionId}">
                    Да
                </button>
            </div>
        </div>
    `;

    // Обработчик подтверждения удаления
    const confirmBtn = item.querySelector('.confirm-delete-btn');
       confirmBtn.addEventListener('click', async function() {
        try {
            const resp = await fetch(`/delete_transaction/${transactionId}/`);
            const data = await resp.json();
            if (data.success) {
                // Показываем успешное сообщение
                item.innerHTML = `
                    <div class="w-full flex items-center justify-between animate-popIn">
                        <div class="flex items-center space-x-3">
                            <div class="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center ring-2 ring-green-400/30 shadow-inner shadow-green-600/10">
                                <i class="fas fa-check text-green-400 text-lg"></i>
                            </div>
                            <div class="flex flex-col">
                                <span class="text-green-400 font-semibold text-sm tracking-wide">Транзакция удалена!</span>
                                <span class="text-gray-400 text-xs">Данные успешно обновлены :)</span>
                            </div>
                        </div>
                        <i class="fas fa-circle-check text-green-400 text-xl opacity-80"></i>
                    </div>
                `;

              setTimeout(() => { 
                    item.remove(); 
                    checkEmptyStatesAfterChange(); 
                    updateWelcomeHint(); // обновляем подсказку
                }, 2200);

                // Обновляем балансы
                if (data.updated_balances) {
                    window.initialBalances = data.updated_balances;
                    updateBalanceDisplay();
                } else {
                    // Локальное обновление баланса при удалении
                    updateBalancesAfterDelete(transactionType, Math.abs(amount));
                }
            } else {
                // В случае ошибки возвращаем оригинальное содержимое
                item.innerHTML = originalContent;
                reattachDeleteHandler(item, transactionId);
            }
        } catch (e) {
            console.error('delete transaction error', e);
            // В случае ошибки возвращаем оригинальное содержимое
            item.innerHTML = originalContent;
            reattachDeleteHandler(item, transactionId);
        }
    });
    
    // Обработчик отмены удаления
    const cancelBtn = item.querySelector('.cancel-delete-btn');
    cancelBtn.addEventListener('click', function() {
        // Возвращаем оригинальное содержимое
        item.innerHTML = originalContent;
        // Перепривязываем обработчик удаления
        reattachDeleteHandler(item, transactionId);
    });
}

// -----------------------------
// Перепривязка обработчика удаления после отмены
// -----------------------------
function reattachDeleteHandler(item, transactionId) {
    const deleteBtn = item.querySelector('.delete-transaction-btn');
    if (deleteBtn) {
        // Удаляем старые обработчики и добавляем новый
        deleteBtn.replaceWith(deleteBtn.cloneNode(true));
        const newDeleteBtn = item.querySelector('.delete-transaction-btn');
        newDeleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            deleteTransaction(transactionId);
        });
    }
}

// -----------------------------
// Локальное обновление балансов при удалении транзакции
// -----------------------------
function updateBalancesAfterDelete(type, amount) {
    if (!window.initialBalances) window.initialBalances = { total: 0, income: 0, expense: 0 };
    
    let total = parseFloat(window.initialBalances.total || 0);
    let income = parseFloat(window.initialBalances.income || 0);
    let expense = parseFloat(window.initialBalances.expense || 0);

    if (type === 'income') {
        // Удаляем доход: уменьшаем общий баланс и доходы
        total -= amount;
        income -= amount;
    } else {
        // Удаляем расход: увеличиваем общий баланс и уменьшаем расходы
        total += amount;
        expense -= amount;
    }

    window.initialBalances.total = total;
    window.initialBalances.income = income;
    window.initialBalances.expense = expense;
    
    updateBalanceDisplay();
}

// -----------------------------
// Делегирование событий для кнопок удаления
// -----------------------------
document.addEventListener('click', function(e) {
    // Обработка кнопок удаления транзакций
    if (e.target.closest('.delete-transaction-btn')) {
        const target = e.target.closest('.delete-transaction-btn');
        e.preventDefault();
        e.stopPropagation();
        const id = target.dataset.transactionId;
        if (id) {
            deleteTransaction(id);
        }
    }
    
    // Обработка кнопок удаления категорий
    if (e.target.closest('.delete-category-btn')) {
        const target = e.target.closest('.delete-category-btn');
        e.preventDefault();
        e.stopPropagation();
        const categoryId = target.dataset.categoryId;
        if (categoryId) {
            deleteCategory(categoryId);
        }
    }
});

// -----------------------------
// Проверки пустых состояний
// -----------------------------

function checkEmptyStatesAfterChange() {
    const transactionsContainer = document.getElementById('transactionsListContainer');
    if (!transactionsContainer) return;
    
    const items = transactionsContainer.querySelectorAll('.transaction-item');
    const visible = Array.from(items).filter(it => !it.innerHTML.includes('Удалить?') && !it.innerHTML.includes('Удалено'));
    
    if (visible.length === 0) {
        showEmptyState();
    } else {
        hideEmptyStates();
    }
    
    // Обновляем подсказку
    updateWelcomeHint();
}



// -----------------------------
// Категории: загрузка и обновление
// -----------------------------
async function updateGlobalCategories() {
    try {
        const resp = await fetch('/get_categories/');
        const data = await resp.json();
        if (data.categories) {
            window.categories = data.categories;
            // обновим табы
            updateCategoryTabs();
        }
    } catch (e) {
        console.error('updateGlobalCategories error', e);
    }
}

async function updateCategoryTabs() {
    try {
        const resp = await fetch('/get_categories/');
        const data = await resp.json();
        if (!data.categories) return;
        const tabsWrapper = document.getElementById('tabsWrapper');
        if (!tabsWrapper) return;
        tabsWrapper.innerHTML = `<div class="tab active" data-category="all"><span>Все</span></div>`;
        data.categories.forEach(cat => {
            const el = document.createElement('div');
            el.className = 'tab';
            el.dataset.category = cat.id;
            el.innerHTML = `<span>${cat.name}</span>`;
            tabsWrapper.appendChild(el);
        });
        updateCategoryTabsHandlers();
    } catch (e) {
        console.error('updateCategoryTabs error', e);
    }
}

// -----------------------------
// Инициализация модалки транзакции, клавиатуры и формы
// -----------------------------
function initTransactionModal() {
    const modal = document.getElementById("transactionModal");
    const openBtn = document.getElementById("openTransactionModalBtn");
    const closeBtn = document.getElementById("closeTransactionModalBtn");

    if (openBtn && modal) {
        openBtn.addEventListener('click', async function() {
            animateModal(modal, true);
            resetTransactionForm();
            await updateGlobalCategories();
            // если есть функция loadCategories, вызовем её
            if (typeof loadCategoriesForModal === 'function') loadCategoriesForModal();

        });
    }
    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => animateModal(modal, false));
    }

    // По клику вне модалки
    if (modal) {
        modal.addEventListener('click', e => { if (e.target === modal) animateModal(modal, false); });
    }

    initTypeButtons();
    initKeypad();
    initFormSubmission();
    
}

function initTypeButtons() {
    const typeButtons = document.querySelectorAll('.type-btn');
    typeButtons.forEach(button => {
        button.addEventListener('click', function() {
            typeButtons.forEach(btn => {
                btn.classList.remove('bg-red-600','bg-green-600','text-white','border-red-600','border-green-600');
                btn.classList.add('bg-gray-700','text-gray-300','border-gray-600');
            });
            const type = this.dataset.type;
            if (type === 'expense') {
                this.classList.remove('bg-gray-700','text-gray-300','border-gray-600');
                this.classList.add('bg-red-600','text-white','border-red-600');
            } else {
                this.classList.remove('bg-gray-700','text-gray-300','border-gray-600');
                this.classList.add('bg-green-600','text-white','border-green-600');
            }
        });
    });
}

function initKeypad() {
    const amountInput = document.getElementById('amountInput');
    const keys = document.querySelectorAll('.keypad-btn');
    if (!amountInput) return;
    function formatInputAmount(value) {
        const clean = value.replace(/[^\d]/g,'');
        if (!clean) return '0';
        return formatAmount(clean);
    }
    keys.forEach(k => {
        k.addEventListener('click', function() {
            const v = this.textContent.trim();
            const current = amountInput.value.replace(/[^\d]/g,'');
            if (this.querySelector('i.fa-backspace')) {
                const newV = current.slice(0,-1) || '0';
                amountInput.value = formatInputAmount(newV);
            } else if (v === '00') {
                const newV = current === '0' ? '0' : current + '00';
                amountInput.value = formatInputAmount(newV);
            } else {
                let newV = current === '0' ? v : current + v;
                amountInput.value = formatInputAmount(newV);
            }
        });
    });
    amountInput.addEventListener('input', function() { this.value = formatInputAmount(this.value); });
}

function resetTransactionForm() {
    const form = document.getElementById('transactionForm');
    if (form) form.reset();
    const selected = document.getElementById('selectedCategory');
    if (selected) selected.value = '';
    document.querySelectorAll('.category-carousel-btn').forEach(btn => btn.classList.remove('active'));
    const amountInput = document.getElementById('amountInput');
    if (amountInput) amountInput.value = '0';
}




function initFormSubmission() {
    const form = document.getElementById('transactionForm');
    if (!form) return;
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const activeTypeBtn = document.querySelector('.type-btn.bg-red-600, .type-btn.bg-green-600');
        if (!activeTypeBtn) { alert('Выберите тип операции (Расход/Доход)'); return; }
        const transactionType = activeTypeBtn.dataset.type;
        const amountRaw = document.getElementById('amountInput').value.replace(/\s/g,'');
        if (!amountRaw || parseFloat(amountRaw) <= 0) { alert('Введите корректную сумму'); return; }
        const selectedCategory = document.getElementById('selectedCategory').value;
        if (!selectedCategory) { alert('Выберите категорию'); return; }
        const formData = new FormData();
        formData.append('type', transactionType);
        formData.append('amount', amountRaw);
        formData.append('category', selectedCategory);
        formData.append('description', document.getElementById('descriptionInput') ? document.getElementById('descriptionInput').value : '');
        const csrfTokenEl = document.querySelector('[name=csrfmiddlewaretoken]');
        const csrfToken = csrfTokenEl ? csrfTokenEl.value : '';
        try {
            const resp = await fetch(window.ADD_TRANSACTION_URL || '/add_transaction/', {
                method: 'POST',
                headers: { 'X-CSRFToken': csrfToken, 'X-Requested-With': 'XMLHttpRequest' },
                body: formData
            });
            const data = await resp.json();
            if (data.success) {
                // Закрываем модалку
                const modal = document.getElementById('transactionModal');
                if (modal) animateModal(modal, false);
                // Обновляем баланс и ставим транзакцию наверх
                if (data.transaction) window.addTransactionToList(data.transaction, true, false); 
                if (data.updated_balances) {
                    window.initialBalances = data.updated_balances;
                    updateBalanceDisplay();
                } else {
                    // локально обновим
                    updateBalancesAfterTransaction(transactionType, parseFloat(amountRaw));
                }
                showSuccessNotification('Транзакция успешна!');
            } else {
                alert(data.error || 'Ошибка при сохранении');
            }
        } catch (err) {
            console.error('submit transaction error', err);
            alert('Произошла ошибка при отправке формы');
        }
    });
}



function updateBalancesAfterTransaction(type, amount, reserveAmount = 0) {
    if (!window.initialBalances) window.initialBalances = { 
        total: 0, 
        income: 0, 
        expense: 0, 
        total_reserve: 0,
        monthly_reserve: 0 
    };
    
    let total = parseFloat(window.initialBalances.total || 0);
    let income = parseFloat(window.initialBalances.income || 0);
    let expense = parseFloat(window.initialBalances.expense || 0);
    let total_reserve = parseFloat(window.initialBalances.total_reserve || 0);
    let monthly_reserve = parseFloat(window.initialBalances.monthly_reserve || 0);

    if (type === 'income') {
        total += amount - reserveAmount;
        income += amount;
        total_reserve += reserveAmount;
        monthly_reserve += reserveAmount; // добавляем к месячному резерву
    } else {
        total -= amount;
        expense += amount;
    }

    window.initialBalances.total = total;
    window.initialBalances.income = income;
    window.initialBalances.expense = expense;
    window.initialBalances.total_reserve = total_reserve;
    window.initialBalances.monthly_reserve = monthly_reserve;
    
    updateBalanceDisplay();
}

function updateBalancesAfterDelete(type, amount, reserveAmount = 0) {
    if (!window.initialBalances) window.initialBalances = { 
        total: 0, 
        income: 0, 
        expense: 0, 
        total_reserve: 0,
        monthly_reserve: 0 
    };
    
    let total = parseFloat(window.initialBalances.total || 0);
    let income = parseFloat(window.initialBalances.income || 0);
    let expense = parseFloat(window.initialBalances.expense || 0);
    let total_reserve = parseFloat(window.initialBalances.total_reserve || 0);
    let monthly_reserve = parseFloat(window.initialBalances.monthly_reserve || 0);

    if (type === 'income') {
        total -= amount - reserveAmount;
        income -= amount;
        total_reserve -= reserveAmount;
        monthly_reserve -= reserveAmount; // вычитаем из месячного резерва
    } else {
        total += amount;
        expense -= amount;
    }

    window.initialBalances.total = total;
    window.initialBalances.income = income;
    window.initialBalances.expense = expense;
    window.initialBalances.total_reserve = total_reserve;
    window.initialBalances.monthly_reserve = monthly_reserve;
    
    updateBalanceDisplay();
}

// -----------------------------
// Управление подсказкой "Сделай первую транзакцию"
// -----------------------------
function updateWelcomeHint() {
    const welcomeHint = document.getElementById('welcomeHint');
    const transactionsContainer = document.getElementById('transactionsListContainer');
    
    if (!welcomeHint || !transactionsContainer) return;
    
    // Проверяем, есть ли транзакции в контейнере
    const transactionItems = transactionsContainer.querySelectorAll('.transaction-item');
    const hasVisibleTransactions = Array.from(transactionItems).some(item => {
        return !item.innerHTML.includes('Удалить?') && !item.innerHTML.includes('Удалено');
    });
    
    // Показываем или скрываем подсказку
    if (hasVisibleTransactions) {
        welcomeHint.classList.add('hidden');
    } else {
        welcomeHint.classList.remove('hidden');
    }
}

// -----------------------------
// Инициализация навигации, табов и общий DOMContentLoaded
// -----------------------------
function initTabNavigation() {
    const navItems = document.querySelectorAll('.mobile-nav-item');
    const tabs = document.querySelectorAll('.mobile-tab');
    const balanceBlock = document.querySelector('.mobile-header .bg-gradient-to-r');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            navItems.forEach(n => n.classList.remove('active'));
            this.classList.add('active');
            tabs.forEach(t => t.classList.remove('active'));
            if (balanceBlock) {
                if (tabName === 'home') balanceBlock.classList.remove('hidden');
                else balanceBlock.classList.add('hidden');
            }
            const active = document.getElementById(`tab-${tabName}`);
            if (active) active.classList.add('active');
            if (tabName === 'categories') loadUserCategories();
        });
    });
}

// -----------------------------
// Загрузка категорий в модалку "Добавить запись"
// -----------------------------
async function loadCategoriesForModal() {
    const container = document.getElementById('categoriesContainer');
    if (!container) return;

    try {
        const response = await fetch('/get_categories/');
        const data = await response.json();

        container.innerHTML = '';

        if (data.categories && data.categories.length > 0) {
            data.categories.forEach(cat => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'category-carousel-btn flex flex-col items-center p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-200';
                btn.dataset.categoryId = cat.id;
                btn.innerHTML = `
                    <div class="w-10 h-10 flex items-center justify-center rounded-full mb-1"
                         style="background-color:${cat.color}22; color:${cat.color}">
                        <i class="${cat.icon}"></i>
                    </div>
                    <span class="text-xs text-gray-300 truncate w-12 text-center">${cat.name}</span>
                `;

                btn.addEventListener('click', function () {
                    document.querySelectorAll('.category-carousel-btn').forEach(b => b.classList.remove('ring-2', 'ring-blue-500'));
                    this.classList.add('ring-2', 'ring-blue-500');
                    document.getElementById('selectedCategory').value = cat.id;
                });

                container.appendChild(btn);
            });
        } else {
            container.innerHTML = `<div class="text-gray-500 text-sm text-center py-4">Нет категорий</div>`;
        }
    } catch (e) {
        console.error('Ошибка загрузки категорий для модалки:', e);
    }
}




// -----------------------------
// Загрузка категорий на главной
// -----------------------------
async function loadUserCategories() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;

    const categoryElement = document.createElement('div');
categoryElement.className = 'category-item bg-gray-800 rounded-lg p-3 flex justify-between items-center animate-popIn';


    
    try {
        // Используем новый endpoint со статистикой
        const response = await fetch('/get_categories_with_stats/');
        const data = await response.json();
        
        categoriesList.innerHTML = '';
        
        if (data.categories && data.categories.length > 0) {
            data.categories.forEach(category => {
                const categoryElement = document.createElement('div');
                categoryElement.className = 'category-item bg-gray-800 rounded-lg p-3 flex justify-between items-center';
                categoryElement.innerHTML = `
                    <div class="flex items-center space-x-3 flex-1">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: ${category.color}22; color: ${category.color}">
                            <i class="${category.icon}"></i>
                        </div>
                        <div class="flex-1">
                            <p class="font-medium">${category.name}</p>
                            <div class="flex items-center space-x-2 text-xs text-gray-400 mt-1">
                                <span>Расходы: ${formatAmount(category.expense_amount)} с</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        ${category.percentage > 0 ? `
                            <div class="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg text-sm font-semibold min-w-12 text-center">
                                ${category.percentage}%
                            </div>
                        ` : ''}
                        <button class="delete-category-btn text-gray-400 hover:text-red-500 p-2 transition-colors opacity-100 visible" data-category-id="${category.id}">
    <i class="fas fa-trash"></i>
</button>

                    </div>
                `;
                
                categoriesList.appendChild(categoryElement);
            });
            
            // Добавляем обработчики для кнопок удаления
            document.querySelectorAll('.delete-category-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const categoryId = this.dataset.categoryId;
                    deleteCategory(categoryId);
                });
            });
        } else {
            categoriesList.innerHTML = `
                <div class="text-center py-8 text-gray-500" id="emptyCategoriesState">
                    <i class="fas fa-tags text-3xl mb-3"></i>
                    <p>Категорий пока нет</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Ошибка при загрузке категорий:', error);
        categoriesList.innerHTML = `
            <div class="text-center py-8 text-red-400">
                <i class="fas fa-exclamation-triangle text-3xl mb-3"></i>
                <p>Ошибка загрузки категорий</p>
            </div>
        `;
    }
}

// =============================================
// УДАЛЕНИЕ КАТЕГОРИЙ С ИНЛАЙН-ПОДТВЕРЖДЕНИЕМ
// =============================================

async function deleteCategory(categoryId) {
    const categoryElement = document.querySelector(`.delete-category-btn[data-category-id="${categoryId}"]`)?.closest('.category-item');
    if (!categoryElement) return;
    
    // Сохраняем оригинальное содержимое для возможного восстановления
    const originalContent = categoryElement.innerHTML;
    
    // Заменяем содержимое на компактное подтверждение удаления (такого же размера)
categoryElement.classList.add('flex', 'items-center', 'justify-between', 'p-4', 'bg-gray-800', 'border', 'border-gray-700', 'rounded-xl');
categoryElement.innerHTML = `
    <div class="flex items-center space-x-2">
        <i class="fas fa-trash text-red-400"></i>
        <span class="text-gray-200 text-sm font-medium">Удалить категорию?</span>
    </div>
    <div class="flex items-center space-x-2">
        
        <button class="cancel-category-delete-btn bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all">
            Нет
        </button>

        <button class="confirm-category-delete-btn bg-red-600 hover:bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-all"
                data-category-id="${categoryId}">
            Да
        </button>
    </div>
`;



    
    // Обработчик подтверждения удаления
    const confirmBtn = categoryElement.querySelector('.confirm-category-delete-btn');
    confirmBtn.addEventListener('click', async function() {
        await processCategoryDeletion(categoryId, categoryElement);
    });
    
    // Обработчик отмены удаления - просто возвращаем исходное состояние
    const cancelBtn = categoryElement.querySelector('.cancel-category-delete-btn');
    cancelBtn.addEventListener('click', function() {
        // Просто возвращаем оригинальное содержимое без анимации
        categoryElement.innerHTML = originalContent;
        
        // Сразу переинициализируем обработчик удаления
        const deleteBtn = categoryElement.querySelector('.delete-category-btn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                deleteCategory(categoryId);
            });
        }
    });
}




// -----------------------------
// УДАЛЕНИЕ КАТЕГОРИИ (без возврата подтверждения после ошибки)
// -----------------------------
async function processCategoryDeletion(categoryId, categoryElement) {
    const originalContent = categoryElement.innerHTML;

    try {
        const response = await fetch(`/delete_category/${categoryId}/`);
        const data = await response.json();

        // 🟢 УСПЕШНОЕ УДАЛЕНИЕ
        if (data.success) {
            categoryElement.innerHTML = `
                <div class="w-full flex items-center justify-between animate-popIn">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center ring-2 ring-green-400/30 shadow-inner shadow-green-600/10">
                            <i class="fas fa-check text-green-400 text-lg"></i>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-green-400 font-semibold text-sm tracking-wide">Категория удалена!</span>
                            <span class="text-gray-400 text-xs">Данные успешно обновлены :)</span>
                        </div>
                    </div>
                    <i class="fas fa-circle-check text-green-400 text-xl opacity-80"></i>
                </div>
            `;

            // Ждём 2 секунды — показываем подтверждение
            setTimeout(() => {
                categoryElement.classList.add('animate-fade-out');
                setTimeout(() => categoryElement.remove(), 300);
            }, 1800);

            // Обновляем списки после анимации
            setTimeout(async () => {
                await updateGlobalCategories();
                await updateCategoryTabs();
                await loadUserCategories();
            }, 2200);

            return;
        }

        // 🔴 ЕСЛИ ОШИБКА (категория содержит записи)
        categoryElement.innerHTML = `
            <div class="w-full flex items-center justify-between animate-popIn">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 flex-shrink-0 rounded-full bg-red-500/15 flex items-center justify-center ring-2 ring-green-400/30 shadow-inner shadow-red-600/10">
                            <i class="fas fa-triangle-exclamation text-red-400 text-lg"></i>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-red-400 font-semibold text-sm tracking-wide">Ошибка!</span>
                            <span class="text-gray-400 text-xs">Категория содержит данные и не может быть удалена!</span>
                        </div>
                    </div>
                    <i class="fas fa-circle-check text-red-400 text-xl opacity-80"></i>
                </div>
        `;

        // Ошибка пропадает через 2 секунды, и элемент просто возвращается к нормальному виду
        setTimeout(async () => {
            // Загружаем список заново, без возврата вопроса “Удалить категорию?”
            await loadUserCategories();
        }, 2500);

        return;

    } catch (error) {
        // ⚠️ Ошибка соединения
        console.error('Ошибка удаления категории:', error);

        categoryElement.innerHTML = `
            <div class="w-full flex items-center justify-between bg-gray-800 rounded-lg p-3 animate-popIn">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-red-400"></i>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-red-400 font-semibold text-sm">Ошибка соединения</span>
                        <span class="text-gray-400 text-xs">Проверьте интернет и попробуйте снова.</span>
                    </div>
                </div>
            </div>
        `;

        // После ошибки тоже просто обновляем список — не показываем "Удалить?"
        setTimeout(async () => {
            await loadUserCategories();
        }, 2000);
    }
}



// -----------------------------
// Модалка добавления категории
// -----------------------------
function initCategoryModal() {
    const modal = document.getElementById('categoryModal');
    const openBtn = document.getElementById('addCategoryBtn');
    const saveBtn = document.getElementById('saveCategoryBtn'); // 🟢 кнопка "Сохранить"
    const closeBtns = modal ? modal.querySelectorAll('.close-modal, [data-modal="category"]') : [];

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            animateModal(modal, true);
            resetCategoryForm();

            // 🟢 При открытии модалки загружаем иконки и цвета
            initIconsGrid();
            initColorsGrid();
        });
    }

    // 🟢 Сохранение категории
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCategory);
    }

    // Кнопки закрытия
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => animateModal(modal, false));
    });

    // Закрытие по клику вне содержимого
    if (modal) {
        modal.addEventListener('click', e => {
            if (e.target === modal) animateModal(modal, false);
        });
    }
}

function resetCategoryForm() {
    const nameInput = document.getElementById('categoryNameInput');
    if (nameInput) nameInput.value = '';

    const iconGrid = document.getElementById('iconsGrid');
    const colorGrid = document.getElementById('colorsGrid');
    if (iconGrid) iconGrid.innerHTML = '';
    if (colorGrid) colorGrid.innerHTML = '';

    // 🟢 Сбрасываем активные выделения
    document.querySelectorAll('.icon-option').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('bg-gray-700', 'text-gray-300');
    });
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.remove('border-white', 'border-2');
    });
}


// -----------------------------
// СЕТКИ ИКОНОК И ЦВЕТОВ ДЛЯ МОДАЛКИ КАТЕГОРИЙ
// -----------------------------
function initIconsGrid() {
    const iconsGrid = document.getElementById('iconsGrid');
    if (!iconsGrid) return;

    const icons = [
        'fas fa-utensils', 'fas fa-home', 'fas fa-car', 'fas fa-heart',
        'fas fa-shopping-cart', 'fas fa-tv', 'fas fa-tshirt', 'fas fa-book',
        'fas fa-gift', 'fas fa-money-bill-wave', 'fas fa-chart-line', 'fas fa-building',
        'fas fa-briefcase', 'fas fa-phone', 'fas fa-wifi', 'fas fa-gas-pump'
    ];

    iconsGrid.innerHTML = '';
    icons.forEach(icon => {
        const iconBtn = document.createElement('button');
        iconBtn.type = 'button';
        iconBtn.className = 'icon-option p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-gray-300';
        iconBtn.innerHTML = `<i class="${icon} text-lg"></i>`;
        iconBtn.dataset.icon = icon;

        iconBtn.addEventListener('click', function() {
            document.querySelectorAll('.icon-option').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-700', 'text-gray-300');
            });
            this.classList.remove('bg-gray-700', 'text-gray-300');
            this.classList.add('bg-blue-600', 'text-white');
        });

        iconsGrid.appendChild(iconBtn);
    });
}

function initColorsGrid() {
    const colorsGrid = document.getElementById('colorsGrid');
    if (!colorsGrid) return;

    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#eab308',
        '#84cc16', '#22c55e', '#10b981',
        '#06b6d4', '#6366f1', '#ec4899'
    ];

    colorsGrid.innerHTML = '';
    colors.forEach(color => {
        const colorBtn = document.createElement('button');
        colorBtn.type = 'button';
        colorBtn.className = 'color-option w-8 h-8 rounded-full border-2 border-gray-600 mb-3';
        colorBtn.style.backgroundColor = color;
        colorBtn.dataset.color = color;

        colorBtn.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(btn => {
                btn.classList.remove('border-white', 'border-2');
            });
            this.classList.add('border-white', 'border-2');
        });

        colorsGrid.appendChild(colorBtn);
    });
}


async function saveCategory() {
    const nameInput = document.getElementById('categoryNameInput');
    const selectedIcon = document.querySelector('.icon-option.bg-blue-600');
    const selectedColor = document.querySelector('.color-option.border-white');

    if (!nameInput || !nameInput.value.trim()) {
        alert('Введите название категории');
        return;
    }

    if (!selectedIcon) {
        alert('Выберите иконку для категории');
        return;
    }

    if (!selectedColor) {
        alert('Выберите цвет для категории');
        return;
    }

    const formData = new FormData();
    formData.append('name', nameInput.value.trim());
    formData.append('icon', selectedIcon.dataset.icon);
    formData.append('color', selectedColor.dataset.color);

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    try {
        const response = await fetch('/add_category/', {
            method: "POST",
            headers: { 
                'X-CSRFToken': csrfToken,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formData,
        });

        const data = await response.json();

        if (data.success) {
            animateModal(document.getElementById('categoryModal'), false);
            nameInput.value = '';

            // Сбрасываем выделение иконки и цвета
            document.querySelectorAll('.icon-option').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-700', 'text-gray-300');
            });
            document.querySelectorAll('.color-option').forEach(btn => {
                btn.classList.remove('border-white', 'border-2');
            });

            // Обновляем категории в приложении
            await updateGlobalCategories();
            if (typeof updateCategoryTabs === 'function') await updateCategoryTabs();
            if (typeof loadUserCategories === 'function') await loadUserCategories();

            showSuccessNotification('Категория добавлена!');
        } else {
            alert(data.error || "Ошибка при сохранении категории");
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert("Произошла ошибка при отправке формы");
    }
}



// -----------------------------
// МОДАЛКА МЕНЮ / ПАНЕЛЬ УПРАВЛЕНИЯ
// -----------------------------
function initMenuModal() {
    const modal = document.getElementById('menuModal');
    const openBtn = document.getElementById('menuBtn'); // кнопка открытия (⚙️)
    const closeBtn = modal ? modal.querySelector('button[onclick="toggleMenuModal()"]') : null;

    if (!modal) {
        console.warn('menuModal не найден');
        return;
    }

    // Создаём глобальную функцию для совместимости с onclick в HTML
    window.toggleMenuModal = function(show) {
        if (!modal) return;

        const isVisible = !modal.classList.contains('hidden');
        if (show === true || (!isVisible && show !== false)) {
            animateModal(modal, true);
        } else {
            animateModal(modal, false);
        }
    };

    // Открытие панели (по кнопке ⚙️)
    if (openBtn) {
        openBtn.addEventListener('click', () => {
            console.log('Открытие меню');
            toggleMenuModal(true);
        });
    }

    // Кнопка "Закрыть"
    if (closeBtn) {
        closeBtn.addEventListener('click', () => toggleMenuModal(false));
    }

    // Закрытие при клике вне окна
    modal.addEventListener('click', e => {
        if (e.target === modal) toggleMenuModal(false);
    });

    // Логика сохранения процентов и цели
    const saveReserveBtn = document.getElementById('saveReserveBtn');
    const saveTargetReserveBtn = document.getElementById('saveTargetReserveBtn');

if (saveReserveBtn) {
    saveReserveBtn.addEventListener('click', async () => {
        const btn = saveReserveBtn;
        const percent = parseFloat(document.getElementById('reservePercentageInput').value);

        if (isNaN(percent) || percent < 0 || percent > 100) {
            showErrorNotification('Введите процент от 0 до 100');
            return;
        }

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
        const formData = new FormData();
        formData.append('reserve_percentage', percent);

        try {
            // Визуальное состояние «сохранения»
            btn.disabled = true;
            const oldText = btn.innerHTML;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Сохранение...`;

            const response = await fetch('/update_reserve_percentage/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                window.initialReservePercentage = percent;
                document.getElementById('currentReservePercent').textContent = `${percent}%`;
                
                // Обновляем отображение процента в блоке резерва
                const reservePercentageDisplay = document.getElementById('reservePercentageDisplay');
                if (reservePercentageDisplay) {
                    reservePercentageDisplay.textContent = percent;
                }
                
                // ОБНОВЛЯЕМ УВЕДОМЛЕНИЕ О РЕЗЕРВЕ
                updateReserveNotification();
                
                showSuccessNotification('Успешно сохранено!');
                btn.innerHTML = `<i class="fas fa-check mr-2 text-green-400"></i>Сохранено`;
                
                setTimeout(() => animateModal(document.getElementById('menuModal'), false), 1000);
            } else {
                showErrorNotification(data.error || 'Ошибка при сохранении');
                btn.innerHTML = `<i class="fas fa-exclamation-triangle mr-2 text-red-400"></i>Ошибка`;
            }
        } catch (e) {
            console.error('Ошибка при сохранении процента резерва:', e);
            showErrorNotification('Ошибка при соединении с сервером');
            btn.innerHTML = `<i class="fas fa-exclamation-triangle mr-2 text-red-400"></i>Ошибка`;
        } finally {
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = `<i class="fas fa-save mr-2"></i>Сохранить`;
            }, 2000);
        }
    });
}




// Функция для обновления видимости уведомления о резерве
function updateReserveNotification() {
    const reserveNotification = document.getElementById('reserveNotification');
    if (!reserveNotification) return;
    
    if (window.initialReservePercentage === 0) {
        reserveNotification.classList.remove('hidden');
    } else {
        reserveNotification.classList.add('hidden');
    }
}


if (saveTargetReserveBtn) {
    saveTargetReserveBtn.addEventListener('click', async () => {
        const btn = saveTargetReserveBtn;
        const target = parseFloat(document.getElementById('targetReserveInput').value);

        if (isNaN(target) || target < 0) {
            showErrorNotification('Введите корректную сумму цели');
            return;
        }

        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
        const formData = new FormData();
        formData.append('target_reserve', target);

        try {
            btn.disabled = true;
            btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>Сохранение...`;

            const response = await fetch('/update_target_reserve/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: formData,
            });

            const data = await response.json();

            if (data.success) {
                window.initialTargetReserve = target;
                
                // Обновляем отображение в меню
                const currentTargetReserveEl = document.getElementById('currentTargetReserve');
                if (currentTargetReserveEl) {
                    currentTargetReserveEl.textContent = `${formatAmount(target)} с`;
                }
                
                // ОБНОВЛЯЕМ ВСЕ ЭЛЕМЕНТЫ ЦЕЛЕВОГО РЕЗЕРВА
                updateSavingsDisplay();
                
                showSuccessNotification('Успешно сохранено!');
                btn.innerHTML = `<i class="fas fa-check mr-2 text-green-400"></i>Сохранено`;
                setTimeout(() => animateModal(document.getElementById('menuModal'), false), 1000);
            } else {
                showErrorNotification(data.error || 'Ошибка при сохранении');
                btn.innerHTML = `<i class="fas fa-exclamation-triangle mr-2 text-red-400"></i>Ошибка`;
            }
        } catch (e) {
            console.error('Ошибка при сохранении целевого резерва:', e);
            showErrorNotification('Ошибка при соединении с сервером');
            btn.innerHTML = `<i class="fas fa-exclamation-triangle mr-2 text-red-400"></i>Ошибка`;
        } finally {
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = `<i class="fas fa-save mr-2"></i>Сохранить`;
            }, 2000);
        }
    });
}
}


// -----------------------------
// Уведомления (успех / ошибка)
// -----------------------------
function showErrorNotification(message) {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        console.error('Контейнер для уведомлений не найден');
        return;
    }
    
    // Очищаем предыдущие уведомления
    notificationContainer.innerHTML = '';
    
    // Создаем уведомление с иконкой ошибки
    const notification = document.createElement('div');
    notification.className = 'notification-inline flex items-center px-3 py-1.5 rounded-lg text-sm bg-gray-800/80 backdrop-blur-sm border border-red-600/50';
    notification.innerHTML = `
        <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
        <span class="text-red-400">${message}</span>
    `;
    
    // Добавляем в контейнер
    notificationContainer.appendChild(notification);
    
    // Автоматически удаляем через 3 секунды
    setTimeout(() => {
        if (notification.parentNode === notificationContainer) {
            notification.classList.add('animate-fade-out');
            setTimeout(() => {
                if (notification.parentNode === notificationContainer) {
                    notificationContainer.removeChild(notification);
                }
            }, 300);
        }
    }, 2000);
}




// -----------------------------
// Экспортируем необходимые функции в global
// -----------------------------
window.initTransactionFilter = initTransactionFilter;
window.loadTransactions = loadTransactions;
window.updateCategoryTabsHandlers = updateCategoryTabsHandlers;
window.checkEmptyStatesAfterChange = checkEmptyStatesAfterChange;
window.updateGlobalCategories = updateGlobalCategories;
window.initTransactionModal = initTransactionModal;
window.initTabNavigation = initTabNavigation;


// -----------------------------
// Главная инициализация при загрузке
// -----------------------------
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Форматируем балансы при загрузке страницы
        updateBalanceDisplay();
        
        // Форматируем все элементы резерва при загрузке страницы
        formatAllReserveElements();
        
        // Обновляем отображение сбережений при загрузке
        updateSavingsDisplay();
        
        updateWelcomeHint();

        // Показываем приветствие при необходимости
        if (window.isNewUser) {
            setTimeout(() => { showSuccessNotification('Добро пожаловать!'); }, 800);
        }

        // Инициализируем модалки и интерфейс
        initTabNavigation();
        initTransactionModal();
        initCategoryModal();
        initMenuModal();

        // Инициализируем фильтры/загрузку транзакций
        if (typeof initTransactionFilter === 'function') initTransactionFilter();
        if (typeof updateCategoryTabsHandlers === 'function') updateCategoryTabsHandlers();

        // Загружаем категории и транзакции при старте
        updateGlobalCategories();
        updateReserveNotification();
        setTimeout(() => {
            if (document.getElementById('transactionsListContainer') && document.getElementById('transactionsListContainer').children.length === 0) {
                loadTransactions();
            }
        }, 300);
    } catch (e) {
        console.error('Initialization error', e);
    }
});