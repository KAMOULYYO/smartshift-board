import os, json, re
import httpx
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.auth.dependencies import require_manager

router = APIRouter(prefix="/import", tags=["import"])

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"

# Try models in order until one works
MODELS_TO_TRY = [
    "claude-opus-4-5",
    "claude-sonnet-4-5",
    "claude-haiku-4-5",
    "claude-3-7-sonnet-20250219",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
]


class PhotoImportRequest(BaseModel):
    image_base64: str   # data:image/png;base64,....
    week_start: str     # YYYY-MM-DD  (lundi de la semaine cible)


async def call_anthropic(api_key: str, model: str, media_type: str, raw_b64: str, prompt: str) -> dict:
    """Call Anthropic Messages API directly via httpx."""
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }
    payload = {
        "model": model,
        "max_tokens": 4096,
        "messages": [{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": raw_b64,
                    },
                },
                {"type": "text", "text": prompt},
            ],
        }],
    }
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(ANTHROPIC_API_URL, headers=headers, json=payload)
    return resp.status_code, resp.json()


@router.get("/test-models")
async def test_models(user: dict = Depends(require_manager)):
    """Debug: test which models are available with the current API key."""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Clé API IA non configurée")

    results = {}
    for model in MODELS_TO_TRY:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(
                    ANTHROPIC_API_URL,
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": model,
                        "max_tokens": 10,
                        "messages": [{"role": "user", "content": "Hi"}],
                    },
                )
            results[model] = resp.status_code
        except Exception as e:
            results[model] = str(e)

    return {"results": results, "key_prefix": api_key[:20] + "..."}


@router.post("/photo")
async def import_from_photo(body: PhotoImportRequest, user: dict = Depends(require_manager)):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Clé API IA non configurée sur le serveur")

    # Strip data URI prefix if present
    raw = body.image_base64
    if "," in raw:
        media_type_part, raw = raw.split(",", 1)
        media_type = media_type_part.split(":")[1].split(";")[0] if ":" in media_type_part else "image/png"
    else:
        media_type = "image/png"

    allowed_types = {"image/png", "image/jpeg", "image/gif", "image/webp"}
    if media_type not in allowed_types:
        media_type = "image/png"

    prompt = f"""Tu es un assistant qui lit des plannings de travail.
Analyse cette capture d'écran d'un planning et extrais TOUS les shifts (quarts de travail).

La semaine dans l'image commence le {body.week_start}.

Pour chaque shift trouvé, retourne un objet JSON avec :
- "employee_name": nom complet de l'employé (ex: "Dupont, Jean" → "Jean Dupont")
- "date": date au format YYYY-MM-DD
- "start_time": heure de début HH:MM (ex: "08:00")
- "end_time": heure de fin HH:MM (ex: "16:00")
- "department": département si visible, sinon "Caisse"

Retourne UNIQUEMENT un tableau JSON valide, sans texte autour. Exemple:
[
  {{"employee_name": "Jean Dupont", "date": "2026-06-09", "start_time": "08:00", "end_time": "15:00", "department": "Caisse"}},
  {{"employee_name": "Marie Martin", "date": "2026-06-10", "start_time": "14:00", "end_time": "22:00", "department": "Caisse"}}
]

Si tu ne vois aucun shift, retourne [].
"""

    # Try each model until one succeeds
    last_error = "Aucun modèle disponible"
    for model in MODELS_TO_TRY:
        try:
            status, data = await call_anthropic(api_key, model, media_type, raw, prompt)
        except Exception as e:
            last_error = str(e)
            continue

        if status == 404:
            # Model not available, try next
            last_error = f"Modèle {model} non disponible"
            continue
        elif status == 429:
            raise HTTPException(status_code=429, detail="Limite de requêtes IA atteinte. Réessayez dans quelques secondes.")
        elif status == 401:
            raise HTTPException(status_code=503, detail="Clé API IA invalide. Contactez l'administrateur.")
        elif status == 400:
            err_msg = data.get("error", {}).get("message", str(data))
            raise HTTPException(status_code=400, detail=f"Image invalide: {err_msg}")
        elif status != 200:
            err_msg = data.get("error", {}).get("message", str(data))
            last_error = f"Erreur API ({status}): {err_msg}"
            continue

        # Success — parse response
        text = data["content"][0]["text"].strip()
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if not match:
            return {"shifts": [], "raw": text, "warning": "Aucun shift détecté dans l'image", "model_used": model}

        try:
            shifts = json.loads(match.group())
        except json.JSONDecodeError:
            return {"shifts": [], "raw": text, "warning": "Impossible de parser la réponse IA", "model_used": model}

        return {"shifts": shifts, "count": len(shifts), "model_used": model}

    raise HTTPException(status_code=503, detail=f"Erreur IA: {last_error}")
