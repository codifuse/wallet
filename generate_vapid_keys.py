# generate_vapid_keys.py
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization
import base64
import os

def generate_vapid_keys():
    # Генерируем приватный ключ
    private_key = ec.generate_private_key(ec.SECP256R1())
    
    # Получаем публичный ключ
    public_key = private_key.public_key()
    
    # Сериализуем приватный ключ
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    # Сериализуем публичный ключ
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.SubjectPublicKeyInfo,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    # Конвертируем в base64 URL-safe формат (без padding)
    private_key_b64 = base64.urlsafe_b64encode(
        private_pem.split(b'-----')[2].replace(b'\n', b'')
    ).decode('utf-8').rstrip('=')
    
    public_key_b64 = base64.urlsafe_b64encode(
        public_pem
    ).decode('utf-8').rstrip('=')
    
    return private_key_b64, public_key_b64

if __name__ == "__main__":
    private_key, public_key = generate_vapid_keys()
    print("VAPID_PRIVATE_KEY:", private_key)
    print("VAPID_PUBLIC_KEY:", public_key)