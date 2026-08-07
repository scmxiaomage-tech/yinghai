"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import "./miniapp.css";
import "./notice.css";
import "./pickup.css";
import "./opening-promo.css";
import "./city-picker.css";
import "./gift-detail.css";
import "./product-cards.css";
import "./fullscreen-detail.css";
import "./checkout.css";
import "./checkout-extras.css";
import "./card-success.css";
import "./quantity.css";
import "./multi-card-success.css";
import "./enterprise.css";
import "./member-center.css";
import "./balance-payment.css";
import "./promotion-report.css";
import "./ledger.css";
import "./home-carousel.css";
import "./shop-home.css";
import "./message-center.css";
import "./seafood-theme.css";
import "./store-unified.css";
import "./money-contrast.css";

const products = [
  { name: "四季臻鲜礼卡", sub: "山海珍馐 · 四季可兑", originalPrice: 688, price: 588, tone: "violet", tag: "热销" },
  { name: "金秋蟹礼卡", sub: "阳澄湖大闸蟹礼遇", originalPrice: 498, price: 398, tone: "gold", tag: "当季" },
  { name: "盛夏果香礼卡", sub: "精品水果 · 全国配送", originalPrice: 428, price: 368, tone: "plum", tag: "新品" },
  { name: "东方茗礼", sub: "武夷岩茶 · 雅致礼盒", originalPrice: 788, price: 688, tone: "black", tag: "臻选" },
];

const giftContents = [
  { name: "猫山王榴莲", image: "/assets/products/durian.webp" },
  { name: "阳澄湖大闸蟹", image: "/assets/products/mitten-crab.webp" },
  { name: "智利车厘子", image: "/assets/products/cherries.webp" },
  { name: "拉菲红酒", image: "/assets/products/wine.webp" },
];

const crabGiftContents = [
  { name: "阳澄湖大闸蟹", image: "/assets/products/crab-main.webp" },
  { name: "挪威帝王蟹", image: "/assets/products/king-crab.webp" },
  { name: "波士顿龙虾", image: "/assets/products/lobster.webp" },
  { name: "东海梭子蟹", image: "/assets/products/swimming-crab.webp" },
];

function contentsFor(productName: string) {
  return productName === "金秋蟹礼卡" ? crabGiftContents : giftContents;
}

type View = "home" | "redeem" | "messages" | "cart" | "share" | "mine" | "enterprise";
type OwnedCard = { id: string; productName: string; tone: string; number: string; password: string; status: "未使用" | "已使用"; boughtAt: string };
type Address = { id: number; name: string; phone: string; text: string; primary: boolean };
type AppMessage = { id: number; type: "订单" | "物流" | "佣金" | "活动"; title: string; text: string; time: string; unread: boolean; tone: "purple" | "blue" | "green" | "orange"; icon: string };

export default function MiniappPage() {
  const [view, setView] = useState<View>("home");
  const [homeMode, setHomeMode] = useState<"shop" | "gift">("shop");
  const [city] = useState("上海");
  const [notice, setNotice] = useState(true);
  const [selected, setSelected] = useState<(typeof products)[0] | null>(null);
  const [checkout, setCheckout] = useState<(typeof products)[0] | null>(null);
  const [toast, setToast] = useState("");
  const [shopCart, setShopCart] = useState<Record<number, number>>({});
  const [selectedShopProduct, setSelectedShopProduct] = useState<(typeof shopProducts)[number] | null>(null);
  const [storeOpen, setStoreOpen] = useState(false);
  const [activeStoreProduct, setActiveStoreProduct] = useState<(typeof shopProducts)[number] | null>(null);
  const [redeemFromGift, setRedeemFromGift] = useState(false);
  const [ownedCards, setOwnedCards] = useState<OwnedCard[]>([
    { id: "demo-1", productName: "四季臻鲜礼卡", tone: "violet", number: "8800 2026 0727 2186", password: "668 899", status: "未使用", boughtAt: "2026-07-27 14:32" },
    { id: "demo-2", productName: "金秋蟹礼卡", tone: "gold", number: "8800 2026 0727 3688", password: "318 826", status: "未使用", boughtAt: "2026-07-26 10:18" },
  ]);
  const [addresses, setAddresses] = useState<Address[]>([
    { id: 1, name: "陈先生", phone: "138****6688", text: "上海市浦东新区华夏东路685号 8幢1206室", primary: true },
    { id: 2, name: "林女士", phone: "186****2186", text: "杭州市萧山区金城路546号 融丰中心", primary: false },
  ]);
  const [messages, setMessages] = useState<AppMessage[]>([
    { id: 1, type: "物流", title: "礼品卡实体卡已发货", text: "您的四季臻鲜实体礼卡已由顺丰速运揽收，运单号 SF1388266688。", time: "今天 10:26", unread: true, tone: "blue", icon: "运" },
    { id: 2, type: "佣金", title: "推广佣金已到账", text: "订单 TG202607280186 已完成，一级推广佣金 ¥47.04 已转入账户余额。", time: "今天 09:18", unread: true, tone: "green", icon: "佣" },
    { id: 3, type: "活动", title: "会员鲜礼节限时开启", text: "VIP会员购买指定生鲜商品享折上折，活动优惠券已发放至您的账户。", time: "昨天 18:30", unread: true, tone: "orange", icon: "促" },
    { id: 4, type: "物流", title: "生鲜订单配送中", text: "订单 SX202607270028 已进入冷链配送，预计今天16:00前送达。", time: "昨天 14:06", unread: false, tone: "blue", icon: "运" },
  ]);

  const flash = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };
  const shopCartCount = Object.values(shopCart).reduce((sum, count) => sum + count, 0);
  const openGiftHome = () => {
    setView("home");
    setHomeMode("gift");
  };
  const pushMessage = (message: Omit<AppMessage, "id" | "time" | "unread">) => {
    setMessages((current) => [{ ...message, id: Date.now(), time: "刚刚", unread: true }, ...current]);
  };
  const unreadMessageCount = messages.filter((message) => message.unread).length;

  return (
    <main className="mini-shell">
      <section className="phone">
        <header className="mini-header">
          <div>
            <span className="eyebrow">YINGHAI SEAFOOD MARKET</span>
            <h1>迎海水产交易中心</h1>
          </div>
          <button className="header-bell" onClick={() => setView("messages")} aria-label={`消息中心，${unreadMessageCount}条未读消息`}>
            <i>🔔</i>
            {unreadMessageCount > 0 && <em>{unreadMessageCount > 99 ? "99+" : unreadMessageCount}</em>}
          </button>
        </header>

        <div className="mini-content">
          {view === "home" && (
            <div className="animate-rise">
              <section className="home-mode-tabs">
                <button className={homeMode === "shop" ? "active" : ""} onClick={() => setHomeMode("shop")}><b>商城</b><span>生鲜好物</span></button>
                <button className={homeMode === "gift" ? "active" : ""} onClick={() => setHomeMode("gift")}><b>礼品卡</b><span>送礼臻选</span></button>
              </section>
              {homeMode === "shop" ? <ShopHome flash={flash} cart={shopCart} setCart={setShopCart} onOpenCart={() => setView("cart")} onOpenDetail={setSelectedShopProduct} onOpenStore={(product) => { setActiveStoreProduct(product); setStoreOpen(true); }} /> : <><HomeCarousel onCards={openGiftHome} onShare={() => setView("share")} />
              <section className="quick-grid">
                <button onClick={() => { setRedeemFromGift(true); setView("redeem"); }}><i>兑</i><b>在线提货</b><small>卡密核销</small></button>
                <button onClick={openGiftHome}><i>礼</i><b>礼卡商城</b><small>送礼自用</small></button>
                <button onClick={() => setView("enterprise")}><i>企</i><b>企业团购</b><small>阶梯采购</small></button>
              </section>

              <section className="section-head">
                <div><span>SEASONAL PICKS</span><h3>本季臻选</h3></div>
                <span>全部礼卡</span>
              </section>
              <section className="product-grid">
                {products.map((p) => <Product key={p.name} product={p} onClick={() => setSelected(p)} />)}
              </section>

              <button className="share-banner" onClick={() => setView("share")}>
                <div><b>分享好礼，礼遇亦有回响</b><span>自动成为推广伙伴 · 享两级奖励</span></div><strong>VIP</strong><em>→</em>
              </button>
              <p className="service-note">正品保障 · 全国配送 · 专属售后</p>
              </>}
            </div>
          )}

          {view === "redeem" && <Redeem city={city} onBack={redeemFromGift ? openGiftHome : undefined} onDone={() => flash("卡券验证成功，请选择兑换商品")} />}
          {view === "messages" && <MessageCenter messages={messages} setMessages={setMessages} />}
          {view === "cart" && <ShopCartPage cart={shopCart} setCart={setShopCart} flash={flash} onShop={() => { setView("home"); setHomeMode("shop"); }} />}
          {view === "share" && <ShareCenter flash={flash} />}
          {view === "mine" && <Mine cards={ownedCards} addresses={addresses} setAddresses={setAddresses} flash={flash} onEnterprise={() => setView("enterprise")} />}
          {view === "enterprise" && <EnterpriseGroupPage onBack={() => setView("home")} />}
          {selectedShopProduct && <ShopProductDetail product={selectedShopProduct} onBack={() => setSelectedShopProduct(null)} onStore={() => { setActiveStoreProduct(selectedShopProduct); setSelectedShopProduct(null); setStoreOpen(true); }} onAdd={() => { setShopCart((current) => ({ ...current, [selectedShopProduct.id]: (current[selectedShopProduct.id] || 0) + 1 })); flash("已加入购物车"); }} />}
          {storeOpen && <UnifiedSeafoodStore store={storeForProduct(activeStoreProduct || shopProducts[0])} onBack={() => setStoreOpen(false)} flash={flash} onOpenDetail={(product) => { setStoreOpen(false); setSelectedShopProduct(product); }} />}
        </div>

        <nav className="mini-nav">
          {[
            ["home", "⌂", "首页"],
            ["messages", "信", "消息"],
            ["cart", "购", "购物车"],
            ["share", "♧", "推广"],
            ["mine", "○", "我的"],
          ].map(([id, icon, label]) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id as View)}>
              <i className={id === "cart" || id === "messages" ? "nav-cart" : ""}>{icon}{id === "cart" && shopCartCount > 0 && <em>{shopCartCount > 99 ? "99+" : shopCartCount}</em>}{id === "messages" && unreadMessageCount > 0 && <em>{unreadMessageCount > 99 ? "99+" : unreadMessageCount}</em>}</i><span>{label}</span>
            </button>
          ))}
        </nav>

        {notice && (
          <>
          <input id="promo-dismiss-toggle" className="promo-dismiss-toggle" type="checkbox" aria-hidden="true" />
          <div className="overlay promo-overlay">
            <label className="promo-backdrop-dismiss" htmlFor="promo-dismiss-toggle" aria-label="点击空白处关闭开屏广告" />
            <section className="opening-promo" onClick={(event) => event.stopPropagation()}>
              <label className="promo-close" htmlFor="promo-dismiss-toggle" aria-label="关闭开屏广告">×</label>
              <img src="/assets/red-packet-88.webp" alt="你被红包砸中啦，获得88元减免红包" decoding="async" />
              <button className="claim-hotspot" onClick={() => { setNotice(false); flash("88元减免红包已放入您的优惠券卡包"); }}>
                <span>立即领取88元红包</span>
              </button>
              <p>适用于指定礼卡 · 领取后7天内有效</p>
            </section>
          </div>
          </>
        )}

        {selected && <GiftDetailPage product={selected} onBack={() => setSelected(null)} onBuy={() => { setCheckout(selected); setSelected(null); }} />}
        {checkout && <CheckoutPage product={checkout} addresses={addresses} setAddresses={setAddresses} onBack={() => { setCheckout(null); flash("订单尚未支付，已保存至待支付订单"); }} onPhysicalSuccess={() => {
          pushMessage({ type: "订单", title: "实体礼卡邮寄申请成功", text: `${checkout.name}实体卡已登记，我们将按您确认的地址制作并寄出。`, tone: "purple", icon: "单" });
          setCheckout(null);
          setView("mine");
          flash("实体礼卡邮寄申请已提交，我们将按确认地址尽快发出");
        }} onPaid={(cards) => {
          pushMessage({ type: "订单", title: "线上虚拟礼品卡领取成功", text: `${cards.length}张${checkout.name}已放入【我的】-【我的礼品卡】，可随时查看。`, tone: "purple", icon: "单" });
          setOwnedCards((current) => [...cards, ...current]);
          setCheckout(null);
          setView("mine");
          flash(`新的${cards.length}张礼品卡已为您放在【我的】-【我的礼品卡】里面`);
        }} />}
        {toast && <div className="toast">{toast}</div>}
      </section>
      <aside className="desktop-caption">
        <span>MINI PROGRAM DEMO</span>
        <h2>四季礼遇</h2>
        <p>手机端礼卡购买、卡密提货与二级推广体系。</p>
        <a href="/admin">查看管理后台 →</a>
      </aside>
    </main>
  );
}

function Product({ product, onClick }: { product: (typeof products)[0]; onClick: () => void }) {
  return (
    <button className="product-card" onClick={onClick}>
      <div className={`gift-art ${product.tone}`}>
        <span>SEASONS GIFT</span>
        <b>{product.name.replace("礼卡", "")}</b>
        <div className="card-tag-price"><em>{product.tag}</em><del>¥{product.originalPrice}</del><strong><small>¥</small>{product.price}</strong></div>
      </div>
      <div className="card-gift-grid">
        {contentsFor(product.name).map((item) => (
          <div className="card-gift-item" key={item.name}>
            <span><img src={item.image} alt={item.name} loading="eager" decoding="sync" /></span>
            <b>{item.name}</b>
          </div>
        ))}
      </div>
    </button>
  );
}

const shopCategories = [["全部", "grocery-banner"], ["活鲜", "category-frozen"], ["刺身", "salmon"], ["冻品", "frozen"], ["干货", "category-seasoning"], ["礼盒", "category-hotpot"]];

