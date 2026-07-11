import subprocess
import time
import urllib.request
import urllib.error
import json
import sys

def run_tests():
    print("Starting FastAPI server...")
    server_process = subprocess.Popen(
        ["./venv/bin/uvicorn", "app.main:app", "--port", "8005"]
    )
    
    # Wait for server to start
    time.sleep(3)
    
    url_base = "http://localhost:8005"
    admin_token = None
    officer_token = None
    analyst_token = None
    
    try:
        # Step 1: Login to get tokens for different roles
        print("\n--- Logging in users ---")
        
        # 1. Admin
        req = urllib.request.Request(
            f"{url_base}/auth/login",
            data=json.dumps({"username": "admin", "password": "password123"}).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            admin_token = res["access_token"]
            print("Admin logged in.")
            
        # 2. Officer
        req = urllib.request.Request(
            f"{url_base}/auth/login",
            data=json.dumps({"username": "officer1", "password": "password123"}).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            officer_token = res["access_token"]
            print("Investigation Officer logged in.")

        # 3. Analyst
        req = urllib.request.Request(
            f"{url_base}/auth/login",
            data=json.dumps({"username": "analyst1", "password": "password123"}).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            analyst_token = res["access_token"]
            print("Crime Analyst logged in.")

        # Step 2: Test JWT protection
        print("\n--- Test: JWT Protection ---")
        try:
            urllib.request.urlopen(f"{url_base}/dashboard")
            print("FAIL: dashboard accessed without JWT")
            sys.exit(1)
        except urllib.error.HTTPError as e:
            assert e.code == 401
            print("OK: JWT protection works on dashboard")

        # Step 3: Test Dashboard API
        print("\n--- Test: Dashboard API ---")
        req = urllib.request.Request(f"{url_base}/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            print(f"Dashboard Summary: {res}")
            assert res["success"] is True
            assert "total_crimes" in res["data"]
            assert res["data"]["total_crimes"] > 0
            
        req = urllib.request.Request(f"{url_base}/dashboard/trends", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            print(f"Dashboard Trends: {res}")
            assert res["success"] is True
            
        req = urllib.request.Request(f"{url_base}/dashboard/categories", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            print(f"Dashboard Categories: {res}")
            assert res["success"] is True

        # Step 4: Test Districts API
        print("\n--- Test: Districts API ---")
        req = urllib.request.Request(f"{url_base}/districts", headers={"Authorization": f"Bearer {admin_token}"})
        districts = []
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            districts = res["data"]
            print(f"Retrieved {len(districts)} districts.")
            assert len(districts) == 31
            
        district_id = districts[0]["id"]
        req = urllib.request.Request(f"{url_base}/districts/{district_id}", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            assert res["data"]["id"] == district_id
            print("Single District detail retrieval PASSED.")
            
        req = urllib.request.Request(f"{url_base}/districts/{district_id}/statistics", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            assert "total_crimes" in res["data"]
            print(f"District statistics retrieval PASSED: {res['data']}")

        # Step 5: Test Crime Types API
        print("\n--- Test: Crime Types API ---")
        req = urllib.request.Request(f"{url_base}/crime-types", headers={"Authorization": f"Bearer {admin_token}"})
        crime_types = []
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            crime_types = res["data"]
            print(f"Retrieved {len(crime_types)} crime categories.")
            assert len(crime_types) == 15

        # Step 6: Test FIR CRUD Operations
        print("\n--- Test: FIR CRUD & Parameters ---")
        # 1. Paginated FIR Retrieval
        req = urllib.request.Request(f"{url_base}/firs?page=1&limit=2", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            assert len(res["data"]["items"]) == 2
            assert res["data"]["total"] >= 6
            print("FIR Pagination check PASSED")

        # 2. Filter & Search check
        req = urllib.request.Request(f"{url_base}/firs?search=phishing", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            assert len(res["data"]["items"]) == 1
            assert "phishing" in res["data"]["items"][0]["description"].lower()
            print("FIR Search check PASSED")

        # 3. Validation Check (severity 6 is invalid)
        bad_fir = {
            "fir_number": "FIR/2026/VALIDATE",
            "district_id": districts[0]["id"],
            "crime_type_id": crime_types[0]["id"],
            "occurrence_date": "2026-06-01",
            "reported_date": "2026-06-02",
            "latitude": "12.9716",
            "longitude": "77.5946",
            "location": "Test Area",
            "description": "Validation test",
            "status": "Open",
            "severity": 6
        }
        req = urllib.request.Request(
            f"{url_base}/firs",
            data=json.dumps(bad_fir).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"}
        )
        try:
            urllib.request.urlopen(req)
            print("FAIL: severity 6 was accepted")
            sys.exit(1)
        except urllib.error.HTTPError as e:
            print("HTTPError code:", e.code)
            print("HTTPError body:", e.read().decode())
            assert e.code == 422 or e.code == 400
            print("OK: Invalid severity validation failed as expected (422/400).")

        # 4. Create FIR (Admin/Officer role only)
        good_fir = bad_fir.copy()
        good_fir["severity"] = 4
        good_fir["fir_number"] = "FIR/2026/NEW01"
        req = urllib.request.Request(
            f"{url_base}/firs",
            data=json.dumps(good_fir).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {officer_token}"}
        )
        new_fir_id = None
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            assert res["data"]["fir_number"] == "FIR/2026/NEW01"
            new_fir_id = res["data"]["id"]
            print(f"FIR Creation PASSED (ID: {new_fir_id})")

        # 5. Role restriction: Analyst cannot create FIR
        req = urllib.request.Request(
            f"{url_base}/firs",
            data=json.dumps(good_fir).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {analyst_token}"}
        )
        try:
            urllib.request.urlopen(req)
            print("FAIL: Crime Analyst was allowed to create FIR")
            sys.exit(1)
        except urllib.error.HTTPError as e:
            assert e.code == 403
            print("OK: Analyst role restriction works for FIR creation (403)")

        # 6. Update FIR (Officer role)
        update_payload = {"status": "Solved"}
        req = urllib.request.Request(
            f"{url_base}/firs/{new_fir_id}",
            data=json.dumps(update_payload).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {officer_token}"},
            method="PUT"
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            assert res["data"]["status"] == "Solved"
            print("FIR Update check PASSED")

        # 7. Delete FIR (restricted to Admin, Officer should fail)
        req = urllib.request.Request(
            f"{url_base}/firs/{new_fir_id}",
            headers={"Authorization": f"Bearer {officer_token}"},
            method="DELETE"
        )
        try:
            urllib.request.urlopen(req)
            print("FAIL: Officer was allowed to delete FIR")
            sys.exit(1)
        except urllib.error.HTTPError as e:
            assert e.code == 403
            print("OK: Officer role restricted from deletion (403)")

        # Admin delete works
        req = urllib.request.Request(
            f"{url_base}/firs/{new_fir_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            method="DELETE"
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            print("FIR Deletion by Admin check PASSED")

        # Step 7: Test Criminals API
        print("\n--- Test: Criminals API ---")
        req = urllib.request.Request(f"{url_base}/criminals?page=1&limit=10", headers={"Authorization": f"Bearer {admin_token}"})
        criminals = []
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            criminals = res["data"]["items"]
            print(f"Retrieved {len(criminals)} criminals.")
            assert len(criminals) >= 5

        # Repeat offenders endpoint
        req = urllib.request.Request(f"{url_base}/criminals/repeat-offenders", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            repeat_offenders = res["data"]
            print(f"Retrieved {len(repeat_offenders)} repeat offenders.")
            assert all(x["repeat_offender"] is True for x in repeat_offenders)

        # Step 8: Test Alerts API
        print("\n--- Test: Alerts API ---")
        req = urllib.request.Request(f"{url_base}/alerts", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            alerts = res["data"]
            print(f"Retrieved {len(alerts)} alerts.")
            assert len(alerts) >= 3

        # Step 9: Test Swagger Spec
        print("\n--- Test: Swagger OpenAPI Schema ---")
        req = urllib.request.Request(f"{url_base}/openapi.json")
        with urllib.request.urlopen(req) as resp:
            schema = json.loads(resp.read().decode())
            assert "paths" in schema
            assert "/dashboard" in schema["paths"]
            assert "/firs" in schema["paths"]
            print("Swagger OpenAPI validation PASSED")

        print("\nALL CORE REST API INTEGRATION TESTS PASSED SUCCESSFULLY!")

    except Exception as e:
        import traceback
        print(f"Error during tests: {e}")
        traceback.print_exc()
        server_process.terminate()
        sys.exit(1)
    finally:
        print("Terminating FastAPI server...")
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    run_tests()
