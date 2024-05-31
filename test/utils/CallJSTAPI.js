const axios = require('axios')
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
/***
 * 聚水潭 通用 api 签名函数
 */
function CommonSign(apiParams, app_secret) {
    /** 通用 md5 签名函数 */
    const shasum = crypto.createHash("md5");
    if (apiParams == null || !(apiParams instanceof Object)) {
        return "";
    }
    /** 获取 apiParms中的key 去除 sign key,并排序 */
    let sortedKeys = Object.keys(apiParams)
        .filter((item) => item !== "sign")
        .sort();
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
    let sign = (apiParams.sign = shasum.digest("hex"));
    return sign;
}

async function CallJSTAPI(apiPath, bizParam) {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'jstconfig.json'), 'utf8'))
    /** api参数拼接 */
    const apiParams = {
        access_token: config.access_token, 
        app_key: config.app_key,
        timestamp: Math.floor(new Date().getTime() / 1000), //当前时间戳
        charset: "UTF-8",
        version: "2",
        biz: bizParam,
    };
    const apiUrl = `${config.jstURL}/${apiPath}`;
    CommonSign(apiParams, config.app_secret);
    try {
        const params = new URLSearchParams();
        for (let key in apiParams) {
            let keyValue = apiParams[key];
            if (keyValue instanceof Object) keyValue = JSON.stringify(keyValue);
            params.append(key, keyValue);
        }
        const response = await axios.post(apiUrl, params, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            },
        });
        return response.data;
    } catch (error) {
        console.info(error.message, error.stack);
    }
}

module.exports = {
    CallJSTAPI
}
