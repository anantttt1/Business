(function(){
  'use strict';
  function crc32(buf) {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i];
      for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
    }
    return ~c >>> 0;
  }
  function u16(n) { return new Uint8Array([n & 255, (n >>> 8) & 255]); }
  function u32(n) { return new Uint8Array([n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]); }
  function strBytes(s) { return new TextEncoder().encode(s); }
  function concat(arrs) {
    let len = 0; arrs.forEach(function(a) { len += a.length; });
    const out = new Uint8Array(len); let o = 0;
    arrs.forEach(function(a) { out.set(a, o); o += a.length; });
    return out;
  }
  window.PB_simpleZip = function(files) {
    const locals = []; const centrals = []; let offset = 0;
    files.forEach(function(f) {
      const name = strBytes(f.name);
      const data = typeof f.data === 'string' ? strBytes(f.data) : f.data;
      const crc = crc32(data);
      const local = concat([
        u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0),
        name, data
      ]);
      const central = concat([
        u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
        u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0),
        u16(0), u16(0), u32(0), u32(offset), name
      ]);
      locals.push(local); centrals.push(central); offset += local.length;
    });
    const centralDir = concat(centrals);
    const end = concat([
      u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
      u32(centralDir.length), u32(offset), u16(0)
    ]);
    return new Blob([concat(locals.concat([centralDir, end]))], { type: 'application/zip' });
  };
})();
