(function() {
  console.log("[VA-STORE Content Script] Loaded.");

  /**
   * 현재 페이지에서 주문번호(VASTORE-xxxx)를 파싱하여 반환
   * @returns {string} 'VASTORE-xxxx' 형태의 주문번호. 없으면 ""
   */
  function getOrderNumber() {
    const orderHeader = document.querySelector(
      "#MainContent > div > div:nth-child(3) > div:nth-child(1) > h2"
    );
    if (!orderHeader) return "";

    const matched = orderHeader.textContent.match(/VASTORE-(\d+)/);
    if (matched && matched[1]) {
      return "VASTORE-" + matched[1];
    }
    return "";
  }

  /**
   * 배송비(Shipping Fee)를 파싱하여 반환
   * @returns {string} 숫자 형태(문자열). 없으면 "0" (무료배송인 경우 등)
   */
  function getShippingFee() {
    const shippingFeeCell = document.querySelector('td[data-label="配送 (無料配送)"]');
    if (!shippingFeeCell) return "0";

    // "¥1,234" -> "1234"
    return shippingFeeCell.textContent.trim().replace("¥", "").replace(",", "") || "0";
  }

  /**
   * <table> 내 상품행(tbody tr)을 순회하며, 각 상품 객체 생성
   * @returns {Array} [{sku, productName, productUrl, productPrice, productQty, trackingNo, brand}, ...]
   */
  function getItems() {
    const tbody = document.querySelector(
      "#MainContent > div > div:nth-child(3) > div:nth-child(1) > table > tbody"
    );
    if (!tbody) return [];

    const productRows = tbody.querySelectorAll("tr");
    const items = [];

    productRows.forEach((row) => {
      // SKU 셀이 없으면 상품행이 아니라고 간주
      const skuCell = row.querySelector('td[data-label="SKU"]');
      if (!skuCell) return;

      const sku = skuCell.textContent.trim();

      // 상품명 + URL
      let productName = "";
      let productUrl = "";
      const productAnchor = row.querySelector('td[data-label="商品"] a');
      if (productAnchor) {
        productName = productAnchor.textContent.trim();
        productUrl = productAnchor.getAttribute("href");
        // 상대 경로면 절대 경로로 보정
        if (productUrl && !productUrl.startsWith("http")) {
          productUrl = "https://va-store.jp" + productUrl;
        }
      }

      // 상품가격
      let productPrice = "";
      const priceCell = row.querySelector('td[data-label="商品価格"] span');
      if (priceCell) {
        productPrice = priceCell.textContent.trim().replace("¥", "").replace(",", "");
      }

      // 수량
      let productQty = "";
      const qtyCell = row.querySelector('td[data-label="数量"]');
      if (qtyCell) {
        productQty = qtyCell.textContent.trim();
      }

      // 트래킹번호
      let trackingNo = "";
      const fulfillmentDiv = row.querySelector(".fulfillment");
      if (fulfillmentDiv) {
        const text = fulfillmentDiv.textContent;
        // 예: "#437295049181" 형태를 찾음
        const match = text.match(/#(\d+)/);
        if (match && match[0]) {
          trackingNo = "Yamato (JA) " + match[0];
        }
      }

      // 브랜드명 고정
      const brand = "VisualArts/Key";

      items.push({
        sku,
        productName,
        productUrl,
        productPrice,
        productQty,
        trackingNo,
        brand
      });
    });

    return items;
  }

  /**
   * "HIJP로 이동" 버튼을 생성하고 클릭 시 처리 로직(데이터 저장 후 이동)을 수행
   * @param {Object} orderData {orderNo, trackingNo, shippingFee, items}
   */
  function createGoToHijpButton(orderData) {
    const orderHeader = document.querySelector(
      "#MainContent > div > div:nth-child(3) > div:nth-child(1) > h2"
    );
    if (!orderHeader) return;

    const btn = document.createElement("button");
    btn.innerText = "하이재팬으로 배송신청 >";
    btn.style.fontSize = "16px";
    btn.style.backgroundColor = "rgb(255, 68, 0)";
    btn.style.width = "300px";
    btn.style.float = "right";
    btn.style.cursor = "pointer";

    btn.addEventListener("click", async () => {
      // chrome.storage.local 에 저장
      await chrome.storage.local.set({ vaStoreOrderData: orderData });
      console.log("[VA-STORE] 주문 데이터 저장 완료:", orderData);

      // HIJP 페이지 열기
      window.open("https://www.hijp.co.kr/delivery/apply_jp", "_blank");
    });

    orderHeader.parentElement.appendChild(btn);
  }

  // -----------------------
  // 실제 실행 로직(초기화)
  // -----------------------

  const orderNo = getOrderNumber();
  const shippingFee = getShippingFee();
  const items = getItems();

  console.log("[VA-STORE] 파싱된 상품들:", items);

  // 첫 상품 기준으로 상단 트래킹번호
  const topTracking = items.length > 0 ? items[0].trackingNo : "";

  const orderData = {
    orderNo,
    trackingNo: topTracking,
    shippingFee,
    items,
  };

  // 버튼 생성
  createGoToHijpButton(orderData);
})();
