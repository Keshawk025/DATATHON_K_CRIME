import re
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any

from app.models.models import FIR, Criminal, District, CrimeType, CrimePerson, CrimeRelation
from app.ai.gemini_service import GeminiService
from app.ai.prompt_builder import PromptBuilder

class ChatService:
    @staticmethod
    def process_chat(db: Session, message: str, history: List[Dict[str, Any]]) -> str:
        # 1. Retrieve structured database context based on keyword analysis
        context = ChatService._retrieve_context(db, message)
        
        # 2. Build full prompt with history and context
        full_prompt = PromptBuilder.build_chat_prompt(history, message, context)
        
        # 3. Call Gemini API
        response_text = GeminiService.generate_content(full_prompt)
        return response_text

    @staticmethod
    def _retrieve_context(db: Session, message: str) -> str:
        msg_lower = message.lower()
        context_parts = []

        # Case A: Check for FIR number (e.g., FIR 2026-0001, FIR/2026/0002)
        fir_match = re.search(r'fir[-/\s]*([0-9a-zA-Z]+)', msg_lower)
        if fir_match:
            term = fir_match.group(0).strip()
            # Normalize to database format if needed
            # Search database
            firs = db.query(FIR).all()
            matched_fir = None
            for f in firs:
                # Compare stripped versions
                norm_f = f.fir_number.lower().replace('/', '').replace('-', '').replace(' ', '')
                norm_term = term.lower().replace('/', '').replace('-', '').replace(' ', '')
                if norm_term in norm_f or norm_f in norm_term:
                    matched_fir = f
                    break
            
            if matched_fir:
                district = db.query(District).filter(District.id == matched_fir.district_id).first()
                crime_type = db.query(CrimeType).filter(CrimeType.id == matched_fir.crime_type_id).first()
                
                context_parts.append(
                    f"FIR RECORD MATCHED:\n"
                    f"- FIR Number: {matched_fir.fir_number}\n"
                    f"- Date Registered: {matched_fir.date_registered}\n"
                    f"- District: {district.name if district else 'Unknown'}\n"
                    f"- Category: {crime_type.name if crime_type else 'Unknown'} (IPC: {crime_type.ipc_sections if crime_type else 'N/A'})\n"
                    f"- Location: {matched_fir.location} (Lat: {matched_fir.latitude}, Lon: {matched_fir.longitude})\n"
                    f"- Status: {matched_fir.status}\n"
                    f"- Description: {matched_fir.description}\n"
                )

        # Case B: Check for Criminal Name (e.g., Somesh, Ketan, Vikram)
        criminals = db.query(Criminal).all()
        matched_criminal = None
        for c in criminals:
            if c.full_name.lower() in msg_lower or any(alias.strip().lower() in msg_lower for alias in (c.aliases or "").split(",") if alias.strip()):
                matched_criminal = c
                break
        
        if matched_criminal:
            # Fetch relationships
            rels = db.query(CrimeRelation).filter(
                (CrimeRelation.criminal_id == matched_criminal.id) | 
                (CrimeRelation.associate_id == matched_criminal.id)
            ).all()
            
            rel_list = []
            for r in rels:
                other_id = r.associate_id if r.criminal_id == matched_criminal.id else r.criminal_id
                other_c = db.query(Criminal).filter(Criminal.id == other_id).first()
                if other_c:
                    rel_list.append(f"{other_c.full_name} ({r.relation_type}, Confidence: {r.confidence_score})")
            
            context_parts.append(
                f"CRIMINAL PROFILE MATCHED:\n"
                f"- Name: {matched_criminal.full_name} (Aliases: {matched_criminal.aliases})\n"
                f"- Age/Gender: {matched_criminal.age} / {matched_criminal.gender}\n"
                f"- Risk Score: {matched_criminal.risk_score} / 100\n"
                f"- Repeat Offender: {matched_criminal.repeat_offender}\n"
                f"- Mapped Associates: {', '.join(rel_list) if rel_list else 'None documented'}\n"
            )

        # Case C: Check for District Names (e.g., Bengaluru, Mysuru)
        districts = db.query(District).all()
        matched_district = None
        for d in districts:
            if d.name.lower() in msg_lower:
                matched_district = d
                break
                
        if matched_district:
            # Query crime count
            fir_count = db.query(func.count(FIR.id)).filter(FIR.district_id == matched_district.id).scalar()
            context_parts.append(
                f"DISTRICT METRICS MATCHED:\n"
                f"- District Name: {matched_district.name}\n"
                f"- District Code: {matched_district.code}\n"
                f"- Coordinates: Lat {matched_district.latitude}, Lon {matched_district.longitude}\n"
                f"- Registered FIR Count: {fir_count}\n"
            )

        # If no specific matches, query general system KPIs for general intelligence context
        if not context_parts:
            total_firs = db.query(func.count(FIR.id)).scalar()
            repeat_offenders_count = db.query(func.count(Criminal.id)).filter(Criminal.repeat_offender == True).scalar()
            avg_risk = db.query(func.avg(Criminal.risk_score)).filter(Criminal.repeat_offender == True).scalar()
            
            context_parts.append(
                f"GENERAL KSP PORTAL METRICS:\n"
                f"- Total Database FIRs: {total_firs}\n"
                f"- Total Tracked Repeat Offenders: {repeat_offenders_count}\n"
                f"- Average Repeat Offender Risk Score: {round(avg_risk, 1) if avg_risk else 0} / 100\n"
            )

        return "\n\n".join(context_parts)
