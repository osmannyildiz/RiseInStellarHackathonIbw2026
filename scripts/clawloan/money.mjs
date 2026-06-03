export function xlm(value) {
  return Number(value.toFixed(7));
}

export function formatXlm(value) {
  return `${xlm(Number(value)).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 7,
  })} XLM`;
}

export function spendable(balanceXlm, reserveXlm) {
  return xlm(Math.max(0, Number(balanceXlm) - Number(reserveXlm)));
}

export function amountDueAt(loan, now) {
  const elapsed = Math.max(0, now - loan.fundedAt);
  const steps = Math.floor(elapsed / loan.feeModel.stepSeconds);
  const feeBps = Math.min(
    loan.feeModel.baseFeeBps + steps * loan.feeModel.stepFeeBps,
    loan.feeModel.maxFeeBps,
  );
  const feeXlm = xlm((loan.principalXlm * feeBps) / 10_000);
  return {
    elapsed,
    feeBps,
    feeXlm,
    amountDueXlm: xlm(loan.principalXlm + feeXlm),
  };
}

