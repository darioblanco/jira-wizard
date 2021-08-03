import * as core from '@actions/core';
import { Version3Client } from 'jira.js';

export async function releaseIssues(
  jira: Version3Client,
  app: string,
  projectKey: string,
  issues: string[],
  version: string,
  draft: boolean,
): Promise<void> {
  const versionName = `${app}/${version.replace('v', '')}`;
  const project = await jira.projects.getProject({ projectIdOrKey: projectKey });
  const projectVersions = await jira.projectVersions.getProjectVersionsPaginated({
    projectIdOrKey: projectKey,
    query: versionName,
  });
  let jiraVersion = projectVersions.values?.pop();
  if (!jiraVersion) {
    core.debug(`JIRA version ${versionName} not found. Creating...`);
    jiraVersion = await jira.projectVersions.createVersion({
      name: versionName,
      projectId: +project.id, // cast to number
      released: !draft,
    });
  } else {
    core.debug(`JIRA version ${versionName} found. Updating...`);
    await jira.projectVersions.updateVersion({
      id: jiraVersion.id as string,
      name: versionName,
      projectId: +project.id, // cast to number
      released: !draft,
    });
  }

  for (const issueKey of issues) {
    await jira.issues.editIssue({
      issueIdOrKey: issueKey,
      update: { fixVersions: [{ add: jiraVersion }] },
    });
  }
}

export async function updateIssues(
  jira: Version3Client,
  app: string,
  projectKey: string,
  issues: string[],
  transitionId?: string,
): Promise<void> {
  const projectComponents = await jira.projectComponents.getProjectComponentsPaginated({
    projectIdOrKey: projectKey,
    query: app,
  });
  let component = projectComponents.values?.pop();
  if (!component) {
    component = await jira.projectComponents.createComponent({
      name: app,
      project: projectKey,
    });
  }
  for (const issueKey of issues) {
    if (issueKey.startsWith(projectKey)) {
      // Only edit issues for the matching project key
      // - If there are multiple project keys, the transition id might be different
      // - The component is only created and ensured in the main project key
      await jira.issues.editIssue({
        issueIdOrKey: issueKey,
        update: {
          components: [{ add: component }],
        },
      });
      if (transitionId) {
        await jira.issues.doTransition({
          issueIdOrKey: issueKey,
          transition: { id: transitionId, isGlobal: true, isConditional: false },
        });
      }
    }
  }
}
