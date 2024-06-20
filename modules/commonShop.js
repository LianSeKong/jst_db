const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const { foramtRequestError, foramtRequestDBInsert } = require('../utils/tools')

function getCommonShopList(modified_begin, modified_end) {
  return new Promise((res, rej) => {
    const biz = {
      page_index: 1,
      page_size: 50,
      modified_begin,
      modified_end,
    };
    let list = [];
    let has_next = true;
  
  
    new CronJob(
      `0/5 * * * * *`,
      async function () {
        if (has_next) {
          try {
            const response = await CallJSTAPI("open/sku/query", biz);
            if (response.code === 0) {
              const data = response.data
              if (data.datas instanceof Array) {
                list.push(...data.datas);
              }
              has_next = data.has_next;
              biz.page_index = biz.page_index + 1;
            } else {
              has_next = false
              rej(foramtRequestError(biz, '普通商品资料请求错误', response))
            }
          } catch (error) {
            has_next = false
            rej(foramtRequestError(biz,'普通商品资料请求网络错误', error))
          } 
        } else {
          this.stop();
        }
      },
      async function () {
        try {
          const result = await prisma.common_shops.createMany({ data: list })
          foramtRequestDBInsert(biz, '普通商品资料', result.count)
          res('ok')
        } catch (error) {
          rej("普通商品资料数据库操作出错： ", JSON.stringify(biz), error.message)
        }
      },
      true,
      "system"
      );
  })
};
module.exports = { getCommonShopList };
