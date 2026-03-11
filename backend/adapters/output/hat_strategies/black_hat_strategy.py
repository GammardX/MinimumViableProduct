from .i_hat_strategy import IHatStrategy


class BlackHatStrategy(IHatStrategy):
    """Cappello Nero — cautela, rischi, giudizio critico."""

    def build_instruction(self) -> str:
        return (
            "OBIETTIVO: Cautela, rischi e giudizio critico.\n"
            "- Quali sono i punti deboli, le fallacie logiche o gli errori nel testo?\n"
            "- Quali sono i rischi nell'applicare ciò che dice il testo?\n"
            "- Fai l'avvocato del diavolo: perché questo testo potrebbe essere "
            "sbagliato o dannoso?"
        )