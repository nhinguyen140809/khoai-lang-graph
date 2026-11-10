"""Password hashing and session token generation (server-side only).

PBKDF2-HMAC-SHA256 from the standard library: no native dependency, strong
enough for the capstone, and the format stays inspectable
(`pbkdf2_sha256$iterations$salthex$hashhex`). Session tokens are raw secrets
in the cookie; only their SHA-256 hash is stored.
"""

from __future__ import annotations

import hashlib
import hmac
import secrets

ITERATIONS = 240_000


def hash_password(password: str) -> str:
    """Hash a password for storage (PBKDF2-HMAC-SHA256)."""
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, ITERATIONS)
    return f"pbkdf2_sha256${ITERATIONS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """Constant-time check of a password against a stored hash."""
    try:
        algorithm, iterations, salt_hex, hash_hex = stored.split("$")
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), bytes.fromhex(salt_hex), int(iterations)
    )
    return hmac.compare_digest(digest.hex(), hash_hex)


def new_session_token() -> str:
    """A fresh session token — the cookie value, never stored raw."""
    return secrets.token_urlsafe(32)


def session_token_hash(token: str) -> str:
    """The SHA-256 hash of a session token, what the sessions table keeps."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
