import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Date, DateTime, Numeric, ForeignKey, CheckConstraint, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # Admin, Investigation Officer, Crime Analyst
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class District(Base):
    __tablename__ = "districts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    state = Column(String, nullable=False)
    latitude = Column(Numeric(9, 6), nullable=False)
    longitude = Column(Numeric(9, 6), nullable=False)
    population = Column(Integer, nullable=True)

    # Relationships
    firs = relationship("FIR", back_populates="district")
    alerts = relationship("Alert", back_populates="district")
    predictions = relationship("Prediction", back_populates="district")

class CrimeType(Base):
    __tablename__ = "crime_types"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=True)

    # Relationships
    firs = relationship("FIR", back_populates="crime_type")

class FIR(Base):
    __tablename__ = "firs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fir_number = Column(String, unique=True, index=True, nullable=False)
    district_id = Column(UUID(as_uuid=True), ForeignKey("districts.id"), index=True, nullable=False)
    crime_type_id = Column(UUID(as_uuid=True), ForeignKey("crime_types.id"), index=True, nullable=False)
    occurrence_date = Column(Date, index=True, nullable=False)
    reported_date = Column(Date, nullable=False)
    latitude = Column(Numeric(9, 6), index=True, nullable=False)
    longitude = Column(Numeric(9, 6), index=True, nullable=False)
    location = Column(String, nullable=True)
    description = Column(String, nullable=True)
    status = Column(String, nullable=False)
    severity = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    district = relationship("District", back_populates="firs")
    crime_type = relationship("CrimeType", back_populates="firs")
    crime_people = relationship("CrimePerson", back_populates="fir")
    ai_insights = relationship("AIInsight", back_populates="fir")

    __table_args__ = (
        Index("idx_fir_district_occurrence", "district_id", "occurrence_date"),
        Index("idx_fir_district_crime_type", "district_id", "crime_type_id"),
        Index("idx_fir_occurrence_crime_type", "occurrence_date", "crime_type_id"),
        CheckConstraint("severity >= 1 AND severity <= 5", name="check_fir_severity"),
    )

class Criminal(Base):
    __tablename__ = "criminals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    aliases = Column(String, nullable=True)
    risk_score = Column(Float, index=True, nullable=False)
    repeat_offender = Column(Boolean, index=True, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    crime_people = relationship("CrimePerson", back_populates="criminal")
    source_relations = relationship("CrimeRelation", foreign_keys="[CrimeRelation.source_criminal_id]", back_populates="source_criminal")
    target_relations = relationship("CrimeRelation", foreign_keys="[CrimeRelation.target_criminal_id]", back_populates="target_criminal")

    __table_args__ = (
        CheckConstraint("risk_score >= 0.0 AND risk_score <= 100.0", name="check_criminal_risk_score"),
    )

class Victim(Base):
    __tablename__ = "victims"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    age = Column(Integer, nullable=True)

    # Relationships
    crime_people = relationship("CrimePerson", back_populates="victim")

class CrimePerson(Base):
    __tablename__ = "crime_people"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fir_id = Column(UUID(as_uuid=True), ForeignKey("firs.id"), nullable=False)
    criminal_id = Column(UUID(as_uuid=True), ForeignKey("criminals.id"), nullable=True)
    victim_id = Column(UUID(as_uuid=True), ForeignKey("victims.id"), nullable=True)
    role = Column(String, nullable=False)  # Suspect, Accused, Victim, etc.

    # Relationships
    fir = relationship("FIR", back_populates="crime_people")
    criminal = relationship("Criminal", back_populates="crime_people")
    victim = relationship("Victim", back_populates="crime_people")

class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    registration_number = Column(String, unique=True, index=True, nullable=False)
    vehicle_type = Column(String, nullable=False)
    model = Column(String, nullable=True)
    color = Column(String, nullable=True)

class Phone(Base):
    __tablename__ = "phones"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String, unique=True, index=True, nullable=False)
    owner_name = Column(String, nullable=True)

class Address(Base):
    __tablename__ = "addresses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    street = Column(String, nullable=True)
    city = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    latitude = Column(Numeric(9, 6), nullable=True)
    longitude = Column(Numeric(9, 6), nullable=True)

class CrimeRelation(Base):
    __tablename__ = "crime_relations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_criminal_id = Column(UUID(as_uuid=True), ForeignKey("criminals.id"), nullable=False)
    target_criminal_id = Column(UUID(as_uuid=True), ForeignKey("criminals.id"), nullable=False)
    relation_type = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=False)

    # Relationships
    source_criminal = relationship("Criminal", foreign_keys=[source_criminal_id], back_populates="source_relations")
    target_criminal = relationship("Criminal", foreign_keys=[target_criminal_id], back_populates="target_relations")

    __table_args__ = (
        CheckConstraint("confidence_score >= 0.0 AND confidence_score <= 1.0", name="check_relation_confidence_score"),
    )

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    alert_type = Column(String, nullable=False)
    district_id = Column(UUID(as_uuid=True), ForeignKey("districts.id"), nullable=False)
    severity = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    district = relationship("District", back_populates="alerts")

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    district_id = Column(UUID(as_uuid=True), ForeignKey("districts.id"), nullable=False)
    prediction_type = Column(String, nullable=False)
    predicted_value = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    prediction_date = Column(Date, index=True, nullable=False)

    # Relationships
    district = relationship("District", back_populates="predictions")

    __table_args__ = (
        CheckConstraint("confidence >= 0.0 AND confidence <= 1.0", name="check_prediction_confidence"),
    )

class AIInsight(Base):
    __tablename__ = "ai_insights"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fir_id = Column(UUID(as_uuid=True), ForeignKey("firs.id"), nullable=False)
    insight_type = Column(String, nullable=False)
    summary = Column(String, nullable=True)
    recommendation = Column(String, nullable=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    fir = relationship("FIR", back_populates="ai_insights")

class Report(Base):
    __tablename__ = "reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_name = Column(String, nullable=False)
    report_type = Column(String, nullable=False)
    generated_by = Column(String, nullable=False)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    file_path = Column(String, nullable=False)
