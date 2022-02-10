interface IToBeHttp {
  statusCode?: number | number[];
  data?: any;
}

declare namespace PlaywrightTest {
  interface Matchers<R> {
    toBeHttp: ({ statusCode }: IToBeHttp) => R;
  }
}
