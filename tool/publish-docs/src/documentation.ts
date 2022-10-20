import { existsSync } from 'fs';
import { resolve, basename, dirname } from 'path';
const documentation = require('documentation');
import ReadmeApi from './ReadmeApi';
import markdownCleaner, { IReplaceableTerms } from './markdownCleaner';
import resolveTheme from './themes/resolveTheme';

export interface IFile {
  title: string;
  path: string;
  order: number;
}

/**
 * Generates and upload documentation from the specified files to readme.com
 * @param {string} categoryName
 * @param {string[]} files
 * @param {documentation.formats} format
 */
export const generateDocumentation = async (
  categoryName: string,
  files: IFile[],
  theme: string,
  replaceableTerms: IReplaceableTerms[],
  format = documentation.formats.md
) => {
  try {
    const options = {
      baseUrl: process.env.README_BASE_URL || 'https://dash.readme.com/api/v1',
      token: process.env.README_API_KEY || '',
      hidden: (process.env.README_HIDDEN || 'true') === 'true',
    };

    const themeCSS = await resolveTheme(theme);
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
        throw new Error(`File not found:${filePath}, forgot to run build command?`);
      }
      const folder = basename(dirname(filePath));
      const fileName = basename(filePath);
      const slug = `${categoryName}-${fileName}`.replace('.js', '').toLowerCase();
      const documentName = `${folder}-${fileName}`.replace('.js', '').toLowerCase();
      const fileContent = await documentation.build(filePath, {}).then(format);
      console.log(`ℹ Validating document ${documentName} exists at readme.com`);
      const document = await readme.getDocument(slug);
      const documentBody = {
        title: file.title,
        name: documentName,
        slug: slug,
        category: category._id,
        body: `<style>${themeCSS}</style>${markdownCleaner(fileContent, replaceableTerms)}`,
      };
      console.log(`ℹ ${document ? 'Updating' : 'Creating'} document ${documentName} . . .`);
      document ? await readme.updateDocument(slug, documentBody) : await readme.createDocument(documentBody);
      console.log('✓ Done');
    }
  } catch (error) {
    console.error('⚠ Command failed:\n', error);
  }
};
/**
 * Executes lint command against jsdocs
 * @param {string[]} files
 * @param {*} logger
 */
export const lintDocs = async (files: IFile[], logger = console.log) => {
  for await (const file of files) {
    const filePath = resolve(__dirname, file.path);
    if (!existsSync(filePath)) {
      throw new Error(`⚠ File not found:${filePath}`);
    }
    logger(await documentation.lint(filePath, {}));
  }
};
