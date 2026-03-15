from flask import Flask, jsonify, request, send_from_directory, render_template
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__, template_folder='template', static_folder='static')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///library.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Models ---
class Book(db.Model):
    __tablename__ = 'books'
    book_id = db.Column(db.String, primary_key=True)
    title = db.Column(db.String(100))
    author = db.Column(db.String(100))
    category = db.Column(db.String(50))
    total_copies = db.Column(db.Integer)
    available_copies = db.Column(db.Integer)

    def to_dict(self):
        return {
            'id': self.book_id,
            'title': self.title,
            'author': self.author,
            'genre': self.category,
            'copies': self.total_copies,
            'available': self.available_copies
        }

class Student(db.Model):
    __tablename__ = 'students'
    student_id = db.Column(db.Integer, primary_key=True)
    student_name = db.Column(db.String(50))
    department = db.Column(db.String(50))
    year = db.Column(db.Integer)
    contact = db.Column(db.String(15))
    password_hash = db.Column(db.String(255))
    
    def to_dict(self):
        return {
            'id': self.student_id,
            'name': self.student_name,
            'roll': f"STU{self.student_id}",
            'email': f"{self.student_id}@college.edu",
            'dept': self.department
        }

class Faculty(db.Model):
    __tablename__ = 'faculty'
    faculty_id = db.Column(db.Integer, primary_key=True)
    faculty_name = db.Column(db.String(50))
    designation = db.Column(db.String(50))
    password_hash = db.Column(db.String(255))
    
    def to_dict(self):
        return {
            'id': self.faculty_id,
            'name': self.faculty_name,
            'empId': f"FAC{self.faculty_id}",
            'email': f"{self.faculty_id}@college.edu",
            'dept': self.designation
        }

class Admin(db.Model):
    __tablename__ = 'admin'
    admin_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    admin_name = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

class Issue(db.Model):
    __tablename__ = 'issues'
    issue_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    book_id = db.Column(db.String, db.ForeignKey('books.book_id'), nullable=False)
    issue_date = db.Column(db.String, nullable=False)
    return_date = db.Column(db.String)
    status = db.Column(db.String(20))
    fine_penalty = db.Column(db.Integer)
    student_id = db.Column(db.Integer, db.ForeignKey('students.student_id'))
    faculty_id = db.Column(db.Integer, db.ForeignKey('faculty.faculty_id'))
    borrower_name = db.Column(db.String(100)) # cache name
    borrower_type = db.Column(db.String(20)) # student or faculty
    
    book = db.relationship('Book', backref='legacy_issues')

    def to_dict(self):
        return {
            'id': f"ISS-{self.issue_id:03d}",
            'bookId': self.book_id,
            'bookTitle': self.book.title if self.book else 'Unknown',
            'borrower': self.borrower_name or 'Unknown',
            'borrowerType': self.borrower_type,
            'issueDate': self.issue_date,
            'dueDate': self.return_date,
            'status': self.status.lower() if self.status else 'active',
            'finePaid': self.fine_penalty is not None and self.fine_penalty > 0 and self.status and self.status.lower() == 'returned'
        }

class BookRequest(db.Model):
    __tablename__ = 'book_requests'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), nullable=False) # Stores Student Roll No or Faculty EmpId
    book_id = db.Column(db.String, db.ForeignKey('books.book_id'), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'student' or 'faculty'
    request_date = db.Column(db.String(20), default=lambda: datetime.now().strftime("%Y-%m-%d %H:%M"))
    status = db.Column(db.String(20), default='PENDING_APPROVAL')
    approved_by = db.Column(db.Integer, db.ForeignKey('admin.admin_id'), nullable=True)

    book = db.relationship('Book', backref='requests')

    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'bookId': self.book_id,
            'bookTitle': self.book.title if self.book else 'Unknown',
            'role': self.role,
            'requestDate': self.request_date,
            'status': self.status,
            'approvedBy': self.approved_by
        }

