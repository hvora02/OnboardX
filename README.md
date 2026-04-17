## Backend Setup (Python / FastAPI)

### 1. Go to backend directory
cd backend

### 2. Create virtual environment
python -m venv venv

### 3. Activate virtual environment
PowerShell:
venv\Scripts\Activate.ps1

Command Prompt (cmd):
venv\Scripts\activate.bat

### 4. Install dependencies
pip install -r requirements.txt

### 5. Run the server
uvicorn main:app --reload

### 6. Verify server
http://localhost:8000/

### 7. API docs
http://localhost:8000/docs
