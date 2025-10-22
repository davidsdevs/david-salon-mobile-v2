# Contributing to David's Salon Mobile App

Thank you for your interest in contributing to David's Salon Mobile App! This document provides guidelines and instructions for contributing.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## 🚀 Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/david-salon-mobile-expo.git
   cd david-salon-mobile-expo
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/david-salon-mobile-expo.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Set up environment variables** (see README.md)

## 📝 Development Workflow

### 1. Create a Branch

Create a new branch for your feature or bug fix:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions or updates
- `chore/` - Maintenance tasks

### 2. Make Your Changes

- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation as needed
- Write or update tests for your changes

### 3. Test Your Changes

```bash
# Run the app
npm start

# Run tests (if available)
npm test

# Type check
npm run type-check

# Lint your code
npm run lint
```

### 4. Commit Your Changes

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
git add .
git commit -m "feat: add new appointment booking feature"
```

Commit message format:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### 5. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

### 6. Create a Pull Request

1. Go to the original repository on GitHub
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill in the PR template with:
   - Description of changes
   - Related issue numbers
   - Screenshots (if UI changes)
   - Testing steps

## 📋 Pull Request Guidelines

### Before Submitting

- [ ] Code follows the project's style guidelines
- [ ] Self-review of your code completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added/updated and passing
- [ ] Changes work on iOS, Android, and Web (if applicable)

### PR Description Should Include

1. **What**: Brief description of changes
2. **Why**: Reason for the changes
3. **How**: Technical approach taken
4. **Testing**: How to test the changes
5. **Screenshots**: For UI changes
6. **Breaking Changes**: If any

## 🎨 Code Style Guidelines

### TypeScript

- Use TypeScript for all new files
- Define proper types and interfaces
- Avoid `any` type when possible
- Use meaningful variable and function names

### React Native

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

### Styling

- Use StyleSheet for component styles
- Follow the existing design system
- Ensure responsive design
- Test on different screen sizes

### File Organization

```
src/
├── components/     # Reusable components
├── screens/        # Screen components
├── navigation/     # Navigation setup
├── services/       # API and external services
├── store/          # Redux store
├── types/          # TypeScript types
├── utils/          # Utility functions
└── hooks/          # Custom hooks
```

## 🐛 Reporting Bugs

### Before Submitting a Bug Report

- Check existing issues to avoid duplicates
- Verify the bug in the latest version
- Collect relevant information

### Bug Report Should Include

1. **Description**: Clear description of the bug
2. **Steps to Reproduce**: Detailed steps
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Environment**:
   - Device/Emulator
   - OS version
   - App version
   - Node version

## 💡 Suggesting Features

### Feature Request Should Include

1. **Problem**: What problem does it solve?
2. **Solution**: Proposed solution
3. **Alternatives**: Other solutions considered
4. **Additional Context**: Any other relevant information

## 🔍 Code Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Peer Review**: At least one approval required
3. **Maintainer Review**: Final review by maintainers
4. **Merge**: Once approved, PR will be merged

## 📚 Resources

- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Firebase Documentation](https://firebase.google.com/docs)

## ❓ Questions?

If you have questions:
- Check the [README.md](README.md)
- Search existing issues
- Create a new issue with the "question" label

## 📄 License

By contributing, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing! 🎉
