<<<<<<< HEAD
# 📅 Timetable Management System — Full Stack

A modern, full-stack school timetable management system built with **React** (frontend) and **Flask + SQLAlchemy** (backend), upgraded from the original Python/Tkinter desktop app.

---

## 🗂️ Project Structure

```
timetable-management-system/
├── backend/
│   ├── app.py              # Flask app — all API routes + models
│   ├── run.py              # Entry point (seeds DB + starts server)
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Environment variable template
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js                  # Root app + routing
│   │   ├── index.js                # React entry point
│   │   ├── index.css               # Global styles
│   │   ├── context/
│   │   │   └── AuthContext.js      # Auth state (JWT)
│   │   ├── utils/
│   │   │   └── api.js              # Axios instance
│   │   ├── components/
│   │   │   ├── Sidebar.js          # Navigation sidebar
│   │   │   └── Chatbot.js          # Floating AI chatbot
│   │   └── pages/
│   │       ├── Landing.js          # Home / landing page
│   │       ├── Auth.js             # Login + Register
│   │       ├── Dashboard.js        # Stats + overview
│   │       ├── Timetable.js        # Grid view + CRUD + export
│   │       ├── Teachers.js         # Teacher management
│   │       └── Others.js           # Students, Subjects, Classrooms, Notifications
│   └── package.json
│
└── README.md
```

---

## ⚙️ Backend Setup (Flask)

### 1. Navigate to backend folder
```bash
cd backend
```

### 2. Create a virtual environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set environment variables
Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```
Edit `.env`:
```
SECRET_KEY=your_super_secret_key_here
GEMINI_API_KEY=your_google_gemini_api_key_here
```

> 📌 Get your Gemini API key from: https://aistudio.google.com/app/apikey

### 5. Run the server
```bash
python run.py
```

The backend runs at: **http://localhost:5000**

On first run, the database is auto-created and seeded with demo data.

---

## 🎨 Frontend Setup (React)

### 1. Navigate to frontend folder
```bash
cd frontend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the dev server
```bash
npm start
```

The frontend runs at: **http://localhost:3000**

> The `"proxy": "http://localhost:5000"` in `package.json` forwards all `/api` calls to Flask automatically.

---

## 🔑 Demo Accounts

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Admin   | admin@school.com          | admin123     |
| Teacher | ananya@school.com         | teacher123   |
| Student | student1@school.com       | student123   |

---

## 🗄️ Database Schema

Built with **SQLite** + **SQLAlchemy ORM**. Tables:

| Table          | Key Fields                                                      |
|----------------|-----------------------------------------------------------------|
| `users`        | id, name, email, password (hashed), role                       |
| `teachers`     | id, name, initials, email, user_id (FK→users)                  |
| `students`     | id, name, roll, section, user_id (FK→users)                    |
| `subjects`     | id, subject_name, subject_code, teacher_id (FK→teachers)       |
| `classrooms`   | id, room_number, capacity                                       |
| `timetable`    | id, section, subject_id, teacher_id, room_id, day, period, times|
| `notifications`| id, message, user_id (FK→users), date, read                    |
| `chat_history` | id, user_id (FK→users), role, message, timestamp               |

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| POST   | /api/auth/register    | Register user      |
| POST   | /api/auth/login       | Login + get token  |
| GET    | /api/auth/me          | Get current user   |

### Timetable
| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | /api/timetable        | List entries (filterable)|
| POST   | /api/timetable        | Add entry (admin)        |
| PUT    | /api/timetable/:id    | Update entry (admin)     |
| DELETE | /api/timetable/:id    | Delete entry (admin)     |
| GET    | /api/timetable/sections | List all sections      |

### Teachers / Students / Subjects / Classrooms
All support standard CRUD: `GET`, `POST`, `PUT`, `DELETE`

### Notifications
| Method | Endpoint                       | Description       |
|--------|--------------------------------|-------------------|
| GET    | /api/notifications             | Get my notifs     |
| PATCH  | /api/notifications/:id/read    | Mark one read     |
| PATCH  | /api/notifications/read-all    | Mark all read     |

### Chatbot (Gemini)
| Method | Endpoint            | Description           |
|--------|---------------------|-----------------------|
| POST   | /api/chat           | Send message          |
| GET    | /api/chat/history   | Get chat history      |
| DELETE | /api/chat/history   | Clear chat history    |

### Stats
| Method | Endpoint    | Description        |
|--------|-------------|--------------------|
| GET    | /api/stats  | Dashboard counts   |

---

## ✨ Features

- **Landing page** with feature overview
- **Login / Register** with role selection (Admin, Teacher, Student)
- **JWT Authentication** with role-based access control
- **Dashboard** with live stats cards + recent data
- **Timetable grid** — visual week-by-week layout with recess
- **Add / Edit / Delete** timetable entries (Admin only)
- **Conflict detection** — prevents double-booking a slot
- **Search & filter** across timetable, teachers, students
- **Export to CSV and PDF** (jsPDF + autoTable)
- **AI Chatbot** powered by Google Gemini with timetable context
- **Notifications** with unread badge + mark read
- **Responsive** dark-themed modern UI

---

## 🛠️ Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, React Router v6, Axios, jsPDF         |
| Backend   | Flask 3, Flask-SQLAlchemy, Flask-CORS, PyJWT    |
| Database  | SQLite (via SQLAlchemy ORM)                     |
| AI        | Google Gemini 1.5 Flash (google-generativeai)   |
| Auth      | JWT (Bearer tokens), bcrypt password hashing    |
| Styling   | Custom CSS (dark theme, Sora + JetBrains Mono)  |

---

## 🚀 Production Build

```bash
# Build React for production
cd frontend
npm run build

# Serve with Flask (add static file serving in app.py or use nginx)
cd backend
python run.py
```
=======
# TimeTable-App
>>>>>>> 0bfcdc017d9c7565bdc306fc96d4b9318d05cd4b
