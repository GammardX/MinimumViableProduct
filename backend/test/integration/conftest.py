from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from adapters.input import create_fastapi_app
from domain.models import LLMResult, ResultCode, ResultStatus


@pytest.fixture
def mock_text_processor():
    class MockTextProcessor:
        summarize = AsyncMock(
            return_value=LLMResult(
                status=ResultStatus.SUCCESS,
                code=ResultCode.OK,
                rewritten_text="summary output",
                detected_language="it",
            )
        )
        improve = AsyncMock(
            return_value=LLMResult(
                status=ResultStatus.SUCCESS,
                code=ResultCode.OK,
                rewritten_text="improved output",
            )
        )
        translate = AsyncMock(
            return_value=LLMResult(
                status=ResultStatus.SUCCESS,
                code=ResultCode.OK,
                rewritten_text="translated output",
                detected_language="en",
            )
        )
        analyze_six_hats = AsyncMock(
            return_value=LLMResult(
                status=ResultStatus.SUCCESS,
                code=ResultCode.OK,
                rewritten_text="six hats output",
            )
        )
        generate = AsyncMock(
            return_value=LLMResult(
                status=ResultStatus.SUCCESS,
                code=ResultCode.OK,
                rewritten_text="generated output",
            )
        )

    return MockTextProcessor()


@pytest.fixture
def client(mock_text_processor):
    app = create_fastapi_app(mock_text_processor)
    return TestClient(app)
