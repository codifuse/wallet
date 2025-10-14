// =============================================
// ФИЛЬТРАЦИЯ И ПАГИНАЦИЯ ТРАНЗАКЦИЙ
// =============================================

let currentFilter = 'week';
let currentPage = 1;
let hasMoreTransactions = true;
let isLoading = false;
let currentCategory = 'all';

function initTransactionFilter() {
    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterDropdown = document.getElementById('filterDropdown');
    const filterOptions = document.querySelectorAll('.filter-option');
    const loadMoreBtn = document.getElementById('loadMoreBtn');

    // Переключение выпадающего списка
    if (filterToggleBtn && filterDropdown) {
        filterToggleBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            filterDropdown.classList.toggle('hidden');
        });

        // Закрытие выпадающего списка при клике вне
        document.addEventListener('click', function() {
            filterDropdown.classList.add('hidden');
        });
    }

    // Выбор фильтра
    filterOptions.forEach(option => {
        option.addEventListener('click', function() {
            const filter = this.dataset.filter;
            currentFilter = filter;
            currentPage = 1;
            hasMoreTransactions = true;
            
            // Обновляем текст кнопки
            document.getElementById('currentFilterText').textContent = this.textContent;
            
            // Закрываем выпадающий список
            filterDropdown.classList.add('hidden');
            
            // Загружаем транзакции с новым фильтром
            loadTransactions();
        });
    });

    // Кнопка "Загрузить еще"
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreTransactions);
    }

    // Обновляем обработчики вкладок категорий чтобы учитывать фильтрацию
    updateCategoryTabsHandlers();
    
    // АВТОМАТИЧЕСКАЯ ЗАГРУЗКА ТРАНЗАКЦИЙ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
    setTimeout(() => {
        if (document.getElementById('transactionsListContainer').children.length === 0) {
            loadTransactions();
        }
    }, 500);
}

// Обновляем обработчики вкладок
function updateCategoryTabsHandlers() {
    const tabs = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Убираем активный класс у всех вкладок
            tabs.forEach(t => t.classList.remove('active'));
            // Добавляем активный класс текущей вкладке
            this.classList.add('active');
            
            const categoryId = this.dataset.category;
            currentCategory = categoryId; // Обновляем текущую категорию
            currentPage = 1; // Сбрасываем пагинацию
            hasMoreTransactions = true;
            
            // Загружаем транзакции для выбранной категории
            loadTransactions();
        });
    });
}


// Загрузка транзакций с учетом категории
async function loadTransactions() {
    if (isLoading) return;
    
    isLoading = true;
    const transactionsContainer = document.getElementById('transactionsListContainer');
    const loadMoreContainer = document.getElementById('loadMoreContainer');
    
    // Показываем индикатор загрузки
    if (currentPage === 1) {
        transactionsContainer.innerHTML = `
            <div class="text-center py-4">
                <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                <p class="text-gray-400 text-sm mt-2">Загрузка...</p>
            </div>
        `;
    }

    try {
        const response = await fetch(`/get_transactions/?filter=${currentFilter}&page=${currentPage}&limit=3&category=${currentCategory}`);
        const data = await response.json();
        
        if (data.success) {
            // Очищаем контейнер при первой загрузке
            if (currentPage === 1) {
                transactionsContainer.innerHTML = '';
            }
            
            // Добавляем транзакции
            if (data.transactions && data.transactions.length > 0) {
                data.transactions.forEach(transaction => {
                    addTransactionToList(transaction, false);
                });
                
                // Показываем/скрываем кнопку "Загрузить еще"
                hasMoreTransactions = data.has_more;
                if (loadMoreContainer) {
                    loadMoreContainer.classList.toggle('hidden', !hasMoreTransactions);
                }
                
                // Скрываем пустые состояния
                hideEmptyStates();
            } else {
                // Показываем пустое состояние если нет транзакций
                if (currentPage === 1) {
                    showEmptyState();
                    // ДОБАВЛЕНО: Убедимся что кнопка "Загрузить еще" скрыта
                    if (loadMoreContainer) {
                        loadMoreContainer.classList.add('hidden');
                    }
                } else {
                    // Если это не первая страница и нет транзакций, просто скрываем кнопку
                    if (loadMoreContainer) {
                        loadMoreContainer.classList.add('hidden');
                    }
                }
            }
            
            // Обновляем счетчик страниц
            if (hasMoreTransactions) {
                currentPage++;
            }
        }
    } catch (error) {
        console.error('Ошибка при загрузке транзакций:', error);
        if (currentPage === 1) {
            transactionsContainer.innerHTML = `
                <div class="text-center py-8 text-red-400">
                    <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                    <p>Ошибка загрузки</p>
                </div>
            `;
        }
    } finally {
        isLoading = false;
    }


}



