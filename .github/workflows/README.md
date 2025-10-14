# GitHub Actions Workflows

This directory contains automated workflows for the Shadow Nox project.

## Available Workflows

### CI/CD Pipeline (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**

1. **validate-commit**: Ensures commits are ≤ 500 lines
2. **contracts**: Builds, tests, and lints smart contracts
3. **frontend**: Builds and lints React frontend
4. **bots**: Tests and lints bot code
5. **security**: Scans for secrets and vulnerabilities
6. **code-quality**: Validates code standards
7. **documentation**: Checks documentation completeness

**Badge Status:**

You can add this badge to your README to show CI status:

```markdown
![CI Status](https://github.com/YOUR_USERNAME/YOUR_REPO/actions/workflows/ci.yml/badge.svg)
```

## Local Testing

Before pushing, run these commands to simulate CI checks:

```bash
# Full validation
npm run validate

# Individual checks
npm run lint:all
npm run test:all
npm run build
```

## Troubleshooting

If the CI pipeline fails:

1. **Check the Actions tab** on GitHub to see which job failed
2. **Review the error logs** for specific issues
3. **Run tests locally** using the commands above
4. **Fix issues** and push again

Common issues:
- Commit too large: Split into smaller commits
- Linting errors: Run `npm run lint:fix`
- Test failures: Fix tests and ensure they pass locally
- Security issues: Remove hardcoded secrets, use .env files

## Adding New Workflows

To add a new workflow:

1. Create a new `.yml` file in this directory
2. Define triggers and jobs
3. Test locally if possible
4. Commit and monitor the Actions tab

For more information, see the [GitHub Actions documentation](https://docs.github.com/en/actions).

