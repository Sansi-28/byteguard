"""
User settings routes.
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, UserSettings

settings_bp = Blueprint('settings', __name__)

DEFAULTS = {
    'algorithm': 'AES-256-GCM',
    'key_size': '512',
    'auto_delete': False,
    'animations': True,
    'high_contrast': False,
    'session_timeout': '30',
    'two_factor': False,
    'audit_logging': True,
}


@settings_bp.route('/', methods=['GET'])
@jwt_required()
def get_settings():
    user_id = int(get_jwt_identity())
    s = UserSettings.query.filter_by(user_id=user_id).first()
    if not s:
        return jsonify({
            'algorithm': DEFAULTS['algorithm'],
            'keySize': DEFAULTS['key_size'],
            'autoDelete': DEFAULTS['auto_delete'],
            'animations': DEFAULTS['animations'],
            'highContrast': DEFAULTS['high_contrast'],
            'sessionTimeout': DEFAULTS['session_timeout'],
            'twoFactor': DEFAULTS['two_factor'],
            'auditLogging': DEFAULTS['audit_logging'],
        })
    return jsonify(s.to_dict())


@settings_bp.route('/', methods=['PUT'])
@jwt_required()
def update_settings():
    user_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    s = UserSettings.query.filter_by(user_id=user_id).first()
    if not s:
        s = UserSettings(user_id=user_id)
        db.session.add(s)

    s.algorithm = data.get('algorithm', s.algorithm or DEFAULTS['algorithm'])
    s.key_size = data.get('keySize', s.key_size or DEFAULTS['key_size'])
    s.auto_delete = data.get('autoDelete', s.auto_delete if s.auto_delete is not None else DEFAULTS['auto_delete'])
    s.animations = data.get('animations', s.animations if s.animations is not None else DEFAULTS['animations'])
    s.high_contrast = data.get('highContrast', s.high_contrast if s.high_contrast is not None else DEFAULTS['high_contrast'])
    s.session_timeout = data.get('sessionTimeout', s.session_timeout or DEFAULTS['session_timeout'])
    s.two_factor = data.get('twoFactor', s.two_factor if s.two_factor is not None else DEFAULTS['two_factor'])
    s.audit_logging = data.get('auditLogging', s.audit_logging if s.audit_logging is not None else DEFAULTS['audit_logging'])

    db.session.commit()
    return jsonify(s.to_dict())
