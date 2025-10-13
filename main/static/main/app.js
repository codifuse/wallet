// =============================================
// АНИМАЦИЯ ЛОГОТИПА
// =============================================

function initLogoAnimation() {
    setTimeout(function() {
        const logo1 = document.getElementById('logo1');
        const logo2 = document.getElementById('logo2');
        
        if (logo1 && logo2) {
            logo1.classList.add('opacity-0', 'blur-md');
            setTimeout(() => {
                logo2.classList.remove('opacity-0', 'blur-md');
            }, 350);
        }
    }, 1500);
}

// =============================================
// УПРАВЛЕНИЕ МОДАЛЬНЫМИ ОКНАМИ
// =============================================

function toggleModal(modalId, show = true) {
    const modal = document.getElementById(modalId);
    if (modal) {
        if (show) {
            modal.classList.remove('hidden');
        } else {
            modal.classList.add('hidden');
        }
    }
}

// =============================================
// МОДАЛКА ПАНЕЛИ УПРАВЛЕНИЯ (МЕНЮ)
// =============================================

document.addEventListener("DOMContentLoaded", () => {
    const menuModal = document.getElementById("menuModal");
    const menuBtn = document.getElementById("menuToggleBtn");
    
    // Открытие модалки меню
    if (menuBtn && menuModal) {
        menuBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleModal('menuModal', true);
        });
    }
    
    // Закрытие модалки меню при клике на кнопку "Закрыть"
    const closeMenuBtn = document.querySelector('#menuModal button[onclick*="toggleMenuModal"]');
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleModal('menuModal', false);
        });
    }
    
    // Закрытие модалки меню при клике вне окна
    if (menuModal) {
        menuModal.addEventListener('click', (e) => {
            if (e.target === menuModal) {
                toggleModal('menuModal', false);
            }
        });
    }
});

function toggleMenuModal() {
    const menuModal = document.getElementById("menuModal");
    if (menuModal) {
        if (menuModal.classList.contains('hidden')) {
            menuModal.classList.remove('hidden');
        } else {
            menuModal.classList.add('hidden');
        }
    }
}

// =============================================
// ОСНОВНАЯ ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
// =============================================

document.addEventListener("DOMContentLoaded", function() {
    initLogoAnimation();
    initTransactionModal();
    updateBalanceDisplay();
    initCategoryTabs();
    initTabNavigation();
    initCategoriesTab();
    initTransactionDeletion();
    initCategoryDeletion();
    checkEmptyStates();
    
    // Форматируем все суммы на странице
    formatAllAmounts();
    
    // Загружаем актуальные категории при загрузке страницы
    updateGlobalCategories();
});

// =============================================
// ОБНОВЛЕНИЕ БАЛАНСА
// =============================================

function updateBalanceDisplay() {
    if (!window.initialBalances) return;
    
    const totalElement = document.getElementById('totalBalance');
    const incomeElement = document.getElementById('monthIncome');
    const expenseElement = document.getElementById('monthExpense');
    
    if (totalElement) totalElement.textContent = window.initialBalances.total + ' с';
    if (incomeElement) incomeElement.textContent = window.initialBalances.income + ' с';
    if (expenseElement) expenseElement.textContent = window.initialBalances.expense + ' с';
}

// =============================================
// МОДАЛКА ДОБАВЛЕНИЯ ТРАНЗАКЦИИ
// =============================================

// =============================================
// МОДАЛКА ДОБАВЛЕНИЯ ТРАНЗАКЦИИ
// =============================================

function initTransactionModal() {
    const modal = document.getElementById("transactionModal");
    const openBtn = document.getElementById("openTransactionModalBtn");
    const closeBtn = document.getElementById("closeTransactionModalBtn");
    const form = document.getElementById("transactionForm");
    
    if (!modal || !openBtn) {
        console.error('Не найдены элементы модального окна транзакции');
        return;
    }

    // Открытие модалки
    openBtn.addEventListener("click", async function() {
        console.log('Открытие модалки транзакции');
        modal.classList.remove("hidden");
        resetTransactionForm();
        
        // ВСЕГДА ОБНОВЛЯЕМ КАТЕГОРИИ ПРИ ОТКРЫТИИ МОДАЛКИ (НА СЛУЧАЙ ИЗМЕНЕНИЙ)
        await updateGlobalCategories();
        loadCategories();
    });

    // Закрытие модалки
    if (closeBtn) {
        closeBtn.addEventListener("click", function() {
            modal.classList.add("hidden");
        });
    }

    // Закрытие по клику вне окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.classList.add("hidden");
        }
    });

    // Инициализация кнопок типа операции
    initTypeButtons();
    
    // Инициализация цифровой клавиатуры
    initKeypad();
    
    // Инициализация отправки формы
    initFormSubmission();
}

function initFormSubmission() {
    const form = document.getElementById("transactionForm");
    const modal = document.getElementById("transactionModal");
    
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Получаем выбранный тип операции
        const activeTypeBtn = document.querySelector('.type-btn.bg-red-600, .type-btn.bg-green-600');
        if (!activeTypeBtn) {
            alert('Выберите тип операции (Расход/Доход)');
            return;
        }
        const transactionType = activeTypeBtn.dataset.type;
        
        // Проверяем сумму (убираем пробелы перед проверкой)
        const amountValue = document.getElementById('amountInput').value.replace(/\s/g, '');
        if (!amountValue || parseFloat(amountValue) <= 0 || amountValue === '0') {
            alert('Введите корректную сумму');
            return;
        }
        
        // Проверяем категорию
        const selectedCategory = document.getElementById('selectedCategory').value;
        if (!selectedCategory) {
            alert('Выберите категорию');
            return;
        }
        
        // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Убедимся, что категория все еще существует
        const categoryExists = window.categories && window.categories.some(cat => cat.id == selectedCategory);
        if (!categoryExists) {
            alert('Выбранная категория больше не существует. Пожалуйста, выберите другую категорию.');
            // Обновляем список категорий в модалке
            await updateGlobalCategories();
            loadCategories();
            return;
        }
        
        const formData = new FormData();
        formData.append('type', transactionType);
        formData.append('amount', amountValue);
        formData.append('category', selectedCategory);
        formData.append('description', document.getElementById('descriptionInput').value);
        
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        try {
            console.log('Отправка данных транзакции...');
            const response = await fetch(window.ADD_TRANSACTION_URL, {
                method: "POST",
                headers: { 
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData,
            });

            const data = await response.json();
            
            if (data.success) {
                modal.classList.add('hidden');
                console.log('Транзакция успешно добавлена');
                
                // ДИНАМИЧЕСКОЕ ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
                await updateInterfaceAfterTransaction(data);
                
                showSuccessNotification('Транзакция успешно добавлена');
            } else {
                alert(data.error || "Ошибка при сохранении");
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert("Произошла ошибка при отправке формы");
        }
    });
}

