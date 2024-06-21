const crypto = require('crypto')


function CommonSign(apiParams, app_secret) {
    /** 通用 md5 签名函数 */
    const shasum = crypto.createHash('md5');
    if (apiParams == null || !(apiParams instanceof Object)) {
        return "";
    }

    /** 获取 apiParms中的key 去除 sign key,并排序 */
    let sortedKeys = Object.keys(apiParams).filter((item) => item !== "sign").sort();
    /** 排序后字符串 */
    let sortedParamStr = "";
    // 拼接字符串参数
    sortedKeys.forEach(function (key, index, ary) {
        let keyValue = apiParams[key];
        if (keyValue instanceof Object) keyValue = JSON.stringify(keyValue);
        if (key != "sign" && keyValue != null && keyValue != "") {
            sortedParamStr += `${key}${keyValue}`;
        }
    });
    /** 拼接加密字符串 */
    let paraStr = app_secret + sortedParamStr;
    shasum.update(paraStr);
    let sign = apiParams.sign = shasum.digest('hex');
    return sign;
}


exports.CommonSign = CommonSign;