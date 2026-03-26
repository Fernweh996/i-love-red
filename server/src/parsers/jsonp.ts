/**
 * Parse JSONP response to JSON object
 * Example: jsonpgz({"name":"foo"}) => {"name":"foo"}
 */
export function parseJsonp(text: string): any {
  // Match content inside the first ( and last )
  const match = text.match(/[^(]*\((.+)\)[^)]*$/s);
  if (!match) {
    throw new Error('Invalid JSONP response');
  }
  return JSON.parse(match[1]);
}

/**
 * Parse the fund code search JS file
 * Format: var r = [["000001","HXCZHH","华夏成长混合","混合型-灵活","HUAXIACHENGZHANGHUNHE"],...]
 */
export function parseFundList(text: string): Array<{
  code: string;
  pinyin: string;
  name: string;
  type: string;
  pinyinFull: string;
}> {
  const match = text.match(/\[(\[.*\])\]/s);
  if (!match) {
    throw new Error('Failed to parse fund list');
  }

  const arr = JSON.parse(`[${match[1]}]`);
  return arr.map((item: string[]) => ({
    code: item[0],
    pinyin: item[1],
    name: item[2],
    type: item[3],
    pinyinFull: item[4],
  }));
}
