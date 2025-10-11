# Contributing to Shadow Nox

Thank you for your interest in contributing to Shadow Nox!

## Development Guidelines

Please review our [.cursorrules](.cursorrules) file for detailed development guidelines.

## Key Principles

### Commit Size
- Keep commits small (max 500 lines of code)
- This helps us comply with ETH Online hackathon guidelines
- Make frequent, atomic commits rather than large batches

### Code Style
- UI should feel organic and human, not AI-generated
- Write clean, readable code with clear variable names
- Comment complex cryptographic operations
- Follow the project's ESLint and Prettier configurations

### Testing
- Write tests for all smart contracts
- Test bot encryption/decryption flows thoroughly
- Validate EVVM integration before deployment

### Documentation
- Update README.md when adding features
- Use NatSpec comments for smart contract functions
- Keep docs/ folder in sync with implementation

## Workflow

1. **Fork and Clone**
   ```bash
   git clone <your-fork-url>
   cd shadow-economy
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Make Changes**
   - Follow code style guidelines
   - Write tests for new functionality
   - Update documentation

5. **Test Your Changes**
   ```bash
   # Test contracts
   cd contracts && npm test
   
   # Test frontend
   cd frontend && npm run dev
   ```

6. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

7. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Message Format

Use conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:
```
feat: add encrypted swap functionality
fix: resolve async nonce collision
docs: update API reference
```

## Security

- Never commit private keys or sensitive data
- Always use `.env` files for configuration
- Review all Lit Protocol encryption flows
- Validate smart contract logic thoroughly

## Questions?

Feel free to open an issue for any questions or concerns!

## Code of Conduct

Be respectful and professional in all interactions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

