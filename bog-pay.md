Introduction
What is the Online Payment API
The Online Payment API allows embedding easily the payment module into any kind of Online Shop. It gives the possibility to integrate with an Online Shop via the simple interface which covers transactions performed by a VISA, Mastercard, and American Express cards issued by the Bank of Georgia or by the other commercial banks.

What is needed for the integration
To establish the integration, the Merchant should be a customer of the Bank of Georgia and own an account at the businessonline.ge. The Company’s primary info fields should be fulfilled in the Bank along with the iPay parameters (Callback URLs of the Payment and Payment Amount Return on which Bank will notify Merchant regarding the result respective operation) for Merchant to fully use the Online Payment feature. The Callback URL information should be provided to the Bank in a digital format. After filling in the Company’s primary fields, the Merchant will be in a pending mode with an assigned unique identifier in the Bank system, however, it will have a blocked state. Within this period, every attempt for a payment incoming from an Online Shop will receive an error. Once the iPay parameter is provided, the complete integration and testing can be performed for an Online Shop.

Protocol and Technical Specifications
API architecture: Restful Online Payment Application protocol: HTTP/1.1. To enhance security it is mandatory to call all API methods using HTTPS, which is an extension of the HTTP protocol. Service call type: Synchronous Security protocol: OAuth 2.0 Information exchange security standard: JSON Web Tokens (JWT).

BASE URL
https://ipay.ge/opay/api/v1

Short Description of a Process
Below we introduce the brief review of the full cycle of the Online Payment Checkout:

The customer chooses a product or a shopping basket on the Online Shop webpage and presses a ‘Payment’ button
Online Shop sends a request to an Online Payment Server
The server returns a parameter needed in order to proceed with the payment
Online Shop redirects the customer to an Online Payment Webpage
The customer provides a card or online banking info on an Online Payment Webpage and completes the payment
Online Payment Server returns a response to a Merchant (Callback)
The transaction is successfully completed

Authentication Method
What I need to use the Payment API
An HTTP Basic Authentication is needed in order to use an Online Payment API. To do so, you need to know the merchant’s unique credentials for accessing the system. The credentials consist of two parameters: client_id and secret_key, which are used as a username and a password for the Merchant Authentication.

How to find out the Merchant’s system credentials
The company receives the client_id and the secret_key once it has been registered in the Bank system as a Merchant and has filled in all necessary data. Those credentials are the unique identifier for the Merchant. Along with that, a secret_key is used as a password. It is prohibited to make it public or disclose to a third party. Violation might increase the likelihood of danger for an Online Shop! Secret_key cannot be changed by the Merchant.

Method Description
Via the given method a Merchant passes the authentication. On calling this method, the Online Payment Server returns a ‘Bearer Token’ which is used as a mandatory parameter for the authentication when calling all further methods.

client_id: 1006
secret_key: 581ba5eeadd657c8ccddc74c839bd3ad

Header:
Authorization: Basic MTY2Njo1ODFiYTVlZWFkZDY1N2M4Y2NkZGM3NGM4MzliZDNhZA==

HTTP
POST /api/v1/oauth2/token HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <base64>

Order Request
By calling this method an Online Shop sends the payments details, technical parameters, and a payment amount to a Payment Server. To proceed further in case of the successful operation, a customer should be redirected to an Online Payment Webpage as per a REDIRECT URL returned in a links parameter

Parameters
intent
required
CAPTURE | AUTHORIZE
Defines which payment method can be used by the customer for payment CAPTURE - allows a customer to choose either to perform payment via card or via using Bank of Georgia’s internet-banking credentials. AUTHORIZE - allows a customer to perform a payment only by providing a card information.

items
required
array
The list of products purchased in the Online Shop within a given purchase

amount
required
string
A price of a single purchased item
description
required
string
A name of a purchased item (description)
quantity
required
number
A number of purchased items
product_id
required
string
An ID of a purchased item in the Online Shop system
locale
optional
ka | en-US
Defines the language of the Online Payment Webpage on which a customer will be redirected.
Can have one of the following two values:

