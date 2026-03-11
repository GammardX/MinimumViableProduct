from .i_hat_strategy import IHatStrategy


class RedHatStrategy(IHatStrategy):
    """Cappello Rosso — emozioni, intuizioni, reazioni istintive."""

    def build_instruction(self) -> str:
        return (
            "OBIETTIVO: Reazione emotiva e istintiva.\n"
            "- Che emozioni suscita questo testo? (Rabbia, entusiasmo, noia, paura?)\n"
            "- Qual è la tua intuizione immediata sulla validità del contenuto?\n"
            "- Non giustificare le tue reazioni, esprimile e basta."
        )