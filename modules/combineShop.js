const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const fs = require('fs')
const path = require('path')
const { foramtRequestError, foramtRequestDBInsert } = require('../utils/tools')
const combine_itemsku_flds = JSON.parse(fs.readFileSync(path.join(__dirname, './combine_itemsku_flds.json'), 'utf8'))

// open/combine/sku/query
function getCombineShopList(modified_begin, modified_end) {
  return new Promise( (res, rej) => {
    const biz = {
      page_index: 1,
      page_size: 50,
      modified_begin,
      modified_end,
      combine_itemsku_flds
    };
  
    let list = [];
    let has_next = true;
  
    new CronJob(
        `0/7 * * * * *`,
        async function () {
          if (has_next) {
            try {
              const response = await CallJSTAPI("open/combine/sku/query", biz);
              if (response.code === 0) {
                const data = response.data 
                if (data.datas instanceof Array) {
                  list.push(...data.datas);
                }
                has_next = data.has_next;
                biz.page_index++;
              } else {
                has_next = false;
                foramtRequestError(biz, '组合装请求错误', response)
              }
            } catch (error) {
              foramtRequestError(biz, '组合装请求网络错误', error)
              has_next = false;
            }
          } else {
            this.stop();
          }
        },
        async function () {
          const itemList = list.flatMap((item) => item.items)
          .filter(item => item instanceof Object);
  

          const data = list.map((item) => {
              delete item.items
              return item
          })
  
          const itemResult = await prisma.combine_shops_item.createMany({
            data: itemList,
          });
  
          const dataResult = await prisma.combine_shops.createMany({
            data,
          });
          
          foramtRequestDBInsert(biz, '组合装商品资料', {
            '组合装子表': itemResult.count,
            '组合装总表': dataResult.count
           })
           res('ok')
        },
        true,
        "system" // timeZone
      );
  })
}
module.exports = { getCombineShopList };
