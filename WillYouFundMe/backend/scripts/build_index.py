from __future__ import annotations

import argparse
from pathlib import Path

from app.indexing import build_index
from app.models import BuildIndexRequest


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build FAISS index from corpus")
    parser.add_argument("--corpus", type=Path, default=Path("corpus"))
    parser.add_argument("--index", type=Path, default=Path("app/faiss_index"))
    parser.add_argument("--chunk-size", type=int, default=600)
    parser.add_argument("--chunk-overlap", type=int, default=120)
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    settings = BuildIndexRequest(
        corpus_path=args.corpus,
        index_path=args.index,
        chunk_size=args.chunk_size,
        chunk_overlap=args.chunk_overlap,
    )
    status = build_index(settings)
    print(
        "Indexed {docs} documents into {path} ({chunks} chunks)".format(
            docs=status.documents_indexed or 0,
            chunks=status.chunks_indexed or 0,
            path=status.index_path,
        )
    )

