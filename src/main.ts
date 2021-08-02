import * as core from '@actions/core';
import { Version3Client as JiraClient } from 'jira.js';

import { loadIssues } from './github';
import { releaseIssues, updateIssues } from './jira';

export async function run(): Promise<void> {
  try {
    // Config
    const app = core.getInput('app');
    const host = core.getInput('host');
    const email = core.getInput('email');
    const apiToken = core.getInput('apiToken');
    const projectKey = core.getInput('projectKey');
    const issueKeys = JSON.parse(core.getInput('issues')) as string[];
    const rawIssues = JSON.parse(core.getInput('issues')) as string[];
    const issues = rawIssues.length === 0 ? loadIssues([projectKey].concat(issueKeys)) : rawIssues;
    const transitionId = core.getInput('transitionId');
    const version = core.getInput('version') || null;
    const draft = core.getBooleanInput('draft');
    core.debug(
      `Configuration: ${JSON.stringify({
        app,
        host,
        email,
        apiToken,
        projectKey,
        issues,
        transitionId,
        version,
        draft,
      })}`,
    );

    const jira = new JiraClient({
      host,
      authentication: {
        basic: {
          email,
          apiToken,
        },
      },
      telemetry: false,
    });
    if (version) {
      await releaseIssues(jira, app, projectKey, issues, version, draft);
    }
    await updateIssues(jira, app, projectKey, issues, transitionId);
  } catch (error) {
    /* eslint-disable @typescript-eslint/no-unsafe-member-access */
    if (error.response && error.response.data) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const { errorMessages, errors } = error.response.data;
      if (errorMessages && Array.isArray(errorMessages)) {
        errorMessages.forEach((errorMessage) => core.error(errorMessage));
      }
      if (errors) {
        core.error(JSON.stringify(errors));
      }
    }
    /* eslint-enable @typescript-eslint/no-unsafe-member-access */
    core.setFailed((error as Error).message);
  }
}
