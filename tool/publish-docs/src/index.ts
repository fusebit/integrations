import { generateDocumentation, lintDocs } from './documentation';
const publishConfig = require('./publish-config.json');

(async function () {
  const [, , command, categoryName] = process.argv;
  const { files, theme, replaceableTerms } = publishConfig;
  switch (command) {
    case 'build':
      await generateDocumentation(categoryName, files, theme, replaceableTerms);
      break;
    case 'lint':
      await lintDocs(files);
      break;
    default:
      throw new Error(`Command not implemented: ${command}`);
  }
})();