// Функция для обновления интерфейса после добавления транзакции
async function updateInterfaceAfterTransaction(data) {
    // 1. Обновляем балансы
    updateBalancesAfterTransaction(data.transaction_type, data.amount);
    
    // 2. Добавляем новую транзакцию в список
    addTransactionToList(data.transaction);
    
    // 3. Обновляем статистику (если нужно)
    await updateStatistics();
    
    // 4. Проверяем пустые состояния
    checkEmptyStates();
}

// Функция для обновления балансов после добавления транзакции
function updateBalancesAfterTransaction(type, amount) {
    const totalElement = document.getElementById('totalBalance');
    const incomeElement = document.getElementById('monthIncome');
    const expenseElement = document.getElementById('monthExpense');
    
    if (!totalElement || !incomeElement || !expenseElement) return;
    
    // Получаем текущие значения (убираем форматирование и текст "с")
    const currentTotal = parseFloat(totalElement.textContent.replace(/\s/g, '').replace('с', ''));
    const currentIncome = parseFloat(incomeElement.textContent.replace(/\s/g, '').replace('с', ''));
    const currentExpense = parseFloat(expenseElement.textContent.replace(/\s/g, '').replace('с', ''));
    
    let newTotal = currentTotal;
    let newIncome = currentIncome;
    let newExpense = currentExpense;
    
    if (type === 'income') {
        // Добавляем доход: увеличиваем общий баланс и доходы
        newTotal = currentTotal + parseFloat(amount);
        newIncome = currentIncome + parseFloat(amount);
    } else {
        // Добавляем расход: уменьшаем общий баланс и увеличиваем расходы
        newTotal = currentTotal - parseFloat(amount);
        newExpense = currentExpense + parseFloat(amount);
    }
    
    // Обновляем отображение
    totalElement.textContent = formatAmount(newTotal) + ' с';
    incomeElement.textContent = formatAmount(newIncome) + ' с';
    expenseElement.textContent = formatAmount(newExpense) + ' с';
    
    // Обновляем глобальные переменные
    if (window.initialBalances) {
        window.initialBalances.total = newTotal;
        window.initialBalances.income = newIncome;
        window.initialBalances.expense = newExpense;
    }
}