const shopProducts = [
  { id: 1, name: "鲜活深海帝王蟹", category: "活鲜", image: "king-crab", intro: "3–6斤/只，原产海域暂养直发", original: 1688, price: 998, stock: 20, sold: 92, tag: "活鲜" },
  { id: 2, name: "波士顿龙虾", category: "活鲜", image: "lobster", intro: "450–550g/只，活鲜冷链到家", original: 258, price: 128, stock: 86, sold: 74, tag: "活鲜" },
  { id: 3, name: "鲜活梭子蟹", category: "活鲜", image: "swimming-crab", intro: "膏满肉厚，鲜活现发", original: 298, price: 198, stock: 68, sold: 156, tag: "活鲜" },
  { id: 4, name: "阳澄湖大闸蟹", category: "活鲜", image: "mitten-crab", intro: "公母可选，鲜活配送", original: 398, price: 298, stock: 45, sold: 38, tag: "活鲜" },
  { id: 5, name: "鲜活青蟹", category: "活鲜", image: "crab-main", intro: "肉质紧实，膏香浓郁", original: 238, price: 168, stock: 60, sold: 128, tag: "活鲜" },
  { id: 6, name: "生冻帝王蟹腿", category: "冻品", image: "king-crab", intro: "整切蟹腿，急冻锁鲜", original: 688, price: 498, stock: 38, sold: 31, tag: "冻品" },
  { id: 7, name: "波士顿龙虾尾", category: "冻品", image: "lobster", intro: "精选虾尾，肉质弹嫩", original: 198, price: 138, stock: 56, sold: 76, tag: "冻品" },
  { id: 8, name: "舟山梭子蟹礼盒", category: "礼盒", image: "swimming-crab", intro: "节礼精选，顺丰冷链", original: 568, price: 398, stock: 24, sold: 53, tag: "礼盒" },
  { id: 9, name: "大闸蟹家庭装", category: "礼盒", image: "mitten-crab", intro: "六只装，蟹黄饱满", original: 468, price: 328, stock: 30, sold: 88, tag: "礼盒" },
  { id: 10, name: "鲜活花蟹", category: "活鲜", image: "crab-main", intro: "海捕鲜活，肉质甜润", original: 188, price: 138, stock: 55, sold: 64, tag: "活鲜" },
  { id: 11, name: "海捕梭子蟹", category: "活鲜", image: "swimming-crab", intro: "当天捕捞，当天发货", original: 268, price: 188, stock: 72, sold: 95, tag: "活鲜" },
  { id: 12, name: "澳洲岩龙虾", category: "活鲜", image: "lobster", intro: "活鲜进口，肉质饱满", original: 688, price: 528, stock: 18, sold: 21, tag: "活鲜" },
  { id: 13, name: "帝王蟹整只礼盒", category: "礼盒", image: "king-crab", intro: "精选大规格，送礼体面", original: 1988, price: 1388, stock: 15, sold: 19, tag: "礼盒" },
  { id: 14, name: "熟冻清蒸大闸蟹", category: "冻品", image: "mitten-crab", intro: "加热即食，膏香四溢", original: 328, price: 238, stock: 42, sold: 48, tag: "冻品" },
  { id: 15, name: "鲜活面包蟹", category: "活鲜", image: "crab-main", intro: "膏黄丰盈，现捞直发", original: 258, price: 188, stock: 32, sold: 37, tag: "活鲜" },
  { id: 16, name: "冷冻龙虾刺身", category: "刺身", image: "lobster", intro: "鲜甜细腻，刺身级处理", original: 288, price: 208, stock: 26, sold: 29, tag: "刺身" },
  { id: 17, name: "梭子蟹蟹肉装", category: "冻品", image: "swimming-crab", intro: "蟹肉饱满，火锅优选", original: 168, price: 118, stock: 48, sold: 66, tag: "冻品" },
  { id: 18, name: "海鲜蟹礼组合装", category: "礼盒", image: "king-crab", intro: "帝王蟹搭配鲜活好蟹", original: 888, price: 688, stock: 20, sold: 25, tag: "礼盒" },
];

const seafoodProductImage = (product: (typeof shopProducts)[number]) => product.id <= 9 ? `/assets/seafood-skus/sku-${product.id}.jpg` : `/assets/products/${product.image}.webp`;
const seafoodStores = [
  { name: "东海鲜捕旗舰店", logo: "东", tone: "#005b96" }, { name: "北海渔港直供店", logo: "北", tone: "#157caa" },
  { name: "深蓝海产严选店", logo: "深", tone: "#0c6684" }, { name: "舟山海味官方店", logo: "舟", tone: "#147d9d" },
  { name: "渤海蟹宴旗舰店", logo: "渤", tone: "#0b577e" }, { name: "海岸冷链专营店", logo: "海", tone: "#166886" },
];
const storeForProduct = (product: (typeof shopProducts)[number]) => seafoodStores[(product.id - 1) % seafoodStores.length];

