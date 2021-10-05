const superagent = require('superagent');

class ReadmeApi {
  constructor({ baseUrl, token, hidden }) {
    this.config = {
      docsUrl: `${baseUrl}/docs/`,
      categoriesUrl: `${baseUrl}/categories/`,
      hidden,
    };

    this.agent = superagent.agent().auth('', token).set('Content-Type', 'application/json');
  }

  async getDocument(documentName) {
    const docResponse = await this.agent.get(`${this.config.docsUrl}${documentName}`).ok((res) => res.status < 500);
    return docResponse.notFound ? undefined : docResponse.body;
  }

  async updateDocument(documentName, body) {
    await this.agent.put(`${this.config.docsUrl}${documentName}`).send({ ...body, hidden: this.config.hidden });
  }

  async createDocument(body) {
    await this.agent.post(`${this.config.docsUrl}`).send({ ...body, hidden: this.config.hidden });
  }

  async getCategory(categoryName) {
    const categoryResponse = await this.agent
      .get(`${this.config.categoriesUrl}${categoryName}`)
      .ok((res) => res.status < 500);
    return categoryResponse.notFound ? undefined : categoryResponse.body;
  }
}

module.exports = ReadmeApi;
