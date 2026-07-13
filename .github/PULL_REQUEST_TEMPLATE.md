## Description

Briefly describe what this Pull Request changes and the technical rationale behind it.

## Related Issues

Fixes # (issue number)

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Refactoring (clean up of existing code structure)
- [ ] Documentation / Packaging update

## Verification Plan

### Automated Tests
Describe the commands and output of the tests run to verify these changes:
```bash
# E.g., npm run verify:prod
# E.g., npm run worker:test:webapp
```

### Manual Verification
Describe manual testing performed (e.g. mock server logs, visual screenshots, browser test reports):

## Quality Checklist

- [ ] My code follows the style guidelines of this project
- [ ] I have verified that `npm run lint` and `npm run verify:prod` pass without errors
- [ ] My commits follow the **Decision Shadow Commit Protocol** (Lore 2026) with required trailers (`Constraint:`, `Rejected:`, `Directive:`, `Not-tested:`)
- [ ] I have updated the project history logs in `docs/PROJECT_HISTORY.md` and `AGENTS_HISTORY.md` if code changes were made
