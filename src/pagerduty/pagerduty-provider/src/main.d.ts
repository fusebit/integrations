
// PagerDuty is a special case with it's SDK structure
// PartialCall is the type of return when you run `await api()`
type FusebitPagerDutyClient = import('@pagerduty/pdjs/build/src/api').PartialCall & { fusebit?: object };
