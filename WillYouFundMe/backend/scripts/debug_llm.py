"""Utility to sanity check DeepSeek connectivity and JSON output."""

from __future__ import annotations

import argparse
import json
import sys

from langchain_core.prompts import ChatPromptTemplate

from app.generation import get_llm


def run_probe(prompt: str, expect_json: bool) -> int:
    llm = get_llm()

    if expect_json:
        template = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    "Respond with valid JSON only. Use a single-level object with keys message and details.",
                ),
                ("human", "{prompt}"),
            ]
        )
        chain = template | llm
        response = chain.invoke({"prompt": prompt})
    else:
        response = llm.invoke(prompt)

    print("Raw response:\n")
    print(response.content)

    if expect_json:
        try:
            json.loads(response.content)
        except json.JSONDecodeError as exc:
            print(f"\nResponse was not valid JSON: {exc}", file=sys.stderr)
            return 1
        print("\nJSON parse succeeded.")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Ping the DeepSeek LLM used by the API.")
    parser.add_argument(
        "prompt",
        nargs="?",
        default="Say hello to the municipal proposal team.",
        help="Prompt to send to the model.",
    )
    parser.add_argument(
        "--expect-json",
        action="store_true",
        help="Require the model to return JSON and validate the response.",
    )

    args = parser.parse_args()
    try:
        return run_probe(args.prompt, args.expect_json)
    except EnvironmentError as exc:
        print(str(exc), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
