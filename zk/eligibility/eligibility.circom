pragma circom 2.1.6;

template Num2Bits(n) {
    signal input in;
    signal output out[n];

    var lc = 0;
    for (var i = 0; i < n; i++) {
        out[i] <-- (in >> i) & 1;
        out[i] * (out[i] - 1) === 0;
        lc += out[i] * (1 << i);
    }

    lc === in;
}

template Eligibility(bits) {
    // Private reputation witness.
    signal input score;
    signal input creditLimit;
    signal input defaults;
    signal input successfulRepayments;
    signal input lateRepayments;
    signal input totalBorrowed;
    signal input totalRepaid;
    signal input salt;

    // Public policy/request inputs.
    signal input minScore;
    signal input requestedAmount;
    signal input maxDefaults;
    signal input requestId;
    signal input reputationRoot;
    signal input nullifierHash;

    component scoreDiff = Num2Bits(bits);
    scoreDiff.in <== score - minScore;

    component creditDiff = Num2Bits(bits);
    creditDiff.in <== creditLimit - requestedAmount;

    component defaultsDiff = Num2Bits(bits);
    defaultsDiff.in <== maxDefaults - defaults;

    // Demo-grade in-circuit commitments. They bind the private witness to the
    // public proof for the demo; production should replace these with a
    // circuit-native Poseidon/Pedersen commitment.
    reputationRoot === score
        + creditLimit * 100000
        + defaults * 10000000000
        + successfulRepayments * 1000000000000000
        + lateRepayments * 100000000000000000000
        + totalBorrowed * 10000000000000000000000000
        + totalRepaid * 1000000000000000000000000000000
        + salt * 100000000000000000000000000000000000;
    nullifierHash === requestId * 1000003 + salt;
}

component main { public [minScore, requestedAmount, maxDefaults, requestId, reputationRoot, nullifierHash] } = Eligibility(16);
