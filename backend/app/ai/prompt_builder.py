class PromptBuilder:
    @staticmethod
    def get_system_prompt() -> str:
        return (
            "You are CrimeMind AI, the expert digital investigation copilot for the Karnataka State Police (KSP).\n"
            "Your role is to analyze crime datasets, FIR records, criminal histories, and geospatial trends to assist investigators.\n"
            "Always maintain a professional, objective, and analytical tone. Focus on actionable insights.\n"
            "Formatting Rules:\n"
            "Structure your output using the following markdown headers:\n"
            "## Summary\n"
            "## Key Findings\n"
            "## Risk Assessment\n"
            "## Recommendations\n"
            "## Confidence Notes\n"
            "If the requested data or context is unavailable, explicitly state that in the findings and do not hallucinate."
        )

    @staticmethod
    def build_chat_prompt(history: list, new_message: str, context: str = "") -> str:
        prompt = f"System Instruction: {PromptBuilder.get_system_prompt()}\n\n"
        if context:
            prompt += f"--- DATABASE CONTEXT ---\n{context}\n------------------------\n\n"
        
        prompt += "Conversation History:\n"
        for msg in history:
            role = "Investigator" if msg.get("role") == "user" else "CrimeMind AI"
            prompt += f"{role}: {msg.get('content')}\n"
        
        prompt += f"Investigator: {new_message}\n"
        prompt += "CrimeMind AI (Provide response in the required markdown format):"
        return prompt

    @staticmethod
    def build_fir_prompt(fir_data: dict) -> str:
        return (
            f"Please analyze and summarize the following FIR record:\n\n"
            f"FIR Number: {fir_data.get('fir_number')}\n"
            f"Date Registered: {fir_data.get('date_registered')}\n"
            f"District: {fir_data.get('district_name')}\n"
            f"Crime Type: {fir_data.get('crime_type_name')} (IPC: {fir_data.get('ipc_sections')})\n"
            f"Status: {fir_data.get('status')}\n"
            f"Location: {fir_data.get('location')}\n"
            f"Description: {fir_data.get('description')}\n"
            f"Accused Individuals: {', '.join(fir_data.get('accused', ['None']))}\n"
            f"Victims: {', '.join(fir_data.get('victims', ['None']))}\n"
            f"Linked Phone Numbers: {', '.join(fir_data.get('phones', ['None']))}\n"
            f"Linked Vehicles: {', '.join(fir_data.get('vehicles', ['None']))}\n"
            f"Linked Addresses: {', '.join(fir_data.get('addresses', ['None']))}\n\n"
            "Please provide a structured summary including analysis, suspect links, risk rating, and next actions."
        )

    @staticmethod
    def build_district_prompt(district_data: dict) -> str:
        trend_str = "\n".join([f"- {t['month']}: {t['count']} incidents" for t in district_data.get("trend", [])])
        crime_types_str = "\n".join([f"- {c['category']}: {c['count']} incidents" for c in district_data.get("top_crime_types", [])])
        recent_incidents_str = "\n".join([f"- FIR {r['fir_number']} ({r['crime_type']}): Status {r['status']}" for r in district_data.get("recent_incidents", [])])
        
        return (
            f"Please provide an intelligence summary for the district: {district_data.get('district_name')}\n\n"
            f"Total Incidents: {district_data.get('crime_count')}\n"
            f"Active Repeat Offenders: {district_data.get('repeat_offenders')}\n"
            f"Geospatial Hotspot Score: {district_data.get('hotspot_score')} / 100\n"
            f"Average Offender Risk Score: {district_data.get('average_risk_score')} / 100\n"
            f"Top Crime Category: {district_data.get('top_crime_category')}\n\n"
            f"Recent Monthly Trend:\n{trend_str}\n\n"
            f"Top Crime Types:\n{crime_types_str}\n\n"
            f"Recent Cases Registered:\n{recent_incidents_str}\n\n"
            "Please provide a structured regional security assessment and patrolling recommendations."
        )

    @staticmethod
    def build_trend_prompt(trend_data: list) -> str:
        trend_lines = "\n".join([f"- Month: {t['month']}, Crime Count: {t['count']}, Severity Index: {t.get('severity_index', 'N/A')}" for t in trend_data])
        return (
            f"Analyze the following crime trend data over the past months:\n\n"
            f"{trend_lines}\n\n"
            "Please explain the underlying patterns, potential seasonal variations, acceleration or deceleration of activity, and tactical recommendations to curb these trends."
        )

    @staticmethod
    def build_investigation_prompt(criminal_data: dict) -> str:
        assoc_str = "\n".join([f"- {a['name']} ({a['relation_type']}) - Confidence: {a['confidence_score']}" for a in criminal_data.get("associates", [])])
        timeline_str = "\n".join([f"- {t['date']}: {t['title']} ({t['description']})" for t in criminal_data.get("timeline", [])])
        
        return (
            f"Analyze the profile and network of the following repeat offender for investigation planning:\n\n"
            f"Name: {criminal_data.get('full_name')} (Aliases: {criminal_data.get('aliases')})\n"
            f"Age/Gender: {criminal_data.get('age')} / {criminal_data.get('gender')}\n"
            f"Risk Score: {criminal_data.get('risk_score')} / 100\n"
            f"Repeat Offender Status: {criminal_data.get('repeat_offender')}\n\n"
            f"Direct Network Associates:\n{assoc_str}\n\n"
            f"History of Offences:\n{timeline_str}\n\n"
            "Please provide next-step investigative tasks, syndicates warning indicators, and link-analysis targets."
        )
