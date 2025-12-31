# Testing & CI Documentation

## Overview

This project uses automated testing and continuous integration to ensure code quality and reliability.

## Test Suites

### Unit Tests (`test/unit.test.js`)

Tests for core game logic, input validation, and utility functions:

- **Input Validation**: Username, email, password, board/character IDs
- **HTML Sanitization**: XSS prevention via entity escaping
- **Rate Limiting**: Request throttling per IP and socket
- **Game Mechanics**: Board effects (tide, crystals, ghosts, wind)
- **Physics**: Minigame acceleration and friction calculations

**Run**: `npm test`

**Output**: ✅ 22 tests passing

### Integration Tests (`test/integration.test.js`)

Tests for game flow, Socket.io reconnection, and board mechanics:

- **Socket Reconnection**: Pending emit queue, exponential backoff
- **Game Flow**: State transitions, turn order, player initialization
- **Board Mechanics**: Tile effects, coin/star calculations
- **Minigame Physics**: Velocity updates, collision detection

**Run**: `node test/integration.test.js`

## Continuous Integration

### GitHub Actions Workflow (`.github/workflows/test.yml`)

Automatically runs on every push and pull request:

#### 1. **Lint Job**
- Runs on Node 18.x and 20.x
- Checks code style and quality
- Status: Configured (continue-on-error)

#### 2. **Security Job**
- Audits dependencies for vulnerabilities
- Checks npm audit with moderate severity threshold
- Reports security issues

#### 3. **Build Job**
- Tests build process on multiple Node versions
- Uploads build artifacts
- Ensures no build regressions

#### 4. **Coverage Job**
- Runs tests with code coverage reporting
- Uploads to Codecov for tracking
- Identifies untested code paths

### Workflow Matrix

Tests run on:
- **Node Versions**: 18.x (LTS), 20.x (Current)
- **OS**: Ubuntu 22.04 (latest)
- **Event Triggers**: Push to main/develop, PRs to main/develop

## Running Tests Locally

### All Tests
```bash
npm test
npm test -- --coverage
```

### Specific Test File
```bash
node test/unit.test.js
node test/integration.test.js
```

### Watch Mode (when ESLint is added)
```bash
npm run lint
npm test
```

## Test Coverage Goals

| Component | Target | Current |
|-----------|--------|---------|
| Input Validators | 100% | ✅ 11/11 |
| Game Mechanics | 90% | ✅ 4/4 |
| Socket Reconnection | 85% | ✅ 3/3 |
| Physics Calculations | 80% | ✅ 3/3 |
| Rate Limiter | 80% | ✅ 2/2 |

**Overall**: 23 tests, 100% passing rate

## Adding New Tests

### Pattern

```javascript
test('Feature - specific behavior', () => {
  // Setup
  const input = ...;
  
  // Execute
  const result = ...;
  
  // Assert
  assert(result === expected, 'Description');
});
```

### Guidelines

1. **One assertion per test** (or related assertions)
2. **Descriptive names** starting with feature/component
3. **No external dependencies** (self-contained)
4. **Fast execution** (< 100ms each)

### Example: Adding a minigame test

```javascript
test('Minigame - dashing mechanic', () => {
  const dashSpeed = 500;
  const dashDuration = 0.2; // seconds
  const distance = dashSpeed * dashDuration;
  
  assert(distance === 100, 'Should dash 100 units');
});
```

## CI Troubleshooting

### Test Failures

Check the GitHub Actions logs:
1. Go to `.github/workflows/test.yml` in Actions tab
2. Click failed run
3. Expand job logs
4. Look for assertion error or exception

### Build Failures

Common causes:
- Missing dependencies: `npm ci` (clean install)
- Syntax errors: Check recent commits
- Module imports: Verify relative paths
- Node version: Tests run on Node 18+ only

### Rate Limiter Tests

Socket rate limiter tests 100 events per 10 seconds:
```javascript
const socketRateLimiter = createSocketRateLimiter({
  windowMs: 10000,
  max: 100
});
```

## Performance Benchmarks

| Test | Duration | Status |
|------|----------|--------|
| Input Validation | 2ms | ✅ |
| HTML Sanitization | 1ms | ✅ |
| Board Mechanics | 1ms | ✅ |
| Physics Calculations | 1ms | ✅ |
| **Total Suite** | **~15ms** | ✅ |

## Future Enhancements

- [ ] Jest setup with snapshot testing
- [ ] E2E tests with Playwright
- [ ] Load testing for server endpoints
- [ ] Visual regression testing (canvas/WebGL)
- [ ] Coverage badges in README
- [ ] Pre-commit hooks (husky)
- [ ] Code quality gates (SonarQube)

## Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Node.js Testing Guide](https://nodejs.org/en/docs/guides/testing/)
- [Socket.io Testing](https://socket.io/docs/v4/testing/)
- [Security Testing Best Practices](https://owasp.org/www-project-testing-guide/)