// Функция для добавления транзакции в список
function addTransactionToList(transaction) {
    const transactionsContainer = document.getElementById('transactionsListContainer');
    if (!transactionsContainer) return;
    
    // Скрываем пустое состояние если оно отображается
    const emptyStateAll = document.getElementById('emptyStateAll');
    if (emptyStateAll && emptyStateAll.style.display !== 'none') {
        emptyStateAll.style.display = 'none';
    }
    
    // Создаем HTML для новой транзакции
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
                    <p class="text-xs text-gray-400">${new Date(transaction.created_at).toLocaleDateString('ru-RU')} ${new Date(transaction.created_at).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})}</p>
                </div>
                <button class="delete-transaction-btn text-red-400 hover:text-red-300 p-2 transition-colors" 
                        data-transaction-id="${transaction.id}"
                        title="Удалить транзакцию">
                    <i class="fas fa-trash text-sm"></i>
                </button>
            </div>
        </div>
    `;
    
    // Добавляем транзакцию в начало списка
    if (transactionsContainer.children.length > 0 && !transactionsContainer.children[0].classList.contains('transaction-item')) {
        // Если первый элемент - пустое состояние, заменяем его
        transactionsContainer.innerHTML = transactionHTML + transactionsContainer.innerHTML;
    } else {
        // Добавляем в начало
        transactionsContainer.insertAdjacentHTML('afterbegin', transactionHTML);
    }
}

// Функция для обновления статистики (заглушка - нужно реализовать в зависимости от вашего бэкенда)
async function updateStatistics() {
    // Здесь можно добавить запрос к бэкенду для обновления статистики
    // или обновить локально, если данные доступны
    console.log('Обновление статистики...');
}

// Обновите также функцию formatAmount для корректной работы
function formatAmount(amount) {
    // Преобразуем в число, округляем до целого, форматируем с разделителями тысяч
    const number = typeof amount === 'string' ? parseFloat(amount) : amount;
    const rounded = Math.round(number);
    
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}
function initTypeButtons() {
    const typeButtons = document.querySelectorAll('.type-btn');
    
    typeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.dataset.type;
            
            console.log('Выбран тип операции:', type);
            
            // Сбрасываем стили всех кнопок
            typeButtons.forEach(btn => {
                btn.classList.remove('bg-red-600', 'bg-green-600', 'text-white', 'border-red-600', 'border-green-600');
                btn.classList.add('bg-gray-700', 'text-gray-300', 'border-gray-600');
            });
            
            // Устанавливаем стили для активной кнопки
            if (type === 'expense') {
                this.classList.remove('bg-gray-700', 'text-gray-300', 'border-gray-600');
                this.classList.add('bg-red-600', 'text-white', 'border-red-600');
            } else {
                this.classList.remove('bg-gray-700', 'text-gray-300', 'border-gray-600');
                this.classList.add('bg-green-600', 'text-white', 'border-green-600');
            }
        });
    });
}

function initKeypad() {
    const amountInput = document.getElementById('amountInput');
    const keypadButtons = document.querySelectorAll('.keypad-btn');
    
    if (!amountInput) return;
    
    // Функция для форматирования вводимой суммы
    function formatInputAmount(value) {
        // Убираем все нецифровые символы кроме точки
        const cleanValue = value.replace(/[^\d]/g, '');
        if (!cleanValue) return '0';
        
        // Форматируем с разделителями тысяч
        return formatAmount(cleanValue);
    }
    
    keypadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const value = this.textContent.trim();
            const currentValue = amountInput.value.replace(/[^\d]/g, '');
            
            if (this.querySelector('i.fa-backspace')) {
                // Удаление последнего символа
                const newValue = currentValue.slice(0, -1) || '0';
                amountInput.value = formatInputAmount(newValue);
            } else if (value === '00') {
                // Добавление 00
                const newValue = currentValue === '0' ? '0' : currentValue + '00';
                amountInput.value = formatInputAmount(newValue);
            } else {
                // Добавление цифры
                let newValue;
                if (currentValue === '0') {
                    newValue = value;
                } else {
                    newValue = currentValue + value;
                }
                amountInput.value = formatInputAmount(newValue);
            }
        });
    });
    
    // Обработчик для ручного ввода
    amountInput.addEventListener('input', function() {
        this.value = formatInputAmount(this.value);
    });
}


function initFormSubmission() {
    const form = document.getElementById("transactionForm");
    const modal = document.getElementById("transactionModal");
    
    if (!form) return;
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Получаем выбранный тип операции
        const activeTypeBtn = document.querySelector('.type-btn.bg-red-600, .type-btn.bg-green-600');
        if (!activeTypeBtn) {
            alert('Выберите тип операции (Расход/Доход)');
            return;
        }
        const transactionType = activeTypeBtn.dataset.type;
        
        // Проверяем сумму (убираем пробелы перед проверкой)
        const amountValue = document.getElementById('amountInput').value.replace(/\s/g, '');
        if (!amountValue || parseFloat(amountValue) <= 0 || amountValue === '0') {
            alert('Введите корректную сумму');
            return;
        }
        
        // Проверяем категорию
        const selectedCategory = document.getElementById('selectedCategory').value;
        if (!selectedCategory) {
            alert('Выберите категорию');
            return;
        }
        
        // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: Убедимся, что категория все еще существует
        const categoryExists = window.categories && window.categories.some(cat => cat.id == selectedCategory);
        if (!categoryExists) {
            alert('Выбранная категория больше не существует. Пожалуйста, выберите другую категорию.');
            // Обновляем список категорий в модалке
            await updateGlobalCategories();
            loadCategories();
            return;
        }
        
        const formData = new FormData();
        formData.append('type', transactionType);
        formData.append('amount', amountValue);
        formData.append('category', selectedCategory);
        formData.append('description', document.getElementById('descriptionInput').value);
        
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        try {
            console.log('Отправка данных транзакции...');
            const response = await fetch(window.ADD_TRANSACTION_URL, {
                method: "POST",
                headers: { 
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: formData,
            });

            const data = await response.json();
            
            if (data.success) {
                modal.classList.add('hidden');
                console.log('Транзакция успешно добавлена');
                
                // ДИНАМИЧЕСКОЕ ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
                await updateInterfaceAfterTransaction(data);
                
                showSuccessNotification('Транзакция успешно добавлена');
            } else {
                alert(data.error || "Ошибка при сохранении");
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert("Произошла ошибка при отправке формы");
        }
    });
}

// Функция для обновления интерфейса после добавления транзакции
async function updateInterfaceAfterTransaction(data) {
    // 1. Обновляем балансы
    updateBalancesAfterTransaction(data.transaction_type, data.amount);
    
    // 2. Добавляем новую транзакцию в список
    addTransactionToList(data.transaction);
    
    // 3. Проверяем пустые состояния
    checkEmptyStates();
}

// Функция для обновления балансов после добавления транзакции
function updateBalancesAfterTransaction(type, amount) {
    const totalElement = document.getElementById('totalBalance');
    const incomeElement = document.getElementById('monthIncome');
    const expenseElement = document.getElementById('monthExpense');
    
    if (!totalElement || !incomeElement || !expenseElement) return;
    
    // Получаем текущие значения (убираем форматирование и текст "с")
    const currentTotal = parseFloat(totalElement.textContent.replace(/\s/g, '').replace('с', ''));
    const currentIncome = parseFloat(incomeElement.textContent.replace(/\s/g, '').replace('с', ''));
    const currentExpense = parseFloat(expenseElement.textContent.replace(/\s/g, '').replace('с', ''));
    
    let newTotal = currentTotal;
    let newIncome = currentIncome;
    let newExpense = currentExpense;
    
    if (type === 'income') {
        // Добавляем доход: увеличиваем общий баланс и доходы
        newTotal = currentTotal + parseFloat(amount);
        newIncome = currentIncome + parseFloat(amount);
    } else {
        // Добавляем расход: уменьшаем общий баланс и увеличиваем расходы
        newTotal = currentTotal - parseFloat(amount);
        newExpense = currentExpense + parseFloat(amount);
    }
    
    // Обновляем отображение
    totalElement.textContent = formatAmount(newTotal) + ' с';
    incomeElement.textContent = formatAmount(newIncome) + ' с';
    expenseElement.textContent = formatAmount(newExpense) + ' с';
    
    // Обновляем глобальные переменные
    if (window.initialBalances) {
        window.initialBalances.total = newTotal;
        window.initialBalances.income = newIncome;
        window.initialBalances.expense = newExpense;
    }
}

// Функция для добавления транзакции в список
function addTransactionToList(transaction) {
    const transactionsContainer = document.getElementById('transactionsListContainer');
    if (!transactionsContainer) return;
    
    // Скрываем пустое состояние если оно отображается
    const emptyStateAll = document.getElementById('emptyStateAll');
    if (emptyStateAll && emptyStateAll.style.display !== 'none') {
        emptyStateAll.style.display = 'none';
    }
    
    // Форматируем дату
    const transactionDate = new Date(transaction.created_at);
    const formattedDate = transactionDate.toLocaleDateString('ru-RU');
    const formattedTime = transactionDate.toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});
    
    // Создаем HTML для новой транзакции
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
    
    // Добавляем транзакцию в начало списка
    if (transactionsContainer.children.length > 0 && !transactionsContainer.children[0].classList.contains('transaction-item')) {
        // Если первый элемент - пустое состояние, заменяем его
        transactionsContainer.innerHTML = transactionHTML + transactionsContainer.innerHTML;
    } else {
        // Добавляем в начало
        transactionsContainer.insertAdjacentHTML('afterbegin', transactionHTML);
    }
}

function resetTransactionForm() {
    const form = document.getElementById("transactionForm");
    const amountInput = document.getElementById("amountInput");
    const selectedCategoryInput = document.getElementById("selectedCategory");
    
    if (form) form.reset();
    
    // Сброс выбранной категории
    if (selectedCategoryInput) selectedCategoryInput.value = '';
    
    // Сброс выделения категорий
    document.querySelectorAll('.category-option-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'border-blue-500', 'text-white');
        btn.classList.add('bg-gray-700', 'border-gray-600', 'text-gray-300');
    });
    
    // Установка расхода как типа по умолчанию
    const expenseBtn = document.querySelector('.type-btn[data-type="expense"]');
    const incomeBtn = document.querySelector('.type-btn[data-type="income"]');
    
    if (expenseBtn && incomeBtn) {
        // Сброс всех кнопок
        expenseBtn.classList.remove('bg-red-600', 'text-white', 'border-red-600');
        incomeBtn.classList.remove('bg-green-600', 'text-white', 'border-green-600');
        
        // Установка расхода как активного
        expenseBtn.classList.add('bg-red-600', 'text-white', 'border-red-600');
        incomeBtn.classList.add('bg-gray-700', 'text-gray-300', 'border-gray-600');
    }
    
    if (amountInput) amountInput.value = '0';
}



function loadCategories() {
    const categoriesContainer = document.getElementById('categoriesContainer');
    if (!categoriesContainer) {
        console.error('Не найден контейнер категорий');
        return;
    }
    
    categoriesContainer.innerHTML = '';
    
    // Используем глобальные категории, которые мы обновляем
    if (!window.categories || window.categories.length === 0) {
        categoriesContainer.innerHTML = '<div class="text-center text-gray-500 py-4 col-span-3">Нет категорий</div>';
        return;
    }
    
    console.log('Загрузка категорий для модалки:', window.categories);
    
    window.categories.forEach(cat => {
        const categoryButton = document.createElement('button');
        categoryButton.type = 'button';
        categoryButton.className = 'category-carousel-btn';
        categoryButton.textContent = cat.name;
        categoryButton.dataset.categoryId = cat.id;
        
        categoryButton.addEventListener('click', function() {
            // Сбрасываем выделение у всех кнопок
            document.querySelectorAll('.category-carousel-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Выделяем выбранную
            this.classList.add('active');
            
            const selectedCategoryInput = document.getElementById('selectedCategory');
            if (selectedCategoryInput) {
                selectedCategoryInput.value = this.dataset.categoryId;
                console.log('Выбрана категория:', this.dataset.categoryId, this.textContent);
            }
        });
        
        categoriesContainer.appendChild(categoryButton);
    });
    
}

// =============================================
// ФИЛЬТРАЦИЯ ТРАНЗАКЦИЙ ПО КАТЕГОРИЯМ
// =============================================

function initCategoryTabs() {
    const tabs = document.querySelectorAll('.tab');
    const emptyStateAll = document.getElementById('emptyStateAll');
    const emptyStateFiltered = document.getElementById('emptyStateFiltered');
    
    // Скрываем оба состояния при загрузке
    if (emptyStateAll) emptyStateAll.style.display = 'none';
    if (emptyStateFiltered) emptyStateFiltered.style.display = 'none';
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Убираем активный класс у всех вкладок
            tabs.forEach(t => t.classList.remove('active'));
            // Добавляем активный класс текущей вкладке
            this.classList.add('active');
            
            const categoryId = this.dataset.category;
            
            // Получаем ВСЕ транзакции (даже те, что могут быть скрыты)
            const allTransactionItems = document.querySelectorAll('.transaction-item');
            let visibleCount = 0;
            
            // Показываем/скрываем транзакции в зависимости от выбранной категории
            allTransactionItems.forEach(item => {
                if (categoryId === 'all') {
                    item.style.display = 'flex';
                    visibleCount++;
                } else {
                    const itemCategory = item.dataset.categoryId;
                    if (itemCategory === categoryId) {
                        item.style.display = 'flex';
                        visibleCount++;
                    } else {
                        item.style.display = 'none';
                    }
                }
            });
            
            console.log(`Категория: ${categoryId}, Видимых транзакций: ${visibleCount}`);
            
            // Управляем отображением пустых состояний
            updateEmptyStates(categoryId, visibleCount);
        });
    });
    
    // Функция для обновления пустых состояний
    function updateEmptyStates(activeCategory, visibleCount) {
        if (activeCategory === 'all') {
            // Для вкладки "Все"
            if (emptyStateAll) {
                emptyStateAll.style.display = visibleCount === 0 ? 'block' : 'none';
            }
            if (emptyStateFiltered) {
                emptyStateFiltered.style.display = 'none';
            }
        } else {
            // Для конкретной категории
            if (emptyStateAll) {
                emptyStateAll.style.display = 'none';
            }
            if (emptyStateFiltered) {
                emptyStateFiltered.style.display = visibleCount === 0 ? 'block' : 'none';
            }
        }
        
        console.log(`Empty states - All: ${emptyStateAll?.style.display}, Filtered: ${emptyStateFiltered?.style.display}`);
    }
    
    // Инициализируем начальное состояние при загрузке
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        const activeCategory = activeTab.dataset.category;
        const allTransactionItems = document.querySelectorAll('.transaction-item');
        
        let initialVisibleCount = 0;
        if (activeCategory === 'all') {
            initialVisibleCount = allTransactionItems.length;
        } else {
            initialVisibleCount = Array.from(allTransactionItems).filter(
                item => item.dataset.categoryId === activeCategory
            ).length;
        }
        
        updateEmptyStates(activeCategory, initialVisibleCount);
    }
}



// =============================================
// УПРАВЛЕНИЕ КАТЕГОРИЯМИ
// =============================================

function initCategoriesTab() {
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const categoryModal = document.getElementById('categoryModal');
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');
    const closeCategoryModalBtns = document.querySelectorAll('.close-modal[data-modal="category"]');
    
    // Открытие модалки добавления категории
    if (addCategoryBtn && categoryModal) {
        addCategoryBtn.addEventListener('click', function() {
            categoryModal.classList.remove('hidden');
            initIconsGrid();
            initColorsGrid();
        });
    }
    
    // Закрытие модалки категории
    closeCategoryModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            categoryModal.classList.add('hidden');
        });
    });
    
    // Сохранение категории
    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', saveCategory);
    }
    
    // Загрузка категорий при загрузке страницы
    loadUserCategories();
}

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
        '#84cc16', '#22c55e', '#10b981', '#14b8a6',
        '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
        '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
    ];
    
    colorsGrid.innerHTML = '';
    
    colors.forEach(color => {
        const colorBtn = document.createElement('button');
        colorBtn.type = 'button';
        colorBtn.className = 'color-option w-8 h-8 rounded-full border-2 border-gray-600';
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
            document.getElementById('categoryModal').classList.add('hidden');
            nameInput.value = '';
            
            // Сбрасываем выделение иконки и цвета
            document.querySelectorAll('.icon-option').forEach(btn => {
                btn.classList.remove('bg-blue-600', 'text-white');
                btn.classList.add('bg-gray-700', 'text-gray-300');
            });
            document.querySelectorAll('.color-option').forEach(btn => {
                btn.classList.remove('border-white', 'border-2');
            });
            
            // ОБНОВЛЯЕМ ВСЕ СПИСКИ КАТЕГОРИЙ
            await loadUserCategories(); // для вкладки категорий
            await updateGlobalCategories(); // для главной страницы и модалки транзакций
            await updateCategoryTabs(); // для вкладок на главной
            
            showSuccessNotification('Категория успешно добавлена');
        } else {
            alert(data.error || "Ошибка при сохранении категории");
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert("Произошла ошибка при отправке формы");
    }
}

async function loadUserCategories() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;
    
    try {
        const response = await fetch('/get_categories/');
        const data = await response.json();
        
        categoriesList.innerHTML = '';
        
        if (data.categories && data.categories.length > 0) {
            data.categories.forEach(category => {
                const categoryElement = document.createElement('div');
                categoryElement.className = 'category-item bg-gray-800 rounded-lg p-3 flex justify-between items-center';
                categoryElement.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: ${category.color}22; color: ${category.color}">
                            <i class="${category.icon}"></i>
                        </div>
                        <div>
                            <p class="font-medium">${category.name}</p>
                        </div>
                    </div>
                    <button class="delete-category-btn text-red-400 hover:text-red-300 p-2" data-category-id="${category.id}">
                        <i class="fas fa-trash"></i>
                    </button>
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
    categoryElement.innerHTML = `
        <div class="w-full flex items-center justify-between bg-gray-800 rounded-lg p-3">
            <div class="flex items-center space-x-3">
                <div class="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <i class="fas fa-question-circle text-yellow-400"></i>
                </div>
                <span class="text-gray-200 font-medium">Удалить категорию?</span>
            </div>
            <div class="flex items-center space-x-2">
                <button class="confirm-category-delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg font-medium transition-colors" 
                        data-category-id="${categoryId}">
                    Да
                </button>
                <button class="cancel-category-delete-btn bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg font-medium transition-colors">
                    Нет
                </button>
            </div>
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

