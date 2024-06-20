


/**
 * 
 * @param {*} apiName   接口名称
 * @param {*} biz       请求参数
 * @param {*} msg       错误信息
 * @returns {string}    
 */
function formatResponseError(apiName, biz, msg) {
    return `
接口名称:     ${apiName}
修改起始时间： ${biz.modified_begin},
修改结束时间： ${biz.modified_end},
错误信息：    ${msg}
    `
}  
module.exports = { formatResponseError }