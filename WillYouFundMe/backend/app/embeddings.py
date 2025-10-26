from __future__ import annotations

import os
from functools import lru_cache

from langchain_community.embeddings import HuggingFaceEmbeddings


@lru_cache(maxsize=1)
def get_embeddings() -> HuggingFaceEmbeddings:
    """Return a cached embedding model instance.

    The embedding model can be customised via the ``EMBEDDING_MODEL``
    environment variable. When unset we default to the light-weight
    ``sentence-transformers/all-MiniLM-L6-v2`` model which is used for
    both index building and query-time retrieval.
    """

    model_name = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    return HuggingFaceEmbeddings(model_name=model_name)
