"use client";

import { useMemo, useState } from "react";
import "./admin.css";
import { OrderReadOnlyModal } from "./order-read-only-modal";

type Product = { id:string; name:string; category:string; price:number; stock:number; sales:number; status:boolean };
type Order = { id:string; user:string; scene:string; amount:number; status:string; time:string };
type SprintAdminOrder = { id:string; orderNo:string; orderStatus:string; paymentStatus:string; payableAmount:number; createdAt:string; receiverName:string; receiverPhone:string; province:string; city:string; district:string; detailAddress:string; remark?:string; items:Array<{productName:string;skuName:string;quantity:number;unitPrice:number;subtotalAmount:number}> };

const menus = [
  ["经营概览","⌂"],["商城商品","商"],["礼品卡管理","礼"],["订单中心","单"],["线上提货","提"],
  ["用户与VIP","客"],["企业团购","企"],["推广分销","推"],["资金与提现","¥"],["营销中心","券"],["消息中心","信"],["系统设置","⚙"],
];
const initialProducts:Product[] = [
  {id:"SP1001",name:"猫山王榴莲果肉 2.5kg",category:"水果",price:588,stock:126,sales:832,status:true},
  {id:"SP1002",name:"智利 3J 车厘子 5kg",category:"水果",price:398,stock:84,sales:621,status:true},
  {id:"SP1003",name:"阳澄湖大闸蟹 三公三母",category:"水产",price:468,stock:63,sales:429,status:true},
  {id:"SP1004",name:"澳洲谷饲牛排礼盒",category:"肉禽",price:328,stock:0,sales:308,status:false},
];
const orders:Order[] = [
  {id:"SC202608040218",user:"林悦",scene:"商城订单",amount:588,status:"待发货",time:"08-04 10:26"},
  {id:"LK202608040196",user:"王女士",scene:"虚拟礼品卡",amount:1176,status:"已完成",time:"08-04 09:42"},
  {id:"TH202608040181",user:"周子明",scene:"线上提货",amount:0,status:"配送中",time:"08-04 09:10"},
  {id:"QY202608030882",user:"上海澄远科技",scene:"企业团购",amount:58800,status:"待确认",time:"08-03 17:35"},
];
const cards = [
  ["LK1001","四季臻鲜礼卡","¥688","¥588","榴莲 / 大闸蟹 / 车厘子 / 红酒","在售"],
  ["LK1002","金秋蟹王卡","¥498","¥398","大闸蟹 / 海参 / 鲍鱼 / 黄鱼","在售"],
  ["LK1003","盛夏果香礼卡","¥368","¥298","榴莲 / 芒果 / 山竹 / 蓝莓","草稿"],
];
const users = [
  ["四季会员","UID 891026","VIP 3","¥3,680.00","4张","2026-08-04"],
  ["王女士","UID 892318","VIP 2","¥2,352.00","2张","2026-08-02"],
  ["上海澄远科技","UID 896680","企业VIP","¥68,860.00","18张","2026-07-28"],
];

