from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable

from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter

from .embeddings import get_embeddings
from .models import BuildIndexRequest, IndexStatus


_APP_DIR = Path(__file__).resolve().parent
_BACKEND_ROOT = _APP_DIR.parent
_DEFAULT_CORPUS_DIR = Path(os.getenv("CORPUS_PATH", "corpus"))


def _resolve(path: Path) -> Path:
    if path.is_absolute():
        return path
    return (_BACKEND_ROOT / path).resolve()


def _iter_corpus_files(corpus_dir: Path) -> Iterable[Path]:
    for path in corpus_dir.rglob("*.txt"):
        if path.is_file():
            yield path


def _load_documents(corpus_dir: Path):
    documents = []
    for path in _iter_corpus_files(corpus_dir):
        loader = TextLoader(str(path), encoding="utf-8")
        docs = loader.load()
        for doc in docs:
            doc.metadata.setdefault("source", path.name)
        documents.extend(docs)
    return documents


def _split_documents(documents, chunk_size: int, chunk_overlap: int):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    return splitter.split_documents(documents)


def _make_status(
    *,
    index_path: Path,
    corpus_path: Path,
    documents_indexed: int | None,
    chunks_indexed: int | None,
    exists: bool,
) -> IndexStatus:
    return IndexStatus(
        index_path=index_path,
        corpus_path=corpus_path,
        documents_indexed=documents_indexed,
        chunks_indexed=chunks_indexed,
        exists=exists,
    )


def build_index(settings: BuildIndexRequest) -> IndexStatus:
    corpus_dir = _resolve(settings.corpus_path)
    index_dir = _resolve(settings.index_path)

    if not corpus_dir.exists():
        raise FileNotFoundError(f"Corpus directory not found at {corpus_dir}")

    documents = _load_documents(corpus_dir)
    if not documents:
        raise FileNotFoundError(f"No .txt files found under {corpus_dir}")

    splits = _split_documents(documents, settings.chunk_size, settings.chunk_overlap)
    embeddings = get_embeddings()

    vectorstore = FAISS.from_documents(splits, embedding=embeddings)
    index_dir.mkdir(parents=True, exist_ok=True)
    vectorstore.save_local(str(index_dir))

    return _make_status(
        index_path=index_dir,
        corpus_path=corpus_dir,
        documents_indexed=len(documents),
        chunks_indexed=len(splits),
        exists=True,
    )


def ensure_index(index_path: Path | None = None) -> IndexStatus:
    resolved_index = _resolve(index_path or Path(os.getenv("FAISS_INDEX_PATH", "app/faiss_index")))
    if resolved_index.exists():
        return describe_index(resolved_index)

    corpus_setting = Path(os.getenv("CORPUS_PATH", str(_DEFAULT_CORPUS_DIR)))
    settings = BuildIndexRequest(
        corpus_path=corpus_setting,
        index_path=resolved_index,
        chunk_size=int(os.getenv("INDEX_CHUNK_SIZE", 600)),
        chunk_overlap=int(os.getenv("INDEX_CHUNK_OVERLAP", 120)),
    )
    return build_index(settings)


def describe_index(index_path: Path | None = None, corpus_path: Path | None = None) -> IndexStatus:
    resolved_index = _resolve(index_path or Path(os.getenv("FAISS_INDEX_PATH", "app/faiss_index")))
    resolved_corpus = _resolve(corpus_path or Path(os.getenv("CORPUS_PATH", str(_DEFAULT_CORPUS_DIR))))

    if not resolved_index.exists():
        return _make_status(
            index_path=resolved_index,
            corpus_path=resolved_corpus,
            documents_indexed=None,
            chunks_indexed=None,
            exists=False,
        )

    embeddings = get_embeddings()
    store = FAISS.load_local(
        str(resolved_index),
        embeddings,
        allow_dangerous_deserialization=True,
    )

    documents_indexed = None
    chunks_indexed = None

    if hasattr(store, "docstore"):
        docstore_dict = getattr(store.docstore, "_dict", None)
        if isinstance(docstore_dict, dict):
            documents_indexed = len(docstore_dict)

    if hasattr(store, "index") and hasattr(store.index, "ntotal"):
        chunks_indexed = int(store.index.ntotal)

    return _make_status(
        index_path=resolved_index,
        corpus_path=resolved_corpus,
        documents_indexed=documents_indexed,
        chunks_indexed=chunks_indexed,
        exists=True,
    )
