import subprocess
import time
import urllib.request
import urllib.error
import json
import sys
import traceback

def run_tests():
    print("Starting FastAPI server for CrimeMind AI integration tests...")
    # Using port 8009 to avoid conflicts
    server_process = subprocess.Popen(
        ["./venv/bin/uvicorn", "app.main:app", "--port", "8009"]
    )
    
    url_base = "http://localhost:8009"
    
    # Wait for server to start
    print("Waiting for server to respond on port 8009...")
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
            ("/ai/chat", {"message": "Hello", "history": []}),
            ("/ai/fir-summary", {"fir_id": "00000000-0000-0000-0000-000000000000"}),
            ("/ai/district-summary", {"district_id": "00000000-0000-0000-0000-000000000000"}),
            ("/ai/investigation", {"criminal_id": "00000000-0000-0000-0000-000000000000"}),
            ("/ai/trend-analysis", {})
        ]
        for path, body in protected_endpoints:
            try:
                req = urllib.request.Request(
                    f"{url_base}{path}",
                    data=json.dumps(body).encode(),
                    headers={"Content-Type": "application/json"}
                )
                urllib.request.urlopen(req)
                print(f"FAIL: {path} accessible without token")
                sys.exit(1)
            except urllib.error.HTTPError as e:
                assert e.code == 401
                print(f"OK: {path} correctly blocked (401)")

        # Fetch valid IDs from database via API
        print("\n--- Step 3: Fetching valid seeds from database API ---")
        
        # Districts
        req = urllib.request.Request(f"{url_base}/districts", headers={"Authorization": f"Bearer {admin_token}"})
        district_id = None
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert len(res["data"]) > 0
            district_id = res["data"][0]["id"]
            district_name = res["data"][0]["name"]
            print(f"Matched District: {district_name} ({district_id})")
            
        # Criminals
        req = urllib.request.Request(f"{url_base}/criminals?limit=1", headers={"Authorization": f"Bearer {admin_token}"})
        criminal_id = None
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            items = res["data"]["items"]
            assert len(items) > 0
            criminal_id = items[0]["id"]
            criminal_name = items[0]["full_name"]
            print(f"Matched Criminal: {criminal_name} ({criminal_id})")

        # FIRs
        req = urllib.request.Request(f"{url_base}/firs?limit=1", headers={"Authorization": f"Bearer {admin_token}"})
        fir_id = None
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            items = res["data"]["items"]
            assert len(items) > 0
            fir_id = items[0]["id"]
            fir_number = items[0]["fir_number"]
            print(f"Matched FIR: {fir_number} ({fir_id})")

        # Step 4: Test POST /ai/chat
        print("\n--- Step 4: Test POST /ai/chat (Conversational Inquiry) ---")
        chat_body = {
            "message": "Explain why Bengaluru Urban is high risk.",
            "history": [
                {"role": "user", "content": "Hello CrimeMind"},
                {"role": "assistant", "content": "Hello. I am CrimeMind AI. How can I assist your investigation today?"}
            ]
        }
        req = urllib.request.Request(
            f"{url_base}/ai/chat",
            data=json.dumps(chat_body).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            answer = res["data"]["response"]
            print("Chat Response length:", len(answer))
            assert "## Summary" in answer
            assert "## Key Findings" in answer
            assert "## Risk Assessment" in answer
            assert "## Recommendations" in answer
            assert "## Confidence Notes" in answer
            print("Chat response preview:\n", answer[:300] + "...")

        # Step 5: Test POST /ai/fir-summary
        print(f"\n--- Step 5: Test POST /ai/fir-summary for {fir_number} ---")
        summary_body = {"fir_id": fir_id}
        req = urllib.request.Request(
            f"{url_base}/ai/fir-summary",
            data=json.dumps(summary_body).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            summary = res["data"]["summary"]
            assert "## Summary" in summary
            assert "## Key Findings" in summary
            print("FIR summary generated successfully!")
            print("FIR summary preview:\n", summary[:300] + "...")

        # Step 6: Test POST /ai/district-summary
        print(f"\n--- Step 6: Test POST /ai/district-summary for {district_name} ---")
        district_body = {"district_id": district_id}
        req = urllib.request.Request(
            f"{url_base}/ai/district-summary",
            data=json.dumps(district_body).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            summary = res["data"]["summary"]
            assert "## Summary" in summary
            assert "## Key Findings" in summary
            print("District summary generated successfully!")
            print("District summary preview:\n", summary[:300] + "...")

        # Step 7: Test POST /ai/investigation
        print(f"\n--- Step 7: Test POST /ai/investigation for {criminal_name} ---")
        investigation_body = {"criminal_id": criminal_id}
        req = urllib.request.Request(
            f"{url_base}/ai/investigation",
            data=json.dumps(investigation_body).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            summary = res["data"]["summary"]
            assert "## Summary" in summary
            assert "## Key Findings" in summary
            print("Investigation recommendation summary generated successfully!")
            print("Investigation preview:\n", summary[:300] + "...")

        # Step 8: Test POST /ai/trend-analysis
        print("\n--- Step 8: Test POST /ai/trend-analysis ---")
        trend_body = {"district_id": district_id}
        req = urllib.request.Request(
            f"{url_base}/ai/trend-analysis",
            data=json.dumps(trend_body).encode(),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {admin_token}"}
        )
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            summary = res["data"]["summary"]
            assert "## Summary" in summary
            assert "## Key Findings" in summary
            print("Trend analysis summary generated successfully!")
            print("Trend analysis preview:\n", summary[:300] + "...")

        print("\nALL CRIMEMIND AI BACKEND TESTS PASSED SUCCESSFULLY!")

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
