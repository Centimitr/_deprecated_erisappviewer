export const get = function (url: string, params: Object) {
  const u = new URL(url);
  for (let prop in params) {
    u['searchParams'].append(prop, params[prop]);
  }
  return fetch(u.href);
};