ka – Georgian
en-US – US English.
shop_order_id
optional
string
A Payment Indentificator from an Online Shop system (i.e.: An ID of a shopping Basket).

redirect_url
required
string
An address (URL) of a webpage of the Online Shop to which a customer will be redirected from the Online Payment System once the payment transaction is completed successfully or unsuccessfully

show_shop_order_id_on_extract
optional
boolean
Defines what kind of payment info will be shown to a customer on an Online Payment Webpage.
Can have one of the following values:
false - Customer will see in the payment statement the first 25 symbols of product description list divided by “,” from items array.
true - the payment statement will be similar to the case of "false", however it will be prefixed with a shop_order_id.

capture_method
optional
AUTOMATIC | MANUAL
Payment method which can have one of the two following values:

AUTOMATIC - Payment will be performed without a pre-authorization, meaning that a Payment Amount will be immediately deducted from a customer’s account balance.
MANUAL - A Payment Amount will be blocked on a customer’s account balance and will not be available for a customer. In this case, the pre-authorization method should be used to complete the payment transaction or the return method should be used to unblock/return the Payment Amount. The Payment Amount is automatically unblocked and available for a customer.
If the operation is not completed in 30 days.

purchase_units
required
array
Contains information about the Payment Amount and currency.

amount
required
object
A Payment Amount object

currency_code
required
GEL
A payment currency. Always should have a value "GEL".

value
required
number
A Payment Amount value.

REQUEST
POST /api/v1/checkout/orders
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "intent": "CAPTURE",
  "items": [
    {
      "amount": "10.50",
      "description": "test_product",
      "quantity": "1",
      "product_id": "123456"
    }
  ],
  "locale": "ka",
  "shop_order_id": "123456",
  "redirect_url": "https://demo.ipay.ge?shop_order_id=<shop_order_id>",
  "show_shop_order_id_on_extract": true,
  "capture_method": "AUTOMATIC",
  "purchase_units": [
    {
      "amount": {
        "currency_code": "GEL",
        "value": "10.50"
      }
    }
  ]
}

Response
status
string
A status of an Online Payment.

payment_hash
string
A unique hashed payment identifier generated by an Online Payment System during requesting an order. On the next step, a hashed identifier will be again passed from the Bank to a Merchant. Verifying the identifier provides additional security.

links
array
Addresses of the web resources which are used on the next steps of the payment process. There are two kinds of resources which could be returned at the moment:

A Payment Details Address which gives the possibility to retrieve information regarding the online payment (rel = self).
A webpage Address on which a customer should be redirected to fill in the plastic card details or the online banking details and to finalize a payment process (rel = approve).
href
string
A Web resource Address.

rel
string
A Web resource unique name.

method
string
An HTTP method that should be used to redirect on the web resource (GET, REDIRECT…)

order_id
string
An online Payment Identifier.

Payment Details
By calling this method an Online Shop can receive detailed information regarding a payment based on the payment identifier. A different response with payment details will be returned depending on which payment option is used (a card or an internet-banking user) and what kind of payment method is used (with or without a pre-authorization)

Parameters
order_id
required
string
An online payment ID returned to the Online Shop in response to the payment request method
REQUEST
GET /api/v1/checkout/payment/{order_id}
Content-Type: application/json
Authorization: Bearer <jwt_token>

Response
status
success | error | in_progress
Payment Status. Can have one of the three following values.

success - A payment is successful.
error - A payment is unsuccessful.
in_progress - A payment is not completed and if in one hour from an order generation a customer will not complete a payment, it will be automatically canceled and status will change to an error. This status is assigned to a payment when a customer is being redirected to the Bank’s Online Payment Webpage. While the change of this status happens once the payment is complete either successfully or unsuccessfully.
payment_hash
string
payment_hash should be stored on a Merchant side. The values received from a Callback method in a payment_hash and an order_id should be compared to the ones stored on a Merchant side.

ipay_payment_id
string
A payment ID that is shown on a payment receipt.
status_description
string
shop_order_id
string
A Payment ID from an Online Shop system (i.e.: An ID of a shopping Basket).
payment_method
string
Payment Method.