export default function AdminPage(){
  const [active,setActive]=useState("经营概览");
  const [mobileMenu,setMobileMenu]=useState(false);
  const [products,setProducts]=useState(initialProducts);
  const [query,setQuery]=useState("");
  const [toast,setToast]=useState("");
  const [adjust,setAdjust]=useState(false);
  const [step,setStep]=useState(1);
  const [editing,setEditing]=useState<Product|null>(null);
  const [sprintOrders,setSprintOrders]=useState<SprintAdminOrder[]>([]);
  const [sprintLoading,setSprintLoading]=useState(false);
  const [sprintDetail,setSprintDetail]=useState<SprintAdminOrder|null>(null);
  const notify=(text:string)=>{setToast(text);window.setTimeout(()=>setToast(""),2200)};
  const filtered=useMemo(()=>products.filter(p=>`${p.name}${p.id}${p.category}`.includes(query)),[products,query]);
  const toggle=(id:string)=>setProducts(v=>v.map(p=>p.id===id?{...p,status:!p.status}:p));

  return <main className="admin-app">
    <aside className={`sidebar ${mobileMenu?"open":""}`}>
      <div className="admin-brand"><i>礼</i><div><b>四季礼遇</b><span>运营管理中心</span></div></div>
      <nav>{menus.map(([name,icon])=><button key={name} className={active===name?"active":""} onClick={()=>{setActive(name);setMobileMenu(false)}}><i>{icon}</i><span>{name}</span>{name==="资金与提现"&&<em>3</em>}</button>)}</nav>
      <div className="sidebar-user"><div>管</div><p><b>运营管理员</b><span>超级管理员</span></p></div>
    </aside>
    {mobileMenu&&<button className="menu-mask" onClick={()=>setMobileMenu(false)}/>} 
    <section className="admin-main">
      <header className="topbar"><button className="hamburger" onClick={()=>setMobileMenu(true)}>☰</button><div className="crumb"><span>四季礼遇</span><b>/</b><strong>{active}</strong></div><div className="top-actions"><button>⌕</button><button>♢<i/></button><div>管</div></div></header>
      <div className="admin-content">
        <header className="page-title"><div><span>SEASONS ADMIN</span><h1>{active}</h1><p>商城、礼卡、履约与分销的一体化运营后台</p></div><div><button className="secondary" onClick={()=>notify("报表已生成（Demo）")}>导出报表</button><button className="primary" onClick={()=>{setAdjust(true);setStep(1)}}>＋ 客户余额调账</button></div></header>
        {active==="经营概览"&&<Overview setActive={setActive}/>} 
        {active==="商城商品"&&<Products products={filtered} query={query} setQuery={setQuery} toggle={toggle} edit={setEditing} notify={notify}/>} 
        {active==="礼品卡管理"&&<GiftCards notify={notify}/>} 
        {active==="订单中心"&&<Orders notify={notify} orders={sprintOrders} loading={sprintLoading} load={async()=>{setSprintLoading(true);try{const response=await fetch("/api/v1/admin/orders");const payload=await response.json();if(payload.code===0)setSprintOrders(payload.data);else notify(payload.message);}finally{setSprintLoading(false)}}} open={setSprintDetail}/>} 
        {active==="线上提货"&&<Redeem notify={notify}/>} 
        {active==="用户与VIP"&&<Users onAdjust={()=>setAdjust(true)} notify={notify}/>} 
        {active==="企业团购"&&<Enterprise notify={notify}/>} 
        {active==="推广分销"&&<Distribution notify={notify}/>} 
        {active==="资金与提现"&&<Funds notify={notify}/>} 
        {active==="营销中心"&&<Marketing notify={notify}/>} 
        {active==="消息中心"&&<Messages notify={notify}/>} 
        {active==="系统设置"&&<Settings notify={notify}/>} 
      </div>
    </section>
    {editing&&<Editor product={editing} close={()=>setEditing(null)} save={(p)=>{setProducts(v=>v.map(x=>x.id===p.id?p:x));setEditing(null);notify("商品资料已保存")}}/>}
    {adjust&&<BalanceModal step={step} setStep={setStep} close={()=>{setAdjust(false);setStep(1)}} done={()=>{setAdjust(false);setStep(1);notify("调账成功，审计流水 TZ202608040018 已生成")}}/>}
    {sprintDetail&&<OrderReadOnlyModal order={sprintDetail} close={()=>setSprintDetail(null)}/>} 
    {toast&&<div className="admin-toast">✓ {toast}</div>}
  </main>
}

