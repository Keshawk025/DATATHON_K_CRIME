from sqlalchemy.orm import Session
from typing import List
from app.models.models import Alert

class AlertService:
    @staticmethod
    def get_alerts(db: Session) -> List[Alert]:
        return db.query(Alert).order_by(Alert.created_at.desc()).all()

    @staticmethod
    def get_active_alerts(db: Session, limit: int = 10) -> List[Alert]:
        return db.query(Alert).order_by(Alert.created_at.desc()).limit(limit).all()
