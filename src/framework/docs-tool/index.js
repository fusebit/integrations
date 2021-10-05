const { generateDocumentation, lintDocs } = require('./documentation');

(async function () {
  const [, , command, categoryName] = process.argv;
  // We're generating documentation for SDK client files only (for now)
  const files = [
    { path: '../libc/client/Integration.js', order: 1, title: 'Integration.js' },
    { path: '../libc/client/Connector.js', order: 2, title: 'Connector.js' },
    { path: '../libc/client/EntityBase.js', order: 3, title: 'EntityBase.js' },
    { path: '../libc/client/Index.js', order: 4, title: 'Index.js' },
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
