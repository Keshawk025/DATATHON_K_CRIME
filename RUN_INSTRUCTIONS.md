# How to Run K-CRIME (Karnataka Police Intelligence)

Follow these step-by-step instructions to get the application running locally after pulling the repository.

---

## 1. Backend Setup (FastAPI)

The backend handles all data processing, predictive ML, AI assistance, and authentication.

1. **Navigate to the backend directory:**
   ```bash
   cd Datathon/backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install the dependencies:**
   *(Ensure you use the newly created `requirements.txt` file)*
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Variables:**
   Ensure you have a `.env` file in the `backend/` directory (you can copy `.env.example` if available). To use the CrimeMind AI Assistant, you must add your Google Gemini API key:
   ```env
   GEMINI_API_KEY="your-google-gemini-api-key"
   ```

5. **Seed the Database (First-time setup only):**
   The project uses SQLite for local development. Seed the database with mock FIR data and the default administrator account:
   ```bash
   # Make sure you are in the backend directory
   python -m app.database.seed
   python -m app.database.seed_network
   ```

6. **Start the API Server:**
   ```bash
   uvicorn app.main:app --reload
   ```
   *The backend will now be running at `http://127.0.0.1:8000`.*

---

## 2. Frontend Setup (React / Vite)

The frontend is the visual administrative dashboard built with React and Tailwind CSS.

1. **Open a new terminal window/tab.**

2. **Navigate to the frontend directory:**
   ```bash
   cd Datathon/frontend
   ```

3. **Install NPM dependencies:**
   ```bash
   npm install
   ```

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   *The frontend will typically launch at `http://localhost:5173`.*

---

## 3. Accessing the Application

1. Open your browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
2. You will be greeted by the **K-CRIME Login Gateway**.
3. Log in using the seeded test credentials:
   - **Username:** `admin`
   - **Password:** `password123`

## Troubleshooting

- **CORS Errors / API Not Responding:** Ensure the backend terminal is running and listening on port `8000`. The frontend expects the backend at `http://127.0.0.1:8000`.
- **"Failed to load user profile" after login:** This happens if the frontend's auth state goes out of sync with the backend. Simply click logout and log back in, ensuring the backend server is active.
- **Missing AI Features:** Ensure `GEMINI_API_KEY` is properly set in the backend `.env` file, otherwise the AI Investigation Assistant will return unauthorized errors.
