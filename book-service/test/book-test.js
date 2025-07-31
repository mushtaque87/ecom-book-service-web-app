import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 100, // virtual users
  duration: '1m',
};

export default function () {
  let res = http.get('http://localhost:30080/books');
  check(res, { 'status was 200': (r) => r.status == 200 });
}