from datetime import datetime
from typing import Dict, Any, Optional

class Product:
    def __init__(
        self,
        id: str,
        name: str,
        category_id: str,
        created_by: str,
        created_at: datetime,
        updated_at: datetime,
        metadata: Dict[str, Any],
        description: Optional[str] = None
    ):
        self.id = id
        self.name = name
        self.category_id = category_id
        self.created_by = created_by
        self.created_at = created_at
        self.updated_at = updated_at
        self.metadata = metadata
        self.description = description