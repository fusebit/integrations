const documentation = require('documentation');
const { existsSync, read } = require('fs');
const { resolve, basename, dirname } = require('path');
const styles = require('./styles');
const ReadmeApi = require('./ReadmeApi');
const markdownCleaner = require('./markdownCleaner');

/**
 * Generates and upload documentation from the specified files to readme.com
 * @param {string} categoryName
 * @param {string[]} files
 * @param {documentation.formats} format
 */
const generateDocumentation = async (categoryName, files, format = documentation.formats.md) => {
  try {
    const options = {
      baseUrl: process.env.README_BASE_URL || 'https://dash.readme.com/api/v1',
      token: process.env.README_API_KEY,
      hidden: (process.env.README_HIDDEN || 'true') === 'true',
    };
    const readme = new ReadmeApi(options);
    if (!process.env.README_API_KEY) {
      throw new Error('Missing readme API Key');
    }
    console.log(
      `Configured with the following options:${JSON.stringify({ baseUrl: options.baseUrl, hidden: options.hidden })}`
    );
    const category = await readme.getCategory(categoryName);
    if (!category) {
      throw new Error(`Category ${categoryName} not found, you should create it first at readme.com`);
    }

    for await (const file of files) {
      const filePath = resolve(__dirname, file.path);
      if (!existsSync(filePath)) {
        throw new Error(`\u2639 File not found:${filePath}, forgot to run build command?`);
      }
      const folder = basename(dirname(filePath));
      const fileName = basename(filePath);
      const documentName = `${folder}-${fileName}`.replace('.js', '').toLowerCase();
      const fileContent = await documentation.build(filePath, {}).then(format);
      console.log(`\u2139 Validating document ${documentName} exists at readme.com`);
      const document = await readme.getDocument(documentName);
      const documentBody = {
        title: file.title,
        name: documentName,
        slug: documentName,
        category: category._id,
        body: `${styles}>${file.description}${markdownCleaner(fileContent)}`,
      };
      console.log(`\u2139 ${document ? 'Updating' : 'Creating'} document ${documentName} . . .`);
      document ? await readme.updateDocument(documentName, documentBody) : await readme.createDocument(documentBody);
      console.log('\u2713 Done');
    }
  } catch (error) {
    console.error('\u26a0 Command failed:\n', error);
  }
};
/**
 * Executes lint command against jsdocs
 * @param {string[]} files
 * @param {*} logger
 */
const lintDocs = async (files, logger = console.log) => {
  for await (const file of files) {
    const filePath = resolve(__dirname, file.path);
    if (!existsSync(filePath)) {
      throw new Error(`\u26a0 File not found:${filePath}`);
    }
    logger(await documentation.lint(filePath, {}));
  }
};

module.exports = {
  generateDocumentation,
  lintDocs,
};
