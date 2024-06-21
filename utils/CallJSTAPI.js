const axios = require('axios')
const { getJSTConfig, refreshJSTConfig } = require('./tools')
const { CommonSign } = require('./sign')


async function CallJSTAPI(apiPath, biz) {
    const config = getJSTConfig();
    const { app_key, app_secret } = config;
    const  timestamp =  Math.floor(new Date().getTime() / 1000)

    /**
     *  聚水潭接口调用API参数
     */
    let apiParams;
    if (biz === undefined) {
        apiParams = tokenApiParams()
    } else {
        apiParams = commonApiParams()
    }
    const apiUrl = `${config.jstURL}/${apiPath}`;
    // 签名
    CommonSign(apiParams, app_secret);
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
        return Promise.reject(error.message)
    }

    function tokenApiParams() {
        const grant_type = 'refresh_token';
        const charset = "UTF-8";
        const scope = 'all';
        const { refresh_token } = config;
        return { app_key, timestamp, refresh_token, grant_type, charset, scope }
    }

    function commonApiParams() {
        const charset = "UTF-8";
        const version = "2";
        const { access_token } = config;
        return { access_token, app_key, timestamp, charset, version, biz };
    }
}


async function CallRefreshToken() {
    try {
        const data = await CallJSTAPI("openWeb/auth/refreshToken")
        if (data.code === 0) {
            refreshJSTConfig(data.data)
            return data.data
        } else {
           return Promise.reject(data)
        }
    } catch (error) {
        return Promise.reject(error)
    }
}

module.exports = {
    CallJSTAPI,
    CallRefreshToken
}
