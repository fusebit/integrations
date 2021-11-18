---
to: src/<%= name.toLowerCase() %>/<%= name.toLowerCase() %>-provider/play/global.d.ts
---
interface IToBeHttp {
  statusCode?: number | number[];
  data?: any;
}

declare namespace PlaywrightTest {
  interface Matchers<R> {
    toBeHttp: ({ statusCode }: IToBeHttp) => R;
  }
}