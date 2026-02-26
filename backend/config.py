import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))
datadir = os.path.join(basedir, '..', 'data')
storagedir = os.path.join(basedir, '..', 'storage')

os.makedirs(datadir, exist_ok=True)
os.makedirs(storagedir, exist_ok=True)


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'byteguard-dev-secret-change-in-production')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f'sqlite:///{os.path.join(datadir, "byteguard.db")}'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'byteguard-jwt-secret-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=int(os.environ.get('JWT_EXPIRY_HOURS', '24')))
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    MAX_CONTENT_LENGTH = 100 * 1024 * 1024  # 100 MB
    STORAGE_DIR = storagedir
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
