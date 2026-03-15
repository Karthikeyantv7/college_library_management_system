import sqlite3
import re
import os

DB_FILE = 'library.db'

def create_db():
    if os.path.exists(DB_FILE):
        os.remove(DB_FILE)
    
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # Create Tables
    cursor.executescript("""
        CREATE TABLE books (
            book_id TEXT PRIMARY KEY,
            title TEXT,
            author TEXT,
            category TEXT,
            total_copies INTEGER,
            available_copies INTEGER
        );

        CREATE TABLE students (
            student_id INTEGER PRIMARY KEY,
            student_name TEXT,
            department TEXT,
            year INTEGER,
            contact TEXT,
            password_hash TEXT
        );

        CREATE TABLE faculty (
            faculty_id INTEGER PRIMARY KEY,
            faculty_name TEXT,
            designation TEXT,
            password_hash TEXT
        );

        CREATE TABLE admin (
            admin_id INTEGER PRIMARY KEY AUTOINCREMENT,
            admin_name TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE issues (
            issue_id INTEGER PRIMARY KEY AUTOINCREMENT,
            book_id TEXT NOT NULL,
            issue_date DATE NOT NULL,
            return_date DATE,
            status TEXT,
            fine_penalty INTEGER,
            student_id INTEGER,
            faculty_id INTEGER,
            borrower_name TEXT,
            borrower_type TEXT,
            FOREIGN KEY (book_id) REFERENCES books (book_id),
            FOREIGN KEY (student_id) REFERENCES students (student_id),
            FOREIGN KEY (faculty_id) REFERENCES faculty (faculty_id)
        );
    """)

    # We'll parse the INSERT INTO statements from the SQL files
    def parse_inserts(sql_file, table_name, expected_cols):
        path = os.path.join(os.path.dirname(__file__), sql_file)
        if not os.path.exists(path):
            return
        
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find lines like INSERT INTO `table` VALUES (...)
        match = re.search(r'INSERT INTO `.*?` VALUES (.*);', content)
        if not match:
            return
            
        values_str = match.group(1)
        # Regex to split on tuples: ('abc', 1, NULL), ('def', 2, 'xyz')
        tuples = re.findall(r'\((.*?)\)', values_str)
        
        for t in tuples:
            # simple split by comma, respecting quotes
            # This is a bit fragile for complex SQL but works for standard dumps
            items = []
            curr = ""
            in_quote = False
            for char in t:
                if char == "'":
                    in_quote = not in_quote
                elif char == ',' and not in_quote:
                    items.append(curr.strip())
                    curr = ""
                    continue
                curr += char
            items.append(curr.strip())
            
            # format values
            cleaned = []
            for item in items:
                if item == 'NULL':
                    cleaned.append(None)
                elif item.startswith("'") and item.endswith("'"):
                    cleaned.append(item[1:-1])
                else:
                    try:
                        cleaned.append(int(item))
                    except:
                        cleaned.append(item)
            
            #Pad or truncate if necessary based on schema differences (issues table changed)
            if table_name == 'issues':
                 # The sql dump for issues is: book_id, issue_date, return_date, status, fine_penalty, student_id, faculty_id
                 if len(cleaned) == 7:
                     # Add dummy issue_id (auto increment), borrower_name, borrower_type
                     cleaned.insert(0, None) # issue_id
                     cleaned.append('Unknown') # name
                     cleaned.append('student' if cleaned[7] else 'faculty') # type
                 
            placeholders = ','.join(['?'] * len(cleaned))
            cursor.execute(f"INSERT INTO {table_name} VALUES ({placeholders})", cleaned)

    parse_inserts('library_books.sql', 'books', 6)
    parse_inserts('library_students.sql', 'students', 6)
    parse_inserts('library_faculty.sql', 'faculty', 4)
    parse_inserts('library_admin.sql', 'admin', 4)
    parse_inserts('library_issues.sql', 'issues', 10) # 7 from dump + 3 extra

    # Add default admin if none exists
    cursor.execute("SELECT COUNT(*) FROM admin")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO admin (admin_name, password_hash) VALUES ('admin', 'admin123')")
        
    # Same for student and faculty (so they can login to the frontend demo)
    cursor.execute("SELECT COUNT(*) FROM students")
    if cursor.fetchone()[0] == 0:
         cursor.execute("INSERT INTO students (student_id, student_name, department, year, contact, password_hash) VALUES (1, 'Arjun Sharma', 'Computer Science', 2, 'CS2024001', 'student123')")
         cursor.execute("INSERT INTO students (student_id, student_name, department, year, contact, password_hash) VALUES (2, 'Priya Verma', 'Electronics', 3, '8888888888', 'student123')")
         cursor.execute("INSERT INTO students (student_id, student_name, department, year, contact, password_hash) VALUES (3, 'Rahul Gupta', 'Mechanical', 1, '7777777777', 'student123')")
         
    cursor.execute("SELECT COUNT(*) FROM faculty")
    if cursor.fetchone()[0] == 0:
         cursor.execute("INSERT INTO faculty (faculty_id, faculty_name, designation, password_hash) VALUES (1, 'Prof. S. Kumar', 'HOD', 'faculty123')")
         cursor.execute("INSERT INTO faculty (faculty_id, faculty_name, designation, password_hash) VALUES (2, 'Dr. M. Singh', 'Professor', 'faculty123')")

    conn.commit()
    conn.close()
    print("Database created successfully!")

if __name__ == '__main__':
    create_db()
