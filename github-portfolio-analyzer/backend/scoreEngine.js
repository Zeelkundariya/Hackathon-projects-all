export function calculateScore(user, repos, events = []) {
  let score = 0;
  let redFlags = [];
  let strengths = [];

  // 1. Profile Hygiene (Max 20)
  if (user.bio) { score += 5; strengths.push("Bio is present"); }
  else redFlags.push("Missing bio");

  if (user.location) { score += 2; }
  if (user.email) { score += 3; strengths.push("Public email for recruiters"); }
  if (user.blog) { score += 2; strengths.push("Links to external portfolio/blog"); }

  if (user.followers >= 10) { score += 4; strengths.push("Decent follower count (Social Proof)"); }
  else if (user.followers >= 50) { score += 8; strengths.push("Strong community influence"); }

  if (user.public_repos >= 5) { score += 5; }

  // 2. Repository Quality (Max 35)
  const originalRepos = repos.filter(r => !r.fork);
  const forkedRepos = repos.filter(r => r.fork);

  // 1. Repo Volume (Max 20)
  score += Math.min(repos.length * 2, 20); // 2 points per repo up to 20

  // 2. Repo Quality (Max 30)
  let descriptionCount = 0;
  repos.forEach(repo => {
    if (repo.description) descriptionCount++;
  });

  // Weighted quality: 70% of repos having descriptions is "Perfect" for this metric
  const descriptionRatio = repos.length > 0 ? descriptionCount / repos.length : 0;
  score += Math.min(descriptionRatio * 40, 30); // Up to 30 points if ~75% have descriptions

  let hasDescriptions = 0;
  let hasHomepage = 0;
  let hasTopics = 0;
  let totalStars = 0;

  originalRepos.forEach(repo => {
    if (repo.description) hasDescriptions++;
    if (repo.homepage) hasHomepage++;
    if (repo.topics && repo.topics.length > 0) hasTopics++;
    totalStars += repo.stargazers_count;
  });

  if (originalRepos.length > 0) {
    if (hasDescriptions / originalRepos.length > 0.8) { score += 5; strengths.push("Most repos have descriptions"); }
    else if (hasDescriptions / originalRepos.length < 0.5) redFlags.push("Many repos lack descriptions");

    if (hasHomepage > 0) { score += 5; strengths.push(`Live demos available (${hasHomepage} repos)`); }
    if (hasTopics / originalRepos.length > 0.5) { score += 5; } // Good discoverability
  }

  if (totalStars > 5) { score += 5; strengths.push(`Received ${totalStars} stars across repos`); }

  // 3. Activity (Max 25)
  const activeRepos = repos.filter(r => {
    const updated = new Date(r.updated_at);
    return (Date.now() - updated) / (1000 * 60 * 60 * 24) < 90; // Active in last 3 months
  });

  const recentActivityScore = Math.min(activeRepos.length * 5, 20);
  score += recentActivityScore;

  if (activeRepos.length === 0) redFlags.push("No recent activity (last 3 months)");
  else strengths.push("Active contributor in recent months");

  // 4. "Star Power" / Impact (Max 20)
  // Calculate language diversity
  const languages = new Set(originalRepos.map(r => r.language).filter(l => l));
  if (languages.size >= 3) { score += 5; strengths.push("Polyglot developer (3+ languages)"); }

  // Pinned repos usually indicate curation (we can't fetch pinned directly easily without scraping or GraphQL, so we use star count and description quality as proxy for 'highlight' worthiness)
  const highQualityRepos = originalRepos.filter(r => r.stargazers_count > 0 && r.description);
  if (highQualityRepos.length >= 2) { score += 10; strengths.push("Has high-quality/starred projects"); }

  // 5. Penalties
  if (originalRepos.length === 0 && forkedRepos.length > 0) {
    score -= 10;
    redFlags.push("Only forked repositories found (Lack of original work)");
  }

  // Cap score
  score = Math.max(0, Math.min(Math.round(score), 100));

  let verdict =
    score >= 85 ? "Recruiter Magnet 🚀" :
      score >= 65 ? "Solid Portfolio 🌟" :
        score >= 40 ? "Needs Polish 🛠" : "Ghost Town 👻";
  // New helpers
  const roleFit = detectRoleFit(repos);

  // New Hackathon Features
  const languageBreakdown = calculateLanguageDiversity(repos);
  const communityHealth = evaluateCommunityHealth(repos, events);

  // 1. Get Top Projects (Showcase)
  const repoFeedback = generateRepoFeedback(repos);

  // Create a Set of names to exclude from Priority Fixes
  const showcasedNames = new Set(repoFeedback.map(r => r.name));

  // 2. Get Priority Fixes (Excluding Showcase)
  const priorityFixes = getPriorityFixes(repos, showcasedNames);

  // 3. Get Live Demos
  const demoRepos = getDemoRepos(repos);

  // 4. Calculate Tech Stack (Languages + Topics)
  const techStack = calculateTechStack(repos);

  const potentialScore = calculatePotentialScore(score, priorityFixes.length);

  return {
    username: user.login,
    score,
    verdict,
    totalRepos: user.public_repos,
    totalStars,
    redFlags: redFlags.slice(0, 5),
    strengths: strengths.slice(0, 5),
    roleFit,
    priorityFixes,
    potentialScore,
    languageBreakdown, // Keep for backward compatibility if needed, but techStack is better
    techStack,         // NEW: replacing languageBreakdown in UI
    communityHealth,
    repoFeedback,
    demoRepos,
    recentContributions: calculateContributions(events),
    consistency: calculateConsistency(events),
    allRepos: (() => {
      // Map repo name (short) to stats from events
      const repoStats = {};
      events.forEach(e => {
        if (e.repo && e.repo.name) {
          const repoName = e.repo.name.split('/').pop(); // Get repo name part
          if (!repoStats[repoName]) repoStats[repoName] = { events: 0, commits: 0 };

          repoStats[repoName].events += 1;
          if (e.type === 'PushEvent' && e.payload.size) {
            repoStats[repoName].commits += e.payload.size;
          }
        }
      });

      return repos.map(r => {
        const stats = repoStats[r.name] || { events: 0, commits: 0 };
        // Weighted logic: Commits are high value, size shows project "weight"
        const activityScore = (stats.commits * 20) + (r.stargazers_count * 10) + (r.forks_count * 5) + (r.size / 100);

        return {
          name: r.name,
          url: r.html_url,
          language: r.language || "Unknown",
          stars: r.stargazers_count,
          forks: r.forks_count,
          size: r.size, // in KB
          recentCommits: Math.max(stats.commits, stats.events > 0 ? 1 : 0), // Fallback to 1 if we see events
          updated_at: r.updated_at,
          description: r.description || "No description provided.",
          isFork: r.fork,
          activityScore: activityScore
        };
      }).sort((a, b) => b.activityScore - a.activityScore); // DESCENDING as requested
    })(),
    generatedAt: Date.now()
  };
}