// Функция для выполнения удаления категории
async function processCategoryDeletion(categoryId, categoryElement) {
    try {
        const response = await fetch(`/delete_category/${categoryId}/`);
        const data = await response.json();
        
        if (data.success) {
            // Показываем сообщение об успешном удалении (такого же размера)
            categoryElement.innerHTML = `
                <div class="w-full flex items-center justify-between bg-gray-800 rounded-lg p-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <i class="fas fa-check-circle text-green-400"></i>
                        </div>
                        <span class="text-green-400 font-medium">Удалено</span>
                    </div>
                </div>
            `;
            
            // Удаляем элемент через 1.5 секунды
            setTimeout(() => {
                categoryElement.remove();
          
                
                // Проверяем, не пустой ли список категорий
                const categoriesList = document.getElementById('categoriesList');
                if (categoriesList && categoriesList.children.length === 0) {
                    categoriesList.innerHTML = `
                        <div class="text-center py-8 text-gray-500" id="emptyCategoriesState">
                            <i class="fas fa-tags text-3xl mb-3"></i>
                            <p>Категорий пока нет</p>
                        </div>
                    `;
                }
            }, 1500);
            
            // Обновляем глобальные списки категорий
            await updateGlobalCategories();
            await updateCategoryTabs();
        } else {
            // В случае ошибки показываем сообщение и восстанавливаем элемент
            categoryElement.innerHTML = `
                <div class="w-full flex items-center justify-between bg-gray-800 rounded-lg p-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <i class="fas fa-exclamation-circle text-red-400"></i>
                        </div>
                        <span class="text-red-400 font-medium">Ошибка</span>
                    </div>
                </div>
            `;
            
            setTimeout(() => {
                categoryElement.innerHTML = originalContent;
                
                // Переинициализируем обработчик удаления
                const deleteBtn = categoryElement.querySelector('.delete-category-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        deleteCategory(categoryId);
                    });
                }
            }, 2000);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        categoryElement.innerHTML = `
            <div class="w-full flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <i class="fas fa-exclamation-circle text-red-400"></i>
                    </div>
                    <span class="text-red-400 font-medium">Ошибка</span>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            categoryElement.innerHTML = originalContent;
            
            // Переинициализируем обработчик удаления
            const deleteBtn = categoryElement.querySelector('.delete-category-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    deleteCategory(categoryId);
                });
            }
        }, 2000);
    }
}


// Функция для показа уведомления об успехе
function showSuccessNotification(message) {
    const notificationContainer = document.getElementById('notificationContainer');
    if (!notificationContainer) {
        console.error('Контейнер для уведомлений не найден');
        return;
    }
    
    // Очищаем предыдущие уведомления
    notificationContainer.innerHTML = '';
    
    // Создаем уведомление с иконкой
    const notification = document.createElement('div');
    notification.className = 'bg-green-600/90 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in backdrop-blur-sm';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
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
    }, 3000);
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function() {
    initCategoriesTab();
});

// =============================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// =============================================

function initTabNavigation() {
    const navItems = document.querySelectorAll('.mobile-nav-item');
    const tabs = document.querySelectorAll('.mobile-tab');

    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            console.log('Переключение на вкладку:', tabName);

            // Убираем активный класс у всех элементов навигации
            navItems.forEach(navItem => {
                navItem.classList.remove('active');
            });

            // Добавляем активный класс текущему элементу навигации
            this.classList.add('active');

            // Скрываем все вкладки
            tabs.forEach(tab => {
                tab.classList.remove('active');
            });

            // Показываем выбранную вкладку
            const activeTab = document.getElementById(`tab-${tabName}`);
            if (activeTab) {
                activeTab.classList.add('active');
                
                // Если переключаемся на вкладку категорий, загружаем категории
                if (tabName === 'categories') {
                    loadUserCategories();
                }
                // Если переключаемся на главную, обновляем вкладки категорий
                else if (tabName === 'home') {
                    updateCategoryTabs();
                }
            } else {
                console.error('Вкладка не найдена: ', `tab-${tabName}`);
            }
        });
    });
}

// Инициализация при загрузке страницы
document.addEventListener("DOMContentLoaded", function() {
    initTabNavigation();
});

// =============================================
// ОБНОВЛЕНИЕ ГЛОБАЛЬНОГО СПИСКА КАТЕГОРИЙ
// =============================================

async function updateGlobalCategories() {
    try {
        const response = await fetch('/get_categories/');
        const data = await response.json();
        
        if (data.categories) {
            // Обновляем глобальную переменную categories
            window.categories = data.categories;
            console.log('Обновлены глобальные категории:', window.categories);
            
            // Обновляем категории в модальном окне транзакции (если оно открыто)
            const modal = document.getElementById("transactionModal");
            if (modal && !modal.classList.contains('hidden')) {
                console.log('Модальное окно открыто, обновляем категории внутри');
                loadCategories();
            }
        }
    } catch (error) {
        console.error('Ошибка при обновлении глобальных категорий:', error);
    }
}

// =============================================
// ОБНОВЛЕНИЕ ВКЛАДОК КАТЕГОРИЙ НА ГЛАВНОЙ
// =============================================

async function updateCategoryTabs() {
    try {
        const response = await fetch('/get_categories/');
        const data = await response.json();
        
        if (data.categories) {
            const tabsWrapper = document.getElementById('tabsWrapper');
            if (!tabsWrapper) return;
            
            // Сохраняем вкладку "Все"
            const allTab = tabsWrapper.querySelector('.tab[data-category="all"]');
            tabsWrapper.innerHTML = '';
            tabsWrapper.appendChild(allTab);
            
            // Добавляем все категории
            data.categories.forEach(cat => {
                const tab = document.createElement('div');
                tab.className = 'tab';
                tab.dataset.category = cat.id;
                tab.innerHTML = `<span>${cat.name}</span>`;
                tabsWrapper.appendChild(tab);
            });
            
            // Переинициализируем обработчики событий для вкладок
            initCategoryTabs();
        }
    } catch (error) {
        console.error('Ошибка при обновлении вкладок категорий:', error);
    }
}
// =============================================
// УДАЛЕНИЕ ТРАНЗАКЦИЙ (ДЕЛЕГИРОВАНИЕ СОБЫТИЙ)
// =============================================

function initTransactionDeletion() {
    // Используем делегирование событий для обработки всех кнопок удаления
    document.addEventListener('click', function(e) {
        const deleteBtn = e.target.closest('.delete-transaction-btn');
        if (deleteBtn) {
            const transactionId = deleteBtn.dataset.transactionId;
            
            // Предотвращаем множественные срабатывания
            e.stopPropagation();
            e.preventDefault();
            
            deleteTransaction(transactionId);
        }
    });
}

function initCategoryDeletion() {
    document.addEventListener('click', function(e) {
        const deleteBtn = e.target.closest('.delete-category-btn');
        if (deleteBtn) {
            const categoryId = deleteBtn.dataset.categoryId;
            
            // Предотвращаем множественные срабатывания
            e.stopPropagation();
            e.preventDefault();
            
            deleteCategory(categoryId);
        }
    });
}

// При загрузке категорий также инициализируем обработчики удаления
async function loadUserCategories() {
    const categoriesList = document.getElementById('categoriesList');
    if (!categoriesList) return;
    
    try {
        const response = await fetch('/get_categories/');
        const data = await response.json();
        
        categoriesList.innerHTML = '';
        
        if (data.categories && data.categories.length > 0) {
            data.categories.forEach(category => {
                const categoryElement = document.createElement('div');
                categoryElement.className = 'category-item bg-gray-800 rounded-lg p-3 flex justify-between items-center';
                categoryElement.innerHTML = `
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full flex items-center justify-center" style="background-color: ${category.color}22; color: ${category.color}">
                            <i class="${category.icon}"></i>
                        </div>
                        <div>
                            <p class="font-medium">${category.name}</p>
                        </div>
                    </div>
                    <button class="delete-category-btn text-red-400 hover:text-red-300 p-3 transition-colors" data-category-id="${category.id}" title="Удалить категорию">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
                
                categoriesList.appendChild(categoryElement);
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
    }
}


