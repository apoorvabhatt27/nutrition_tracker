from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database import get_supabase

security = HTTPBearer(auto_error=False)


async def _verify(token: str) -> dict:
    """Ask Supabase to verify the token — works with any JWT format."""
    try:
        sb = get_supabase()
        response = sb.auth.get_user(token)
        user = response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user.id, "email": user.email or ""}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {exc}") from exc


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    """Require a valid token — raises 401 if missing or invalid."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await _verify(credentials.credentials)


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict | None:
    """Return user dict if token valid, None otherwise — never raises."""
    if not credentials:
        return None
    try:
        return await _verify(credentials.credentials)
    except HTTPException:
        return None
