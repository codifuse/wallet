# generate_vapid_keys.py
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64

def generate_vapid_keys():
    # Генерация приватного ключа (P-256)
    private_key = ec.generate_private_key(ec.SECP256R1())
    public_key = private_key.public_key()

    # Получаем байтовое представление приватного ключа
    private_bytes = private_key.private_numbers().private_value.to_bytes(32, 'big')

    # Получаем байты публичного ключа в несжатом формате (04 + X + Y)
    public_numbers = public_key.public_numbers()
    x = public_numbers.x.to_bytes(32, 'big')
    y = public_numbers.y.to_bytes(32, 'big')
    public_bytes = b'\x04' + x + y

    # Кодируем в Base64 URL-safe
    private_key_b64 = base64.urlsafe_b64encode(private_bytes).decode('utf-8').rstrip('=')
    public_key_b64 = base64.urlsafe_b64encode(public_bytes).decode('utf-8').rstrip('=')

    return private_key_b64, public_key_b64


if __name__ == "__main__":
    private_key, public_key = generate_vapid_keys()
    print("VAPID_PRIVATE_KEY:", private_key)
    print("VAPID_PUBLIC_KEY:", public_key)
