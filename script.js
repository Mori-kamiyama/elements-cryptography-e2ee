// グローバルスコープで sec オブジェクトを定義
let sec;

// ページ読み込み時に実行される関数
async function init() {
    // sec モジュールを動的にインポート
    sec = await import('https://code4fukui.github.io/sec.js/sec.js');
    
    // イベントリスナーを設定
    document.getElementById('encryption').addEventListener('click', encryClick);
    document.getElementById('decryption').addEventListener('click', decryClick);
    document.getElementById('commonKey').addEventListener('click', priAndRelakeyClick);
    document.getElementById('generateCommonKey').addEventListener('click', keyClick);

}

// ページ読み込み完了時に init 関数を実行
document.addEventListener('DOMContentLoaded', init);

function encryClick() {
    const data = new TextEncoder().encode(document.getElementById('encryptionInput').value);
    const key = base118ToUint8Array(document.getElementById('shareKeyIn').value);
    const cipher = sec.encrypt(key, data);
    
    document.getElementById("encryptionResult").innerText = "暗号化された文章: " + decimalArrayToBase118(cipher);
}

function decryClick() {
    var input = document.getElementById("decryptionInput").value;
    const key = base118ToUint8Array(document.getElementById('shareKeyOut').value);
    const cipher = base118ToUint8Array(document.getElementById('decryptionInput').value);
    const data = sec.decrypt(key, cipher);
    if (data) {
        document.getElementById('decryptionResult').innerText = "復号化された文章: " + new TextDecoder().decode(data);
    } else {
        document.getElementById('decryptionResult').value = "復号失敗";
    }
}

function priAndRelakeyClick() {
    const prikey = sec.prikey();
    const pubkey = sec.pubkey(prikey);

    var resultPri = decimalArrayToBase118(prikey);
    var resultPub = decimalArrayToBase118(pubkey);

    document.getElementById('privateKey').value = resultPri;
    document.getElementById('publicKey').value = resultPub;
}

function keyClick() {
    const privateKey = document.getElementById('privateKey').value.replace(/\s+/g, '');
    const otherPublicKey = document.getElementById('otherPublicKey').value.replace(/\s+/g, '');

    const privateKeyUint8 = base118ToUint8Array(privateKey);
    const otherPublicKeyUint8 = base118ToUint8Array(otherPublicKey);

    // 以下は変更なし
    const sharedKey = sec.sharekey(privateKeyUint8, otherPublicKeyUint8);
    const commonKeyBase118 = decimalArrayToBase118(sharedKey);
    document.getElementById('keyResult').innerText = "生成した共通鍵: \n" + commonKeyBase118;
    document.getElementById('shareKeyIn').value = commonKeyBase118;
    document.getElementById('shareKeyOut').value = commonKeyBase118;
}

function decimalArrayToBase118(uint8Array) {
    const digit = generateElementsArray();
    const base = 118n;
    const base118 = toBase118(uint8Array instanceof Uint8Array ? uint8Array : new Uint8Array(uint8Array), digit, base);
    
    // 元素記号を分割してスペースを挿入
    return base118.match(/([A-Z][a-z]?)/g).join(' ');
}

function toBase118(arr, digit, base) {
    let bigInt = BigInt(0);
    for (let i = 0; i < arr.length; i++) {
        bigInt = (bigInt << BigInt(8)) | BigInt(arr[i]);
    }

    let base118 = '';
    while (bigInt > 0) {
        const remainder = bigInt % base;
        base118 = digit[Number(remainder)] + base118;
        bigInt = bigInt / base;
    }

    return base118 || 'H'; // 空の場合は 'H' を返す
}

function base118ToUint8Array(base118) {
    const elements = generateElementsArray();
    let bigInt = BigInt(0);
    const base = BigInt(118);

    // スペースを除去
    base118 = base118.replace(/\s+/g, '');

    for (let i = 0; i < base118.length; i++) {
        const symbol = base118[i];
        if (i + 1 < base118.length && elements.includes(symbol + base118[i + 1])) {
            const value = elements.indexOf(symbol + base118[i + 1]);
            bigInt = bigInt * base + BigInt(value);
            i++;
        } else {
            const value = elements.indexOf(symbol);
            if (value === -1) {
                throw new Error(`Invalid symbol ${symbol} in base118 string.`);
            }
            bigInt = bigInt * base + BigInt(value);
        }
    }

    const uint8Array = [];
    while (bigInt > 0) {
        uint8Array.unshift(Number(bigInt & BigInt(255)));
        bigInt = bigInt >> BigInt(8);
    }

    return new Uint8Array(uint8Array);
}

function generateElementsArray() {
    const elementSymbols = [
        "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne",
        "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar", "K", "Ca",
        "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn",
        "Ga", "Ge", "As", "Se", "Br", "Kr", "Rb", "Sr", "Y", "Zr",
        "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn",
        "Sb", "Te", "I", "Xe", "Cs", "Ba", "La", "Ce", "Pr", "Nd",
        "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb",
        "Lu", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg",
        "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra", "Ac", "Th",
        "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm",
        "Md", "No", "Lr", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds",
        "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"
    ];

    return elementSymbols;
}