function ShopHome({ flash, cart, setCart, onOpenCart, onOpenDetail, onOpenStore }: {
  flash: (message: string) => void;
  cart: Record<number, number>;
  setCart: Dispatch<SetStateAction<Record<number, number>>>;
  onOpenCart: () => void;
  onOpenDetail: (product: (typeof shopProducts)[number]) => void;
  onOpenStore: (product: (typeof shopProducts)[number]) => void;
}) {
  const [category, setCategory] = useState("全部");
  const [keyword, setKeyword] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [flashSeconds, setFlashSeconds] = useState(7745);
  useEffect(() => { const timer = window.setInterval(() => setFlashSeconds((value) => value > 0 ? value - 1 : 7745), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { const timer = window.setInterval(() => setBannerIndex((index) => (index + 1) % 3), 4200); return () => window.clearInterval(timer); }, []);
  const visible = shopProducts.filter((product) => (category === "全部" || product.category === category) && `${product.name}${product.category}${product.intro}`.includes(keyword.trim()));
  const cartCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const cartTotal = shopProducts.reduce((sum, product) => sum + product.price * (cart[product.id] || 0), 0);
  const changeCart = (id: number, amount: number) => setCart((current) => {
    const next = Math.max(0, (current[id] || 0) + amount);
    const updated = { ...current, [id]: next };
    if (!next) delete updated[id];
    return updated;
  });

  const productImage = seafoodProductImage;
  const stores = ["东海鲜捕旗舰店", "北海渔港直供店", "深蓝海产严选店", "舟山海味官方店", "渤海蟹宴旗舰店", "海岸冷链专营店"];
  const storeFor = (product: (typeof shopProducts)[number]) => stores[(product.id - 1) % stores.length];
  const imageSlogan = (product: (typeof shopProducts)[number]) => product.name.includes("龙虾") ? "巨型鲜活！龙虾直达" : product.name.includes("帝王") ? "深海大只！蟹肉饱满" : product.name.includes("大闸") ? "膏黄丰盈！当季好蟹" : product.name.includes("梭子") ? "鲜捕新货！肉厚膏满" : "特大新货！鲜活好蟹";
  const categoryImage = (image: string) => image === "salmon" ? "/assets/products/lobster.webp" : image === "frozen" ? "/assets/products/king-crab.webp" : image === "category-seasoning" ? "/assets/products/swimming-crab.webp" : image === "category-hotpot" ? "/assets/products/mitten-crab.webp" : `/assets/shop/${image}.webp`;
  return <section className="shop-home seafood-home animate-rise">
    <label className="shop-search"><span>⌕</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索水果、蔬菜、肉禽" /><button onClick={() => setKeyword(keyword.trim())}>搜索</button></label>
    <section className="shop-promo-carousel">{[["/assets/seafood-skus/sku-1.jpg","深海活鲜季","帝王蟹直采 · 冷链到家"],["/assets/seafood-skus/sku-2.jpg","龙虾限时立减","波士顿活龙虾 · 次日达"],["/assets/seafood-skus/sku-3.jpg","鲜活梭子蟹专场","鲜捕上岸 · 当日冷链发出"]].map(([image,title,copy],index)=><button className={bannerIndex === index ? "active" : ""} key={title} onClick={() => { setBannerIndex(index); setCategory("活鲜"); }}><img src={image} alt={title}/><div><b>{title}</b><span>{copy}</span></div></button>)}<p>{[0,1,2].map(index=><i className={bannerIndex === index ? "active" : ""} key={index}/>)}</p></section>
    <div className="shop-categories seafood-categories">
      {shopCategories.slice(1).map(([name, image]) => <button className={category === name ? "active" : ""} key={name} onClick={() => setCategory(name)}><img src={categoryImage(image)} alt={name} decoding="async" /><span>{name}</span></button>)}
    </div>
    <button className="store-notice" onClick={() => flash("店铺公告：订单将在48小时内由冷链发出")}>店铺公告 <span>全场满199元包邮，订单48小时内由冷链发出</span></button>
    <section className="flash-sale"><header><div><b>爆款秒杀</b><span>官方立减 · 已有1万人下单</span></div><p>距结束 <i>{String(Math.floor(flashSeconds / 3600)).padStart(2, "0")}</i><em>:</em><i>{String(Math.floor(flashSeconds % 3600 / 60)).padStart(2, "0")}</i><em>:</em><i>{String(flashSeconds % 60).padStart(2, "0")}</i></p><small>更多 ›</small></header><div>{shopProducts.slice(0, 4).map((product) => <button key={product.id} onClick={() => { changeCart(product.id, 1); flash(`${product.name}已加入购物车`); }}><img src={productImage(product)} alt="" /><span>官方立减</span><b>{product.name}</b><strong>¥{product.price}</strong></button>)}</div></section>
    <div className="shop-section-title"><div><span>SEAFOOD MARKET</span><h3>{keyword ? `“${keyword}”搜索结果` : category === "全部" ? "海产好物" : `${category}专区`}</h3></div><small>共 {visible.length} 款</small></div>
    <div className="shop-product-list seafood-product-list">
      {visible.map((product) => <article className="shop-product-card" key={product.id} onClick={() => onOpenDetail(product)}>
        <div className={`shop-product-image ${product.id <= 9 ? `sku-tile-${product.id}` : ""}`}><img src={productImage(product)} alt={product.name} loading="eager" decoding="async" /><em>{product.tag === "活鲜" ? "鲜活" : product.tag === "礼盒" ? "热卖" : "爆款"}</em><i>SF 次日达</i><strong>{product.name.includes("龙虾") ? "30–35cm 单只活虾 · 坏单包赔" : product.name.includes("帝王") ? "3–6斤/只 · 深海暂养直发" : "冷链锁鲜 · 坏单包赔"}</strong><span>{imageSlogan(product)}</span></div>
        <div className="shop-product-info"><h4><i>严选</i>{product.name}</h4><p className="promo-line"><b>限时</b> 冷链补贴 ¥{Math.max(4, Math.round(product.price / 30))} · 热销爆款</p><div className="shop-price"><p><b><small>¥</small>{product.price}</b><del>原价 ¥{product.original}</del></p>{cart[product.id] ? <div className="shop-stepper" onClick={(event) => event.stopPropagation()}><button onClick={() => changeCart(product.id, -1)}>−</button><b>{cart[product.id]}</b><button onClick={() => changeCart(product.id, 1)}>＋</button></div> : <button onClick={(event) => { event.stopPropagation(); changeCart(product.id, 1); flash(`${product.name}已加入购物车`); }}>加购</button>}</div><div className="shop-sales"><span>已售 {product.sold * 100}+件</span><span>回头客 {Math.round(product.sold * .6)}%</span></div><button className="store-name" onClick={(event) => { event.stopPropagation(); onOpenStore(product); }}><i>{storeForProduct(product).logo}</i>月涨粉 {Math.round(product.sold / 2)}千 · {storeForProduct(product).name} ›</button></div>
      </article>)}
      {!visible.length && <div className="shop-empty">暂时没有找到相关商品，换个关键词试试。</div>}
    </div>
    {cartCount > 0 && <div className="shop-cart-bar"><button className="shop-cart-icon" onClick={onOpenCart}>购<em>{cartCount}</em></button><p><span>合计</span><b>¥{cartTotal.toFixed(2)}</b><small>不含配送费</small></p><button onClick={onOpenCart}>去购物车</button></div>}
  </section>;
}

function ShopProductDetail({ product, onBack, onStore, onAdd }: { product: (typeof shopProducts)[number]; onBack: () => void; onStore: () => void; onAdd: () => void }) {
  const image = seafoodProductImage(product);
  return <section className="commerce-page detail-page"><header><button onClick={onBack}>‹</button><b>商品详情</b><button>•••</button></header><img className="detail-photo" src={image} alt={product.name}/><div className="detail-copy"><div className="detail-flags"><span>SF 次日达</span><span>坏单包赔</span><span>全程冷链</span></div><h2>{product.name}</h2><p>{product.intro}</p><div className="detail-price-row"><b>¥{product.price}</b><del>¥{product.original}</del><span>已售 {product.sold * 100}+件</span></div><div className="detail-metrics"><span>月涨粉 {Math.round(product.sold / 2)}00+</span><span>回头客 {Math.round(product.sold * .6)}%</span><span>48小时内发货</span></div><button className="store-link" onClick={onStore}><i>迎</i><span><b>迎海水产旗舰店</b><small>4.9 分 · 12.8万粉丝 · 近一年 8.6万回头客</small></span><em>进店 ›</em></button></div><section className="detail-long"><div className="detail-story detail-story-intro"><img src={image} alt=""/><div><small>YINGHAI SEAFOOD</small><h3>{product.name}</h3><b>源头鲜捕 · 严选好货</b><span>{product.intro}</span></div></div><div className="detail-story detail-story-quality"><img src={image} alt=""/><div><small>品质看得见</small><h3>鲜活分拣<br/>锁住海味本真</h3><p>规格分拣 · 出库复核 · 坏单包赔</p></div></div><div className="detail-story detail-story-spec"><img src={image} alt=""/><div><small>规格清晰可见</small><h3>{product.name}<br/>严选分级</h3><p>精选规格 · 低温保鲜 · 到家无忧</p></div></div><div className="detail-story detail-story-cold"><img src={image} alt=""/><div><small>全程冷链配送</small><h3>从海岸到餐桌<br/>新鲜准时抵达</h3><p>48小时内发出 · SF次日达</p></div></div><section className="detail-review"><h3>买家评价</h3><article>★★★★★ <b>肉质非常饱满，次日就收到了。</b><small>回购用户 · 3天前</small></article><article>★★★★★ <b>包装严实，冰袋完整，值得回购。</b><small>认证买家 · 7天前</small></article></section></section><footer><button onClick={onAdd}>加入购物车</button><button onClick={onAdd}>立即购买</button></footer></section>;
}

function InlineProductDetail({ product, onClose, flash }: { product: (typeof shopProducts)[number]; onClose: () => void; flash: (message: string) => void }) {
  const image = seafoodProductImage(product);
  return <section className="store-inline-detail"><div className="inline-detail-title"><b>{product.name} · 商品详情</b><button onClick={onClose}>收起详情</button></div><section className="inline-basic"><div className="inline-price"><b>¥{product.price}</b><del>¥{product.original}</del><span>已售 {product.sold * 100}+ 件</span></div><h3>{product.name}</h3><p>{product.intro}</p><div className="inline-service"><span>冷链送货上门</span><span>坏单包赔</span><span>48小时内发货</span></div><div className="inline-spec"><b>商品参数</b><span>单品</span><span>海鲜水产</span><span>源头严选</span><span>多规格可选</span></div></section><section className="inline-reviews"><header><b>评价 · 1000+</b><span>好评率 98%</span><small>查看全部 ›</small></header><div className="review-tags"><i>肉质饱满 143</i><i>鲜甜可口 72</i><i>个头大 70</i><i>保鲜状态好 63</i></div><article><b>匿名买家 <small>已购 {product.name}</small></b><p>包装非常严实，冷链到货状态很好，肉质饱满鲜甜，规格和描述一致，已经推荐给家人朋友。</p></article><article><b>回购用户 <small>认证买家</small></b><p>收到就很新鲜，分量足，口感细嫩，服务也很及时，下次还会再来。</p></article></section><div className="detail-long"><div className="detail-story detail-story-intro"><img src={image} alt=""/><div><small>YINGHAI SEAFOOD</small><h3>{product.name}</h3><b>源头鲜捕 · 严选好货</b><span>{product.intro}</span></div></div><div className="detail-story detail-story-quality"><img src={image} alt=""/><div><small>品质看得见</small><h3>鲜活分拣<br/>锁住海味本真</h3><p>规格分拣 · 出库复核 · 坏单包赔</p></div></div><div className="detail-story detail-story-spec"><img src={image} alt=""/><div><small>规格清晰可见</small><h3>{product.name}<br/>严选分级</h3><p>精选规格 · 低温保鲜 · 到家无忧</p></div></div><div className="detail-story detail-story-cold"><img src={image} alt=""/><div><small>全程冷链配送</small><h3>从海岸到餐桌<br/>新鲜准时抵达</h3><p>48小时内发出 · SF次日达</p></div></div></div><footer className="inline-paybar"><button className="pay-tool" onClick={() => flash("已进入店铺")}><b>⌂</b><span>店铺</span></button><button className="pay-tool" onClick={() => flash("已打开店铺客服")}><b>◉</b><span>客服</span></button><button className="pay-tool" onClick={() => flash("已收藏商品")}><b>☆</b><span>8万+ 收藏</span></button><div className="pay-actions"><button onClick={() => flash(`${product.name}已加入购物车`)}>加入购物车</button><button onClick={() => flash("已为您锁定优惠，前往结算")}>领券购买<small>新客专享</small></button></div></footer></section>;
}

function StoreHome({ store, flash, onOpenProduct, onTab }: { store: (typeof seafoodStores)[number]; flash: (message: string) => void; onOpenProduct: (product: (typeof shopProducts)[number]) => void; onTab: (tab: string) => void }) {
  const [seconds, setSeconds] = useState(5489);
  useEffect(() => { const timer = window.setInterval(() => setSeconds((value) => value ? value - 1 : 5489), 1000); return () => window.clearInterval(timer); }, []);
  const hot = shopProducts.slice(0, 3);
  return <section className="store-home-page"><nav className="store-tabs store-home-tabs">{["首页","商品","优惠券","新品","客服"].map((name) => <button className={name === "首页" ? "active" : ""} key={name} onClick={() => onTab(name)}>{name}</button>)}</nav><label className="store-home-search"><span>⌕</span><input placeholder={`搜索 ${store.name} 商品`} /><button onClick={() => flash("正在搜索店内商品")}>搜索</button></label><section className="store-home-profile"><i style={{ background: store.tone }}>{store.logo}</i><div><b>{store.name}</b><span>海鲜交易中心认证 · 4.9分 · 12.8万粉丝</span></div><button onClick={() => flash("关注成功，已收到店铺上新提醒")}>+ 关注</button></section><div className="store-home-metrics"><span>近一年 8.6万回头客</span><span>近7天 3.2万件售出</span><span>98% 好评</span></div><section className="store-home-sale"><header><b>店铺秒杀</b><span>距结束 <i>{String(Math.floor(seconds / 3600)).padStart(2, "0")}</i>:<i>{String(seconds % 3600 / 60 | 0).padStart(2, "0")}</i>:<i>{String(seconds % 60).padStart(2, "0")}</i></span><button onClick={() => flash("更多秒杀商品已为您筛选")}>更多 ›</button></header><div>{hot.map((p) => <button key={p.id} onClick={() => onOpenProduct(p)}><img src={seafoodProductImage(p)} alt=""/><small>官方立减</small><b>{p.name}</b><strong>¥{p.price}</strong><em>已售{p.sold}00+</em></button>)}</div></section><section className="store-home-banner"><img src="/assets/seafood-skus/sku-2.jpg" alt=""/><div><small>YINGHAI MARKET</small><b>鲜活海产<br/>直达餐桌</b><span>源头直采 · 全程冷链</span></div></section><section className="store-home-feature"><img src="/assets/seafood-skus/sku-7.jpg" alt=""/><div><small>龙虾专区</small><b>精选波士顿活龙虾</b><span>今日下单 · 次日送达</span><button onClick={() => onOpenProduct(shopProducts[1])}>立即选购</button></div></section><section className="store-home-ranking"><header><b>热销榜</b><span>新品榜</span><span>回购榜</span></header>{shopProducts.slice(0, 3).map((p, index) => <button key={p.id} onClick={() => onOpenProduct(p)}><i>TOP {index + 1}</i><img src={seafoodProductImage(p)} alt=""/><div><b>{p.name}</b><span>累计销量 {p.sold * 100}+ · 热度指数 {9000 - index * 810}</span><em>¥{p.price}</em></div><strong>＋</strong></button>)}</section></section>;
}

function SeafoodStore({ onBack, flash, onOpenDetail, store }: { onBack: () => void; flash: (message: string) => void; onOpenDetail: (product: (typeof shopProducts)[number]) => void; store: (typeof seafoodStores)[number] }) {
  const [followed, setFollowed] = useState(false); const [tab, setTab] = useState("首页");
  useEffect(() => {
    const page = document.querySelector(".store-page");
    if (!page) return;
    const headerName = page.querySelector("header b");
    const heroName = page.querySelector(".store-hero p b");
    if (headerName) headerName.textContent = store.name;
    if (heroName) heroName.textContent = store.name;
    const logo = page.querySelector(".store-hero i") as HTMLElement | null;
    if (logo) { logo.textContent = store.logo; logo.style.background = store.tone; }
    const promo = page.querySelector(".store-promo b");
    if (promo) promo.textContent = `${store.name.replace("旗舰店", "")} · 限时立减`;
  }, [store]);
  useEffect(() => {
    const page = document.querySelector(".store-page");
    if (!page) return;
    page.classList.toggle("store-products-tab", tab === "商品");
    page.classList.toggle("store-home-tab", tab === "首页");
  }, [tab]);
  useEffect(() => {
    const page = document.querySelector(".store-page") as HTMLElement | null;
    if (!page) return;
    const tabs = Array.from(page.querySelectorAll(".store-tabs button"));
    const handlers = tabs.map((button) => {
      const name = button.textContent?.trim();
      const handler = () => {
        if (name === "首页") page.scrollTo({ top: 0, behavior: "smooth" });
        if (name === "商品") page.querySelector(".store-ranking")?.scrollIntoView({ behavior: "smooth" });
        if (name === "优惠券") flash("已领取：满199减20、新客立减券，可在结算页使用");
        if (name === "新品") page.querySelector(".store-dense-grid")?.scrollIntoView({ behavior: "smooth" });
        if (name === "客服") flash("店铺客服已接入，预计30秒内响应");
      };
      button.addEventListener("click", handler);
      return [button, handler] as const;
    });
    return () => handlers.forEach(([button, handler]) => button.removeEventListener("click", handler));
  }, [flash]);
  const [selected, setSelected] = useState<(typeof shopProducts)[number] | null>(shopProducts[0]);
  const productCard = (p: (typeof shopProducts)[number]) => <article className="store-product-card" key={p.id} onClick={() => setSelected(p)}><div className="store-product-image"><img src={seafoodProductImage(p)} alt={p.name}/><em>{p.tag === "活鲜" ? "鲜活" : "爆款"}</em><i>SF 次日达</i><strong>{p.intro}</strong></div><b>{p.name}</b><span>¥{p.price}</span><small>已售{p.sold}00+ · 回购{Math.round(p.sold*.6)}%</small></article>;
  const inlineDetail = selected && <InlineProductDetail product={selected} onClose={() => setSelected(null)} flash={flash}/>;
  if (tab === "首页") return <section className="commerce-page store-page"><header><button onClick={onBack}>‹</button><b>{store.name}</b><button>•••</button></header><StoreHome store={store} flash={flash} onOpenProduct={onOpenDetail} onTab={(next) => { if (next === "商品") setTab("商品"); else if (next === "优惠券") flash("优惠券已领取，可在结算页使用"); else if (next === "新品") flash("新品专区已为您筛选"); else if (next === "客服") flash("店铺客服已接入"); }}/></section>;
  return <section className="commerce-page store-page"><header><button onClick={onBack}>‹</button><b>迎海水产旗舰店</b><button>•••</button></header><section className="store-hero"><div><i>迎</i><p><b>迎海水产旗舰店</b><span>海鲜交易中心认证商家 · 4.9分</span></p><button onClick={() => setFollowed(!followed)}>{followed ? "已关注" : "+ 关注"}</button></div><aside><span>12.8万 粉丝</span><span>8.6万 回头客</span><span>近7天 3.2万件售出</span></aside></section><div className="store-tabs">{["首页","商品","优惠券","新品","客服"].map((item) => <button className={tab === item ? "active" : ""} onClick={() => { setTab(item); if(item === "客服") flash("已进入店铺专属客服咨询"); }} key={item}>{item}</button>)}</div><section className="store-promo"><b>迎海鲜享季 · 限时立减</b><span>满199减20 · 新客券已发放</span><button onClick={() => flash("优惠券已领取，可在结算页使用")}>领取优惠券</button></section><section className="store-categories">{[["活鲜","king-crab"],["刺身","lobster"],["冻品","swimming-crab"],["干货","mitten-crab"],["礼盒","crab-main"]].map(([name,img])=><button key={name} onClick={()=>flash(`已筛选${name}商品`)}><img src={`/assets/products/${img}.webp`} alt=""/><span>{name}</span></button>)}</section><section className="store-ranking"><h3>本店爆款 · 今日立减</h3><div className="store-product-grid">{shopProducts.slice(0,4).map(productCard)}</div></section>{selected ? inlineDetail : <><section className="store-banner">品质海产榜 · 累计服务 12 万家庭</section><section className="store-dense-grid store-product-grid">{shopProducts.slice(4,12).map(productCard)}</section></>}</section>;
}

function UnifiedSeafoodStore({ onBack, flash, onOpenDetail, store }: { onBack: () => void; flash: (message: string) => void; onOpenDetail: (product: (typeof shopProducts)[number]) => void; store: (typeof seafoodStores)[number] }) {
  const tabs = ["首页", "商品", "优惠券", "新品", "客服"];
  const [tab, setTab] = useState("首页");
  const [followed, setFollowed] = useState(false);
  const [seconds, setSeconds] = useState(5489);
  const [selected, setSelected] = useState<(typeof shopProducts)[number]>(shopProducts[0]);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value ? value - 1 : 5489), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const storeProducts = shopProducts.slice(0, 8);
  const hot = storeProducts.slice(0, 3);
  const newItems = shopProducts.slice(8, 14);
  const timeLeft = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(seconds % 3600 / 60 | 0).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const openTab = (next: string) => {
    setTab(next);
    if (next === "客服") flash("店铺客服已接入，预计30秒内响应");
  };

  const productTile = (product: (typeof shopProducts)[number]) => (
    <article className="unified-store-card" key={product.id} onClick={() => { setSelected(product); setTab("商品"); }}>
      <div className="unified-store-img">
        <img src={seafoodProductImage(product)} alt={product.name} />
        <em>{product.tag === "活鲜" ? "鲜活" : "爆款"}</em>
        <i>SF 次日达</i>
        <strong>{product.intro}</strong>
      </div>
      <div className="unified-store-info">
        <b>{product.name}</b>
        <span>¥{product.price}<del>¥{product.original}</del></span>
        <small>已售{product.sold}00+ · 回购{Math.round(product.sold * .6)}%</small>
      </div>
    </article>
  );

  const salePanel = (
    <section className="unified-sale">
      <header><b>店铺秒杀</b><span>距结束 <i>{timeLeft.slice(0, 2)}</i>:<i>{timeLeft.slice(3, 5)}</i>:<i>{timeLeft.slice(6, 8)}</i></span><button onClick={() => openTab("商品")}>更多 ›</button></header>
      <div>{hot.map((product) => <button key={product.id} onClick={() => { setSelected(product); setTab("商品"); }}><img src={seafoodProductImage(product)} alt="" /><small>官方立减12%</small><b>{product.name}</b><strong>¥{product.price}</strong><em>已售{product.sold}00+</em></button>)}</div>
    </section>
  );

  const inlineDetail = <InlineProductDetail product={selected} onClose={() => flash("当前商品详情已置顶显示")} flash={flash} />;

  return <section className="commerce-page store-page unified-store-page">
    <header><button onClick={onBack}>‹</button><b>{store.name}</b><button>•••</button></header>
    <section className="unified-store-top">
      <label className="unified-store-search"><span>⌕</span><input placeholder={`搜索 ${store.name} 商品`} /><button onClick={() => flash("正在搜索店内商品")}>搜索</button></label>
      <div className="unified-store-profile">
        <i style={{ background: store.tone }}>{store.logo}</i>
        <p><b>{store.name}</b><span>海鲜交易中心认证 · 4.9分 · 12.8万粉丝</span></p>
        <button onClick={() => { setFollowed(!followed); flash(followed ? "已取消关注" : "关注成功，已收到店铺上新提醒"); }}>{followed ? "已关注" : "+ 关注"}</button>
      </div>
      <div className="unified-store-metrics"><span>近一年 8.6万回头客</span><span>近7天 3.2万件售出</span><span>98% 好评</span></div>
    </section>
    <nav className="store-tabs unified-store-tabs">{tabs.map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => openTab(item)}>{item}</button>)}</nav>

    {tab === "首页" && <section className="unified-tab-content">
      {salePanel}
      <section className="unified-store-banner"><img src="/assets/seafood-skus/sku-2.jpg" alt="" /><div><small>YINGHAI MARKET</small><b>鲜活海产<br/>直达餐桌</b><span>源头直采 · 全程冷链</span></div></section>
      <section className="unified-feature"><img src="/assets/seafood-skus/sku-7.jpg" alt="" /><div><small>龙虾专区</small><b>精选波士顿活龙虾</b><span>今日下单 · 次日送达</span><button onClick={() => { setSelected(shopProducts[1]); setTab("商品"); }}>立即选购</button></div></section>
      <section className="unified-ranking"><header><b>热销榜</b><span>新品榜</span><span>回购榜</span></header>{storeProducts.slice(0, 3).map((product, index) => <button key={product.id} onClick={() => { setSelected(product); setTab("商品"); }}><i>TOP {index + 1}</i><img src={seafoodProductImage(product)} alt="" /><div><b>{product.name}</b><span>累计销量{product.sold}00+ · 热度指数 {9438 - index * 816}</span><em>¥{product.price}</em></div><strong>＋</strong></button>)}</section>
    </section>}

    {tab === "商品" && <section className="unified-tab-content">
      <section className="unified-categories">{[["活鲜", "king-crab"], ["刺身", "lobster"], ["冻品", "swimming-crab"], ["干货", "mitten-crab"], ["礼盒", "crab-main"]].map(([name, img]) => <button key={name} onClick={() => flash(`已筛选${name}商品`)}><img src={`/assets/products/${img}.webp`} alt="" /><span>{name}</span></button>)}</section>
      <h3 className="unified-section-title">本店爆款 · 今日立减</h3>
      <div className="unified-store-grid">{storeProducts.slice(0, 4).map(productTile)}</div>
      {inlineDetail}
    </section>}

    {tab === "优惠券" && <section className="unified-tab-content">
      <section className="unified-coupon-hero"><b>{store.name.replace("旗舰店", "")}鲜享季 · 限时立减</b><span>满199减20 · 新客券已发放</span><button onClick={() => flash("优惠券已领取，可在结算页使用")}>领取优惠券</button></section>
      <div className="unified-coupon-list">{["满199减20", "新客立减30", "冷链补贴券"].map((coupon) => <button key={coupon} onClick={() => flash(`${coupon} 已领取`)}><b>{coupon}</b><span>全店海鲜商品可用</span><em>立即领取</em></button>)}</div>
      {salePanel}
    </section>}

    {tab === "新品" && <section className="unified-tab-content">
      <h3 className="unified-section-title">今日上新 · 鲜活到仓</h3>
      <div className="unified-store-grid">{newItems.map(productTile)}</div>
      {inlineDetail}
    </section>}

    {tab === "客服" && <section className="unified-tab-content">
      <section className="unified-service-panel"><b>专属客服</b><span>售前咨询、配送时效、坏单包赔、企业采购都可处理。</span><div>{["联系在线客服", "查看配送规则", "申请售后", "企业团购咨询"].map((item) => <button key={item} onClick={() => flash(`${item} 已提交`)}>{item}</button>)}</div></section>
      <section className="unified-service-faq"><b>常见问题</b><p>SF次日达覆盖核心城市，生鲜商品默认冷链发出；到货异常可上传照片申请坏单包赔。</p></section>
    </section>}
  </section>;
}

