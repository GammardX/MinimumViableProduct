"""
Domain Exceptions
Eccezioni specifiche del dominio applicativo
"""


class DomainException(Exception):
    """Eccezione base del dominio"""
    pass


class EmptyTextException(DomainException):
    """Eccezione per testo vuoto"""
    def __init__(self, message: str = "Il testo fornito è vuoto"):
        self.message = message
        super().__init__(self.message)


class InvalidPercentageException(DomainException):
    """Eccezione per percentuale non valida"""
    def __init__(self, percentage: int):
        self.message = f"La percentuale {percentage} non è valida. Deve essere tra 10 e 90."
        super().__init__(self.message)


class UnsupportedHatException(DomainException):
    """Eccezione per cappello non supportato"""
    def __init__(self, hat: str):
        self.message = f"Il cappello '{hat}' non è supportato"
        super().__init__(self.message)


class LLMProviderException(DomainException):
    """Eccezione per errori del provider LLM"""
    def __init__(self, message: str):
        self.message = f"Errore LLM Provider: {message}"
        super().__init__(self.message)
