import subprocess
import time
import urllib.request
import urllib.error
import json
import sys
import traceback

def run_tests():
    print("Starting FastAPI server for dashboard analytics tests...")
    server_process = subprocess.Popen(
        ["./venv/bin/uvicorn", "app.main:app", "--port", "8006"]
    )
    
    url_base = "http://localhost:8006"
    
    # Wait for server to start
    print("Waiting for server to respond on port 8006...")
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

        # Step 2: Test JWT Protection on new endpoints
        print("\n--- Step 2: Test JWT Protection ---")
        protected_endpoints = [
            "/dashboard/summary",
            "/dashboard/trends",
            "/dashboard/distribution",
            "/dashboard/district-ranking",
            "/dashboard/kpis",
            "/dashboard/recent-activity"
        ]
        for ep in protected_endpoints:
            try:
                urllib.request.urlopen(f"{url_base}{ep}")
                print(f"FAIL: {ep} accessed without token")
                sys.exit(1)
            except urllib.error.HTTPError as e:
                assert e.code == 401
                print(f"OK: {ep} correctly blocked (401)")

        # Retrieve reference ids to test filters
        districts_req = urllib.request.Request(f"{url_base}/districts", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(districts_req) as resp:
            districts = json.loads(resp.read().decode())["data"]
            bengaluru_id = next(d["id"] for d in districts if d["name"] == "Bengaluru Urban")
            mysuru_id = next(d["id"] for d in districts if d["name"] == "Mysuru")
            print(f"Retrieved reference districts (Bengaluru: {bengaluru_id}, Mysuru: {mysuru_id})")

        crime_types_req = urllib.request.Request(f"{url_base}/crime-types", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(crime_types_req) as resp:
            crime_types = json.loads(resp.read().decode())["data"]
            cyber_id = next(c["id"] for c in crime_types if "Cyber" in c["name"])
            theft_id = next(c["id"] for c in crime_types if "Theft" in c["name"])
            print(f"Retrieved reference crime categories (Cyber: {cyber_id}, Theft: {theft_id})")

        # Step 3: Test GET /dashboard/summary with/without filters
        print("\n--- Step 3: Test Dashboard Summary ---")
        # 3.1 Unfiltered
        req = urllib.request.Request(f"{url_base}/dashboard/summary", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            print("Unfiltered Summary Data:", data)
            assert data["total_crimes"] == 6
            assert data["active_cases"] == 4
            assert data["solved_cases"] == 2
            assert data["repeat_offenders"] == 3
            assert data["high_risk_districts"] == 1
            print("Unfiltered Summary assertion PASSED")

        # 3.2 Filtered by District (Bengaluru Urban)
        req = urllib.request.Request(
            f"{url_base}/dashboard/summary?district={bengaluru_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            data = res["data"]
            print("Bengaluru Urban Summary Data:", data)
            assert data["total_crimes"] == 3
            assert data["active_cases"] == 2
            assert data["solved_cases"] == 1
            print("District filtering on summary PASSED")

        # 3.3 Filtered by Crime Type (Cyber Crime)
        req = urllib.request.Request(
            f"{url_base}/dashboard/summary?crime_type={cyber_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            data = res["data"]
            print("Cyber Crime Summary Data:", data)
            assert data["total_crimes"] == 2
            print("Crime type filtering on summary PASSED")

        # 3.4 Filtered by Severity and Status
        req = urllib.request.Request(
            f"{url_base}/dashboard/summary?severity=3&status=Under Investigation",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            data = res["data"]
            print("Severity=3 & Status=Under Investigation Summary Data:", data)
            assert data["total_crimes"] == 1
            print("Multi-parameter filtering on summary PASSED")

        # 3.5 Filtered by Date Range (date_from & date_to)
        req = urllib.request.Request(
            f"{url_base}/dashboard/summary?date_from=2026-01-01&date_to=2026-03-31",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            data = res["data"]
            print("Date range 2026-01-01 to 2026-03-31 Summary Data:", data)
            assert data["total_crimes"] == 3
            print("Date range filtering on summary PASSED")

        # Step 4: Test GET /dashboard/trends
        print("\n--- Step 4: Test Dashboard Trends ---")
        req = urllib.request.Request(f"{url_base}/dashboard/trends", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            assert "yearly" in data
            assert "monthly" in data
            assert "weekly" in data
            assert "daily" in data
            print("Trends keys verification PASSED")
            print("Monthly Trend data:", data["monthly"])
            assert len(data["monthly"]) == 6

        # Step 5: Test GET /dashboard/distribution
        print("\n--- Step 5: Test Dashboard Distributions ---")
        req = urllib.request.Request(f"{url_base}/dashboard/distribution", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            assert "category_distribution" in data
            assert "severity_distribution" in data
            assert "status_distribution" in data
            assert "gender_distribution" in data
            assert "repeat_offender_distribution" in data
            print("Distributions keys verification PASSED")
            print("Category Distribution:", data["category_distribution"])
            print("Repeat Offender Distribution:", data["repeat_offender_distribution"])
            assert any(x["status"] == "Repeat Offender" and x["count"] > 0 for x in data["repeat_offender_distribution"])

        # Step 6: Test GET /dashboard/district-ranking
        print("\n--- Step 6: Test District Rankings ---")
        req = urllib.request.Request(f"{url_base}/dashboard/district-ranking", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            assert len(data) == 31  # 31 districts
            print("First few district rankings:")
            for item in data[:3]:
                print(f" - {item['district_name']}: {item['crime_count']} crimes, Top type: {item['top_crime_type']}, Avg Risk: {item['average_risk_score']}, Repeat Off: {item['repeat_offender_count']}")
            # Bengaluru Urban should be first as it has 3 crimes, Mysuru second (2 crimes), Belagavi third (1 crime)
            assert data[0]["district_name"] == "Bengaluru Urban"
            assert data[0]["crime_count"] == 3
            assert data[1]["district_name"] == "Mysuru"
            assert data[1]["crime_count"] == 2
            assert data[2]["district_name"] == "Belagavi"
            assert data[2]["crime_count"] == 1
            print("District rankings ordering and metrics compilation PASSED")

        # Step 7: Test GET /dashboard/kpis
        print("\n--- Step 7: Test Dashboard KPIs ---")
        req = urllib.request.Request(f"{url_base}/dashboard/kpis", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            print("KPIs Data:", data)
            # Ensure all 10 KPI keys exist
            kpi_keys = [
                "total_crimes", "active_cases", "solved_cases", "repeat_offenders", "high_risk_districts",
                "total_districts", "total_crime_categories", "crimes_today", "crimes_this_week", "crimes_this_month"
            ]
            for key in kpi_keys:
                assert key in data
            assert data["total_districts"] == 31
            assert data["total_crime_categories"] == 15
            print("All 10 KPI keys verified and static count checks PASSED")

        # Step 8: Test GET /dashboard/recent-activity
        print("\n--- Step 8: Test Recent Activity ---")
        req = urllib.request.Request(f"{url_base}/dashboard/recent-activity?limit=3", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            print("Recent Activities count:", len(data))
            assert len(data) == 3
            # Check sorting (latest FIR date first, e.g. 2026-06-22 then 2026-05-12, etc.)
            assert data[0]["occurrence_date"] == "2026-06-22"
            assert data[1]["occurrence_date"] == "2026-05-12"
            assert data[2]["occurrence_date"] == "2026-04-18"
            print("Recent activities sorting and count limits PASSED")

        # Step 9: Test Swagger Spec
        print("\n--- Step 9: Test Swagger Spec ---")
        req = urllib.request.Request(f"{url_base}/openapi.json")
        with urllib.request.urlopen(req) as resp:
            schema = json.loads(resp.read().decode())
            paths = schema["paths"]
            assert "/dashboard/summary" in paths
            assert "/dashboard/trends" in paths
            assert "/dashboard/distribution" in paths
            assert "/dashboard/district-ranking" in paths
            assert "/dashboard/kpis" in paths
            assert "/dashboard/recent-activity" in paths
            print("Swagger OpenAPI registration verified successfully.")

        print("\nALL ANALYTICS ENGINE & DASHBOARD BACKEND TESTS PASSED SUCCESSFULLY!")

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
