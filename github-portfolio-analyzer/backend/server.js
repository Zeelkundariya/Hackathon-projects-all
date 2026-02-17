import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fetchUser, fetchRepos, fetchEvents, fetchRepoTree } from './githubService.js';
import { calculateScore } from './scoreEngine.js';
import { getAIReview, getAIChatResponse, getGapAnalysis, getRevivalPlans, getImpactAnalysis } from './aiService.js';
import { initDB, saveScore, getHistory } from './database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Database
initDB().catch(err => console.error("Database initialization failed:", err));

app.use(cors({ origin: '*' }));
app.use(express.json());
app.get('/ping', (req, res) => res.send('pong'));

// Global error handling to prevent crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  // Keep the server running if possible, or gracefully shutdown
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

app.get('/analyze/:username', async (req, res) => {
  try {
    const { username } = req.params;
    console.log(`Analyzing ${username}...`);

    // 1. Fetch Data in Parallel
    const [user, repos, events] = await Promise.all([
      fetchUser(username),
      fetchRepos(username),
      fetchEvents(username)
    ]);

    // 2. Calculate Score
    const scoreReport = calculateScore(user, repos, events);

    // 3. AI Review
    // We use a mock response if no API key is present to avoid errors during initial run
    let aiFeedback = "AI review skipped (missing API key).";

    // Check for GOOGLE_API_KEY now
    // Check for GOOGLE_API_KEY
    // Check for GOOGLE_API_KEY
    if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY !== 'your_google_api_key_here') {
      try {
        // Extract top 10 repo details for exhaustive analysis
        const repoContext = scoreReport.allRepos?.slice(0, 10).map(r =>
          `- ${r.name}: ${r.description} (${(r.size / 1024).toFixed(1)}MB, ${r.language}, ${r.stars}⭐)`
        ).join('\n');

        aiFeedback = await getAIReview(`
            ROLE: You are the CTO of a Tier-1 Tech Firm and a Lead Recruiter at a top AI Lab.
            SUBJECT: Comprehensive Technical Audit for Developer "${scoreReport.username}".
            
            CANDIDATE DATA:
            - Global Portfolio Score: ${scoreReport.score}/100
            - Primary Role: ${scoreReport.roleFit}
            - Technical Strengths: ${scoreReport.strengths.join(", ")}
            - Architectural Risks/Red Flags: ${scoreReport.redFlags.join(", ")}
            - Skill Density: ${JSON.stringify(scoreReport.techStack)}
            - Velocity: ${scoreReport.recentContributions} contributions (90-day window).
            - Behavioral Persona: ${scoreReport.consistency}
            
            FULL REPOSITORY ROSTER (TOP 10):
            ${repoContext}
            
            TASK: Generate an EXHAUSTIVE, multi-page style "RECRUITER'S MEMO". Be wordy, insightful, and brutally technical.
            
            OUTPUT SECTIONS (MARKDOWN):
            1. **🎯 THE EXECUTIVE SUMMARY (Brutal & Precise)**: A 3-paragraph summary of their market standing.
            2. **💰 MARKET VALUE AUDIT**: 
               - Estimated Salary Bracket.
               - "The $50k Gap": Detailed analysis of exactly what technical skills are missing to reach the next tax bracket.
            3. **🏗️ ARCHITECTURAL DEEP-DIVE (The Meat)**: 
               - Analyze the 10 projects above. 
               - Critique their choice of frameworks vs project size. 
               - Are they building "Tutorial Apps" or "Production Systems"?
            4. **🥇 COMPETITIVE BENCHMARKING**: 
               - Compare this candidate against candidates from Google/Meta/OpenAI.
               - What makes them stand out? What makes them invisible?
            5. **🧗 HYPER-GROWTH BATTLE PLAN (Ultra-Detailed)**:
               - Phase 1: Immediate Portfolio Surgery (Specific repos to fix).
               - Phase 2: The "Hero" Project (Detailed feature list for a new project).
               - Phase 3: Niche Dominance (Specific tech stack to master for 2026).
            6. **💡 THE "GOLDEN" ARCHITECTURE**: 
               - Propose a specific, high-scale architecture they should build (e.g. Distributed Event Mesh, Custom LLM Orchestrator).
            7. **🔮 CAREER TRAJECTORY**: 
        - Where will they be in 5 years ? (Principle Engineer, CTO, Niche Researcher).
            `);
      } catch (aiErr) {
        console.error("AI Review failed:", aiErr.message);
        const isGood = scoreReport.score > 70;
        aiFeedback = `### 🤖 Recruiter Analysis(Offline Mode)

  ** Verdict **: Your score of ** ${scoreReport.score}/100** puts you in the ${isGood ? "top bracket of active contributors." : "beginning of your professional journey."}

#### 💰 Market Value Analysis
  *   ** Current Status **: Estimating ** Junior - to - Mid ** range based on repo volume.
*   ** Target **: To reach the ** $100k + Senior tier **, focus on system design and consistent project velocity.

#### 🏗️ Score Improvement Roadmap
1. ** Quick Win **: Address ** ${scoreReport.priorityFixes?.[0]?.name || "missing project titles"}** to show professional polish.
2. ** Project Level - Up **: Build a complex, full - stack application using ** ${scoreReport.techStack?.[0]?.name || "your main tech"}** and ** Docker **.
3. ** Visibility **: Increase your 90 - day contributions(currently ** ${scoreReport.recentContributions} **) to demonstrate daily coding discipline.

#### 💡 The "Golden" Project Idea
Build a ** Real - time Analytics Dashboard ** for GitHub repos—something that shows you can handle live data and complex state management.

#### 🧠 Work Style Persona
  *   ** Status **: ** ${scoreReport.consistency}**
*   ** Recruiter Tip **: Consistency trumps intensity.Smaller, daily contributions are a "Green Flag" for hiring managers.`;
      }
    } else {
      aiFeedback = "AI feedback skipped. Add a valid GOOGLE_API_KEY to unlock a detailed $100k Recruiter Audit.";
    }

    console.log(`Sending response for ${username}.Repos count: ${scoreReport.allRepos?.length || 0} `);

    // 4. Save Score to History (Agnostic of response)
    saveScore(username, scoreReport.score).catch(err => console.error("Failed to save score:", err));

    res.json({ ...scoreReport, aiFeedback, events });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/history/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const history = await getHistory(username);
    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/chat/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { messages, context } = req.body;

    const reply = await getAIChatResponse(context, messages);
    res.json({ reply });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/xray/:username/:repo', async (req, res) => {
  try {
    const { username, repo } = req.params;
    const tree = await fetchRepoTree(username, repo);
    res.json(tree);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/shadow/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { context } = req.body;
    const analysis = await getGapAnalysis(context);
    res.json(analysis);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/revival/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { repos } = req.body;
    const plans = await getRevivalPlans(repos);
    res.json(plans);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/impact/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { events } = req.body;
    const impact = await getImpactAnalysis(events);
    res.json(impact);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
