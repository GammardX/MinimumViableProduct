"""
Output Adapter: JSON Parser
Implementazione concreta per parsing risposte JSON
"""
import json
import re
from application.ports.output import IResponseParser
from domain.models import LLMResult, ResultStatus, ResultCode


class JSONParserAdapter(IResponseParser):
    """Adapter per parsing JSON con fallback robusto"""
    
    def parse_response(self, raw_response: str) -> LLMResult:
        """
        Converte risposta raw in LLMResult
        
        Args:
            raw_response: Stringa JSON ricevuta dall'LLM
            
        Returns:
            LLMResult: Oggetto del dominio
        """
        try:
            data = self.extract_json(raw_response)
            
            outcome = data.get("outcome", {})
            data_field = data.get("data", {})
            
            status_str = outcome.get("status", "error")
            code_str = outcome.get("code", "TECHNICAL_ERROR")
            
            try:
                status = ResultStatus(status_str)
            except ValueError:
                status = ResultStatus.ERROR
            
            try:
                code = ResultCode(code_str)
            except ValueError:
                code = ResultCode.TECHNICAL_ERROR
            
            return LLMResult(
                status=status,
                code=code,
                rewritten_text=data_field.get("rewritten_text") if data_field else None,
                detected_language=data_field.get("detected_language") if data_field else None,
                violation_category=outcome.get("violation_category")
            )
        except Exception as e:
            return LLMResult(
                status=ResultStatus.ERROR,
                code=ResultCode.TECHNICAL_ERROR,
                violation_category=f"Parse error: {str(e)}"
            )
    
    def extract_json(self, text: str) -> dict:
        """
        Estrazione JSON robusta con fallback
        
        Args:
            text: Testo contenente JSON
            
        Returns:
            dict: Dizionario estratto
            
        Raises:
            ValueError: Se non si riesce ad estrarre JSON valido
        """
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass
        
        clean = re.sub(r"```json|```", "", text).strip()
        
        start = clean.find("{")
        end = clean.rfind("}")
        
        if start == -1 or end == -1:
            raise ValueError("No JSON object found in response")
        
        candidate = clean[start:end + 1]
        
        try:
            return json.loads(candidate)
        except json.JSONDecodeError:
            pass
        
        try:
            sanitized = (
                candidate
                .replace("\n", "\\n")
                .replace("\t", "\\t")
            )
            return json.loads(sanitized)
        except json.JSONDecodeError as e:
            raise ValueError(f"Could not extract valid JSON: {str(e)}")
