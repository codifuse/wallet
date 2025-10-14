from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import Category, Transaction
from decimal import Decimal, InvalidOperation
from django.db.models import Sum
import random
import string
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User 
from django.core.paginator import Paginator

from django.db.models import Sum, Count, Q


def create_default_categories(user):
    """Создает категории по умолчанию для пользователя"""
    default_categories = [
        {'name': 'Еда', 'icon': 'fas fa-utensils', 'color': '#ef4444'},
        {'name': 'Жилье', 'icon': 'fas fa-home', 'color': '#10b981'},
        {'name': 'Работа', 'icon': 'fas fa-briefcase', 'color': '#3b82f6'},
    ]
    
    for cat_data in default_categories:
        Category.objects.get_or_create(
            user=user,
            name=cat_data['name'],
            defaults={'icon': cat_data['icon'], 'color': cat_data['color']}
        )

@login_required
def index(request):
    # Создаем категории по умолчанию
    create_default_categories(request.user)
    
    categories = Category.objects.filter(user=request.user)
    transactions = Transaction.objects.filter(user=request.user).order_by('-created_at')
    
    # Рассчитываем балансы используя агрегацию для точности
    income_result = transactions.filter(type='income').aggregate(total=Sum('amount'))
    expense_result = transactions.filter(type='expense').aggregate(total=Sum('amount'))
    
    income = income_result['total'] or Decimal('0')
    expense = expense_result['total'] or Decimal('0')
    total = income - expense
    
    return render(request, 'index.html', {
        'categories': categories,
        'transactions': transactions,
        'income': income,
        'expense': expense,
        'total': total,
    })

@login_required
def add_transaction(request):
    if request.method == "POST":
        try:
            type_ = request.POST.get("type")
            amount = request.POST.get("amount")
            category_id = request.POST.get("category")
            description = request.POST.get("description", "")

            print(f"=== ДАННЫЕ ОТ ФОРМЫ ===")
            print(f"Type: {type_}")
            print(f"Amount: {amount}")
            print(f"Category ID: {category_id}")
            print(f"Description: {description}")

            if not type_:
                return JsonResponse({"success": False, "error": "Не указан тип операции"})
            if not amount:
                return JsonResponse({"success": False, "error": "Не указана сумма"})
            if not category_id:
                return JsonResponse({"success": False, "error": "Не выбрана категория"})

            # Преобразуем сумму в Decimal
            try:
                amount_decimal = Decimal(amount)
                if amount_decimal <= 0:
                    return JsonResponse({"success": False, "error": "Сумма должна быть больше нуля"})
            except (ValueError, InvalidOperation):
                return JsonResponse({"success": False, "error": "Неверный формат суммы"})

            category = Category.objects.get(id=category_id)
            transaction = Transaction.objects.create(
                user=request.user,
                type=type_,
                amount=amount_decimal,
                category=category,
                description=description
            )
            
            # Возвращаем данные о созданной транзакции для динамического обновления
            transaction_data = {
                'id': transaction.id,
                'type': transaction.type,
                'amount': float(transaction.amount),
                'description': transaction.description,
                'created_at': transaction.created_at.isoformat(),
                'category_id': transaction.category.id,
                'category_name': transaction.category.name,
                'category_icon': transaction.category.icon,
                'category_color': transaction.category.color,
            }
            
            print(f"Транзакция создана: {transaction}")
            return JsonResponse({
                "success": True, 
                "transaction": transaction_data,
                "transaction_type": transaction.type,
                "amount": float(transaction.amount)
            })
            
        except Category.DoesNotExist:
            return JsonResponse({"success": False, "error": "Категория не найдена"})
        except Exception as e:
            print(f"Ошибка при создании транзакции: {str(e)}")
            return JsonResponse({"success": False, "error": f"Внутренняя ошибка сервера: {str(e)}"})

    return JsonResponse({"success": False, "error": "Неверный метод запроса"})

# Приветственная страница
def hello(request):
    # Если пользователь уже авторизован, сразу перенаправляем на index
    if request.user.is_authenticated:
        return redirect('index')
    return render(request, 'hello.html')

# Авторизация (через AJAX или форму)
def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('index')

        # Если AJAX — вернём JSON с ошибкой
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'error': 'Неверный логин или пароль'}, status=400)

        # Если обычный запрос (на всякий случай)
        return render(request, 'hello.html', {'error': 'Неверный логин или пароль'})

    return redirect('hello')

