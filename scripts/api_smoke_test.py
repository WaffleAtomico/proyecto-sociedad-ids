#!/usr/bin/env python3
"""
End-to-end smoke test for the Proyecto Sociedad IDS API.

Exercises every HTTP endpoint exposed under src/app/api, including the paths
that go through the services/repositories changed in the DIP refactor
(R-06: Blog, Calendar, Comment, Like, Notification, User, File).

Usage:
    python3 scripts/api_smoke_test.py
    BASE_URL=http://localhost:3000 python3 scripts/api_smoke_test.py

The script creates throw-away records (blog/event/comment/notification/like,
one user) and cleans them up at the end. It never deletes pre-existing data.
"""

import base64
import hashlib
import hmac
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request
import uuid
from datetime import datetime, timedelta, timezone

BASE_URL = os.environ.get("BASE_URL", "http://localhost:3000").rstrip("/")
SECRET = os.environ.get("SECRET", "default")

# Read Supabase settings from .env / .env.local for best-effort DB cleanup.
ENV = {}
for env_file in (".env.local", ".env"):
    if os.path.exists(env_file):
        for line in open(env_file, encoding="utf-8"):
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            ENV[key.strip()] = value.strip().strip("'\"")

SUPABASE_URL = ENV.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = ENV.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")

# Users already present in the database (verified via Supabase REST).
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "alberto.admin.test@example.com")
ADMIN_ID = "e7c6da3b-ef12-4c05-baf2-3283c1c7b49b"
STUDENT_ID = "263cb22e-24bc-4efc-be3f-1aa3b50746c5"  # not an admin
FORUM_ID = "02a5dd33-0ff0-4249-a43e-40c154ddfc90"  # existing visible event/forum
VISIBLE_BLOG_ID = "02a5dd33-0ff0-4249-a43e-40c154ddfc90"
EXISTING_COMMENT_ID = "f6fa0225-f372-40ea-908c-625a24e3fd5a"
MISSING_ID = "00000000-0000-4000-8000-000000000000"

RESULTS = []
CREATED = {"blog": None, "event": None, "comment": None, "notification": None,
           "user_id": None}
ORIGINAL_USER = {}


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def make_token(user_id: str, email: str, name: str, role: str) -> str:
    """Builds a JWT compatible with src/utils/jwt_generator.ts (HS256)."""
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "id": user_id,
        "email": email,
        "name": name,
        "role": role,
        "iss": "racoode-api",
        "iat": now,
        "exp": now + 3600,
    }
    signing_input = (
        b64url(json.dumps(header, separators=(",", ":")).encode())
        + "."
        + b64url(json.dumps(payload, separators=(",", ":")).encode())
    )
    signature = hmac.new(
        SECRET.encode(), signing_input.encode(), hashlib.sha256
    ).digest()
    return signing_input + "." + b64url(signature)


