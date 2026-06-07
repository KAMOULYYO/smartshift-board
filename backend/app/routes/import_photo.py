import os, base64, json, re
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.auth.dependencies import require_manager

router = APIRouter(prefix="/import", tags=["import"])


class PhotoImportRequest(BaseModel):
    image_base64: str   # data:image/png;base64,....
    week_start: str     # YYYY-MM-DD  (lundi de la semaine cible)


@router.post("/photo")
async def import_from_photo(body: PhotoImportRequest, user: dict = Depends(require_manager)):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Clé API IA non configurée sur le serveur")

    try:
        import anthropic
    except ImportError:
        raise HTTPException(status_code=503, detail="Module anthropic non installé")

    # Strip data URI prefix if present
    raw = body.image_base64
    if "," in raw:
        media_type_part, raw = raw.split(",", 1)
        media_type = media_type_part.split(":")[1].split(";")[0] if ":" in media_type_part else "image/png"
    else:
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

    client = anthropic.Anthropic(api_key=api_key)
    message = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=4096,
        messages=[{
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": media_type,
                        "data": raw,
                    },
                },
                {"type": "text", "text": prompt},
            ],
        }],
    )

    text = message.content[0].text.strip()

    # Extract JSON array from response
    match = re.search(r'\[.*\]', text, re.DOTALL)
    if not match:
        return {"shifts": [], "raw": text, "warning": "Aucun shift détecté dans l'image"}

    try:
        shifts = json.loads(match.group())
    except json.JSONDecodeError:
        return {"shifts": [], "raw": text, "warning": "Impossible de parser la réponse IA"}

    return {"shifts": shifts, "count": len(shifts)}
