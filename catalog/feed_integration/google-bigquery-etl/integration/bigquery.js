const avro = require('avsc');

const google = require('./google');

const getClient = (googleClient) => googleClient.bigquery('v2');

const getDatasets = async (googleClient, projectId) =>
  (await getClient(googleClient).datasets.list({ projectId })).data.datasets;
const getTables = async (googleClient, projectId, datasetId) =>
  (await getClient(googleClient).tables.list({ projectId, datasetId })).data.tables;

const getTable = async (bigquery, projectId, datasetId, tableId) =>
  (await bigquery.tables.get({ projectId, datasetId, tableId })).data;
const getTableSize = async (bigquery, projectId, datasetId, tableId) =>
  (await getTable(bigquery, projectId, datasetId, tableId)).numTotalLogicalBytes;
const getTableSchema = async (bigquery, projectId, datasetId, tableId) =>
  (await getTable(bigquery, projectId, datasetId, tableId)).schema;

const getSizes = async (bigquery, params) => {
  const { projectId, datasetId, tableId } = params;

  const table = (await bigquery.tables.get({ projectId, datasetId, tableId })).data;
  ctx.body = {
    numBytes: table.numTotalLogicalBytes,
    numRows: table.numRows,
  };
};

const makeQuery = async (bigquery, projectId, query) => {
  const requestBody = {
    query,
    parameterMode: 'NAMED',
    queryParameters: [],
    useLegacySql: false,
    formatOptions: { useInt64Timestamp: true },
  };

  const queryResult = await bigquery.jobs.query({ projectId, requestBody });

  // Convert to a more useful array of objects, optimistically
  const schema = queryResult.data.schema.fields;
  return queryResult.data.rows.map((row) =>
    row.f.reduce((obj, val, index) => {
      obj[schema[index].name] = val.v;
      return obj;
    }, {})
  );
};

const numSamples = 100;

const getSamples = async (bigquery, projectId, datasetId, tableId) =>
  makeQuery(bigquery, projectId, `SELECT * FROM ${datasetId}.${tableId} LIMIT ${numSamples}`);

const createReadSession = async (googleClient, projectId, datasetId, tableId) => {
  const parent = `projects/${projectId}`;
  const tableReference = `projects/${projectId}/datasets/${datasetId}/tables/${tableId}`;

  const bqrClient = await google.getBigQueryReadClient(googleClient, projectId);

  // BigQuery Storage
  const readOptions = {};

  const request = {
    parent,
    readSession: {
      table: tableReference,
      dataFormat: 'AVRO',
      readOptions,
      tableModifiers: null,
    },
    maxStreamCount: 1, // Note: Reduced for testing and diagnostics; default is 1000.
  };

  const [session] = await bqrClient.createReadSession(request);
  const schema = JSON.parse(session.avroSchema.schema);

  return { session, schema };
};

const readFromStream = async (googleClient, projectId, stream, schema, handleRow, handleError, handleEnd) => {
  const bqrClient = await google.getBigQueryReadClient(googleClient, projectId);

  const avroType = avro.Type.forSchema(schema);

  const readRowsRequest = {
    readStream: stream,
    offset: 0,
  };

  return (
    bqrClient
      .readRows(readRowsRequest)
      // Pretty sure that EventEmitter supports async, but if not, consider captureRejections
      .on('data', async (data) => {
        try {
          // Decode all rows in buffer
          let pos;
          do {
            const decodedData = avroType.decode(data.avroRows.serializedBinaryRows, pos);
            if (decodedData.value) {
              await handleRow(decodedData.value);
              d = decodedData;
            }

            pos = decodedData.offset;
          } while (pos > 0);
        } catch (error) {
          console.log(`handling error: `, error);
        }
      })
      .on('error', handleError)
      .on('end', handleEnd)
  );
};

module.exports = {
  getClient,
  getDatasets,
  getTables,
  getTable,
  getTableSize,
  getTableSchema,
  getSizes,
  makeQuery,
  getSamples,
  createReadSession,
  readFromStream,
};