function Overview({setActive}:{setActive:(s:string)=>void}){return <>
  <section className="stats"><Stat title="今日成交额" value="¥ 96,420" note="较昨日 +18.6%"/><Stat title="商城订单" value="186 单" note="待发货 24 单"/><Stat title="礼卡销售" value="286 张" note="实体 86 · 虚拟 200"/><Stat title="待结佣金" value="¥ 18,260" note="覆盖两级伙伴"/></section>
  <section className="dashboard-grid"><article className="panel trend"><PanelTitle title="近7日经营趋势" sub="商城与礼品卡成交额"/><div className="chart">{[52,68,46,75,61,86,96].map((h,i)=><div className="bar-wrap" key={i}><div className="bar" style={{height:`${h}%`}}><i style={{height:`${Math.max(18,h-30)}%`}}/></div><span>{["周四","周五","周六","周日","周一","周二","今日"][i]}</span></div>)}</div></article><article className="panel channel"><PanelTitle title="成交渠道" sub="本月成交构成"/><div className="donut"><div><b>¥ 628K</b><span>总成交额</span></div></div><ul><li><i className="c1"/>商城零售 <b>38%</b></li><li><i className="c2"/>礼卡销售 <b>35%</b></li><li><i className="c3"/>企业团购 <b>27%</b></li></ul></article></section>
  <section className="panel sync-panel"><PanelTitle title="前后台功能同步检查" sub="已按当前前端流程补齐首版管理入口"/><div className="sync-grid">{[["商城商品","分类、库存、上下架"],["礼品卡","实体/虚拟、价格与内容"],["订单履约","支付、发货、售后"],["线上提货","卡密验证、配送进度"],["会员营销","VIP、余额、优惠券"],["企业团购","阶梯价、客户线索"],["推广分销","两级佣金、永久绑定"],["消息通知","站内信与业务模板"]].map(x=><button key={x[0]} onClick={()=>setActive(x[0]==="会员营销"?"用户与VIP":x[0]==="订单履约"?"订单中心":x[0])}><i>✓</i><b>{x[0]}</b><span>{x[1]}</span></button>)}</div></section>
  <section className="panel"><PanelTitle title="最新业务订单" sub="商城、购卡、提货与团购统一视图"/><OrderTable rows={orders}/></section>
  </>}

function Products({products,query,setQuery,toggle,edit,notify}:{products:Product[];query:string;setQuery:(v:string)=>void;toggle:(id:string)=>void;edit:(p:Product)=>void;notify:(s:string)=>void}){return <section className="panel"><Toolbar query={query} setQuery={setQuery} action="新增商品" onAction={()=>notify("新增商品表单已就绪（Demo）")}/><div className="chips"><button className="on">全部</button>{["水果","蔬菜","肉禽","水产","粮油","酒水"].map(x=><button key={x}>{x}</button>)}</div><div className="table-wrap"><table><thead><tr><th>商品</th><th>分类</th><th>售价</th><th>库存</th><th>累计销量</th><th>状态</th><th>操作</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><b>{p.name}</b><small>{p.id}</small></td><td>{p.category}</td><td>¥ {p.price.toFixed(2)}</td><td className={p.stock===0?"red":""}>{p.stock}</td><td>{p.sales}</td><td><button className={`switch ${p.status?"on":""}`} onClick={()=>toggle(p.id)}><i/></button></td><td><button onClick={()=>edit(p)}>编辑</button><button onClick={()=>notify("库存流水已打开")}>库存</button></td></tr>)}</tbody></table></div></section>}

function GiftCards({notify}:{notify:(s:string)=>void}){return <><section className="rule-grid"><Rule title="发卡方式" value="实体卡 + 线上虚拟卡" note="购卡成功后由用户二选一"/><Rule title="佣金规则" value="按卡设置固定额或比例" note="支付成功后锁定两级佣金"/><Rule title="关系绑定" value="首笔推广支付后永久绑定" note="仅点击链接不绑定、永不覆盖"/></section><section className="panel"><PanelTitle title="礼品卡商品" sub="维护售价、包含商品、库存与发卡方式" action="新增礼品卡" click={()=>notify("礼品卡新建表单已打开")}/><SimpleTable heads={["编号","礼卡名称","原价","售价","包含商品","状态","操作"]} rows={cards} notify={notify}/></section></>}

