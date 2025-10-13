from django.contrib import admin
from .models import Category, Transaction

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['id', 'name']
    search_fields = ['name']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'category', 'type', 'amount', 'created_at']
    list_filter = ['type', 'created_at']
    search_fields = ['user__username', 'category__name']

# Создаем default категории при запуске
from django.apps import AppConfig

class MainConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'main'
    
    def ready(self):
        from .models import Category
        # Создаем базовые категории если их нет
        default_categories = [
            'Еда', 'Транспорт', 'Жилье', 'Здоровье', 'Развлечения',
            'Одежда', 'Образование', 'Подарки', 'Зарплата', 'Инвестиции'
        ]
        
        for cat_name in default_categories:
            Category.objects.get_or_create(name=cat_name)