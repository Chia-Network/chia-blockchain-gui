const ln2pi = Math.log(2 * Math.PI);
// Compute ln(n!) - natural logarithm of the factorial of n
function lnFact(m: number) {
  let k = m;
  if (m === 0 || m === 1) {
    return 0;
  }
  if (m < 10) {
    // Compute factorial directly for small n
    let f = 2;
    for (let i = 3; i <= m; i++) {
      f *= i;
    }
    return Math.log(f);
  }
  // Log-Gamma function approximation
  k++;
  const lnN = Math.log(k);
  const one810 = 0.001_234_567_901_234_567_9;
  let ret = ln2pi - lnN;
  let k6 = k * k * k;
  k6 *= k6;
  ret += k * (2 * lnN + Math.log(k * Math.sinh(1 / k) + one810 / k6) - 2);
  ret /= 2;
  return ret;
}

// Compute ln(C(n, k)) - natural logarithm of the binomial coefficient C(n, k)
function lnComb(m: number, k: number, lnFactM: number) {
  return lnFactM - lnFact(k) - lnFact(m - k);
}

// Compute probability P(X <= t) where X has binomial distribution with n
// trials and success probability p.
export function binomialProb(n: number, p: number, t: number) {
  let s = 0;
  const lnP = Math.log(p);
  const lnPInv = Math.log(1 - p);
  const lnFactN = lnFact(n);

  for (let i = 0; i <= t; i++) {
    const c = lnComb(n, i, lnFactN);
    const lnProb = c + i * lnP + (n - i) * lnPInv;
    s += Math.exp(lnProb);
  }

  return s;
}