function Orders({notify,orders:apiOrders,loading,load,open}:{notify:(s:string)=>void;orders:SprintAdminOrder[];loading:boolean;load:()=>void;open:(order:SprintAdminOrder)=>void}){return <><section className="notice-box"><b>Sprint3 订单中心 · 只读模式</b><span>仅查看订单、地址与商品快照；本期不允许后台改金额、改商品快照或人工修改订单状态。</span></section><section className="stats"><Stat title="全部订单" value={String(apiOrders.length)} note="当前 Sprint3 创建订单"/><Stat title="待付款" value={String(apiOrders.filter(order=>order.orderStatus==="pending_payment").length)} note="本期仅支持取消"/><Stat title="已取消" value={String(apiOrders.filter(order=>order.orderStatus==="cancelled").length)} note="支付、退款后续 Sprint"/><Stat title="本期成交额" value={`¥ ${apiOrders.reduce((sum,order)=>sum+order.payableAmount,0).toFixed(2)}`} note="待支付订单金额"/></section><section className="panel"><PanelTitle title="Sprint3 商城订单" sub="点击刷新读取当前订单数据，订单详情完全只读" action={loading?"读取中…":"刷新订单"} click={load}/><div className="table-wrap"><table><thead><tr><th>订单编号</th><th>收货人</th><th>商品</th><th>应付金额</th><th>订单状态</th><th>支付状态</th><th>创建时间</th><th>操作</th></tr></thead><tbody>{apiOrders.map(order=><tr key={order.id}><td><b>{order.orderNo}</b></td><td>{order.receiverName} {order.receiverPhone}</td><td>{order.items.map(item=>`${item.productName} ×${item.quantity}`).join("、")}</td><td>¥ {order.payableAmount.toFixed(2)}</td><td><span className="status">{order.orderStatus==="pending_payment"?"待付款":"已取消"}</span></td><td><span className="status">未支付</span></td><td>{new Date(order.createdAt).toLocaleString("zh-CN")}</td><td><button onClick={()=>open(order)}>查看详情</button></td></tr>)}{!apiOrders.length&&<tr><td colSpan={8} className="empty-row">暂无 Sprint3 商城订单，前端提交订单后会在此显示。</td></tr>}</tbody></table></div></section></>}

function Redeem({notify}:{notify:(s:string)=>void}){const rows=[["TH202608040181","8800 **** 5767","猫山王榴莲 5斤等4件","林悦 138****2801","顺丰 SF13920260804","配送中"],["TH202608030166","8800 **** 3812","金秋蟹王卡 4件","王女士 186****6328","待录入","待发货"]];return <><section className="notice-box"><b>当前仅支持线上快递提货</b><span>已按甲方最新需求移除城市切换、预约自提和线下核销。卡密验证成功后进入收货信息与配送流程。</span></section><section className="panel"><PanelTitle title="提货履约记录" sub="卡密验证、收货资料与物流状态"/><SimpleTable heads={["提货单号","礼卡账号","提货内容","收货人","物流单号","状态","操作"]} rows={rows} notify={notify}/></section></>}

function Users({onAdjust,notify}:{onAdjust:()=>void;notify:(s:string)=>void}){return <><section className="panel"><PanelTitle title="VIP等级与折扣" sub="累计消费自动升级，等级越高购物折扣越高" action="保存等级规则" click={()=>notify("VIP等级规则已保存")}/><div className="vip-levels">{[["VIP 1","累计 ¥0","98折"],["VIP 2","累计 ¥1,000","95折"],["VIP 3","累计 ¥3,000","88折"],["VIP 4","累计 ¥10,000","85折"],["黑金VIP","累计 ¥30,000","8折"]].map(x=><div key={x[0]}><b>{x[0]}</b><span>{x[1]}</span><em>{x[2]}</em></div>)}</div></section><section className="panel"><PanelTitle title="会员列表" sub="可按姓名、手机号、VIP卡号或UID检索" action="客户余额调账" click={onAdjust}/><SimpleTable heads={["用户","UID","等级","累计消费","优惠券","注册时间","操作"]} rows={users} notify={notify}/></section></>}

