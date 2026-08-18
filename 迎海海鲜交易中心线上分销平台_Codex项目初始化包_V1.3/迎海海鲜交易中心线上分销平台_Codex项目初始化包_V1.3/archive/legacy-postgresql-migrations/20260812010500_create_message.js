exports.up = (pgm) => {
  pgm.createTable("message", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    user_id: {
      type: "uuid",
      references: "users(id)",
      onDelete: "CASCADE"
    },
    title: { type: "varchar(128)", notNull: true },
    content: { type: "text", notNull: true },
    message_type: { type: "varchar(32)", notNull: true, default: "notice" },
    read_status: { type: "varchar(32)", notNull: true, default: "unread" },
    read_at: { type: "timestamptz" },
    created_at: {
      type: "timestamptz",
      notNull: true,
      default: pgm.func("now()")
    }
  });

  pgm.createIndex("message", "user_id");
  pgm.createIndex("message", "read_status");
  pgm.createIndex("message", "created_at");
};

exports.down = (pgm) => {
  pgm.dropTable("message");
};
