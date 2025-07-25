import { App } from "octokit";
import { IssueFilters, InstallationOctokit, GraphqlIssueDto } from "../models/github.model";

export const githubApp = new App({
    appId: process.env.NEXT_PUBLIC_GITHUB_APP_ID!,
    privateKey: process.env.NEXT_PUBLIC_GITHUB_APP_PRIVATE_KEY!
});

// Helper function to check if GitHub user exists
export async function checkGithubUser(username: string, octokit: InstallationOctokit) {
    const response = await octokit.rest.users.getByUsername({
        username,
    });

    return response.status === 200;
};

// Extract owner and repo from GitHub URL
function getOwnerAndRepo(repoUrl: string) {
    const [owner, repo] = repoUrl.split("/").slice(-2);

    return [owner, repo];
}

// TODO: Use octokit.graphql in place of octokit.rest

export async function getRepoDetails(repoUrl: string, octokit: InstallationOctokit) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    const response = await octokit.rest.repos.get({
        owner,
        repo,
    });

    return response.data;
};

export async function getRepoIssues(
    repoUrl: string,
    octokit: InstallationOctokit,
    filters?: IssueFilters,
    page: number = 1,
    perPage: number = 30,
) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    const response = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: "open",
        per_page: perPage,
        page,
        ...filters,
        labels: filters?.labels?.join(','),
    });

    const issues = response.data.filter(issue => !issue.pull_request);

    return issues;
};


export async function getRepoIssuesWithSearch(
    repoUrl: string,
    octokit: InstallationOctokit,
    filters?: IssueFilters,
    page = 1,
    perPage = 30,
) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);
    
    let queryString = `repo:${owner}/${repo} is:issue is:open`;
    
    if (filters?.labels?.length) {
        queryString += ` ${filters.labels.map(label => `label:"${label}"`).join(' ')}`;
    }
    
    if (filters?.milestone) {
        queryString += ` milestone:"${filters.milestone}"`;
    }
    
    queryString += ` -label:"💵 Bounty"`;

    const after = page > 1 ? `after: "${btoa(`cursor:${(page - 1) * perPage}`)}",` : '';

    const query = `
        query($queryString: String!) {
            search(
                query: $queryString,
                type: ISSUE,
                first: ${perPage},
                ${after}
            ) {
                nodes {
                    ... on Issue {
                        id
                        number
                        title
                        body
                        url
                        locked
                        state
                        createdAt
                        updatedAt
                        labels(first: 20) {
                            nodes {
                                id
                                name
                                color
                                description
                            }
                        }
                        repository {
                            url
                        }
                    }
                }
                pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                }
                issueCount
            }
        }
    `;

    const response = await octokit.graphql(query, { queryString });
    return {
        issues: (response as any)?.search?.nodes as GraphqlIssueDto[],
        hasMore: (response as any)?.search?.pageInfo?.hasNextPage as boolean
    }
}

export async function getRepoIssue(
    repoUrl: string,
    octokit: InstallationOctokit,
    issueNumber: number
) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    const response = await octokit.rest.issues.get({
        owner,
        repo,
        issue_number: issueNumber,
    });

    return response.data;
};

export async function updateRepoIssue(
    repoUrl: string,
    octokit: InstallationOctokit,
    issueNumber: number,
    body?: string,
    labels?: string[],
    assignees?: string[],
    state?: "open" | "closed",
) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    const response = await octokit.rest.issues.update({
        owner,
        repo,
        issue_number: issueNumber,
        body,
        state,
        labels,
        assignees
    });

    return response.data;
};

export async function getRepoLabels(repoUrl: string, octokit: InstallationOctokit) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    const response = await octokit.rest.issues.listLabelsForRepo({
        owner,
        repo,
        per_page: 100,
    });

    return response.data;
};

export async function createBountyLabel(repoUrl: string, octokit: InstallationOctokit) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    const response = await octokit.rest.issues.createLabel({
        owner,
        repo,
        name: "💵 Bounty",
        color: "85BB65",
        description: "Issues with a monetary reward"
        // description: "A bounty on DevAsign"
    });

    return response.data;
};

export async function getBountyLabel(repoUrl: string, octokit: InstallationOctokit) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    const response = await octokit.rest.issues.getLabel({
        owner,
        repo,
        name: "💵 Bounty",
    });

    return response.data;
};

export async function addBountyLabelToIssue(
    repoUrl: string,
    octokit: InstallationOctokit,
    issueNumber: number
) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    const response = await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: issueNumber,
        labels: ["💵 Bounty"],
    });

    return response.data;
}

export async function removeBountyLabelFromIssue(
    repoUrl: string,
    octokit: InstallationOctokit,
    issueNumber: number
) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    const response = await octokit.rest.issues.removeLabel({
        owner,
        repo,
        issue_number: issueNumber,
        name: "💵 Bounty",
    });

    return response.data;
}

export async function getRepoMilestones(repoUrl: string, octokit: InstallationOctokit) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    const response = await octokit.rest.issues.listMilestones({
        owner,
        repo,
        state: "open",
        per_page: 100,
        sort: "due_on",
        direction: "asc"
    });

    return response.data;
}

export async function createIssueComment(
    repoUrl: string,
    octokit: InstallationOctokit,
    issueNumber: number,
    body: string
) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    const response = await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body,
    });

    return response.data;
}

export async function updateIssueComment(
    repoUrl: string,
    octokit: InstallationOctokit,
    commentId: number,
    body: string
) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    const response = await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: commentId,
        body,
    });

    return response.data;
}

export async function deleteIssueComment(
    repoUrl: string,
    octokit: InstallationOctokit,
    commentId: number
) {
    const [owner, repo] = getOwnerAndRepo(repoUrl);

    await octokit.rest.issues.deleteComment({
        owner,
        repo,
        comment_id: commentId,
    });

    return true;
}