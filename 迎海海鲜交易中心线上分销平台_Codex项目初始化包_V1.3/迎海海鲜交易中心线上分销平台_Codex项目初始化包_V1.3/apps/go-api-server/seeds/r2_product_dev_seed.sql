-- R2 商品中心开发 Seed，仅限 dev/test 手动执行，生产环境禁止自动执行。

INSERT INTO categories (id, parent_id, name, code, icon_url, image_url, sort_order, status) VALUES
(1001, NULL, '龙虾蟹类', 'lobster-crab', '/static/icons/crab.png', '/static/categories/crab.jpg', 10, 'enabled'),
(1002, NULL, '鱼类刺身', 'fish-sashimi', '/static/icons/fish.png', '/static/categories/fish.jpg', 20, 'enabled'),
(1003, NULL, '贝类海鲜', 'shellfish', '/static/icons/shell.png', '/static/categories/shell.jpg', 30, 'enabled'),
(1004, NULL, '虾类专区', 'shrimp', '/static/icons/shrimp.png', '/static/categories/shrimp.jpg', 40, 'enabled'),
(1005, NULL, '海鲜礼盒', 'gift-box', '/static/icons/gift.png', '/static/categories/gift.jpg', 50, 'enabled')
ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order), status = VALUES(status);

INSERT INTO products (id, product_no, category_id, name, subtitle, main_image_url, description, unit, origin, storage_method, shelf_status, recommend_status, sort_order) VALUES
(2001, 'PRD202608150001', 1001, '波士顿龙虾', '450-550g/只，鲜活冷链到家', '/static/products/boston-lobster.jpg', '鲜活波士顿龙虾，源头鲜捕，规格分拣，全程冷链。', '只', '加拿大', '鲜活冷链', 'on_sale', 1, 10),
(2002, 'PRD202608150002', 1001, '澳洲龙虾', '深海大只，宴席硬菜', '/static/products/australia-lobster.jpg', '精选澳洲龙虾，肉质紧实弹牙。', '只', '澳洲', '鲜活冷链', 'on_sale', 1, 20),
(2003, 'PRD202608150003', 1001, '帝王蟹', '3-6斤/只，深海暂养直发', '/static/products/king-crab.jpg', '深海帝王蟹，蟹肉饱满，适合宴请礼赠。', '只', '俄罗斯', '-18℃冷冻储存', 'on_sale', 1, 30),
(2004, 'PRD202608150004', 1001, '珍宝蟹', '膏满肉厚，鲜活现发', '/static/products/dungeness-crab.jpg', '鲜活珍宝蟹，肉质清甜。', '只', '美国', '鲜活冷链', 'on_sale', 0, 40),
(2005, 'PRD202608150005', 1002, '东星斑', '高端宴席鱼，鲜活到家', '/static/products/coral-trout.jpg', '鲜活东星斑，适合清蒸。', '条', '海南', '鲜活冷链', 'on_sale', 1, 50),
(2006, 'PRD202608150006', 1003, '乳山生蚝', '鲜剥现发，肥美多汁', '/static/products/oyster.jpg', '乳山生蚝，肥嫩鲜甜。', '箱', '山东乳山', '冷藏保鲜', 'on_sale', 1, 60),
(2007, 'PRD202608150007', 1003, '深海鲍鱼', '大颗活鲍，鲜味浓郁', '/static/products/abalone.jpg', '活鲍精选，口感弹嫩。', '斤', '福建', '鲜活冷链', 'on_sale', 1, 70),
(2008, 'PRD202608150008', 1003, '花甲', '鲜活吐沙，家常爆炒', '/static/products/clam.jpg', '鲜活花甲，适合爆炒煲汤。', '斤', '广东', '冷藏保鲜', 'on_sale', 0, 80),
(2009, 'PRD202608150009', 1004, '黑虎虾', '30-35cm，巨型黑虎虾', '/static/products/black-tiger-shrimp.jpg', '巨型黑虎虾，个大肉弹。', '盒', '越南', '-18℃冷冻储存', 'on_sale', 1, 90),
(2010, 'PRD202608150010', 1005, '迎海尊享海鲜礼盒', '龙虾蟹贝组合，企业礼赠', '/static/products/seafood-gift-box.jpg', '高端海鲜礼盒，适合商务礼赠。', '盒', '全球甄选', '冷链配送', 'draft', 0, 100)
ON DUPLICATE KEY UPDATE name = VALUES(name), shelf_status = VALUES(shelf_status), recommend_status = VALUES(recommend_status);

