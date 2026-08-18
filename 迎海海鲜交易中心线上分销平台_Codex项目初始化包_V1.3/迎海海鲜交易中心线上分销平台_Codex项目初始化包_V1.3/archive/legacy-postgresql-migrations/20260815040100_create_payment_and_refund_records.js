exports.up = (pgm) => {
  // Sprint3 已具备 paid_at、cancel_reason 与兼容 Sprint4 的订单/支付状态约束；此迁移只新增支付与退款流水。
  pgm.createTable("payment_record", {
    id:{type:"uuid",primaryKey:true,default:pgm.func("gen_random_uuid()")}, payment_no:{type:"varchar(64)",notNull:true,unique:true},
    order_id:{type:"uuid",notNull:true,references:"orders(id)",onDelete:"RESTRICT"}, order_no:{type:"varchar(64)",notNull:true}, user_id:{type:"uuid",notNull:true,references:"users(id)",onDelete:"RESTRICT"},
    channel:{type:"varchar(32)",notNull:true,default:"wechat"}, trade_type:{type:"varchar(32)",notNull:true,default:"mini_program"}, amount:{type:"numeric(12,2)",notNull:true}, currency:{type:"varchar(8)",notNull:true,default:"CNY"},
    payment_status:{type:"varchar(32)",notNull:true,default:"created"}, provider_transaction_id:{type:"varchar(128)"}, provider_prepay_id:{type:"varchar(128)"}, provider_raw_response:{type:"jsonb"}, paid_at:{type:"timestamptz"}, failed_at:{type:"timestamptz"}, closed_at:{type:"timestamptz"}, created_at:{type:"timestamptz",notNull:true,default:pgm.func("now()")}, updated_at:{type:"timestamptz",notNull:true,default:pgm.func("now()")} 
  });
  pgm.addConstraint("payment_record","payment_amount_positive_chk",{check:"amount > 0"});
  pgm.addConstraint("payment_record","payment_status_chk",{check:"payment_status IN ('created','pending','success','failed','closed','refunding','refunded')"});
  pgm.createIndex("payment_record","order_id"); pgm.createIndex("payment_record","provider_transaction_id"); pgm.createIndex("payment_record","payment_status"); pgm.createIndex("payment_record","created_at");
  pgm.createIndex("payment_record","order_id",{name:"payment_one_active_per_order",unique:true,where:"payment_status IN ('created','pending')"});
  pgm.createTable("refund_record", {
    id:{type:"uuid",primaryKey:true,default:pgm.func("gen_random_uuid()")}, refund_no:{type:"varchar(64)",notNull:true,unique:true}, payment_id:{type:"uuid",notNull:true,references:"payment_record(id)",onDelete:"RESTRICT"}, payment_no:{type:"varchar(64)",notNull:true}, order_id:{type:"uuid",notNull:true,references:"orders(id)",onDelete:"RESTRICT"}, order_no:{type:"varchar(64)",notNull:true}, user_id:{type:"uuid",notNull:true,references:"users(id)",onDelete:"RESTRICT"}, refund_amount:{type:"numeric(12,2)",notNull:true}, refund_reason:{type:"varchar(255)"}, refund_status:{type:"varchar(32)",notNull:true,default:"created"}, provider_refund_id:{type:"varchar(128)"}, provider_raw_response:{type:"jsonb"}, requested_at:{type:"timestamptz",notNull:true,default:pgm.func("now()")}, success_at:{type:"timestamptz"}, failed_at:{type:"timestamptz"}, created_at:{type:"timestamptz",notNull:true,default:pgm.func("now()")}, updated_at:{type:"timestamptz",notNull:true,default:pgm.func("now()")} 
  });
  pgm.addConstraint("refund_record","refund_amount_positive_chk",{check:"refund_amount > 0"}); pgm.addConstraint("refund_record","refund_status_chk",{check:"refund_status IN ('created','processing','success','failed','closed')"});
  pgm.createIndex("refund_record","order_id"); pgm.createIndex("refund_record","payment_id"); pgm.createIndex("refund_record","refund_status"); pgm.createIndex("refund_record","provider_refund_id");
  pgm.createIndex("refund_record","order_id",{name:"refund_one_active_per_order",unique:true,where:"refund_status IN ('created','processing','success')"});
};
exports.down = (pgm) => { pgm.dropTable("refund_record"); pgm.dropTable("payment_record"); };
