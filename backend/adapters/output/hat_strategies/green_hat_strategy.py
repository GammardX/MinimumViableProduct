from .i_hat_strategy import IHatStrategy


class GreenHatStrategy(IHatStrategy):
    """Cappello Verde — fatti, dati, neutralità."""

    def build_instruction(self) -> str:
        return (
            "OBIETTIVO: Creatività e alternative.\n"
            "- Come si potrebbe migliorare o espandere questo testo?\n"
            "- Ci sono soluzioni alternative o idee laterali che il testo non considera?\n"
            "- Proponi un approccio diverso allo stesso argomento."
        )