INSERT INTO skus (sku_no, product_id, name, spec_json, cost_price, sale_price, market_price, member_price, weight, weight_unit, status, sort_order) VALUES
('SKU202608150001', 2001, '450-550g/只', JSON_OBJECT('规格','450-550g/只'), 88.00, 128.00, 198.00, 118.00, 0.550, 'kg', 'enabled', 10),
('SKU202608150002', 2001, '800-1000g/只', JSON_OBJECT('规格','800-1000g/只'), 168.00, 258.00, 328.00, 238.00, 1.000, 'kg', 'enabled', 20),
('SKU202608150003', 2002, '1.2-1.5斤/只', JSON_OBJECT('规格','1.2-1.5斤/只'), 198.00, 298.00, 398.00, 278.00, 0.750, 'kg', 'enabled', 10),
('SKU202608150004', 2003, '3-6斤/只', JSON_OBJECT('规格','3-6斤/只'), 688.00, 998.00, 1688.00, 958.00, 3.000, 'kg', 'enabled', 10),
('SKU202608150005', 2004, '600-700g/只', JSON_OBJECT('规格','600-700g/只'), 128.00, 198.00, 298.00, 188.00, 0.700, 'kg', 'enabled', 10),
('SKU202608150006', 2005, '1.2-1.5斤/条', JSON_OBJECT('规格','1.2-1.5斤/条'), 188.00, 268.00, 338.00, 258.00, 0.750, 'kg', 'enabled', 10),
('SKU202608150007', 2006, '5斤装', JSON_OBJECT('规格','5斤装'), 68.00, 98.00, 128.00, 88.00, 2.500, 'kg', 'enabled', 10),
('SKU202608150008', 2007, '10头/斤', JSON_OBJECT('规格','10头/斤'), 108.00, 168.00, 218.00, 158.00, 0.500, 'kg', 'enabled', 10),
('SKU202608150009', 2008, '2斤装', JSON_OBJECT('规格','2斤装'), 18.00, 29.80, 39.80, NULL, 1.000, 'kg', 'enabled', 10),
('SKU202608150010', 2009, '1650g/盒', JSON_OBJECT('规格','1650g/盒'), 48.00, 73.85, 99.00, 69.00, 1.650, 'kg', 'enabled', 10),
('SKU202608150011', 2010, '尊享礼盒', JSON_OBJECT('规格','龙虾蟹贝组合'), 388.00, 588.00, 688.00, 558.00, 3.500, 'kg', 'enabled', 10)
ON DUPLICATE KEY UPDATE sale_price = VALUES(sale_price), status = VALUES(status);

INSERT INTO product_images (product_id, image_url, image_type, sort_order) VALUES
(2001, '/static/products/boston-lobster-detail-1.jpg', 'detail', 10),
(2001, '/static/products/boston-lobster-detail-2.jpg', 'detail', 20),
(2003, '/static/products/king-crab-detail-1.jpg', 'detail', 10),
(2009, '/static/products/black-tiger-shrimp-detail-1.jpg', 'detail', 10);

INSERT INTO inventories (sku_id, total_stock, locked_stock, sold_stock, warning_stock) VALUES
((SELECT id FROM skus WHERE sku_no = 'SKU202608150001'), 100, 0, 0, 10),
((SELECT id FROM skus WHERE sku_no = 'SKU202608150002'), 60, 0, 0, 8),
((SELECT id FROM skus WHERE sku_no = 'SKU202608150003'), 35, 0, 0, 5),
((SELECT id FROM skus WHERE sku_no = 'SKU202608150004'), 18, 0, 0, 3),
((SELECT id FROM skus WHERE sku_no = 'SKU202608150005'), 45, 0, 0, 5),
((SELECT id FROM skus WHERE sku_no = 'SKU202608150006'), 26, 0, 0, 4),
((SELECT id FROM skus WHERE sku_no = 'SKU202608150007'), 120, 0, 0, 15),
((SELECT id FROM skus WHERE sku_no = 'SKU202608150008'), 50, 0, 0, 8),
((SELECT id FROM skus WHERE sku_no = 'SKU202608150009'), 200, 0, 0, 20),
((SELECT id FROM skus WHERE sku_no = 'SKU202608150010'), 80, 0, 0, 10),
((SELECT id FROM skus WHERE sku_no = 'SKU202608150011'), 12, 0, 0, 3)
ON DUPLICATE KEY UPDATE total_stock = VALUES(total_stock), warning_stock = VALUES(warning_stock);
