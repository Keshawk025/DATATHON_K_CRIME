import sys
import os
from sqlalchemy import inspect
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from app.database.session import engine, SessionLocal
from app.models.models import *

def inspect_db():
    inspector = inspect(engine)
    print("Tables in database:")
    for table_name in inspector.get_table_names():
        print(f"\nTable: {table_name}")
        for column in inspector.get_columns(table_name):
            print(f"  Column: {column['name']} ({column['type']})")
            
    db = SessionLocal()
    try:
        print("\nRecord Counts:")
        for model in [User, District, CrimeType, FIR, Criminal, Victim, CrimePerson, Vehicle, Phone, Address, CrimeRelation, Alert, Prediction, AIInsight, Report]:
            count = db.query(model).count()
            print(f"  {model.__name__}: {count}")
    except Exception as e:
        print(f"Error querying: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    inspect_db()
