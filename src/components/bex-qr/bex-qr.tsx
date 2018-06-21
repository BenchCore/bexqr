import { Component, Prop, Watch, State, Method, Element } from '@stencil/core';
import QRious from 'qrious';

@Component({
  tag: 'bex-qr',
  styleUrl: 'bex-qr.scss',
  shadow: true
})
export class BexQRCode {
  @Element() element: Element;

  @Prop({ mutable: true }) address: string;
  @Prop({ mutable: true }) amount: number;
  @Prop({ mutable: true }) label: string;
  @Prop({ mutable: true }) vendorField: string;
  @Prop({ mutable: true }) size: number = 100;
  @Prop({ mutable: true }) showLogo: boolean = false;

  @State() isLoad: boolean;

  @Watch('address')
  validateAddress () {
    const pattern = /^[Bb]{1}[0-9a-zA-Z]{33}$/g;

    if (!this.address) throw new Error('address: required');
    if (this.address && !this.address.match(pattern)) throw new Error('address: not valid ark recipient');
  }

  @Watch('amount')
  validateAmount () {
    if (typeof Number(this.amount) !== 'number') throw new Error('amount: invalid amount');
  }

  @Watch('vendorField')
  validateVendorField () {
    if (typeof this.vendorField !== 'string') throw new Error('vendorField: must be a UTF-8 encoded string');
    if (decodeURIComponent(this.vendorField).length > 64) throw new Error('vendorField: enter no more than 64 characters');
  }

  @Watch('size')
  validateSize () {
    if (typeof this.size !== 'number') throw new Error('size: must be a number');
  }

  @Watch('showLogo')
  validateShowLogo () {
    if (typeof this.showLogo !== 'boolean') throw new Error('show-logo: must be a boolean');
    if (this.showLogo && this.size < 150) throw new Error('show-logo: to display the logo the size must be greater than 150');
  }

  @Method()
  getURI(): string {
    if (!this.isLoad) throw new Error('component not loaded');

    return this.generateSchema();
  }

  @Method()
  getDataURL(mime: string = 'image/png') {
    const canvas = this.element.shadowRoot.querySelector('canvas');

    if (!canvas) throw new Error('qrcode element not generated');

    return canvas.toDataURL(mime);
  }

  @Method()
  deserializeURI(uri: string) {
    let validate = this.validateURI(uri);

    if (!validate) return;

    const queryString = {};
    const regex = new RegExp('([^?=&]+)(=([^&]*))?', 'g');
    validate[2].replace(regex, (_, $1, __, $3) => queryString[$1] = $3)

    const scheme = { address: null, amount: null, label: null, vendorField: null };

    for (let prop in scheme) {
      scheme[prop] = queryString[prop];
    }

    scheme.address = validate[1]
    scheme.amount = scheme.amount ? Number(scheme.amount) : null
    scheme.label = scheme.label ? this.fullyDecodeURI(scheme.label) : null
    scheme.vendorField = scheme.vendorField ? this.fullyDecodeURI(scheme.vendorField) : null

    return scheme;
  }

  @Method()
  validateURI(uri: string) {
    const regex = new RegExp(/^(?:ark:)([AaDd]{1}[0-9a-zA-Z]{33})([-a-zA-Z0-9+&@#\/%=~_|$?!:,.]*)$/);

    if (regex.test(uri)) return regex.exec(uri)
  }

  @Method()
  fromObject(data: any): Element {
    this.address = data['address'];
    this.amount = data['amount'];
    this.label = data['label'];
    this.vendorField = data['vendorField'];
    this.size = data['size'];
    this.showLogo = data['showLogo'];

    this.isLoad = true;

    return this.element;
  }

  generateSchema(): string {
    const params = this.formatParams();
    const uri = `ark:${this.address}${params}`;

    const scheme = JSON.parse(JSON.stringify(uri));

    return scheme;
  }

  generateQRCode(scheme: string): QRious {
    const level = this.showLogo ? 'M' : 'L';

    const qr = new QRious({
      element: this.element.shadowRoot.querySelector('canvas'),
      value: scheme,
      size: this.size,
      level,
    });

    return this.drawLogo(qr);
  }

  drawLogo(qr: QRious): void {
    if (!this.showLogo) return;

    const ctx = this.element.shadowRoot.querySelector('canvas').getContext('2d');
    const img = new Image();

    img.onload = () => {
      const logoWidth = img.width;
      const logoHeight = img.height;
      const width = qr.size / 3.5;
      const height = logoHeight / logoWidth * width;
      var x = (qr.size / 2) - (width / 2);
      var y = (qr.size / 2) - (height / 2);
      var maskPadding = qr.size / 50;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.drawImage(img, 0, 0, logoWidth, logoHeight, x - maskPadding, y - maskPadding, width + (maskPadding * 2), height + (maskPadding * 2));

      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(img, 0, 0, logoWidth, logoHeight, x, y, width, height);
    }

    img.src = 'data:image/png;base64,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';
  }

  formatParams(): string {
    let params = [];
    const vendorField = encodeURIComponent(this.fullyDecodeURI(this.vendorField));

    if (this.amount) params.push(`amount=${this.amount}`);
    if (this.label) params.push(`label=${this.label}`);
    if (this.vendorField) params.push(`vendorField=${vendorField}`);

    const stringify = params.length > 0 ? `?${params.join("&")}` : '';

    return stringify;
  }

  fullyDecodeURI(uri) {
    const isEncoded = (str) => str !== decodeURIComponent(str);

    while (isEncoded(uri)) uri = decodeURIComponent(uri);

    return uri;
  }

  componentDidUpdate() {
    const scheme = this.generateSchema();
    return this.generateQRCode(scheme);
  }

  componentDidLoad() {
    if (this.amount || this.vendorField || this.label || this.address) {
      this.validateAddress();
      this.validateAmount();
      this.validateVendorField();
      this.validateSize();
      this.validateShowLogo();

      this.isLoad = true;
    }
  }

  render() {
    return (
      <div>
        <canvas></canvas>
      </div>
    );
  }
}
