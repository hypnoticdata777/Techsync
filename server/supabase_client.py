"""
Supabase client helper for TechSync.

If SUPABASE_URL / SUPABASE_KEY are missing OR the supabase library
is not installed, SupabaseNotConfigured is raised so the rest of the
app can fall back to mock data.
"""

import os
from typing import Optional

try:
    from supabase import create_client, Client  # type: ignore
except ImportError:
    # Library is not installed – we will treat this as "not configured"
    create_client = None
    Client = object  # type: ignore


class SupabaseNotConfigured(Exception):
    """Raised when Supabase URL, key, or library are missing."""


def get_supabase_client() -> "Client":
    url: Optional[str] = os.getenv("SUPABASE_URL")
    key: Optional[str] = os.getenv("SUPABASE_KEY")

    # If env vars or library are missing, we signal that Supabase is not ready
    if not url or not key or create_client is None:
        raise SupabaseNotConfigured(
            "Supabase is not configured (missing env vars or supabase library)."
        )

    return create_client(url, key)