class IssuedBook(db.Model):
    __tablename__ = 'issued_books'
    issue_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(db.String(50), nullable=False) # Student Roll No or Faculty EmpId
    book_id = db.Column(db.String, db.ForeignKey('books.book_id'), nullable=False)
    issue_date = db.Column(db.String(20), nullable=True)
    due_date = db.Column(db.String(20), nullable=True)
    status = db.Column(db.String(20), default='ISSUED')
    
    book = db.relationship('Book', backref='issued_books_new')

    def to_dict(self):
        return {
            'issueId': self.issue_id,
            'userId': self.user_id,
            'bookId': self.book_id,
            'bookTitle': self.book.title if self.book else 'Unknown',
            'issueDate': self.issue_date,
            'dueDate': self.due_date,
            'status': self.status
        }

# --- Routes: Frontend Templates ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login')
def login_page():
    return render_template('login.html')

@app.route('/library')
def library_admin():
    return render_template('library.html')

@app.route('/faculty')
def faculty_dashboard():
    return render_template('faculty.html')

@app.route('/student')
def student_dashboard():
    return render_template('student.html')


@app.route('/api/admin', methods=['POST'])
def add_admin():
    data = request.json
    if not data or not data.get('adminName') or not data.get('password'):
        return jsonify({'error': 'Missing name or password'}), 400
        
    new_admin = Admin(
        admin_name=data['adminName'],
        password_hash=data['password'] # Using plaintext like init_db.py does
    )
    db.session.add(new_admin)
    db.session.commit()
    return jsonify({
        'id': new_admin.admin_id,
        'name': new_admin.admin_name,
        'message': 'Admin added successfully'
    }), 201

@app.route('/api/admins', methods=['GET'])
def get_admins():
    admins = Admin.query.all()
    # Excluding passwords obviously
    res = [{'id': a.admin_id, 'name': a.admin_name, 'created_at': a.created_at} for a in admins]
    return jsonify(res)


# --- Routes: API Endpoints ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    role = data.get('role')
    user_id = data.get('username')
    password = data.get('password')

    if role == 'admin':
        admin = Admin.query.filter_by(admin_name=user_id, password_hash=password).first()
        if admin:
            return jsonify({'success': True, 'redirect': '/library', 'userName': admin.admin_name})
    elif role == 'faculty':
        faculty = Faculty.query.filter_by(faculty_name=user_id, password_hash=password).first()
        # Fallback check for faculty_id if name fails, since frontend sends something like FAC001
        if not faculty and user_id.startswith('FAC'):
            try:
                f_id = int(user_id[3:])
                faculty = Faculty.query.filter_by(faculty_id=f_id, password_hash=password).first()
            except ValueError:
                pass
        
        if faculty:
            return jsonify({'success': True, 'redirect': '/faculty', 'userName': faculty.faculty_name})
    elif role == 'student':
        student = Student.query.filter_by(student_name=user_id, password_hash=password).first()
        # Fallback check for student_id if name fails, since frontend sends something like CS2024001 or STU...
        if not student:
            # Let's just try to check if the user_id exists in the contact field or try parsing as STU
            if user_id.startswith('STU'):
                try:
                    s_id = int(user_id[3:])
                    student = Student.query.filter_by(student_id=s_id, password_hash=password).first()
                except ValueError:
                    pass
            elif user_id.startswith('CS'):
               # We don't have roll number in db, frontend generates it. Let's just allow contact/email
               pass
            
            # If not found yet, try contact / email
            if not student:
                 student = Student.query.filter_by(contact=user_id, password_hash=password).first()

        if student:
            return jsonify({'success': True, 'redirect': '/student', 'userName': student.student_name})

    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/books', methods=['GET'])
def get_books():
    books = Book.query.all()
    return jsonify([b.to_dict() for b in books])

