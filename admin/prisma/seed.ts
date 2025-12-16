import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.admin.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  })

  const categories = [
    { name: '电子产品', sort: 1 },
    { name: '证件卡类', sort: 2 },
    { name: '钥匙', sort: 3 },
    { name: '钱包', sort: 4 },
    { name: '书籍', sort: 5 },
    { name: '衣物', sort: 6 },
    { name: '饰品', sort: 7 },
    { name: '其他', sort: 99 },
  ]

  const categoryMap: Record<string, number> = {}
  for (const category of categories) {
    const created = await prisma.category.upsert({
      where: { name: category.name },
      update: { sort: category.sort },
      create: category,
    })
    categoryMap[category.name] = created.id
  }

  const users = [
    { openId: 'test_user_001', nickname: '张小明', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
    { openId: 'test_user_002', nickname: '李小红', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
    { openId: 'test_user_003', nickname: '王大伟', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
    { openId: 'test_user_004', nickname: '赵小兰', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
    { openId: 'test_user_005', nickname: '刘小强', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' },
  ]

  const userMap: Record<string, number> = {}
  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { openId: user.openId },
      update: {},
      create: user,
    })
    userMap[user.openId] = created.id
  }

  const posts = [
    {
      type: 'LOST',
      description: '今天下午在图书馆三楼自习室丢失一部黑色iPhone 15 Pro，带深蓝色手机壳，里面有重要资料，望好心人归还！',
      categoryId: categoryMap['电子产品'],
      locationText: '图书馆三楼自习室',
      contactPhone: '138****1234',
      status: 'APPROVED',
      createdByUser: userMap['test_user_001'],
      tagsJson: JSON.stringify(['iPhone', '黑色', '手机壳']),
    },
    {
      type: 'FOUND',
      description: '在食堂一楼捡到一张学生卡，姓名显示为"陈XX"，请失主联系认领。',
      categoryId: categoryMap['证件卡类'],
      locationText: '第一食堂一楼',
      contactPhone: '139****5678',
      status: 'APPROVED',
      createdByUser: userMap['test_user_002'],
      tagsJson: JSON.stringify(['学生卡', '校园卡']),
    },
    {
      type: 'LOST',
      description: '遗失一串钥匙，上面有3把钥匙和一个小熊挂件，可能丢在教学楼A栋附近。',
      categoryId: categoryMap['钥匙'],
      locationText: '教学楼A栋',
      contactPhone: '137****9012',
      status: 'APPROVED',
      createdByUser: userMap['test_user_003'],
      tagsJson: JSON.stringify(['钥匙串', '小熊挂件']),
    },
    {
      type: 'FOUND',
      description: '在操场跑道边捡到一个棕色钱包，内有现金和银行卡，请失主带证件来认领。',
      categoryId: categoryMap['钱包'],
      locationText: '田径场跑道',
      contactPhone: '136****3456',
      status: 'APPROVED',
      createdByUser: userMap['test_user_004'],
      tagsJson: JSON.stringify(['棕色', '皮质', '钱包']),
    },
    {
      type: 'LOST',
      description: '丢失《高等数学》上册教材一本，书上有很多笔记，非常重要，求归还！',
      categoryId: categoryMap['书籍'],
      locationText: '第二教学楼201',
      contactPhone: '135****7890',
      status: 'APPROVED',
      createdByUser: userMap['test_user_005'],
      tagsJson: JSON.stringify(['高等数学', '教材']),
    },
    {
      type: 'FOUND',
      description: '在宿舍楼下捡到一件黑色羽绒服，里面口袋有纸巾，应该是女生的。',
      categoryId: categoryMap['衣物'],
      locationText: '女生宿舍3号楼',
      contactPhone: '134****2345',
      status: 'APPROVED',
      createdByUser: userMap['test_user_001'],
      tagsJson: JSON.stringify(['羽绒服', '黑色', '女款']),
    },
    {
      type: 'LOST',
      description: '丢失AirPods Pro耳机一副，白色充电盒，可能落在实验楼机房。',
      categoryId: categoryMap['电子产品'],
      locationText: '实验楼B栋机房',
      contactPhone: '133****6789',
      status: 'PENDING',
      createdByUser: userMap['test_user_002'],
      tagsJson: JSON.stringify(['AirPods', '耳机', '白色']),
    },
    {
      type: 'FOUND',
      description: '捡到身份证一张，姓名"周XX"，请本人联系认领。',
      categoryId: categoryMap['证件卡类'],
      locationText: '校门口',
      contactPhone: '132****0123',
      status: 'APPROVED',
      createdByUser: userMap['test_user_003'],
      tagsJson: JSON.stringify(['身份证']),
    },
    {
      type: 'LOST',
      description: '遗失银色MacBook Air笔记本电脑，贴有猫咪贴纸，内有毕业论文资料！',
      categoryId: categoryMap['电子产品'],
      locationText: '咖啡厅',
      contactPhone: '131****4567',
      status: 'APPROVED',
      createdByUser: userMap['test_user_004'],
      tagsJson: JSON.stringify(['MacBook', '笔记本', '银色']),
    },
    {
      type: 'FOUND',
      description: '在篮球场看台捡到一块卡西欧手表，银色表盘，请失主认领。',
      categoryId: categoryMap['饰品'],
      locationText: '篮球场',
      contactPhone: '130****8901',
      status: 'APPROVED',
      createdByUser: userMap['test_user_005'],
      tagsJson: JSON.stringify(['手表', '卡西欧', '银色']),
    },
    {
      type: 'LOST',
      description: '丢失一把车钥匙，大众汽车，黑色遥控器，急寻！',
      categoryId: categoryMap['钥匙'],
      locationText: '停车场',
      contactPhone: '159****1234',
      status: 'APPROVED',
      createdByUser: userMap['test_user_001'],
      tagsJson: JSON.stringify(['车钥匙', '大众']),
    },
    {
      type: 'FOUND',
      description: '在自习室座位上发现一本《数据结构与算法》，书内夹有笔记本。',
      categoryId: categoryMap['书籍'],
      locationText: '图书馆二楼自习室',
      contactPhone: '158****5678',
      status: 'PENDING',
      createdByUser: userMap['test_user_002'],
      tagsJson: JSON.stringify(['数据结构', '教材', '笔记本']),
    },
    {
      type: 'LOST',
      description: '丢失蓝色运动水杯，保温杯，杯身有划痕，在体育馆附近丢失。',
      categoryId: categoryMap['其他'],
      locationText: '体育馆',
      contactPhone: '157****9012',
      status: 'APPROVED',
      createdByUser: userMap['test_user_003'],
      tagsJson: JSON.stringify(['水杯', '保温杯', '蓝色']),
    },
    {
      type: 'FOUND',
      description: '捡到一副黑框眼镜，度数较高，在报告厅前排座位发现。',
      categoryId: categoryMap['其他'],
      locationText: '学术报告厅',
      contactPhone: '156****3456',
      status: 'APPROVED',
      createdByUser: userMap['test_user_004'],
      tagsJson: JSON.stringify(['眼镜', '黑框']),
    },
    {
      type: 'LOST',
      description: '遗失小米充电宝一个，20000毫安，白色外壳，有磨损痕迹。',
      categoryId: categoryMap['电子产品'],
      locationText: '学生活动中心',
      contactPhone: '155****7890',
      status: 'REJECTED',
      rejectReason: '信息描述不够详细，请补充更多特征信息后重新提交',
      createdByUser: userMap['test_user_005'],
      tagsJson: JSON.stringify(['充电宝', '小米', '白色']),
    },
    {
      type: 'FOUND',
      description: '在医务室门口捡到一串宿舍钥匙，挂有粉色兔子挂件。',
      categoryId: categoryMap['钥匙'],
      locationText: '校医院门口',
      contactPhone: '177****2345',
      status: 'APPROVED',
      createdByUser: userMap['test_user_001'],
      tagsJson: JSON.stringify(['宿舍钥匙', '兔子挂件']),
    },
    {
      type: 'LOST',
      description: '丢失一条金色项链，吊坠是心形的，有很大纪念意义，重谢！',
      categoryId: categoryMap['饰品'],
      locationText: '游泳馆',
      contactPhone: '176****6789',
      status: 'APPROVED',
      createdByUser: userMap['test_user_002'],
      tagsJson: JSON.stringify(['项链', '金色', '心形吊坠']),
    },
    {
      type: 'FOUND',
      description: '在公交站台捡到一个黑色双肩包，内有课本和文具。',
      categoryId: categoryMap['其他'],
      locationText: '校门口公交站',
      contactPhone: '175****0123',
      status: 'APPROVED',
      createdByAdmin: admin.id,
      tagsJson: JSON.stringify(['双肩包', '黑色', '书包']),
    },
    {
      type: 'LOST',
      description: '遗失驾驶证和行驶证，姓名"吴XX"，可能掉在行政楼附近。',
      categoryId: categoryMap['证件卡类'],
      locationText: '行政楼',
      contactPhone: '188****4567',
      status: 'PENDING',
      createdByUser: userMap['test_user_003'],
      tagsJson: JSON.stringify(['驾驶证', '行驶证']),
    },
    {
      type: 'FOUND',
      description: '在音乐厅座椅下发现一个U盘，金士顿32G，请失主联系。',
      categoryId: categoryMap['电子产品'],
      locationText: '音乐厅',
      contactPhone: '187****8901',
      status: 'APPROVED',
      createdByAdmin: admin.id,
      tagsJson: JSON.stringify(['U盘', '金士顿', '32G']),
    },
  ]

  for (const post of posts) {
    const existingPost = await prisma.post.findFirst({
      where: { description: post.description }
    })
    
    if (!existingPost) {
      await prisma.post.create({
        data: {
          ...post,
          images: {
            create: [
              { url: `https://picsum.photos/seed/${Math.random().toString(36).slice(2)}/400/300`, sort: 0 },
              { url: `https://picsum.photos/seed/${Math.random().toString(36).slice(2)}/400/300`, sort: 1 },
            ]
          }
        }
      })
    }
  }

  console.log('Seed data created successfully')
  console.log(`- Admin: admin / admin123`)
  console.log(`- Users: ${users.length}`)
  console.log(`- Categories: ${categories.length}`)
  console.log(`- Posts: ${posts.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
