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

    img.src = 'data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4KPHN2ZyB3aWR0aD0iODlweCIgaGVpZ2h0PSI5MHB4IiB2aWV3Qm94PSIwIDAgODkgOTAiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+CiAgICA8IS0tIEdlbmVyYXRvcjogU2tldGNoIDQ5LjIgKDUxMTYwKSAtIGh0dHA6Ly93d3cuYm9oZW1pYW5jb2RpbmcuY29tL3NrZXRjaCAtLT4KICAgIDx0aXRsZT5BcnRib2FyZDwvdGl0bGU+CiAgICA8ZGVzYz5DcmVhdGVkIHdpdGggU2tldGNoLjwvZGVzYz4KICAgIDxkZWZzPjwvZGVmcz4KICAgIDxnIGlkPSJBcnRib2FyZCIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPGVsbGlwc2UgaWQ9Ik92YWwiIGZpbGw9IiM5MjFGRjgiIGN4PSI0NC41IiBjeT0iNDUiIHJ4PSI0NC41IiByeT0iNDUiPjwvZWxsaXBzZT4KICAgICAgICA8aW1hZ2UgaWQ9IsaALWxvZ28iIHg9IjI0IiB5PSIxOSIgd2lkdGg9IjQxIiBoZWlnaHQ9IjQ5IiB4bGluazpocmVmPSJkYXRhOmltYWdlL3BuZztiYXNlNjQsaVZCT1J3MEtHZ29BQUFBTlNVaEVVZ0FBQUt3QUFBRE1DQVlBQUFEdXhVaUNBQUFBQkdkQlRVRUFBMXRlWFA4bWVBQUFGVWxKUkVGVWVBSHRuUW0wSFVXWngxK01zZ2JEWWh4QVlnS3lCWVJSTUJDSmhIZ1FrSWdESXVBd1o0Q0lDanBIRUFFVmo0Y2xVUmx4VUZtRWd4NlpRUmhXR1J3UWdnZ01JREdzSnV5Z0xIa2tFRWd5Z0t3R0lzVGYvM0g3NWI3Nzd0SnJkWGZWOTUzemY5MjNsL3JxKzlmLzFxdXVxcTdiMTJkbURCZ0R4b0F4WUF3WUE4WkEzNGl5T0ZpeFlzVXErTjRmYkFjMmFPQWYyT3A0R2ZZM25DNEU4MEYvWTN2L2lCRWpIbURmTEZRR0VPcElNQU1zQm5Xd1dXUnloMURMSy9pNEtmeFQ2NkRTTm5tOGhtTVRnaS9Ba2dsdzJpU2d3UGNrM2xrbHg1ekYvWFBjL0FtYUNmZGtTY1R1VGMvQU85TGZtdXJPUFZMZFZaMmIxaU1yMS9MRkcxMmRMSVdWRTllQy9VY1A2RjJmR0daNkVFY3RRM0RkSk5CVCtFYTFaR3BvcGwvaTR4aWFCbThNUFd5ZmltYkFkUTNyMmw5Ui9MMmJoS2NXbGJpbDI1a0JYd1RVT2NMaXpteGFYTktXY2ljR1RMQ2RtT2w5WElNY1pvNFpNTUdtSi95VjlMZmFuV2taTU1HbVphNnZiMUg2VyszT3RBeVlZTk15MTlkbmd3ZnB1VXQ5cHdrMkhYWDMwS1gxWUxwYjdhNHNESmhnMDdIMy9YUzMyVjFaR1REQkptZndMR3JYeTVQZlpuZmt3WUFKTmo2TEd0VTZGaHdSL3hhN01tOEczcGwzZ2g2bXB3bmRGNEx6cUZrZjl6QytXb1ZrZ24yN3VOU251aFFzQWVxdXVoL2MxOEJqQ0hVRisyWVZZTUFYd1Q0S2w0ZjI0Rk92d0N3SCt0Y2U0WFgybjBlUXk5aWExWUFCWHdUN0txS2JYUU8rTFlzWkdiQ0hyb3dFMnUxdUdUREJ1dVhidkdWa3dBU2JrVUM3M1MwREpsaTNmSnUzakF5WVlETVNhTGU3WmNBRTY1WnY4NWFSQVJOc1JnTHRkcmNNbUdEZDhtM2VNakpnZ3MxSW9OM3Vsb0d1STEyc2NLS1ZCTGNCNDhCWW9CZnZWZ2VyTlRDU2JSSmJKOG5GQ2E0ZFIxN1BUM0I5V1plK2hXTU5BLysxZ1dmWjlnTk5zSG1JMGJvMzJacDFZV0RZUWhvVS9KcGMvM21ncFRDMWFwL0VhVlk4QTFxYzQxWndNYmdNOFdyZWcxa0xBME1FaTFpMWxOQ05RR3RJbVpYSHdBSmNUME8wOWhwT1N4a01DaGF4anVmY0hLREZoYzNLWjBETmhTbUlWalBSekJvTURBZ1dzYTdLWjgzLzNOeVlxUlFEV290c0IwUXI4WnJCUU5STG9BY3JFMnYxSktFSDNXblZ5MVo1T1lvRXUzMTVXVERQUFJpWTFPTjhVS2Nqd1c0WFZOVDFDdFlFMjFSZWtXQjlXTE8xS1N5dmRqZjJLcHFNd1VTQ3RXVjNNaEpaNE8wUEY1aDI3WktPQkh0WDdYSWVUb2J2RFNmVTNwRkdncjJ6OTZWMlJVa01tR0NiaUI4UUxQMThpemgyWE5OeDI2MEdBNCtRRFMzaVlkWmdJS3BoK3hEdEtSeWJhY3hVaGdFdDZxSGgyUmNxazZNS1pHUlFzTW9MNUp6STVoQmdEMkVpcEJ6VGpLNnJnSDdBVHJPNHpKb1lHSnhMMEhSc1lKZmgyazNabVF3bWduRkFYVi9OMHdzMW5OdnhmczZadFdkQXM3QzA0b3p3TWxCelRIZ2MzQUhtSU5URmJNM2FNSkJKY0loNlNBM2RKdjNXUTA5eG9JakpOZnFQVUlmUnVoV0ljVVVyS2ZZNVBnTmRKM0QzU2dieTllOHJ0aUh3d2dvcmFWNWlaOW91ckJRRFNXdklTbVhlTWhNZUF5Ylk4TXE4MWhHYllHdGRmT0ZsM2dRYlhwblhPbUlUYksyTEw3ek1tMkRESy9OYVIyeUNyWFh4aFpkNUUyeDRaVjdyaUUyd3RTNis4REtmYWFRclBMcnlpWmdCUC9FK3FnR3R0S045YmJWVTBhdXRZQlJQdjRCakJnTW0yQUprZ0NESGtPeG1MZGlVejVwRXRCWllCY1EyMHRQUE5HbWE0WHlnU1RMQ0UwM2JaMEtabzJDQ3BkU3pXS08yL0FocGZMd0JyVWMyT2t1YWJlNlZ3RFZUVG1qM0Z1M0w1T04yem1sdHJ0bmdEZ1Q4R2x2dnpBU2Jva2dSaDE2TDN4VklwQjhEcWpYTE5QbmZyUUhsWXpsNW5NdFc0cjBSM0lDQXZWaGNMdFAwUW9oSVpKRDRORGRzbU9pbWVCZmZRNEY4T042bDZhNGk3NW9XZVJENFBOZ3lYU3FsM2ZVY252OEhhR1hFMzhOVm9sbDJwZVc2aldNVGJCdFNva09JVkpQVS93bE1CM3VBa2FEdXBzbmlsNEdMRVc3dFhqNDF3YmFSSDBKVkcvUm84Rld3YnB0TGZEa2t3ZjRBWEZtWFd0ZjZZWnVraDFEWEJOL21rSjdHVHdBK2kxV1I2d0h4Q3ZBZ2NSOEtFdlZlS0FIWFpvS0ZjUXBxTmZCMWR0VlZkREpZQjRSa2FwT2ZDNTZBaDZQQkdsVU5QbmpCVWpqN1VqaVBnUitEOTFhMW9Cemw2MzM0K1JGNEdGNCs0OGhuSWpmQkNwWUNXUmRjQkZ0NmVsWkJtYTFrNFAzc1hnRS8xNEpOVng0dWZ5OUl3VklJbjRaNi9YN0FnZVVYUWFWejhFbHk5d0I4elFUNjlhRFNMU2pCUXZyYTREeFl2d3FzWHpyNzljaUF1dmFPQncvQjNjNWxaemtZd1VMMkZwRDlSM0JJMmFUWDFQOTQ4bjBUUEg0Yk9PME9iZVlyQ01GQzhGU0N2ZzFzMGh5ODdTZG1RQU1uNmtXWkJhZnZTWHgzRGpkNEwxaUlQUmllcmdPaGRWWGxJSStPU2FodE93OXVOWS9DcVhrdFdBaWRDWnUvQkpYdkVIZGE2dms0MjRoa2JvTGpZL0pKTGw0cVhzN1dna1Mxc2Y0VFRJOUhnMTJWa2dIcDUxVDRWcmZnTVF6dnJraVpUdXpiZksxaHo0Q0I2YkZac0F1ek1xQlJ3dk1RYnVFVm9IZUNoYlFaa0tkSksyWnVHZEN6d3EvaHY5RCtXcThFQzFsSFF0b0pic3ZKdkRVeHNCZjcxMUVPZWI5eE1lakNHOEZDMGtGRWRkcGdaTFpURmdNYVhMaVo4bGk3aUF3NDdRQW1pS0xlT0hnSmNqVERxUEEyVkJHRjRHbWF0eExYN2p5SUxjc3pQbDhFbXljbmVhV2wxN1VmQUpwYkt6elIyQzVscXhjRWRUN2E2dWxhcjNuclM2ZXRvSDdqamNFbWphMzJ0d0oxNmsvK05mbmRMOC9KNFNaWUdNM0puaUtkMmVBUFlBNjRqNEw2Rzl2Y2pQOVFLcThKWUNjd3VZSE4yRmJaem9HSHIrU1ZRUk5zTmlZWGNQdXZ3S1VVeWwzWmtrcDNOeUxXNU92UE5TQXhWOUZPZ0ovdjVwRXhFMnh5RnJXb2hlYlIvZ3pvL2YvQ084dmpaaEh4YnNPMTA4RmhRS3ZKVk1tK0FGY2F6TWxrSnRqNDlMM0lwUkxwNlJDL0tQNXQ3cTlFdUhwQy96ZWdiajR0dmxFRmU1MU1mQlR1NW1YSmpBbTJOM3Q2eWowRi9BaXk5YnRhdFRHRXV4cVpWVzA3QXhUU3paU1FqRDl6L2ZidytFckMrd1l2OTZZZmRqQ2lmSGV1SkxtdElQaWt1b2xWTkpEblpVREQxSm9ML0V0UWR2TmxjL0p3RnFpSDhZMS9HdFRCK3Nta3B0QjVaY1EwR2VpVjdySk5nenlwekdyWTRiU3BWdjB3TmROdmg1K3E5eEZpVXBmYlJLRGF0a3c3bTIrTWF0dkVab0pkU1ptZS9vK2lVUGNCTDZ3ODdOY2VzYjBHcGhQVkYwR3VvMUFKbUZJUHhrV0lOckgrRXQrUUlGTjF1blFwbWQyWmdqeTlUcG5Pa2xkaVBaZjdKd0VOZUpSaCttMWdQUkFtTXVzbDZPdDdFc1kwNXEwbjJPQ01XbTQ4UWQ4QVBsQkM4TS9oYzNPNGZ6NnU3OUJyMkFjaGFuS29ZcFZJaUwyZmpXWllpUXZYdGg0T0U0MkFoU3pZdVpBMWhRTFRETEtnRFE2ZWdZQmRnRGh4YllkVHkyOGIxMm1vZ3RYTXFXa1VWT3gvUlhFSnJldDFjS0YvejU4Q2FpSzV0SkU0T3pPdXd4QUZxd2VzVDFKQWkrT1NGTXAxY1BJc3NVcTBHb1oyYVZPb1pmZU40ekEwd1dyKzZWNFV6S054eUFueEdyaFJXL2F6WUxuaitMOFZ4MTlvZ2oyTUFya3pEakVoWHdOSE54TC9zWTQ1MklGYWRrb3ZueUVKOWdJSzRzSmVoTmo1UVFiVXJ2emQ0Q2MzT3oyL0pLSDB3ejRHMzlzaDJKZmQ4TzZIRjJxOERZbmtmckN1bzRnME9VZVRqUjdwNUMrRUdsYXZxUnhvWXUwa2djN0g0V3dSWjNON3ZhV3pwOEV6cWtDUEdmelVaaWNFd1o0TjhYZTNpZDBPeFdBQTdpN2pzbXRpWEpyWEpRZFJzM2RjdXQ5M3dhcHY4YVM4bUF3NG5XOFMrNXVPNGw4VlAzcEhyYTM1THRqanFTRzhuWG5WdGtRTE9BaUhENUZzNXZleEVtVHRnRTdYK3Z6UXBUVUJQZ1Racm1xR1RoeDdjWngvMCtzVGlCNWUxM1FRa0I2K3hsSjJ3NGJOZmE1aGYyQml6VTlhY0tsUnNIUHlTN0ZyU3FwSTkydDNoYStDMVRkVER3dG0rVEp3TnNtOWxXK1NIVk5yMjQ3MVZiQm5VaU80SGxyc3lMd3ZKK0JVazRabU9ZcG5FczJRc2EyK2ZCVHNxd1NwOVFQTWltRkFJMkF1VE0yQ3ZWc2QrU2pZLzZVbStFdHJvUFk1TndhdUp5WFZ0QzVzNTFZblBncjI4dFlnN1hOK0RGQVo2QW4raXZ4UzdKclNUcTFuZlJQc0t3VDQyOVlnN1hQdURPaFZlQmUyRWUzWTl6Yzc4azJ3VjFNRExHc08wUFlMWVdBT3FXb2l2QXViM096RU44RmUxUnljN1JmREFKV0N1clorVTB6cXcxTDFXckIvR0JhdUhTaUtBVDE4dWJBaDdWaWZhdGhGZlBNWHVHRFFmQXd3NE9yTmpXMXB4MnBDeklENUpOamJvcUJzV3p3RFZBN3EydEpzdUtKTmI5V09pNXo0SkZnOUNKaTVaZUF1Uis0MmlmejRKRmpOempKenk0Q3Jac0hHVVZnK0NYWitGSlJ0blRId3NDTlAzdFd3Nm1aNTBoRjU1bVlsQTY0NDkwNnd6L0FROE1aS0htM1BFUU1MSFBueHJrbGd6UUZIeW1seG8wWGtscmNjSytMaitDaFJYOXF3THJwWElzNXMyMkNnTWVMbFlrSGswUkhwdmdqMnRTZ2cyenBuWUlrRGorOWc4RUEvNGRSbmduWEF0dWN1WEZVV0F5OC8raUpZdldWZ1ZnNERyZ1M3aHNMelJiQ3VTQ3RIRXRYMitsZEgyZk9xaG5YRW1ibHB3NENyeXNJcndRNEUwNFpNTzFROEEvclJZeGZtVlpOZ0lCZ1hySm1QWVF3TVBMMFBPNXIvZ1hjcFNWL2FzQ2JZL0FVU04wVlgvOTBHbWg2K0NOWVZhWEVMTWFUclhGVVdYZ25XMVFyUklRa3hicXl1S291QnJrdGZhdGp4Y2RtMTYzSm5ZSzNjVTJ5Zm9GYzE3SVlNM2EzU1BrNDdXakFEUTlZTktOQ1hWNExWZndwWHhCVllKdlZLbWtyaTNlVFlWWFBNcXlhQlNucTgvcGc1WldCd25tckJYbDluWnBoK1hNV2JiaTNGc3BYK21EbGx3SlZnRjBaUitmTFFwWGcrR2dWbFcyY01iTzdJMCtBRWZST3NJOFk5ZGVPcWt1aVArUE5Kc09ONENOZ2dDc3kyVGhnWXNveFFnUjY5ckdIRmw2dHZmSUZsVTQra3FSdytRRTdmNnlpMy9aRWZuMnBZeFRRdENzeTJoVFBncW5aVklON1dzSHZ6emRkYVRHYkZNN0JuOFM0R1BXZ2Ryd0h6cllaOUQxRk5mVHMwKzFzVUExUUttbEw0NmFMU2IwbDNJWDJ3UzZKanZnbFdjWDAyQ3M2MmhUR2cyblZVWWFrUFRYaklxcFErQ25ZL2FvREI5VVNIeG02ZmNtTGdnSnpTaVpQTTdjMFgrU2pZTVFUNEw4MUIybjUrREZBWmFGRUxWODBCWmR6N0dsWkJIcVUvWm9Vd2NEaXB1cG9EK3pxKzVqWkg0V01OcS9pMHpQaXV6WUhhZm5ZRzRGUlRPTCtXUGFYWUtjeHRYZVRQVjhHS2tXL0Vwc1V1ak11QW1sb2J4cjA0aCt0dWJVM0RaOEh1UVkyd1cydkE5amtkQTNDcC9tM1hsY0N3WDF6MFdiQXFtUjgzaUU1WFNuWlhNd05mNFlQTEtaeGFGZkhPNWd4bzMzZkJmcEFZOVpCZ2xvRUJ2dlFha0ptWklZazB0MTVCKzNWRjY0MitDMWJ4em9EdzlWb0R0OCtKR0RpWnE5ZEpkRWYyaTl2K3lIVUlnbFh0Y0c1Mi9zSk1nUys3ZmpyekM0NmpYNHkvdHI5cUdZSmd4YlVteFh6Wk1lbTFkd2RuZXNId1l1QmFKMm9PNklkV2hwbnJqQXpMZ01NRGVnQ2I0TkNmRDY3T0k0aXhKUVR5ODA0K1F4THM2cEJ3S2FKMXRmQkRKODVyY1J5ZXZrNUdYUTdCUnJ6Y1F1MTZUL1NoZFJ1U1lCWDdOdUJ5Q21OZ0pieFdNdXp6Mnd6QXo1N3NuVklTSHovcDVqYzB3WXFMM1VISGZ6bmR5QXJoSEdMVmEwWjZRaS9qUy8wNGZuL1RqZWNRQlNzK3BsTXdNN3NSRStJNU9OSEF3TlZnalpMaVA2UFR3MWFVbjFBRnEvaVBwNEJPaklnSWZRc1hXbVBnZDhEVjBrT3RsTC9JZ2Y5cVBkajZPV1RCaW91VEtLalR3WWhXWWtMNlRQdzdFcS82UGQ5WFl0eW5VcnUrM011LzA0S0NtS2ZKa012WlByM2lqODZmejg2aEVQWm1kQ0NVTFdVeWpWaC9CY3BxQm9qcWhXQUwrTy81aXpTaDE3QWlTM1l3bUVYaGFWUXNHQ05lemJPNEVwUXBWdkY5WEJ5eDZrSVRyRmg0MjlSN01JOUMxRkNrMTBhTW84RWxCSGtPZUdmSndkNkJmNDJteFRJVDdGQ2FOdUxqelJTbTYzbWZRM05SNENkaW0wVHk4OERuQ25TVEpPbWpxVjJIemNycWxJQUpkamd6cW5GK1NNSE9CdHNPUDEzUEk4UXlDdnc3dWRjc2ZsZkxaUFlpNnhMRU9xZlhSYzNuVGJETmJBemRWOU5nTG9WOEd0QkswN1UwOGo0Q0hFVG0vd1NPQTJVM0FTSWVGN056WlBRaDd0WUUyNTBwdlJhaWwrNytSS0VmQ2NwK09PbWUyNWF6NUhkWERxa0dPeDlVclhkR3ZUSkxXN0xjODZNSnRpZEZBeGVzejkvVHdRSkVjQ0tvN0lSdzh2WXU4SzlBN2RRYmdOcXNWYk96RWV1c05KbXlmdGcwclBYMXZjcHRsd0k5M2Q0RSthWDMzeUxRcmNuTC91Q0xvTXdCQU54M3RVYzR1eDJjOWV4emJaZUtDYllkSzhtT0xlRnlUUlpSNS92dEZNU3laTGVudXhxQnF1ejBVTGd2a0ZBbmdLcmJjakk0Q1k3bXBzMW9ac0ZDbk5wNWE0TlJZRTJ3T3VpVTdyV2M4N2x6L2czaXV4dG9tSE0yVU1FOFRRSEY3cmJoK3JZR3orTHRRMkNuQm5aa0s5N3JaRitEaXpPeVpMaVRzRHFtQ1hGak9ma1o4REdnYi9WbVlGVmcxcDRCTGJmVEQ3VEdxYUFhV1UwSy9WQ2F0b0lFclFjNmZlR2pyUVM2Y1JOVUlkVFpmb3BZajhnYVFHekJJdFNKT1BzaG1KclZhWUgzYXk3bGxrQmZJclBxTUhBMVdka0h3V1p1NjhmcUpVQ3MvNEhETzhCVVVHVmJTdWIyQU05V09aT0I1VTI5RmYrY2gxakZXMC9CSWxaMTV4d0xZdGZHU3Jnc2c1ajUrTjRUdkZSV0hzenZJQU1MMmR1TE1sR3pKeGZyS2xqRStuRzhKQjZOeUNWbkdSS0JJTDNFcG5hMkhvTE15bUhnZWR4S3JJdnlkTjlWc0RnNkpVOW5MdE9DcVAvRG42WU5abjVDZDVsdlQzenB3WElxWlhCZjN2RjBGQ3kxcTNvRDlLQlZXNE93UzhuOFlTQnpZNysySkxqUHVDYnBUNEg3KzR0dzNWR3dPTnU5Q0lldTA0UzRYK0J6YjVCYk84cDFERFh5MTA5ZUpWWk50Q25FdWdsMmZDRWVTMGdVQXEvQjdTN0FlZytLNC85UmtwWlkxZGRjbUhVVDdKakN2SmFRTUVUK0ViZDY1MTVqMldiNU1xQVpZVHZEc1hvRkNyVnVnaTNVY1JtSlEyZy9malcwK2ZzeS9IdnE4NmZFcFFlc3hTN2k2eWJZd3RvaExnTHI1QU5pWCtEY0o4REp3QjdHT2hIVis3aG1XeDBNbjBjQVRXcHhZdDBFNisyL1RoRU12Z1BEbWcraHRwZFpNZ1kwT0xNVEhGNlE3TGJzVi9zbTJFVGZkQWkvSFFvMUErb3NZUDIxOGZSMENaZHREM2NhbkhGdTNRVDdKTG5wdVJLSDh4eDNkL2ovM1U4UFB3dnhyNEd2Y2taekVKNGFmb1VkYVREUXozWWFYQjBJMUt3cXhUb0tsa3k5Ulk1bWxKS3I5RTQxd3BMS2lQZDZidHdhZkE5WW4rMUtGdFhPUHhWc0RVZWF6MXlxZFJSc0kxZW5zUzJsNmsvSlNtckJ5aDhGOGhJNG50MU53SmtnOUxrSWQ4SEJSRGo1QnREODNkS3RxMkRKcEw1ZGh3SFZ0bFUzdFVGRmNHWWo3aVZBazM2MkFPZURPc1NmT2U2bUJPNW1YNk9ETzhMRHZLYmpwZTkyRmF4eVI0WWxndjFCMVVlSnJpT3ZqeXZQZVJucDlZTkRTRzliY0JIUTJ3TSsyMjBFcDNhcWF0V3JRSDBmUkprTXN3NzRCYWlpUFV1bTlJNVRvWWFQZGNGUjRBSGdpNzFGSU5jRDlVMVgzaEpQeWlhd2lVU2wvc3V0bXJCMkNaR3F2ZnBub0g5Wk02a05FdmNRWk1relBHakU3RXZnQUxCR2xyUkt1dmNoL0tvZjlVSzRLM3hJTmE4WUV3czJMOGUrcElOd1J4T0xmbTFsZDZCYWFnTlFWWHVHaktrZjliOFI2ZHlxWnJKYnZreXczZGhKY1E0QmY1RGJKTjdkd0JSUVp1MnI4ZjFiR3JpWjdjTzFicGNTZ0FrV0Vvb3l4THNxYVg4RVRBQmJObUU4K3lOQlhxYmVuQVhnc1FidVpYc0w0dlJ1ZU4wRVM4bTZ0b2FROVNxNnVzM0dnTFVhR05XMHIyT3FuVFhKUkFNWnJ6UVE3Yi9JNXllQVJEb2ZjUWJSWi94M09rdS9NeG5rRmZRQUFBQUFTVVZPUks1Q1lJST0iPjwvaW1hZ2U+CiAgICA8L2c+Cjwvc3ZnPg==';
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
