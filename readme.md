# BexQR

## Install

### Script tag

- Put this script tag `<script src='https://unpkg.com/bexqr@latest/dist/bex-qr.js'></script>` in the head of your index.html

### Node Modules
- Run `npm install bexqr --save`
- Put this script tag `<script src='node_modules/bexqr/dist/bex-qr.js'></script>` in the head of your index.html

### In a stencil-starter app
- Run `npm install bexqr --save`
- Add `{ name: 'bexqr' }` to your `collections`.

## Usage

Insert the element in your code and enter your custom properties:

```html
<bex-qr address="BQQsQfMLneMx4AjvCUvgX3CRSi1wJHdf1j" amount="12.17"></bex-qr>
```

## Examples

```html
<body>
<bex-qr address="BQQsQfMLneMx4AjvCUvgX3CRSi1wJHdf1j" amount="12.17" vendor-field="Greetings%20Martian!" size="200" show-logo="true">
<script>
  document.querySelector('bex-qr').getURI();
  // => bex:BQQsQfMLneMx4AjvCUvgX3CRSi1wJHdf1j?amount=12.17&vendorField=Greetings%20Martian!
</script>
</body>
```

Generate this QR code:


## Properties

| Attribute | Description | Type | Required |
| --- | --- | --- | --- |
| address | BEX recipient address encoded in Base58. | String | Yes |
| amount | Amount in BEX (ƀ) or TEX (Ⱦ). | Number | No |
| label | Recipient label string. | String | No |
| size | Size of the QR code (pixels) | Number | No |
| show-logo | Display the BEX currency symbol in QR code | Boolean | No |
| vendor-field | Vendor field string (encoded URI). | String | No |

## Methods

You can interact with the component data using the methods below:

### `getURI()`

Format the properties entered to the **BEX URI scheme**.

```javascript
document.querySelector('bex-qr').getURI();
// => bex:BQQsQfMLneMx4AjvCUvgX3CRSi1wJHdf1j?amount=12.17
```

### `getDataURL([mime])`

Generates a base64 encoded data URI for the QR code.

```javascript
document.querySelector('bex-qr').getDataURL();
// => data:image/png;base64,iVBORw0KGgoAAAANSUhE...n6ofvMC4I9AAAAAElFTkSuQmCC
```

### `validateURI(uri)`

Validate an URI string.

```javascript
const uri = 'bex:BQQsQfMLneMx4AjvCUvgX3CRSi1wJHdf1j?amount=12.17';
document.querySelector('bex-qr').validateURI(uri);
// => ["bex:BQQsQfMLneMx4AjvCUvgX3CRSi1wJHdf1j?amount=12.17", "BQQsQfMLneMx4AjvCUvgX3CRSi1wJHdf1j", "?amount=12.17"]
```

### `deserializeURI(uri)`

Deserialize the URI scheme to a JSON object.

```javascript
const uri = 'bex:BQQsQfMLneMx4AjvCUvgX3CRSi1wJHdf1j?amount=12.17&vendorField=Greetings%20Martian!';
document.querySelector('bex-qr').deserializeURI(uri);
// => { address: 'BQQsQfMLneMx4AjvCUvgX3CRSi1wJHdf1j', amount: 12.17, label: null, vendorField: 'Greetings Martian!' }
```

### `fromObject(obj)`

Instantiate a URI from an Object.

```javascript
const obj = { address: BQQsQfMLneMx4AjvCUvgX3CRSi1wJHdf1j, amount: 12.17 };
const element = document.querySelector('bex-qr').fromObject(obj);
// => <bex-qr address="BQQsQfMLneMx4AjvCUvgX3CRSi1wJHdf1j" amount="12.17">
```

## Authors
- Jared Rice Sr. <jared@benchcore.io>
- Distributed Webs Project, LLC <foundation@distributedwebs.org>
- Lúcio Rubens <lucio@ark.io>

## License

BexQR is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
