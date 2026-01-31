import http from "k6/http";
import { sleep } from "k6";
// import { __VU } from "k6/execution";

export let options = {
  vus: 200,
  duration: "10s",
};

export default function () {
  const payload = JSON.stringify({
    userId: __VU,
    contestID: 13,
    problemId: 21,
    code: '"elppa",,,,,@'
  });

  const res = http.post(
    // "https://api-stranger-codes.up.railway.app/api/submissions",
    "http://host.docker.internal:5000/api/submissions",
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