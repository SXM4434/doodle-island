import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode; title: string; onClose: () => void; resetKey: boolean }
type State = { failed: boolean }

// A drawing tool must never take the whole island down. This is intentionally a
// small, local boundary around lazy-loaded studios; game/world errors are not hidden.
export class StudioBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State { return { failed: true } }

  componentDidUpdate(previous: Props) {
    if (!previous.resetKey && this.props.resetKey && this.state.failed) this.setState({ failed: false })
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[${this.props.title}] recovered from a studio render error`, error, info)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <div className="studio-recovery" role="alert">
      <p className="eyebrow">Your island is safe</p>
      <h2>{this.props.title} needs to reopen</h2>
      <p>Your saved drawings and materials were not changed. Close this board, then open it again.</p>
      <button className="btn confirm" onClick={this.props.onClose}>Return to the island</button>
    </div>
  }
}