function calculateContributions(events) {
  let count = 0;
  events.forEach(e => {
    if (e.type === 'PushEvent') count += e.payload.size;
    if (e.type === 'PullRequestEvent' && e.payload.action === 'opened') count++;
    if (e.type === 'IssuesEvent' && e.payload.action === 'opened') count++;
  });
  return count;
}

function calculateConsistency(events) {
  if (events.length === 0) return "Dormant 💤";

  // Simple check of unique days active
  const days = new Set(events.map(e => e.created_at.split('T')[0]));
  const size = days.size;

  if (size > 20) return "Daily Grinder 🔥";
  if (size > 10) return "Steady Coder 🏃";
  if (size > 5) return "Weekend Warrior ⚔️";
  return "Sporadic 🎲";
}

function calculateTechStack(repos) {
  const skills = {};
  const techWhitelist = [
    'react', 'node', 'express', 'python', 'django', 'flask', 'aws', 'docker', 'css', 'html', 'javascript', 'typescript',
    'vue', 'angular', 'nextjs', 'tailwindcss', 'mongodb', 'postgresql', 'vite', 'ui/ux',
    'sql', 'nosql', 'java', 'spring', 'kotlin', 'android', 'swift', 'ios', 'flutter', 'redux', 'graphql',
    'rest api', 'jest', 'cypress', 'webpack', 'babel', 'bootstrap', 'material-ui', 'shadcn', 'prisma', 'sequelize'
  ]; // Filtered out: git, figma, firebase, github

  repos.forEach(r => {
    // 1. Primary Language
    if (r.language) {
      const lang = r.language.toLowerCase();
      if (!['git', 'figma', 'firebase', 'github'].includes(lang)) {
        skills[lang] = (skills[lang] || 0) + 1;
      }
    }

    // 2. GitHub Topics
    if (r.topics) {
      r.topics.forEach(t => {
        const topic = t.toLowerCase();
        if (techWhitelist.includes(topic)) {
          skills[topic] = (skills[topic] || 0) + 1;
        }
      });
    }

    // 3. Smart Extraction from Name/Description
    const content = (r.name + " " + (r.description || "")).toLowerCase();
    techWhitelist.forEach(tech => {
      if (content.includes(tech)) {
        skills[tech] = (skills[tech] || 0) + 0.5;
      }
    });
  });

  return Object.entries(skills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([name, count]) => ({ name, count: Math.ceil(count) }));
}