@app.route('/api/books', methods=['POST'])
def add_book():
    data = request.json
    new_book = Book(
        book_id=f"B{int(datetime.now().timestamp())}",
        title=data.get('title'),
        author=data.get('author'),
        category=data.get('genre'),
        total_copies=data.get('copies'),
        available_copies=data.get('available')
    )
    db.session.add(new_book)
    db.session.commit()
    return jsonify(new_book.to_dict()), 201

@app.route('/api/books/<book_id>', methods=['DELETE'])
def delete_book(book_id):
    book = Book.query.get(book_id)
    if book:
        db.session.delete(book)
        db.session.commit()
        return '', 204
    return jsonify({'error': 'Book not found'}), 404

@app.route('/api/books/<book_id>', methods=['PUT'])
def update_book(book_id):
    book = Book.query.get(book_id)
    if book:
        data = request.json
        diff = int(data.get('copies', book.total_copies)) - book.total_copies
        book.total_copies += diff
        book.available_copies += diff
        db.session.commit()
        return jsonify(book.to_dict()), 200
    return jsonify({'error': 'Book not found'}), 404

@app.route('/api/students', methods=['GET'])
def get_students():
    students = Student.query.all()
    return jsonify([s.to_dict() for s in students])

@app.route('/api/students', methods=['POST'])
def add_student():
    data = request.json
    new_student = Student(
        student_name=data.get('name'),
        department=data.get('dept'),
        contact=data.get('email'),
        password_hash='student123'
    )
    db.session.add(new_student)
    db.session.commit()
    return jsonify(new_student.to_dict()), 201

@app.route('/api/students/<int:id>', methods=['DELETE'])
def delete_student(id):
    student = Student.query.get(id)
    if not student:
        return jsonify({'error': 'Student not found'}), 404

    # Check if the student has any unreturned books in issued_books
    # The user_id in issued_books stores the student name
    active_issues = IssuedBook.query.filter(
        IssuedBook.user_id == student.student_name,
        IssuedBook.status.in_(['ISSUED', 'APPROVED'])
    ).count()

    if active_issues > 0:
        return jsonify({
            'error': 'This user cannot be removed because they still have borrowed books. '
                     'Please ensure all books are returned before deleting the account.',
            'activeBooks': active_issues
        }), 409

    db.session.delete(student)
    db.session.commit()
    return '', 204

@app.route('/api/faculty', methods=['GET'])
def get_faculty_list():
    faculty = Faculty.query.all()
    return jsonify([f.to_dict() for f in faculty])

@app.route('/api/faculty', methods=['POST'])
def add_faculty():
    data = request.json
    new_faculty = Faculty(
        faculty_name=data.get('name'),
        designation=data.get('dept'),
        password_hash='faculty123'
    )
    db.session.add(new_faculty)
    db.session.commit()
    return jsonify(new_faculty.to_dict()), 201

@app.route('/api/faculty/<int:id>', methods=['DELETE'])
def delete_faculty(id):
    faculty = Faculty.query.get(id)
    if not faculty:
        return jsonify({'error': 'Faculty not found'}), 404

    # Check if the faculty has any unreturned books in issued_books
    active_issues = IssuedBook.query.filter(
        IssuedBook.user_id == faculty.faculty_name,
        IssuedBook.status.in_(['ISSUED', 'APPROVED'])
    ).count()

    if active_issues > 0:
        return jsonify({
            'error': 'This user cannot be removed because they still have borrowed books. '
                     'Please ensure all books are returned before deleting the account.',
            'activeBooks': active_issues
        }), 409

    db.session.delete(faculty)
    db.session.commit()
    return '', 204

