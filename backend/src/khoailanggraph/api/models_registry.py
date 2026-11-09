"""The model registry: importing this module registers every ORM table.

The api layer is the composition root of the HTTP wiring, so this is where
the feature models come together — imports below it (platform, domain) stay
ignorant of features, exactly as the import rules demand. Tests and
migrations import this module to have the tables on Base.metadata.
"""

from khoailanggraph.features.artifacts.models import *  # noqa: F403
from khoailanggraph.features.documents.models import *  # noqa: F403
from khoailanggraph.features.exports.models import *  # noqa: F403
from khoailanggraph.features.me.models import *  # noqa: F403
from khoailanggraph.features.projects.models import *  # noqa: F403
from khoailanggraph.features.runs.models import *  # noqa: F403
from khoailanggraph.features.threads.models import *  # noqa: F403
