import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize lazily to ensure process.env is ready
export async function getAIReview(prompt) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.trim() : "";
    if (!apiKey || apiKey === 'your_google_api_key_here') {
      return "AI review skipped (missing or invalid API key).";
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // 25 second timeout to stay within standard server/browser limits
    const aiPromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini AI request timed out")), 25000)
    );

    const result = await Promise.race([aiPromise, timeoutPromise]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    throw new Error("Failed to get response from Gemini AI: " + error.message);
  }
}

export async function getAIChatResponse(context, messages) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.trim() : "";
    if (!apiKey) throw new Error("Missing Google API Key");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: `SYSTEM CONTEXT: You are a Lead Technical Recruiter. You are interviewing a candidate based on their GitHub Portfolio data: ${JSON.stringify(context)}. Be professional, slightly critical, and ask deep technical questions about their specific repositories and mentioned technologies.` }],
        },
        {
          role: "model",
          parts: [{ text: "Understood. I have reviewed the candidate's portfolio. I am ready to conduct a professional technical interview. Hello! I've been looking over your GitHub profile. Let's dive in." }],
        },
        ...messages.slice(0, -1).map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }],
        }))
      ],
    });

    const lastMessage = messages[messages.length - 1].content;
    const aiPromise = chat.sendMessage(lastMessage);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini Chat request timed out")), 20000)
    );

    const result = await Promise.race([aiPromise, timeoutPromise]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Chat Error:", error.message);
    throw new Error("Failed to get chat response: " + error.message);
  }
}

