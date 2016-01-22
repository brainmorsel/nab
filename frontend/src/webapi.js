import axios from 'axios';

let API_ENDPOINT;
if (PRODUCTION) {
  API_ENDPOINT = window.location.origin + window.location.pathname + 'api';
} else {
  API_ENDPOINT = 'http://localhost:8081/api';
}

export const call = function (action, params={}, options={}) {
  return axios.post(API_ENDPOINT, {action, params, options});
}
