import { getAIReview } from "./aiService.js";

const aiFeedback = await getAIReview(`
Analyze this GitHub profile like a recruiter.
Username: ${username}
Score: ${scoreReport.score}
Red Flags: ${scoreReport.redFlags.join(", ")}
`);

res.json({ ...scoreReport, aiFeedback });