# Выход
def logout_view(request):
    logout(request)
    return redirect('hello')

@login_required
def add_category(request):
    if request.method == "POST":
        try:
            name = request.POST.get("name")
            icon = request.POST.get("icon", "fas fa-tag")
            color = request.POST.get("color", "#3b82f6")

            if not name:
                return JsonResponse({"success": False, "error": "Не указано название категории"})

            category = Category.objects.create(
                user=request.user,
                name=name,
                icon=icon,
                color=color
            )
            
            return JsonResponse({"success": True, "category": {"id": category.id, "name": category.name}})
            
        except Exception as e:
            return JsonResponse({"success": False, "error": str(e)})

    return JsonResponse({"success": False, "error": "Неверный метод запроса"})

@login_required
def delete_category(request, category_id):
    try:
        category = Category.objects.get(id=category_id, user=request.user)
        
        # Проверяем, есть ли транзакции в этой категории
        transaction_count = Transaction.objects.filter(category=category, user=request.user).count()
        
        if transaction_count > 0:
            return JsonResponse({
                "success": False, 
                "error": f"Нельзя удалить категорию с существующими транзакциями ({transaction_count} шт.)"
            })
        
        category.delete()
        return JsonResponse({"success": True})
    except Category.DoesNotExist:
        return JsonResponse({"success": False, "error": "Категория не найдена"})

@login_required
def get_categories(request):
    categories = Category.objects.filter(user=request.user)
    categories_data = [
        {
            'id': cat.id,
            'name': cat.name,
            'icon': cat.icon,
            'color': cat.color
        }
        for cat in categories
    ]
    return JsonResponse({"categories": categories_data})

@login_required
def delete_transaction(request, transaction_id):
    try:
        transaction = Transaction.objects.get(id=transaction_id, user=request.user)
        transaction.delete()
        return JsonResponse({"success": True})
    except Transaction.DoesNotExist:
        return JsonResponse({"success": False, "error": "Транзакция не найдена"})

def generate_random_password(length=12):
    """Генерация случайного пароля"""
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(characters) for i in range(length))


def register(request):
    if request.method == 'POST':
        try:
            username = request.POST.get('username', '').strip()
            
            # Проверка ограничения по времени
            client_ip = request.META.get('REMOTE_ADDR', 'unknown')
            cache_key = f'registration_limit_{client_ip}'
            
            last_registration = cache.get(cache_key)
            if last_registration:
                time_passed = timezone.now() - last_registration
                if time_passed < timedelta(minutes=2):
                    return JsonResponse({
                        "success": False, 
                        "error": "С одного устройства можно регистрироваться только 1 раз в 60 минут!"
                    })
            
            if not username:
                return JsonResponse({"success": False, "error": "Введите логин"})
            
            if len(username) < 3:
                return JsonResponse({"success": False, "error": "Логин должен быть не менее 3 символов"})
            
            if User.objects.filter(username=username).exists():
                return JsonResponse({"success": False, "error": "Пользователь с таким логином уже существует"})
            
            # Генерация случайного пароля
            password = generate_random_password()
            
            # Создаем пользователя
            user = User.objects.create_user(
                username=username,
                password=password
            )
            
            # Профиль создается автоматически через сигнал
            
            # Сохраняем время регистрации в кэш
            cache.set(cache_key, timezone.now(), 60 * 10)
            
            # Создаем категории по умолчанию
            create_default_categories(user)
            
            # Автоматически авторизуем пользователя
            login(request, user)
            
            return JsonResponse({
                "success": True, 
                "message": "Аккаунт успешно создан",
                "username": username
            })
            
        except Exception as e:
            print(f"Ошибка при регистрации: {str(e)}")
            return JsonResponse({"success": False, "error": f"Ошибка при создании аккаунта: {str(e)}"})
    
    return JsonResponse({"success": False, "error": "Неверный метод запроса"})


