from abc import ABC, abstractmethod

class IHatStrategy(ABC):
    """Interfaccia Strategy per la composizione del prompt di un cappello."""

    @abstractmethod
    def build_instruction(self) -> str:
        """Restituisce il blocco di istruzioni operative specifiche del cappello."""
        pass