function ShopCartPage({ cart, setCart, flash, onShop }: {
  cart: Record<number, number>;
  setCart: Dispatch<SetStateAction<Record<number, number>>>;
  flash: (message: string) => void;
  onShop: () => void;
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [useBalance, setUseBalance] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const items = shopProducts.filter((item) => cart[item.id]);
  const cartCount = Object.values(cart).reduce((sum, count) => sum + count, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.price * cart[item.id], 0);
  const validCouponDiscount = (couponDiscount === 50 && cartTotal >= 299) || (couponDiscount === 20 && cartTotal >= 199) ? couponDiscount : 0;
  const deduction = useBalance ? Math.min(20, Math.max(0, cartTotal - validCouponDiscount)) : 0;
  const payable = Math.max(0, cartTotal - validCouponDiscount - deduction);
  const changeCart = (id: number, amount: number) => setCart((current) => {
    const next = Math.max(0, (current[id] || 0) + amount);
    const updated = { ...current, [id]: next };
    if (!next) delete updated[id];
    return updated;
  });

  return <div className="shop-cart-page subpage animate-rise">
    <SubTitle en="SHOPPING CART" title="购物车" desc="生鲜好物统一结算，礼品卡仍直接购买" />
    {!items.length ? <section className="cart-empty"><i>购</i><h3>购物车还是空的</h3><p>去商城挑选新鲜好物吧</p><button onClick={onShop}>去逛商城</button></section> : <>
      <section className="cart-product-list">
        {items.map((item) => <article className="cart-product-row" key={item.id}>
          <img src={`/assets/shop/${item.image}.webp`} alt={item.name} />
          <div><h3>{item.name}</h3><p>{item.intro}</p><b>¥{item.price.toFixed(2)}</b></div>
          <div className="shop-stepper"><button onClick={() => changeCart(item.id, -1)}>−</button><b>{cart[item.id]}</b><button onClick={() => changeCart(item.id, 1)}>＋</button></div>
        </article>)}
      </section>
      <section className="cart-summary-card"><p><span>商品数量</span><b>{cartCount} 件</b></p><p><span>商品金额</span><b>¥{cartTotal.toFixed(2)}</b></p><p><span>配送费</span><b>结算时计算</b></p></section>
      <div className="cart-checkout-footer"><p><span>合计</span><b>¥{cartTotal.toFixed(2)}</b></p><button onClick={() => setCheckoutOpen(true)}>去结算（{cartCount}）</button></div>
    </>}
    {checkoutOpen && <div className="shop-checkout-overlay"><section className="shop-checkout-sheet"><button className="shop-sheet-close" onClick={() => setCheckoutOpen(false)}>×</button><span>FRESH ORDER</span><h3>确认生鲜订单</h3><div className="shop-order-items">{items.map((item) => <p key={item.id}><b>{item.name}</b><span>×{cart[item.id]}</span><strong>¥{(item.price * cart[item.id]).toFixed(2)}</strong></p>)}</div><label>配送方式<select><option>社区自提点</option><option>冷链配送到家</option></select></label><label>收货信息<input defaultValue="陈先生 138****6688" /></label><label>商城优惠券<select value={couponDiscount} onChange={(e) => setCouponDiscount(Number(e.target.value))}><option value="0">不使用优惠券</option><option value="50" disabled={cartTotal < 299}>商城生鲜券 · 满299减50{cartTotal < 299 ? "（未达门槛）" : ""}</option><option value="20">全场通用券 · 满199减20</option></select></label><button className={`shop-wallet ${useBalance ? "active" : ""}`} onClick={() => setUseBalance(!useBalance)}><i>{useBalance ? "✓" : ""}</i><p><b>钱包余额抵扣</b><span>本单可抵扣 ¥{Math.min(20, Math.max(0, cartTotal - validCouponDiscount)).toFixed(2)}</span></p></button><div className="shop-order-total"><span>实付金额{validCouponDiscount > 0 && ` · 已减¥${validCouponDiscount}`}</span><b>¥{payable.toFixed(2)}</b></div><button className="shop-submit" onClick={() => { setCheckoutOpen(false); setCart({}); flash("订单提交成功，可在“我的订单”中查看"); }}>微信支付并提交订单</button></section></div>}
  </div>;
}

function HomeCarousel({ onCards, onShare }: { onCards: () => void; onShare: () => void }) {
  const banners = [
    { title: "至尊四季臻鲜卡，\n给你帝王级的优惠", overline: "ROYAL SEASONS GIFT", desc: "山海臻品汇聚 · 至尊礼遇限时开启", image: "/assets/banners/royal-fresh-card.webp", button: "立即尊享", action: onCards },
    { title: "金秋蟹王卡，\n尽尝秋天第一口鲜", overline: "AUTUMN CRAB FEAST", desc: "阳澄湖鲜活臻选 · 把金秋鲜味带回家", image: "/assets/banners/autumn-crab-card.webp", button: "抢鲜选购", action: onCards },
    { title: "即买即返，\n边吃边赚", overline: "BUY · SHARE · EARN", desc: "购卡享好礼 · 分享再获推广收益", image: "/assets/banners/cashback-reward.webp", button: "查看返利", action: onShare },
  ];
  const [active, setActive] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % banners.length), 5000);
    return () => window.clearInterval(timer);
  }, []);

  const finishSwipe = (endX: number) => {
    if (touchStart === null) return;
    const distance = endX - touchStart;
    if (Math.abs(distance) > 45) setActive((current) => distance < 0 ? (current + 1) % banners.length : (current - 1 + banners.length) % banners.length);
    setTouchStart(null);
  };

  return (
    <section className="home-carousel" onTouchStart={(event) => setTouchStart(event.touches[0].clientX)} onTouchEnd={(event) => finishSwipe(event.changedTouches[0].clientX)}>
      <div className="carousel-track" style={{ transform: `translateX(-${active * 100}%)` }}>
        {banners.map((banner) => <article className="carousel-slide" key={banner.title} style={{ backgroundImage: `linear-gradient(90deg,rgba(12,7,15,.97) 0%,rgba(20,8,24,.82) 40%,rgba(20,8,24,.12) 78%),url(${banner.image})` }}>
          <span>{banner.overline}</span>
          <h2>{banner.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h2>
          <p>{banner.desc}</p>
          <button onClick={banner.action}>{banner.button} →</button>
        </article>)}
      </div>
      <div className="carousel-dots">{banners.map((banner, index) => <button aria-label={`切换到活动${index + 1}`} className={active === index ? "active" : ""} key={banner.title} onClick={() => setActive(index)} />)}</div>
      <span className="carousel-count">0{active + 1} / 03</span>
    </section>
  );
}

function EnterpriseGroupPage({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [wechat, setWechat] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const submit = () => {
    if (!name.trim()) {
      setError("请填写联系人姓名");
      return;
    }
    if (!phone.trim() && !wechat.trim()) {
      setError("联系电话和微信号请至少填写一项");
      return;
    }
    if (phone.trim() && !/^1[3-9]\d{9}$/.test(phone.trim())) {
      setError("请输入正确的11位手机号码");
      return;
    }
    setError("");
    setSuccess(true);
  };

  return (
    <div className="enterprise-page animate-rise">
      <div className="enterprise-title">
        <button onClick={onBack}>‹</button>
        <div><span>ENTERPRISE PURCHASE</span><h2>企业团购</h2></div>
      </div>
      <p className="enterprise-intro">企业福利、商务赠礼与节庆采购专属通道，支持阶梯报价、批量交付与专人全程服务。</p>

      <section className="enterprise-cards">
        {products.map((product) => (
          <article className="enterprise-card" key={product.name}>
            <div className={`gift-art ${product.tone}`}>
              <span>SEASONS GIFT · ENTERPRISE</span>
              <b>{product.name}</b>
              <em>{product.tag}</em>
            </div>
            <div className="enterprise-card-head">
              <h3>{product.name}</h3>
              <div className="enterprise-price"><del>原价 ¥{product.originalPrice}</del><strong><small>¥</small>{product.price}</strong></div>
            </div>
            <div className="enterprise-product-list">
              {contentsFor(product.name).map((item) => <span key={item.name}>{item.name}</span>)}
            </div>
          </article>
        ))}
      </section>

      <section className="group-rules">
        <span>GROUP PURCHASE GUIDE</span>
        <h3>团购说明</h3>
        <div className="tier-list">
          <div><b>50张起订</b><p>达到企业采购起批数量，享企业专属报价与统一开票服务。</p></div>
          <div><b>100–499张</b><p>进入阶梯优惠，采购数量越多，单张价格越优。</p></div>
          <div><b>500张以上</b><p>支持一企一议，可洽谈专属返点、卡面定制与分批交付。</p></div>
        </div>
        <div className="group-services"><span>专属客户经理</span><span>批量制卡</span><span>物流跟踪</span><span>售后支持</span></div>
      </section>

      <section className="enterprise-form">
        <span>CONTACT INFORMATION</span>
        <h3>预约专人服务</h3>
        <p>请留下联系信息，业务专员将为您提供采购方案与正式报价。</p>
        <label className="enterprise-field"><span>姓名</span><input value={name} onChange={(e) => { setName(e.target.value); setError(""); }} placeholder="请输入联系人姓名（必填）" /></label>
        <label className="enterprise-field"><span>联系电话 <em>（与微信二选一必填）</em></span><input type="tel" inputMode="numeric" maxLength={11} value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "")); setError(""); }} placeholder="请输入11位手机号码" /></label>
        <label className="enterprise-field"><span>微信号 <em>（与电话二选一必填）</em></span><input value={wechat} onChange={(e) => { setWechat(e.target.value); setError(""); }} placeholder="请输入微信号" /></label>
        <label className="enterprise-field"><span>公司名称 <em>（选填）</em></span><input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="请输入公司或机构名称" /></label>
        {error && <p className="enterprise-error">! {error}</p>}
        <button className="enterprise-submit" onClick={submit}>专人服务</button>
      </section>

      {success && (
        <div className="enterprise-success">
          <div><i>✓</i><h3>登记已完成</h3><p>尊贵的企业用户，我们的业务专员会尽快联系并为您服务！</p><button onClick={() => setSuccess(false)}>我知道了</button></div>
        </div>
      )}
    </div>
  );
}

function GiftDetailPage({ product, onBack, onBuy }: { product: (typeof products)[0]; onBack: () => void; onBuy: () => void }) {
  const detailItems = contentsFor(product.name);
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(true);
  const [montageFrame, setMontageFrame] = useState(0);
  const [progress, setProgress] = useState(0);
  const quantities = product.name === "金秋蟹礼卡"
    ? ["三公三母 · 6只", "整只装 · 1只", "鲜活装 · 2只", "精品装 · 4只"]
    : ["5斤", "三公三母 · 6斤", "3J规格 · 10斤", "2瓶"];

  useEffect(() => {
    if (active !== -1 || !playing) return;
    const start = Date.now() - (progress / 100) * 15000;
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - start) % 15000;
      setProgress((elapsed / 15000) * 100);
      setMontageFrame(Math.floor(elapsed / 3750) % 4);
    }, 100);
    return () => window.clearInterval(timer);
  }, [active, playing]);

  return (
    <section className="gift-detail-page animate-rise">
      <header className="detail-topbar">
        <button onClick={onBack}>‹</button>
        <div><span>GIFT CARD DETAIL</span><b>{product.name}</b></div>
        <button>•••</button>
      </header>
      <div className="detail-scroll">
        <section className="media-stage">
          {active === -1 ? (
            <div className="montage">
              <img src={detailItems[montageFrame % detailItems.length].image} alt="榴莲与大闸蟹臻鲜短片展示" />
              <div className="montage-shade" />
              <div className="montage-copy"><span>15S SEASONAL FILM</span><h2>{montageFrame % 2 === 0 ? "一口猫山王，馥郁正当时" : "金秋蟹宴，鲜活抵达"}</h2><p>产地直采 · 全程冷链 · 新鲜有保障</p></div>
              <button className="play-control" aria-label={playing ? "暂停" : "播放"} onClick={() => setPlaying(!playing)}>{playing ? "Ⅱ" : "▶"}</button>
              <div className="media-progress"><i style={{width: `${progress}%`}} /></div>
            </div>
          ) : (
            <div className="still-stage"><img src={detailItems[active].image} alt={detailItems[active].name} /><span>真实商品展示</span></div>
          )}
        </section>

        <section className="detail-thumbs">
          <button className={active === -1 ? "active video-thumb" : "video-thumb"} onClick={() => { setActive(-1); setPlaying(true); }}><div><span>▶</span><img src={detailItems[0].image} alt="臻鲜短片" /></div><b>臻鲜短片</b></button>
          {detailItems.map((item, index) => <button key={item.name} className={active === index ? "active" : ""} onClick={() => { setActive(index); setPlaying(false); }}><div><img src={item.image} alt={item.name} loading="lazy" decoding="async" /></div><b>{item.name}</b></button>)}
        </section>

        <section className="detail-includes">
          <header><div><span>CARD INCLUDES</span><h3>礼卡包含商品</h3></div><em>{detailItems.length} 款臻选</em></header>
          <div className="include-list">
            {detailItems.map((item, index) => <article key={item.name}><i>{String(index + 1).padStart(2, "0")}</i><div><b>{item.name}{item.name === "阳澄湖大闸蟹" && product.name !== "金秋蟹礼卡" ? "（三公三母）" : ""}</b><span>产地直采 · 品质甄选</span></div><strong>{quantities[index]}</strong></article>)}
          </div>
        </section>

        <section className="detail-service"><span>正品保障</span><span>全国配送</span><span>坏果包赔</span><span>专属售后</span></section>
        <div className="detail-spacer" />
      </div>
      <footer className="detail-buybar">
        <div><span>活动价</span><p><small>¥</small>{product.price}<del>¥{product.originalPrice}</del></p></div>
        <button onClick={onBuy}>立即购买</button>
      </footer>
    </section>
  );
}

