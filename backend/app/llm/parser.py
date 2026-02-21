import json
import re


def extract_json(text: str) -> dict:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        clean = re.sub(r"```json|```", "", text).strip()

        start = clean.find("{")
        end = clean.rfind("}")

        if start == -1 or end == -1:
            raise ValueError("No JSON object found")

        candidate = clean[start:end + 1]

        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            sanitized = (
                candidate
                .replace("\n", "\\n")
                .replace("\t", "\\t")
            )
            return json.loads(sanitized)
