from __future__ import annotations

import os
from functools import lru_cache
from pathlib import Path
from typing import List

from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS

from .embeddings import get_embeddings
from .indexing import ensure_index


DEFAULT_INDEX_PATH = Path(__file__).resolve().parent / "faiss_index"


def _resolve_index_path() -> Path:
    return Path(os.getenv("FAISS_INDEX_PATH", str(DEFAULT_INDEX_PATH)))


@lru_cache(maxsize=1)
def get_vectorstore() -> FAISS:
    index_path = _resolve_index_path()
    if not index_path.exists():
        try:
            ensure_index(index_path)
        except FileNotFoundError as exc:
            raise FileNotFoundError(
                f"FAISS index not found at {index_path} and automatic build failed: {exc}"
            ) from exc
    embeddings = get_embeddings()
    return FAISS.load_local(index_path, embeddings, allow_dangerous_deserialization=True)


def retrieve_chunks(query: str, k: int = 4) -> List[Document]:
    vectorstore = get_vectorstore()
    return vectorstore.similarity_search(query, k=k)


def format_citations(documents: List[Document]) -> List[dict]:
    citations = []
    for doc in documents:
        citations.append(
            {
                "source": doc.metadata.get("source", "unknown"),
                "snippet": doc.page_content,
            }
        )
    return citations