function CheckoutPage({ product, addresses, setAddresses, onBack, onPaid, onPhysicalSuccess }: {
  product: (typeof products)[0];
  addresses: Address[];
  setAddresses: Dispatch<SetStateAction<Address[]>>;
  onBack: () => void;
  onPaid: (cards: OwnedCard[]) => void;
  onPhysicalSuccess: () => void;
}) {
  const items = contentsFor(product.name);
  const [invoicePage, setInvoicePage] = useState(false);
  const [invoice, setInvoice] = useState<{ enabled: boolean; kind: "个人" | "企业"; title: string; taxNo: string; content: "明细" | "礼卡服务" }>({ enabled: false, kind: "企业", title: "", taxNo: "", content: "明细" });
  const [invoiceDraft, setInvoiceDraft] = useState(invoice);
  const [coupon, setCoupon] = useState(88);
  const [quantity, setQuantity] = useState(1);
  const [payment, setPayment] = useState<"wechat" | "alipay" | "bank" | "balance">("wechat");
  const [useBalance, setUseBalance] = useState(false);
  const accountBalance = 3680;
  const [banks, setBanks] = useState([
    { id: "cmb", name: "招商银行", type: "储蓄卡", tail: "6688", color: "red" },
    { id: "icbc", name: "中国工商银行", type: "信用卡", tail: "2186", color: "blue" },
  ]);
  const [selectedBank, setSelectedBank] = useState("cmb");
  const [addBank, setAddBank] = useState(false);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deliveryChoice, setDeliveryChoice] = useState<"physical" | "virtual" | null>(null);
  const [addressConfirm, setAddressConfirm] = useState(false);
  const [addressExpanded, setAddressExpanded] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: "", phone: "", text: "" });
  const [issuedCards, setIssuedCards] = useState<{ number: string; password: string }[]>([]);
  const [activeIssued, setActiveIssued] = useState(0);
  const [orderInfo] = useState(() => {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, "0");
    return {
      id: `GK${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${String(now.getTime()).slice(-8)}`,
      time: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
    };
  });
  const quantities = product.name === "金秋蟹礼卡"
    ? ["三公三母 · 6只", "整只装 · 1只", "鲜活装 · 2只", "精品装 · 4只"]
    : ["5斤", "三公三母 · 6斤", "3J规格 · 10斤", "2瓶"];

  const confirmPay = () => {
    setPaying(true);
    window.setTimeout(() => {
      const seed = Date.now();
      setIssuedCards(Array.from({ length: quantity }, (_, index) => ({
        number: `8800 2026 ${String(seed + index * 971).slice(-4)} ${String(seed + 2718 + index * 613).slice(-4)}`,
        password: `${String(seed + index * 137).slice(-3)} ${String(seed + 886 + index * 223).slice(-3)}`,
      })));
      setActiveIssued(0);
      setPaying(false);
      setSuccess(true);
    }, 900);
  };
  const discountedTotal = Math.max(0, product.price * quantity - coupon);
  const balanceDeduction = useBalance && payment !== "balance" ? Math.min(accountBalance, discountedTotal) : 0;
  const payable = payment === "balance" ? discountedTotal : Math.max(0, discountedTotal - balanceDeduction);
  const originalTotal = product.originalPrice * quantity;

  return (
    <section className="checkout-page animate-rise">
      <header className="checkout-topbar"><button onClick={onBack}>‹</button><div><span>ORDER CHECKOUT</span><b>确认订单</b></div><button>•••</button></header>
      <div className="checkout-scroll">
        <section className="checkout-card">
          <div className={`checkout-gift ${product.tone}`}><span>四季礼遇</span><b>{product.name}</b><em>{product.tag}</em></div>
          <div className="checkout-card-info"><div><h2>{product.name}</h2><p>支付成功后可选择实体卡或线上虚拟卡</p></div><strong>¥{product.price}</strong></div>
          <div className="quantity-row">
            <div><b>购买数量</b><span>每张礼卡可独立兑换一次</span></div>
            <div className="quantity-stepper">
              <button disabled={quantity <= 1} onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
              <input value={quantity} inputMode="numeric" onChange={(event) => setQuantity(Math.min(99, Math.max(1, Number(event.target.value.replace(/\D/g, "")) || 1)))} />
              <button disabled={quantity >= 99} onClick={() => setQuantity(Math.min(99, quantity + 1))}>＋</button>
            </div>
          </div>
        </section>

        <section className="checkout-section checkout-products">
          <header><div><span>CARD INCLUDES</span><h3>礼卡包含商品</h3></div><em>四选一兑换</em></header>
          {items.map((item, index) => <article key={item.name}><div><img src={item.image} alt={item.name} loading="lazy" decoding="async" /></div><p><b>{item.name}{item.name === "阳澄湖大闸蟹" && product.name !== "金秋蟹礼卡" ? "（三公三母）" : ""}</b><span>产地直采 · 冷链配送</span></p><strong>{quantities[index]}<small>× {quantity}份</small></strong></article>)}
        </section>

        <section className="checkout-section order-options">
          <button className="option-link" onClick={() => { setInvoiceDraft(invoice); setInvoicePage(true); }}><div><b>发票</b><span>{invoice.enabled ? `${invoice.kind} · ${invoice.title || "已填写抬头"}` : "本订单可开具电子普通发票"}</span></div><em>{invoice.enabled ? "已填写" : "不开发票"} ›</em></button>
          <label className="coupon-row"><div><b>优惠券</b><span>选择本订单可用优惠</span></div><select value={coupon} onChange={(event) => setCoupon(Number(event.target.value))}><option value="88">88元减免红包</option><option value="50">企业礼遇券 - ¥50</option><option value="20">新人专享券 - ¥20</option><option value="0">不使用优惠券</option></select></label>
          <button className={`balance-deduction ${useBalance ? "active" : ""}`} onClick={() => { setUseBalance(!useBalance); if (payment === "balance") setPayment("wechat"); }}>
            <i>余</i><div><b>使用账户余额抵扣</b><span>当前余额 ¥{accountBalance.toFixed(2)} · 最多抵扣 ¥{Math.min(accountBalance, discountedTotal).toFixed(2)}</span></div><em>{useBalance ? "✓" : ""}</em>
          </button>
          <label className="remark-row"><b>订单备注</b><textarea placeholder="选填，可填写送礼需求或其他说明" maxLength={100} /></label>
        </section>

        <section className="checkout-section order-meta">
          <div><span>订单号</span><b>{orderInfo.id}</b><button onClick={() => navigator.clipboard?.writeText(orderInfo.id)}>复制</button></div>
          <div><span>生成时间</span><b>{orderInfo.time}</b></div>
          <div><span>订单状态</span><em>等待支付</em></div>
        </section>

        <section className="checkout-section payments">
          <header><div><span>PAYMENT METHOD</span><h3>选择支付方式</h3></div></header>
          <button className={payment === "balance" ? "active" : ""} onClick={() => { setPayment("balance"); setUseBalance(false); }}><i className="balance-pay">余</i><p><b>账户余额支付</b><span>可用余额 ¥{accountBalance.toFixed(2)}{discountedTotal > accountBalance ? " · 余额不足" : " · 本单可全额支付"}</span></p><em>{payment === "balance" ? "✓" : ""}</em></button>
          <button className={payment === "wechat" ? "active" : ""} onClick={() => setPayment("wechat")}><i className="wechat">微</i><p><b>微信支付</b><span>推荐使用，安全快捷</span></p><em>{payment === "wechat" ? "✓" : ""}</em></button>
          <button className={payment === "alipay" ? "active" : ""} onClick={() => setPayment("alipay")}><i className="alipay">支</i><p><b>支付宝</b><span>使用支付宝账户付款</span></p><em>{payment === "alipay" ? "✓" : ""}</em></button>
          <button className={payment === "bank" ? "active" : ""} onClick={() => setPayment("bank")}><i className="bank">银</i><p><b>银行卡支付</b><span>支持主流储蓄卡与信用卡</span></p><em>{payment === "bank" ? "✓" : ""}</em></button>
          {payment === "bank" && <div className="bank-manager">
            <div className="bank-manager-head"><b>选择已绑定银行卡</b><button onClick={() => setAddBank(true)}>＋ 添加银行卡</button></div>
            {banks.map((card) => <article className={`bound-bank ${selectedBank === card.id ? "selected" : ""}`} key={card.id} onClick={() => setSelectedBank(card.id)}>
              <i className={card.color}>银</i><p><b>{card.name}</b><span>{card.type} · 尾号 {card.tail}</span></p><em>{selectedBank === card.id ? "✓" : ""}</em><button aria-label={`删除${card.name}`} onClick={(event) => { event.stopPropagation(); setBanks(banks.filter((bank) => bank.id !== card.id)); if (selectedBank === card.id) setSelectedBank(""); }}>删除</button>
            </article>)}
            {!banks.length && <p className="no-bank">暂无已绑定银行卡，请先添加</p>}
          </div>}
        </section>
        <p className="checkout-agreement">点击确认支付即代表您同意《礼卡购买服务协议》</p>
      </div>
      <footer className="checkout-paybar"><div><span>共{quantity}张 · 应付金额 {coupon > 0 && <em>券减¥{coupon}</em>}{balanceDeduction > 0 && <em> · 余额抵扣¥{balanceDeduction.toFixed(2)}</em>}</span><p><small>¥</small>{payable.toFixed(2)}<del>¥{originalTotal}</del></p></div><button disabled={paying || (payment === "bank" && !selectedBank) || (payment === "balance" && discountedTotal > accountBalance)} onClick={confirmPay}>{paying ? "正在唤起支付…" : payment === "balance" ? `余额支付 ¥${payable.toFixed(2)}` : payable === 0 ? "确认余额抵扣" : `确认支付 ¥${payable.toFixed(2)}`}</button></footer>
      {invoicePage && <section className="invoice-page animate-rise">
        <header><button onClick={() => setInvoicePage(false)}>‹</button><div><span>INVOICE APPLICATION</span><b>开具发票</b></div><button>↗</button></header>
        <div className="invoice-scroll">
          <section className="invoice-panel">
            <button className="invoice-type"><span>发票类型 <i>i</i></span><b>电子普通发票</b><em>›</em></button>
            <div className="invoice-kind"><span>抬头类型</span><label><input type="radio" checked={invoiceDraft.kind === "个人"} onChange={() => setInvoiceDraft({...invoiceDraft, kind:"个人"})} /><i />个人或事业单位</label><label><input type="radio" checked={invoiceDraft.kind === "企业"} onChange={() => setInvoiceDraft({...invoiceDraft, kind:"企业"})} /><i />企业</label></div>
            <label className="invoice-input"><span>发票抬头</span><input value={invoiceDraft.title} onChange={(event) => setInvoiceDraft({...invoiceDraft, title:event.target.value})} placeholder={invoiceDraft.kind === "企业" ? "填写需要开具发票的企业名称" : "填写个人姓名"} /></label>
            {invoiceDraft.kind === "企业" && <label className="invoice-input"><span>税号</span><input value={invoiceDraft.taxNo} onChange={(event) => setInvoiceDraft({...invoiceDraft, taxNo:event.target.value})} placeholder="纳税人识别号" /></label>}
          </section>
          <section className="invoice-panel invoice-content-row"><span>发票内容 <i>i</i></span><label><input type="radio" checked={invoiceDraft.content === "明细"} onChange={() => setInvoiceDraft({...invoiceDraft, content:"明细"})} /><i />明细</label><label><input type="radio" checked={invoiceDraft.content === "礼卡服务"} onChange={() => setInvoiceDraft({...invoiceDraft, content:"礼卡服务"})} /><i />礼卡服务</label></section>
          <section className="invoice-panel auth-row"><div><b>电子发票授权同步设置</b><span>授权后，发票可同步至微信卡包</span></div><i>○</i></section>
          <section className="invoice-panel invoice-address">收票邮箱默认为微信绑定邮箱，开票成功后可在订单详情中查看和下载电子发票。</section>
        </div>
        <footer><button onClick={() => { setInvoice({...invoiceDraft, enabled:true}); setInvoicePage(false); }}>提交申请</button><button onClick={() => { setInvoice({...invoice, enabled:false}); setInvoicePage(false); }}>不开发票</button></footer>
      </section>}
      {addBank && <div className="bank-overlay"><section className="add-bank-sheet"><button onClick={() => setAddBank(false)}>×</button><span>ADD BANK CARD</span><h3>添加银行卡</h3><label>持卡人<input defaultValue="迎海会员" /></label><label>银行卡号<input placeholder="请输入银行卡号" /></label><label>预留手机号<input placeholder="请输入银行预留手机号" /></label><label>短信验证码<div><input placeholder="6位验证码" /><button>获取验证码</button></div></label><button className="bind-card" onClick={() => { const id=`new-${Date.now()}`; setBanks([...banks,{id,name:"中国建设银行",type:"储蓄卡",tail:"8899",color:"blue"}]); setSelectedBank(id); setAddBank(false); }}>确认绑定</button><p>绑定银行卡即表示同意《银行卡快捷支付服务协议》</p></section></div>}
      {success && <div className="card-success-overlay"><section className="card-success-modal fulfillment-modal">
        <span className="success-en">PURCHASE SUCCESSFUL</span>
        <div className="success-check">✓</div>
        <h2>购卡成功</h2>
        <p className="success-sub">请选择 {issuedCards.length} 张{product.name}的领取方式</p>
        <div className="fulfillment-options">
          <button className={deliveryChoice === "physical" ? "active" : ""} onClick={() => setDeliveryChoice("physical")}><i>邮</i><p><b>邮寄实体卡</b><span>调用收货地址，制作后快递寄出</span></p><em>{deliveryChoice === "physical" ? "✓" : ""}</em></button>
          <button className={deliveryChoice === "virtual" ? "active" : ""} onClick={() => setDeliveryChoice("virtual")}><i>卡</i><p><b>线上虚拟卡</b><span>立即存入“我的礼品卡”</span></p><em>{deliveryChoice === "virtual" ? "✓" : ""}</em></button>
        </div>
        <p className="fulfillment-tip">领取方式确认后不可自行更改，如需帮助请联系客服。</p>
        <button className="success-close" disabled={!deliveryChoice} onClick={() => {
          if (deliveryChoice === "physical") {
            setSelectedAddressId((addresses.find((address) => address.primary) ?? addresses[0])?.id ?? null);
            setAddressConfirm(true);
          } else {
            onPaid(issuedCards.map((card, index) => ({
              id: `${orderInfo.id}-${index}`, productName: product.name, tone: product.tone,
              number: card.number, password: card.password, status: "未使用", boughtAt: orderInfo.time,
            })));
          }
        }}>确认领取方式</button>

        {addressConfirm && <div className="address-confirm-layer"><section>
          <header><div><span>DELIVERY ADDRESS</span><h3>确认实体卡收货信息</h3></div><button onClick={() => setAddressConfirm(false)}>×</button></header>
          {selectedAddressId ? (() => {
            const selectedAddress = addresses.find((address) => address.id === selectedAddressId);
            return selectedAddress && <article className="selected-delivery-address"><div><b>{selectedAddress.name}</b><span>{selectedAddress.phone}</span></div><p>{selectedAddress.text}</p><button onClick={() => setAddressExpanded(!addressExpanded)}>修改</button></article>;
          })() : <p className="no-delivery-address">尚未设置收货地址，请新增地址后继续。</p>}
          {addressExpanded && <div className="address-choice-list">
            {addresses.map((address) => <button className={selectedAddressId === address.id ? "active" : ""} key={address.id} onClick={() => { setSelectedAddressId(address.id); setAddressExpanded(false); }}><p><b>{address.name}</b><span>{address.phone}</span>{address.primary && <em>默认</em>}</p><small>{address.text}</small></button>)}
            <button className="add-other-address" onClick={() => setAddingAddress(true)}>＋ 新增其他地址</button>
          </div>}
          {!addresses.length && <button className="add-other-address standalone" onClick={() => setAddingAddress(true)}>＋ 新增收货地址</button>}
          <button className="confirm-delivery" disabled={!selectedAddressId} onClick={onPhysicalSuccess}>确认邮寄到此地址</button>
          {addingAddress && <div className="new-address-form"><h4>新增其他地址</h4><input value={newAddress.name} onChange={(e) => setNewAddress({...newAddress, name:e.target.value})} placeholder="收货人姓名" /><input value={newAddress.phone} onChange={(e) => setNewAddress({...newAddress, phone:e.target.value})} placeholder="联系电话" /><textarea value={newAddress.text} onChange={(e) => setNewAddress({...newAddress, text:e.target.value})} placeholder="省市区及详细地址" /><div><button onClick={() => setAddingAddress(false)}>取消</button><button disabled={!newAddress.name || !newAddress.phone || !newAddress.text} onClick={() => { const address = { id: Date.now(), ...newAddress, primary: !addresses.length }; setAddresses([...addresses, address]); setSelectedAddressId(address.id); setAddingAddress(false); setAddressExpanded(false); }}>保存并使用</button></div></div>}
        </section></div>}
      </section></div>}
    </section>
  );
}

