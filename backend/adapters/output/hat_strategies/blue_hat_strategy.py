from .i_hat_strategy import IHatStrategy


class BlueHatStrategy(IHatStrategy):
    """Cappello Blu — organizzazione, sintesi, metacognizione."""

    def build_instruction(self) -> str:
        return (
            "OBIETTIVO: Organizzazione e sintesi (Metacognizione).\n"
            "- Riassumi la struttura del testo (è logica? è confusa?).\n"
            "- Quali sono i prossimi passi logici o le conclusioni operative?\n"
            "- Definisci l'agenda per l'uso di queste informazioni."
        )
