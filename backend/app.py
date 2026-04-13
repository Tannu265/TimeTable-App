from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
import os
from functools import wraps

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

# Config
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'timetable_secret_key_2024')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///timetable.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ─────────────────────────────────────────────
# MODELS
# ─────────────────────────────────────────────

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='student')  # admin, teacher, student
    notifications = db.relationship('Notification', backref='user', lazy=True)
    chat_history = db.relationship('ChatHistory', backref='user', lazy=True)

class Teacher(db.Model):
    __tablename__ = 'teachers'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    initials = db.Column(db.String(10), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    subjects = db.relationship('Subject', backref='teacher', lazy=True)
    timetables = db.relationship('Timetable', backref='teacher', lazy=True)

class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    roll = db.Column(db.Integer, nullable=False)
    section = db.Column(db.String(10), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

class Subject(db.Model):
    __tablename__ = 'subjects'
    id = db.Column(db.Integer, primary_key=True)
    subject_name = db.Column(db.String(100), nullable=False)
    subject_code = db.Column(db.String(20), unique=True, nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=True)
    timetables = db.relationship('Timetable', backref='subject', lazy=True)

class Classroom(db.Model):
    __tablename__ = 'classrooms'
    id = db.Column(db.Integer, primary_key=True)
    room_number = db.Column(db.String(20), nullable=False, unique=True)
    capacity = db.Column(db.Integer, nullable=False, default=40)
    timetables = db.relationship('Timetable', backref='classroom', lazy=True)

class Timetable(db.Model):
    __tablename__ = 'timetable'
    id = db.Column(db.Integer, primary_key=True)
    section = db.Column(db.String(10), nullable=False)
    subject_id = db.Column(db.Integer, db.ForeignKey('subjects.id'), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey('teachers.id'), nullable=False)
    room_id = db.Column(db.Integer, db.ForeignKey('classrooms.id'), nullable=True)
    day = db.Column(db.String(15), nullable=False)
    period = db.Column(db.Integer, nullable=False)
    start_time = db.Column(db.String(10), nullable=False)
    end_time = db.Column(db.String(10), nullable=False)

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    read = db.Column(db.Boolean, default=False)

class ChatHistory(db.Model):
    __tablename__ = 'chat_history'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'user' or 'assistant'
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# ─────────────────────────────────────────────
# AUTH MIDDLEWARE
# ─────────────────────────────────────────────

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'error': 'User not found'}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except Exception:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user or current_user.role != 'admin':
                return jsonify({'error': 'Admin access required'}), 403
        except Exception:
            return jsonify({'error': 'Invalid token'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# ─────────────────────────────────────────────
# AUTH ROUTES
# ─────────────────────────────────────────────

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not all(k in data for k in ['name', 'email', 'password', 'role']):
        return jsonify({'error': 'Missing required fields'}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 409
    user = User(
        name=data['name'],
        email=data['email'],
        password=generate_password_hash(data['password']),
        role=data['role']
    )
    db.session.add(user)
    db.session.commit()

    # If teacher/student, create corresponding record
    if data['role'] == 'teacher':
        teacher = Teacher(name=data['name'], initials=data.get('initials', ''), email=data['email'], user_id=user.id)
        db.session.add(teacher)
        db.session.commit()
    elif data['role'] == 'student':
        student = Student(name=data['name'], roll=data.get('roll', 0), section=data.get('section', 'A'), user_id=user.id)
        db.session.add(student)
        db.session.commit()

    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    return jsonify({'token': token, 'user': {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not all(k in data for k in ['email', 'password']):
        return jsonify({'error': 'Missing credentials'}), 400
    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    return jsonify({'token': token, 'user': {'id': user.id, 'name': user.name, 'email': user.email, 'role': user.role}})

@app.route('/api/auth/me', methods=['GET'])
@token_required
def get_me(current_user):
    return jsonify({'id': current_user.id, 'name': current_user.name, 'email': current_user.email, 'role': current_user.role})

# ─────────────────────────────────────────────
# TEACHER ROUTES
# ─────────────────────────────────────────────

@app.route('/api/teachers', methods=['GET'])
@token_required
def get_teachers(current_user):
    teachers = Teacher.query.all()
    return jsonify([{
        'id': t.id, 'name': t.name, 'initials': t.initials, 'email': t.email
    } for t in teachers])

@app.route('/api/teachers', methods=['POST'])
@admin_required
def add_teacher(current_user):
    data = request.get_json()
    if Teacher.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Teacher with this email already exists'}), 409
    teacher = Teacher(name=data['name'], initials=data.get('initials', ''), email=data['email'])
    db.session.add(teacher)
    db.session.commit()
    return jsonify({'id': teacher.id, 'name': teacher.name, 'initials': teacher.initials, 'email': teacher.email}), 201

@app.route('/api/teachers/<int:tid>', methods=['PUT'])
@admin_required
def update_teacher(current_user, tid):
    teacher = Teacher.query.get_or_404(tid)
    data = request.get_json()
    teacher.name = data.get('name', teacher.name)
    teacher.initials = data.get('initials', teacher.initials)
    teacher.email = data.get('email', teacher.email)
    db.session.commit()
    return jsonify({'id': teacher.id, 'name': teacher.name, 'initials': teacher.initials, 'email': teacher.email})

@app.route('/api/teachers/<int:tid>', methods=['DELETE'])
@admin_required
def delete_teacher(current_user, tid):
    teacher = Teacher.query.get_or_404(tid)
    db.session.delete(teacher)
    db.session.commit()
    return jsonify({'message': 'Teacher deleted'})

# ─────────────────────────────────────────────
# STUDENT ROUTES
# ─────────────────────────────────────────────

@app.route('/api/students', methods=['GET'])
@token_required
def get_students(current_user):
    students = Student.query.all()
    return jsonify([{
        'id': s.id, 'name': s.name, 'roll': s.roll, 'section': s.section
    } for s in students])

@app.route('/api/students', methods=['POST'])
@admin_required
def add_student(current_user):
    data = request.get_json()
    student = Student(name=data['name'], roll=data['roll'], section=data['section'])
    db.session.add(student)
    db.session.commit()
    return jsonify({'id': student.id, 'name': student.name, 'roll': student.roll, 'section': student.section}), 201

@app.route('/api/students/<int:sid>', methods=['PUT'])
@admin_required
def update_student(current_user, sid):
    student = Student.query.get_or_404(sid)
    data = request.get_json()
    student.name = data.get('name', student.name)
    student.roll = data.get('roll', student.roll)
    student.section = data.get('section', student.section)
    db.session.commit()
    return jsonify({'id': student.id, 'name': student.name, 'roll': student.roll, 'section': student.section})

@app.route('/api/students/<int:sid>', methods=['DELETE'])
@admin_required
def delete_student(current_user, sid):
    student = Student.query.get_or_404(sid)
    db.session.delete(student)
    db.session.commit()
    return jsonify({'message': 'Student deleted'})

# ─────────────────────────────────────────────
# SUBJECT ROUTES
# ─────────────────────────────────────────────

@app.route('/api/subjects', methods=['GET'])
@token_required
def get_subjects(current_user):
    subjects = Subject.query.all()
    return jsonify([{
        'id': s.id, 'subject_name': s.subject_name, 'subject_code': s.subject_code,
        'teacher_id': s.teacher_id,
        'teacher_name': s.teacher.name if s.teacher else None
    } for s in subjects])

@app.route('/api/subjects', methods=['POST'])
@admin_required
def add_subject(current_user):
    data = request.get_json()
    if Subject.query.filter_by(subject_code=data['subject_code']).first():
        return jsonify({'error': 'Subject code already exists'}), 409
    subject = Subject(subject_name=data['subject_name'], subject_code=data['subject_code'], teacher_id=data.get('teacher_id'))
    db.session.add(subject)
    db.session.commit()
    return jsonify({'id': subject.id, 'subject_name': subject.subject_name, 'subject_code': subject.subject_code}), 201

@app.route('/api/subjects/<int:sid>', methods=['PUT'])
@admin_required
def update_subject(current_user, sid):
    subject = Subject.query.get_or_404(sid)
    data = request.get_json()
    subject.subject_name = data.get('subject_name', subject.subject_name)
    subject.subject_code = data.get('subject_code', subject.subject_code)
    subject.teacher_id = data.get('teacher_id', subject.teacher_id)
    db.session.commit()
    return jsonify({'id': subject.id, 'subject_name': subject.subject_name, 'subject_code': subject.subject_code})

@app.route('/api/subjects/<int:sid>', methods=['DELETE'])
@admin_required
def delete_subject(current_user, sid):
    subject = Subject.query.get_or_404(sid)
    db.session.delete(subject)
    db.session.commit()
    return jsonify({'message': 'Subject deleted'})

# ─────────────────────────────────────────────
# CLASSROOM ROUTES
# ─────────────────────────────────────────────

@app.route('/api/classrooms', methods=['GET'])
@token_required
def get_classrooms(current_user):
    classrooms = Classroom.query.all()
    return jsonify([{'id': c.id, 'room_number': c.room_number, 'capacity': c.capacity} for c in classrooms])

@app.route('/api/classrooms', methods=['POST'])
@admin_required
def add_classroom(current_user):
    data = request.get_json()
    room = Classroom(room_number=data['room_number'], capacity=data.get('capacity', 40))
    db.session.add(room)
    db.session.commit()
    return jsonify({'id': room.id, 'room_number': room.room_number, 'capacity': room.capacity}), 201

@app.route('/api/classrooms/<int:rid>', methods=['DELETE'])
@admin_required
def delete_classroom(current_user, rid):
    room = Classroom.query.get_or_404(rid)
    db.session.delete(room)
    db.session.commit()
    return jsonify({'message': 'Classroom deleted'})

# ─────────────────────────────────────────────
# TIMETABLE ROUTES
# ─────────────────────────────────────────────

@app.route('/api/timetable', methods=['GET'])
@token_required
def get_timetable(current_user):
    section = request.args.get('section')
    teacher_id = request.args.get('teacher_id')
    query = Timetable.query
    if section:
        query = query.filter_by(section=section)
    if teacher_id:
        query = query.filter_by(teacher_id=teacher_id)
    entries = query.all()
    return jsonify([{
        'id': e.id,
        'section': e.section,
        'subject_id': e.subject_id,
        'subject_name': e.subject.subject_name if e.subject else None,
        'subject_code': e.subject.subject_code if e.subject else None,
        'teacher_id': e.teacher_id,
        'teacher_name': e.teacher.name if e.teacher else None,
        'teacher_initials': e.teacher.initials if e.teacher else None,
        'room_id': e.room_id,
        'room_number': e.classroom.room_number if e.classroom else None,
        'day': e.day,
        'period': e.period,
        'start_time': e.start_time,
        'end_time': e.end_time,
    } for e in entries])

@app.route('/api/timetable', methods=['POST'])
@admin_required
def add_timetable(current_user):
    data = request.get_json()
    # Check for conflict
    conflict = Timetable.query.filter_by(
        section=data['section'], day=data['day'], period=data['period']
    ).first()
    if conflict:
        return jsonify({'error': 'Schedule conflict: this slot is already taken for this section'}), 409
    entry = Timetable(
        section=data['section'],
        subject_id=data['subject_id'],
        teacher_id=data['teacher_id'],
        room_id=data.get('room_id'),
        day=data['day'],
        period=data['period'],
        start_time=data['start_time'],
        end_time=data['end_time']
    )
    db.session.add(entry)
    db.session.commit()
    # Notify relevant students
    students = Student.query.filter_by(section=data['section']).all()
    subject = Subject.query.get(data['subject_id'])
    for s in students:
        if s.user_id:
            notif = Notification(
                message=f"New timetable entry added: {subject.subject_name if subject else 'Subject'} on {data['day']} Period {data['period']}",
                user_id=s.user_id
            )
            db.session.add(notif)
    db.session.commit()
    return jsonify({'id': entry.id, 'message': 'Timetable entry added'}), 201

@app.route('/api/timetable/<int:tid>', methods=['PUT'])
@admin_required
def update_timetable(current_user, tid):
    entry = Timetable.query.get_or_404(tid)
    data = request.get_json()
    entry.section = data.get('section', entry.section)
    entry.subject_id = data.get('subject_id', entry.subject_id)
    entry.teacher_id = data.get('teacher_id', entry.teacher_id)
    entry.room_id = data.get('room_id', entry.room_id)
    entry.day = data.get('day', entry.day)
    entry.period = data.get('period', entry.period)
    entry.start_time = data.get('start_time', entry.start_time)
    entry.end_time = data.get('end_time', entry.end_time)
    db.session.commit()
    return jsonify({'message': 'Timetable entry updated'})

@app.route('/api/timetable/<int:tid>', methods=['DELETE'])
@admin_required
def delete_timetable(current_user, tid):
    entry = Timetable.query.get_or_404(tid)
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Timetable entry deleted'})

@app.route('/api/timetable/sections', methods=['GET'])
@token_required
def get_sections(current_user):
    sections = db.session.query(Timetable.section).distinct().all()
    return jsonify([s[0] for s in sections])

# ─────────────────────────────────────────────
# NOTIFICATIONS ROUTES
# ─────────────────────────────────────────────

@app.route('/api/notifications', methods=['GET'])
@token_required
def get_notifications(current_user):
    notifs = Notification.query.filter_by(user_id=current_user.id).order_by(Notification.date.desc()).all()
    return jsonify([{
        'id': n.id, 'message': n.message, 'date': n.date.isoformat(), 'read': n.read
    } for n in notifs])

@app.route('/api/notifications/<int:nid>/read', methods=['PATCH'])
@token_required
def mark_read(current_user, nid):
    notif = Notification.query.filter_by(id=nid, user_id=current_user.id).first_or_404()
    notif.read = True
    db.session.commit()
    return jsonify({'message': 'Marked as read'})

@app.route('/api/notifications/read-all', methods=['PATCH'])
@token_required
def mark_all_read(current_user):
    Notification.query.filter_by(user_id=current_user.id, read=False).update({'read': True})
    db.session.commit()
    return jsonify({'message': 'All marked as read'})

# ─────────────────────────────────────────────
# CHATBOT ROUTE (Gemini)
# ─────────────────────────────────────────────

@app.route('/api/chat', methods=['POST'])
@token_required
def chat(current_user):
    import google.generativeai as genai

    data = request.get_json()
    user_message = data.get('message', '')
    if not user_message:
        return jsonify({'error': 'No message provided'}), 400

    api_key = os.environ.get('GEMINI_API_KEY', '')
    if not api_key:
        return jsonify({'reply': 'Chatbot not configured. Please set GEMINI_API_KEY environment variable.'}), 200

    # Build context from DB
    tt_entries = Timetable.query.all()
    tt_context = "\n".join([
        f"{e.day} Period {e.period} ({e.start_time}-{e.end_time}): Section {e.section}, "
        f"Subject: {e.subject.subject_name if e.subject else 'N/A'}, "
        f"Teacher: {e.teacher.name if e.teacher else 'N/A'}, "
        f"Room: {e.classroom.room_number if e.classroom else 'N/A'}"
        for e in tt_entries
    ])

    # Get past chat history
    history = ChatHistory.query.filter_by(user_id=current_user.id).order_by(ChatHistory.timestamp.asc()).limit(20).all()

    system_prompt = f"""You are a helpful timetable assistant for a school/college management system.
You have access to the following timetable data:
{tt_context if tt_context else 'No timetable data available yet.'}

Answer questions about schedules, teachers, subjects, and classrooms based on this data.
Be concise and helpful. The current user is {current_user.name} with role {current_user.role}."""

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')

        chat_history_gemini = []
        for h in history:
            chat_history_gemini.append({'role': h.role if h.role == 'user' else 'model', 'parts': [h.message]})

        chat_session = model.start_chat(history=chat_history_gemini)
        response = chat_session.send_message(f"{system_prompt}\n\nUser question: {user_message}")
        reply = response.text

        # Save to DB
        db.session.add(ChatHistory(user_id=current_user.id, role='user', message=user_message))
        db.session.add(ChatHistory(user_id=current_user.id, role='assistant', message=reply))
        db.session.commit()

        return jsonify({'reply': reply})
    except Exception as e:
        return jsonify({'reply': f'Error: {str(e)}'}), 500

@app.route('/api/chat/history', methods=['GET'])
@token_required
def get_chat_history(current_user):
    history = ChatHistory.query.filter_by(user_id=current_user.id).order_by(ChatHistory.timestamp.asc()).limit(50).all()
    return jsonify([{'role': h.role, 'message': h.message, 'timestamp': h.timestamp.isoformat()} for h in history])

@app.route('/api/chat/history', methods=['DELETE'])
@token_required
def clear_chat_history(current_user):
    ChatHistory.query.filter_by(user_id=current_user.id).delete()
    db.session.commit()
    return jsonify({'message': 'Chat history cleared'})

# ─────────────────────────────────────────────
# STATS / DASHBOARD
# ─────────────────────────────────────────────

@app.route('/api/stats', methods=['GET'])
@token_required
def get_stats(current_user):
    return jsonify({
        'teachers': Teacher.query.count(),
        'students': Student.query.count(),
        'subjects': Subject.query.count(),
        'classrooms': Classroom.query.count(),
        'timetable_entries': Timetable.query.count(),
        'sections': db.session.query(Timetable.section).distinct().count(),
    })

# ─────────────────────────────────────────────
# SEED DATA
# ─────────────────────────────────────────────

def seed_data():
    if User.query.count() > 0:
        return

    # Admin
    admin = User(name='Admin', email='admin@school.com', password=generate_password_hash('admin123'), role='admin')
    db.session.add(admin)

    # Teachers
    teachers_data = [
        ('Dr. Ananya Roy', 'ANR', 'ananya@school.com'),
        ('Prof. Sanjay Das', 'SJD', 'sanjay@school.com'),
        ('Ms. Priya Sharma', 'PRS', 'priya@school.com'),
        ('Mr. Rahul Gupta', 'RHG', 'rahul@school.com'),
    ]
    teacher_users = []
    teachers = []
    for name, ini, email in teachers_data:
        u = User(name=name, email=email, password=generate_password_hash('teacher123'), role='teacher')
        db.session.add(u)
        db.session.flush()
        t = Teacher(name=name, initials=ini, email=email, user_id=u.id)
        db.session.add(t)
        db.session.flush()
        teachers.append(t)

    # Subjects
    subjects_data = [
        ('Mathematics', 'MATH101', teachers[0].id),
        ('Physics', 'PHY101', teachers[1].id),
        ('Chemistry', 'CHEM101', teachers[2].id),
        ('Computer Science', 'CS101', teachers[3].id),
        ('English', 'ENG101', teachers[0].id),
    ]
    subjects = []
    for sname, scode, tid in subjects_data:
        s = Subject(subject_name=sname, subject_code=scode, teacher_id=tid)
        db.session.add(s)
        db.session.flush()
        subjects.append(s)

    # Classrooms
    rooms = [Classroom(room_number=f'Room-{n}', capacity=40) for n in ['101','102','103','104']]
    for r in rooms:
        db.session.add(r)
    db.session.flush()

    # Students
    for i in range(1, 6):
        u = User(name=f'Student {i}', email=f'student{i}@school.com', password=generate_password_hash('student123'), role='student')
        db.session.add(u)
        db.session.flush()
        s = Student(name=f'Student {i}', roll=i, section='A', user_id=u.id)
        db.session.add(s)

    for i in range(6, 11):
        u = User(name=f'Student {i}', email=f'student{i}@school.com', password=generate_password_hash('student123'), role='student')
        db.session.add(u)
        db.session.flush()
        s = Student(name=f'Student {i}', roll=i-5, section='B', user_id=u.id)
        db.session.add(s)

    # Timetable
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    periods = [
        (1, '09:00', '09:50'), (2, '09:50', '10:40'), (3, '10:40', '11:30'),
        (4, '12:10', '13:00'), (5, '13:00', '13:50'), (6, '13:50', '14:40'),
    ]
    sections = ['A', 'B']
    sub_cycle = [subjects[0], subjects[1], subjects[2], subjects[3], subjects[4], subjects[1]]
    for section in sections:
        for di, day in enumerate(days):
            for pi, (period, st, et) in enumerate(periods):
                sub = sub_cycle[(di + pi) % len(sub_cycle)]
                entry = Timetable(
                    section=section,
                    subject_id=sub.id,
                    teacher_id=sub.teacher_id,
                    room_id=rooms[pi % len(rooms)].id,
                    day=day,
                    period=period,
                    start_time=st,
                    end_time=et
                )
                db.session.add(entry)

    db.session.commit()
    print("✅ Seed data inserted.")

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_data()
    app.run(debug=True, port=5000)


