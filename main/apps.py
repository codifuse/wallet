from django.apps import AppConfig

class MainConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'main'

    def ready(self):
        # УДАЛИТЕ или ЗАКОММЕНТИРУЙТЕ этот код
        # from .models import Category
        # default_categories = ['Еда', 'Транспорт', 'Жилье', 'Здоровье', 'Развлечения']
        # for name in default_categories:
        #     Category.objects.get_or_create(name=name)
        pass