@login_required
def change_password(request):
    if request.method == 'POST':
        try:
            new_password = request.POST.get('new_password')
            confirm_password = request.POST.get('confirm_password')
            current_password = request.POST.get('current_password')  # Для повторной смены
            
            print(f"=== СМЕНА ПАРОЛЯ ===")
            print(f"Пользователь: {request.user.username}")
            print(f"Пароль уже менялся: {request.user.userprofile.password_changed}")
            
            # Если пользователь уже менял пароль, требуем текущий пароль
            if request.user.userprofile.password_changed:
                if not current_password:
                    return JsonResponse({"success": False, "error": "Введите текущий пароль"})
                
                # Проверяем текущий пароль
                if not request.user.check_password(current_password):
                    return JsonResponse({"success": False, "error": "Неверный текущий пароль"})
            
            if not new_password or not confirm_password:
                return JsonResponse({"success": False, "error": "Заполните все поля"})
            
            if new_password != confirm_password:
                return JsonResponse({"success": False, "error": "Пароли не совпадают"})
            
            if len(new_password) < 6:
                return JsonResponse({"success": False, "error": "Пароль должен быть не менее 6 символов"})
            
            user = request.user
            user.set_password(new_password)
            user.save()
            
            # Отмечаем, что пароль был изменен
            user.userprofile.password_changed = True
            user.userprofile.save()
            
            # Обновляем сессию чтобы пользователь не разлогинился
            from django.contrib.auth import update_session_auth_hash
            update_session_auth_hash(request, user)
            
            print("Пароль успешно изменен")
            return JsonResponse({"success": True, "message": "Пароль успешно изменен"})
            
        except Exception as e:
            print(f"Ошибка при смене пароля: {str(e)}")
            return JsonResponse({"success": False, "error": f"Ошибка при смене пароля: {str(e)}"})
    
    return JsonResponse({"success": False, "error": "Неверный метод запроса"})


def get_transactions(request):
    filter_type = request.GET.get('filter', 'week')
    page = int(request.GET.get('page', 1))
    limit = int(request.GET.get('limit', 10))
    category_id = request.GET.get('category', 'all')
    
    # Определяем период фильтрации
    now = timezone.now()
    if filter_type == 'day':
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif filter_type == 'week':
        start_date = now - timedelta(days=now.weekday())
        start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    elif filter_type == 'month':
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:
        start_date = None
    
    # Получаем транзакции
    transactions = Transaction.objects.filter(user=request.user)
    
    # Фильтруем по категории если выбрана конкретная
    if category_id != 'all':
        transactions = transactions.filter(category_id=category_id)
    
    # Фильтруем по дате если выбран период
    if start_date:
        transactions = transactions.filter(created_at__gte=start_date)
    
    transactions = transactions.order_by('-created_at')
    
    # Пагинация с обработкой ошибок
    paginator = Paginator(transactions, limit)
    try:
        page_obj = paginator.page(page)
    except EmptyPage:
        # Если страница не существует, возвращаем пустой список
        return JsonResponse({
            'success': True,
            'transactions': [],
            'has_more': False
        })
    except Exception as e:
        # Обработка других ошибок
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=400)
    
    transactions_data = []
    for transaction in page_obj:
        transactions_data.append({
            'id': transaction.id,
            'amount': float(transaction.amount),
            'type': transaction.type,
            'description': transaction.description,
            'created_at': transaction.created_at.isoformat(),
            'category_id': transaction.category.id,
            'category_name': transaction.category.name,
            'category_icon': transaction.category.icon,
            'category_color': transaction.category.color,
        })
    
    return JsonResponse({
        'success': True,
        'transactions': transactions_data,
        'has_more': page_obj.has_next()
    })

@login_required
def get_categories_with_stats(request):
    categories = Category.objects.filter(user=request.user)
    
    now = timezone.now()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    total_income = Transaction.objects.filter(
        user=request.user,
        type='income',
        created_at__gte=month_start
    ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
    
    categories_data = []
    for category in categories:
        # Сумма расходов по категории за месяц
        category_expense = Transaction.objects.filter(
            user=request.user,
            category=category,
            type='expense',
            created_at__gte=month_start
        )
        total_expense = category_expense.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        transaction_count = category_expense.count()

        # Расчет процента от общего дохода
        percentage = 0
        if total_income > 0 and total_expense > 0:
            percentage = (total_expense / total_income) * 100
        
        categories_data.append({
            'id': category.id,
            'name': category.name,
            'icon': category.icon,
            'color': category.color,
            'expense_amount': float(total_expense),
            'transaction_count': transaction_count,
            'percentage': round(float(percentage), 1)
        })
    
    return JsonResponse({"categories": categories_data})
