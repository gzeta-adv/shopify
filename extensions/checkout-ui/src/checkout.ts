import { extension } from '@shopify/ui-extensions/checkout'

const COD_REGEX = /contrassegno|cash on delivery/i

export default extension('purchase.checkout.shipping-option-list.render-after', () => {
  const shippingMethodsSection = document.querySelector('#shipping_methods')
  if (!shippingMethodsSection) return

  const shippingMethods = Array.from(
    shippingMethodsSection.querySelectorAll<Element & ElementCSSInlineStyle>(':scope > div > div')
  )
  if (!shippingMethods.length) return

  const codMethod = shippingMethods.find(method => method.textContent?.match(COD_REGEX))
  if (!codMethod) return
  codMethod.style.display = 'none'
})
