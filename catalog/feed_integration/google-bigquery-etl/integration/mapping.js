const createMappings = (mappings) => {
  const funcs = mappings.map((map) => async (input) => {
    try {
      return map.mappingCode && (!map.columnFilter || input[map?.column] == map.columnFilter)
        ? eval(map.mappingCode)(input)
        : undefined;
    } catch (error) {
      console.log(error);
      return `ERROR: ${error}`;
    }
  });
  return funcs;
};

const handleMapping = async (mappings, row) => {
  let result;
  for (const mapping of mappings) {
    result = await mapping(row);
    if (result) {
      return result;
    }
  }

  return undefined;
};

module.exports = { createMappings, handleMapping };
