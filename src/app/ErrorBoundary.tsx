import { Component, type PropsWithChildren } from 'react';

export class ErrorBoundary extends Component<PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) {
    try {
      const previous = JSON.parse(localStorage.getItem('yol-errors') || '[]') as unknown[];
      localStorage.setItem('yol-errors', JSON.stringify([...previous.slice(-19), { at: Date.now(), message: error.message }]));
    } catch { /* Storage may be unavailable in private browsing. */ }
  }
  render() {
    return this.state.failed ? <main className="app-shell"><section className="card stack"><h1>Verin güvende, sayfayı yenile</h1><p>Bir şeyler yolunda gitmedi. Yenileyerek kaldığın yerden devam edebilirsin.</p><button className="button primary" onClick={() => location.reload()}>Sayfayı yenile</button></section></main> : this.props.children;
  }
}