BOG_CARD A payment is performed with an authorization.
GC_CARD A payment is performed using a card.
BOG_LOAN An installment purchase.
BOG_LOYALTY A payment is performed utilizing PLUS or MR points.
UNKNOWN In case an order status is error or in_progress.
card_type
string
In this parameter, a card type is passed when a payment method is BOG_CARD or GC_CARD. In all other cases, an UNKNOWN should be passed in this parameter

MC - Mastercard
VISA - Visa
AMEX - American Express
pan
string
A 16-digit card number. Only the first 6 and last 4 digits are displayed. The rest digits are replaced by an * symbol. This parameter is filled only if a payment status is success and a payment_method is GC_CARD

transaction_id
string
Transaction ID. Is filled only when the payment status is success and payment_method is GC_CARD.

pre_auth_status
string
Pre-authorization status. Is returned only when during an order generation a capture_method is MANUAL and the order status is success

success - Pre-authorization is verified and the payment amount is transferred to a Merchant.
in_progress - Pre-authorization is in progress. A payment amount is blocked and it is possible to verify and unblock it.
success_unblocked - Pre-authorization is unblocked. A payment Amount is returned to a customer account and is available for a customer.
BOG Payment
Card Payment
Pre-auth Payment
{
  "status": "success",
  "order_id": "{order_id}",
  "payment_hash": "{payment_hash}",
  "ipay_payment_id": "{ipay_payment_id}",
  "status_description": "PERFORMED",
  "shop_order_id": "123456789",
  "payment_method": "BOG_CARD",
  "card_type": "MC",
}

Payment Amount Return
By calling this method an Online Shop can return a Payment Amount fully or partially. Return of a Payment Amount cannot be canceled. Calling method for returning a Payment Amount partially is possible until the sum of partially returned Payment Amount reaches the full paid amount.

Parameters
order_id
required
string
A payment ID for which a return of the Payment Amount is performed
amount
optional
number
An amount to be returned back. Passing a value in this parameter is mandatory when the partial return is performed. The full amount will be returned back when this parameter is not passed. The value passed in this parameter cannot be greater than or equal to the full Payment Amount
REQUEST
POST /opay/api/v1/checkout/refund HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer <jwt_token>

order_id=order_id
amount=amount

Recurring Payments
The recurring Payments method gives a possibility to store a customer’s data and to perform a payment without a customer’s interaction.

To perform a Recurring Payment an order_id from a successfully performed payment transaction is needed.

An order_id can be received after at least the 0.10 GEL payment is successfully performed and then returned back. This order_id can be further used in a future Recurring Payments

In most cases, the Payment Status will be in_progress. To receive a current status the Payment Details method should be used.

note
By default, the feature of Recurring Payments is switched off. A Bank of Georgia should be contacted to activate this feature.

Parameters
order_id
required
string
An identifier of a successful payment performed by a given customer.
amount
required
object
A Payment Amount object.
currency_code
required
GEL
A payment currency.
value
required
number
A Payment Amount value.
shop_order_id
optional
string
A Payment identifier from an Online Shop system (i.e.: An identifier of a shopping Basket).
REQUEST
POST /api/v1/checkout/payment/subscription
Content-Type: application/json
Authorization: Bearer <jwt_token>

{
  "order_id": "<order_id>",
  "amount": {
    "currency_code": "GEL",
    "value": "16.45"
  },
  "shop_order_id": "your_shop_order_id",
  "purchase_description": "test_product"
}

Response
status
required
string
A status of a Recurring Payment.

success - A Recurring payment is successful.
error - A Recurring payment is unsuccessful.
in_progress - A Recurring payment is in progress. When this status is returned, a Payment Details method should be used to retrieve a payment status.
payment_hash
optional
string
A payment_hash of a Recurring payment.
order_id
optional
string
An ID of a Recurring payment.
RESPONSE
{
  "status": "success",
  "payment_hash": "<payment_hash>",
  "order_id": "<order_id>"
}

Pre-Authorization
This method gives a possibility to complete a deduction of an amount that was blocked during an Order method. The method is valid only if the value passed in a capture_method parameter was MANUAL when calling an Order method

