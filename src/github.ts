import * as core from '@actions/core';
import * as github from '@actions/github';

export function loadIssues(issueRegex: string): string[] {
  const { eventName, payload } = github.context;
  let searchString = '';
  switch (eventName) {
    case 'pull_request':
      // https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#pull_request
      const prPayload = payload as unknown as { pull_request: { title: string; body: string } };
      core.debug(`Found PR payload: ${JSON.stringify(prPayload, null, 2)}`);
      searchString = `${prPayload.pull_request.title}\n${prPayload.pull_request.body}`;
      break;
    case 'push':
      // https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#push
      const pushPayload = payload as { commits: { message: string }[] };
      core.debug(`Found push payload: ${JSON.stringify(pushPayload, null, 2)}`);
      pushPayload.commits.forEach(({ message }) => {
        searchString = searchString.concat(`\n${message}`);
      });
      break;
    case 'release':
      // https://docs.github.com/en/developers/webhooks-and-events/webhooks/webhook-events-and-payloads#release
      const releasePayload = payload as { release: { body: string } };
      core.debug(`Found release payload: ${JSON.stringify(releasePayload, null, 2)}`);
      searchString = releasePayload.release.body;
      break;
    default:
      core.warning(
        'Github event is none of pull_request,push,release. Unable to load JIRA issues.',
      );
      return [];
  }
  // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
  const issueMatches = searchString.match(new RegExp(issueRegex, 'gmi'));
  if (!issueMatches) {
    return [];
  }
  const uniqueMatches = new Set(issueMatches);
  // Make issue list unique and strip any characters that are not alphanumeric or '-'
  return [...uniqueMatches].map((match) => match.replace(/[^\d\w-]/g, ''));
}
