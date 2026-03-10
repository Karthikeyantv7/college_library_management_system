# LibraManager - Multi-Role Library Management System

Welcome to **LibraManager**, a beautifully designed, modern, and fully functional vanilla web frontend for a Library Management System. 

## Features

- **Three Role-Based Dashboards**: 
  - Admin (`library.html`): Manage books, students, faculty, and oversee all borrowing operations and fine reports.
  - Faculty (`faculty.html`): View borrowed books, search the catalog, and check fine statuses with a personalized dashboard.
  - Student (`student.html`): A personalized portal to track reading progress, due dates, and explore the library.
- **Shared Data State**: Actions performed in any dashboard (such as Issuing a Book in Admin) immediately reflect in Student/Faculty dashboards. Data persists across reloads via `localStorage`.
- **Animated Data Visualization**: Built-in Chart.js instances that smoothly animate when loaded, providing interactive metric feedback.
- **Premium UI/UX**: Custom CSS utilizing glassmorphism, deep dark/light mode toggling, and robust responsive layout.
- **Zero Configuration**: No backend setup required.

## Technologies Used

- **HTML5** & **Vanilla CSS** (No external CSS frameworks required as CSS variables handle all custom utility)
- **Vanilla JavaScript**: DOM manipulation, layout toggling, and data synchronization.
- **Tailwind CSS (CDN)**: Utilized on `index.html` and `login.html` for rapid hero block UI generation.
- **Chart.js (CDN)**: Used for analytical graph generation on the dashboard layers.

## How to Run Locally

You do not need a local server or backend to run this application!

1. **Extract/Clone** this directory on your machine.
2. Open `index.html` in any modern web browser (Chrome, Firefox, Safari, Edge).
3. From the hero landing page, navigate to **Login**.
4. Select any Role tab (Admin, Faculty, or Student) and click the primary login button (credentials are pre-filled for demo purposes).
5. Explore the specific portal assigned to your role!

## Testing the "Live" Data Functionality

Data operates out of your browser's local storage to simulate a real database. Try the following flow:
1. Open the **Admin Dashboard** (`library.html`).
2. Navigate to **Issue Book**. Issue *Introduction to Algorithms* to the student `Arjun Sharma` (`student`).
3. Now, open the **Student Dashboard** (`student.html`) in a new tab.
4. Notice that *Introduction to Algorithms* now appears under **My Books** and the **Dashboard** metrics have updated accordingly.

## Clearing Data
If you'd like to reset the application back to its default demo data block, open your browser's developer tools (F12) -> Application -> Local Storage -> Clear all `lm-` prefixed keys, or simply click "Clear Site Data" and refresh. 