function SubTitle({ en, title, desc }: { en: string; title: string; desc: string }) {
  return <header className="sub-title"><span>{en}</span><h2>{title}</h2><p>{desc}</p></header>;
}

function Redeem({ city, onDone, onBack }: { city: string; onDone: () => void; onBack?: () => void }) {
  const [show, setShow] = useState(false);
  const [mode] = useState<"delivery" | "pickup">("delivery");
  const [keyword, setKeyword] = useState("");
  const [booking, setBooking] = useState<string | null>(null);
  const stores = [
    { city: "上海", area: "浦东新区", name: "四季礼遇·浦东仓储站", address: "上海市浦东新区华夏东路685号", distance: "距您 320m", hours: "09:00–19:00", stock: "支持全品类礼卡" },
    { city: "上海", area: "浦东新区", name: "幸福吃道社区提货点", address: "上海市浦东新区御青路1009号", distance: "距您 860m", hours: "09:30–20:30", stock: "支持生鲜、水果礼卡" },
    { city: "上海", area: "徐汇区", name: "徐汇四季鲜礼站", address: "上海市徐汇区漕溪北路88号", distance: "距您 2.3km", hours: "10:00–20:00", stock: "支持礼盒与茶礼卡" },
    { city: "杭州", area: "萧山区", name: "杭州融丰心意广场店", address: "杭州市萧山区金城路546号", distance: "距您 460m", hours: "10:00–18:00", stock: "支持预约调货" },
    { city: "杭州", area: "萧山区", name: "融丰荣星中心仓", address: "杭州市萧山区金惠路与萧邮路交叉口", distance: "距您 1.6km", hours: "08:30–17:30", stock: "企业客户专属仓" },
    { city: "杭州", area: "滨江区", name: "滨江星光自提点", address: "杭州市滨江区江南大道228号", distance: "距您 3.1km", hours: "09:30–19:30", stock: "支持全品类礼卡" },
    { city: "苏州", area: "工业园区", name: "金鸡湖四季礼遇站", address: "苏州市工业园区苏州大道西118号", distance: "距您 580m", hours: "09:00–19:00", stock: "支持生鲜、蟹礼卡" },
    { city: "苏州", area: "姑苏区", name: "姑苏心意提货点", address: "苏州市姑苏区人民路1588号", distance: "距您 2.0km", hours: "10:00–20:00", stock: "支持全品类礼卡" },
    { city: "南京", area: "建邺区", name: "河西四季鲜礼仓", address: "南京市建邺区江东中路188号", distance: "距您 740m", hours: "09:00–18:00", stock: "支持企业福利礼卡" },
    { city: "南京", area: "秦淮区", name: "新街口礼遇站", address: "南京市秦淮区中山南路79号", distance: "距您 2.4km", hours: "10:00–20:30", stock: "支持全品类礼卡" },
    { city: "宁波", area: "鄞州区", name: "鄞州四季仓储站", address: "宁波市鄞州区宁穿路1811号", distance: "距您 1.1km", hours: "09:00–18:30", stock: "支持生鲜、水果礼卡" },
    { city: "无锡", area: "滨湖区", name: "太湖礼遇自提点", address: "无锡市滨湖区梁溪路35号", distance: "距您 1.4km", hours: "09:30–19:00", stock: "支持全品类礼卡" },
  ];
  const cityStores = stores.filter((store) => store.city === city);
  const visibleStores = cityStores.filter((store) => `${store.name}${store.address}`.includes(keyword));
  const currentArea = cityStores[0]?.area ?? "中心城区";
  return (
    <div className="subpage animate-rise">
      {onBack && <button className="redeem-back" onClick={onBack} aria-label="返回礼品卡页面">‹</button>}
      <SubTitle en="REDEEM YOUR GIFT" title="在线提货" desc="验证礼卡后为您安排配送到家" />
      {mode === "delivery" ? <>
        <section className="redeem-card">
          <div className="mini-seal">兑</div>
          <label>礼卡号码<input placeholder="请输入16位卡号" /></label>
          <label>卡券密码<div className="password"><input type={show ? "text" : "password"} placeholder="请输入卡券密码" /><button onClick={() => setShow(!show)}>{show ? "隐藏" : "显示"}</button></div></label>
          <div className="verify"><span>≡</span><p>拖动滑块完成验证</p><i>›</i></div>
          <button className="gold-btn" onClick={onDone}>验证并提货</button>
        </section>
        <section className="tips">
        <div className="tips-title">
          <span>REDEMPTION NOTICE</span>
          <h3>提货公告</h3>
        </div>
        <ol>
          <li>请先输入礼者礼品册编号和密码，进行有效性的验证。</li>
          <li>通过验证后，请详细输入并核对您的详细收货信息，包括收货人姓名、电话和地址；因收货信息错误而造成商品损腐，将无法享受售后保障和服务。</li>
          <li>您在系统中预约的是发货时间，不是到货时间，我们将在24–72小时内为您配送到家。</li>
          <li>商品送达后，如遇包裹明显破损、商品质量问题，请拒绝签收，并现场立即联系我们为您解决。</li>
          <li>如果您在3日内还未收到商品，请与我们的客服直接联系为您查询。</li>
          <li>为保证享受到新鲜美味，请尽早食用。</li>
          <li>如遇节假日，建议错峰提货，祝购物愉快。</li>
          <li>提货成功后，对应的卡密即刻失效；登记快递提货的，您的卡券已同时注销作废。</li>
        </ol>
        <div className="notice-service">
          <i>礼</i>
          <div><b>需要帮助？</b><span>在线客服为您解答提货与配送问题</span></div>
          <button>联系客服</button>
        </div>
        </section>
      </> : (
        <section className="pickup-view animate-rise">
          <label className="store-search"><span>⌕</span><input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索附近仓储站点" /><button onClick={() => setKeyword("")}>{keyword ? "清除" : "附近"}</button></label>
          <div className="location-note"><i>⌖</i><p><b>当前定位：{city}市{currentArea}</b><span>已为您展示{city}附近可预约的提货站点</span></p><button>已定位</button></div>
          <div className="pickup-heading"><div><span>NEARBY PICKUP</span><h3>附近自提点</h3></div><em>{visibleStores.length} 个站点</em></div>
          <div className="store-list">
            {visibleStores.map((store, index) => (
              <article className="store-card" key={store.name}>
                <div className="store-top">
                  <div className={`store-mark m${index}`}>仓</div>
                  <div><h4>{store.name}</h4><p>{store.address}</p><div><span>{store.distance}</span><span>{store.hours}</span></div></div>
                </div>
                <p className="store-stock">✓ {store.stock}</p>
                <div className="store-actions">
                  <button onClick={() => window.alert(`正在打开地图：${store.address}`)}><i>⌖</i>导航</button>
                  <button onClick={() => window.alert(`咨询电话：400-668-8899`)}><i>☏</i>咨询</button>
                  <button className="book" onClick={() => setBooking(store.name)}><i>□</i>预约提货</button>
                </div>
              </article>
            ))}
          </div>
          {!visibleStores.length && <div className="no-store">未找到相关站点，请更换关键词</div>}
          <div className="pickup-tip"><b>自提小贴士</b><p>预约成功后请携带有效卡券和预约手机号到店。站点备货完成前，请勿提前前往。</p></div>
        </section>
      )}
      {booking && (
        <div className="pickup-overlay">
          <section className="booking-sheet">
            <button className="booking-close" onClick={() => setBooking(null)}>×</button>
            <span>STORE PICKUP</span><h3>预约到店提货</h3>
            <div className="chosen-store"><i>仓</i><p><b>{booking}</b><small>提交后站点将为您预留商品</small></p></div>
            <label>礼卡号码<input placeholder="请输入礼卡号码" /></label>
            <label>预约手机号<input placeholder="请输入预约手机号" /></label>
            <label>预约日期<select defaultValue="2026-07-28"><option value="2026-07-28">7月28日（明天）</option><option value="2026-07-29">7月29日</option><option value="2026-07-30">7月30日</option></select></label>
            <label>到店时段<select><option>09:00–12:00</option><option>12:00–15:00</option><option>15:00–18:00</option></select></label>
            <button className="gold-btn" onClick={() => { setBooking(null); onDone(); }}>确认预约提货</button>
          </section>
        </div>
      )}
    </div>
  );
}

function MessageCenter({ messages, setMessages }: { messages: AppMessage[]; setMessages: Dispatch<SetStateAction<AppMessage[]>> }) {
  const messageTypes = ["全部", "订单", "物流", "佣金", "活动"] as const;
  const [filter, setFilter] = useState<(typeof messageTypes)[number]>("全部");
  const visible = messages.filter((message) => filter === "全部" || message.type === filter);
  const unreadCount = messages.filter((message) => message.unread).length;

  return <div className="message-center subpage animate-rise">
    <SubTitle en="MESSAGE CENTER" title="消息" desc="订单、收益与活动动态集中查看" />
    <section className="message-summary"><div><strong>{unreadCount}</strong><span>条未读消息</span></div><button onClick={() => setMessages((current) => current.map((message) => ({...message, unread:false})))}>全部已读</button></section>
    <div className="message-tabs">{messageTypes.map((type) => <button className={filter === type ? "active" : ""} key={type} onClick={() => setFilter(type)}>{type}</button>)}</div>
    <section className="message-list">{visible.map((message) => {
      return <button className={`message-item ${message.unread ? "unread" : ""}`} key={message.id} onClick={() => setMessages((current) => current.map((item) => item.id === message.id ? {...item, unread:false} : item))}>
        <i className={message.tone}>{message.icon}</i><div><header><b>{message.title}</b><time>{message.time}</time></header><p>{message.text}</p><span>{message.type}通知</span></div>
      </button>;
    })}</section>
  </div>;
}