function Enterprise({notify}:{notify:(s:string)=>void}){const leads=[["上海澄远科技","张先生","138****2088 / zhang_qy","200张","待跟进","08-04 09:18"],["杭州云启商贸","李女士","微信 liyunqi","80张","已联系","08-03 15:42"]];return <><section className="panel"><PanelTitle title="企业团购阶梯价" sub="门面批发价与线下协商返点分开管理" action="新增价格档" click={()=>notify("新的阶梯价已添加")}/><div className="tier-grid">{[["20–49张","95折"],["50–99张","90折"],["100–299张","85折"],["300张以上","专属报价"]].map(x=><div key={x[0]}><span>{x[0]}</span><b>{x[1]}</b><button>编辑</button></div>)}</div></section><section className="panel"><PanelTitle title="企业客户线索" sub="来自前端“专人服务”提交"/><SimpleTable heads={["公司","联系人","联系方式","意向数量","跟进状态","提交时间","操作"]} rows={leads} notify={notify}/></section></>}

function Distribution({notify}:{notify:(s:string)=>void}){const rows=[["FY202608040026","UID 891026","UID 892318","四季臻鲜礼卡×2","¥1,176","一级 ¥47.04 / 二级 ¥23.52","待结算"],["FY202608030118","UID 891026","UID 896680","商城订单","¥588","一级 ¥23.52","已结算"]];return <><section className="rule-grid"><Rule title="绑定时机" value="推广订单支付成功后" note="仅访问不绑定，绑定后永不覆盖"/><Rule title="收益层级" value="本人最多获取两级" note="团队可无限裂变"/><Rule title="佣金设置" value="固定金额 / 销售比例" note="每张礼卡和商品可独立设置"/></section><section className="stats"><Stat title="团队总人数" value="326 人" note="含推广员本人"/><Stat title="一级伙伴" value="157 人" note="本月新增 18"/><Stat title="二级伙伴" value="168 人" note="本月新增 31"/><Stat title="待结佣金" value="¥ 18,260" note="确认收货后结算"/></section><section className="panel"><PanelTitle title="推广订单明细" sub="待结算订单固定优先展示" action="佣金参数设置" click={()=>notify("佣金参数设置已打开")}/><SimpleTable heads={["流水号","推广人","购买人","商品","订单金额","佣金明细","状态","操作"]} rows={rows} notify={notify}/></section></>}

function Funds({notify}:{notify:(s:string)=>void}){const rows=[["TX202608040021","王女士 / UID 892318","¥1,200.00","工商银行 6212 **** 8021","待审核","08-04 10:12"],["TX202608030109","周子明 / UID 891026","¥800.00","微信零钱","已打款","08-03 14:36"]];return <><section className="stats"><Stat title="用户余额总额" value="¥ 286,430" note="商城与礼卡均可抵扣"/><Stat title="待审核提现" value="3 笔" note="合计 ¥3,600"/><Stat title="累计佣金" value="¥ 328,600" note="含待结算佣金"/><Stat title="累计提现" value="¥ 189,820" note="本月 ¥26,800"/></section><section className="panel"><PanelTitle title="提现审核" sub="审核、驳回与打款均记录操作日志"/><SimpleTable heads={["提现单号","用户","金额","收款账户","状态","申请时间","操作"]} rows={rows} notify={notify}/></section></>}

function Marketing({notify}:{notify:(s:string)=>void}){return <div className="two-cols"><section className="panel"><PanelTitle title="优惠券管理" sub="支持全场、商城、礼品卡三类使用范围" action="新建优惠券" click={()=>notify("优惠券创建表单已打开")}/><div className="campaign-list">{[["满100减50","充值赠券 · 商城","发放 286 / 使用 92"],["礼卡立减88元","礼品卡专用","发放 518 / 使用 186"],["新人无门槛20元","全场通用","发放 1,208 / 使用 632"]].map(x=><div key={x[0]}><b>{x[0]}</b><span>{x[1]}</span><em>{x[2]}</em></div>)}</div></section><section className="panel"><PanelTitle title="首页活动位" sub="Banner每5秒轮播，开屏广告可随时关闭" action="发布到前端" click={()=>notify("营销配置已同步到前端")}/><div className="campaign-list">{["至尊四季臻鲜卡，给你帝王级的优惠","金秋蟹王卡，尽尝秋天第一口鲜","即买即返，边吃边赚","88元减免红包开屏活动"].map((x,i)=><div key={x}><b>{`活动 0${i+1}`}</b><span>{x}</span><em className="green">投放中</em></div>)}</div></section></div>}

