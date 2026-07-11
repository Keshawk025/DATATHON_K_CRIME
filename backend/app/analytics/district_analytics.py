from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.models.models import District, FIR, CrimeType, Criminal, CrimePerson
from app.analytics.utils import apply_fir_filters

class DistrictAnalytics:
    @staticmethod
    def get_district_ranking(db: Session, filters: dict) -> list:
        # 1. Get crime count per district
        crime_counts_query = db.query(
            FIR.district_id,
            func.count(FIR.id).label("count")
        )
        crime_counts_query = apply_fir_filters(crime_counts_query, **filters)
        crime_counts = {r[0]: r[1] for r in crime_counts_query.group_by(FIR.district_id).all()}

        # 2. Get top crime type per district using a subquery and row number window function
        subq = db.query(
            FIR.district_id,
            CrimeType.name.label("crime_type_name"),
            func.count(FIR.id).label("cnt"),
            func.row_number().over(
                partition_by=FIR.district_id,
                order_by=desc(func.count(FIR.id))
            ).label("rn")
        ).join(CrimeType, FIR.crime_type_id == CrimeType.id)
        subq = apply_fir_filters(subq, **filters)
        subq = subq.group_by(FIR.district_id, CrimeType.name).subquery()
        
        top_crimes_query = db.query(subq.c.district_id, subq.c.crime_type_name).filter(subq.c.rn == 1)
        top_crimes = {r[0]: r[1] for r in top_crimes_query.all()}

        # 3. Get average risk score of criminals involved per district
        risk_query = db.query(
            FIR.district_id,
            func.avg(Criminal.risk_score).label("avg_risk")
        ).join(
            CrimePerson, CrimePerson.fir_id == FIR.id
        ).join(
            Criminal, CrimePerson.criminal_id == Criminal.id
        )
        risk_query = apply_fir_filters(risk_query, **filters)
        risk_stats = {
            r[0]: float(r[1]) if r[1] is not None else 0.0
            for r in risk_query.group_by(FIR.district_id).all()
        }

        # 4. Get repeat offender count involved per district
        repeat_query = db.query(
            FIR.district_id,
            func.count(func.distinct(Criminal.id)).label("repeat_count")
        ).join(
            CrimePerson, CrimePerson.fir_id == FIR.id
        ).join(
            Criminal, CrimePerson.criminal_id == Criminal.id
        ).filter(Criminal.repeat_offender == True)
        repeat_query = apply_fir_filters(repeat_query, **filters)
        repeat_counts = {r[0]: r[1] for r in repeat_query.group_by(FIR.district_id).all()}

        # Combine all district records
        rankings = []
        for dist in db.query(District).all():
            dist_id = dist.id
            count = crime_counts.get(dist_id, 0)
            top_crime = top_crimes.get(dist_id, None)
            avg_risk = risk_stats.get(dist_id, 0.0)
            repeat_cnt = repeat_counts.get(dist_id, 0)
            
            rankings.append({
                "district_id": dist_id,
                "district_name": dist.name,
                "crime_count": count,
                "top_crime_type": top_crime,
                "average_risk_score": avg_risk,
                "repeat_offender_count": repeat_cnt
            })
            
        # Sort by crime count descending, and then alphabetically by district name
        rankings.sort(key=lambda x: (-x["crime_count"], x["district_name"]))
        return rankings
