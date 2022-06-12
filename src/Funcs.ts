function uint8ArrayToBase64Img(imgData: Uint8Array, filePath: string) {
  const imgExt = filePath.split('.').pop();
  const imgBase64Str = btoa(imgData.reduce((data, byte) => {
    return data + String.fromCharCode(byte);
  }, ''));
  return `data:image/${imgExt};base64, ${imgBase64Str}`;
}

function arrayBufferToBuffer(ab: ArrayBuffer) {
  const buf = Buffer.alloc(ab.byteLength);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  return buf;
}

function bufferToArrayBuffer(buf: Buffer) {
  const ab = new ArrayBuffer(buf.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buf.length; ++i) {
    view[i] = buf[i];
  }
  return ab;
}

const Funcs = {
  uint8ArrayToBase64Img,
  arrayBufferToBuffer,
  bufferToArrayBuffer,
};

export default Funcs;
