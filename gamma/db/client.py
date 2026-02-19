from supabase import create_client, Client
from functools import lru_cache
from gamma.config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """Get Supabase client using the anon/public key (respects RLS)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_key)


@lru_cache()
def get_supabase_admin_client() -> Client:
    """Get Supabase client using the secret key (bypasses RLS)."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_secret_key)
