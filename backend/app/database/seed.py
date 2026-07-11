import sys
import os
from sqlalchemy.orm import Session
from datetime import date, datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database.session import SessionLocal
from app.models.models import User, District, CrimeType, Criminal, FIR, Alert
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    try:
        # 1. Seed Users
        users_data = [
            {"username": "admin", "email": "admin@ksp.gov.in", "role": "Admin", "password": "password123"},
            {"username": "officer1", "email": "officer1@ksp.gov.in", "role": "Investigation Officer", "password": "password123"},
            {"username": "analyst1", "email": "analyst1@ksp.gov.in", "role": "Crime Analyst", "password": "password123"}
        ]
        for u in users_data:
            exists = db.query(User).filter(User.username == u["username"]).first()
            if not exists:
                user = User(
                    username=u["username"],
                    email=u["email"],
                    role=u["role"],
                    hashed_password=get_password_hash(u["password"]),
                    is_active=True
                )
                db.add(user)
                print(f"Seeding user: {u['username']}")

        # 2. Seed Districts
        districts_data = [
            {"name": "Bagalkote", "state": "Karnataka", "latitude": 16.1817, "longitude": 75.6958, "population": 1889752},
            {"name": "Ballari", "state": "Karnataka", "latitude": 15.1394, "longitude": 76.9214, "population": 1400000},
            {"name": "Belagavi", "state": "Karnataka", "latitude": 15.8497, "longitude": 74.4977, "population": 4762297},
            {"name": "Bengaluru Rural", "state": "Karnataka", "latitude": 13.2847, "longitude": 77.5769, "population": 990923},
            {"name": "Bengaluru Urban", "state": "Karnataka", "latitude": 12.9716, "longitude": 77.5946, "population": 9621551},
            {"name": "Bidar", "state": "Karnataka", "latitude": 17.9104, "longitude": 77.5199, "population": 1703300},
            {"name": "Chamarajanagar", "state": "Karnataka", "latitude": 11.9261, "longitude": 76.9402, "population": 1022011},
            {"name": "Chikkaballapur", "state": "Karnataka", "latitude": 13.4354, "longitude": 77.7285, "population": 1255104},
            {"name": "Chikkamagaluru", "state": "Karnataka", "latitude": 13.3185, "longitude": 75.7760, "population": 1137961},
            {"name": "Chitradurga", "state": "Karnataka", "latitude": 14.2251, "longitude": 76.4005, "population": 1659456},
            {"name": "Dakshina Kannada", "state": "Karnataka", "latitude": 12.8703, "longitude": 74.8826, "population": 2089649},
            {"name": "Davanagere", "state": "Karnataka", "latitude": 14.4644, "longitude": 75.9218, "population": 1945497},
            {"name": "Dharwad", "state": "Karnataka", "latitude": 15.4589, "longitude": 75.0078, "population": 1847023},
            {"name": "Gadag", "state": "Karnataka", "latitude": 15.4322, "longitude": 75.6418, "population": 1065235},
            {"name": "Kalaburagi", "state": "Karnataka", "latitude": 17.3297, "longitude": 76.8343, "population": 2566326},
            {"name": "Hassan", "state": "Karnataka", "latitude": 13.0068, "longitude": 76.1030, "population": 1776421},
            {"name": "Haveri", "state": "Karnataka", "latitude": 14.7954, "longitude": 75.4027, "population": 1597668},
            {"name": "Kodagu", "state": "Karnataka", "latitude": 12.4244, "longitude": 75.7382, "population": 554519},
            {"name": "Kolar", "state": "Karnataka", "latitude": 13.1367, "longitude": 78.1292, "population": 1536401},
            {"name": "Koppal", "state": "Karnataka", "latitude": 15.3468, "longitude": 76.1550, "population": 1389920},
            {"name": "Mandya", "state": "Karnataka", "latitude": 12.5218, "longitude": 76.8951, "population": 1805769},
            {"name": "Mysuru", "state": "Karnataka", "latitude": 12.2958, "longitude": 76.6394, "population": 3001127},
            {"name": "Raichur", "state": "Karnataka", "latitude": 16.2076, "longitude": 77.3614, "population": 1928812},
            {"name": "Ramanagara", "state": "Karnataka", "latitude": 12.7150, "longitude": 77.2813, "population": 1085863},
            {"name": "Shivamogga", "state": "Karnataka", "latitude": 13.9299, "longitude": 75.5681, "population": 1752753},
            {"name": "Tumakuru", "state": "Karnataka", "latitude": 13.3401, "longitude": 77.1006, "population": 2678703},
            {"name": "Udupi", "state": "Karnataka", "latitude": 13.3409, "longitude": 74.7421, "population": 1177361},
            {"name": "Uttara Kannada", "state": "Karnataka", "latitude": 14.8083, "longitude": 74.5828, "population": 1437165},
            {"name": "Vijayapura", "state": "Karnataka", "latitude": 16.8302, "longitude": 75.7100, "population": 2177331},
            {"name": "Yadgir", "state": "Karnataka", "latitude": 16.7677, "longitude": 77.1358, "population": 1174271},
            {"name": "Vijayanagara", "state": "Karnataka", "latitude": 15.2750, "longitude": 76.3860, "population": 1300000}
        ]
        for d in districts_data:
            exists = db.query(District).filter(District.name == d["name"]).first()
            if not exists:
                district = District(
                    name=d["name"],
                    state=d["state"],
                    latitude=d["latitude"],
                    longitude=d["longitude"],
                    population=d["population"]
                )
                db.add(district)
                print(f"Seeding district: {d['name']}")

        # 3. Seed Crime Categories
        crimes_data = [
            {"name": "Murder (Sec 302 IPC)", "description": "Culpable homicide amounting to murder"},
            {"name": "Attempt to Murder (Sec 307 IPC)", "description": "Act done with intent to commit murder under circumstances where death could result"},
            {"name": "Robbery (Sec 392 IPC)", "description": "Theft accompanied by violence or threat of violence"},
            {"name": "Dacoity (Sec 395 IPC)", "description": "Robbery committed by five or more persons conjointly"},
            {"name": "Theft (Sec 379 IPC)", "description": "Dishonest removal of movable property without consent"},
            {"name": "Burglary (Sec 457/380 IPC)", "description": "House-trespass or house-breaking by night to commit offense"},
            {"name": "Kidnapping & Abduction (Sec 363 IPC)", "description": "Taking away or inducing a person to go from any place"},
            {"name": "Assault on Women (Sec 354 IPC)", "description": "Assault or criminal force to woman with intent to outrage her modesty"},
            {"name": "Rape (Sec 376 IPC)", "description": "Sexual assault and non-consensual intercourse"},
            {"name": "Riot (Sec 147/148 IPC)", "description": "Guilty of rioting while armed with deadly weapon"},
            {"name": "Cyber Crime (IT Act)", "description": "Cyber-attacks, online frauds, identity thefts, hacking"},
            {"name": "Narcotic Drugs (NDPS Act)", "description": "Possession, sale, purchase, or transport of narcotic drugs and psychotropic substances"},
            {"name": "Dowry Harassment (Sec 498A IPC)", "description": "Husband or relative of husband of a woman subjecting her to cruelty"},
            {"name": "Cheating & Fraud (Sec 420 IPC)", "description": "Cheating and dishonestly inducing delivery of property"},
            {"name": "Counterfeiting (Sec 489A IPC)", "description": "Counterfeiting currency-notes or bank-notes"}
        ]
        for c in crimes_data:
            exists = db.query(CrimeType).filter(CrimeType.name == c["name"]).first()
            if not exists:
                crime_type = CrimeType(
                    name=c["name"],
                    description=c["description"]
                )
                db.add(crime_type)
                print(f"Seeding crime category: {c['name']}")

        db.commit()

        # Retrieve referenced entities to seed FIRS and Criminals
        bengaluru = db.query(District).filter(District.name == "Bengaluru Urban").first()
        mysuru = db.query(District).filter(District.name == "Mysuru").first()
        belagavi = db.query(District).filter(District.name == "Belagavi").first()
        
        theft_type = db.query(CrimeType).filter(CrimeType.name.like("Theft%")).first()
        robbery_type = db.query(CrimeType).filter(CrimeType.name.like("Robbery%")).first()
        cyber_type = db.query(CrimeType).filter(CrimeType.name.like("Cyber%")).first()

        # 4. Seed Criminals
        criminals_data = [
            {"full_name": "Somesh Gowda", "gender": "Male", "age": 42, "aliases": "Soma, Spider", "risk_score": 92.5, "repeat_offender": True},
            {"full_name": "Raju Nayak", "gender": "Male", "age": 28, "aliases": "Raju, Chinna", "risk_score": 45.0, "repeat_offender": False},
            {"full_name": "Ketan Shah", "gender": "Male", "age": 35, "aliases": "KK, Tech Guru", "risk_score": 85.0, "repeat_offender": True},
            {"full_name": "Latha Hegde", "gender": "Female", "age": 31, "aliases": "Pinky", "risk_score": 30.0, "repeat_offender": False},
            {"full_name": "Vikram Singh", "gender": "Male", "age": 48, "aliases": "Vicky, Don", "risk_score": 96.0, "repeat_offender": True}
        ]
        seeded_criminals = []
        for cr in criminals_data:
            exists = db.query(Criminal).filter(Criminal.full_name == cr["full_name"]).first()
            if not exists:
                criminal = Criminal(
                    full_name=cr["full_name"],
                    gender=cr["gender"],
                    age=cr["age"],
                    aliases=cr["aliases"],
                    risk_score=cr["risk_score"],
                    repeat_offender=cr["repeat_offender"]
                )
                db.add(criminal)
                seeded_criminals.append(criminal)
                print(f"Seeding criminal: {cr['full_name']}")
        db.commit()

        # 5. Seed FIRs
        firs_data = [
            {"fir_number": "FIR/2026/0001", "district_id": bengaluru.id, "crime_type_id": cyber_type.id, "occurrence_date": date(2026, 1, 15), "reported_date": date(2026, 1, 16), "latitude": 12.9716, "longitude": 77.5946, "location": "Whitefield, Bengaluru", "description": "Online banking phishing attack stealing 5 Lakhs", "status": "Under Investigation", "severity": 4},
            {"fir_number": "FIR/2026/0002", "district_id": bengaluru.id, "crime_type_id": theft_type.id, "occurrence_date": date(2026, 2, 10), "reported_date": date(2026, 2, 11), "latitude": 12.9304, "longitude": 77.5810, "location": "Jayanagar, Bengaluru", "description": "Motorcycle stolen from residence parking lot", "status": "Solved", "severity": 2},
            {"fir_number": "FIR/2026/0003", "district_id": mysuru.id, "crime_type_id": robbery_type.id, "occurrence_date": date(2026, 3, 5), "reported_date": date(2026, 3, 5), "latitude": 12.3051, "longitude": 76.6551, "location": "Gokulam, Mysuru", "description": "Chain snatching incident at knife-point", "status": "Under Investigation", "severity": 3},
            {"fir_number": "FIR/2026/0004", "district_id": belagavi.id, "crime_type_id": theft_type.id, "occurrence_date": date(2026, 4, 18), "reported_date": date(2026, 4, 20), "latitude": 15.8497, "longitude": 74.4977, "location": "Tilakwadi, Belagavi", "description": "Housebreak theft of gold ornaments during vacation", "status": "Open", "severity": 3},
            {"fir_number": "FIR/2026/0005", "district_id": bengaluru.id, "crime_type_id": robbery_type.id, "occurrence_date": date(2026, 5, 12), "reported_date": date(2026, 5, 12), "latitude": 12.9784, "longitude": 77.6408, "location": "Indiranagar, Bengaluru", "description": "Nighttime armed robbery at retail convenience store", "status": "Under Investigation", "severity": 5},
            {"fir_number": "FIR/2026/0006", "district_id": mysuru.id, "crime_type_id": cyber_type.id, "occurrence_date": date(2026, 6, 22), "reported_date": date(2026, 6, 23), "latitude": 12.2958, "longitude": 76.6394, "location": "Vidyaranyapuram, Mysuru", "description": "Identity theft and credit card fraud", "status": "Closed", "severity": 3}
        ]
        for f in firs_data:
            exists = db.query(FIR).filter(FIR.fir_number == f["fir_number"]).first()
            if not exists:
                fir = FIR(
                    fir_number=f["fir_number"],
                    district_id=f["district_id"],
                    crime_type_id=f["crime_type_id"],
                    occurrence_date=f["occurrence_date"],
                    reported_date=f["reported_date"],
                    latitude=f["latitude"],
                    longitude=f["longitude"],
                    location=f["location"],
                    description=f["description"],
                    status=f["status"],
                    severity=f["severity"]
                )
                db.add(fir)
                print(f"Seeding FIR: {f['fir_number']}")
        db.commit()

        # 6. Seed Alerts
        alerts_data = [
            {"title": "Cyber Fraud Anomaly", "alert_type": "Cyber Crime", "district_id": bengaluru.id, "severity": "High", "description": "Spike in phishing and OTP fraud reports in Whitefield division."},
            {"title": "Property Theft Pattern", "alert_type": "Theft", "district_id": belagavi.id, "severity": "Medium", "description": "Consecutive household burglaries reported within a 2km radius in Tilakwadi."},
            {"title": "Armed Robbery Warning", "alert_type": "Robbery", "district_id": bengaluru.id, "severity": "Critical", "description": "Multiple commercial store robberies reported at gunpoint in Indiranagar region."}
        ]
        for al in alerts_data:
            exists = db.query(Alert).filter(Alert.title == al["title"]).first()
            if not exists:
                alert = Alert(
                    title=al["title"],
                    alert_type=al["alert_type"],
                    district_id=al["district_id"],
                    severity=al["severity"],
                    description=al["description"]
                )
                db.add(alert)
                print(f"Seeding alert: {al['title']}")
        db.commit()

        print("Database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
