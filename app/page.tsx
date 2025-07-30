"use client"; // クライアントコンポーネント宣言、このコードはクライアント（ブラウザ）側で動く。  Next.js では何も書かなければサーバーコンポーネントになります。

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShoppingCart } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";


const MENU_API_URL = "https://w564vvtx9v.microcms.io/api/v1/menu"; // microCMS のエンドポイント URL

// データをセットする配列を用意
type MenuItem = {
  id: string;
  name: string;
  price: number;
  comment?: string;
  image?: {
    url: string;
    width: number;
    height: number;
  };
  category?: string;
};

export default function MenuPage() {

const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
const [menu, setMenu] = useState<MenuItem[]>([]);
const [cart, setCart] = useState<MenuItem[]>([]);

// カテゴリ一覧（重複なし）を menu から抽出
const categories = Array.from(new Set(menu.map((item) => item.category || "その他")));
type ModalType = "error" | "checkout" | "thankyou" | null;
const [modalType, setModalType] = useState<ModalType>(null);
const totalAmount = cart.reduce((sum, item) => sum + Number(item.price), 0); // カートの合計

  // useEffect(() => { fetch(...); }, []); 画面の準備が終わったタイミングでmicroCMSからデータを取得する
  useEffect(() => {
    // CMSからメニューデータ取得
    fetch(MENU_API_URL, {
      headers: {
        "X-API-KEY": process.env.NEXT_PUBLIC_MICROCMS_API_KEY || "",
      },
    })
      // => はアロー関数といいます。functionを短く書いたのもです。
      // 例　これを短く書いたものです
      // .then(function(res) {
      //   return res.json();
      // })
      // res.json();の戻り値が res に入ります。
      .then((res) => res.json()) // 文字列からオブジェクトへ変換
      .then((data) => setMenu(data.contents)); // res オブジェクト が data に入る return が呼ばれる
    // 下記のように書き換えるとdataの中をブラウザ console で確認できます。
    // .then((data) => {
    //   setMenu(data.contents);
    //   console.table(data.contents); // contents 配列をテーブル形式で表示
    // });

    // localStorage からカートを復元
    const saved = localStorage.getItem("cart");
    if (saved) {
      setCart(JSON.parse(saved));
    }
  }, []);

  // 数量管理用の state を追加（全体で1つの数量を管理する場合）
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const groupedCart = cart.reduce<Record<string, { item: MenuItem; quantity: number }>>((acc, item) => {
  if (acc[item.id]) {
    acc[item.id].quantity += 1;
  } else {
    acc[item.id] = { item, quantity: 1 };
  }
  return acc;}, {});

  const removeOneItem = (id: string) => {
  const index = cart.findIndex((item) => item.id === id);
  if (index !== -1) {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  }
};

  const addOneItem = (item: MenuItem) => {
    const updated = [...cart,item];
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  };

  return (
    <div className={styles.container}>
      <header className={styles.logoHeader}>
        <Link href="/" target="_self">
        <Image src="/logo.png" alt="logo" className={styles.logo} height={50} width={100} />
        </Link>
        <button className={styles.cartNone} onClick={() => {
          const cart = document.getElementById("cart");
            if (cart) {cart.scrollIntoView({ behavior: "smooth" });}}}>
            <FontAwesomeIcon icon={faShoppingCart}/>
          </button>
      </header>
      {/* メニュー一覧 */}

      <div className={styles.contentArea}>
      <main className={styles.menuList}>
        <h1 className={styles.title}>メニュー一覧</h1>
          <div className={styles.categoryFilter}>
            <button className={`${!selectedCategory ? styles.activeCategory : ""}`}
              onClick={() => setSelectedCategory(null)}>すべて</button>
          
          {categories.map((category) => (
            <button key={category} className={`${selectedCategory === category ? styles.activeCategory : ""}`}
              onClick={() => setSelectedCategory(category)}>{category}</button>))}
          </div>

        <ul className={styles.list}>
          {(selectedCategory ? menu.filter((item) => item.category === selectedCategory) : menu).map((item) => (
        <li key={item.id} className={styles.menuItem}>
            <div className={styles.imgContainer}>
              {item.image && (
                <Image
                  src={item.image.url}
                  alt={item.name}
                  width={item.image.width}
                  height={item.image.height}
                    className={styles.menuImage}
                  onClick={() => { setSelectedItem(item); setSelectedQuantity(1) }}/>
                )}
              </div>
              <p className={styles.name}>{item.name}</p>
              {item.comment && <p className={styles.comment}>{item.comment}</p>}
              <div className={styles.priceTag}>
                <p><strong>{item.price} 円 (税込)</strong></p>
                  <button className={styles.addButton}
                    onClick={() => { setSelectedItem(item); setSelectedQuantity(1) }}>
                  <FontAwesomeIcon icon={faShoppingCart}/>
                </button>
              </div>
            </li>
          ))}
        </ul>

{selectedItem && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2>注文確認</h2>
       <Image src={selectedItem.image?.url || ""} alt={selectedItem.name} width={selectedItem.image?.width || 1} height={selectedItem.image?.height || 1}
        className={styles.selectedItemImage} />
      <p>{selectedItem.name} ~ {selectedItem.price}円</p>

      <div className={styles.counter}>
        <button onClick={() => setSelectedQuantity(q => Math.max(1, q - 1))}>－</button>
        <span className={styles.quantity}>{selectedQuantity}</span>
        <button onClick={() => setSelectedQuantity(q => q + 1)}>＋</button>
      </div>
              
      <div className={styles.actions}>
        <button className={styles.cancel} onClick={() => setSelectedItem(null)}>キャンセル</button>
        <button className={styles.confirm} onClick={() => {
          const saved = localStorage.getItem("cart");
          const cart = saved ? JSON.parse(saved) : [];
          const updated = [...cart, ...Array.from({ length: selectedQuantity }, () => selectedItem)];
          localStorage.setItem("cart", JSON.stringify(updated));
          setCart(updated);
          setSelectedItem(null);}}>カート追加</button>
      </div>
    </div>
  </div>
)}
</main>

{/* 注文状況 */}
<aside className={styles.cart} id="cart">
  <h2 className={styles.cartTitle}>注文カート</h2>
    <div className={styles.cartTitleName}>
      <p>商品</p>
      <p className={styles.none}>単価</p>
      <p>数量</p>
      <p>小計</p>
    </div>
  {cart.length === 0 ? (
    <p className={styles.empty}>まだ注文はありません。</p>
  ) : (Object.values(groupedCart).map(({ item, quantity }) => (
        <div key={item.id} className={styles.cartItem}>
          {item.image && (
            <Image
              src={item.image.url}
              alt={item.name}
              width={100}
              height={100}
          className={styles.cartImage} />
          )}
      <p className={styles.none}>{item.price.toLocaleString()}円</p>
          <p className={styles.cartCounter}>
            <button onClick={() => removeOneItem(item.id)}>－ </button>       
            <span>&nbsp;{quantity}&nbsp;</span>
            <button onClick={() => addOneItem(item)}>＋</button>        
          </p>
          <p>{(item.price * quantity).toLocaleString()}円</p>
        </div>
    ))
  )}
      <div className={styles.cartTotal}>
        合計金額：<strong>{totalAmount.toLocaleString()}円(税込)</strong>
      </div>
  <button className={styles.checkoutButton} onClick={() => {
          if (totalAmount === 0) {
            setModalType("error"); // 0円エラー表示
          } else {
            setModalType("checkout"); // 会計確認表示
          }}}>会計する
  </button>
</aside>

  {modalType === "error" && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2>エラー</h2>
        <p>カートが空です。商品を追加してください。</p>
      <button className={styles.confirm} onClick={() => setModalType(null)}>閉じる</button>
    </div>
  </div>
)}

{modalType === "checkout" && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2>お会計の確認</h2>
      <p>合計金額：{totalAmount.toLocaleString()}円(税込)</p>
      <p>この内容で会計してもよろしいですか？</p>
      <div className={styles.actions}>
        <button className={styles.cancel} onClick={() => setModalType(null)}>キャンセル</button>
        <button
          className={styles.confirm}
          onClick={() => {
            localStorage.removeItem("cart");
            setCart([]);
            setModalType("thankyou");
          }}
        >
          会計する
        </button>
      </div>
    </div>
  </div>
)}

{modalType === "thankyou" && (
  <div className={styles.modalOverlay}>
    <div className={styles.modal}>
      <h2>ありがとうございました！</h2>
      <p>またのご来店をお待ちしております。</p>
      <button className={styles.confirm} onClick={() => setModalType(null)}>
        トップに戻る
      </button>
    </div>
  </div>
)}
</div>
</div>
  );
}