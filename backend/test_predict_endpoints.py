import subprocess
import time
import urllib.request
import urllib.error
import json
import sys
import traceback

def run_tests():
    print("Starting FastAPI server for ML Predictive Analytics integration tests...")
    # Using port 8011 to avoid conflicts
    server_process = subprocess.Popen(
        ["./venv/bin/uvicorn", "app.main:app", "--port", "8011"]
    )
    
    url_base = "http://localhost:8011"
    
    # Wait for server to start
    print("Waiting for server to respond on port 8011...")
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

        # Step 2: Verify JWT protection
        print("\n--- Step 2: Verify JWT Authorization Protection ---")
        protected_endpoints = [
            ("/ml/train", "POST", {}),
            ("/predict/model-status", "GET", None),
            ("/predict/hotspot", "POST", {"district_id": "00000000-0000-0000-0000-000000000000", "month": 6, "year": 2026}),
            ("/predict/risk", "POST", {"age": 30, "gender": "Male", "past_fir_count": 2, "avg_severity": 3.0}),
            ("/predict/trend", "POST", {"months_ahead": 6}),
            ("/predict/anomaly", "POST", {"latitude": 12.9716, "longitude": 77.5946, "severity": 3.0, "month": 6, "day_of_week": 0})
        ]
        for path, method, body in protected_endpoints:
            try:
                data = json.dumps(body).encode() if body is not None else None
                req = urllib.request.Request(
                    f"{url_base}{path}",
                    data=data,
                    headers={"Content-Type": "application/json"} if data else {},
                    method=method
                )
                urllib.request.urlopen(req)
                print(f"FAIL: {path} accessible without token")
                sys.exit(1)
            except urllib.error.HTTPError as e:
                assert e.code == 401
                print(f"OK: {path} correctly blocked (401)")

        # Fetch valid District ID
        print("\n--- Step 3: Fetching valid district from database API ---")
        req = urllib.request.Request(f"{url_base}/districts", headers={"Authorization": f"Bearer {admin_token}"})
        district_id = None
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert len(res["data"]) > 0
            district_id = res["data"][0]["id"]
            district_name = res["data"][0]["name"]
            print(f"Matched District for hotspot predict: {district_name} ({district_id})")

        # Step 4: Retrain Models via POST /ml/train
        print("\n--- Step 4: Triggering model training pipeline ---")
        req = urllib.request.Request(
            f"{url_base}/ml/train",
            data=b"{}",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"},
            method="POST"
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            print("Model training returned successfully! Metadata:")
            print(json.dumps(res["data"], indent=2))

        # Step 5: Test GET /predict/model-status
        print("\n--- Step 5: Getting model status ---")
        req = urllib.request.Request(
            f"{url_base}/predict/model-status",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            assert res["data"]["status"] == "Ready"
            print("Status loaded successfully. Last training:", res["data"]["last_training_date"])

        # Step 6: Test POST /predict/hotspot
        print(f"\n--- Step 6: Testing hotspot prediction for {district_name} ---")
        hotspot_body = {
            "district_id": district_id,
            "month": 8,
            "year": 2026
        }
        req = urllib.request.Request(
            f"{url_base}/predict/hotspot",
            data=json.dumps(hotspot_body).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            assert "predicted_crime_count" in data
            assert "hotspot_score" in data
            assert "risk_level" in data
            print("Hotspot result:", data)

        # Step 7: Test POST /predict/risk
        print("\n--- Step 7: Testing risk recidivism scoring ---")
        risk_body = {
            "age": 28,
            "gender": "Male",
            "past_fir_count": 3,
            "avg_severity": 4.2
        }
        req = urllib.request.Request(
            f"{url_base}/predict/risk",
            data=json.dumps(risk_body).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            assert "risk_score" in data
            assert "risk_level" in data
            print("Risk result:", data)

        # Step 8: Test POST /predict/trend
        print("\n--- Step 8: Testing trend forecasting ---")
        trend_body = {"months_ahead": 6}
        req = urllib.request.Request(
            f"{url_base}/predict/trend",
            data=json.dumps(trend_body).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            assert len(data) == 6
            assert "predicted_crime_count" in data[0]
            print("Trend forecast sample:", data[0])

        # Step 9: Test POST /predict/anomaly
        print("\n--- Step 9: Testing anomaly detection ---")
        anomaly_body = {
            "latitude": 12.9716,
            "longitude": 77.5946,
            "severity": 4.5,
            "month": 11,
            "day_of_week": 6 # Sunday
        }
        req = urllib.request.Request(
            f"{url_base}/predict/anomaly",
            data=json.dumps(anomaly_body).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            assert "is_anomaly" in data
            assert "anomaly_index" in data
            print("Anomaly check result:", data)

        print("\nALL PREDICTIVE ML ENDPOINTS PASSED SUCCESSFULLY!")

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
