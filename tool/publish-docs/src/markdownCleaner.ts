export interface IReplaceableTerms {
  searchValue: string;
  replaceValue: string;
}

/**
 * Replace any terms from the generated markdown, useful for cleaning the output.
 */
export default (fileContents: string, replaceableTerms: IReplaceableTerms[]) => {
  let cleanContent = fileContents;
  replaceableTerms.forEach((term: IReplaceableTerms) => {
    cleanContent = cleanContent.replace(new RegExp(term.searchValue, 'g'), term.replaceValue);
  });

  return cleanContent;
};
