import React from 'react';
import { Button, Result } from 'antd';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    if (typeof window !== 'undefined') {
      console.error('[ErrorBoundary]', error, info);
    }
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page-container">
        <Result
          status="error"
          title="Алдаа гарлаа"
          subTitle={String(this.state.error?.message || this.state.error)}
          extra={[
            <Button key="reload" type="primary" onClick={() => window.location.reload()}>
              Дахин ачаалах
            </Button>,
            <Button key="home" onClick={() => { window.location.href = '/'; }}>
              Нүүр хуудас
            </Button>,
          ]}
        />
      </div>
    );
  }
}