def request(method, path, body=None, token=None, headers=None, timeout=90):
    """Performs one HTTP request; returns (status, parsed_body, raw_text)."""
    url = path if path.startswith("http") else BASE_URL + path
    data = None
    request_headers = {"Accept": "application/json"}
    if headers:
        request_headers.update(headers)
    if body is not None:
        data = json.dumps(body).encode()
        request_headers["Content-Type"] = "application/json"
    if token:
        request_headers["Authorization"] = "Bearer " + token

    req = urllib.request.Request(url, data=data, headers=request_headers,
                                 method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            raw = response.read().decode("utf-8", "replace")
            return response.status, parse_json(raw), raw
    except urllib.error.HTTPError as error:
        raw = error.read().decode("utf-8", "replace")
        return error.code, parse_json(raw), raw
    except Exception as error:  # connection refused / timeout
        return 0, None, f"{type(error).__name__}: {error}"


def parse_json(raw):
    try:
        return json.loads(raw)
    except Exception:
        return None


def db_request(method, table, params="", body=None):
    """Best-effort direct Supabase REST access, used only for cleanup."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        return None
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    if params:
        url += "?" + params
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": "Bearer " + SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    data = json.dumps(body).encode() if body is not None else None
    context = ssl._create_unverified_context()
    req = urllib.request.Request(url, data=data, headers=headers,
                                 method=method)
    try:
        with urllib.request.urlopen(req, timeout=30, context=context) as r:
            raw = r.read().decode()
            return parse_json(raw)
    except Exception:
        return None


def check(name, status, body, expected, extra=None):
    """Records one assertion; `expected` may be an int or a set of ints."""
    expected_set = expected if isinstance(expected, (set, list, tuple)) else {expected}
    ok = status in expected_set
    detail = ""
    if extra is not None:
        try:
            ok = ok and extra(body)
        except Exception as error:
            ok = False
            detail = f" assertion error: {error}"
    RESULTS.append((ok, name, status, sorted(expected_set), detail))
    marker = "PASS" if ok else "FAIL"
    print(f"[{marker}] {name} -> {status} (expected {sorted(expected_set)}){detail}")
    if not ok:
        snippet = json.dumps(body)[:400] if body is not None else ""
        if snippet:
            print(f"       body: {snippet}")
    return ok


def cleanup():
    print("\n--- Cleanup ---")
    if CREATED["blog"]:
        request("DELETE", f"/api/blog/{CREATED['blog']}", token=ADMIN_TOKEN)
    if CREATED["event"]:
        request("DELETE", f"/api/calendar/{CREATED['event']}", token=ADMIN_TOKEN)
    if CREATED["comment"]:
        request("DELETE", f"/api/comments/{CREATED['comment']}", token=ADMIN_TOKEN)
    if CREATED["notification"]:
        db_request("DELETE", "Notification", f"id=eq.{CREATED['notification']}")
    if CREATED["user_id"]:
        db_request("DELETE", "User", f"id=eq.{CREATED['user_id']}")
    # Restore the admin's mutable profile fields.
    if ORIGINAL_USER:
        db_request("PATCH", "User", f"id=eq.{ADMIN_ID}", {
            "username": ORIGINAL_USER.get("username"),
            "seed": ORIGINAL_USER.get("seed"),
            "notificationsEnabled": ORIGINAL_USER.get("notificationsEnabled"),
        })
    print("done")


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #
ADMIN_TOKEN = ""
STUDENT_TOKEN = make_token(STUDENT_ID, "student@example.com", "Student",
                           "REGULAR_USER")
STUDENT_ID_INVALID = make_token("11111111-1111-4111-8111-111111111111",
                                "other@example.com", "Other", "REGULAR_USER")

print(f"API smoke test against {BASE_URL}\n")

# Wait for the dev server (first request compiles routes).
print("--- 0. Server availability ---")
for attempt in range(30):
    status, body, _ = request("GET", "/api/blog", timeout=10)
    if status:
        break
    time.sleep(2)
if not check("GET / (server up)", *request("GET", "/", timeout=60)[:2], 200):
    print("\nServer is not reachable. Start it with `npm run dev` first.")
    sys.exit(1)
check("GET /api/blog (public list)", status, body, 200,
      lambda b: b and b.get("success") is True and isinstance(b.get("data"), list))

# Snapshot admin user for restoration later.
rows = db_request("GET", "User",
                  f"select=username,seed,notificationsEnabled&id=eq.{ADMIN_ID}")
if rows:
    ORIGINAL_USER.update(rows[0])

# --------------------------------------------------------------------------- #
print("\n--- 1. Auth ---")
status, body, _ = request("POST", "/api/auth/login", {"email": ADMIN_EMAIL})
if check("POST /api/auth/login (valid admin)", status, body, 200,
         lambda b: b and b.get("success") and b["data"].get("token")):
    ADMIN_TOKEN = body["data"]["token"]
check("POST /api/auth/login (unknown email)", *request(
    "POST", "/api/auth/login", {"email": "nobody@example.com"})[:2], 401)
check("POST /api/auth/login (missing email)", *request(
    "POST", "/api/auth/login", {})[:2], 400)

check("GET /api/auth (admin token)", *request("GET", "/api/auth",
      token=ADMIN_TOKEN)[:2], 200,
      lambda b: b and b.get("success") is True and b.get("hasPermission") is True)
check("GET /api/auth (no token)", *request("GET", "/api/auth")[:2], 401)

unique = uuid.uuid4().hex[:10]
new_email = f"smoke_{unique}@example.com"
status, body, _ = request("POST", "/api/auth/register", {
    "username": f"smoke_{unique}", "email": new_email})
if check("POST /api/auth/register (new user)", status, body, 200,
         lambda b: b and b.get("success") and b.get("data", {}).get("user", {}).get("email") == new_email):
    CREATED["user_id"] = body["data"]["user"]["id"]
check("POST /api/auth/register (duplicate)", *request(
    "POST", "/api/auth/register",
    {"username": f"smoke_{unique}", "email": new_email})[:2], 409)
check("POST /api/auth/register (missing fields)", *request(
    "POST", "/api/auth/register", {"email": "x@example.com"})[:2], 400)

# --------------------------------------------------------------------------- #
print("\n--- 2. Users / me ---")
check("GET /api/users/me", *request("GET", "/api/users/me",
      token=ADMIN_TOKEN)[:2], 200,
      lambda b: b and b.get("success") and b["data"].get("id") == ADMIN_ID)
check("GET /api/users/me (no token)", *request("GET", "/api/users/me")[:2], 401)

status, body, _ = request("PATCH", "/api/users/me/username",
                          {"newUsername": f"smoke_admin_{unique}"}, token=ADMIN_TOKEN)
check("PATCH /api/users/me/username", status, body, 200,
      lambda b: b and b.get("success") and b["data"].get("username") == f"smoke_admin_{unique}")
check("PATCH /api/users/me/username (empty)", *request(
    "PATCH", "/api/users/me/username", {"newUsername": ""},
    token=ADMIN_TOKEN)[:2], 400)

status, body, _ = request("PATCH", "/api/users/me/seed",
                          {"seed": f"seed_{unique}"}, token=ADMIN_TOKEN)
check("PATCH /api/users/me/seed", status, body, 200,
      lambda b: b and b.get("success") and b["data"].get("seed") == f"seed_{unique}")
check("PATCH /api/users/me/seed (empty)", *request(
    "PATCH", "/api/users/me/seed", {"seed": ""}, token=ADMIN_TOKEN)[:2], 400)

status, body, _ = request("PATCH", "/api/users/me/notifications",
                          {"enabled": True}, token=ADMIN_TOKEN)
check("PATCH /api/users/me/notifications", status, body, 200,
      lambda b: b and b.get("success") and b["data"].get("notificationsEnabled") is True)
check("PATCH /api/users/me/notifications (non-boolean)", *request(
    "PATCH", "/api/users/me/notifications", {"enabled": "yes"},
    token=ADMIN_TOKEN)[:2], 400)

# --------------------------------------------------------------------------- #
print("\n--- 3. Blog ---")
status, body, _ = request("POST", "/api/blog", {
    "title": f"Smoke blog {unique}",
    "content": "Blog creado por el smoke test.",
    "publicationType": "BLOG",
    "eventStartDate": "2026-12-01T10:00:00Z",
    "eventEndDate": "2026-12-01T12:00:00Z",
    "imageUrls": [],
}, token=ADMIN_TOKEN)
if check("POST /api/blog (admin)", status, body, 201,
         lambda b: b and b.get("success") and b.get("data", {}).get("id")):
    CREATED["blog"] = body["data"]["id"]
blog_id = CREATED["blog"]

check("POST /api/blog (regular user forbidden)", *request(
    "POST", "/api/blog", {
        "title": "Forbidden", "content": "nope", "publicationType": "BLOG",
        "eventStartDate": "2026-12-01T10:00:00Z",
        "eventEndDate": "2026-12-01T12:00:00Z"}, token=STUDENT_TOKEN)[:2], 403)
check("POST /api/blog (invalid body)", *request(
    "POST", "/api/blog", {"content": "missing title"}, token=ADMIN_TOKEN)[:2], 400)

check("GET /api/blog/:id", *request("GET", f"/api/blog/{blog_id}",
      token=ADMIN_TOKEN)[:2], 200,
      lambda b: b and b.get("success") and b["data"].get("id") == blog_id)
check("GET /api/blog/:id (missing)", *request(
    "GET", f"/api/blog/{MISSING_ID}", token=ADMIN_TOKEN)[:2], 404)

status, body, _ = request("PATCH", f"/api/blog/{blog_id}", {
    "title": f"Smoke blog {unique} (edited)",
    "content": "Contenido editado por el smoke test.",
    "publicationType": "BLOG",
    "eventStartDate": "2026-12-01T10:00:00Z",
    "eventEndDate": "2026-12-01T12:00:00Z",
}, token=ADMIN_TOKEN)
check("PATCH /api/blog/:id", status, body, 200,
      lambda b: b and b.get("success") and "edited" in (b["data"].get("title") or ""))
check("PATCH /api/blog/:id (regular user forbidden)", *request(
    "PATCH", f"/api/blog/{blog_id}", {
        "title": "x", "content": "x", "publicationType": "BLOG",
        "eventStartDate": "2026-12-01T10:00:00Z",
        "eventEndDate": "2026-12-01T12:00:00Z"}, token=STUDENT_TOKEN)[:2], 403)

status, body, _ = request("POST", f"/api/blog/{blog_id}/view",
                          token=ADMIN_TOKEN)
check("POST /api/blog/:id/view", status, body, 200,
      lambda b: b and b.get("success") and b["data"].get("viewCount") >= 1)
check("POST /api/blog/:id/view (no token)", *request(
    "POST", f"/api/blog/{blog_id}/view")[:2], 401)

status, body, _ = request("POST", f"/api/blog/{blog_id}/hide",
                          token=ADMIN_TOKEN)
check("POST /api/blog/:id/hide", status, body, 200,
      lambda b: b and b.get("success") and b["data"].get("isVisible") is False)
check("POST /api/blog/:id/hide (regular user forbidden)", *request(
    "POST", f"/api/blog/{blog_id}/hide", token=STUDENT_TOKEN)[:2], 403)

# --------------------------------------------------------------------------- #
print("\n--- 4. Calendar ---")
status, body, _ = request("POST", "/api/calendar", {
    "title": f"Smoke event {unique}",
    "content": "Evento creado por el smoke test.",
    "publicationType": "EVENT",
    "eventStartDate": "2026-12-05T10:00:00Z",
    "eventEndDate": "2026-12-05T18:00:00Z",
    "location": "Auditorio",
}, token=ADMIN_TOKEN)
if check("POST /api/calendar (admin)", status, body, 201,
         lambda b: b and b.get("success") and b.get("data", {}).get("id")):
    CREATED["event"] = body["data"]["id"]
event_id = CREATED["event"]

check("POST /api/calendar (regular user forbidden)", *request(
    "POST", "/api/calendar", {
        "title": "x", "content": "x", "publicationType": "EVENT",
        "eventStartDate": "2026-12-05T10:00:00Z",
        "eventEndDate": "2026-12-05T18:00:00Z"}, token=STUDENT_TOKEN)[:2], 403)
check("POST /api/calendar (wrong publicationType)", *request(
    "POST", "/api/calendar", {
        "title": "x", "content": "x", "publicationType": "BLOG",
        "eventStartDate": "2026-12-05T10:00:00Z",
        "eventEndDate": "2026-12-05T18:00:00Z"}, token=ADMIN_TOKEN)[:2], 400)

check("GET /api/calendar", *request("GET", "/api/calendar",
      token=ADMIN_TOKEN)[:2], 200,
      lambda b: b and b.get("success") and any(
          item.get("id") == event_id for item in (b.get("data") or [])))
check("GET /api/calendar (no token)", *request("GET", "/api/calendar")[:2], 401)

status, body, _ = request("PATCH", f"/api/calendar/{event_id}", {
    "title": f"Smoke event {unique} (edited)",
    "content": "Evento editado.",
    "publicationType": "EVENT",
    "eventStartDate": "2026-12-05T09:00:00Z",
    "eventEndDate": "2026-12-05T20:00:00Z",
    "location": "Sala B",
}, token=ADMIN_TOKEN)
check("PATCH /api/calendar/:id", status, body, 200,
      lambda b: b and b.get("success") and b["data"].get("location") == "Sala B")

status, body, _ = request("POST", f"/api/calendar/{event_id}/hide",
                          token=ADMIN_TOKEN)
check("POST /api/calendar/:id/hide", status, body, 200,
      lambda b: b and b.get("success") and b["data"].get("isVisible") is False)
status, body, _ = request("GET", "/api/calendar", token=ADMIN_TOKEN)
check("GET /api/calendar (hidden event excluded)", status, body, 200,
      lambda b: b and b.get("success") and not any(
          item.get("id") == event_id for item in (b.get("data") or [])))

# --------------------------------------------------------------------------- #
print("\n--- 5. Comments ---")
status, body, _ = request("POST", "/api/comments", {
    "content": f"Smoke comment {unique}",
    "forumId": FORUM_ID,
}, token=ADMIN_TOKEN)
if check("POST /api/comments", status, body, 201,
         lambda b: b and b.get("success") and b.get("data", {}).get("id")
         and b["data"].get("authorId") == ADMIN_ID):
    CREATED["comment"] = body["data"]["id"]
comment_id = CREATED["comment"]

check("POST /api/comments (invalid body)", *request(
    "POST", "/api/comments", {"content": "no forum"}, token=ADMIN_TOKEN)[:2], 400)
check("POST /api/comments (no token)", *request(
    "POST", "/api/comments", {"content": "x", "forumId": FORUM_ID})[:2], 401)

check("GET /api/comments/:id", *request("GET", f"/api/comments/{comment_id}",
      token=ADMIN_TOKEN)[:2], 200,
      lambda b: b and b.get("success") and b["data"].get("id") == comment_id)
check("GET /api/comments/:id (missing)", *request(
    "GET", f"/api/comments/{MISSING_ID}", token=ADMIN_TOKEN)[:2], 404)

check("POST /api/comments/:id/hide (non-owner forbidden)", *request(
    "POST", f"/api/comments/{EXISTING_COMMENT_ID}/hide",
    token=STUDENT_ID_INVALID)[:2], 403)
status, body, _ = request("POST", f"/api/comments/{comment_id}/hide",
                          token=ADMIN_TOKEN)
check("POST /api/comments/:id/hide (owner)", status, body, 200,
      lambda b: b and b.get("success") and b["data"].get("isHiddenByAuthor") is True)
check("GET /api/comments/:id (hidden returns 404)", *request(
    "GET", f"/api/comments/{comment_id}", token=ADMIN_TOKEN)[:2], 404)

status, body, _ = request("DELETE", f"/api/comments/{comment_id}",
                          token=ADMIN_TOKEN)
if status == 200:
    CREATED["comment"] = None
check("DELETE /api/comments/:id (admin)", status, body, 200,
      lambda b: b and b.get("success") is True)
check("DELETE /api/comments/:id (regular user forbidden)", *request(
    "DELETE", f"/api/comments/{EXISTING_COMMENT_ID}",
    token=STUDENT_TOKEN)[:2], 403)

# --------------------------------------------------------------------------- #
print("\n--- 6. Notifications ---")
status, body, _ = request("POST", "/api/notifications", {
    "recipientId": ADMIN_ID,
    "title": f"Smoke notification {unique}",
    "content": "Notificación creada por el smoke test.",
    "notificationType": "SYSTEM",
}, token=ADMIN_TOKEN)
if check("POST /api/notifications (admin)", status, body, 201,
         lambda b: b and b.get("success") and b.get("data", {}).get("id")):
    CREATED["notification"] = body["data"]["id"]

check("POST /api/notifications (regular user forbidden)", *request(
    "POST", "/api/notifications", {
        "recipientId": ADMIN_ID, "title": "x", "content": "x"},
    token=STUDENT_TOKEN)[:2], 403)
check("POST /api/notifications (missing fields)", *request(
    "POST", "/api/notifications", {"title": "x"}, token=ADMIN_TOKEN)[:2], 400)
check("GET /api/notifications?userId=", *request(
    "GET", f"/api/notifications?userId={ADMIN_ID}", token=ADMIN_TOKEN)[:2], 200,
    lambda b: b and b.get("success") and any(
        item.get("id") == CREATED["notification"] for item in (b.get("data") or [])))
check("GET /api/notifications (missing userId)", *request(
    "GET", "/api/notifications", token=ADMIN_TOKEN)[:2], 400)

# --------------------------------------------------------------------------- #
print("\n--- 7. Likes ---")
# Clean any leftover like from previous runs first.
request("DELETE", f"/api/blog/{VISIBLE_BLOG_ID}/like", token=ADMIN_TOKEN)
status, body, _ = request("POST", f"/api/blog/{VISIBLE_BLOG_ID}/like",
                          token=ADMIN_TOKEN)
check("POST /api/blog/:id/like", status, body, 200,
      lambda b: b and b.get("success") and b.get("liked") is True)
check("POST /api/blog/:id/like (duplicate)", *request(
    "POST", f"/api/blog/{VISIBLE_BLOG_ID}/like", token=ADMIN_TOKEN)[:2], 409)
status, body, _ = request("GET", "/api/users/me/likes", token=ADMIN_TOKEN)
check("GET /api/users/me/likes (contains liked)", status, body, 200,
      lambda b: b and b.get("success") and any(
          item.get("blogId") == VISIBLE_BLOG_ID for item in (b.get("data") or [])))
status, body, _ = request("DELETE", f"/api/blog/{VISIBLE_BLOG_ID}/like",
                          token=ADMIN_TOKEN)
check("DELETE /api/blog/:id/like", status, body, 200,
      lambda b: b and b.get("success") and b.get("removed") is True)
status, body, _ = request("DELETE", f"/api/blog/{VISIBLE_BLOG_ID}/like",
                          token=ADMIN_TOKEN)
check("DELETE /api/blog/:id/like (again removed=false)", status, body, 200,
      lambda b: b and b.get("success") and b.get("removed") is False)
check("POST /api/blog/:id/like (missing blog)", *request(
    "POST", f"/api/blog/{MISSING_ID}/like", token=ADMIN_TOKEN)[:2], 404)
check("POST /api/blog/:id/like (hidden blog)", *request(
    "POST", f"/api/blog/{blog_id}/like", token=ADMIN_TOKEN)[:2], 404)
check("POST /api/blog/:id/like (no token)", *request(
    "POST", f"/api/blog/{MISSING_ID}/like")[:2], 401)
check("GET /api/users/me/likes (no token)", *request(
    "GET", "/api/users/me/likes")[:2], 401)

# --------------------------------------------------------------------------- #
print("\n--- 8. Files (R2 storage) ---")
check("GET /api/files?prefix=uploads/", *request(
    "GET", "/api/files?prefix=uploads/")[:2], 200,
    lambda b: isinstance(b, list))
status, body, _ = request("POST", "/api/files/upload",
                          {"fileName": "smoke.png", "fileType": "image/png"})
check("POST /api/files/upload", status, body, 200,
      lambda b: b and isinstance(b.get("url"), str) and "X-Amz-Signature" in b["url"])
check("POST /api/files/upload (missing fields)", *request(
    "POST", "/api/files/upload", {"fileName": "smoke.png"})[:2], 400)
status, body, _ = request("POST", "/api/files", {"key": "smoke.png"})
check("POST /api/files (download url)", status, body, 200,
      lambda b: b and isinstance(b.get("url"), str) and "X-Amz-Signature" in b["url"])
check("POST /api/files (missing key)", *request(
    "POST", "/api/files", {})[:2], 400)
check("DELETE /api/files (non-existent key)", *request(
    "DELETE", "/api/files", {"key": "smoke/nonexistent.txt"})[:2], 200,
    lambda b: b and b.get("message") == "File deleted successfully")
check("DELETE /api/files (missing key)", *request(
    "DELETE", "/api/files", {})[:2], 400)

# --------------------------------------------------------------------------- #
print("\n--- 9. Final Blog delete ---")
status, body, _ = request("DELETE", f"/api/blog/{blog_id}", token=ADMIN_TOKEN)
if status == 200:
    CREATED["blog"] = None
check("DELETE /api/blog/:id (admin)", status, body, 200,
      lambda b: b and b.get("success") is True)
check("DELETE /api/blog/:id (missing)", *request(
    "DELETE", f"/api/blog/{MISSING_ID}", token=ADMIN_TOKEN)[:2], 200)
check("DELETE /api/blog/:id (no token)", *request(
    "DELETE", f"/api/blog/{blog_id}")[:2], 401)

cleanup()

# --------------------------------------------------------------------------- #
failed = [item for item in RESULTS if not item[0]]
print("\n" + "=" * 70)
print(f"TOTAL: {len(RESULTS)}  PASS: {len(RESULTS) - len(failed)}  FAIL: {len(failed)}")
if failed:
    print("\nFailures:")
    for _, name, status, expected, detail in failed:
        print(f"  - {name}: got {status}, expected {expected}{detail}")
print("=" * 70)
sys.exit(1 if failed else 0)
