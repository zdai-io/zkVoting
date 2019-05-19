const snarkjs = require("snarkjs");
const bigInt = require("snarkjs").bigInt;
const fs = require("fs");
const crypto = require("crypto");
const pedersen = require("../circomlib/src/pedersenHash.js");
const babyjub = require("../circomlib/src/babyjub.js");
const BigInt = require("big-integer");
const groth = snarkjs["groth"];

const alt_bn_128_q = bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");

const fload = (fname) => unstringifyBigInts(JSON.parse(fs.readFileSync(fname, "utf8")));
const fdump = (fname, data) => fs.writeFileSync(fname, JSON.stringify(stringifyBigInts(data)), "utf8");
const rbigint = (nbytes) => snarkjs.bigInt.leBuff2int(crypto.randomBytes(nbytes));

function stringifyBigInts(o) {
    if ((typeof(o) == "bigint") || (o instanceof bigInt))  {
        return o.toString(10);
    } else if (Array.isArray(o)) {
        return o.map(stringifyBigInts);
    } else if (typeof o == "object") {
        const res = {};
        for (let k in o) {
            res[k] = stringifyBigInts(o[k]);
        }
        return res;
    } else {
        return o;
    }
}

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return bigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        const res = {};
        for (let k in o) {
            res[k] = unstringifyBigInts(o[k]);
        }
        return res;
    } else {
        return o;
    }
}

function p256(o) {
    if ((typeof(o) == "bigint") || (o instanceof bigInt))  {
        let nstr = o.toString(16);
        while (nstr.length < 64) nstr = "0"+nstr;
        nstr = "0x"+nstr;
        return nstr;
    } else if (Array.isArray(o)) {
        return o.map(p256);
    } else if (typeof o == "object") {
        const res = {};
        for (let k in o) {
            res[k] = p256(o[k]);
        }
        return res;
    } else {
        return o;
    }
}

function serializeAndHashUTXO(tx) {
    const b = Buffer.concat([snarkjs.bigInt(tx.balance).leInt2Buff(30), snarkjs.bigInt(tx.salt).leInt2Buff(14), snarkjs.bigInt(tx.owner).leInt2Buff(20)]);
    const h = pedersen.hash(b);
    const hP = babyjub.unpackPoint(h);
    return hP[0];
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function addrToInt(addr) {
  return BigInt(addr.substr(2), "16").value;
}



async function makeProof(name, input) {
const snarks = {
    "Deposit": {
    circuit: new snarkjs.Circuit(unstringifyBigInts(require("../circuit/compiled/Deposit.json"))),
    vk_proof: unstringifyBigInts(require("../circuit/compiled/Deposit_proving_key.json")),
    vk_verifier: unstringifyBigInts(require("../circuit/compiled/Deposit_verification_key.json"))
    },
    "Withdrawal": {
    circuit: new snarkjs.Circuit(unstringifyBigInts(require("../circuit/compiled/Withdrawal.json"))),
    vk_proof: unstringifyBigInts(require("../circuit/compiled/Withdrawal_proving_key.json")),
    vk_verifier: unstringifyBigInts(require("../circuit/compiled/Withdrawal_verification_key.json"))
    }
};
let snark = snarks[name];
//console.log(pk2bin(snark.vk_proof));
const witness = snark.circuit.calculateWitness(input);
const {proof, publicSignals} = groth.genProof(snark.vk_proof, witness);

return [[String(proof.pi_a[0]), String(proof.pi_a[1])],
    [[String(proof.pi_b[0][1]), String(proof.pi_b[0][0])],[String(proof.pi_b[1][1]), String(proof.pi_b[1][0])]],
    [String(proof.pi_c[0]), String(proof.pi_c[1])], publicSignals.map(String)];

}











module.exports = {stringifyBigInts, unstringifyBigInts, p256, fload, fdump, rbigint, serializeAndHashUTXO, shuffle, addrToInt, makeProof};