function getPriorityFixes(repos, excludedNames = new Set()) {
  return repos
    .filter(r => !r.fork && !excludedNames.has(r.name))
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .map(repo => {
      let issue = "";
      const name = repo.name;
      const lang = repo.language || "code";

      // Smart Description Generator
      // E.g. "Innovators-Prime" -> "A [Language] project for Innovators Prime."
      const cleanName = name.replace(/-/g, ' ');
      const suggestedDesc = `A ${lang} project for ${cleanName}.`;

      if (!repo.description) {
        issue = `Action: Add a description to '${name}'. Try: "${suggestedDesc}" (Impact: +5 pts)`;
      }
      else if (!repo.homepage && !repo.has_pages) {
        issue = `Action: Deploy '${name}' live (Vercel/Netlify) or add a demo link. Recruiters want to click and see, not just read code. (Impact: +10 pts)`;
      }
      else if (repo.open_issues_count > 5) {
        issue = `Action: Close or label old issues in '${name}'. High issue counts look abandoned. (Impact: +5 pts)`;
      }
      else if (!repo.license) {
        issue = `Action: Add an MIT/Apache license to '${name}'. Unlicensed code is a red flag for companies. (Impact: +5 pts)`;
      }
      else if (!repo.topics || repo.topics.length === 0) {
        issue = `Action: Add GitHub Topics (#${lang.toLowerCase()}, #web) to '${name}'. This makes your skills searchable by recruiters. (Impact: +3 pts)`;
      }

      return { name: repo.name, issues: issue ? [issue] : [] };
    })
    .filter(r => r.issues.length > 0)
    .slice(0, 5);
}

function generateRepoFeedback(repos) {
  return repos
    .filter(r => !r.fork)
    .sort((a, b) => (b.stargazers_count * 2 + new Date(b.updated_at).getTime()) - (a.stargazers_count * 2 + new Date(a.updated_at).getTime()))
    .slice(0, 5)
    .map(repo => {
      let grade = "C";
      let tip = "Add a README.";

      const hasDesc = !!repo.description;
      const hasDemo = !!repo.homepage;
      const stars = repo.stargazers_count;
      const name = repo.name;
      const lang = repo.language || "Project";

      // Rotation for variety
      const variety = (name.length + stars) % 3;

      if (stars > 5 && hasDesc && hasDemo) {
        grade = "A+";
        if (variety === 0) tip = `Top Tier! Pin '${name}' to your profile overview so it's the first thing people see.`;
        else if (variety === 1) tip = `This is distinct. Consider writing a short article/blog post about how you built '${name}'.`;
        else tip = `Great engagement! Keep fixing bugs and replying to issues to show you're an active maintainer.`;
      }
      else if (hasDesc && hasDemo) {
        grade = "B";
        if (variety === 0) tip = `Good job on the demo. Now ensure '${name}' has a clear "How to Run" section in the README.`;
        else if (variety === 1) tip = `Nice work. Share '${name}' on LinkedIn/Twitter with a video of it in action to get more stars.`;
        else tip = `Solid. Add some screenshots or a GIF to the '${name}' README to make it visually appealing.`;
      }
      else if (hasDesc) {
        grade = "C+";
        if (variety === 0) tip = `The code looks good, but '${name}' needs a LIVE DEMO. Use Vercel, Netlify, or GitHub Pages.`;
        else if (variety === 1) tip = `Recruiters are busy. They won't clone '${name}'. Host it somewhere so they can click and play.`;
        else tip = `Can you dockerize '${name}'? Adding a Dockerfile shows advanced DevOps skills to recruiters.`;
      }
      else {
        grade = "D";
        if (variety === 0) tip = `Mystery Box: '${name}' has no description. Edit the "About" section on the right sidebar of the repo.`;
        else if (variety === 1) tip = `This repo is a ghost town. Add a README describing what '${name}' does and why you built it.`;
        else tip = `Don't leave '${name}' empty. Even a single sentence description helps SEO and context.`;
      }

      return {
        name: repo.name,
        url: repo.html_url,
        language: repo.language || "N/A",
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        grade,
        tip
      };
    });
}

