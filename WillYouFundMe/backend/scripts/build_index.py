from __future__ import annotations

import argparse
from pathlib import Path
from typing import List

from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings


def load_documents(corpus_dir: Path) -> List[str]:
    documents = []
    for path in corpus_dir.rglob("*.txt"):
        loader = TextLoader(str(path), encoding="utf-8")
        docs = loader.load()
        for doc in docs:
            doc.metadata["source"] = path.name
        documents.extend(docs)
    return documents


def build_index(corpus_dir: Path, index_dir: Path, chunk_size: int, chunk_overlap: int) -> None:
    documents = load_documents(corpus_dir)
    if not documents:
        raise FileNotFoundError(f"No text files found in {corpus_dir}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
    )
    splits = splitter.split_documents(documents)

    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vectorstore = FAISS.from_documents(splits, embedding=embeddings)
    index_dir.mkdir(parents=True, exist_ok=True)
    vectorstore.save_local(str(index_dir))


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build FAISS index from corpus")
    parser.add_argument("--corpus", type=Path, default=Path("corpus"))
    parser.add_argument("--index", type=Path, default=Path("faiss_index"))
    parser.add_argument("--chunk-size", type=int, default=600)
    parser.add_argument("--chunk-overlap", type=int, default=120)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    build_index(args.corpus, args.index, args.chunk_size, args.chunk_overlap)
    print(f"Index written to {args.index}")

