const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { prisma } = require("../utils/dbConnect");
// 根据sku查询数据库视图中的sku_id
//
async function getNeedDealSkuIDs (params) {
    // 查询数据库
    // 获取数据
    return await prisma.edit_sku_label_design_available.findMany().join(',')
    // 'HMA125175-3E,G010-T42_9340607,QC30007947-Z1-D6,QC30007947-Z1-D7,QC30007947-Z1-D8';
    // return 'HMA125175-3E';
    // return 'HMA125175-3E,G010-T42_9340607,QC30007947-Z1-D6,QC30007947-Z1-D7,QC30007947-Z1-D8';
}


// 根据SKUID去获取商品数据
async function getCommonShopDetailData( sku_ids ) {    
    const result = await CallJSTAPI('open/sku/query', { sku_ids })
    let detailArray = [];
    if (result.code === 0 && result.data?.datas.length) {
       detailArray = result.data.datas.map(item => 
          {
            return {
                sku_id: item.sku_id,
                i_id: item.i_id,
                name: item.name,
                labels: item.labels
            }
         }
       )
    }
    return detailArray;
}

// 有'无打布稿' 标签， 则删除‘无打布稿’标签
// 无 '有打布稿' 标签， 则添加 '有打布稿'标签 

function updateLabels(data) {
     return data.map(item => {
        const labelArray = item.labels.split(',')
        item.deletedlabels = []
        item.labels = []
        if (labelArray.includes('无打布稿')) {
            item.deletedlabels.push('无打布稿')
        }

        if (!labelArray.includes('有打布稿')) {
            item.labels.push('有打布稿')
        }
        return item
    })
}

async function markCommonShop() {
    const sku_ids = await getNeedDealSkuIDs()
    const data = await getCommonShopDetailData(sku_ids)
    const items = updateLabels(data)
    const res = await CallJSTAPI('open/jushuitan/itemsku/upload', { items })
    console.log(res.data.datas);
}

module.exports.markCommonShop = markCommonShop