function Messages({notify}:{notify:(s:string)=>void}){return <div className="two-cols"><section className="panel message-compose"><PanelTitle title="发送站内消息" sub="同步展示在底部消息入口和我的页面铃铛"/><label>接收人<select><option>全部用户</option><option>指定UID</option><option>企业客户</option><option>推广员</option></select></label><label>消息类型<select><option>订单通知</option><option>礼卡通知</option><option>余额通知</option><option>活动通知</option></select></label><label>消息标题<input defaultValue="新的礼品卡已到账"/></label><label>消息内容<textarea defaultValue="新的礼品卡已为您放在【我的】-【我的礼品卡】里面。"/></label><button className="primary" onClick={()=>notify("消息已发送并产生未读提醒")}>确认发送</button></section><section className="panel"><PanelTitle title="自动消息模板" sub="业务动作完成后自动触发"/><div className="campaign-list">{["购买成功：实体卡地址待确认","购买成功：虚拟礼卡已入卡包","提货成功：物流单已生成","充值成功：赠送优惠券已到账","提现申请：已进入审核"].map(x=><div key={x}><b>{x}</b><em className="green">已启用</em></div>)}</div></section></div>}

function Settings({notify}:{notify:(s:string)=>void}){return <><div className="settings-grid">{[["基础设置",["平台名称","客服电话","用户协议","隐私政策"]],["支付与发票",["微信支付","支付宝","银行卡","余额抵扣","电子发票"]],["配送设置",["运费模板","包邮门槛","发货时效","物流公司"]],["安全与权限",["管理员角色","资金操作密码","二次确认","审计日志"]]].map(x=><section className="panel" key={x[0] as string}><h2>{x[0] as string}</h2>{(x[1] as string[]).map(y=><label className="setting-row" key={y}><span>{y}</span><button className="switch on"><i/></button></label>)}</section>)}</div><button className="primary save-all" onClick={()=>notify("系统设置已保存")}>保存全部设置</button></>}

