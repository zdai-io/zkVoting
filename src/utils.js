const snarkjs = require("snarkjs");
const bigInt = require("snarkjs").bigInt;
const fs = require("fs");
const crypto = require("crypto");
const pedersen = require("../circomlib/src/pedersenHash.js");
const babyjub = require("../circomlib/src/babyjub.js");
const BigInt = require("big-integer");

const alt_bn_128_q = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

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




function writeUint32(h, val) {
    h.dataView.setUint32(h.offset, val, true);
    h.offset += 4;
}

function writeUint32ToPointer(h, p, val) {
    h.dataView.setUint32(p, val, true);
}


function alloc(h, n) {
    const o = h.offset;
    h.offset += n;
    return o;
}

function writeBigInt(h, bi) {
    for (let i=0; i<8; i++) {
        const v = bi.shr(i*32).and(bigInt(0xFFFFFFFF)).value;
        writeUint32(h, v);
    }
}

function toMontgomeryQ(p) {
    const q = bigInt("21888242871839275222246405745257275088696311157297823662689037894645226208583");
    return p.mul(bigInt.one.shl(256)).mod(q);
}

function toMontgomeryR(p) {
    const r = bigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
    return p.mul(bigInt.one.shl(256)).mod(r);
}

function writePoint(h, p) {
    writeBigInt(h, toMontgomeryQ(p[0]));
    writeBigInt(h, toMontgomeryQ(p[1]));
}

function writePoint2(h, p) {
    writeBigInt(h, toMontgomeryQ(p[0][0]));
    writeBigInt(h, toMontgomeryQ(p[0][1]));
    writeBigInt(h, toMontgomeryQ(p[1][0]));
    writeBigInt(h, toMontgomeryQ(p[1][1]));
}

function writeTransformedPolynomial(h, p) {

    const keys = Object.keys(p);

    writeUint32(h, keys.length);

    for (let i=0; i<keys.length; i++) {
        writeUint32(h, keys[i]);
        writeBigInt(h, toMontgomeryR(p[keys[i]]));
    }
}

function calculateBuffLenPK(provingKey) {
    function polSize(pol) {
        const l= Object.keys(pol).length;
        return 36*l + 4;
    }

    let size = 40;

    // alfa1, beta1, delta1
    size += 3 * (32*2);

    // beta2, delta2
    size += 2 * (32*4);

    for (let i=0; i<provingKey.nVars; i++) {
        size += polSize(provingKey.polsA[i]);
        size += polSize(provingKey.polsB[i]);
    }

    size += provingKey.nVars* (32*2);
    size += provingKey.nVars* (32*2);
    size += provingKey.nVars* (32*4);
    size += (provingKey.nVars - provingKey.nPublic  - 1)* (32*2);
    size += provingKey.domainSize * (32*2);

    return size;
}





function pk2bin(provingKey){
    const buffLen = calculateBuffLenPK(provingKey);
    const buff = new ArrayBuffer(buffLen);
    const h = {
        dataView: new DataView(buff),
        offset: 0
    };
    writeUint32(h, provingKey.nVars);
    writeUint32(h, provingKey.nPublic);
    writeUint32(h, provingKey.domainSize);
    const pPolsA = alloc(h, 4);
    const pPolsB = alloc(h, 4);
    const pPointsA = alloc(h, 4);
    const pPointsB1 = alloc(h, 4);
    const pPointsB2 = alloc(h, 4);
    const pPointsC = alloc(h, 4);
    const pPointsHExps = alloc(h, 4);

    writePoint(h, provingKey.vk_alfa_1);
    writePoint(h, provingKey.vk_beta_1);
    writePoint(h, provingKey.vk_delta_1);
    writePoint2(h, provingKey.vk_beta_2);
    writePoint2(h, provingKey.vk_delta_2);

    writeUint32ToPointer(h, pPolsA, h.offset);
    for (let i=0; i<provingKey.nVars; i++) {
        writeTransformedPolynomial(h, provingKey.polsA[i]);
    }

    writeUint32ToPointer(h, pPolsB, h.offset);
    for (let i=0; i<provingKey.nVars; i++) {
        writeTransformedPolynomial(h, provingKey.polsB[i]);
    }

    writeUint32ToPointer(h, pPointsA, h.offset);
    for (let i=0; i<provingKey.nVars; i++) {
        writePoint(h, provingKey.A[i]);
    }

    writeUint32ToPointer(h, pPointsB1, h.offset);
    for (let i=0; i<provingKey.nVars; i++) {
        writePoint(h, provingKey.B1[i]);
    }

    writeUint32ToPointer(h, pPointsB2, h.offset);
    for (let i=0; i<provingKey.nVars; i++) {
        writePoint2(h, provingKey.B2[i]);
    }

    writeUint32ToPointer(h, pPointsC, h.offset);
    for (let i=provingKey.nPublic+1; i<provingKey.nVars; i++) {
        writePoint(h, provingKey.C[i]);
    }

    writeUint32ToPointer(h, pPointsHExps, h.offset);
    for (let i=0; i<provingKey.domainSize; i++) {
        writePoint(h, provingKey.hExps[i]);
    }


    return buff;
}






function calculateBuffLenW(witness) {

    let size = 0;

    // beta2, delta2
    size += witness.length * 32;

    return size;
}

function w2bin(witness){
    const buffLen = calculateBuffLenW(witness);

    const buff = new ArrayBuffer(buffLen);

    const h = {
        dataView: new DataView(buff),
        offset: 0
    };


    // writeUint32(h, witness.length);

    for (let i=0; i<witness.length; i++) {
        writeBigInt(h, witness[i]);
    }

    assert.equal(h.offset, buffLen);

    return buff;
}



module.exports = {stringifyBigInts, unstringifyBigInts, p256, fload, fdump, rbigint, serializeAndHashUTXO, shuffle, addrToInt, pk2bin, w2bin};