import http from "k6/http";
import { sleep } from "k6";
// import { __VU } from "k6/execution";

export let options = {
  vus: 2,
  duration: "10s",
};

// "https://api-stranger-codes.up.railway.app",
// "http://host.docker.internal:5000",

const BASE_URL = "https://api-stranger-codes.up.railway.app"; 
const email = `user${__VU}@gmail.com`;
const password = "alskdjfhg";

export default function () {
  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({
      email,
      password,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (loginRes.status !== 200) {
    return;
  }

  const join = http.post(
    `${BASE_URL}/contests/13/join`,
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if(join.status !== 200) return;

  const payload = JSON.stringify({
    contestID: 13,
    problemId: 22,
    code: `&09p019p129p>09g:1\`#v_0.@
                                >2\`#v_10..@
                                     >10..>09g1-0\`                       #v_@
                                          ^p92p91g92p93.::+g92<g91<p90-1g90<`
  });

  const res = http.post(
    `${BASE_URL}/api/submissions`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );
  let printed = 0;
  if (res.status !== 200 && printed < 10) {
    console.log("FAILED:", res.status, res.body);
    printed++;
  }
  console.log("Status:", res.status);
  console.log("Body:", res.body);

  sleep(10);
}

// docker run --rm -v "%cd%:/app" -w /app grafana/k6 run load_test.js