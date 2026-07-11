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
    
    # Wait for server boot
    time.sleep(3)
    
    url_base = "http://localhost:8005"
    token = None
    
    try:
        # Test 1: Health check
        print("\n--- Test 1: Health Check ---")
        req = urllib.request.Request(f"{url_base}/api/health")
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            print(f"Health Response: {res}")
            assert res["status"] == "ok"
            print("Health check PASSED")

        # Test 2: Login failure
        print("\n--- Test 2: Login Failure Check ---")
        login_data = json.dumps({"username": "admin", "password": "wrongpassword"}).encode('utf-8')
        req = urllib.request.Request(
            f"{url_base}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/json"}
        )
        try:
            urllib.request.urlopen(req)
            print("FAIL: Expected 401 for wrong credentials")
            sys.exit(1)
        except urllib.error.HTTPError as e:
            res = json.loads(e.read().decode())
            print(f"Failed Login Response (Code {e.code}): {res}")
            assert e.code == 401
            assert res["success"] is False
            assert res["message"] == "Invalid username or password"
            print("Login failure check PASSED")

        # Test 3: Login success
        print("\n--- Test 3: Login Success Check ---")
        login_data = json.dumps({"username": "admin", "password": "password123"}).encode('utf-8')
        req = urllib.request.Request(
            f"{url_base}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            print(f"Success Login Response: {res}")
            assert res["success"] is True
            assert "access_token" in res
            assert res["token_type"] == "bearer"
            assert res["user"]["role"] == "Admin"
            token = res["access_token"]
            print("Login success check PASSED")

        # Test 4: Protected endpoint GET /auth/me
        print("\n--- Test 4: Protected GET /auth/me ---")
        req = urllib.request.Request(
            f"{url_base}/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            print(f"User Me Response: {res}")
            assert res["name"] == "admin"
            assert res["role"] == "Admin"
            assert "email" in res
            print("Protected GET /auth/me PASSED")

        # Test 5: Protected endpoint access without token
        print("\n--- Test 5: Protected access without token ---")
        req = urllib.request.Request(f"{url_base}/auth/me")
        try:
            urllib.request.urlopen(req)
            print("FAIL: Expected 401 for unauthorized access")
            sys.exit(1)
        except urllib.error.HTTPError as e:
            print(f"Access Denied (Code {e.code})")
            assert e.code == 401
            print("Unauthorized access block PASSED")

        # Test 6: Logout
        print("\n--- Test 6: Logout ---")
        req = urllib.request.Request(
            f"{url_base}/auth/logout",
            data=b"",  # triggers POST request
            headers={"Authorization": f"Bearer {token}"}
        )
        with urllib.request.urlopen(req) as response:
            res = json.loads(response.read().decode())
            print(f"Logout Response: {res}")
            assert res["success"] is True
            assert res["message"] == "Logged out successfully"
            print("Logout check PASSED")

        print("\nALL TESTS PASSED SUCCESSFULLY!")
        
    except Exception as e:
        print(f"Error during tests: {e}")
        server_process.terminate()
        sys.exit(1)
    finally:
        print("Terminating FastAPI server...")
        server_process.terminate()
        server_process.wait()

if __name__ == "__main__":
    run_tests()
