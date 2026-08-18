exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("category", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    parent_id: {
      type: "uuid",
      references: "category(id)",
      onDelete: "RESTRICT"
    },
    name: { type: "varchar(64)", notNull: true },
    code: { type: "varchar(64)", notNull: true, unique: true },
    icon_url: { type: "text" },
    image_url: { type: "text" },
    sort_order: { type: "integer", notNull: true, default: 0 },
    status: { type: "varchar(16)", notNull: true, default: "enabled" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    },
    deleted_at: { type: "timestamptz" }
  });
  pgm.createIndex("category", "parent_id");
  pgm.createIndex("category", ["status", "sort_order"]);

  pgm.createTable("product", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    category_id: {
      type: "uuid",
      notNull: true,
      references: "category(id)",
      onDelete: "RESTRICT"
    },
    name: { type: "varchar(128)", notNull: true },
    subtitle: { type: "varchar(255)" },
    product_code: { type: "varchar(64)", notNull: true, unique: true },
    main_image_url: { type: "text" },
    description: { type: "text" },
    unit: { type: "varchar(32)", notNull: true },
    origin: { type: "varchar(128)" },
    storage_method: { type: "varchar(128)" },
    shelf_status: { type: "varchar(16)", notNull: true, default: "draft" },
    recommend_status: { type: "boolean", notNull: true, default: false },
    sort_order: { type: "integer", notNull: true, default: 0 },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    },
    deleted_at: { type: "timestamptz" }
  });
  pgm.createIndex("product", "category_id");
  pgm.createIndex("product", "shelf_status");
  pgm.createIndex("product", ["category_id", "shelf_status"]);
  pgm.createIndex("product", ["recommend_status", "sort_order"]);

  pgm.createTable("product_image", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    product_id: {
      type: "uuid",
      notNull: true,
      references: "product(id)",
      onDelete: "CASCADE"
    },
    image_url: { type: "text", notNull: true },
    image_type: { type: "varchar(16)", notNull: true },
    sort_order: { type: "integer", notNull: true, default: 0 },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    }
  });
  pgm.createIndex("product_image", "product_id");
  pgm.createIndex("product_image", ["product_id", "image_type"]);

  pgm.createTable("sku", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    product_id: {
      type: "uuid",
      notNull: true,
      references: "product(id)",
      onDelete: "CASCADE"
    },
    sku_code: { type: "varchar(64)", notNull: true, unique: true },
    name: { type: "varchar(128)", notNull: true },
    spec_json: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    cost_price: { type: "numeric(12,2)" },
    sale_price: { type: "numeric(12,2)", notNull: true },
    market_price: { type: "numeric(12,2)" },
    member_price: { type: "numeric(12,2)" },
    weight: { type: "numeric(12,3)" },
    weight_unit: { type: "varchar(16)" },
    status: { type: "varchar(16)", notNull: true, default: "enabled" },
    sort_order: { type: "integer", notNull: true, default: 0 },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    },
    deleted_at: { type: "timestamptz" }
  });
  pgm.createIndex("sku", "product_id");
  pgm.createIndex("sku", ["product_id", "status"]);

  pgm.createTable("inventory", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    sku_id: {
      type: "uuid",
      notNull: true,
      unique: true,
      references: "sku(id)",
      onDelete: "CASCADE"
    },
    available_stock: { type: "integer", notNull: true, default: 0 },
    locked_stock: { type: "integer", notNull: true, default: 0 },
    warning_stock: { type: "integer", notNull: true, default: 0 },
    stock_status: { type: "varchar(16)", notNull: true, default: "sold_out" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    },
    updated_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    }
  });
  pgm.createIndex("inventory", "stock_status");
};

exports.down = (pgm) => {
  pgm.dropTable("inventory");
  pgm.dropTable("sku");
  pgm.dropTable("product_image");
  pgm.dropTable("product");
  pgm.dropTable("category");
};