@app.route('/api/issues', methods=['GET'])
def get_issues():
    issued_books = IssuedBook.query.all()
    res = []
    for i in issued_books:
        status_map = {
             'ISSUED': 'active',
             'RETURNED': 'returned'
        }
        mapped_status = status_map.get(i.status, i.status.lower())

        # Resolve borrower type from BookRequest table, or by checking student/faculty names
        borrower_type = 'unknown'
        book_req = BookRequest.query.filter_by(user_id=i.user_id, book_id=i.book_id).first()
        if book_req:
            borrower_type = book_req.role  # 'student' or 'faculty'
        else:
            # Fallback: check if user_id matches a student or faculty name
            if Student.query.filter_by(student_name=i.user_id).first():
                borrower_type = 'student'
            elif Faculty.query.filter_by(faculty_name=i.user_id).first():
                borrower_type = 'faculty'

        res.append({
            'id': f"ISS-{i.issue_id:03d}",
            'bookId': i.book_id,
            'bookTitle': i.book.title if i.book else 'Unknown',
            'borrower': i.user_id,
            'borrowerType': borrower_type,
            'issueDate': i.issue_date,
            'dueDate': i.due_date,
            'status': mapped_status,
            'finePaid': False
        })
    return jsonify(res)

@app.route('/api/issues', methods=['POST'])
def create_issue():
    data = request.json
    book = Book.query.get(data.get('bookId'))
    
    if not book or book.available_copies <= 0:
        return jsonify({'error': 'Book not available'}), 400
        
    book.available_copies -= 1
    
    new_issue = Issue(
        book_id=book.book_id,
        issue_date=data.get('issueDate'),
        return_date=data.get('dueDate'),
        status='active',
        borrower_name=data.get('borrower'),
        borrower_type=data.get('borrowerType')
    )
    db.session.add(new_issue)
    db.session.commit()
    return jsonify(new_issue.to_dict()), 201

@app.route('/api/issues/<issue_id_str>', methods=['PUT'])
def return_book(issue_id_str):
    try:
        issue_id = int(issue_id_str.split('-')[1])
    except:
        return jsonify({'error': 'Invalid format'}), 400
        
    issue = IssuedBook.query.get(issue_id)
    if not issue or issue.status == 'RETURNED':
        return jsonify({'error': 'Issue active not found'}), 404
        
    issue.status = 'RETURNED'
    if issue.book:
        issue.book.available_copies += 1
        
    db.session.commit()
    
    # Return formatted to match frontend expectation
    return jsonify({
        'id': f"ISS-{issue.issue_id:03d}",
        'bookId': issue.book_id,
        'bookTitle': issue.book.title if issue.book else 'Unknown',
        'borrower': issue.user_id,
        'borrowerType': 'unknown',
        'issueDate': issue.issue_date,
        'dueDate': issue.due_date,
        'status': 'returned',
        'finePaid': False
    })


# --- Routes: Book Request Workflow ---

@app.route('/api/request-book', methods=['POST'])
def request_book():
    data = request.json
    book_id = data.get('bookId')
    user_id = data.get('userId')
    role = data.get('role')

    book = Book.query.get(book_id)
    if not book:
        return jsonify({'error': 'Book not found'}), 404

    if book.available_copies <= 0:
        return jsonify({'error': 'Book currently unavailable'}), 400

    new_request = BookRequest(
        user_id=user_id,
        book_id=book_id,
        role=role,
        status='PENDING_APPROVAL'
    )
    db.session.add(new_request)
    db.session.commit()

    return jsonify(new_request.to_dict()), 201

@app.route('/api/book-requests', methods=['GET'])
def get_book_requests():
    requests = BookRequest.query.all()
    return jsonify([req.to_dict() for req in requests])

@app.route('/api/approve-request/<int:request_id>', methods=['PUT'])
def approve_request(request_id):
    req = BookRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    if req.status != 'PENDING_APPROVAL':
        return jsonify({'error': 'Request is not pending'}), 400

    book = Book.query.get(req.book_id)
    if book.available_copies <= 0:
        return jsonify({'error': 'Book no longer available'}), 400

    # 1. Update request status
    req.status = 'APPROVED'
    
    # 2. Decrease available copies
    book.available_copies -= 1
    
    # 3. Create entry in issued_books table (status APPROVED, waiting for issue)
    new_issued_book = IssuedBook(
        user_id=req.user_id,
        book_id=req.book_id,
        status='APPROVED' # Will change to ISSUED when physically issued
    )
    db.session.add(new_issued_book)
    db.session.commit()

    return jsonify({'message': 'Request approved successfully', 'request': req.to_dict()})

