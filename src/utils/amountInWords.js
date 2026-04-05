/** English amount in words for Philippine invoices / OR (whole pesos + centavos). */
const UNDER_20 = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function chunkToWords(n) {
  if (n < 20) return UNDER_20[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o ? `${TENS[t]}-${UNDER_20[o]}` : TENS[t];
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    const head = `${UNDER_20[h]} hundred`;
    return rest ? `${head} ${chunkToWords(rest)}` : head;
  }
  return String(n);
}

function intToWords(n) {
  if (n === 0) return "zero";
  if (n < 0) return `negative ${intToWords(-n)}`;

  const parts = [];
  let num = n;

  const billions = Math.floor(num / 1_000_000_000);
  if (billions) {
    parts.push(`${chunkToWords(billions)} billion`);
    num %= 1_000_000_000;
  }
  const millions = Math.floor(num / 1_000_000);
  if (millions) {
    parts.push(`${chunkToWords(millions)} million`);
    num %= 1_000_000;
  }
  const thousands = Math.floor(num / 1000);
  if (thousands) {
    parts.push(`${chunkToWords(thousands)} thousand`);
    num %= 1000;
  }
  if (num) parts.push(chunkToWords(num));

  return parts.join(" ");
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function amountInWordsPeso(amount) {
  const rounded = Math.round((Number(amount) || 0) * 100) / 100;
  const pesos = Math.floor(rounded + 1e-8);
  const centavos = Math.round((rounded - pesos) * 100);

  let w = `${intToWords(pesos)} peso${pesos === 1 ? "" : "s"}`;
  if (centavos > 0) {
    w += ` and ${intToWords(centavos)} centavo${centavos === 1 ? "" : "s"}`;
  }
  return `${capitalize(w)} only`;
}
