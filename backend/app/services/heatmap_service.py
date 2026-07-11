from sqlalchemy import func, desc, Integer, cast
from datetime import date, timedelta
from typing import List, Dict, Any
from uuid import UUID

from app.models.models import District, FIR, CrimeType, CrimePerson, Criminal
from app.analytics.utils import apply_fir_filters

class HeatmapService:
    @staticmethod
    def get_heatmap_points(db, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Retrieve coordinate points for all crimes matching active filter criteria.
        Casts decimal coordinates to float to prevent JSON serialization errors.
        """
        query = db.query(
            FIR.id,
            FIR.fir_number,
            FIR.latitude,
            FIR.longitude,
            CrimeType.name.label("crime_type_name"),
            FIR.severity,
            FIR.status,
            FIR.occurrence_date,
            FIR.location
        ).join(CrimeType, FIR.crime_type_id == CrimeType.id)

        query = apply_fir_filters(
            query,
            district_id=filters.get("district_id"),
            crime_type_id=filters.get("crime_type_id"),
            status=filters.get("status"),
            severity=filters.get("severity"),
            date_from=filters.get("date_from"),
            date_to=filters.get("date_to")
        )

        points = query.all()
        results = []
        for p in points:
            results.append({
                "id": p.id,
                "fir_number": p.fir_number,
                "latitude": float(p.latitude) if p.latitude is not None else 0.0,
                "longitude": float(p.longitude) if p.longitude is not None else 0.0,
                "crime_type_name": p.crime_type_name,
                "severity": p.severity,
                "status": p.status,
                "occurrence_date": p.occurrence_date,
                "location": p.location
            })
        return results

    @staticmethod
    def get_hotspots(db, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Compile statistical risk parameters grouped by individual districts.
        """
        districts = db.query(District).all()
        results = []
        thirty_days_ago = date.today() - timedelta(days=30)

        for d in districts:
            # If a district filter is set, only include that district
            if filters.get("district_id") and d.id != filters["district_id"]:
                continue

            # Core filtered FIR query for this district
            fir_query = db.query(FIR.id).filter(FIR.district_id == d.id)
            fir_query = apply_fir_filters(
                fir_query,
                crime_type_id=filters.get("crime_type_id"),
                status=filters.get("status"),
                severity=filters.get("severity"),
                date_from=filters.get("date_from"),
                date_to=filters.get("date_to")
            )

            # 1. Total crime count and average severity
            fir_stats = db.query(
                func.count(FIR.id).label("crime_count"),
                func.avg(FIR.severity).label("avg_severity")
            ).filter(FIR.id.in_(fir_query)).first()

            crime_count = fir_stats.crime_count or 0
            avg_severity = float(fir_stats.avg_severity or 0.0)

            # 2. Top crime category
            top_crime = db.query(
                CrimeType.name,
                func.count(FIR.id).label("cnt")
            ).join(FIR, FIR.crime_type_id == CrimeType.id)\
             .filter(FIR.id.in_(fir_query))\
             .group_by(CrimeType.name)\
             .order_by(desc("cnt"))\
             .first()
            top_crime_category = top_crime[0] if top_crime else "N/A"

            # 3. Repeat offenders count and average risk score
            criminal_stats = db.query(
                func.sum(cast(Criminal.repeat_offender, Integer)).label("repeat_offenders"),
                func.avg(Criminal.risk_score).label("avg_risk")
            ).join(CrimePerson, CrimePerson.criminal_id == Criminal.id)\
             .filter(CrimePerson.fir_id.in_(fir_query)).first()

            repeat_offenders_count = int(criminal_stats.repeat_offenders or 0)
            avg_risk_score = float(criminal_stats.avg_risk or 0.0)

            # 4. Recent FIR count (last 30 days)
            recent_fir_count = db.query(func.count(FIR.id)).filter(
                FIR.id.in_(fir_query),
                FIR.occurrence_date >= thirty_days_ago
            ).scalar() or 0

            # 5. Hotspot risk score calculation
            # Weighted formula blending: volume density (40%), severity (30%), risk profile (30%)
            norm_crime = min(crime_count / 10.0, 40.0)  # Caps at 400 crimes for max score
            norm_severity = avg_severity * 6.0          # Lvl 5 severity gives 30.0 max
            norm_risk = (avg_risk_score / 100.0) * 30.0  # Risk score of 100 gives 30.0 max
            hotspot_score = norm_crime + norm_severity + norm_risk
            hotspot_score = round(min(max(hotspot_score, 0.0), 100.0), 1)

            if crime_count == 0:
                hotspot_score = 0.0

            risk_level = "Low"
            if hotspot_score >= 60.0:
                risk_level = "High"
            elif hotspot_score >= 30.0:
                risk_level = "Medium"

            results.append({
                "district_id": d.id,
                "district_name": d.name,
                "latitude": float(d.latitude),
                "longitude": float(d.longitude),
                "crime_count": crime_count,
                "average_risk_score": round(avg_risk_score, 1),
                "repeat_offenders_count": repeat_offenders_count,
                "hotspot_score": hotspot_score,
                "risk_level": risk_level,
                "top_crime_category": top_crime_category,
                "recent_fir_count": recent_fir_count
            })

        return results

    @staticmethod
    def get_district_statistics(db, district_id: UUID) -> Dict[str, Any]:
        """
        Compile full in-depth statistics for a single district drilldown panel.
        """
        district = db.query(District).filter(District.id == district_id).first()
        if not district:
            return None

        # Base queries for this district
        fir_query = db.query(FIR.id).filter(FIR.district_id == district_id)
        thirty_days_ago = date.today() - timedelta(days=30)

        # 1. Total crime count and average severity
        fir_stats = db.query(
            func.count(FIR.id).label("crime_count"),
            func.avg(FIR.severity).label("avg_severity")
        ).filter(FIR.district_id == district_id).first()
        crime_count = fir_stats.crime_count or 0
        avg_severity = float(fir_stats.avg_severity or 0.0)

        # 2. Top crime category
        top_crime = db.query(
            CrimeType.name,
            func.count(FIR.id).label("cnt")
        ).join(FIR, FIR.crime_type_id == CrimeType.id)\
         .filter(FIR.district_id == district_id)\
         .group_by(CrimeType.name)\
         .order_by(desc("cnt"))\
         .first()
        top_crime_category = top_crime[0] if top_crime else "N/A"

        # 3. Repeat offenders count and average risk score
        criminal_stats = db.query(
            func.sum(cast(Criminal.repeat_offender, Integer)).label("repeat_offenders"),
            func.avg(Criminal.risk_score).label("avg_risk")
        ).join(CrimePerson, CrimePerson.criminal_id == Criminal.id)\
         .filter(CrimePerson.fir_id.in_(fir_query)).first()
        repeat_offenders_count = int(criminal_stats.repeat_offenders or 0)
        avg_risk_score = float(criminal_stats.avg_risk or 0.0)

        # 4. Recent FIR count (last 30 days)
        recent_fir_count = db.query(func.count(FIR.id)).filter(
            FIR.district_id == district_id,
            FIR.occurrence_date >= thirty_days_ago
        ).scalar() or 0

        # 5. Hotspot score
        norm_crime = min(crime_count / 10.0, 40.0)
        norm_severity = avg_severity * 6.0
        norm_risk = (avg_risk_score / 100.0) * 30.0
        hotspot_score = round(min(max(norm_crime + norm_severity + norm_risk, 0.0), 100.0), 1)
        if crime_count == 0:
            hotspot_score = 0.0

        # 6. Trend query (monthly count for the last 6 months)
        monthly_trend = db.query(
            func.to_char(FIR.occurrence_date, "YYYY-MM").label("month"),
            func.count(FIR.id).label("count")
        ).filter(FIR.district_id == district_id)\
         .group_by("month")\
         .order_by("month")\
         .all()
        trend = [{"month": r.month, "count": r.count} for r in monthly_trend][-6:]  # Keep last 6 months

        # 7. Top crime types breakdown list
        top_types_query = db.query(
            CrimeType.name.label("category"),
            func.count(FIR.id).label("count")
        ).join(FIR, FIR.crime_type_id == CrimeType.id)\
         .filter(FIR.district_id == district_id)\
         .group_by(CrimeType.name)\
         .order_by(desc("count"))\
         .limit(5)\
         .all()
        top_crime_types = [{"category": r.category, "count": r.count} for r in top_types_query]

        # 8. Recent 5 incidents
        recent_firs = db.query(
            FIR.id,
            FIR.fir_number,
            FIR.occurrence_date,
            CrimeType.name.label("crime_type_name"),
            FIR.severity,
            FIR.status
        ).join(CrimeType, FIR.crime_type_id == CrimeType.id)\
         .filter(FIR.district_id == district_id)\
         .order_by(desc(FIR.occurrence_date))\
         .limit(5)\
         .all()
        recent_incidents = [{
            "id": r.id,
            "fir_number": r.fir_number,
            "occurrence_date": r.occurrence_date,
            "crime_type_name": r.crime_type_name,
            "severity": r.severity,
            "status": r.status
        } for r in recent_firs]

        return {
            "district_id": district.id,
            "district_name": district.name,
            "crime_count": crime_count,
            "top_crime_category": top_crime_category,
            "repeat_offenders": repeat_offenders_count,
            "average_risk_score": round(avg_risk_score, 1),
            "hotspot_score": hotspot_score,
            "recent_fir_count": recent_fir_count,
            "trend": trend,
            "top_crime_types": top_crime_types,
            "recent_incidents": recent_incidents
        }
