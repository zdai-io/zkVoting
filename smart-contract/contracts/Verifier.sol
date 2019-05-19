//
// Copyright 2017 Christian Reitwiessner
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
pragma solidity >=0.5.2;
library Pairing {
    struct G1Point {
        uint X;
        uint Y;
    }
    // Encoding of field elements is: X[0] * z + X[1]
    struct G2Point {
        uint[2] X;
        uint[2] Y;
    }
    /// @return the generator of G1
    function P1() pure internal returns (G1Point memory) {
        return G1Point(1, 2);
    }
    /// @return the generator of G2
    function P2() pure internal returns (G2Point memory) {
        // Original code point
        return G2Point(
            [11559732032986387107991004021392285783925812861821192530917403151452391805634,
             10857046999023057135944570762232829481370756359578518086990519993285655852781],
            [4082367875863433681332203403145435568316851327593401208105741076214120093531,
             8495653923123431417604973247489272438418190587263600148770280649306958101930]
        );

/*
        // Changed by Jordi point
        return G2Point(
            [10857046999023057135944570762232829481370756359578518086990519993285655852781,
             11559732032986387107991004021392285783925812861821192530917403151452391805634],
            [8495653923123431417604973247489272438418190587263600148770280649306958101930,
             4082367875863433681332203403145435568316851327593401208105741076214120093531]
        );
*/
    }
    /// @return the negation of p, i.e. p.addition(p.negate()) should be zero.
    function negate(G1Point memory p) pure internal returns (G1Point memory) {
        // The prime q in the base field F_q for G1
        uint q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;
        if (p.X == 0 && p.Y == 0)
            return G1Point(0, 0);
        return G1Point(p.X, q - (p.Y % q));
    }
    /// @return the sum of two points of G1
    function addition(G1Point memory p1, G1Point memory p2) view internal returns (G1Point memory r) {
        uint[4] memory input;
        input[0] = p1.X;
        input[1] = p1.Y;
        input[2] = p2.X;
        input[3] = p2.Y;
        bool success;
        assembly {
            success := staticcall(sub(gas, 2000), 6, input, 0xc0, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success);
    }
    /// @return the product of a point on G1 and a scalar, i.e.
    /// p == p.scalar_mul(1) and p.addition(p) == p.scalar_mul(2) for all points p.
    function scalar_mul(G1Point memory p, uint s) view internal returns (G1Point memory r) {
        uint[3] memory input;
        input[0] = p.X;
        input[1] = p.Y;
        input[2] = s;
        bool success;
        assembly {
            success := staticcall(sub(gas, 2000), 7, input, 0x80, r, 0x60)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require (success);
    }
    /// @return the result of computing the pairing check
    /// e(p1[0], p2[0]) *  .... * e(p1[n], p2[n]) == 1
    /// For example pairing([P1(), P1().negate()], [P2(), P2()]) should
    /// return true.
    function pairing(G1Point[] memory p1, G2Point[] memory p2) view internal returns (bool) {
        require(p1.length == p2.length);
        uint elements = p1.length;
        uint inputSize = elements * 6;
        uint[] memory input = new uint[](inputSize);
        for (uint i = 0; i < elements; i++)
        {
            input[i * 6 + 0] = p1[i].X;
            input[i * 6 + 1] = p1[i].Y;
            input[i * 6 + 2] = p2[i].X[0];
            input[i * 6 + 3] = p2[i].X[1];
            input[i * 6 + 4] = p2[i].Y[0];
            input[i * 6 + 5] = p2[i].Y[1];
        }
        uint[1] memory out;
        bool success;
        assembly {
            success := staticcall(sub(gas, 2000), 8, add(input, 0x20), mul(inputSize, 0x20), out, 0x20)
            // Use "invalid" to make gas estimation work
            switch success case 0 { invalid() }
        }
        require(success);
        return out[0] != 0;
    }
    /// Convenience method for a pairing check for two pairs.
    function pairingProd2(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2) view internal returns (bool) {
        G1Point[] memory p1 = new G1Point[](2);
        G2Point[] memory p2 = new G2Point[](2);
        p1[0] = a1;
        p1[1] = b1;
        p2[0] = a2;
        p2[1] = b2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for three pairs.
    function pairingProd3(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2
    ) view internal returns (bool) {
        G1Point[] memory p1 = new G1Point[](3);
        G2Point[] memory p2 = new G2Point[](3);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        return pairing(p1, p2);
    }
    /// Convenience method for a pairing check for four pairs.
    function pairingProd4(
            G1Point memory a1, G2Point memory a2,
            G1Point memory b1, G2Point memory b2,
            G1Point memory c1, G2Point memory c2,
            G1Point memory d1, G2Point memory d2
    ) view internal returns (bool) {
        G1Point[] memory p1 = new G1Point[](4);
        G2Point[] memory p2 = new G2Point[](4);
        p1[0] = a1;
        p1[1] = b1;
        p1[2] = c1;
        p1[3] = d1;
        p2[0] = a2;
        p2[1] = b2;
        p2[2] = c2;
        p2[3] = d2;
        return pairing(p1, p2);
    }
}
contract Verifier {
    using Pairing for *;
    struct VerifyingKey {
        Pairing.G1Point alfa1;
        Pairing.G2Point beta2;
        Pairing.G2Point gamma2;
        Pairing.G2Point delta2;
        Pairing.G1Point[] IC;
    }
    struct Proof {
        Pairing.G1Point A;
        Pairing.G2Point B;
        Pairing.G1Point C;
    }
    function verifyingDepositKey() pure internal returns (VerifyingKey memory vk) {

        vk.alfa1 = Pairing.G1Point(4953671275076335612757599352543778041222006257234418846089639145100776775609,16486374250490526508591066569674628846215197227098138666084522533997766467629);
        vk.beta2 = Pairing.G2Point([20281381802061296952151518398914593785884385282951453989395540791997260889653,14923896056687071555856255294276892989395902952287705917426048340446378730122], [1785181608762585476181016803537738054585806077512952923212800668578938312235,1613078021862411328814283105803973893087545364803592627701182498734389005926]);
        vk.gamma2 = Pairing.G2Point([20695367061314101575169160980020212756217450912529994916282174312230938084260,21399937997424323634103368003038223574207008635694515167005512689334465351774], [340154029820496547853191648564235686870789807985406194583218716064767162867,13820148000358746552610954635372785337724079787233400427877890007809909009003]);
        vk.delta2 = Pairing.G2Point([7780031941503227195404632443030085483413460994997134215662479401949774649800,14028758420744327676418550132897391308368157990490312462507885573857751879950], [13793248997009632820719335065141751403074473401753420165037930037731069112381,6109671518430287010767630417150517380953234469342923080095922299940721829266]);
        vk.IC = new Pairing.G1Point[](3);
        vk.IC[0] = Pairing.G1Point(18389466485550068759394611664283516009009086134335380260527791312468748462754,12406117713501213943068720256558278483025574227201908178742481496512307323898);
        vk.IC[1] = Pairing.G1Point(844557780625650398059698065477005179993914605705178066899576289292855805858,8054060209185923856394418832843331949085081443299425438552393714122972245591);
        vk.IC[2] = Pairing.G1Point(4583764001186666665436852579133125576420891570364828268860366707876929326710,16386710463637761609791360408477788348513905401749013957734702401144990874530);

    
    }


    function verifyingWithdrawalKey() pure internal returns (VerifyingKey memory vk) {

        vk.alfa1 = Pairing.G1Point(1614135029368841651949206544326822888751874853412275322342419910776994354754,12802007952223459626430223702406123080098190180801221893590878947211743522563);
        vk.beta2 = Pairing.G2Point([2498657776022326345407230362374830752620375845036179955568685260511130935035,10474939099124666028815466238949964006691263474650118803175431611446627062253], [7220732860164282198639269634887359726842114560609243824607821372685443397550,10628694802112248975614315787045521500341795211505431915208056129795242995399]);
        vk.gamma2 = Pairing.G2Point([20025962489524224772384889065807122528852689418428161822362724320743345071542,18157816798982262339963315091595106220428205793996343389466195728232205508481], [2211958492568495800452605773381113972300299887809807644568477284687939326407,21116825095151796716411853635325442675758979686914942979318941054786655152423]);
        vk.delta2 = Pairing.G2Point([8965354572181302274782258204039486715176016772463839812698646313494301044425,6359354942905853454671489049611264929205907558178506803692765073022708994512], [13219518115801166106213065748835284111607331882058146696598550202730035103669,6954343236408287180407778975690617933276873184026718543819172492645294278929]);
        vk.IC = new Pairing.G1Point[](14);
        vk.IC[0] = Pairing.G1Point(11162223347711787995994986786626616828755274365554036405625935445173076709190,8131637081533839706933695512371118539532238508146006342557075991634199557120);
        vk.IC[1] = Pairing.G1Point(2132702443933834236771238556885242289736149286250146201819878215763157556589,7463615864427568219840512306725980228192223654580263142143569905899143493535);
        vk.IC[2] = Pairing.G1Point(10413002052981984354967478843165964968639776204148798636734152798008113281929,8875163574939236648379154642516240612438800206980517478804853517629772886118);
        vk.IC[3] = Pairing.G1Point(19311852669070860902695486305346673567482006680626047744996060569733769869507,19262749255043033046472841699838249100018268220679613811244159829086452463717);
        vk.IC[4] = Pairing.G1Point(3649494043286753982826877172406856903326718122608438312700120642593442899066,18886761080317477904209139472548125142715678012716804638485246444416106214436);
        vk.IC[5] = Pairing.G1Point(8441410837908805964410615653760047142345597999499445567241998162593339034765,16003019313097078413928887257068526710336729686026557865145035514542549810930);
        vk.IC[6] = Pairing.G1Point(11549436365293800681453770443508721729555617663661769127673775042446311000345,981126970347242757860920300978692109017227369448576411692715171907162485795);
        vk.IC[7] = Pairing.G1Point(1809121132945536487835421678972414520657342144395632933330380084758668906900,12469730974642257554126974307455154384116756447926270347760922147326751246761);
        vk.IC[8] = Pairing.G1Point(12320209567422469998082810271792072413954638358272603613951614504481076244215,4393079564764677783332189802473036353002312063057401427384159139752931455847);
        vk.IC[9] = Pairing.G1Point(20121648527769539818729138918392984536953157575652438142748061959632305758191,17459799170843068468945434541104191909522110686141379330191324621641500515822);
        vk.IC[10] = Pairing.G1Point(2840344036166646788926826727335083335712026576014979025387056882692082725207,7847768018864513025221163752962726734355588396787154186950980457326610226995);
        vk.IC[11] = Pairing.G1Point(4985466766787303654401132423501895996867597073382979282035201970720614990430,11206417590012217164328646847450840874262504548176642966657768891103482785594);
        vk.IC[12] = Pairing.G1Point(16520361054846763114242349040821547057849947590146790155828274174721585232889,16480008439578752908956687361901119400284810780013433350679488217110867465959);
        vk.IC[13] = Pairing.G1Point(3925146083353276275030718417921482090523121873908379107958716873606100218658,814758532929971952814841513352822767906923319428649368346243857843764338958);

    
    }

    function verify(uint[] memory input, Proof memory proof, VerifyingKey memory vk) view internal returns (uint) {
        require(input.length + 1 == vk.IC.length);
        // Compute the linear combination vk_x
        Pairing.G1Point memory vk_x = Pairing.G1Point(0, 0);
        for (uint i = 0; i < input.length; i++)
            vk_x = Pairing.addition(vk_x, Pairing.scalar_mul(vk.IC[i + 1], input[i]));
        vk_x = Pairing.addition(vk_x, vk.IC[0]);
        if (!Pairing.pairingProd4(
            Pairing.negate(proof.A), proof.B,
            vk.alfa1, vk.beta2,
            vk_x, vk.gamma2,
            proof.C, vk.delta2
        )) return 1;
        return 0;
    }

    function verifyDeposit(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[2] memory input
        ) view public returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);
        uint[] memory inputValues = new uint[](input.length);
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof, verifyingDepositKey()) == 0) {
            return true;
        } else {
            return false;
        }
    }


    function verifyWithdrawal(
            uint[2] memory a,
            uint[2][2] memory b,
            uint[2] memory c,
            uint[13] memory input
        ) view public returns (bool r) {
        Proof memory proof;
        proof.A = Pairing.G1Point(a[0], a[1]);
        proof.B = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.C = Pairing.G1Point(c[0], c[1]);
        uint[] memory inputValues = new uint[](input.length);
        for(uint i = 0; i < input.length; i++){
            inputValues[i] = input[i];
        }
        if (verify(inputValues, proof, verifyingWithdrawalKey()) == 0) {
            return true;
        } else {
            return false;
        }
    }
}
