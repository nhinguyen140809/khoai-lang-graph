"""The domain of the faces: the catalog that names what a face may be, and a spec checked by it."""

from khoailanggraph.domain.faces.catalog import (
    age_tag_of,
    catalog_view_lines,
    face_catalog,
)
from khoailanggraph.domain.faces.spec import FaceSpec, sanitize_face

__all__ = [
    "FaceSpec",
    "age_tag_of",
    "catalog_view_lines",
    "face_catalog",
    "sanitize_face",
]
