/**
 * Parse JSONP response to JSON object
 * Example: jsonpgz({"name":"foo"}) => {"name":"foo"}
 */
export declare function parseJsonp(text: string): any;
/**
 * Parse the fund code search JS file
 * Format: var r = [["000001","HXCZHH","华夏成长混合","混合型-灵活","HUAXIACHENGZHANGHUNHE"],...]
 */
export declare function parseFundList(text: string): Array<{
    code: string;
    pinyin: string;
    name: string;
    type: string;
    pinyinFull: string;
}>;
//# sourceMappingURL=jsonp.d.ts.map