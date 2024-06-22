export default function generateHTML(orderData) {
    const items = orderData.items;
    let itemsList = '';

    items.forEach(item => {
        itemsList += 
            `<div class="product-item">
                <img src="${item.productId.img}" alt="Product" class="product-image">
                <div>
                    <p class="product-description"><strong>Описание:</strong> ${item.productId.preText}</p>
                    <p class="product-quantity"><strong>Количество:</strong> ${item.quantity}</p>
                    <p class="product-price"><strong>Цена:</strong> ${item.productId.price} BYN</p>
                </div>
            </div>`
        
    });

    return (
        `<html>
        <head>
            <title>PDF Example</title>
            <style>
                body {
                    font-family: 'Montserrat', sans-serif;
                    margin: 20px;
                    background-color: #f8f8f8;
                    color: #333;
                }
                h1 {
                    color: #009688;
                    text-align: center;
                    margin-bottom: 20px;
                }
                .product-item {
                    border: 1px solid #ddd;
                    border-radius: 5px;
                    padding: 15px;
                    margin-bottom: 20px;
                    background-color: #fff;
                    display: flex;
                    align-items: center;
                }
                
                .product-image {
                    max-width: 100px;
                    height: auto;
                    margin-right: 15px;
                    border-radius: 5px;
                }
                
                .product-description {
                    margin-bottom: 10px;
                    font-weight: bold;
                }
                
                .product-quantity,
                .product-price {
                    margin-bottom: 5px;
                }
                .total-amount {
                    color: #009688;
                    font-size: 1.2em;
                    text-align: left;
                }
                .order-status {
                    color: #FF5722;
                    font-weight: bold;
                }
                .delivery-address {
                    font-style: italic;
                }
                .payment-method {
                    text-transform: uppercase;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <h1>Информация о заказе:</h1>
            <div>
                ${itemsList} 
            </div>
            <hr>
            <p class="total-amount">Общая стоимость: ${orderData.totalAmount} BYN</p>
            <p class="order-status">Статус заказа: ${orderData.status.name}</p>
            <p class="delivery-address">Адрес доставки: ${orderData.address}</p>
            <p class="class="total-amount"">Способ оплаты: ${orderData.wayPay.name}</p>
        </body>
        </html>`
    )
}