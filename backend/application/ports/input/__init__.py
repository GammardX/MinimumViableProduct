"""
Input Ports (Primary Ports)

Interfacce che definiscono i contratti per l'ingresso al sistema.
Include:
- Primary Port principale (ITextProcessor)
- Use Case Interfaces (ISummarizeTextUseCase, etc.)

Seguono il principio Dependency Inversion:
Il dominio dipende da queste astrazioni, non da implementazioni concrete.
"""

from .text_processor_port import ITextProcessor
from .use_cases import (IAnalyzeSixHatsUseCase, IGenerateTextUseCase,
                        IImproveTextUseCase, ISummarizeTextUseCase,
                        ITranslateTextUseCase)

__all__ = [
    "ITextProcessor",
    "ISummarizeTextUseCase",
    "IImproveTextUseCase",
    "ITranslateTextUseCase",
    "IAnalyzeSixHatsUseCase",
    "IGenerateTextUseCase"
]