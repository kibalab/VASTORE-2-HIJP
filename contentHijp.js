(function() {
  console.log("[HIJP Content Script] Loaded.");

  function addItemBox() {
    const addBtn = document.querySelector('a[name="addButton"]');
    if (addBtn) {
      addBtn.click();
    }
  }

  function getGoodsLayerBoxes() {
    return document.querySelectorAll("#goodsLayer .goodsLayer_box");
  }

  /**
   * 특정 goodsLayer_box 엘리먼트에 item 정보를 채워넣음
   * @param {HTMLElement} goodsBox - 하나의 상품 박스( .goodsLayer_box )
   * @param {Object} item - {sku, productName, productUrl, productPrice, productQty, trackingNo, brand}
   */
  function fillItemData(goodsBox, item) {
    // 상품명
    const productNameInput = goodsBox.querySelector('input[name="productname[]"]');
    if (productNameInput) productNameInput.value = item.productName;

    // 브랜드
    const brandInput = goodsBox.querySelector('input[name="brand[]"]');
    if (brandInput) brandInput.value = item.brand;

    // 단가
    const priceInput = goodsBox.querySelector('input[name="price[]"]');
    if (priceInput) priceInput.value = item.productPrice;

    // 수량
    const qtyInput = goodsBox.querySelector('input[name="quantity[]"]');
    if (qtyInput) qtyInput.value = item.productQty;

    // 상품URL
    const urlInput = goodsBox.querySelector('input[name="target_url[]"]');
    if (urlInput) urlInput.value = item.productUrl;

    // 이미지 URL
    const imgInput = goodsBox.querySelector('input[name="image_url[]"]');
    if (imgInput) {
      imgInput.value = `https://va-store.jp/cdn/shop/files/${item.sku}_1.jpg`;
    }

    // 상세정보 트래킹번호
    const detailTrackingInput = goodsBox.querySelector('input[name="trackingno[]"]');
    if (detailTrackingInput) detailTrackingInput.value = item.trackingNo;

    // 상품코드(SKU)
    const productCodeInput = goodsBox.querySelector('input[name="productcode[]"]');
    if (productCodeInput) productCodeInput.value = item.sku;

    // ---------------------------------------------------
    // (추가) "품목" = "기타 -> 완구,피규어"
    // ---------------------------------------------------
    const catSelect = goodsBox.querySelector('select[name="desccat"]');
    if (catSelect) {
      catSelect.value = "130"; // "기타"
      catSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }

    const descSelect = goodsBox.querySelector('select[name="descript[]"]');
    if (descSelect) {
      descSelect.value = "Toys"; // "완구,피규어"
      descSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  /**
   * 여러 상품(items)을 순회하며 폼에 입력
   * @param {Array} items
   */
  function fillMultipleItems(items) {
    // 첫 상품은 기존 row 사용
    // 나머지는 "상품추가" 버튼을 눌러 row를 생성한 후 입력
    items.forEach((item, idx) => {
      if (idx === 0) {
        const firstBox = document.querySelector("#goodsLayer .goodsLayer_box");
        if (firstBox) fillItemData(firstBox, item);
      } else {
        setTimeout(() => {
          addItemBox(); // 새 row 생성
          const goodsBoxes = getGoodsLayerBoxes();
          const lastBox = goodsBoxes[goodsBoxes.length - 1];
          if (lastBox) fillItemData(lastBox, item);
        }, 300 * idx);
      }
    });
  }

  /**
   * 주문번호/트래킹번호/배송비 etc. 상단 폼 입력
   * @param {string} orderNo
   * @param {string} trackingNo
   * @param {string} shippingFee
   */
  function fillTopForm(orderNo, trackingNo, shippingFee) {
    const orderNoInput = document.querySelector('input[name="orderno"]');
    if (orderNoInput) orderNoInput.value = orderNo;

    const trackingNoInput = document.querySelector('input[name="trackingno_"]');
    if (trackingNoInput) trackingNoInput.value = trackingNo;

    const shippingFeeInput = document.querySelector('input[name="jp_pay_send"]');
    if (shippingFeeInput) shippingFeeInput.value = shippingFee;
  }

  /**
   * main init: storage에서 vaStoreOrderData 가져와 폼 채우기
   */
  function init() {
    chrome.storage.local.get(["vaStoreOrderData"], (result) => {
      if (!result.vaStoreOrderData) {
        console.log("[HIJP] VA-STORE 데이터가 없습니다.");
        return;
      }

      const { orderNo, trackingNo, shippingFee, items } = result.vaStoreOrderData;
      console.log("[HIJP] 폼에 입력할 데이터:", result.vaStoreOrderData);

      // 1) 상단 폼 입력
      fillTopForm(orderNo, trackingNo, shippingFee);

      // 2) 상품정보 입력
      if (items && items.length > 0) {
        fillMultipleItems(items);
      }

      // 최종적으로 데이터 삭제(중복입력 방지)
      chrome.storage.local.remove(["vaStoreOrderData"]);
    });
  }

  init();
})();
