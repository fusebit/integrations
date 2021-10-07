const { generateDocumentation, lintDocs } = require('./documentation');

(async function () {
  const [, , command, categoryName] = process.argv;
  // We're generating documentation for SDK client files only (for now)
  const files = [
    {
      path: '../libc/client/Integration.js',
      order: 1,
      title: 'Integration SDK',
      description:
        'Gives you access to the SDK exposed features, like Middlewares, Storage, Tenant, Connectors, Utilities.',
    },
  ];
  switch (command) {
    case 'build':
      await generateDocumentation(categoryName, files);
      break;
    case 'lint':
      await lintDocs(files);
      break;
    default:
      throw new Error(`Command not implemented: ${command}`);
  }
})();