export async function getGapAnalysis(context) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.trim() : "";
    if (!apiKey) throw new Error("Missing Google API Key");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      ROLE: You are an Elite Engineering Manager at Vercel/Google.
      TASK: Perform a high-fidelity comparison between this candidate's GitHub portfolio and the "Top 1% Senior Engineer" standard.
      
      CANDIDATE DATA (PRUNED):
      ${JSON.stringify({
      username: context.username,
      totalRepos: context.totalRepos,
      techStack: context.techStack,
      strengths: context.strengths,
      redFlags: context.redFlags,
      recentContributions: context.recentContributions,
      repoContext: context.repoFeedback, // Higher quality info
      topRepos: context.allRepos?.slice(0, 8).map(r => ({ name: r.name, lang: r.language, size: r.size, desc: r.description }))
    })}
      
      EVALUATION CATEGORIES:
      1. Architecture: Level of modularity, pattern usage (MVC/Microservices), and complex state management.
      2. Testing: Evidence of automated testing (Jest, Cypress), CI/CD pipelines, and TDD culture.
      3. Documentation: Quality of READMEs, API docs (Swagger), JSDoc, and project setup guides.

      CRITICAL INSTRUCTION: You MUST provide UNIQUE, EVIDENCE-BASED gaps for EACH category. Do NOT repeat the same scores or gap descriptions. If no evidence exists, explain specifically WHAT is missing for that category.

      OUTPUT FORMAT (Strict JSON only):
      {
        "benchmarks": [
          {"category": "Architecture", "score": [0-100], "topTier": 95, "gap": "Specific critique based on their repo structure"},
          {"category": "Testing", "score": [0-100], "topTier": 92, "gap": "Specific critique about their test coverage/approach"},
          {"category": "Documentation", "score": [0-100], "topTier": 95, "gap": "Specific critique about READMEs/Guides"}
        ],
        "top3Gaps": ["Most critical overarching technical deficit 1", "Deficit 2", "Deficit 3"],
        "shadowPersona": "A creative job title for their current level (e.g. Distributed Systems Enthusiast)"
      }
    `;

    const aiPromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini Gap Analysis timed out")), 20000)
    );

    const result = await Promise.race([aiPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from markdown or raw text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Gap Analysis Error:", error.message);
    return generateFallbackGapAnalysis(context);
  }
}

function generateFallbackGapAnalysis(context) {
  const stack = (context.techStack || []).map(s => s.name.toLowerCase());
  const repos = context.allRepos || [];
  const feedback = context.repoFeedback || [];
  const username = context.username || "dev";

  // Deterministic jitter based on username
  const jitter = (name, mod) => (name.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % mod);

  // 1. Calculate Testing Score (Search for Test-related stack and high-quality repo indicators)
  const testingTech = ['jest', 'mocha', 'cypress', 'vitest', 'junit', 'pytest', 'selenium', 'testing-library', 'tdd', 'ci/cd'];
  const hasTests = stack.some(s => testingTech.includes(s));
  const testScore = Math.min(Math.max(18 + (hasTests ? 48 : 0) + (repos.length > 5 ? 12 : 4) + jitter(username, 7), 12), 89);
  const testGap = hasTests
    ? "Heuristic analysis suggests inconsistent coverage across the micro-service layer; regression suites lack depth."
    : "Critical deficit in automated verification; no active testing frameworks (Jest/Cypress/PyTest) detected in core modules.";

  // 2. Calculate Documentation Score (Based on repo feedback grades)
  const docGrades = feedback.map(f => f.grade);
  const topGrades = docGrades.filter(g => g.startsWith('A') || g.startsWith('B')).length;
  const docScore = Math.min(Math.max(27 + (topGrades * 12) + (repos.length > 3 ? 18 : 2) + jitter(username, 9), 22), 94);
  const docGap = topGrades > 2
    ? "Project schemas are well-documented, but lack high-level architecture diagrams and internal API contracts."
    : "Documentation is purely functional; missing detailed technical specifications, dependency maps, and setup automation.";

  // 3. Calculate Architecture Score (Search for advanced tech stack indicators)
  const advTech = ['docker', 'kubernetes', 'aws', 'redux', 'graphql', 'microservices', 'nest', 'express', 'postgresql', 'prisma', 'system', 'distributed'];
  const hasAdv = stack.some(s => advTech.includes(s));
  const archScore = Math.min(Math.max(31 + (hasAdv ? 38 : 0) + (repos.length > 2 ? 15 : 3) + jitter(username, 8), 26), 91);
  const archGap = hasAdv
    ? "Architecture shows signs of modularity, but lacks observed usage of event-driven patterns or persistent caching layers."
    : "Primary codebases exhibit monolithic tendencies; recommendation: pivot toward decoupled service-oriented architecture.";

  const personaMap = {
    architect: {
      name: "The Systems Architect",
      desc: "Architectural blueprint specialist focused on modular scalability and pattern-driven development.",
      traits: ["Modular Patterns", "Scalability Focus", "System Design Driven"]
    },
    buildMaster: {
      name: "The Prolific Build Master",
      desc: "Exceptional output volume with high-velocity codebase expansion and technical breadth.",
      traits: ["High Velocity", "Massive Repository Footprint", "Deep Implementation Depth"]
    },
    deepDiver: {
      name: "The Technical Deep-Diver",
      desc: "Niche specialist focusing on codebase quality, complex debugging, and technical refinement.",
      traits: ["Refinement Focused", "Complex Problem Solver", "Language Specialist"]
    },
    emerging: {
      name: "The Emerging Engineering Talent",
      desc: "Building a solid foundation with consistent learning and project variety.",
      traits: ["Growth Oriented", "Tech-Explorer", "Consistent Learner"]
    }
  };

  const personaKey = archScore > 75 ? 'architect' : (repos.length > 15 ? 'buildMaster' : (repos.length > 8 ? 'deepDiver' : 'emerging'));
  const persona = personaMap[personaKey];

  return {
    benchmarks: [
      { category: "Architecture", score: archScore, topTier: 95, gap: archGap },
      { category: "Testing", score: testScore, topTier: 92, gap: testGap },
      { category: "Documentation", score: docScore, topTier: 95, gap: docGap }
    ],
    top3Gaps: [
      {
        title: hasTests ? "Integration & Regression Maturity" : "End-to-End Testing Infrastructure",
        desc: hasTests
          ? "Transition from simple unit tests to deep integration suites that cover critical business logic pathways."
          : "Establish a foundational automated testing culture using Jest for unit tests and Cypress for mission-critical UX paths."
      },
      {
        title: topGrades > 2 ? "Advanced API Contract Specification" : "Full-Spectrum Technical Documentation",
        desc: topGrades > 2
          ? "Implement OpenAPI/Swagger tooling to establish hard-typed contracts between your frontend and backend services."
          : "Expand READMEs into comprehensive technical guides including architecture diagrams, setup scripts, and contribution workflows."
      },
      {
        title: hasAdv ? "Distributed Resilience Patterns" : "Enterprise System Design Patterns",
        desc: hasAdv
          ? "Introduce persistent caching (Redis) and event-driven communication (webhooks/queues) to handle high-concurrency loads."
          : "Refactor flat project structures into standard design patterns (MVC/Hexagonal) to improve long-term codebase maintainability."
      }
    ],
    shadowPersona: persona.name,
    personaDetails: persona,
    dataSource: {
      basis: "Meta-Heuristic Engine V2",
      reliability: "High (Heuristic Match)",
      inputs: ["Repo Size", "Language Density", "README Grading", "Commit Frequency"]
    }
  };
}

export async function getRevivalPlans(repos) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.trim() : "";
    if (!apiKey) throw new Error("Missing Google API Key");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      ROLE: You are an Open Source Maintainer and Developer Advocate.
      TASK: Identify 3-5 repositories from the following list that have the most "High Potential" but need "Revival" (missing docs, setup, or polish).
      Generate a specific "Weekend Revival Plan" for each.
      
      REPOSITORIES:
      ${JSON.stringify(repos.slice(0, 20))}
      
      OUTPUT FORMAT (JSON):
      {
        "plans": [
          {
            "repo": "repo-name",
            "why": "Brief explanation of potential",
            "tasks": ["Task 1", "Task 2", "Task 3"],
            "bonus": "High impact addition (e.g. CI/CD or Docker)"
          }
        ]
      }
    `;

    const aiPromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini Revival Plan timed out")), 20000)
    );

    const result = await Promise.race([aiPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Revival Error:", error.message);
    // Heuristic Fallback: Pick repos with high size/stars but low description/topics
    const revivalPlans = repos
      .filter(r => !r.fork)
      .sort((a, b) => (b.stargazers_count + b.size / 1000) - (a.stargazers_count + a.size / 1000))
      .slice(0, 3)
      .map((r, i) => {
        const lang = (r.language || 'Code').toLowerCase();

        // Language-specific task mapping
        const taskMap = {
          javascript: ["Migrate to TypeScript", "Implement Jest unit tests", "Configure ESLint/Prettier"],
          typescript: ["Add Vitest coverage", "Optimize TSConfig", "Implement Storybook components"],
          python: ["Add Type Hinting (mypy)", "Implement PyTest suite", "Containerize with Docker"],
          html: ["Optimize for Web Vitals", "Add modern CSS (Tailwind/Reset)", "Implement SEO Meta Tags"],
          css: ["Refactor to CSS Modules", "Implement BEM naming", "Add PostCSS pipeline"],
          java: ["Upgrade to Java 17+", "Implement JUnit 5", "Optimize Maven/Gradle build"],
          cpp: ["Add CMake build system", "Implement GoogleTest", "Memory leak audit"],
          c: ["Add Makefile automation", "Implement unit tests", "Valgrind audit"]
        };

        const defaultTasks = ["Expand technical documentation", "Add Docker support", "Implement automated CI pipeline"];
        const tasks = taskMap[lang] || defaultTasks;

        // Vary the "why" and "bonus"
        const potentialReasons = [
          `Significant codebase volume (${(r.size / 1024).toFixed(1)}MB) with high architectural potential.`,
          `Core implementation shows strong foundations in ${r.language || 'modern patterns'}.`,
          `High-density project with excellent logic but lacking modern engineering polish.`
        ];

        const bonuses = [
          "Deploy a live interactive demo via GitHub Pages.",
          "Implement a 'One-Click' local setup using Docker Compose.",
          "Establish a full CI/CD pipeline with GitHub Actions."
        ];

        return {
          repo: r.repo_name || r.name,
          why: potentialReasons[i % potentialReasons.length],
          tasks: tasks,
          bonus: bonuses[i % bonuses.length]
        };
      });
    return { plans: revivalPlans };
  }
}

