import subprocess
import time
import urllib.request
import urllib.error
import json
import sys
import traceback

def run_tests():
    print("Starting FastAPI server for criminal network integration tests...")
    # Using port 8008 to avoid conflicts
    server_process = subprocess.Popen(
        ["./venv/bin/uvicorn", "app.main:app", "--port", "8008"]
    )
    
    url_base = "http://localhost:8008"
    
    # Wait for server to start
    print("Waiting for server to respond on port 8008...")
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
            "/network/search?query=Somesh",
            "/criminals/repeat-offenders/advanced"
        ]
        for ep in protected_endpoints:
            try:
                urllib.request.urlopen(f"{url_base}{ep}")
                print(f"FAIL: {ep} accessible without token")
                sys.exit(1)
            except urllib.error.HTTPError as e:
                assert e.code == 401
                print(f"OK: {ep} correctly blocked (401)")

        # Step 3: Test GET /network/search
        print("\n--- Step 3: Test GET /network/search (Criminal Search by Name) ---")
        req = urllib.request.Request(f"{url_base}/network/search?query=Somesh", headers={"Authorization": f"Bearer {admin_token}"})
        criminal_id = None
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            print(f"Search found {len(data)} matching criminals.")
            assert len(data) > 0
            first_match = data[0]
            assert "id" in first_match
            assert first_match["full_name"] == "Somesh Gowda"
            assert first_match["repeat_offender"] is True
            criminal_id = first_match["id"]
            print("First match validation:", first_match)

        # Step 4: Test GET /network/{criminal_id}
        print(f"\n--- Step 4: Test GET /network/{{criminal_id}} for Somesh Gowda ({criminal_id}) ---")
        req = urllib.request.Request(f"{url_base}/network/{criminal_id}", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            graph = res["data"]
            assert "nodes" in graph
            assert "edges" in graph
            print(f"Graph loaded with {len(graph['nodes'])} nodes and {len(graph['edges'])} edges.")
            
            # Verify node types
            node_types = set(n["data"]["type"] for n in graph["nodes"])
            print("Detected Node Types in Graph:", list(node_types))
            assert "criminal" in node_types
            assert "phone" in node_types
            assert "address" in node_types
            assert "vehicle" in node_types
            assert "victim" in node_types
            
            # Verify edge types
            edge_types = set(e["data"]["type"] for e in graph["edges"])
            print("Detected Edge Types in Graph:", list(edge_types))
            assert "shared_phone" in edge_types
            assert "shared_address" in edge_types
            assert "shared_vehicle" in edge_types
            assert "shared_fir" in edge_types
            assert "victim_link" in edge_types
            assert "gang_member" in edge_types

        # Step 5: Test GET /criminals/repeat-offenders/advanced
        print("\n--- Step 5: Test GET /criminals/repeat-offenders/advanced filters ---")
        req = urllib.request.Request(f"{url_base}/criminals/repeat-offenders/advanced?risk_level=High", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            data = res["data"]
            print(f"Found {len(data)} high risk repeat offenders.")
            for c in data:
                assert c["risk_score"] >= 75.0
                assert c["repeat_offender"] is True
                assert "fir_count" in c
                assert "most_common_crime" in c
                assert "recent_activity" in c
                assert "investigation_priority" in c
                print(f"  {c['full_name']} - Risk: {c['risk_score']} - FIRs: {c['fir_count']} - Most Common: {c['most_common_crime']} - Priority: {c['investigation_priority']}")

        # Step 6: Test GET /criminals/{id}/timeline
        print(f"\n--- Step 6: Test GET /criminals/{{id}}/timeline for {criminal_id} ---")
        req = urllib.request.Request(f"{url_base}/criminals/{criminal_id}/timeline", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            timeline = res["data"]
            print(f"Retrieved {len(timeline)} timeline events.")
            assert len(timeline) > 0
            first_event = timeline[0]
            assert "date" in first_event
            assert "title" in first_event
            assert "description" in first_event
            assert "severity" in first_event
            print("First timeline event:", first_event)

        # Step 7: Test GET /criminals/{id}/relationships
        print(f"\n--- Step 7: Test GET /criminals/{{id}}/relationships for {criminal_id} ---")
        req = urllib.request.Request(f"{url_base}/criminals/{criminal_id}/relationships", headers={"Authorization": f"Bearer {admin_token}"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            assert res["success"] is True
            relations = res["data"]
            print(f"Retrieved {len(relations)} direct relationships.")
            assert len(relations) > 0
            first_rel = relations[0]
            assert "name" in first_rel
            assert "relation_type" in first_rel
            assert "confidence_score" in first_rel
            print("First relationship entry:", first_rel)

        print("\nALL CRIMINAL NETWORK BACKEND TESTS PASSED SUCCESSFULLY!")

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
