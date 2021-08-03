# Jira Wizard

Manages JIRA issues from the development flow of your choice. It processes a manually provided
list of JIRA issues or discovers them based on a regex via a context.

- Creates a component for your JIRA project with the name of your application and links issues to it
- Create a JIRA release if `version` is provided for the given `app`. Discovered issues will be linked to the release
- If `transitionId` is given, move discovered JIRA issues to a different JIRA state.

## Usage examples

Link discovered JIRA tasks (from commit messages) to a component named `myapp` in the `MYPROJECT` JIRA project.

```yaml
name: 'mypush'
on:
  push:
    branches:
      - master
jobs:
  bump:
    runs-on: ubuntu-latest
    steps:
      - name: Set JIRA issues component
        uses: darioblanco/jira-wizard@main
        with:
          app: myapp
          host: ${{ secrets.JIRA_HOST }}
          email: ${{ secrets.JIRA_EMAIL }}
          apiToken: ${{ secrets.JIRA_API_TOKEN }}
          projectKey: MYPROJECT
```

Create an unpublished JIRA release with JIRA issues discovered from the title and body of a PR
that defines them with the `[PROJECTONE-\d+]` and `[PROJECTTWO-\d+]` formats.

```yaml
name: 'mypr'
on:
  pull_request:
jobs:
  bump:
    runs-on: ubuntu-latest
    steps:
      - name: Create unpublished JIRA release
        uses: darioblanco/jira-wizard@main
        with:
          app: myapp
          host: ${{ secrets.JIRA_HOST }}
          email: ${{ secrets.JIRA_EMAIL }}
          apiToken: ${{ secrets.JIRA_API_TOKEN }}
          projectKey: PROJECTONE
          issueRegex: \\[(PROJECTONE|PROJECTTWO)-\\d+\\]
          version: 1.0.0
```

Create a published JIRA release with JIRA issues discovered from the body of a release event

```yaml
name: 'myrelease'
on:
  release:
jobs:
  bump:
    runs-on: ubuntu-latest
    steps:
      - name: Create JIRA release
        uses: darioblanco/jira-wizard@main
        with:
          app: myapp
          host: ${{ secrets.JIRA_HOST }}
          email: ${{ secrets.JIRA_EMAIL }}
          apiToken: ${{ secrets.JIRA_API_TOKEN }}
          projectKey: MYPROJECT
          version: 1.0.0
          draft: false
```

Assign tasks to the `app` component manually.

```yaml
name: 'mydeployment'
on:
  deployment:
jobs:
  bump:
    runs-on: ubuntu-latest
    steps:
      - name: Set JIRA issues component
        uses: darioblanco/jira-wizard@main
        with:
          app: myapp
          host: ${{ secrets.JIRA_HOST }}
          email: ${{ secrets.JIRA_EMAIL }}
          apiToken: ${{ secrets.JIRA_API_TOKEN }}
          projectKey: MYPROJECT
          issues: '["MYPROJECT-1234", "MYPROJECT-1235"]'
```

## Development

Install dependencies

```bash
yarn
```

Compile typescript

```bash
yarn build
```

Lint code

```bash
yarn lint
```

Run the tests

```bash
yarn test
```
