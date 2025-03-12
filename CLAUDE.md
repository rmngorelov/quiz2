# Quiz App Project Guidelines

## Project Structure
- `index.html`: Main HTML entry point
- `css/styles.css`: CSS styling
- `js/app.js`: App initialization and UI interaction
- `js/quiz.js`: Quiz logic implementation (OOP pattern)
- `data/questions.json`: Quiz questions database
- `sounds/*.mp3`: Audio feedback files

## Development Commands
- **Run locally**: Open `index.html` in a browser
- **Validate HTML**: `npx html-validate index.html`
- **Lint JS**: `npx eslint js/*.js`
- **Lint CSS**: `npx stylelint "css/*.css"`
- **Format code**: `npx prettier --write **/*.{js,html,css,json}`
- **Format specific file**: `npx prettier --write js/app.js`

## Code Style Guidelines
- Use ES6+ JavaScript features (classes, arrow functions, const/let)
- Follow camelCase for variables/functions, PascalCase for classes
- 2-space indentation for all files
- Handle errors with try/catch blocks for async operations
- Use descriptive variable/function names that reflect purpose
- Document complex logic with concise comments
- Implement state persistence with localStorage
- Maintain semantic HTML structure
- Create modular, single-responsibility functions
- Separate UI logic (app.js) from business logic (quiz.js)
- Use responsive design patterns with media queries

## Quiz App Features
- Question randomization
- Progress tracking with visual feedback
- Mastery-based learning (spaced repetition)
- Challenge mode for difficult questions
- Audio feedback for answers
- Persistence of learning progress