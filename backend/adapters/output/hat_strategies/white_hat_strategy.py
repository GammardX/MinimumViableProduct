from .i_hat_strategy import IHatStrategy


class WhiteHatStrategy(IHatStrategy):
    """Cappello Bianco — fatti, dati, neutralità."""

    def build_instruction(self) -> str:
        return (
            "OBIETTIVO: Analisi puramente informativa e neutrale.\n"
            "- Elenca ESCLUSIVAMENTE i fatti e i dati presenti nel testo.\n"
            "- Identifica quali informazioni mancano per avere un quadro completo.\n"
            "- Valuta se il testo cita fonti reali o sembra inventato/generico.\n"
            "- NON esprimere opinioni o emozioni."
        )