from datetime import datetime
from typing import Optional

class Category:
    def __init__(
        self,
        id: str,
        name: str,
        created_by: str,
        created_at: datetime,
        updated_at: datetime,
        is_deleted: bool = False,
        updated_by: Optional[str] = None
    ):
        self.id = id
        self.name = name
        self.created_by = created_by
        self.created_at = created_at
        self.updated_at = updated_at
        self.is_deleted = is_deleted
        self.updated_by = updated_by