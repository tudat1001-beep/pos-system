import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "do-uong" },
      update: {},
      create: {
        name: "Đồ uống",
        slug: "do-uong",
        image: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400",
      },
    }),
    prisma.category.upsert({
      where: { slug: "thuc-an-nhanh" },
      update: {},
      create: {
        name: "Thức ăn nhanh",
        slug: "thuc-an-nhanh",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
      },
    }),
    prisma.category.upsert({
      where: { slug: "trang-mieng" },
      update: {},
      create: {
        name: "Tráng miệng",
        slug: "trang-mieng",
        image: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400",
      },
    }),
    prisma.category.upsert({
      where: { slug: "san-pham-khac" },
      update: {},
      create: {
        name: "Khác",
        slug: "san-pham-khac",
        image: "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=400",
      },
    }),
  ]);

  console.log("✅ Created categories");

  // Create users
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const staffPassword = await bcrypt.hash("staff123", 10);

  const owner = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: hashedPassword,
      name: "Nguyễn Văn Chủ",
      email: "admin@pos.vn",
      phone: "0901234567",
      role: "OWNER",
    },
  });

  const staff = await prisma.user.upsert({
    where: { username: "staff" },
    update: {},
    create: {
      username: "staff",
      password: staffPassword,
      name: "Trần Thị Nhân Viên",
      email: "staff@pos.vn",
      phone: "0907654321",
      role: "STAFF",
    },
  });

  console.log("✅ Created users");

  // Create products
  const products = [
    { name: "Cà phê đen", sku: "CF001", price: 25000, costPrice: 8000, stock: 100, categoryId: categories[0].id },
    { name: "Cà phê sữa", sku: "CF002", price: 30000, costPrice: 10000, stock: 100, categoryId: categories[0].id },
    { name: "Bạc xỉu", sku: "CF003", price: 35000, costPrice: 12000, stock: 80, categoryId: categories[0].id },
    { name: "Trà đá", sku: "TD001", price: 15000, costPrice: 5000, stock: 150, categoryId: categories[0].id },
    { name: "Trà sữa trân châu", sku: "TS001", price: 35000, costPrice: 12000, stock: 60, categoryId: categories[0].id },
    { name: "Nước cam", sku: "NC001", price: 30000, costPrice: 10000, stock: 50, categoryId: categories[0].id },
    { name: "Sinh tố bơ", sku: "ST001", price: 45000, costPrice: 15000, stock: 30, categoryId: categories[0].id },
    { name: "Hamburger", sku: "HM001", price: 45000, costPrice: 20000, stock: 40, categoryId: categories[1].id },
    { name: "Pizza", sku: "PZ001", price: 89000, costPrice: 40000, stock: 25, categoryId: categories[1].id },
    { name: "Mì gói", sku: "MI001", price: 25000, costPrice: 10000, stock: 100, categoryId: categories[1].id },
    { name: "KFC", sku: "KF001", price: 75000, costPrice: 35000, stock: 35, categoryId: categories[1].id },
    { name: "Bánh mì", sku: "BM001", price: 25000, costPrice: 10000, stock: 50, categoryId: categories[1].id },
    { name: "Kem", sku: "KM001", price: 20000, costPrice: 8000, stock: 60, categoryId: categories[2].id },
    { name: "Bánh ngọt", sku: "BN001", price: 35000, costPrice: 15000, stock: 30, categoryId: categories[2].id },
    { name: "Rau câu", sku: "RC001", price: 15000, costPrice: 5000, stock: 80, categoryId: categories[2].id },
    { name: "Bông tuyết", sku: "BT001", price: 30000, costPrice: 10000, stock: 45, categoryId: categories[2].id },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log("✅ Created products");

  // Create sample customers
  const customers = [
    { name: "Khách lẻ", phone: null },
    { name: "Lê Minh Tuấn", phone: "0912345678", email: "tuanle@email.com", points: 150 },
    { name: "Phạm Thị Hương", phone: "0923456789", email: "huongpham@email.com", points: 320 },
    { name: "Hoàng Văn Đức", phone: "0934567890", email: "duchoang@email.com", points: 85 },
  ];

  for (const customer of customers) {
    if (customer.phone) {
      await prisma.customer.upsert({
        where: { phone: customer.phone },
        update: {},
        create: customer,
      });
    } else {
      await prisma.customer.create({ data: customer });
    }
  }

  console.log("✅ Created customers");

  // Create sample orders
  const customerList = await prisma.customer.findMany();
  const productList = await prisma.product.findMany({ take: 5 });

  for (let i = 0; i < 10; i++) {
    const randomCustomer = customerList[Math.floor(Math.random() * customerList.length)];
    const items = [];
    let total = 0;
    
    for (let j = 0; j < Math.floor(Math.random() * 3) + 1; j++) {
      const product = productList[Math.floor(Math.random() * productList.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const itemTotal = product.price * quantity;
      total += itemTotal;
      items.push({
        productId: product.id,
        quantity,
        price: product.price,
        total: itemTotal,
      });
    }

    await prisma.order.create({
      data: {
        orderNumber: `ORD${String(Date.now() + i).slice(-8)}`,
        userId: i % 2 === 0 ? owner.id : staff.id,
        customerId: randomCustomer.phone ? randomCustomer.id : null,
        totalAmount: total,
        finalAmount: total,
        status: "COMPLETED",
        type: "POS",
        items: {
          create: items,
        },
      },
    });
  }

  console.log("✅ Created sample orders");

  // Create settings
  await prisma.setting.upsert({
    where: { key: "store_name" },
    update: {},
    create: { key: "store_name", value: "ShopVue POS" },
  });

  await prisma.setting.upsert({
    where: { key: "store_address" },
    update: {},
    create: { key: "store_address", value: "123 Nguyễn Trãi, Quận 1, TP.HCM" },
  });

  await prisma.setting.upsert({
    where: { key: "store_phone" },
    update: {},
    create: { key: "store_phone", value: "0901234567" },
  });

  await prisma.setting.upsert({
    where: { key: "bank_bin" },
    update: {},
    create: { key: "bank_bin", value: "970416" },
  });

  await prisma.setting.upsert({
    where: { key: "bank_account" },
    update: {},
    create: { key: "bank_account", value: "1234567890" },
  });

  await prisma.setting.upsert({
    where: { key: "bank_account_name" },
    update: {},
    create: { key: "bank_account_name", value: "NGUYEN VAN A" },
  });

  console.log("✅ Created settings");

  console.log("\n🎉 Database seeded successfully!\n");
  console.log("📝 Demo accounts:");
  console.log("   Owner: admin / admin123");
  console.log("   Staff: staff / staff123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
