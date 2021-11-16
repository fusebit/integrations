# Playwright E2E tests

## Using Reporters

Playwright Test comes with a few built-in reporters for different needs and ability to provide custom reporters. The easiest way to try out built-in reporters is to pass --reporter [Read more here](https://playwright.dev/docs/test-reporters/)

Example:

Run inside this package:

```
npx playwright test --reporter=line
```

## Generate test code
Usually, you don't need to select the DOM elements yourself. Start the code generator tool to generate selector code and use them for your tests.
[Read more here](https://playwright.dev/docs/codegen#generate-tests)

```
npx playwright codegen https://github.com
```