exports.up = (pgm) => {
  pgm.createTable("user_address", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    user_id: {
      type: "uuid",
      notNull: true,
      references: "users(id)",
      onDelete: "CASCADE"
    },
    receiver_name: { type: "varchar(64)", notNull: true },
    receiver_phone: { type: "varchar(32)", notNull: true },
    province: { type: "varchar(64)", notNull: true },
    city: { type: "varchar(64)", notNull: true },
    district: { type: "varchar(64)", notNull: true },
    detail_address: { type: "varchar(255)", notNull: true },
    longitude: { type: "decimal(10,6)" },
    latitude: { type: "decimal(10,6)" },
    is_default: { type: "boolean", notNull: true, default: false },
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

  pgm.createIndex("user_address", "user_id");
  pgm.createIndex("user_address", ["user_id", "is_default"]);
  pgm.createIndex("user_address", ["user_id"], {
    name: "user_address_one_default_per_user_idx",
    unique: true,
    where: "is_default = true AND deleted_at IS NULL"
  });
};

exports.down = (pgm) => {
  pgm.dropTable("user_address");
};
