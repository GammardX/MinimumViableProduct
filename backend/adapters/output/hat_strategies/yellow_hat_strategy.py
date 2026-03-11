from .i_hat_strategy import IHatStrategy


class YellowHatStrategy(IHatStrategy):
    """Cappello Giallo — ottimismo, benefici, valore positivo."""

    def build_instruction(self) -> str:
        return (
            "OBIETTIVO: Ottimismo, benefici e valore.\n"
            "- Quali sono i punti di forza e i vantaggi descritti?\n"
            "- Quale valore positivo si può estrarre da questo testo?\n"
            "- Cerca la logica positiva: perché questa idea potrebbe funzionare?"
        )
