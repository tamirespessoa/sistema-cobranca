function formatField(id, value) {
  const size = String(value.length).padStart(2, "0");
  return `${id}${size}${value}`;
}

function crc16(payload) {
  let polinomio = 0x1021;
  let resultado = 0xffff;

  for (let offset = 0; offset < payload.length; offset++) {
    resultado ^= payload.charCodeAt(offset) << 8;

    for (let bitwise = 0; bitwise < 8; bitwise++) {
      if ((resultado <<= 1) & 0x10000) {
        resultado ^= polinomio;
      }

      resultado &= 0xffff;
    }
  }

  return resultado.toString(16).toUpperCase().padStart(4, "0");
}

function generatePixPayload({ pixKey, merchantName, merchantCity, amount, txid }) {
  const gui = formatField("00", "BR.GOV.BCB.PIX");
  const key = formatField("01", pixKey);

  const merchantAccountInfo = formatField("26", gui + key);

  const payloadSemCRC =
    formatField("00", "01") +
    merchantAccountInfo +
    formatField("52", "0000") +
    formatField("53", "986") +
    formatField("54", Number(amount).toFixed(2)) +
    formatField("58", "BR") +
    formatField("59", merchantName.substring(0, 25).toUpperCase()) +
    formatField("60", merchantCity.substring(0, 15).toUpperCase()) +
    formatField("62", formatField("05", txid.substring(0, 25))) +
    "6304";

  return payloadSemCRC + crc16(payloadSemCRC);
}

module.exports = {
  generatePixPayload
};