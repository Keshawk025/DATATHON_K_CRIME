from app.models.models import FIR

def apply_fir_filters(
    query,
    district_id=None,
    crime_type_id=None,
    status=None,
    severity=None,
    date_from=None,
    date_to=None
):
    if district_id:
        query = query.filter(FIR.district_id == district_id)
    if crime_type_id:
        query = query.filter(FIR.crime_type_id == crime_type_id)
    if status:
        query = query.filter(FIR.status == status)
    if severity is not None:
        query = query.filter(FIR.severity == severity)
    if date_from:
        query = query.filter(FIR.occurrence_date >= date_from)
    if date_to:
        query = query.filter(FIR.occurrence_date <= date_to)
    return query
