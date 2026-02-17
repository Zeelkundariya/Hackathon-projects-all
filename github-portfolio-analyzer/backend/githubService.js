import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  request: {
    timeout: 30000 // 30 second timeout
  }
});

/**
 * Utility to retry GitHub API calls on timeout/network error
 */
async function withRetry(fn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      const isTimeout = err.message.toLowerCase().includes("timeout") || err.code === "ETIMEDOUT";
      if (i < retries - 1 && isTimeout) {
        console.warn(`GitHub API timeout. Retrying (${i + 1}/${retries})...`);
        await new Promise(res => setTimeout(res, delay * (i + 1))); // Exponential backoff-ish
        continue;
      }
      throw err;
    }
  }
}

export async function fetchUser(username) {
  const res = await withRetry(() => octokit.users.getByUsername({ username }));
  return res.data;
}

export async function fetchRepos(username) {
  const res = await withRetry(() => octokit.repos.listForUser({
    username,
    per_page: 100
  }));
  return res.data;
}

export async function fetchEvents(username) {
  try {
    const res = await withRetry(() => octokit.activity.listPublicEventsForUser({
      username,
      per_page: 100
    }));
    return res.data;
  } catch (err) {
    console.error("Error fetching events:", err.message);
    return [];
  }
}

export async function fetchRepoTree(owner, repo) {
  try {
    const { data: repoDetail } = await withRetry(() => octokit.repos.get({ owner, repo }));
    const defaultBranch = repoDetail.default_branch;

    const { data: tree } = await withRetry(() => octokit.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: 1
    }));

    return tree.tree;
  } catch (err) {
    console.error(`Error fetching tree for ${repo}:`, err.message);
    return [];
  }
}
