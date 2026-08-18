exports.up = (pgm) => {
  pgm.createTable("user_login_record", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "SET NULL"
    },
    login_type: { type: "varchar(32)", notNull: true },
    openid: { type: "varchar(128)" },
    ip: { type: "varchar(64)" },
    user_agent: { type: "text" },
    device: { type: "varchar(128)" },
    login_result: { type: "varchar(32)", notNull: true },
    fail_reason: { type: "varchar(255)" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    }
  });

  pgm.createIndex("user_login_record", "user_id");
  pgm.createIndex("user_login_record", "created_at");
  pgm.createIndex("user_login_record", "login_result");
};

exports.down = (pgm) => {
  pgm.dropTable("user_login_record");
};
