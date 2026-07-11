import subprocess
import time
import urllib.request
import urllib.error
import json
import sys
import traceback

def run_tests():
    print("Starting FastAPI server for heatmap endpoint integration tests...")
    server_process = subprocess.Popen(
        ["./venv/bin/uvicorn", "app.main:app", "--port", "8007"]
    )
    
    url_base = "http://localhost:8007"
    
    # Wait for server to start
    print("Waiting for server to respond on port 8007...")
    for i in range(30):
        try:
            with urllib.request.urlopen(f"{url_base}/api/health", timeout=1) as r:
                if r.status == 200:
                    print("Server is up and healthy!")
                    break
        except Exception:
            time.sleep(0.5)
    else:
        print("Server failed to respond in time.")
        server_process.terminate()
        sys.exit(1)
        
    admin_token = None
    
    try:
        # Step 1: Login
        print("\n--- Step 1: Login Admin ---")
        req = urllib.request.Request(
            f"{url_base}/auth/login",
            data=json.dumps({"username": "admin", "password": "password123"}).encode(),
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            admin_token = res["access_token"]
            print("Admin logged in successfully.")

        # Step 2: Verify protection
        print("\n--- Step 2: Verify JWT Authorization Protection ---")
        protected_endpoints = [
            "/heatmap",
            "/heatmap/hotspots"
        ]
        for ep in protected_endpoints:
            try:
                urllib.request.urlopen(f"{url_base}{ep}")
                print(f"FAIL: {ep} accessible without token")
                sys.exit(1)
            except urllib.error.HTTPError as e:
                assert e.code == 401
                print(f"OK: {ep} correctly blocked (401)")

        # Step 3: Test GET /heatmap
        print("\n--- Step 3: Test GET /heatmap incident coordinates ---")
        req = urllib.request.Request(f"{url_base}/heatmap", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            print(f"Retrieved {len(data)} crime coordinate points.")
            if len(data) > 0:
                first_point = data[0]
                assert "id" in first_point
                assert "fir_number" in first_point
                assert "latitude" in first_point
                assert "longitude" in first_point
                assert "crime_type_name" in first_point
                assert "severity" in first_point
                assert "status" in first_point
                assert isinstance(first_point["latitude"], float)
                assert isinstance(first_point["longitude"], float)
                print("First point validation:", first_point)

        # Step 4: Test GET /heatmap/hotspots
        print("\n--- Step 4: Test GET /heatmap/hotspots district statistics ---")
        req = urllib.request.Request(f"{url_base}/heatmap/hotspots", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            print(f"Retrieved hotspots for {len(data)} districts.")
            assert len(data) == 31  # Should have all 31 districts
            
            first_district = data[0]
            assert "district_id" in first_district
            assert "district_name" in first_district
            assert "hotspot_score" in first_district
            assert "risk_level" in first_district
            assert "crime_count" in first_district
            assert "average_risk_score" in first_district
            assert "top_crime_category" in first_district
            assert "recent_fir_count" in first_district
            assert isinstance(first_district["hotspot_score"], float)
            print("First hotspot validation:", first_district)

        # Retrieve a district ID for drilldown test
        district_id = first_district["district_id"]
        district_name = first_district["district_name"]

        # Step 5: Test GET /heatmap/districts/{id}/statistics
        print(f"\n--- Step 5: Test GET /heatmap/districts/{{id}}/statistics for {district_name} ---")
        req = urllib.request.Request(f"{url_base}/heatmap/districts/{district_id}/statistics", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            assert data["district_id"] == district_id
            assert data["district_name"] == district_name
            assert "crime_count" in data
            assert "top_crime_category" in data
            assert "repeat_offenders" in data
            assert "average_risk_score" in data
            assert "hotspot_score" in data
            assert "trend" in data
            assert "top_crime_types" in data
            assert "recent_incidents" in data
            print(f"Drilldown stats successfully retrieved for {district_name}!")
            print("Trend months returned:", [t["month"] for t in data["trend"]])
            print("Top crime categories:", [c["category"] for c in data["top_crime_types"]])
            print("Recent incidents count:", len(data["recent_incidents"]))

        print("\nALL GEOSPATIAL HEATMAP BACKEND TESTS PASSED SUCCESSFULLY!")

    except Exception as e:
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
