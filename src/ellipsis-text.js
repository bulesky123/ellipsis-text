class EllipsisText {
  constructor(el, options) {
    if (!el) {
      throw new Error('EllipsisText need a dom')
    }
    this._options = EllipsisText._mergeOptions(
      EllipsisText._defaultOptions(),
      options
    )
    EllipsisText._init.call(this, el, this._options)
  }

  static _defaultOptions() {
    return {
      str: '',
      row: 3
    }
  }

  static _init(el, options) {
    const _el = (this._el = el)
    const _computedStyle = (this._computedStyle = window.getComputedStyle(
      _el,
      null
    ))
    EllipsisText._getLineHeight(_el, lineHeight => {
      this._lineHeight = lineHeight || 0
      const _testOverflowDom = (this._testOverflowDom = EllipsisText._createTestOverflowDom(
        _el,
        lineHeight * options.row,
        options
      ))
      EllipsisText._computeResult(
        _el,
        options,
        _testOverflowDom,
        _computedStyle,
        lineHeight,
        res => {
          this._result = res
          options.callback && options.callback.call(this, res)
        }
      )
    })
  }

  static _mergeOptions(defaultOptions, options) {
    const mergedOptions = Object.assign(defaultOptions, options)
    return mergedOptions
  }

  static _computeResult(
    el,
    options,
    testOverflowDom,
    computedStyle,
    lineHeight,
    cb
  ) {
    testOverflowDom.innerHTML = options.str
    el.appendChild(testOverflowDom)
    setTimeout(() => {
      let res = options.str
      if (this._testOverflow(testOverflowDom)) {
        res = this._computedOverflowDomContent(
          options,
          testOverflowDom,
          computedStyle,
          lineHeight
        )
      }
      el.removeChild(testOverflowDom)
      cb && cb(res)
    })
  }

  static _createTestLineHeghtDom(el) {
    let testLineHeightDom = el.cloneNode(false)
    const style = testLineHeightDom.style
    style.overflow = style.visibility = 'hidden'
    style.position = 'absolute'
    style.opacity = 0
    style.left = 0
    style.right = 0
    testLineHeightDom.innerHTML = 'a'
    return testLineHeightDom
  }

  static _createTestOverflowDom(el, height, options) {
    let testOverflowDom = el.cloneNode(true)
    const style = testOverflowDom.style
    style.height = height + 'px'
    style.overflow = style.visibility = 'hidden'
    style.position = 'absolute'
    style.opacity = 0
    style.left = 0
    style.right = 0
    return testOverflowDom
  }

  static _computedOverflowDomContent(
    options,
    testOverflowDom,
    computedStyle,
    lineHeight
  ) {
    let lastChild = testOverflowDom.lastChild
    let textContent = lastChild.textContent
    while (testOverflowDom.childNodes.length > 1 && lastChild) {
      if (this._testOverflow(testOverflowDom)) {
        testOverflowDom.removeChild(lastChild)
      } else {
        testOverflowDom.appendChild(lastChild)
        break
      }
      lastChild = testOverflowDom.lastChild
      textContent = lastChild.textContent
    }
    if (textContent) {
      lastChild.textContent = this._computeLastText(
        testOverflowDom,
        lastChild,
        textContent,
        this._setTestOverflowCtx(options, computedStyle, lineHeight),
        lineHeight
      )
    }
    return testOverflowDom.innerHTML
  }

  static _testOverflow(test) {
    const { scrollHeight, clientHeight } = test
    return scrollHeight > clientHeight
  }

  static _createTestOverflowCtx() {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    return context
  }

  static _getTestOverflowCtx() {
    if (!this._testOverflowCtx)
      Object.defineProperty(this, '_testOverflowCtx', {
        value: this._createTestOverflowCtx()
      })
    return this._testOverflowCtx
  }

  static _setTestOverflowCtx(options, computedStyle, lineHeight) {
    const ctx = this._getTestOverflowCtx()
    const canvas = ctx.canvas
    canvas.width = parseFloat(computedStyle.width, 10)
    canvas.height = lineHeight * (options.row + 1)
    ctx.font = `${computedStyle.fontSize} normal`
    ctx.textBaseline = 'top'
    return ctx
  }

  static _computeLastText(testOverflowDom, target, str, ctx, lineHeight) {
    str = this._computeSimilarText(str, ctx, lineHeight)
    return this._halfComputeLastText(testOverflowDom, target, '', str)
  }

  static _halfComputeLastText(testOverflowDom, target, total, str) {
    var max = str.length
    var middle = Math.floor(max / 2)
    var halfStr = str.slice(0, middle)
    target.textContent = total + halfStr
    if (this._testOverflow(testOverflowDom)) {
      return this._halfComputeLastText(testOverflowDom, target, total, halfStr)
    } else if (middle + 1 < max) {
      return this._halfComputeLastText(
        testOverflowDom,
        target,
        total + halfStr,
        str.slice(middle, max)
      )
    } else {
      return target.textContent
    }
  }

  static _computeSimilarText(str, ctx, lineHeight) {
    const canvas = ctx.canvas
    const arrText = str.trim().split('')
    const maxWidth = canvas.width
    const maxHeight = canvas.height
    let y = 0
    let x = 0
    let n = 0
    let line = ''
    for (; n < arrText.length; n++) {
      const testLine = line + arrText[n]
      const metrics = ctx.measureText(testLine)
      const testWidth = metrics.width
      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, y)
        line = arrText[n]
        y += lineHeight
      } else {
        line = testLine
      }
      if (y > maxHeight) {
        break
      }
      ctx.fillText(line, x, y)
    }
    return arrText.slice(0, n).join('')
  }

  static _getLineHeight(el, cb) {
    const testLineHeightDom = this._createTestLineHeghtDom(el)
    el.appendChild(testLineHeightDom)
    setTimeout(() => {
      cb && cb(testLineHeightDom.clientHeight)
      el.removeChild(testLineHeightDom)
    })
  }

  reCompute(str, cb) {
    const options = this._mergeOptions(this._options, {
      str: str || this._options.str
    })
    EllipsisText._computeResult(
      this._el,
      options,
      this._testOverflowDom,
      this._computedStyle,
      this._lineHeight,
      res => {
        this._result = res
        cb && cb.call(this, res)
      }
    )
  }

  dotdotdot(ellipsis, str) {
    str = str || this._result
    ellipsis = ellipsis || '...'
    return str.substring(0, str.length - ellipsis.length) + ellipsis
  }
}

export default EllipsisText
