import superagent from 'superagent';

export interface IReadmeApiOptions {
  baseUrl: string;
  token: string;
  hidden: boolean;
}

export interface IReadmeApiConfig {
  docsUrl: string;
  categoriesUrl: string;
  hidden: boolean;
}

export interface IDocumentBody {
  title: string;
  name: string;
  slug: string;
  category: string;
  body: string;
}

export default class ReadmeApi {
  private config: IReadmeApiConfig;
  private agent: superagent.SuperAgentStatic & superagent.Request;

  constructor(options: IReadmeApiOptions) {
    this.config = {
      docsUrl: `${options.baseUrl}/docs/`,
      categoriesUrl: `${options.baseUrl}/categories/`,
      hidden: options.hidden,
    };

    this.agent = superagent.agent().auth('', options.token).set('Content-Type', 'application/json');
  }

  async getDocument(documentName: string): Promise<undefined | any> {
    const docResponse = await this.agent.get(`${this.config.docsUrl}${documentName}`).ok((res) => res.status < 500);
    return docResponse.notFound ? undefined : docResponse.body;
  }

  async updateDocument(documentName: string, body: IDocumentBody) {
    await this.agent.put(`${this.config.docsUrl}${documentName}`).send({ ...body, hidden: this.config.hidden });
  }

  async createDocument(body: IDocumentBody): Promise<void> {
    await this.agent.post(`${this.config.docsUrl}`).send({ ...body, hidden: this.config.hidden });
  }

  async getCategory(categoryName: string): Promise<undefined | any> {
    const categoryResponse = await this.agent
      .get(`${this.config.categoriesUrl}${categoryName}`)
      .ok((res) => res.status < 500);
    return categoryResponse.notFound ? undefined : categoryResponse.body;
  }
}
