exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("users", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    openid: { type: "varchar(128)", notNull: true, unique: true },
    unionid: { type: "varchar(128)" },
    phone: { type: "varchar(32)" },
    status: { type: "varchar(32)", notNull: true, default: "active" },
    last_login_at: { type: "timestamptz" },
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

  pgm.createIndex("users", "phone");
  pgm.createIndex("users", "status");
};

exports.down = (pgm) => {
  pgm.dropTable("users");
};
