import { TestWindow } from '@stencil/core/testing';
import { BexQRCode } from './bex-qr';

describe('bex-qr', () => {
  it('should build', () => {
    expect(new BexQRCode()).toBeTruthy();
  });

  describe('rendering', () => {
    let window;
    let element;

    beforeEach(async () => {
      window = new TestWindow();
      element = await window.load({
        components: [BexQRCode],
        html: '<bex-qr></bex-qr>'
      });
    });

    it ('should work without params', async () => {
      await window.flush();
    });

    it ('should work only with address', async () => {
      element.address = 'BQQsQfMLneMx4AjvCUvgX3CRSi1wJHdf1j';
      await window.flush();
    })

    it ('should work vendor-field without special characters', async () => {
      element.vendorField = 'Hello';
      await window.flush();
    });

    it('should work vendor-field with special characters', async () => {
      element.vendorField = 'Hello%20Bex!';
      await window.flush();
    });

  })
})