// =============================================
// УДАЛЕНИЕ ТРАНЗАКЦИЙ С ИНЛАЙН-ПОДТВЕРЖДЕНИЕМ
// =============================================

async function deleteTransaction(transactionId) {
    const transactionElement = document.querySelector(`[data-transaction-id="${transactionId}"]`);
    if (!transactionElement) return;
    
    // Сохраняем данные о транзакции ДО замены содержимого
    const amountText = transactionElement.querySelector('.font-semibold')?.textContent;
    const amountMatch = amountText?.match(/([+-])([\d\s]+)\s*с/);
    let transactionData = null;
    
    if (amountMatch) {
        transactionData = {
            sign: amountMatch[1],
            amountValue: parseFloat(amountMatch[2].replace(/\s/g, ''))
        };
    }
    
    // Сохраняем оригинальное содержимое для возможного восстановления
    const originalContent = transactionElement.innerHTML;
    
    // Заменяем содержимое на компактное подтверждение удаления
transactionElement.innerHTML = `
<div class="w-full flex items-center justify-between py-1">
    <div class="flex items-center space-x-2">
        <i class="fas fa-trash text-red-400"></i>
        <span class="text-gray-200 text-sm font-medium">Удалить?</span>
    </div>
    <div class="flex items-center space-x-2" style="align-items: flex-start">
        <button class="cancel-delete-btn bg-gray-500 hover:bg-gray-400 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors" style="height: fit-content">
            Отмена
        </button>
        <button class="confirm-delete-btn bg-red-500 hover:bg-red-400 text-white px-3 py-1.5 rounded text-sm font-medium transition-colors" 
                data-transaction-id="${transactionId}" style="height: fit-content">
            Удалить
        </button>
    </div>
</div>
    `;
    
    // Обработчик подтверждения удаления
    const confirmBtn = transactionElement.querySelector('.confirm-delete-btn');
    confirmBtn.addEventListener('click', async function() {
        await processTransactionDeletion(transactionId, transactionElement, transactionData);
    });
    
    // Обработчик отмены удаления - просто возвращаем исходное состояние
    const cancelBtn = transactionElement.querySelector('.cancel-delete-btn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            // Возвращаем оригинальное содержимое
            transactionElement.innerHTML = originalContent;
            
            // Переинициализируем обработчик удаления
            const deleteBtn = transactionElement.querySelector('.delete-transaction-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    deleteTransaction(transactionId);
                });
            }
        });
    }
}

