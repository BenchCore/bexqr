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

    img.src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iNTE4cHgiIGhlaWdodD0iNTA5cHgiIHZpZXdCb3g9IjAgMCA1MTggNTA5IiB2ZXJzaW9uPSIxLjEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiPgogICAgPCEtLSBHZW5lcmF0b3I6IFNrZXRjaCA0OS4yICg1MTE2MCkgLSBodHRwOi8vd3d3LmJvaGVtaWFuY29kaW5nLmNvbS9za2V0Y2ggLS0+CiAgICA8dGl0bGU+QXJ0Ym9hcmQ8L3RpdGxlPgogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+CiAgICA8ZGVmcz48L2RlZnM+CiAgICA8ZyBpZD0iQXJ0Ym9hcmQiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgICAgIDxlbGxpcHNlIGlkPSJPdmFsIiBmaWxsPSIjOTIxRkY4IiBjeD0iMjU2IiBjeT0iMjUzLjUiIHJ4PSIyNTYiIHJ5PSIyNTMuNSI+PC9lbGxpcHNlPgogICAgICAgIDx0ZXh0IGlkPSLGgCIgZm9udC1mYW1pbHk9IkNvdXJpZXJOZXdQUy1Cb2xkTVQsIENvdXJpZXIgTmV3IiBmb250LXNpemU9IjM3NyIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IiNGRkZGRkYiPgogICAgICAgICAgICA8dHNwYW4geD0iMTUxIiB5PSIzNjEiPsaAPC90c3Bhbj4KICAgICAgICA8L3RleHQ+CiAgICA8L2c+Cjwvc3ZnPg==';
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