@app.route('/api/reject-request/<int:request_id>', methods=['PUT'])
def reject_request(request_id):
    req = BookRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    if req.status != 'PENDING_APPROVAL':
        return jsonify({'error': 'Request is not pending'}), 400

    req.status = 'REJECTED'
    db.session.commit()

    return jsonify({'message': 'Request rejected successfully', 'request': req.to_dict()})

@app.route('/api/issue-book/<int:request_id>', methods=['PUT'])
def issue_requested_book(request_id):
    req = BookRequest.query.get(request_id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404

    if req.status != 'APPROVED':
        return jsonify({'error': 'Request is not approved yet or already issued'}), 400

    # Update request status
    req.status = 'ISSUED'

    # Find the corresponding IssuedBook record (it should be in 'APPROVED' status)
    issued_book = IssuedBook.query.filter_by(user_id=req.user_id, book_id=req.book_id, status='APPROVED').first()
    
    if issued_book:
        # Add issue date and due date (e.g., 14 days from now)
        issue_date = datetime.now()
        due_date = issue_date + __import__('datetime').timedelta(days=14)
        
        issued_book.issue_date = issue_date.strftime("%Y-%m-%d")
        issued_book.due_date = due_date.strftime("%Y-%m-%d")
        issued_book.status = 'ISSUED'

    db.session.commit()

    return jsonify({'message': 'Book physically issued successfully', 'request': req.to_dict()})

@app.route('/api/my-books/<user_id>', methods=['GET'])
def get_my_books(user_id):
    # Fetch pending, rejected requests
    requests = BookRequest.query.filter_by(user_id=user_id).filter(BookRequest.status.in_(['PENDING_APPROVAL', 'REJECTED'])).all()
    
    # Fetch approved, issued, returned books
    issued_books = IssuedBook.query.filter_by(user_id=user_id).all()

    items = []
    
    for req in requests:
        items.append({
            'request_id': req.id,
            'bookId': req.book_id,
            'bookTitle': req.book.title if req.book else 'Unknown',
            'status': req.status,
            'issueDate': None,
            'dueDate': None
        })

    for ib in issued_books:
        # Find matching request to get the request_id
        matching_req = BookRequest.query.filter_by(user_id=user_id, book_id=ib.book_id).first()
        items.append({
            'issueId': ib.issue_id,
            'request_id': matching_req.id if matching_req else None,
            'bookId': ib.book_id,
            'bookTitle': ib.book.title if ib.book else 'Unknown',
            'status': ib.status,
            'issueDate': ib.issue_date,
            'dueDate': ib.due_date
        })

    return jsonify(items)
def sync_available_copies():
    """Recalculate available_copies for every book based on actual issued_books records.
    available_copies = total_copies - (number of non-returned issued_books for that book)
    """
    books = Book.query.all()
    for book in books:
        # Count copies that are currently out (ISSUED or APPROVED, not RETURNED)
        active_count = IssuedBook.query.filter(
            IssuedBook.book_id == book.book_id,
            IssuedBook.status.in_(['ISSUED', 'APPROVED'])
        ).count()
        correct_available = book.total_copies - active_count
        if book.available_copies != correct_available:
            print(f"  Syncing {book.book_id} ({book.title}): "
                  f"available {book.available_copies} -> {correct_available} "
                  f"(total={book.total_copies}, active_issues={active_count})")
            book.available_copies = correct_available
    db.session.commit()
    print("Available copies synced with issued_books records.")


if __name__ == '__main__':
    with app.app_context():
        # Sanity check mapping for empty database
        db.create_all()
        # Fix any drift in available_copies
        sync_available_copies()
    app.run(debug=True, port=5000)
