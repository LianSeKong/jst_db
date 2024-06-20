

const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require('cron');
const { foramtRequestError, foramtRequestDBInsert } = require('../utils/tools')

// 全局配置
const globalConfig = {
    URL: 'open/purchasein/query'
}

function getPurchaseinList(modified_begin, modified_end) {
    return new Promise((res, rej) => {
        let biz = {
            page_index: 1,
            page_size: 50,
            modified_begin,
            modified_end,
            po_ids: [],
            so_ids: [],
            statuss: [],
        }
        const cronTime = `0/5 * * * * *`
        let hasNext = true;
        let list = [];
        let itemList = [];
    
        new CronJob(cronTime,
            async function () {
                if (hasNext) {
                    const response = await CallJSTAPI(globalConfig.URL, biz)
                    if (response.code === 0) {
                        const { has_next = false, datas } = response.data;
                        if (datas instanceof Array && datas.length > 0) {
                            const data = formatData(datas);
                            itemList.push(...(data.itemList))
                            list.push(...(data.list))
                        }
                        biz.page_index += 1;
                        hasNext = has_next;
                    } else {
                        hasNext = false;
                        throw new Error(foramtRequestError(biz, '采购入库请求错误', response))
                    }
                } else {
                    this.stop()
                }
            }, 
            async function () {
                const result = await updateOrInsertDB(list, itemList)
                foramtRequestDBInsert(biz, '采购入库', {
                    '采购入库主表': result.list,
                    '采购入库子表': result.itemList,
                })
                res('ok')
            }, 
            true,
            'system'
        );
    })
}

/**
 * 将英文的状态字段转换为中文
 * 
 * @param { String } status 
 * @returns { String }
 */
function formatStatus(status) {
    switch (status) {
        case "Archive ":
          status = "归档";
          break;
        case "WaitConfirm":
          status = "待入库";
          break;
        case "Confirmed":
          status = "已入库";
          break;
        case "OuterConfirming ":
          status = "外部确认中";
          break;
        case "Cancelled":
          status = "取消";
          break;
      }
    return status;
}


/**
 * 将英文的状态字段转换为中文
 * 
 * @param {String} f_status 
 * @returns {String }
 */
function formatFStatus(f_status) {
    switch (f_status) {
        case "WaitConfirm":
          f_status = "待审核";
          break;
        case "Confirmed":
          f_status = "已审核";
          break;
    }
    return f_status;
}


/**
 * 格式化返回的数据，便于进行数据库操作
 * @param { Array } datas 
 * @returns { Object } 
 */
async function formatData(datas) {
    const itemList = datas.flatMap(item => item.items)
    .filter(item => item instanceof Object)

    const list = datas.map(item => {
        delete item.items
        delete item.ts
        item.status = formatStatus(item.status);
        item.f_status = formatFStatus(item.f_status);
        return item
    })
    return {itemList, list}
}

// 数据库更新
async function updateOrInsertDB(list, itemList) {
    try {
        for (const purchasein of list) {
            await prisma.purchasein.upsert({
                where: {
                    io_id: purchasein.io_id,
                },
                update: purchasein,
                create: purchasein,
            })
        }
        for (const purchaseinItem of itemList) {
            await prisma.purchasein_item.upsert({
                where: {
                    ioi_id: purchaseinItem.ioi_id,
                },
                update: purchaseinItem,
                create: purchaseinItem,
            })
        }
        return {
            list: list.length,
            itemList: itemList.length
        }
    } catch (e) {
        throw e;
    }
}


module.exports = { getPurchaseinList }