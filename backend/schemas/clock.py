from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class ClockPunchIn(BaseModel):
    clock_type: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy_m: Optional[float] = None
