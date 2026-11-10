import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react'

class WidgetError extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (this.state.failed) return (
      <div className="widget-placeholder" role="alert">
        <p>交互图加载失败，请重试。</p>
        <button className="wbtn" onClick={this.props.retry}>重新加载</button>
      </div>
    )
    return this.props.children
  }
}

// Each chapter's module is downloaded only when one of its widgets approaches
// the viewport. Other widgets in the same chapter still mount independently.
export function deferredWidget(load, name) {
  const loadWidget = () => lazy(() => load().then((module) => ({ default: module[name] })))
  function DeferredWidget(props) {
    const ref = useRef(null)
    const [LazyWidget, setLazyWidget] = useState(loadWidget)
    const [visible, setVisible] = useState(false)
    const [attempt, setAttempt] = useState(0)
    useEffect(() => {
      if (visible) return
      if (!('IntersectionObserver' in window)) { setVisible(true); return }
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      }, { rootMargin: '400px 0px' })
      observer.observe(ref.current)
      return () => observer.disconnect()
    }, [visible])
    const placeholder = <div className="widget-placeholder" role="status">交互图加载中…</div>
    const retry = () => {
      setLazyWidget(loadWidget)
      setAttempt((n) => n + 1)
    }
    return (
      <div ref={ref} className="deferred-widget" data-widget={name}>
        {visible ? (
          <WidgetError key={attempt} retry={retry}>
            <Suspense fallback={placeholder}><LazyWidget {...props} /></Suspense>
          </WidgetError>
        ) : placeholder}
      </div>
    )
  }
  DeferredWidget.displayName = `Deferred(${name})`
  return DeferredWidget
}