Parameters
order_id
required
string
An online payment identifier returned to the Online Shop in a response of the payment request method.

auth_type
required
FULL_COMPLETE | PARTIAL_COMPLETE | CANCEL
FULL_COMPLETE Blocked amount during order request will be fully completed.
PARTIAL_COMPLETE will be completed part of the amount sent in amount parameter.
amount
optional
string
Is needed only in case (PARTIAL_COMPLETE). Should not be equal or more than full amount.

REQUEST
REQUEST
POST /api/v1/checkout/payment/{order_id}/pre-auth/completion
Content-Type: application/json
Authorization: Bearer <jwt_token>

FULL COMPLETE
PARTIAL COMPLETE
CANCEL
{
    "auth_type" : "FULL_COMPLETE",
}

Response
status
string
A status of a payment pre-authorization. Can take the following value.

success - A Recurrent Payment is successful.
description
string
A Status description. Can have one of the following two values

Pre-authorization successfully completed - A Pre-authorization is successfully completed.
Already completed successful - A previous Pre-authorization is already verified.
RESPONSE
{
  "status": "success",
  "description": "Pre-authorization successfully completed"
}

Callback
Unlike the previous methods which are called by the Online Shop, Callback is called by an Online Payment System, while the information should be received and processed on an Online Shop side. This method gives a possibility to receive real-time information about the status change. A Callback URL is assigned to each Online Shop when the latter is registered as a Merchant in a Bank system (see the introduction). Two kinds of Callback URLs can be assigned in a Payment System to a Merchant:

After the Payment Status Change
After the Payment Amount Return
After that each time when the Payment Status is changed, the Payment Details are sent via POST method on a Callback URL To confirm the successful receiving of a Callback method request, a Merchant should return an HTTP CODE 200. In case of the unsuccessful result of sending via POST method of the Callback, the method is called again with 15-second intervals until the number of attempts reaches 5 or Merchant returns an HTTP CODE 200 status. In case the Callback could not be successfully called, the payment status is still successful. It is advised to use a Payment Details method to verify the payment details.

note
A Callback is not related to the redirection to the Online Shop Webpage from the Merchant’s payment system. A redirection happens according to a value passed by Merchant in a redirect_url parameter of an Order request method.

Payment Status Change callback
BOG payment
Card payment
Pre-auth payment
  Content-Type: application/x-www-form-urlencoded
  Request Method: POST

  status: success | error 
  order_id: string
  payment_hash: string
  ipay_payment_id: string
  status_description: string
  shop_order_id: string
  payment_method: GC_CARD | BOG_CARD | BOG_LOYALTY | BOG_LOAN | UNKNOWN
  card_type: MC | VISA | AMEX | UNKNOWN

Payment Amount Return callback
JSON EXAMPLE
  order_id: string
  payment_hash: string
  ipay_payment_id: string
  status_description: string
  shop_order_id: string
  payment_method: GC_CARD | BOG_CARD | BOG_LOYALTY
  card_type: MC | VISA | AMEX


  Glossary
An Online Payment Webpage – An online payment system that allows to easily embed a payment module in any kind of Online Shop.
Online Shop – A webpage or an application, which allows the customer to purchase an item or a service via the internet.
Merchant – A retail trade or service company that possesses an Online Shop.
A Merchant Primary Fields –A Company information, mandatory to be registered as a Merchant.
A Merchant iPay Parameter –A Merchant information that should be provided to a Bank to allow a Company to perform payments on an Online Payment Webpage.
A Card Number (PAN) – A 16-digit number displayed on the front of the plastic card.
An Amount Blocking – A card operation that results in the reservation (making unavailable) of the portion (amount) of the card balance. After this, the Amount Blocking should - be approved (Amount Deduction) or the Amount should be Unblocked and thus become available again.
A Pre-authorization – A two-step payment method. On a first step an amount is reserved from a customer’s account/card balance, while on a second step an operation is being completed (amount deduction)
Callback – A request performed by the Bank System to a service published by an Online Shop to provide updated information regarding the payment.
A System Credentials - A client_id and the secret_key provided to a Company once it has been successfully registered in the Bank system as a Merchant and has filled in all necessary data.