// Функция для выполнения удаления транзакции
async function processTransactionDeletion(transactionId, transactionElement, transactionData) {
    try {
        const response = await fetch(`/delete_transaction/${transactionId}/`);
        const data = await response.json();
        
        if (data.success) {
            // Обновляем балансы на лету, если есть данные о транзакции
            if (transactionData) {
                updateBalancesAfterDeletion(transactionData.sign, transactionData.amountValue);
            }
            
            // Показываем сообщение об успешном удалении (такого же размера)
            transactionElement.innerHTML = `
                <div class="w-full flex items-center justify-between bg-gray-800 rounded-lg p-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                            <i class="fas fa-check-circle text-green-400"></i>
                        </div>
                        <span class="text-green-400 font-medium">Удалено</span>
                    </div>
                </div>
            `;
            
            // Удаляем элемент через 1.5 секунды
            setTimeout(() => {
                transactionElement.remove();
                checkEmptyStates();
            }, 1500);
        } else {
            // В случае ошибки показываем сообщение и восстанавливаем элемент
            transactionElement.innerHTML = `
                <div class="w-full flex items-center justify-between bg-gray-800 rounded-lg p-3">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                            <i class="fas fa-exclamation-circle text-red-400"></i>
                        </div>
                        <span class="text-red-400 font-medium">Ошибка</span>
                    </div>
                </div>
            `;
            
            setTimeout(() => {
                transactionElement.innerHTML = originalContent;
                
                // Переинициализируем обработчик удаления
                const deleteBtn = transactionElement.querySelector('.delete-transaction-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', function() {
                        deleteTransaction(transactionId);
                    });
                }
            }, 2000);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        transactionElement.innerHTML = `
            <div class="w-full flex items-center justify-between bg-gray-800 rounded-lg p-3">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <i class="fas fa-exclamation-circle text-red-400"></i>
                    </div>
                    <span class="text-red-400 font-medium">Ошибка</span>
                </div>
            </div>
        `;
        
        setTimeout(() => {
            transactionElement.innerHTML = originalContent;
            
            // Переинициализируем обработчик удаления
            const deleteBtn = transactionElement.querySelector('.delete-transaction-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', function() {
                    deleteTransaction(transactionId);
                });
            }
        }, 2000);
    }
}



