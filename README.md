# 📚 StudySync Daily - AI-Powered Academic Planner

<div align="center">


**Transform your academic journey with intelligent planning, AI-powered study tools, and seamless progress tracking.**



</div>

---

## 🌟 Overview

**StudySync Daily** is a comprehensive academic planner designed for students who want to optimize their study time, track progress, and achieve academic excellence. Built with Next.js 15 and powered by Google Gemini AI, it combines intelligent scheduling with powerful analytics to create your perfect daily study blueprint.

### ✨ Why StudySync Daily?

- 🎯 **Smart Scheduling**: AI-powered task prioritization based on deadlines, difficulty, and your personal focus patterns
- 🤖 **AI Study Tools**: Generate custom notes, practice quizzes, and get personalized study recommendations
- 📊 **Progress Analytics**: Track your study streaks, completion rates, and productivity trends
- ⏰ **Integrated Timer**: Built-in Pomodoro timer with automatic time tracking
- 🔄 **Adaptive Planning**: Dynamic blueprint that adjusts to your daily energy levels and performance
- 👥 **Study Groups**: Collaborate with peers and share study resources

---

## 🚀 Features

### 📅 Daily Blueprint Engine
- **Unified Schedule**: Combines fixed routines (sleep, classes, meals) with dynamic study sessions
- **Conflict Resolution**: Automatically detects and resolves scheduling conflicts
- **Free Slot Detection**: Intelligently identifies available time windows for studying
- **24-Hour Persistence**: Your daily plan stays consistent throughout the day

### 🧠 AI-Powered Tools
- **AI Notes Generator** (1 credit): Convert raw content into structured, organized study notes
- **AI Quiz Generator** (2 credits): Create custom practice quizzes on any topic with difficulty levels
- **Focus Prediction**: Analyze your patterns to predict optimal study times
- **Smart Summaries**: Get AI-generated insights from your daily reflections

### 📊 Progress Tracking
- **Daily Reflection**: Log energy levels, focus ratings, and completed tasks
- **Study Streaks**: Gamified tracking to maintain consistent study habits
- **Performance Analytics**: Visualize your productivity trends and completion rates
- **Task Completion**: Track actual vs. estimated time for better future planning

### ⏱️ Pomodoro Timer
- **Customizable Sessions**: 25-min focus / 5-min short break / 15-min long break
- **Automatic Tracking**: Time automatically syncs to linked tasks
- **Standalone Mode**: Use as a standalone timer without task association
- **Session Counter**: Track completed Pomodoro sessions

### 💳 Flexible Pricing Tiers

| Plan | Price | AI Credits | Features |
|------|-------|------------|----------|
| **Free** | ₹0 | 5/month | Daily blueprint, manual tasks, basic analytics |
| **Pro** | ₹99/month | 50/month | AI scheduling, advanced analytics, Pomodoro timer |
| **Pro Max** | ₹199/month | **Unlimited** | Everything + group collaboration, premium templates |

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - App Router with React Server Components
- **React 19** - Latest features with Server Actions
- **TailwindCSS** - Utility-first styling with dark mode support
- **Lucide Icons** - Beautiful, consistent iconography
- **React Hot Toast** - Elegant notifications

### Backend & Database
- **MongoDB** - Flexible NoSQL database with Mongoose ODM
- **NextAuth.js** - Complete authentication solution
  - Credentials (email/password)
  - OAuth (Google, GitHub, LinkedIn)
  - Session management with JWT

### AI & APIs
- **Google Gemini 2.5 Flash** - Advanced AI model for:
  - Note generation
  - Quiz creation
  - Content summarization
- **Razorpay** - Secure payment processing for subscriptions

### Infrastructure
- **Vercel** - Serverless deployment with edge functions
- **MongoDB Atlas** - Managed cloud database
- **Nodemailer** - Email notifications and verification

---

## 📦 Installation

### Prerequisites
```bash
node >= 18.0.0
npm >= 9.0.0
```

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/study-sync-daily.git
cd study-sync-daily
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_key

# OAuth Providers
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret

# AI (Google Gemini)
GEMINI_API_KEY=your_gemini_api_key

# Payment Gateway (Razorpay)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Email (Gmail SMTP)
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_gmail_app_password

# Admin
ADMIN_EMAIL=admin@yourdomain.com
```

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
study-sync-daily/
├── app/                          # Next.js 15 App Router
│   ├── api/                      # API Routes
│   │   ├── ai/                   # AI endpoints (notes, quiz)
│   │   ├── auth/                 # Authentication
│   │   ├── checkout/             # Payment processing
│   │   ├── planner/              # Blueprint generation
│   │   ├── tasks/                # Task management
│   │   └── user/                 # User management
│   ├── auth/                     # Auth pages
│   ├── dashboard/                # Main dashboard
│   ├── ai/                       # AI tools pages
│   ├── pricing/                  # Pricing page
│   └── layout.js                 # Root layout
├── components/                   # React components
│   ├── DailyBlueprintTimeline.js # Visual timeline
│   ├── PomodoroTimer.js          # Timer component
│   ├── TaskForm.js               # Task creation
│   ├── ReflectionForm.js         # Daily reflection
│   └── Navbar.js                 # Navigation
├── lib/                          # Utilities & services
│   ├── aiService.js              # Gemini AI integration
│   ├── auth.js                   # NextAuth configuration
│   ├── creditEnforcement.js      # Credit system
│   ├── emailService.js           # Email sending
│   └── plannerLogic.js           # Blueprint algorithm
├── models/                       # Mongoose schemas
│   ├── user.js                   # User model
│   ├── AcademicTask.js           # Tasks
│   ├── Routine.js                # Recurring events
│   └── Reflection.js             # Daily reflections
└── public/                       # Static assets
```