function ShareCenter({ flash }: { flash: (message: string) => void }) {
  const [panel, setPanel] = useState<"poster" | "withdraw" | "orders" | "ledger" | "team" | "direct" | "secondary" | "monthOrders" | null>(null);
  const [amount, setAmount] = useState("500");
  const [partnerKeyword, setPartnerKeyword] = useState("");
  const [orderKeyword, setOrderKeyword] = useState("");
  const [dateFrom, setDateFrom] = useState("2026-07-01");
  const [dateTo, setDateTo] = useState("2026-07-27");
  const link = "https://gift.example.cn/miniapp?ref=UID88002186";
  const orders = [
    ["TG202607270186", "直属客户 · 陈先生", "四季臻鲜礼卡 ×2", "¥47.04", "已结算"],
    ["TG202607260092", "二级客户 · 林女士", "金秋蟹礼卡 ×1", "¥11.94", "待结算"],
    ["TG202607250311", "直属客户 · 周先生", "盛夏果香礼卡 ×3", "¥44.16", "已结算"],
  ];
  const sortedOrders = [...orders].sort((a, b) => {
    const priority = (status: string) => status === "待结算" ? 0 : 1;
    const statusDiff = priority(a[4]) - priority(b[4]);
    return statusDiff || b[0].localeCompare(a[0], "zh-CN");
  });
  const directPartners = [
    ["陈先生", "UID 882016", "个人推广员", "8张", "¥4,680.00", "¥188.40", "2026-07-03"],
    ["林女士", "UID 883728", "企业推广员", "12张", "¥7,056.00", "¥282.24", "2026-06-18"],
    ["周先生", "UID 886631", "个人推广员", "5张", "¥2,940.00", "¥117.60", "2026-06-02"],
    ["杭州鲜礼", "UID 887219", "渠道合伙人", "36张", "¥18,860.00", "¥754.40", "2026-05-21"],
  ];
  const secondaryPartners = [
    ["王女士", "UID 891026", "个人推广员", "4张", "¥2,352.00", "¥47.04", "2026-07-12"],
    ["赵先生", "UID 892318", "个人推广员", "7张", "¥3,986.00", "¥79.72", "2026-07-08"],
    ["苏州礼选", "UID 896680", "企业推广员", "18张", "¥9,860.00", "¥197.20", "2026-06-25"],
  ];
  const monthOrderRows = [
    ["TG202607270186", "2026-07-27 14:28", "陈先生", "UID 882016", "四季臻鲜礼卡", "2张", "¥1,176.00", "一级", "¥47.04", "已结算"],
    ["TG202607260092", "2026-07-26 11:06", "王女士", "UID 891026", "金秋蟹礼卡", "1张", "¥398.00", "二级", "¥7.96", "待结算"],
    ["TG202607250311", "2026-07-25 09:30", "林女士", "UID 883728", "盛夏果香礼卡", "3张", "¥1,104.00", "一级", "¥44.16", "已结算"],
    ["TG202607180228", "2026-07-18 17:20", "赵先生", "UID 892318", "东方茗礼", "1张", "¥688.00", "二级", "¥13.76", "已退款"],
  ];
  const visiblePartners = (panel === "secondary" ? secondaryPartners : directPartners).filter((row) => `${row[0]}${row[1]}`.toLowerCase().includes(partnerKeyword.trim().toLowerCase()));
  const visibleMonthOrders = monthOrderRows.filter((row) => {
    const day = row[1].slice(0, 10);
    const matchesKeyword = `${row[0]}${row[2]}${row[3]}`.toLowerCase().includes(orderKeyword.trim().toLowerCase());
    return matchesKeyword && day >= dateFrom && day <= dateTo;
  });
  return (
    <div className="subpage animate-rise">
      <SubTitle en="SHARE & EARN" title="推广中心" desc="分享一份心意，收获双重礼遇" />
      <section className="income-card"><span>可提现佣金</span><h2>¥ 1,286.50</h2><button onClick={() => setPanel("withdraw")}>申请提现</button><div><p><b>¥ 368.00</b><small>待结算</small></p><p><b>¥ 8,420</b><small>累计收益</small></p><p><b>¥ 6,800</b><small>累计提现</small></p></div></section>
      <section className="data-row"><button onClick={() => setPanel("direct")}><b>42</b><span>直属伙伴</span><em>查看 ›</em></button><button onClick={() => setPanel("secondary")}><b>168</b><span>二级伙伴</span><em>查看 ›</em></button><button onClick={() => setPanel("monthOrders")}><b>27</b><span>本月订单</span><em>查看 ›</em></button></section>
      <button className="poster" onClick={() => setPanel("poster")}><i>礼</i><div><b>生成专属推广海报</b><span>分享海报或复制专属链接</span></div><em>→</em></button>
      <section className="menu-list"><button onClick={() => setPanel("orders")}>推广订单明细 <span>3 笔 →</span></button><button onClick={() => setPanel("ledger")}>佣金流水 <span>→</span></button><button onClick={() => setPanel("team")}>我的推广团队 <span>210 人 →</span></button></section>
      {panel && <div className="center-page animate-rise">
        <header><button onClick={() => setPanel(null)}>‹</button><div><span>PROMOTION CENTER</span><b>{panel === "poster" ? "推广分享" : panel === "withdraw" ? "佣金提现" : panel === "orders" ? "推广订单" : panel === "ledger" ? "佣金流水" : panel === "direct" ? "直属伙伴" : panel === "secondary" ? "二级伙伴" : panel === "monthOrders" ? "本月推广订单" : "推广团队"}</b></div><i /></header>
        <div className="center-scroll">
          {panel === "poster" && <><section className="share-poster"><span>四 季 臻 选 · 好 礼 相 赠</span><h2>把四季珍味<br />分享给重要的人</h2><div className="poster-qr"><img src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(link)}`} alt="专属推广二维码" /></div><p>扫码选购礼卡 · 推广人 UID 88002186</p></section><section className="link-box"><span>{link}</span><button onClick={() => { navigator.clipboard?.writeText(link); flash("专属推广链接已复制"); }}>复制链接</button></section><button className="wide-gold" onClick={() => flash("推广海报已生成，可长按保存或转发")}>保存并分享海报</button><p className="rule-note">客户通过您的链接进入并完成首笔购卡支付后绑定关系，绑定后永久保留；您可享直属及二级团队佣金。</p></>}
          {panel === "withdraw" && <><section className="withdraw-balance"><span>本次可提现</span><b>¥ 1,286.50</b></section><label className="form-cell">提现金额<div><span>¥</span><input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} /><button onClick={() => setAmount("1286.50")}>全部</button></div></label><section className="withdraw-method"><b>到账账户</b><p><i>微</i><span>微信零钱<small>实名认证用户 · 预计1–2个工作日到账</small></span><em>✓</em></p></section><button className="wide-gold" onClick={() => { if (!amount || Number(amount) <= 0 || Number(amount) > 1286.5) return flash("请输入正确的提现金额"); setPanel(null); flash(`提现申请已提交，预计到账 ¥${Number(amount).toFixed(2)}`); }}>确认提现</button><p className="rule-note">单次最低提现100元。申请提交后进入审核，审核通过后佣金将汇入所选账户。</p></>}
          {panel === "orders" && <><section className="report-summary order-overview"><div><span>本月订单</span><b>27<small>笔</small></b></div><div><span>累计订单</span><b>236<small>笔</small></b></div><div><span>待结订单</span><b>8<small>笔</small></b></div></section><div className="ledger-heading"><b>订单明细</b><span>待结算优先显示</span></div><DetailRows rows={sortedOrders} /></>}
          {panel === "ledger" && <><section className="report-summary ledger-summary"><div><span>待结算</span><b>¥368.00</b></div><div><span>累计收益</span><b>¥8,420.00</b></div><div><span>累计提现</span><b>¥6,800.00</b></div></section><div className="ledger-heading"><b>流水明细</b><span>按时间从新到旧</span></div><DetailRows rows={[["2026-07-27 14:28","订单佣金","四季臻鲜礼卡","+¥47.04","已结算"],["2026-07-26 11:06","二级佣金","金秋蟹礼卡","+¥11.94","待结算"],["2026-07-20 09:30","佣金提现","微信零钱","-¥800.00","已到账"]]} /></>}
          {panel === "team" && <><section className="team-total"><span>我的推广团队总人数</span><b>211<small>人</small></b><p>包含本人 1 人、一级伙伴 42 人、二级伙伴 168 人</p></section><section className="team-summary"><div><b>42</b><span>一级伙伴</span></div><div><b>168</b><span>二级伙伴</span></div></section><DetailRows rows={[["UID 882016","陈先生","一级伙伴","本月 8 单","贡献 ¥188"],["UID 883728","林女士","一级伙伴","本月 5 单","贡献 ¥96"],["UID 886631","周先生","二级伙伴","本月 3 单","贡献 ¥42"]]} /></>}
          {(panel === "direct" || panel === "secondary") && <>
            <section className="report-summary"><div><span>{panel === "direct" ? "直属伙伴总数" : "二级伙伴总数"}</span><b>{panel === "direct" ? "42" : "168"}人</b></div><div><span>累计贡献佣金</span><b>{panel === "direct" ? "¥5,682.40" : "¥2,737.60"}</b></div></section>
            <label className="report-search"><span>⌕</span><input value={partnerKeyword} onChange={(event) => setPartnerKeyword(event.target.value)} placeholder="输入姓名或UID搜索" />{partnerKeyword && <button onClick={() => setPartnerKeyword("")}>清除</button>}</label>
            <p className="report-count">共找到 {visiblePartners.length} 位伙伴 · 表格可左右滑动</p>
            <MobileReportTable headers={["姓名","UID","开卡类型","开卡数量","累计消费","累计佣金","加入时间"]} rows={visiblePartners} />
          </>}
          {panel === "monthOrders" && <>
            <section className="report-summary"><div><span>筛选订单</span><b>{visibleMonthOrders.length}笔</b></div><div><span>订单成交额</span><b>¥3,366.00</b></div><div><span>预计佣金</span><b>¥112.92</b></div></section>
            <section className="date-filter"><div><label>开始日期<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} /></label><i>至</i><label>结束日期<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} /></label></div><nav><button onClick={() => { setDateFrom("2026-07-01"); setDateTo("2026-07-27"); }}>本月</button><button onClick={() => { setDateFrom("2026-07-21"); setDateTo("2026-07-27"); }}>近7天</button><button onClick={() => { setDateFrom("2026-06-28"); setDateTo("2026-07-27"); }}>近30天</button></nav></section>
            <label className="report-search"><span>⌕</span><input value={orderKeyword} onChange={(event) => setOrderKeyword(event.target.value)} placeholder="搜索订单号、用户姓名或UID" />{orderKeyword && <button onClick={() => setOrderKeyword("")}>清除</button>}</label>
            <p className="report-count">当前范围：{dateFrom} 至 {dateTo} · 表格可左右滑动</p>
            <MobileReportTable headers={["订单号","下单时间","客户姓名","客户UID","礼卡","数量","实付金额","佣金层级","佣金","状态"]} rows={visibleMonthOrders} />
          </>}
        </div>
      </div>}
    </div>
  );
}

function MobileReportTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return <section className="mobile-report"><table><thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row[0]}-${index}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table>{!rows.length && <p>没有找到符合条件的数据</p>}</section>;
}

function DetailRows({ rows }: { rows: string[][] }) {
  return <section className="detail-rows">{rows.map((row, index) => <article key={`${row[0]}-${index}`}><div><b>{row[1]}</b><span>{row[0]}</span><small>{row[2]}</small></div><p><strong>{row[3]}</strong><em>{row[4]}</em></p></article>)}</section>;
}

function Mine({ cards, addresses, setAddresses, flash, onEnterprise }: {
  cards: OwnedCard[];
  addresses: Address[];
  setAddresses: Dispatch<SetStateAction<Address[]>>;
  flash: (message: string) => void;
  onEnterprise: () => void;
}) {
  const [panel, setPanel] = useState<"vip" | "cards" | "orders" | "records" | "addresses" | "coupons" | "settings" | "service" | null>(null);
  const [activeCard, setActiveCard] = useState<OwnedCard | null>(null);
  const [couponCategory, setCouponCategory] = useState<"全部" | "商城" | "礼品卡">("全部");
  const [vipSlide, setVipSlide] = useState(2);
  const [orderFilter, setOrderFilter] = useState("全部");
  const [profileDraft, setProfileDraft] = useState({ nickname: "迎海会员", phone: "13866886688", gender: "男", birthday: "1990-08-18", email: "member@example.com" });
  const [walletBalance, setWalletBalance] = useState(3680);
  const [walletAction, setWalletAction] = useState<"recharge" | "withdraw" | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState(200);
  const [rechargePayment, setRechargePayment] = useState<"wechat" | "alipay" | "bank">("wechat");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawPassword, setWithdrawPassword] = useState("");
  const [withdrawConfirmed, setWithdrawConfirmed] = useState(false);
  const vipCarouselRef = useRef<HTMLDivElement>(null);
  const vipSpent = 12860;
  const vipLevels = [
    { level: "VIP 1", min: 0, next: 3000, discount: "购物95折", perks: ["生日月专享券", "每月1张运费券", "会员客服"] },
    { level: "VIP 2", min: 3000, next: 10000, discount: "购物92折", perks: ["每月20元会员券", "2张运费券", "售后优先处理"] },
    { level: "VIP 3", min: 10000, next: 30000, discount: "购物88折", perks: ["商城与礼卡会员价", "每月50元会员券", "专属客服"] },
    { level: "VIP 4", min: 30000, next: 80000, discount: "购物85折", perks: ["新品优先购", "每月100元会员券", "全年免运6次"] },
    { level: "VIP 5", min: 80000, next: 200000, discount: "购物8折", perks: ["全年会员折扣", "节庆臻礼", "一对一礼赠顾问"] },
  ];
  const couponAssets = [
    { id: 1, amount: 88, name: "礼卡减免红包", category: "礼品卡", threshold: "满388元可用", source: "开屏红包活动", expires: "2026-08-03", status: "可使用" },
    { id: 2, amount: 50, name: "商城生鲜券", category: "商城", threshold: "满299元可用", source: "会员充值活动", expires: "2026-08-31", status: "可使用" },
    { id: 3, amount: 20, name: "全场通用券", category: "通用", threshold: "满199元可用", source: "新会员礼遇", expires: "2026-09-15", status: "可使用" },
    { id: 4, amount: 30, name: "水果品类券", category: "商城", threshold: "限水果分类满168元", source: "夏日鲜果活动", expires: "2026-08-18", status: "可使用" },
    { id: 5, amount: 100, name: "企业礼卡券", category: "礼品卡", threshold: "指定礼卡满1000元", source: "企业客户活动", expires: "2026-07-25", status: "已过期" },
  ];
  const visibleCoupons = couponAssets.filter((coupon) => couponCategory === "全部" || coupon.category === couponCategory || coupon.category === "通用");
  const memberOrders = [
    { id:"GK20260728182631", status:"待付款", name:"盛夏果香礼卡", spec:"线上虚拟卡", qty:1, amount:"¥368.00", time:"今天 15:26", actions:["取消订单","修改地址","继续支付"] },
    { id:"SX20260728110618", status:"待发货", name:"猫山王榴莲 5斤装", spec:"冷链配送", qty:2, amount:"¥398.00", time:"今天 11:06", actions:["修改地址","催发货","申请退款"] },
    { id:"GK20260727108368", status:"待收货", name:"金秋蟹礼卡实体卡", spec:"顺丰速运 SF1388266688", qty:1, amount:"¥310.00", time:"昨天 10:18", actions:["查看物流","延长收货","确认收货"] },
    { id:"SX20260725152986", status:"已完成", name:"智利3J车厘子 5斤", spec:"冷链配送", qty:1, amount:"¥168.00", time:"07月25日", actions:["查看物流","申请售后","再次购买","评价"] },
    { id:"GK20260722113820", status:"退款/售后", name:"东方茗礼", spec:"退款申请审核中", qty:1, amount:"¥688.00", time:"07月22日", actions:["查看进度","补充凭证","联系客服"] },
    { id:"SX20260718102866", status:"已取消", name:"阳澄湖大闸蟹礼盒", spec:"用户取消", qty:1, amount:"¥398.00", time:"07月18日", actions:["删除订单","再次购买"] },
  ];
  const visibleMemberOrders = memberOrders.filter((order) => orderFilter === "全部" || order.status === orderFilter);
  const titles = { vip: "我的VIP", cards: "我的礼品卡", orders: "我的订单", records: "提货记录", addresses: "我的地址", coupons: "我的优惠券", settings: "账号设置", service: "在线客服" };
  useEffect(() => {
    if (panel === "vip" && vipCarouselRef.current) vipCarouselRef.current.scrollTo({ left: vipCarouselRef.current.clientWidth * vipSlide, behavior: "smooth" });
  }, [panel, vipSlide]);
  return (
    <div className="subpage animate-rise">
      <section className="profile"><div className="avatar">礼</div><div><h2>{profileDraft.nickname}</h2><p>VIP卡号 8800 2186</p></div><button onClick={() => setPanel("settings")}>设置</button></section>
      <section className="balance-card"><div><span>我的余额</span><b>¥ {walletBalance.toFixed(2)}</b><small>可用于商城、礼品卡及订单抵扣</small></div><aside><button onClick={() => setWalletAction("recharge")}>充值</button><button onClick={() => { setWithdrawAmount(""); setWithdrawPassword(""); setWithdrawConfirmed(false); setWalletAction("withdraw"); }}>提现</button></aside></section>
      <section className="wallet member-assets-row"><button onClick={() => setPanel("vip")}><span>我的VIP</span><b>VIP 3 · 88折</b></button><button onClick={() => setPanel("coupons")}><span>我的优惠券</span><b>4 张可用</b></button></section>
      <section className="order-panel"><h3>我的订单 <button onClick={() => { setOrderFilter("全部"); setPanel("orders"); }}>全部订单 →</button></h3><div><button onClick={() => { setOrderFilter("待付款"); setPanel("orders"); }}><i>付</i>待付款<em>1</em></button><button onClick={() => { setOrderFilter("待发货"); setPanel("orders"); }}><i>发</i>待发货<em>1</em></button><button onClick={() => { setOrderFilter("待收货"); setPanel("orders"); }}><i>收</i>待收货<em>1</em></button><button onClick={() => { setOrderFilter("退款/售后"); setPanel("orders"); }}><i>售</i>退款/售后<em>1</em></button></div></section>
      <section className="menu-list"><button onClick={() => setPanel("vip")}>我的VIP <span>VIP 3 · 88折 →</span></button><button onClick={() => setPanel("coupons")}>我的优惠券 <span>4 张可用 →</span></button><button onClick={() => setPanel("cards")}>我的礼品卡 <span>{cards.length} 张 →</span></button><button onClick={() => setPanel("records")}>提货记录 <span>2 条 →</span></button><button onClick={() => setPanel("addresses")}>我的地址 <span>{addresses.length} 个 →</span></button><button onClick={onEnterprise}>企业团购 <span>→</span></button><button onClick={() => setPanel("service")}>在线客服 <span>→</span></button></section>
      {panel && <div className="center-page animate-rise">
        <header><button onClick={() => setPanel(null)}>‹</button><div><span>MEMBER CENTER</span><b>{titles[panel]}</b></div><i /></header>
        <div className="center-scroll">
          {panel === "vip" && <div className="vip-center saas-vip">
            <section className="saas-vip-heading"><h2>我的 VIP</h2><p>当前停留在 VIP 3，左右滑动可查看全部会员等级</p></section>
            <div className="vip-benefit-carousel" ref={vipCarouselRef} onScroll={(event) => setVipSlide(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}>
              {vipLevels.map((tier, index) => <article className={index === 2 ? "current-tier" : ""} key={tier.level}>
                <span>{index === 2 ? "当前等级" : "VIP 等级"}</span>
                <h3>{tier.level}</h3>
                <strong>{tier.discount}</strong>
                <p className="vip-target">{index === 2 ? `累计消费 ¥${vipSpent.toLocaleString("zh-CN")}，距离 VIP 4 还差 ¥${(30000 - vipSpent).toLocaleString("zh-CN")}` : `累计消费满 ¥${tier.min.toLocaleString("zh-CN")}`}</p>
                {index === 2 && <><div className="vip-progress"><i style={{width:`${Math.min(100, (vipSpent - 10000) / (30000 - 10000) * 100)}%`}} /></div><small className="vip-progress-label"><b>¥10,000</b><b>¥30,000</b></small></>}
                <ul>{tier.perks.map((perk) => <li key={perk}>{perk}</li>)}</ul>
              </article>)}
            </div>
            <div className="saas-vip-dots">{vipLevels.map((tier,index) => <button aria-label={`查看${tier.level}`} className={vipSlide === index ? "active" : ""} key={tier.level} onClick={() => setVipSlide(index)} />)}</div>
            <p className="vip-swipe-hint">当前等级已高亮 · 向左查看已解锁等级，向右查看更高等级</p>
          </div>}
          {panel === "cards" && <><p className="page-tip">购卡成功后会自动保存至此。点击卡片可查看二维码、账号和密码。</p><section className="owned-card-list">{cards.map((card) => <button key={card.id} onClick={() => setActiveCard(card)}><div className={`owned-card-art ${card.tone}`}><span>SEASONS GIFT</span><b>{card.productName}</b><em>{card.status}</em></div><p><span>卡号 {card.number}</span><small>购买于 {card.boughtAt}</small></p><strong>查看卡券 ›</strong></button>)}</section></>}
          {panel === "orders" && <><div className="order-tabs full-tabs">{["全部","待付款","待发货","待收货","已完成","退款/售后"].map((status) => <button className={orderFilter === status ? "active" : ""} key={status} onClick={() => setOrderFilter(status)}>{status}</button>)}</div><section className="member-orders rich-orders">{visibleMemberOrders.map((order) => <article key={order.id}><header><span>{order.time} · {order.id}</span><em className={order.status === "已完成" ? "green-text" : order.status === "退款/售后" ? "refund-text" : ""}>{order.status}</em></header><div className="order-product"><i>{order.id.startsWith("GK") ? "礼" : "鲜"}</i><p><b>{order.name}</b><span>{order.spec}</span></p><strong>×{order.qty}</strong></div><p>共{order.qty}件　实付 <b>{order.amount}</b></p><div>{order.actions.map((action,index) => <button className={index === order.actions.length - 1 && ["继续支付","确认收货","评价"].includes(action) ? "primary-action" : ""} key={action} onClick={() => flash(action === "查看物流" ? "物流详情已打开：商品正在运输中" : `${action}功能已打开`)}>{action}</button>)}</div></article>)}</section>{!visibleMemberOrders.length && <div className="orders-empty">当前分类暂无订单</div>}</>}
          {panel === "records" && <DetailRows rows={[["2026-07-24 10:28","四季臻鲜礼卡","猫山王榴莲 5斤","快递提货","已发货"],["2026-06-18 15:06","金秋蟹礼卡","阳澄湖大闸蟹 6只","浦东仓储站","已完成"]]} />}
          {panel === "addresses" && <><section className="address-list">{addresses.map((address) => <article key={address.id}><p><b>{address.name}</b><span>{address.phone}</span>{address.primary && <em>默认</em>}</p><div>{address.text}</div><footer><button onClick={() => setAddresses(addresses.map((item) => ({...item, primary:item.id === address.id})))}>设为默认</button><button onClick={() => flash("地址编辑功能已打开")}>编辑</button><button onClick={() => setAddresses(addresses.filter((item) => item.id !== address.id))}>删除</button></footer></article>)}</section><button className="wide-gold" onClick={() => { setAddresses([...addresses,{id:Date.now(),name:"新联系人",phone:"待完善",text:"点击编辑填写新收货地址",primary:false}]); flash("已新增地址，请点击编辑完善"); }}>＋ 新增收货地址</button></>}
          {panel === "coupons" && <><div className="coupon-category-tabs">{(["全部","商城","礼品卡"] as const).map((category) => <button className={couponCategory === category ? "active" : ""} key={category} onClick={() => setCouponCategory(category)}>{category}</button>)}</div><p className="coupon-rule-note">结算时系统会按商品范围、使用门槛和有效期筛选可用优惠券。</p><section className="coupon-list rich">{visibleCoupons.map((coupon) => <article className={coupon.status !== "可使用" ? "used" : ""} key={coupon.id}><b><small>¥</small>{coupon.amount}</b><div><h3>{coupon.name}<em>{coupon.category}</em></h3><p>{coupon.threshold}</p><small>来源：{coupon.source} · {coupon.expires}到期</small></div><button disabled={coupon.status !== "可使用"} onClick={() => flash(coupon.category === "商城" ? "已为您切换到商城，可在结算时选择此券" : "已为您切换到礼品卡，可在结算时选择此券")}>{coupon.status === "可使用" ? "去使用" : coupon.status}</button></article>)}</section></>}
          {panel === "settings" && <div className="profile-settings"><section className="profile-avatar-edit"><div>礼</div><p><b>个人资料</b><span>完善资料便于我们提供更准确的会员服务</span></p><button onClick={() => flash("头像选择器已打开")}>更换头像</button></section><section className="editable-profile"><label><span>昵称</span><input value={profileDraft.nickname} onChange={(e) => setProfileDraft({...profileDraft,nickname:e.target.value})} /></label><label><span>绑定手机号</span><input inputMode="numeric" value={profileDraft.phone} onChange={(e) => setProfileDraft({...profileDraft,phone:e.target.value.replace(/\D/g,"").slice(0,11)})} /></label><label><span>性别</span><select value={profileDraft.gender} onChange={(e) => setProfileDraft({...profileDraft,gender:e.target.value})}><option>男</option><option>女</option><option>保密</option></select></label><label><span>生日</span><input type="date" value={profileDraft.birthday} onChange={(e) => setProfileDraft({...profileDraft,birthday:e.target.value})} /></label><label><span>邮箱</span><input type="email" value={profileDraft.email} onChange={(e) => setProfileDraft({...profileDraft,email:e.target.value})} /></label><div><span>实名认证</span><b className="green-text">已认证 · 陈先生</b></div></section><button className="save-profile" onClick={() => flash("个人资料已保存")}>保存修改</button><section className="settings-list security-settings"><button onClick={() => flash("修改支付密码页面已打开")}>支付密码 <span>修改 ›</span></button><button onClick={() => flash("隐私与授权管理页面已打开")}>隐私与授权 <span>›</span></button><button onClick={() => flash("当前已是最新版本")}>关于四季礼遇 <span>V1.0 Demo ›</span></button></section></div>}
          {panel === "service" && <><section className="service-card"><i>客</i><h2>四季专属客服</h2><p>工作时间 09:00–21:00</p><button onClick={() => flash("已接入在线客服，请输入您的问题")}>进入在线咨询</button></section><section className="settings-list"><button onClick={() => flash("客服热线：400-668-8899")}>电话客服 <span>400-668-8899 ›</span></button><button onClick={() => flash("售后申请页面已打开")}>申请售后 <span>›</span></button><button onClick={() => flash("常见问题：卡券、配送、发票与退款")}>常见问题 <span>›</span></button></section></>}
        </div>
      </div>}
      {activeCard && <div className="card-viewer" onClick={() => setActiveCard(null)}><section onClick={(e) => e.stopPropagation()}><button onClick={() => setActiveCard(null)}>×</button><div className={`owned-card-art ${activeCard.tone}`}><span>SEASONS GIFT</span><b>{activeCard.productName}</b><em>{activeCard.status}</em></div><img src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(`SJLJ|${activeCard.number.replaceAll(" ","")}`)}`} alt="电子卡二维码" /><p><span>卡券账号</span><b>{activeCard.number}</b></p><p><span>卡券密码</span><b>{activeCard.password}</b></p><button className="wide-gold" onClick={() => { navigator.clipboard?.writeText(activeCard.number.replaceAll(" ","")); flash("卡券账号已复制"); }}>复制卡号</button></section></div>}
      {walletAction && <div className="wallet-action-overlay"><section className="wallet-action-sheet"><header><div><span>MEMBER WALLET</span><h3>{walletAction === "recharge" ? "余额充值" : "余额提现"}</h3></div><button onClick={() => setWalletAction(null)}>×</button></header>
        {walletAction === "recharge" ? <div className="recharge-flow"><p className="wallet-balance-tip">当前余额 <b>¥{walletBalance.toFixed(2)}</b></p><h4>选择充值档位</h4><div className="recharge-tiers">{[{amount:100,coupon:50},{amount:200,coupon:100},{amount:500,coupon:280},{amount:1000,coupon:600}].map((tier) => <button className={rechargeAmount === tier.amount ? "active" : ""} key={tier.amount} onClick={() => setRechargeAmount(tier.amount)}><b>充 ¥{tier.amount}</b><span>送 ¥{tier.coupon} 优惠券</span></button>)}</div><h4>支付方式</h4><div className="wallet-payments">{(["wechat","alipay","bank"] as const).map((method) => <button className={rechargePayment === method ? "active" : ""} key={method} onClick={() => setRechargePayment(method)}><i>{method === "wechat" ? "微" : method === "alipay" ? "支" : "银"}</i><span>{method === "wechat" ? "微信支付" : method === "alipay" ? "支付宝" : "银行卡"}</span><em>{rechargePayment === method ? "✓" : ""}</em></button>)}</div><p className="recharge-rule">充值余额实时到账，赠送优惠券同步放入【我的优惠券】；充值本金可消费或提现，赠券不可折现。</p><button className="wallet-primary" onClick={() => { const coupon = rechargeAmount === 100 ? 50 : rechargeAmount === 200 ? 100 : rechargeAmount === 500 ? 280 : 600; setWalletBalance((value) => value + rechargeAmount); setWalletAction(null); flash(`充值成功：余额到账¥${rechargeAmount}，¥${coupon}优惠券已发放`); }}>确认充值 ¥{rechargeAmount}</button></div> :
        <div className="withdraw-flow"><p className="wallet-balance-tip">可提现余额 <b>¥{walletBalance.toFixed(2)}</b></p><label><span>提现金额</span><div><b>¥</b><input value={withdrawAmount} inputMode="decimal" onChange={(e) => setWithdrawAmount(e.target.value.replace(/[^\d.]/g,""))} placeholder="最低提现10元" /><button onClick={() => setWithdrawAmount(walletBalance.toFixed(2))}>全部</button></div></label><section className="withdraw-bank"><i>银</i><p><b>招商银行储蓄卡</b><span>尾号 6688 · 预计1–2个工作日到账</span></p><em>›</em></section><label><span>支付密码</span><div><input type="password" maxLength={6} inputMode="numeric" value={withdrawPassword} onChange={(e) => setWithdrawPassword(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="请输入6位支付密码" /></div></label><p className="recharge-rule">单笔最低提现¥10.00，提交后进入财务审核；审核完成会在消息中心通知到账结果。</p><button className="wallet-primary" disabled={Number(withdrawAmount) < 10 || Number(withdrawAmount) > walletBalance || withdrawPassword.length !== 6} onClick={() => setWithdrawConfirmed(true)}>申请提现</button>{withdrawConfirmed && <div className="withdraw-confirm"><div><i>!</i><h3>确认提现信息</h3><p>提现金额 <b>¥{Number(withdrawAmount).toFixed(2)}</b></p><p>到账银行卡 <b>招商银行（6688）</b></p><span>提交后将进入审核，是否确认？</span><footer><button onClick={() => setWithdrawConfirmed(false)}>返回修改</button><button onClick={() => { setWalletBalance((value) => value - Number(withdrawAmount)); setWithdrawConfirmed(false); setWalletAction(null); flash(`提现申请已提交，¥${Number(withdrawAmount).toFixed(2)}预计1–2个工作日到账`); }}>确认提交</button></footer></div></div>}</div>}
      </section></div>}
    </div>
  );
}
