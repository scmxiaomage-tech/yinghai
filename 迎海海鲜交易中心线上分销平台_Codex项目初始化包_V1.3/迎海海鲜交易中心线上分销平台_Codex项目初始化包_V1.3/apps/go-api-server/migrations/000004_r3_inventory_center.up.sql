CREATE TABLE inventories (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sku_id BIGINT UNSIGNED NOT NULL,
  total_stock INT UNSIGNED NOT NULL DEFAULT 0,
  locked_stock INT UNSIGNED NOT NULL DEFAULT 0,
  sold_stock INT UNSIGNED NOT NULL DEFAULT 0,
  warning_stock INT UNSIGNED NOT NULL DEFAULT 0,
  version BIGINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_inventories_sku_id (sku_id),
  KEY idx_inventories_stock_state (total_stock, locked_stock, warning_stock),
  CONSTRAINT fk_inventories_sku FOREIGN KEY (sku_id) REFERENCES skus(id),
  CONSTRAINT chk_inventories_stock_non_negative CHECK (total_stock >= locked_stock)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE inventory_transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sku_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(16) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  before_stock INT UNSIGNED NOT NULL,
  after_stock INT UNSIGNED NOT NULL,
  before_locked_stock INT UNSIGNED NOT NULL,
  after_locked_stock INT UNSIGNED NOT NULL,
  reference_type VARCHAR(32) NULL,
  reference_id VARCHAR(64) NULL,
  remark VARCHAR(255) NULL,
  operator_type VARCHAR(32) NOT NULL DEFAULT 'system',
  operator_id VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uk_inventory_transactions_reference (reference_type, reference_id, type),
  KEY idx_inventory_transactions_sku_type_time (sku_id, type, created_at),
  KEY idx_inventory_transactions_reference (reference_type, reference_id),
  CONSTRAINT fk_inventory_transactions_sku FOREIGN KEY (sku_id) REFERENCES skus(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