// Функция для обновления балансов после удаления транзакции
function updateBalancesAfterDeletion(sign, amountValue) {
    const totalElement = document.getElementById('totalBalance');
    const incomeElement = document.getElementById('monthIncome');
    const expenseElement = document.getElementById('monthExpense');
    
    if (!totalElement || !incomeElement || !expenseElement) return;
    
    // Получаем текущие значения (убираем форматирование и текст "с")
    const currentTotal = parseFloat(totalElement.textContent.replace(/\s/g, '').replace('с', ''));
    const currentIncome = parseFloat(incomeElement.textContent.replace(/\s/g, '').replace('с', ''));
    const currentExpense = parseFloat(expenseElement.textContent.replace(/\s/g, '').replace('с', ''));
    
    let newTotal = currentTotal;
    let newIncome = currentIncome;
    let newExpense = currentExpense;
    
    if (sign === '+') {
        // Удаляем доход: уменьшаем общий баланс и доходы
        newTotal = currentTotal - amountValue;
        newIncome = currentIncome - amountValue;
    } else {
        // Удаляем расход: увеличиваем общий баланс и уменьшаем расходы
        newTotal = currentTotal + amountValue;
        newExpense = currentExpense - amountValue;
    }
    
    // Обновляем отображение
    totalElement.textContent = formatAmount(newTotal) + ' с';
    incomeElement.textContent = formatAmount(newIncome) + ' с';
    expenseElement.textContent = formatAmount(newExpense) + ' с';
    
    // Обновляем глобальные переменные (на случай если они где-то используются)
    if (window.initialBalances) {
        window.initialBalances.total = newTotal;
        window.initialBalances.income = newIncome;
        window.initialBalances.expense = newExpense;
    }
    
    console.log('Балансы обновлены после удаления транзакции:', {
        sign, amountValue,
        newTotal, newIncome, newExpense
    });
}

