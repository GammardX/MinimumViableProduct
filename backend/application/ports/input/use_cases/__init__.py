"""
Use Case Interfaces (Input Ports)

Definiscono i contratti per le operazioni applicative.
Implementate da Application Services nel layer application/services/.

Seguono il principio Dependency Inversion: il dominio dipende da queste
astrazioni, non dalle implementazioni concrete.
"""

from .i_analyze_six_hats_use_case import IAnalyzeSixHatsUseCase
from .i_generate_text_use_case import IGenerateTextUseCase
from .i_improve_text_use_case import IImproveTextUseCase
from .i_summarize_text_use_case import ISummarizeTextUseCase
from .i_translate_text_use_case import ITranslateTextUseCase

__all__ = [
    "ISummarizeTextUseCase",
    "IImproveTextUseCase",
    "ITranslateTextUseCase",
    "IAnalyzeSixHatsUseCase",
    "IGenerateTextUseCase"
]