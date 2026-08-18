exports.up = (pgm) => {
  pgm.createTable("user_profile", {
    id: {
      type: "uuid",
      primaryKey: true,
      default: pgm.func("gen_random_uuid()")
    },
    user_id: {
      type: "uuid",
      notNull: true,
      unique: true,
      references: "users(id)",
      onDelete: "CASCADE"
    },
    nickname: { type: "varchar(64)" },
    avatar_url: { type: "text" },
    gender: { type: "varchar(16)", notNull: true, default: "unknown" },
    birthday: { type: "date" },
    bio: { type: "varchar(255)" },
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

  pgm.createIndex("user_profile", "user_id");
};

exports.down = (pgm) => {
  pgm.dropTable("user_profile");
};