// Функция проверки пустых состояний (уже есть, но убедимся что она корректна)
function checkEmptyStates() {
    const transactionsContainer = document.getElementById('transactionsListContainer');
    if (!transactionsContainer) return;
    
    // Ищем только элементы транзакций (исключая уведомления об удалении)
    const allTransactionElements = transactionsContainer.querySelectorAll('.transaction-item');
    const actualTransactions = Array.from(allTransactionElements).filter(item => {
        // Проверяем, что это не уведомление об удалении
        return !item.innerHTML.includes('Запись удалена');
    });
    
    const visibleTransactions = actualTransactions.filter(item => {
        return item.style.display !== 'none' && item.style.height !== '0px';
    });
    
    // Показываем пустое состояние, если транзакций не осталось
    const emptyStateAll = document.getElementById('emptyStateAll');
    const emptyStateFiltered = document.getElementById('emptyStateFiltered');
    
    if (visibleTransactions.length === 0) {
        // Проверяем активную вкладку
        const activeTab = document.querySelector('.tab.active');
        const activeCategory = activeTab ? activeTab.dataset.category : 'all';
        
        if (activeCategory === 'all') {
            if (emptyStateAll) emptyStateAll.style.display = 'block';
            if (emptyStateFiltered) emptyStateFiltered.style.display = 'none';
        } else {
            if (emptyStateAll) emptyStateAll.style.display = 'none';
            if (emptyStateFiltered) emptyStateFiltered.style.display = 'block';
        }
    } else {
        // Скрываем оба пустых состояния если есть транзакции
        if (emptyStateAll) emptyStateAll.style.display = 'none';
        if (emptyStateFiltered) emptyStateFiltered.style.display = 'none';
    }
}



// Добавьте эту функцию для обработки динамически созданных элементов
function initEventDelegation() {
    // Делегирование событий для кнопок удаления транзакций
    document.addEventListener('click', function(e) {
        if (e.target.closest('.delete-transaction-btn')) {
            const btn = e.target.closest('.delete-transaction-btn');
            const transactionId = btn.dataset.transactionId;
            deleteTransaction(transactionId);
        }
    });
}

// =============================================
// ОБНОВЛЕННАЯ ИНИЦИАЛИЗАЦИЯ УДАЛЕНИЯ ТРАНЗАКЦИЙ
// =============================================

function initTransactionDeletion() {
    // Удаляем любые существующие обработчики чтобы избежать дублирования
    document.removeEventListener('click', handleTransactionDeletion);
    
    // Добавляем новый обработчик
    document.addEventListener('click', handleTransactionDeletion);
}

function handleTransactionDeletion(e) {
    const deleteBtn = e.target.closest('.delete-transaction-btn');
    if (!deleteBtn) return;
    
    // Останавливаем всплытие и предотвращаем действие по умолчанию
    e.stopPropagation();
    e.preventDefault();
    
    const transactionId = deleteBtn.dataset.transactionId;
    
    // Проверяем, не обрабатывается ли уже это удаление
    if (deleteBtn.classList.contains('processing')) return;
    
    deleteBtn.classList.add('processing');
    deleteTransaction(transactionId);
    
    // Убираем класс processing через некоторое время
    setTimeout(() => {
        deleteBtn.classList.remove('processing');
    }, 1000);
}

// =============================================
// ФОРМАТИРОВАНИЕ СУММ
// =============================================

function formatAmount(amount) {
    // Преобразуем в число, округляем до целого, форматируем с разделителями тысяч
    const number = typeof amount === 'string' ? parseFloat(amount) : amount;
    const rounded = Math.round(number);
    
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Функция для применения форматирования ко всем суммам на странице
function formatAllAmounts() {
    // Форматируем основные балансы
    const totalElement = document.getElementById('totalBalance');
    const incomeElement = document.getElementById('monthIncome');
    const expenseElement = document.getElementById('monthExpense');
    
    if (totalElement) {
        const currentText = totalElement.textContent.replace(' с', '');
        totalElement.textContent = formatAmount(currentText) + ' с';
    }
    
    if (incomeElement) {
        const currentText = incomeElement.textContent.replace(' с', '');
        incomeElement.textContent = formatAmount(currentText) + ' с';
    }
    
    if (expenseElement) {
        const currentText = expenseElement.textContent.replace(' с', '');
        expenseElement.textContent = formatAmount(currentText) + ' с';
    }
    
    // Форматируем суммы в истории операций
    const transactionAmounts = document.querySelectorAll('.transaction-item .font-semibold');
    transactionAmounts.forEach(element => {
        const text = element.textContent;
        // Ищем шаблон: +- число с
        const match = text.match(/([+-])(\d+(?:\.\d+)?)\s*с/);
        if (match) {
            const sign = match[1];
            const amount = match[2];
            element.textContent = `${sign}${formatAmount(amount)} с`;
        }
    });
    
    // Форматируем суммы в статистике
    const statElements = ['weekIncome', 'weekExpense', 'monthIncomeStat', 'monthExpenseStat'];
    statElements.forEach(id => {
        const element = document.getElementById(id);
        if (element && element.textContent !== '0') {
            element.textContent = formatAmount(element.textContent);
        }
    });
}