function Stat({title,value,note}:{title:string;value:string;note:string}){return <article className="stat-card"><span>{title}</span><h2>{value}</h2><p>{note}</p></article>}
function Rule({title,value,note}:{title:string;value:string;note:string}){return <article className="rule-card"><span>{title}</span><b>{value}</b><p>{note}</p><button>配置</button></article>}
function PanelTitle({title,sub,action,click}:{title:string;sub:string;action?:string;click?:()=>void}){return <header><div><h2>{title}</h2><p>{sub}</p></div>{action&&<button className="mini-primary" onClick={click}>{action}</button>}</header>}
function Toolbar({query,setQuery,action,onAction}:{query:string;setQuery:(s:string)=>void;action:string;onAction:()=>void}){return <div className="toolbar"><label>⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索名称、编号或分类"/></label><button className="primary" onClick={onAction}>＋ {action}</button></div>}
function OrderTable({rows,notify}:{rows:Order[];notify?:(s:string)=>void}){return <div className="table-wrap"><table><thead><tr><th>订单编号</th><th>客户</th><th>业务类型</th><th>实付金额</th><th>状态</th><th>下单时间</th><th>操作</th></tr></thead><tbody>{rows.map(o=><tr key={o.id}><td><b>{o.id}</b></td><td>{o.user}</td><td>{o.scene}</td><td>{o.amount?`¥ ${o.amount.toLocaleString()}`:"—"}</td><td><span className="status">{o.status}</span></td><td>{o.time}</td><td><button onClick={()=>notify?.("订单详情已打开")}>详情</button><button onClick={()=>notify?.("操作面板已打开")}>处理</button></td></tr>)}</tbody></table></div>}
function SimpleTable({heads,rows,notify}:{heads:string[];rows:string[][];notify:(s:string)=>void}){return <div className="table-wrap"><table><thead><tr>{heads.map(x=><th key={x}>{x}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={`${r[0]}${i}`}>{r.map((x,j)=><td key={j}>{j===r.length-1?<span className="status">{x}</span>:x}</td>)}{heads.length>r.length&&<td><button onClick={()=>notify("详情与操作面板已打开")}>查看</button><button onClick={()=>notify("记录已更新")}>处理</button></td>}</tr>)}</tbody></table></div>}

function Editor({product,close,save}:{product:Product;close:()=>void;save:(p:Product)=>void}){const [form,setForm]=useState(product);return <div className="admin-overlay"><section className="adjust-modal compact-modal"><header><div><span>PRODUCT EDITOR</span><h2>编辑商城商品</h2></div><button onClick={close}>×</button></header><div className="adjust-body form-grid"><label>商品名称<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label><label>商品分类<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>水果</option><option>蔬菜</option><option>肉禽</option><option>水产</option></select></label><label>销售价格<input type="number" value={form.price} onChange={e=>setForm({...form,price:Number(e.target.value)})}/></label><label>库存数量<input type="number" value={form.stock} onChange={e=>setForm({...form,stock:Number(e.target.value)})}/></label></div><footer><button className="secondary" onClick={close}>取消</button><button className="primary" onClick={()=>save(form)}>保存商品</button></footer></section></div>}

function BalanceModal({step,setStep,close,done}:{step:number;setStep:(n:number)=>void;close:()=>void;done:()=>void}){return <div className="admin-overlay"><section className="adjust-modal"><header><div><span>SECURE BALANCE ADJUSTMENT</span><h2>客户余额调账</h2></div><button onClick={close}>×</button></header><div className="steps"><i className="on">1</i><b/><i className={step>1?"on":""}>2</i><b/><i className={step>2?"on":""}>3</i></div><div className="adjust-body">{step===1&&<><label>搜索VIP卡号或UUID<input defaultValue="VIP-88002186"/></label><div className="client-result"><div>企</div><p><b>上海澄远科技有限公司</b><span>UUID：USR-B2B-8F72C91A · VIP 8800 2186</span></p><em>已认证企业</em></div><div className="form-grid"><label>调整方向<select><option>增加</option><option>扣减</option></select></label><label>调整金额<input defaultValue="3000"/></label></div><label>业务原因<textarea defaultValue="企业福利卡采购返点，关联订单 QY202608030882。"/></label></>}{step===2&&<><div className="warning">⚠ 这是资金账户操作，请再次核对客户、金额与业务凭证。</div><dl className="confirm-list"><div><dt>调账客户</dt><dd>上海澄远科技有限公司</dd></div><div><dt>本次增加</dt><dd className="green">¥ 3,000.00</dd></div><div><dt>操作后余额</dt><dd>¥ 13,000.00</dd></div></dl><label className="check"><input type="checkbox" defaultChecked/> 我已核对客户身份、金额和业务凭证</label></>}{step===3&&<div className="password-step"><div className="lock">锁</div><h3>输入独立资金操作密码</h3><p>操作将写入永久审计日志，不能删除，只能通过反向流水冲正。</p><label>资金操作密码<input type="password" defaultValue="888888"/></label><div className="audit-note">连续输错5次将锁定账户 · 本次操作需二次确认</div></div>}</div><footer><button className="secondary" onClick={()=>step===1?close():setStep(step-1)}>{step===1?"取消":"上一步"}</button><button className="primary" onClick={()=>step<3?setStep(step+1):done()}>{step===1?"下一步：核对信息":step===2?"确认并验证密码":"确认执行调账"}</button></footer></section></div>}
