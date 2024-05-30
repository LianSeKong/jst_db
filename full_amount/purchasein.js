

const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require('cron');
const moment = require('moment')
const formatStr = "YYYY-MM-DD HH:mm:ss";
parallel()
function parallel() {
    let biz = {
        page_index: 1,
        page_size: 50,
        modified_begin: '2022-09-30',
        modified_end: '2022-10-07',
        po_ids: [],
        so_ids: [],
        statuss: [],
    }
    const cronTime = `0/5 * * * * *`
    let hasNext = true;
    let isComplete = true
    let list = [];
    let itemList = []
    let isInOperation = false;
    new CronJob(cronTime,
        async function () {
            if (hasNext) {
                if (!isInOperation) {
                    if (itemList.length > 1000) {
                        isInOperation = true
                        await updateOrInsertDB(list, itemList)
                        list = []
                        itemList = []
                        isInOperation = false
                    }
                    CallJSTAPI("open/purchasein/query", biz).then(res => {
                        if (res.code === 0 ) {
                            const { has_next = false, datas=[] } = res.data;
                            if (datas === null) {
                                console.log('null', res, biz);
                            }
                            const items = datas.flatMap(item => item.items)
                                .filter(item => item !== null && item !== undefined)
                            itemList.push(...items)
                            const updateItemList = datas.map(item => {
                                delete item.items
                                delete item.ts
                                return item
                            })
                            list.push(...updateItemList)
                            biz.page_index += 1;
                            hasNext = has_next;
                        } else {
                            console.log(res);
                            isComplete = false
                            this.stop()
                        }
                    })
                }
            } else {
                console.log('next');
                // 增加时间周期
                biz = goToNext(biz)
                if (biz.modified_begin > new moment().format(formatStr)) {
                    this.stop();
                }
                hasNext = true
            }
        }, // onTick
        async function () {
            if (list.length > 0 && isComplete) {
                await updateOrInsertDB(list, itemList)
                list = []
                itemList = []
                isInOperation = false
                console.log('full finish');
            }
        }, // onComplete
        true, // start
        'system'
    );
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
    } catch(e) {

        console.log(e);
        return 'ok'
    }
} 



// 递增周期
function increaseTime(modified_begin, modified_end) {
    modified_begin = new moment(modified_begin).add(7, "days").format(formatStr)
    modified_end = new moment(modified_end).add(7, "days").format(formatStr)
    return { modified_begin, modified_end }
}

// 增量更新后7天
function goToNext(biz) {
    const currentTime = increaseTime(biz.modified_begin, biz.modified_end)
    return {
        page_index: 1,
        modified_begin: currentTime.modified_begin,
        modified_end: currentTime.modified_end,
        page_size: biz.page_size,
        po_ids: [],
        so_ids: [],
        statuss: [],
    }
}