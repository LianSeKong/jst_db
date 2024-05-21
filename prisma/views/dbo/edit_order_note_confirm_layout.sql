WITH [有打布稿商品编码清单] AS (
  SELECT
    [商品编码]
  FROM
    [MeianDB].[dbo].[聚水潭_普通商品资料]
  WHERE
    [商品标签] LIKE '%有打布稿%'
),
[有设计稿商品编码清单] AS (
  SELECT
    [商品编码],
    [版本号]
  FROM
    [MeianInfo].[dbo].[设计信息_设计稿清单]
  WHERE
    [是否最新版] = '是'
),
[当前聚水潭待发货清单] AS (
  SELECT
    *
  FROM
    [MeianDB].[dbo].[聚水潭_导出订单_当前待发货清单]
  WHERE
    [异常类型] IN (
      '无打布稿',
      '定制照片秀',
      '速卖通-美岸全托管'
    )
),
[当前开发部设计任务清单] AS (
  SELECT
    [task_status] AS [是否启用],
    [task_datetime] AS [任务时间],
    [task_classification] AS [任务分类],
    [color_number] AS [颜色数],
    [developer] AS [开发师],
    [status] AS [设计进度],
    [abnormal_cause] AS [异常原因],
    [note] AS [备注],
    [commodity_code] AS [商品编码],
    [Style_code] AS [款式编码],
    [sku_kind] AS [商品类型],
    [sku_category] AS [商品品类],
    [sku_map] AS [商品销售地],
    [shop_attribute] AS [商品额外属性],
    [latest_version_number] AS [最新版本号],
    [internal_order_number] AS [内部订单号],
    [order_note] AS [订单备注],
    [urgent_task] AS [紧急任务],
    [folder_naming] AS [文件夹命名],
    [draft_title] AS [打布稿标题命名]
  FROM
    [Departments].[dbo].[task_product_layout_design]
),
[当前异常订单清单] AS (
  SELECT
    [ID],
    [内部订单号],
    [付款日期],
    [异常类型],
    [分类],
    [订单备注],
    [标签],
    [颜色及规格],
    A.[商品编码],
    [款号] AS [款式编码],
    [虚拟分类],
    [商品名称],
    [简称],
    CASE
      WHEN [线的材质] = '棉线' THEN 'M'
      WHEN [线的材质] = '丝线' THEN 'S'
      ELSE '0'
    END AS [线的材质],
    CASE
      WHEN [标签] LIKE '%JIT%' THEN 'JIT'
      WHEN [标签] LIKE '%优选仓%' THEN '优选仓'
    END AS [紧急任务],
    CASE
      WHEN [虚拟分类] LIKE '常规' THEN 'N'
    END AS [常规款标志],
    ISNULL(
      CAST(CAST([画布宽] AS FLOAT) AS NVARCHAR) + 'X' + CAST(CAST([画布长] AS FLOAT) AS NVARCHAR),
      0
    ) AS [画布尺寸],
    ISNULL(
      CAST(CAST([画心宽] AS FLOAT) AS NVARCHAR) + 'X' + CAST(CAST([画心长] AS FLOAT) AS NVARCHAR),
      0
    ) AS [画心尺寸],
    ISNULL([供应商], 0) AS [供应商],
    ISNULL([供应商商品编码], 0) AS [供应商商品编码],
    ISNULL(REPLACE([画布材质], 'ct', 'CT'), 0) AS [画布材质],
    RIGHT(FORMAT(GETDATE(), 'yyyyMMdd'), 6) AS [版本号],
    CASE
      WHEN [供应商] LIKE '%高美%' THEN 'GM'
      WHEN [供应商] LIKE '%元色%' THEN 'YS'
      ELSE '0'
    END AS [色库],
    CASE
      WHEN [商品名称] LIKE '%电表箱%' THEN '电表箱'
      WHEN [商品名称] LIKE '%内绷框%' THEN '内绷框'
    END AS [商品额外属性],
    CASE
      WHEN [异常类型] = '定制照片秀' THEN '照片绣'
      ELSE '试卖款'
    END AS [商品类型],
    CASE
      WHEN [分类] IN (
        '十字绣 - 十字绣D',
        '十字绣 - 十字绣B4',
        '十字绣 - 十字绣HMA',
        '照片绣 - 十字绣照片绣'
      )
      AND [虚拟分类] NOT IN ('常规款', '侵权', '外贸海外仓')
      AND A.[商品编码] NOT LIKE '%ZX%' THEN '十字绣'
      WHEN [分类] IN (
        '钻石画 - 钻石画A',
        '照片绣 - 钻石画照片绣',
        '钻石画 - 钻石画HMA'
      )
      AND [虚拟分类] NOT IN ('工具') THEN '钻石画'
      WHEN [分类] IN (
        '数字油画 - 数字油画G',
        '照片绣 - 数字油画照片绣',
        '数字油画 - 数字油画HMA'
      )
      AND [虚拟分类] NOT IN ('工具') THEN '数字油画'
      WHEN [分类] IN (
        '装饰画 - 晶瓷画Q',
        '装饰画 - 油画布装饰画QC',
        '装饰画 - 电表箱装饰画QA',
        '装饰画 - 带灯装饰画QB',
        '照片绣 - 装饰画照片绣'
      ) THEN '装饰画'
    END AS [商品品类],
    CASE
      WHEN [分类] IN (
        '十字绣 - 十字绣B4',
        '十字绣 - 十字绣HMA',
        '钻石画 - 钻石画HMA',
        '数字油画 - 数字油画HMA'
      )
      OR [虚拟分类] IN ('外贸照片') THEN '外贸'
      ELSE '内销'
    END AS [商品销售地]
  FROM
    [当前聚水潭待发货清单] AS A
    LEFT JOIN [有打布稿商品编码清单] AS B ON A.[商品编码] = B.[商品编码]
  WHERE
    B.[商品编码] IS NULL
),
[筛选去重异常订单] AS (
  SELECT
    *
  FROM
    [当前异常订单清单]
  WHERE
    [商品品类] + [商品类型] + [商品销售地] IS NOT NULL
    AND (
      [ID] IN (
        SELECT
          MAX([ID])
        FROM
          [当前异常订单清单]
        WHERE
          [商品类型] = '试卖款'
        GROUP BY
          [商品编码]
      )
      OR [商品类型] = '照片绣'
    )
),
[无打布稿订单] AS (
  SELECT
    A.*,
    B.[版本号] AS [最新版本号]
  FROM
    [筛选去重异常订单] AS A
    LEFT JOIN [有设计稿商品编码清单] AS B ON A.[商品编码] = B.[商品编码]
),
[照片绣待确认效果图] AS (
  SELECT
    A.[内部订单号] AS [erp_order_id],
    CASE
      WHEN A.[订单备注] LIKE '%需要效果图%' THEN REPLACE(
        A.[订单备注],
        '需要效果图',
        '待确认效果图'
      )
      WHEN A.[订单备注] LIKE '%换图%' THEN REPLACE(A.[订单备注], '换图', '待确认效果图')
      WHEN A.[订单备注] LIKE '%重新设计%' THEN REPLACE(
        A.[订单备注],
        '重新设计',
        '待确认效果图'
      )
    END AS [order_note_new]
  FROM
    [无打布稿订单] AS A
    JOIN [当前开发部设计任务清单] AS B ON A.[内部订单号] = B.[内部订单号]
  WHERE
    A.[商品类型] = '照片绣'
    AND (
      A.[订单备注] LIKE '%需要效果图%'
      OR A.[订单备注] LIKE '%换图%'
      OR A.[订单备注] LIKE '%重新设计%'
    )
    AND [设计进度] = '已完成'
    AND [是否启用] = 1
)
SELECT
  *
FROM
  [照片绣待确认效果图];