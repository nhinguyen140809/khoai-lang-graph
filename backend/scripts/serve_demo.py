#!/usr/bin/env python
"""Serve the API with the scripted model and the fixture corpus, for browsing the web app and for
its end-to-end tests without a gateway key.

    DATABASE_URL="sqlite:///$(pwd)/data/e2e.db" uv run python scripts/serve_demo.py [--port 8001]

Seed the database first (`scripts/seed_demo.py --reset`). Every role answers with the scripted
model, so a run finishes in seconds and costs nothing. The review checkpoints follow the
`DEFAULT_REVIEW_CHECKPOINTS` setting, or the `run_config` of the message that starts the run.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import uvicorn

# The test doubles live with the test suite; the script reaches them through its directory.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "tests"))

from khoailanggraph.main import app
from support.hermetic import install_fake_provider


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8001)
    parser.add_argument("--host", default="127.0.0.1")
    args = parser.parse_args()
    install_fake_provider()
    uvicorn.run(app, host=args.host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
