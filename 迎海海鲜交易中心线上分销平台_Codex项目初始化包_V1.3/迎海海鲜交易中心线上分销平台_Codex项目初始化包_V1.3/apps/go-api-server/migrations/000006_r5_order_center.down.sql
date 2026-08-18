DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;

ALTER TABLE inventory_transactions
  DROP INDEX uk_inventory_transactions_sku_reference,
  ADD UNIQUE KEY uk_inventory_transactions_reference (reference_type, reference_id, type);