// Добавьте эту функцию в history_sort.js
function checkEmptyStatesAfterChange() {
    const transactionsContainer = document.getElementById('transactionsListContainer');
    if (!transactionsContainer) return;
    
    // Считаем только реальные элементы транзакций (исключая сообщения об удалении и т.д.)
    const transactionItems = transactionsContainer.querySelectorAll('.transaction-item');
    const visibleTransactions = Array.from(transactionItems).filter(item => {
        return !item.innerHTML.includes('Удалить?') && !item.innerHTML.includes('Удалено');
    });
    
    if (visibleTransactions.length === 0) {
        showEmptyState();
    } else {
        hideEmptyStates();
    }
}


// Загрузка дополнительных транзакций
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

// Обновленная функция добавления транзакции в список
function addTransactionToList(transaction, prepend = false) {
    const transactionsContainer = document.getElementById('transactionsListContainer');
    if (!transactionsContainer) return;
    
    // Форматируем дату
    const transactionDate = new Date(transaction.created_at);
    const formattedDate = transactionDate.toLocaleDateString('ru-RU');
    const formattedTime = transactionDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
    
    // Создаем HTML для транзакции
    const transactionHTML = `
        <div class="transaction-item bg-gray-800 rounded-lg p-3 flex justify-between items-center" 
             data-category-id="${transaction.category_id}"
             data-transaction-id="${transaction.id}">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full flex items-center justify-center" 
                     style="background-color: ${transaction.category_color}22; color: ${transaction.category_color}">
                    <i class="${transaction.category_icon}"></i>
                </div>
                <div>
                    <p class="font-medium">${transaction.category_name}</p>
                    ${transaction.description ? `<p class="text-xs text-gray-400">${transaction.description}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-3">
                <div class="text-right">
                    <p class="${transaction.type === 'income' ? 'text-green-400' : 'text-red-400'} font-semibold">
                        ${transaction.type === 'income' ? '+' : '-'}${formatAmount(transaction.amount)} с
                    </p>
                    <p class="text-xs text-gray-400">${formattedDate} ${formattedTime}</p>
                </div>
                <button class="delete-transaction-btn text-red-400 hover:text-red-300 p-2 transition-colors" 
                        data-transaction-id="${transaction.id}"
                        title="Удалить транзакцию">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
        </div>
    `;
    
    // Добавляем транзакцию в начало или конец списка
    if (prepend) {
        transactionsContainer.insertAdjacentHTML('afterbegin', transactionHTML);
    } else {
        transactionsContainer.insertAdjacentHTML('beforeend', transactionHTML);
    }
}

// Функции для управления пустыми состояниями
function hideEmptyStates() {
    const emptyStateAll = document.getElementById('emptyStateAll');
    const emptyStateFiltered = document.getElementById('emptyStateFiltered');
    
    if (emptyStateAll) emptyStateAll.classList.add('hidden');
    if (emptyStateFiltered) emptyStateFiltered.classList.add('hidden');
}

function showEmptyState() {
    const emptyStateAll = document.getElementById('emptyStateAll');
    const emptyStateFiltered = document.getElementById('emptyStateFiltered');

    // Сначала всё скрываем
    if (emptyStateAll) emptyStateAll.classList.add('hidden');
    if (emptyStateFiltered) emptyStateFiltered.classList.add('hidden');

    // Проверяем, какая категория активна
    if (currentCategory === 'all') {
        if (emptyStateAll) emptyStateAll.classList.remove('hidden');
    } else {
        if (emptyStateFiltered) emptyStateFiltered.classList.remove('hidden');
    }
}


// Обновляем функцию после добавления транзакции
function updateInterfaceAfterTransaction(data) {
    // 1. Обновляем балансы
    updateBalancesAfterTransaction(data.transaction_type, data.amount);
    
    // 2. Если активна категория "Все" или категория новой транзакции, добавляем ее
    if (currentCategory === 'all' || currentCategory == data.transaction.category_id) {
        addTransactionToList(data.transaction, true);
        
        // 3. Скрываем пустые состояния
        hideEmptyStates();
        
        // 4. Показываем кнопку "Загрузить еще" если она была скрыта
        const loadMoreContainer = document.getElementById('loadMoreContainer');
        if (loadMoreContainer && loadMoreContainer.classList.contains('hidden')) {
            loadMoreContainer.classList.remove('hidden');
        }
    }
}

// Делаем функции глобально доступными для app.js
window.initTransactionFilter = initTransactionFilter;
window.loadTransactions = loadTransactions;
window.updateCategoryTabsHandlers = updateCategoryTabsHandlers;
// Добавьте в конец history_sort.js
window.checkEmptyStatesAfterChange = checkEmptyStatesAfterChange;