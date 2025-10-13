import os
import django
from django.core.management.base import BaseCommand
from main.models import Category

class Command(BaseCommand):
    help = 'Создает базовые категории'

    def handle(self, *args, **options):
        default_categories = [
            'Еда', 'Транспорт', 'Жилье', 'Здоровье', 'Развлечения',
            'Одежда', 'Образование', 'Подарки', 'Зарплата', 'Инвестиции',
            'Недвижимость', 'Работа'
        ]
        
        created_count = 0
        for cat_name in default_categories:
            category, created = Category.objects.get_or_create(name=cat_name)
            if created:
                created_count += 1
                self.stdout.write(f'Создана категория: {cat_name}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Успешно создано {created_count} категорий. Всего в базе: {Category.objects.count()}')
        )