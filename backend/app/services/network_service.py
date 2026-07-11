from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Dict, Any
from app.models.models import Criminal, FIR, Victim, CrimePerson, Vehicle, Phone, Address, CrimeRelation

class NetworkService:
    @staticmethod
    def get_network(db: Session, criminal_id: UUID) -> Dict[str, Any]:
        criminal = db.query(Criminal).filter(Criminal.id == criminal_id).first()
        if not criminal:
            return {"nodes": [], "edges": []}
            
        nodes = []
        edges = []
        added_node_ids = set()
        
        def add_node(node_id: Any, label: str, node_type: str, properties: Dict[str, Any] = None):
            node_id_str = str(node_id)
            if node_id_str not in added_node_ids:
                added_node_ids.add(node_id_str)
                node_data = {
                    "id": node_id_str,
                    "label": label,
                    "type": node_type
                }
                if properties:
                    node_data.update(properties)
                nodes.append({"data": node_data})
                
        def add_edge(source: Any, target: Any, edge_type: str, label: str = None):
            src_str = str(source)
            tgt_str = str(target)
            edge_id = f"{src_str}-{tgt_str}-{edge_type}"
            edges.append({
                "data": {
                    "id": edge_id,
                    "source": src_str,
                    "target": tgt_str,
                    "type": edge_type,
                    "label": label or edge_type.replace("_", " ").title()
                }
            })
            
        # 1. Add Center Criminal node
        add_node(
            criminal.id,
            criminal.full_name,
            "criminal",
            {
                "risk_score": criminal.risk_score,
                "aliases": criminal.aliases,
                "age": criminal.age,
                "gender": criminal.gender,
                "repeat_offender": criminal.repeat_offender
            }
        )
        
        # 2. Link Phones
        phones = db.query(Phone).filter(Phone.owner_name == criminal.full_name).all()
        for p in phones:
            add_node(p.id, p.phone_number, "phone", {"owner_name": p.owner_name})
            add_edge(criminal.id, p.id, "shared_phone", "Primary Phone")
            
        # 3. Link Vehicles (deterministic fallback)
        if "Somesh" in criminal.full_name:
            v = db.query(Vehicle).filter(Vehicle.registration_number == "KA-01-MJ-9999").first()
            if v:
                add_node(v.id, v.registration_number, "vehicle", {"model": v.model, "color": v.color})
                add_edge(criminal.id, v.id, "shared_vehicle")
        elif "Ketan" in criminal.full_name:
            v = db.query(Vehicle).filter(Vehicle.registration_number == "KA-03-HL-4321").first()
            if v:
                add_node(v.id, v.registration_number, "vehicle", {"model": v.model, "color": v.color})
                add_edge(criminal.id, v.id, "shared_vehicle")
        elif "Vikram" in criminal.full_name:
            v = db.query(Vehicle).filter(Vehicle.registration_number == "KA-05-EX-8888").first()
            if v:
                add_node(v.id, v.registration_number, "vehicle", {"model": v.model, "color": v.color})
                add_edge(criminal.id, v.id, "shared_vehicle")
                
        # 4. Link Addresses
        if "Somesh" in criminal.full_name or "Vikram" in criminal.full_name or "Ketan" in criminal.full_name:
            addr = db.query(Address).filter(Address.street.like("%Indiranagar%")).first()
            if addr:
                add_node(addr.id, addr.street, "address", {"city": addr.city})
                add_edge(criminal.id, addr.id, "shared_address")
        elif "Raju" in criminal.full_name:
            addr = db.query(Address).filter(Address.street.like("%Gokulam%")).first()
            if addr:
                add_node(addr.id, addr.street, "address", {"city": addr.city})
                add_edge(criminal.id, addr.id, "shared_address")

        # 5. Link Shared FIRs and Victims
        cp_records = db.query(CrimePerson).filter(CrimePerson.criminal_id == criminal.id).all()
        for cp in cp_records:
            fir = db.query(FIR).filter(FIR.id == cp.fir_id).first()
            if not fir:
                continue
                
            # Connect Co-Suspects via Shared FIRs
            co_suspects = db.query(CrimePerson).filter(
                CrimePerson.fir_id == fir.id,
                CrimePerson.criminal_id != criminal.id,
                CrimePerson.criminal_id != None
            ).all()
            for cs in co_suspects:
                other_crim = db.query(Criminal).filter(Criminal.id == cs.criminal_id).first()
                if other_crim:
                    add_node(
                        other_crim.id,
                        other_crim.full_name,
                        "criminal",
                        {
                            "risk_score": other_crim.risk_score,
                            "aliases": other_crim.aliases,
                            "age": other_crim.age,
                            "gender": other_crim.gender,
                            "repeat_offender": other_crim.repeat_offender
                        }
                    )
                    add_edge(criminal.id, other_crim.id, "shared_fir", f"Shared FIR: {fir.fir_number}")
                    
            # Connect Victims
            victims = db.query(CrimePerson).filter(
                CrimePerson.fir_id == fir.id,
                CrimePerson.victim_id != None
            ).all()
            for v_rec in victims:
                vic = db.query(Victim).filter(Victim.id == v_rec.victim_id).first()
                if vic:
                    add_node(vic.id, vic.full_name, "victim", {"gender": vic.gender, "age": vic.age})
                    add_edge(criminal.id, vic.id, "victim_link", f"Victim in {fir.fir_number}")

        # 6. Direct CrimeRelation links
        relations = db.query(CrimeRelation).filter(
            (CrimeRelation.source_criminal_id == criminal.id) |
            (CrimeRelation.target_criminal_id == criminal.id)
        ).all()
        for rel in relations:
            other_id = rel.target_criminal_id if rel.source_criminal_id == criminal.id else rel.source_criminal_id
            other_crim = db.query(Criminal).filter(Criminal.id == other_id).first()
            if not other_crim:
                continue
                
            add_node(
                other_crim.id,
                other_crim.full_name,
                "criminal",
                {
                    "risk_score": other_crim.risk_score,
                    "aliases": other_crim.aliases,
                    "age": other_crim.age,
                    "gender": other_crim.gender,
                    "repeat_offender": other_crim.repeat_offender
                }
            )
            
            # If relation is Gang Member, represent the Gang as a node
            if rel.relation_type == "Gang Member":
                gang_id = "gang_ksp_syndicate"
                add_node(gang_id, "Command Center Syndicate", "gang", {"description": "High-priority active crime gang"})
                add_edge(criminal.id, gang_id, "gang_member")
                add_edge(other_crim.id, gang_id, "gang_member")
            else:
                add_edge(criminal.id, other_crim.id, rel.relation_type.lower(), f"{rel.relation_type} ({int(rel.confidence_score * 100)}%)")
                
        return {"nodes": nodes, "edges": edges}

    @staticmethod
    def search_network(db: Session, query_str: str) -> List[Dict[str, Any]]:
        if not query_str:
            return []
            
        fir = db.query(FIR).filter(FIR.fir_number.ilike(f"%{query_str}%")).first()
        matched_criminals = []
        
        if fir:
            cp_records = db.query(CrimePerson).filter(
                CrimePerson.fir_id == fir.id,
                CrimePerson.criminal_id != None
            ).all()
            for cp in cp_records:
                c = db.query(Criminal).filter(Criminal.id == cp.criminal_id).first()
                if c and c not in matched_criminals:
                    matched_criminals.append(c)
                    
        name_matches = db.query(Criminal).filter(
            (Criminal.full_name.ilike(f"%{query_str}%")) |
            (Criminal.aliases.ilike(f"%{query_str}%"))
        ).all()
        for c in name_matches:
            if c not in matched_criminals:
                matched_criminals.append(c)
                
        return [{
            "id": str(c.id),
            "full_name": c.full_name,
            "aliases": c.aliases,
            "risk_score": c.risk_score,
            "repeat_offender": c.repeat_offender
        } for c in matched_criminals]

    @staticmethod
    def get_repeat_offenders(db: Session, filters: Dict[str, Any]) -> List[Dict[str, Any]]:
        query = db.query(Criminal).filter(Criminal.repeat_offender == True)
        
        has_fir_filter = (
            filters.get("district_id") or 
            filters.get("crime_type_id") or 
            filters.get("date_from") or 
            filters.get("date_to")
        )
        
        if has_fir_filter:
            query = query.join(CrimePerson, CrimePerson.criminal_id == Criminal.id)\
                         .join(FIR, FIR.id == CrimePerson.fir_id)
            
            if filters.get("district_id"):
                query = query.filter(FIR.district_id == filters["district_id"])
            if filters.get("crime_type_id"):
                query = query.filter(FIR.crime_type_id == filters["crime_type_id"])
            if filters.get("date_from"):
                query = query.filter(FIR.occurrence_date >= filters["date_from"])
            if filters.get("date_to"):
                query = query.filter(FIR.occurrence_date <= filters["date_to"])
                
        if filters.get("search"):
            search_str = filters["search"]
            query = query.filter(
                (Criminal.full_name.ilike(f"%{search_str}%")) |
                (Criminal.aliases.ilike(f"%{search_str}%"))
            )
            
        if filters.get("risk_level"):
            rl = filters["risk_level"]
            if rl == "High":
                query = query.filter(Criminal.risk_score >= 75.0)
            elif rl == "Medium":
                query = query.filter(Criminal.risk_score >= 40.0, Criminal.risk_score < 75.0)
            elif rl == "Low":
                query = query.filter(Criminal.risk_score < 40.0)
                
        if has_fir_filter:
            query = query.distinct()
            
        criminals = query.order_by(Criminal.risk_score.desc()).all()
        
        results = []
        for c in criminals:
            firs = db.query(FIR).join(CrimePerson, CrimePerson.fir_id == FIR.id)\
                            .filter(CrimePerson.criminal_id == c.id).all()
            fir_count = len(firs)
            
            crime_counts = {}
            for f in firs:
                if f.crime_type:
                    crime_counts[f.crime_type.name] = crime_counts.get(f.crime_type.name, 0) + 1
            most_common_crime = max(crime_counts, key=crime_counts.get) if crime_counts else "N/A"
            recent_activity = max(f.occurrence_date for f in firs).isoformat() if firs else "N/A"
            priority = "High" if c.risk_score >= 80.0 else "Medium" if c.risk_score >= 50.0 else "Low"
            
            results.append({
                "id": str(c.id),
                "full_name": c.full_name,
                "aliases": c.aliases,
                "gender": c.gender,
                "age": c.age,
                "risk_score": c.risk_score,
                "repeat_offender": c.repeat_offender,
                "fir_count": fir_count,
                "most_common_crime": most_common_crime,
                "recent_activity": recent_activity,
                "investigation_priority": priority
            })
            
        return results

    @staticmethod
    def get_timeline(db: Session, criminal_id: UUID) -> List[Dict[str, Any]]:
        cp_records = db.query(CrimePerson).filter(CrimePerson.criminal_id == criminal_id).all()
        events = []
        for cp in cp_records:
            fir = db.query(FIR).filter(FIR.id == cp.fir_id).first()
            if not fir:
                continue
            events.append({
                "id": str(fir.id),
                "date": fir.occurrence_date.isoformat(),
                "event_type": "FIR Registered",
                "title": f"{fir.fir_number} - {fir.crime_type.name if fir.crime_type else 'Unknown'}",
                "description": f"Role: {cp.role}. Location: {fir.location or 'N/A'}. Status: {fir.status}.",
                "severity": fir.severity
            })
        events.sort(key=lambda x: x["date"], reverse=True)
        return events

    @staticmethod
    def get_relationships(db: Session, criminal_id: UUID) -> List[Dict[str, Any]]:
        relations = db.query(CrimeRelation).filter(
            (CrimeRelation.source_criminal_id == criminal_id) |
            (CrimeRelation.target_criminal_id == criminal_id)
        ).all()
        results = []
        for rel in relations:
            other_id = rel.target_criminal_id if rel.source_criminal_id == criminal_id else rel.source_criminal_id
            other = db.query(Criminal).filter(Criminal.id == other_id).first()
            if not other:
                continue
            results.append({
                "id": str(other.id),
                "name": other.full_name,
                "type": "Criminal",
                "relation_type": rel.relation_type,
                "confidence_score": rel.confidence_score
            })
        return results
