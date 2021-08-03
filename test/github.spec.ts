import { loadIssues } from '$/github';

const githubMock: {
  context: { eventName: string; payload: unknown };
} = jest.requireMock('@actions/github');
jest.mock('@actions/core');
jest.mock('@actions/github');

describe('github', () => {
  describe('loadIssues', () => {
    test('with pull request context', () => {
      githubMock.context = {
        eventName: 'pull_request',
        payload: {
          pull_request: { title: 'My PR Title [TEST-1234]', body: 'My PR Body [TEST-2] [TEST-2]' },
        },
      };
      expect(loadIssues('\\[TEST-\\d+\\]')).toEqual(['TEST-1234', 'TEST-2']);
    });
    test('with push context', () => {
      githubMock.context = {
        eventName: 'push',
        payload: { commits: [{ message: 'My commit message [AAA-123] [BBB-123]' }] },
      };
      expect(loadIssues('\\[(AAA|BBB)-\\d+\\]')).toEqual(['AAA-123', 'BBB-123']);
    });
    test('with release context', () => {
      githubMock.context = {
        eventName: 'release',
        payload: {
          release: {
            body: 'My release body JIRA-12 JIRA- PROJ-0 PROJECT TEST-123456 TEST-TEST FAKE-12345',
          },
        },
      };
      expect(loadIssues('(JIRA|PROJ|TEST)-\\d+')).toEqual(['JIRA-12', 'PROJ-0', 'TEST-123456']);
    });
    test('without issue matches', () => {
      githubMock.context = { eventName: 'release', payload: { release: { body: '' } } };
      expect(loadIssues('\\[TEST-\\d+\\]')).toEqual([]);
    });
    test('with unknown context', () => {
      githubMock.context = { eventName: 'unknown', payload: {} };
      expect(loadIssues('\\[TEST-\\d+\\]')).toEqual([]);
    });
  });
});
