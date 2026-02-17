# 🚀 GitHub Portfolio Analyzer

[![Watch the Demo](https://img.shields.io/badge/Watch-Video_Demo-red?style=for-the-badge&logo=youtube)](https://drive.google.com/file/d/1_a8UHTZ09-xhO3gd4JuydtWebtSv5l-8/view?usp=sharing)

> **"Your GitHub profile is your new resume. Don't let it be a ghost town."**

For many students and early-career developers, GitHub is their primary portfolio. Yet most profiles fail to communicate real skill, impact, or consistency to recruiters.
*   **Incomplete READMEs**
*   **Poor Skill Signaling**
*   **Inconsistent Activity**
*   **Low Discoverability**

A strong GitHub profile can open doors. A weak one silently closes them.

## 🎯 Our Mission
This tool bridges the gap between code and employability by:
1.  **Analyzing** public repositories and activity.
2.  **Generating** an objective "Portfolio Score".
3.  **Highlighting** strengths and red flags from a recruiter's perspective.
4.  **Providing** actionable recommendations to improve code quality and presentation.

## 🧩 Features & Scoring Dimensions
We analyze your profile based on 5 key dimensions:
*   **Profile Hygiene**: Bio, contact info, social proof (followers).
*   **Repository Quality**: Descriptions, topics, extensive documentation.
*   **Activity Consistency**: Recent commits and sustained coding habits.
*   **Star Power**: Community impact, stars earned, and language diversity (Polyglot status).
*   **Role Fit**: Automatically detects if you are a Frontend Specialist, Backend Engineer, Data Scientist, etc.
*   **📊 Historical Tracking**: Graph your score improvement over time.
*   **🕵️‍♂️ Recruiter Simulator**: Interactive AI-led technical interviews.
*   **🏗️ Architectural X-Ray**: Visual mapping of repo structures.
*   **📉 The Shadow Profile (Gap Analysis)**: AI-driven analysis that benchmarks your profile against Big Tech engineering standards. It identifies specific "Technical Gaps" in your stack and provides a "Strategic Growth Target" to help you level up.
*   **🚀 Repository Revival Engine**: Automatically identifies high-potential repositories that are "ghosting". It generates a complete **Weekend Revival Plan** with language-specific tasks to turn neglected code into portfolio pieces.
*   **💎 Impact Heatmap & Engineering Log**: A high-granularity visualization of your dev activity. It provides a **Qualitative Engineering Journal**, highlighting specific technical wins (Architecture, Refactoring, Features) with commit-level details.

## 🚀 Deliverables Checklist
*   [x] **Working Prototype**: Full analysis of public profiles.
*   [x] **Scoring System**: clear 0-100 metric with "Interview Ready" verdict.
*   [x] **Actionable Feedback**: Specific "Priority Fixes" for individual repos.
*   [x] **User-Friendly Interface**: Premium Glassmorphism UI with dark mode.

## 🏆 The Engineering Signal Calculation Engine
The 0-100 score is an objective measurement of "Engineering Authority." Here is the precise technical breakdown of how the score is calculated:

### 1. Profile Hygiene (Max 15 Points)
- **Identity (10 pts)**: Presence of Bio (+5), Location (+2), and verified contact links (+3).
- **Social Proof (5 pts)**: Scoring tracks followers (10+ = +4 pts, 50+ = +8 pts) and profile volume.

### 2. Technical Quality & Documentation (Max 35 Points)
- **Description Coverage (30 pts)**: Weighted based on the percentage of repositories with descriptions (Target: >75%). 
- **Quality Bonus (+5 pts)**: Awarded if >80% of projects have high-quality documentation.

### 3. Deployment & Discoverability (Max 15 Points)
- **Live Demos (5 pts)**: Awarded if repositories feature live `homepage` links (Vercel, Netify, etc.).
- **Technical SEO (5 pts)**: Awarded if >50% of repositories use GitHub Topics (#react, #api).
- **Star Impact (5 pts)**: Awarded for earning community stars on original work.

### 4. Engineering Velocity (Max 25 Points)
- **Active Momentum (20 pts)**: 5 pts per repository modified within the last 90 days.
- **Activity Streak (5 pts)**: Bonus for consistent contributions in the recent window.

### 5. Technical Stack Diversity (Max 10 Points)
- **Polyglot Multiplier (+5 pts)**: Awarded for mastering 3+ distinct programming languages.
- **Product Weight (+5 pts)**: Awarded for high-quality descriptive original projects.

---

### 🔮 Potential Score Formula
`Current Score + (Outstanding Priority Fixes * 8) = Potential Score (Capped @ 100)`

### 🏗️ Technical Analytics
*   **Shadow Profile**: Weightage-based benchmarking against Big Tech standards.
*   **Revival Engine**: `activityScore = (commits * 20) + (stars * 10) + (size/100)`.
*   **Role Fit**: Keyword-frequency analysis for role categorization.

## 🔮 Future Scope & Roadmap
If we had more time, here are the features we would add next:
1.  **📄 PDF Export**: Download your "Developer Audit" as a professional PDF for resumes.
2.  **🆚 Profile Comparison**: Battle mode! Compare your score with a friend's.
3.  **🌘 Dark/Light Mode Toggle**: User preference persistence.
4.  **📊 Historical Tracking**: [IMPLEMENTED] Graph your score improvement over time.
5.  **🤖 Expansion Features**: [IMPLEMENTED] Recruiter Simulator, X-Ray, Shadow Profile, Revival Engine, & Impact Heatmap.
6.  **🌐 Multi-Platform Support**: Analyze GitLab and Bitbucket profiles too.

## 🛠 Tech Stack
*   **Frontend**: React, Vite, CSS Modules (Glassmorphism design)
*   **Backend**: Node.js, Express, GitHub API
*   **AI**: OpenAI API / Google Gemini API (for "Recruiter Persona" feedback)

## 📦 Setup & Run

### ⚡ One-Click Start (Windows)
Just right-click `run.ps1` and select **Run with PowerShell**, or execute:
```powershell
./run.ps1
```
This will install dependencies, start both servers, and open the app in your browser automatically.

### Manual Setup
1.  **Clone the repo**
2.  **Backend**:
    ```bash
    cd backend
    npm install
    # Create .env with OPENAI_API_KEY / GOOGLE_GEMINI_API_KEYand GITHUB_TOKEN (optional but recommended)
    npm start
    ```
3.  **Frontend**:
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

