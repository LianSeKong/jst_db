const { prisma } = require("../utils/dbConnect");



async function helper() {
    const result = await prisma.edit_sku_label_design_available.findMany()
    console.log(result);
}

helper()