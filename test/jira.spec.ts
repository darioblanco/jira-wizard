import { Version3Client } from 'jira.js';

import { releaseIssues, updateIssues } from '$/jira';

jest.mock('@actions/core');

describe('jira', () => {
  const app = 'myapp';
  const projectKey = 'PROJ';
  const issues = ['PROJ-1', 'JIRA-2', 'JIRA-3'];
  const version = '1.0.0';
  const draft = true;
  const description = 'test description';

  const project = {
    id: 1,
    key: projectKey,
    name: 'PROJECT',
  };
  const editIssue = jest.fn().mockResolvedValue(undefined);
  const getProject = jest.fn().mockResolvedValue(project);
  const baseMock = {
    issues: {
      editIssue,
    },
    projects: {
      getProject,
    },
  };

  beforeEach(jest.clearAllMocks);

  describe('releaseIssues', () => {
    const jiraVersion = { id: 1 };
    const jiraVersionName = `${app}/${version}`;

    test('create new jira version', async () => {
      const createVersion = jest.fn().mockResolvedValue(jiraVersion);
      const getProjectVersionsPaginated = jest.fn().mockResolvedValue({});
      const jiraMock = {
        ...baseMock,
        projectVersions: {
          createVersion,
          getProjectVersionsPaginated,
        },
      } as unknown as Version3Client;
      expect(await releaseIssues(jiraMock, app, projectKey, issues, version, draft, description)).toBe(
        undefined,
      );
      expect(getProjectVersionsPaginated).toBeCalledWith({
        projectIdOrKey: projectKey,
        query: jiraVersionName,
      });
      expect(createVersion).toBeCalledWith({
        name: jiraVersionName,
        projectId: jiraVersion.id,
        released: false,
        description,
      });
      issues.forEach((issue) =>
        expect(editIssue).toBeCalledWith({
          issueIdOrKey: issue,
          update: { fixVersions: [{ add: jiraVersion }] },
        }),
      );
    });

    test('update jira version', async () => {
      const projectVersions = {
        values: [jiraVersion],
      };
      const getProjectVersionsPaginated = jest.fn().mockResolvedValue(projectVersions);
      const updateVersion = jest.fn().mockResolvedValue(jiraVersion);
      const jiraMock = {
        ...baseMock,
        projectVersions: {
          getProjectVersionsPaginated,
          updateVersion,
        },
      } as unknown as Version3Client;
      expect(await releaseIssues(jiraMock, app, projectKey, issues, version, draft, description)).toBe(
        undefined,
      );
      expect(getProjectVersionsPaginated).toBeCalledWith({
        projectIdOrKey: projectKey,
        query: jiraVersionName,
      });
      expect(updateVersion).toBeCalledWith({
        id: jiraVersion.id,
        name: jiraVersionName,
        projectId: jiraVersion.id,
        released: false,
        description,
      });
      issues.forEach((issue) =>
        expect(editIssue).toBeCalledWith({
          issueIdOrKey: issue,
          update: { fixVersions: [{ add: jiraVersion }] },
        }),
      );
    });
  });

  describe('updateIssues', () => {
    const component = {
      id: 0,
      name: app,
    };

    test('create and assign new component', async () => {
      const getProjectComponentsPaginated = jest.fn().mockResolvedValue({});
      const createComponent = jest.fn().mockResolvedValue(component);
      const jiraMock = {
        ...baseMock,
        projectComponents: {
          getProjectComponentsPaginated,
          createComponent,
        },
      } as unknown as Version3Client;
      expect(await updateIssues(jiraMock, app, projectKey, issues)).toBe(undefined);
      expect(getProjectComponentsPaginated).toBeCalledWith({
        projectIdOrKey: projectKey,
        query: app,
      });
      expect(createComponent).toBeCalledWith({
        name: app,
        project: projectKey,
      });
      expect(editIssue).toBeCalledTimes(1);
      expect(editIssue).toBeCalledWith({
        issueIdOrKey: 'PROJ-1',
        update: { components: [{ add: component }] },
      });
    });

    test('transition issues', async () => {
      const projectComponents = {
        values: [component],
      };
      const getProjectComponentsPaginated = jest.fn().mockResolvedValue(projectComponents);
      const doTransition = jest.fn().mockResolvedValue(undefined);
      const jiraMock = {
        issues: {
          ...baseMock.issues,
          doTransition,
        },
        projectComponents: {
          getProjectComponentsPaginated,
        },
      } as unknown as Version3Client;
      const transitionId = '3';
      expect(await updateIssues(jiraMock, app, projectKey, issues, transitionId)).toBe(undefined);
      expect(getProjectComponentsPaginated).toBeCalledWith({
        projectIdOrKey: projectKey,
        query: app,
      });
      expect(editIssue).toBeCalledTimes(1);
      expect(editIssue).toBeCalledWith({
        issueIdOrKey: 'PROJ-1',
        update: { components: [{ add: component }] },
      });
      expect(doTransition).toBeCalledTimes(1);
      expect(doTransition).toBeCalledWith({
        issueIdOrKey: 'PROJ-1',
        transition: { id: transitionId, isGlobal: true, isConditional: false },
      });
    });
  });
});