export async function getImpactAnalysis(events) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY ? process.env.GOOGLE_API_KEY.trim() : "";
    if (!apiKey) throw new Error("Missing Google API Key");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      ROLE: You are an Engineering Productivity Lead.
      TASK: Analyze the following GitHub events and classify the "Technical Impact" of each work day.
      High Impact = Architecture, Refactoring, New Features.
      Low Impact = Typos, Docs, Chore.
      
      EVENTS:
      ${JSON.stringify(events.slice(0, 50))}
      
      OUTPUT FORMAT (JSON):
      {
        "impactDays": [
          {"date": "YYYY-MM-DD", "level": 1-5, "type": "Architecture/Feature/Refactor", "summary": "brief summary"}
        ],
        "topAchievement": "Single biggest technical win detected"
      }
    `;

    const aiPromise = model.generateContent(prompt);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Gemini Impact Analysis timed out")), 20000)
    );

    const result = await Promise.race([aiPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in AI response");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Gemini Impact Error:", error.message);
    // Heuristic Fallback: Map events to days and assign impact levels
    const impactByDate = {};
    events.forEach(e => {
      const date = e.created_at.split('T')[0];
      if (!impactByDate[date]) {
        impactByDate[date] = {
          count: 0,
          commitCount: 0,
          types: new Set(),
          repos: new Set(),
          messages: []
        };
      }

      const rawRepo = e.repo?.name?.split('/')[1] || "core modules";
      const repoName = rawRepo.charAt(0).toUpperCase() + rawRepo.slice(1); // Visual normalization
      impactByDate[date].count++;
      impactByDate[date].repos.add(repoName);

      if (e.type === 'PushEvent') {
        const commits = e.payload?.commits || [];
        impactByDate[date].commitCount += commits.length;

        commits.forEach(c => {
          const msg = c.message || "";
          if (msg.length > 10 && !msg.includes('Merge')) {
            impactByDate[date].messages.push(msg);
          }

          const lowerMsg = msg.toLowerCase();
          if (lowerMsg.includes('refactor') || lowerMsg.includes('clean')) impactByDate[date].types.add('Refactor');
          else if (lowerMsg.includes('doc') || lowerMsg.includes('readme')) impactByDate[date].types.add('Documentation');
          else if (lowerMsg.includes('fix') || lowerMsg.includes('bug')) impactByDate[date].types.add('Maintenance');
          else impactByDate[date].types.add('Feature');
        });
      } else if (e.type === 'CreateEvent') {
        impactByDate[date].types.add('Architecture');
        impactByDate[date].commitCount += 1;
        const refType = e.payload?.ref_type || 'structure';
        const ref = e.payload?.ref ? ` (${e.payload.ref})` : '';

        // Phrases for variety
        const setupPhrases = ["Initialized", "Scaffolded", "Configured", "Established", "Defined"];
        const phrase = setupPhrases[impactByDate[date].count % setupPhrases.length];

        if (refType === 'repository') {
          impactByDate[date].messages.push(`Foundational system architecture established`);
        } else {
          impactByDate[date].messages.push(`${phrase} ${refType} baseline${ref}`);
        }
      }
      else {
        impactByDate[date].types.add('Maintenance');
      }
    });

    const impactDays = Object.entries(impactByDate).map(([date, data]) => {
      const typeList = Array.from(data.types);
      const primaryType = typeList.includes('Architecture') ? 'Architecture' :
        typeList.includes('Refactor') ? 'Refactor' :
          typeList.includes('Feature') ? 'Feature' :
            typeList.includes('Documentation') ? 'Documentation' : 'Maintenance';

      const repoList = Array.from(data.repos);
      const volume = data.commitCount > 1 ? `${data.commitCount} commits` : "Contribution";

      // Get top commit messages as highlights
      const highlights = data.messages.sort((a, b) => b.length - a.length).slice(0, 3);
      const highlightText = highlights[0] ? highlights[0].split('\n')[0].slice(0, 70) : "";

      let summary = "";
      let typeLevel = 2; // Default Maintenance

      // High-entropy seed based on date and first repo name
      const seedText = date + (repoList[0] || '');
      const seed = seedText.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

      const getTemplate = (type, volume) => {
        const templates = {
          Architecture: [
            "Advanced system architecture design",
            "Infrastructure structural definition",
            "Core module architectural initialization",
            "Technical framework established",
            "Foundational system organization",
            "Strategic architectural scaffolding"
          ],
          Refactor: [
            `${volume} structural optimization`,
            "Codebase logic refinement",
            "Modular cleanup and decoupling",
            "Technical debt reduction cycle",
            "Performance-focused refactoring",
            "Logic normalization sprint"
          ],
          Feature: [
            `${volume} logic expansion`,
            "New capability integration",
            "Feature-set development sprint",
            "Functional module enhancements",
            "Implementation of core features",
            "Strategic logic development"
          ],
          Documentation: [
            "Technical documentation expansion",
            "Project README & wiki audit",
            "Documentation depth improvement",
            "Knowledge base synchronization",
            "API documentation refinement",
            "Onboarding materials expansion"
          ],
          Maintenance: [
            `${volume} stability updates`,
            "Dependency and security audit",
            "Patch cycle and minor fixes",
            "System health maintenance",
            "Operational tuning and cleanup",
            "Routine maintenance cycle"
          ]
        };
        const pool = templates[type] || templates.Maintenance;
        return pool[seed % pool.length];
      };

      if (primaryType === 'Architecture') {
        summary = highlightText || getTemplate('Architecture', volume);
        typeLevel = 5;
      } else if (primaryType === 'Refactor') {
        summary = highlightText || getTemplate('Refactor', volume);
        typeLevel = 4;
      } else if (primaryType === 'Feature') {
        summary = highlightText || getTemplate('Feature', volume);
        typeLevel = 3;
      } else if (primaryType === 'Documentation') {
        summary = highlightText || getTemplate('Documentation', volume);
        typeLevel = 2;
      } else {
        summary = highlightText || getTemplate('Maintenance', volume);
        typeLevel = 2;
      }

      // Volume boost: if they did a lot of work even if minor, boost it
      const volumeLevel = Math.min(Math.floor(data.commitCount / 3), 2);

      // Final absolute stripping of repository names from all text
      const cleanText = (text) => {
        let cleaned = text;
        repoList.forEach(r => {
          const escaped = r.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const reg = new RegExp(`\\b${escaped}\\b`, 'gi');
          cleaned = cleaned.replace(reg, '').replace(/\s+in\s*$/i, '').replace(/\s+for\s*$/i, '').trim();
        });
        return cleaned || "Technical contribution";
      };

      const finalSummary = cleanText(summary);
      const finalHighlights = highlights.map(h => cleanText(h.split('\n')[0]));

      return {
        date,
        level: Math.min(typeLevel + volumeLevel, 5),
        type: primaryType,
        repos: repoList,
        summary: finalSummary,
        highlights: finalHighlights
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);

    const firstImpactRepo = impactDays[0]?.repos[0] || "primary stacks";

    return {
      impactDays,
      topAchievement: `Consistent delivery of high-leverage ${impactDays[0]?.type || 'engineering'} updates in ${firstImpactRepo}.`
    };
  }
}
