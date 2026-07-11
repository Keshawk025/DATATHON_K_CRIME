import sys
import os
from datetime import date
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database.session import SessionLocal
from app.models.models import Criminal, FIR, Victim, CrimePerson, Vehicle, Phone, Address, CrimeRelation

def seed_network():
    db = SessionLocal()
    try:
        print("Checking existing network entities...")
        # 1. Victims
        victims_data = [
            {"full_name": "Sunita Kumar", "gender": "Female", "age": 34},
            {"full_name": "Anil Mehta", "gender": "Male", "age": 45},
            {"full_name": "Deepak Rao", "gender": "Male", "age": 29}
        ]
        for v in victims_data:
            exists = db.query(Victim).filter(Victim.full_name == v["full_name"]).first()
            if not exists:
                db.add(Victim(full_name=v["full_name"], gender=v["gender"], age=v["age"]))
                print(f"Added victim: {v['full_name']}")

        # 2. Vehicles
        vehicles_data = [
            {"registration_number": "KA-01-MJ-9999", "vehicle_type": "Motorcycle", "model": "Pulsar 150", "color": "Black"},
            {"registration_number": "KA-03-HL-4321", "vehicle_type": "Car", "model": "Maruti Swift", "color": "White"},
            {"registration_number": "KA-05-EX-8888", "vehicle_type": "SUV", "model": "Mahindra Scorpio", "color": "Silver"}
        ]
        for v in vehicles_data:
            exists = db.query(Vehicle).filter(Vehicle.registration_number == v["registration_number"]).first()
            if not exists:
                db.add(Vehicle(registration_number=v["registration_number"], vehicle_type=v["vehicle_type"], model=v["model"], color=v["color"]))
                print(f"Added vehicle: {v['registration_number']}")

        # 3. Phones
        phones_data = [
            {"phone_number": "9880012345", "owner_name": "Somesh Gowda"},
            {"phone_number": "9945067890", "owner_name": "Ketan Shah"},
            {"phone_number": "9741054321", "owner_name": "Vikram Singh"}
        ]
        for p in phones_data:
            exists = db.query(Phone).filter(Phone.phone_number == p["phone_number"]).first()
            if not exists:
                db.add(Phone(phone_number=p["phone_number"], owner_name=p["owner_name"]))
                print(f"Added phone: {p['phone_number']}")

        # 4. Addresses
        addresses_data = [
            {"street": "12th Main Road, Indiranagar", "city": "Bengaluru", "district": "Bengaluru Urban", "state": "Karnataka", "postal_code": "560038"},
            {"street": "Gokulam 3rd Stage", "city": "Mysuru", "district": "Mysuru", "state": "Karnataka", "postal_code": "570002"}
        ]
        for ad in addresses_data:
            exists = db.query(Address).filter(Address.street == ad["street"]).first()
            if not exists:
                db.add(Address(street=ad["street"], city=ad["city"], district=ad["district"], state=ad["state"], postal_code=ad["postal_code"]))
                print(f"Added address: {ad['street']}")

        db.commit()

        # Retrieve referenced entities to build relations
        somesh = db.query(Criminal).filter(Criminal.full_name == "Somesh Gowda").first()
        raju = db.query(Criminal).filter(Criminal.full_name == "Raju Nayak").first()
        ketan = db.query(Criminal).filter(Criminal.full_name == "Ketan Shah").first()
        latha = db.query(Criminal).filter(Criminal.full_name == "Latha Hegde").first()
        vikram = db.query(Criminal).filter(Criminal.full_name == "Vikram Singh").first()

        fir1 = db.query(FIR).filter(FIR.fir_number == "FIR/2026/0001").first()
        fir2 = db.query(FIR).filter(FIR.fir_number == "FIR/2026/0002").first()
        fir3 = db.query(FIR).filter(FIR.fir_number == "FIR/2026/0003").first()
        fir5 = db.query(FIR).filter(FIR.fir_number == "FIR/2026/0005").first()

        v_sunita = db.query(Victim).filter(Victim.full_name == "Sunita Kumar").first()
        v_anil = db.query(Victim).filter(Victim.full_name == "Anil Mehta").first()

        # 5. CrimePerson Links
        people_links = []
        if fir1 and somesh:
            people_links.append({"fir_id": fir1.id, "criminal_id": somesh.id, "victim_id": None, "role": "Accused"})
        if fir1 and ketan:
            people_links.append({"fir_id": fir1.id, "criminal_id": ketan.id, "victim_id": None, "role": "Co-Accused"})
        if fir2 and somesh:
            people_links.append({"fir_id": fir2.id, "criminal_id": somesh.id, "victim_id": None, "role": "Suspect"})
        if fir3 and raju:
            people_links.append({"fir_id": fir3.id, "criminal_id": raju.id, "victim_id": None, "role": "Accused"})
        if fir5 and vikram:
            people_links.append({"fir_id": fir5.id, "criminal_id": vikram.id, "victim_id": None, "role": "Accused"})
        if fir2 and vikram:
            people_links.append({"fir_id": fir2.id, "criminal_id": vikram.id, "victim_id": None, "role": "Associate"})
        if fir1 and v_sunita:
            people_links.append({"fir_id": fir1.id, "criminal_id": None, "victim_id": v_sunita.id, "role": "Victim"})
        if fir3 and v_anil:
            people_links.append({"fir_id": fir3.id, "criminal_id": None, "victim_id": v_anil.id, "role": "Victim"})

        for link in people_links:
            # Check if this person link exists
            exists = db.query(CrimePerson).filter(
                CrimePerson.fir_id == link["fir_id"],
                CrimePerson.criminal_id == link["criminal_id"],
                CrimePerson.victim_id == link["victim_id"],
                CrimePerson.role == link["role"]
            ).first()
            if not exists:
                db.add(CrimePerson(fir_id=link["fir_id"], criminal_id=link["criminal_id"], victim_id=link["victim_id"], role=link["role"]))
                print(f"Added CrimePerson link for role: {link['role']}")

        # 6. CrimeRelation Links
        relations = []
        if somesh and ketan:
            relations.append({"source_criminal_id": somesh.id, "target_criminal_id": ketan.id, "relation_type": "Associate", "confidence_score": 0.90})
        if somesh and vikram:
            relations.append({"source_criminal_id": somesh.id, "target_criminal_id": vikram.id, "relation_type": "Gang Member", "confidence_score": 0.85})
        if raju and latha:
            relations.append({"source_criminal_id": raju.id, "target_criminal_id": latha.id, "relation_type": "Family", "confidence_score": 0.95})
        if ketan and vikram:
            relations.append({"source_criminal_id": ketan.id, "target_criminal_id": vikram.id, "relation_type": "Associate", "confidence_score": 0.75})

        for rel in relations:
            exists = db.query(CrimeRelation).filter(
                CrimeRelation.source_criminal_id == rel["source_criminal_id"],
                CrimeRelation.target_criminal_id == rel["target_criminal_id"]
            ).first()
            if not exists:
                db.add(CrimeRelation(
                    source_criminal_id=rel["source_criminal_id"],
                    target_criminal_id=rel["target_criminal_id"],
                    relation_type=rel["relation_type"],
                    confidence_score=rel["confidence_score"]
                ))
                print(f"Added CrimeRelation: {rel['relation_type']}")

        db.commit()
        print("Database network seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error during network seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_network()
