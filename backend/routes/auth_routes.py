"""
Authentication routes — register, login, logout, session, Kyber key upload.
Uses JWT (Flask-JWT-Extended) and Bcrypt password hashing.
"""

import bcrypt
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, get_jwt
)
from models import db, User

auth_bp = Blueprint('auth', __name__)

# ── Blocklist for logout ──────────────────────────────────
# In production use Redis; here we keep in-memory for the prototype
_revoked_tokens: set[str] = set()


def is_token_revoked(jwt_header, jwt_payload):
    return jwt_payload.get('jti') in _revoked_tokens


# Register the revocation checker via extension callback
from flask_jwt_extended import JWTManager  # noqa
# This will be wired in app.py via @jwt.token_in_blocklist_loader; we expose the helper
token_blocklist_check = is_token_revoked


# ── Routes ────────────────────────────────────────────────

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new researcher account.
    Body: { researcherId, password, kyberPublicKey? }
    """
    data = request.get_json(silent=True) or {}
    researcher_id = (data.get('researcherId') or '').strip()
    password = (data.get('password') or '').strip()
    kyber_pk = data.get('kyberPublicKey')  # base64 string, optional at registration

    if not researcher_id or not password:
        return jsonify({'error': 'Researcher ID and password are required'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    if User.query.filter_by(researcher_id=researcher_id).first():
        return jsonify({'error': 'Researcher ID already exists'}), 409

    pw_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    user = User(
        researcher_id=researcher_id,
        password_hash=pw_hash,
        kyber_public_key=kyber_pk,
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(
        identity=str(user.id),
        additional_claims={'rid': user.researcher_id, 'role': user.role}
    )

    return jsonify({'token': token, 'user': user.to_dict()}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate with researcher ID + password.
    Body: { researcherId, password }
    """
    data = request.get_json(silent=True) or {}
    researcher_id = (data.get('researcherId') or '').strip()
    password = (data.get('password') or '').strip()

    if not researcher_id or not password:
        return jsonify({'error': 'Researcher ID and password are required'}), 400

    user = User.query.filter_by(researcher_id=researcher_id).first()
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = create_access_token(
        identity=str(user.id),
        additional_claims={'rid': user.researcher_id, 'role': user.role}
    )

    return jsonify({'token': token, 'user': user.to_dict()})


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Revoke the current JWT."""
    jti = get_jwt()['jti']
    _revoked_tokens.add(jti)
    return jsonify({'message': 'Logged out successfully'})


@auth_bp.route('/session', methods=['GET'])
@jwt_required()
def session_check():
    """Validate current token and return user info."""
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()})


@auth_bp.route('/kyber-key', methods=['PUT'])
@jwt_required()
def update_kyber_key():
    """
    Store or update the user's Kyber-512 public key.
    Body: { kyberPublicKey: "<base64 string>" }
    """
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json(silent=True) or {}
    pk = data.get('kyberPublicKey')
    if not pk:
        return jsonify({'error': 'kyberPublicKey is required'}), 400

    user.kyber_public_key = pk
    db.session.commit()

    return jsonify({'message': 'Kyber public key updated', 'user': user.to_dict()})


@auth_bp.route('/search', methods=['GET'])
@jwt_required()
def search_users():
    """
    Search for researchers by ID (partial match).
    Query: ?q=<search_term>
    Returns researcher IDs and whether they have a Kyber public key.
    """
    q = request.args.get('q', '').strip()
    current_user_id = get_jwt_identity()
    if not q:
        return jsonify([])

    users = User.query.filter(
        User.researcher_id.ilike(f'%{q}%'),
        User.id != int(current_user_id)
    ).limit(20).all()

    return jsonify([{
        'id': u.id,
        'researcherId': u.researcher_id,
        'hasKyberKey': u.kyber_public_key is not None,
    } for u in users])


@auth_bp.route('/pubkey/<researcher_id>', methods=['GET'])
@jwt_required()
def get_pubkey(researcher_id):
    """
    Retrieve a user's Kyber-512 public key by researcher ID.
    Used by the sender to encapsulate the AES key.
    """
    user = User.query.filter_by(researcher_id=researcher_id).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if not user.kyber_public_key:
        return jsonify({'error': 'Recipient has no Kyber public key registered'}), 404

    return jsonify({
        'researcherId': user.researcher_id,
        'kyberPublicKey': user.kyber_public_key,
    })
