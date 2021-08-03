import { error, getBooleanInput, getInput, setFailed } from '@actions/core';
import { Version3Client } from 'jira.js';

import { loadIssues } from '$/github';
import { releaseIssues, updateIssues } from '$/jira';
import { run } from '$/main';

jest.mock('@actions/core');
jest.mock('jira.js');
jest.mock('$/github');
jest.mock('$/jira');

describe('run', () => {
  const app = 'myapp';
  const host = 'https://jira.darioblanco.com/';
  const email = 'dario@darioblanco.com';
  const apiToken = 'secret';
  const projectKey = 'DAR';
  const issues = ['DAR-1971'];
  const transitionId = '11';
  const version = '1.0.0';

  beforeAll(() => {
    (getBooleanInput as jest.Mock).mockReturnValue(true);
  });

  test('should transition JIRA tasks', async () => {
    (getInput as jest.Mock).mockImplementation((name: string) => {
      switch (name) {
        case 'app':
          return app;
        case 'host':
          return host;
        case 'email':
          return email;
        case 'apiToken':
          return apiToken;
        case 'projectKey':
          return projectKey;
        case 'issues':
          return JSON.stringify(issues);
        case 'transitionId':
          return transitionId;
        default:
          return undefined;
      }
    });
    await run();
    expect(setFailed).not.toBeCalled();
    expect(loadIssues).not.toBeCalled();
    expect(releaseIssues).not.toBeCalled();
    expect(updateIssues).toBeCalledWith(
      expect.any(Version3Client),
      app,
      projectKey,
      issues,
      transitionId,
    );
  });

  test('should create an unpublished JIRA release', async () => {
    const issueRegex = '\\[(TEST1|TEST2)-\\d+\\]';
    (getInput as jest.Mock).mockImplementation((name: string) => {
      switch (name) {
        case 'app':
          return app;
        case 'host':
          return host;
        case 'email':
          return email;
        case 'apiToken':
          return apiToken;
        case 'projectKey':
          return projectKey;
        case 'issues':
          return '[]';
        case 'issueRegex':
          return issueRegex;
        case 'version':
          return version;
        default:
          return undefined;
      }
    });
    (loadIssues as jest.Mock).mockReturnValue(issues);
    await run();
    expect(setFailed).not.toBeCalled();
    expect(loadIssues).toBeCalledWith(issueRegex);
    expect(releaseIssues).toBeCalledWith(
      expect.any(Version3Client),
      app,
      projectKey,
      issues,
      version,
      true,
    );
    expect(updateIssues).toBeCalledWith(
      expect.any(Version3Client),
      app,
      projectKey,
      issues,
      undefined,
    );
  });

  describe('error', () => {
    test('unexpected', async () => {
      const errorMsg = 'fake';
      (getInput as jest.Mock).mockImplementation(() => {
        throw new Error(errorMsg);
      });

      await run();
      expect(error).not.toBeCalled();
      expect(setFailed).toBeCalledWith(errorMsg);
    });

    test('from JIRA axios with all data', async () => {
      const errorFixture = {
        message: 'Generic message',
        response: {
          data: {
            errorMessages: ['my error'],
            errors: {
              myErrorObject: 'myErrorValue',
            },
          },
        },
      };
      (getInput as jest.Mock).mockImplementation(() => {
        throw errorFixture;
      });

      await run();
      expect(error).toBeCalledWith(errorFixture.response.data.errorMessages[0]);
      expect(error).toBeCalledWith(JSON.stringify(errorFixture.response.data.errors));
      expect(setFailed).toBeCalledWith(errorFixture.message);
    });

    test('from  JIRA axios without data', async () => {
      const errorFixture = {
        message: 'Generic message',
        response: {
          data: {},
        },
      };
      (getInput as jest.Mock).mockImplementation(() => {
        throw errorFixture;
      });

      await run();
      expect(error).not.toBeCalled();
      expect(setFailed).toBeCalledWith(errorFixture.message);
    });
  });
});
