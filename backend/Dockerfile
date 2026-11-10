# Image of the API for development: every dependency group (the real model providers sit in the
# dev group) plus the optional jev group of the decision layer. The source is baked in; the
# compose file mounts it over the baked copy so a change reloads the server.
FROM python:3.13-slim

COPY --from=ghcr.io/astral-sh/uv:0.13 /uv /usr/local/bin/uv

ENV PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# The dependencies first, so a change of the source does not install them again.
COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --group jev --no-install-project

COPY alembic.ini ./
COPY migrations ./migrations
COPY config ./config
COPY scripts ./scripts
COPY tests ./tests
COPY src ./src
RUN uv sync --frozen --group jev

EXPOSE 8000
CMD ["uvicorn", "khoailanggraph.main:app", "--host", "0.0.0.0", "--port", "8000"]