function getDemoRepos(repos) {
  return repos
    .filter(r => !r.fork && (r.homepage || r.name.toLowerCase().includes('clone')))
    .map(r => {
      let host = "GitHub";
      if (r.homepage) {
        if (r.homepage.includes("vercel")) host = "Vercel";
        else if (r.homepage.includes("netlify")) host = "Netlify";
        else if (r.homepage.includes("github.io")) host = "GitHub Pages";
        else if (r.homepage.includes("heroku")) host = "Heroku";
      }

      return {
        name: r.name,
        url: r.html_url,
        demo: r.homepage || r.html_url, // Fallback to repo URL if no demo link provided
        desc: r.description || "Project featuring multiple website clones and live demos.",
        host: r.homepage ? host : "Live Demo via Repo"
      };
    })
    .sort((a, b) => {
      // Prioritize WEBSITE-CLONE at the top
      if (a.name === "WEBSITE-CLONE") return -1;
      if (b.name === "WEBSITE-CLONE") return 1;
      return 0;
    });
}

function detectRoleFit(repos) {
  let tags = { frontend: 0, backend: 0, data: 0, mobile: 0, devops: 0 };

  repos.forEach(repo => {
    const text = (repo.name + " " + (repo.description || "") + " " + (repo.language || "")).toLowerCase();

    if (text.match(/react|vue|angular|svelte|next|nuxt|css|html|tailwind|bootstrap|redux/)) tags.frontend++;
    if (text.match(/node|express|django|flask|spring|sql|mongo|postgres|firebase|api|graphql|nest/)) tags.backend++;
    if (text.match(/python|pandas|numpy|torch|scikit|tensorflow|keras|data|analysis|jupyter/)) tags.data++;
    if (text.match(/flutter|swift|kotlin|android|ios|react native|ionic/)) tags.mobile++;
    if (text.match(/docker|kubernetes|aws|ci\/cd|jenkins|terraform|ansible/)) tags.devops++;
  });

  const sorted = Object.entries(tags).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] === 0) return "Generalist Developer";

  const topRole = sorted[0][0];
  const count = sorted[0][1];

  if (count < 3) return "Aspiring Developer";

  const roleMap = {
    frontend: "Frontend Specialist",
    backend: "Backend Engineer",
    data: "Data Scientist / ML Engineer",
    mobile: "Mobile App Developer",
    devops: "DevOps Engineer"
  };

  // Check for full stack
  if (tags.frontend > 2 && tags.backend > 2) return "Full Stack Developer";

  return roleMap[topRole] || "Software Engineer";
}

function calculateLanguageDiversity(repos) {
  const counts = {};
  let total = 0;

  repos.forEach(repo => {
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] || 0) + 1;
      total++;
    }
  });

  if (total === 0) return [];

  return Object.entries(counts)
    .map(([lang, count]) => ({
      language: lang,
      count,
      percentage: Math.round((count / total) * 100)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8); // Top 8
}

function evaluateCommunityHealth(repos, events = []) {
  const originalRepos = repos.filter(r => !r.fork);
  if (originalRepos.length === 0) return { score: 0, issues: 0, licenseCount: 0 };

  const withLicense = originalRepos.filter(r => r.license).length;
  const totalForks = originalRepos.reduce((acc, r) => acc + r.forks_count, 0);
  const openIssues = originalRepos.reduce((acc, r) => acc + r.open_issues_count, 0);

  // Calculate Activity Blend (Stars + Forks + Issues + Commits)
  let totalCommits = 0;
  events.forEach(e => {
    if (e.type === 'PushEvent') totalCommits += e.payload.size || 0;
  });

  // Blend metric to ensure it's rarely 0.0 for actual developers
  const vitalityPoints = (totalCommits * 2) + (totalForks * 5) + (openIssues * 2);
  const avgActivity = originalRepos.length > 0 ? (vitalityPoints / originalRepos.length).toFixed(1) : "0.0";

  // Simple health score (0-100)
  const licenseScore = (withLicense / originalRepos.length) * 50;
  const forkScore = Math.min(totalForks, 10) * 3;
  const activityScore = Math.min(totalCommits, 20) * 1;

  return {
    licenseCount: withLicense,
    totalRepos: originalRepos.length,
    totalForks,
    openIssues,
    avgActivity,
    healthScore: Math.round(Math.min(licenseScore + forkScore + activityScore, 100))
  };
}

function calculatePotentialScore(currentScore, fixCount) {
  return Math.min(currentScore + (fixCount * 8), 100);
}
