# MY HOME STUDY - Full Stack (Ready to Deploy)

This is now full-stack: backend + frontend in one deploy. Teacher on one device can track student on another device in real-time.

## Structure
- `server.js` - Express API + serves frontend from `/public`
- `public/index.html` - Your landing page (single Get Started popup) + backend-connected logic
- `models/`, `routes/`, `middleware/` - API

## 1-Click Deploy Options

### Option A: Render.com (Recommended - Free)

1. Create MongoDB Atlas (free):
   - Go to https://www.mongodb.com/cloud/atlas
   - Create cluster (free) -> Database Access -> create user
   - Network Access -> Allow from anywhere (0.0.0.0/0)
   - Connect -> Drivers -> Copy connection string like: mongodb+srv://user:pass@cluster.mongodb.net/myhomestudy?retryWrites=true&w=majority

2. Deploy to Render:
   - Go to https://dashboard.render.com -> New + -> Web Service
   - Connect your GitHub repo (push this folder to GitHub first) OR upload manually
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Add Environment Variables:
     ```
     MONGO_URI = your atlas string
     JWT_SECRET = any long random string like mysecret123456789
     CLIENT_URL = https://your-app-name.onrender.com
     PORT = 10000
     ```
   - Deploy -> Wait 2 mins -> You get URL like https://my-home-study.onrender.com

Done! Open that URL on any phone. Teacher and student can register from different devices.

### Option B: Railway.app

1. Go to railway.app -> New Project -> Deploy from GitHub
2. Add variables same as above
3. Deploy

### Option C: Vercel

Vercel needs MongoDB Atlas as well. Push to GitHub then import in Vercel. It will use vercel.json.

### Option D: Run Locally

```bash
npm install
# create .env file
# MONGO_URI=...
# JWT_SECRET=...
# PORT=5000
npm start
# Open http://localhost:5000
```

## How Teacher Tracks Student

1. Teacher registers -> gets TCH-XXX (e.g. TCH-452) - screen shows big ID + Copy button
2. Teacher shares TCH-452 via WhatsApp to students
3. Student registers on different device, enters TCH-452
4. Backend verifies teacher exists
5. Teacher dashboard -> Students tab -> calls GET /api/progress/teacher/students -> sees:
   - Student name, grade, email
   - Topics completed / total
   - Avg practice score
   - Assignments submitted/graded
6. When student submits assignment -> POST /api/submissions -> teacher sees it instantly in Submissions tab on any device
7. Teacher grades -> PUT /api/submissions/:id/grade -> student gets notification on next load

## API Endpoints

- POST /api/auth/register/teacher
- POST /api/auth/register/student
- POST /api/auth/login
- POST /api/auth/forgot/find
- POST /api/auth/forgot/reset
- GET /api/assignments (filtered by role)
- POST /api/assignments (teacher only)
- DELETE /api/assignments/:id
- GET /api/submissions
- POST /api/submissions
- PUT /api/submissions/:id/grade
- GET /api/progress/teacher/students
- GET/POST /api/progress/completions
- GET/POST /api/progress/practice
- GET/POST /api/progress/concepts

## Changing Frontend Backend URL

If you deploy frontend separately (Netlify), edit public/index.html top:
```js
const API_BASE = 'https://your-backend.onrender.com/api';
```
If you deploy as full-stack (this version), it automatically uses `window.location.origin + '/api'` so no change needed.

## Need Help?

If you get MongoDB connection error, make sure:
- IP whitelist is 0.0.0.0/0
- Password has no special chars like @ - URL encode it or change password
- Database user has readWrite role