---

## 🎯 Key Features Explained

### 1. Daily Blueprint Generation
The core planning engine that:
- Fetches your fixed routines (classes, meals, sleep)
- Identifies free time slots throughout the day
- Prioritizes tasks by due date, priority, and past-due status
- Allocates study sessions (30-90 minutes) intelligently
- Persists the plan for the entire day (24-hour cache)

**Algorithm Highlights:**
- Conflict detection and resolution
- Optimal session length calculation
- Priority-based task placement
- Support for recurring routines

### 2. AI Credit System
**How It Works:**
- Each plan has monthly credit allotment
- Credits reset on the 1st of each month
- Premium/Pro Max plans have unlimited credits
- Credits deducted only on successful AI operations
- Automatic refund on API failures

**Credit Costs:**
- AI Notes: 1 credit
- AI Quiz: 2 credits
- Focus Prediction: 1 credit

### 3. Pomodoro Timer
**Features:**
- 25-minute focus sessions
- 5-minute short breaks
- 15-minute long breaks (every 4 sessions)
- Optional task linking for automatic time tracking
- Standalone mode for general use
- Session counter and total focus time

### 4. Study Groups
**Collaboration Features:**
- Create and join study groups by subject
- Real-time messaging (polling-based)
- Member management
- Group analytics (coming soon)

---

## 🔐 Security Features

- **Password Requirements**: 8+ characters, uppercase, lowercase, number, special character
- **Account Locking**: Temporary lock after multiple failed login attempts
- **Email Verification**: Secure token-based verification
- **Password Reset**: Time-limited reset tokens (1 hour expiry)
- **Session Management**: Secure JWT-based sessions
- **Rate Limiting**: API request throttling
- **CSRF Protection**: Built-in NextAuth CSRF tokens

---

## 💳 Payment Integration

**Razorpay Features:**
- Secure payment gateway integration
- Support for multiple payment methods
- Automatic subscription management
- Invoice generation
- Payment history tracking
- Webhook handling for payment events

**Subscription Flow:**
1. User selects plan on pricing page
2. Razorpay checkout modal opens
3. Payment verification on server
4. Credits allocated instantly
5. Email confirmation sent
6. Session updated with new plan

---

## 📧 Email Notifications

**Automated Emails:**
- ✅ Email verification on signup
- 🔒 Password reset requests
- 📋 Task reminders (upcoming deadlines)
- 💳 Subscription confirmations
- 🔐 Account security alerts
- 📊 Weekly reflection summaries

---

## 🎨 Design Philosophy

**UI/UX Principles:**
- **Clean & Minimal**: Focus on content, not clutter
- **Dark Mode First**: Eye-friendly default theme
- **Responsive Design**: Mobile, tablet, desktop optimized
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: <3s initial load, optimized images
- **Animations**: Subtle, meaningful micro-interactions

**Color Palette:**
```css
--accent-from: #3b82f6  /* Blue 500 */
--accent-to: #1d4ed8    /* Blue 700 */
--success: #10b981      /* Emerald 500 */
--warning: #f59e0b      /* Amber 500 */
--error: #ef4444        /* Red 500 */
```

---

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Login and deploy
   vercel login
   vercel
   ```

2. **Environment Variables**
   - Add all variables from `.env.local` in Vercel dashboard
   - Update `NEXTAUTH_URL` to your production URL

3. **Domain Configuration**
   - Add custom domain in Vercel settings
   - Update DNS records

### Alternative Platforms
- **Netlify**: Add build command `npm run build` and output directory `.next`
- **Railway**: Connect repo and add environment variables
- **DigitalOcean App Platform**: Use Docker or buildpack deployment

---

## 📊 API Documentation

### Authentication
```javascript
// Register
POST /api/auth/register
Body: { email, password, username, name? }

// Login
POST /api/auth/signin
Body: { email, password }

// OAuth
GET /api/auth/signin/:provider
Providers: google, github, linkedin
```

### Tasks
```javascript
// Get all tasks
GET /api/tasks

// Create task
POST /api/tasks
Body: { title, subject?, dueDate, estimatedDuration?, priority? }

// Update task
PUT /api/tasks
Body: { id, isCompleted?, actualDurationDelta? }
```

### AI Tools
```javascript
// Generate notes
POST /api/ai/notes
Body: { content }
Response: { success, notes, credits }

// Generate quiz
POST /api/ai/quiz
Body: { topic, difficulty?, questionCount? }
Response: { success, quiz: { questions }, credits }
```

### Planner
```javascript
// Get daily blueprint
GET /api/planner/blueprint

// Save blueprint
POST /api/planner/blueprint
Body: { routines, assignments, microGoals, focusPrediction? }
```

---

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linter
npm run lint

# Type checking
npm run type-check
```

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Coding Standards
- Follow ESLint configuration
- Write meaningful commit messages
- Add JSDoc comments for functions
- Update README for new features
- Test on multiple browsers


## 🙏 Acknowledgments

- **Next.js Team** - Amazing React framework
- **Vercel** - Seamless deployment platform
- **Google Gemini** - Powerful AI capabilities
- **Razorpay** - Reliable payment processing
- **MongoDB** - Flexible database solution
- **Tailwind CSS** - Beautiful utility-first CSS
- **Lucide Icons** - Clean, consistent icons

---

