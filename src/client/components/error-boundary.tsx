import React, { ReactNode, ErrorInfo } from 'react';
import { ICON } from '../const/icon.constant';
import { Button } from './button';
import { Icon } from './icon';

type ErrorBoundaryProps = {
  children?: ReactNode,
};

type ErrorBoundaryState = {
  hasError: boolean,
  error: null | Error,
  errorInfo: null | ErrorInfo
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  /**
   * @constructor
   */
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };

    this.handleClickReload = this.handleClickReload.bind(this);
  }

  /**
   * @inheritdoc
   */
  static getDerivedStateFromError(error: unknown): null | Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI.
    if (error) {
      return { hasError: true };
    }

    return null;
  }

  /**
   * @inheritdoc
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo,
    });
  }

  /**
   * Fired when the user clicks the reload button to reload the page
   */
  handleClickReload(): void {
    window.location.reload();
  }

  /**
   * @inheritdoc
   */
  render(): ReactNode {
    const { children } = this.props;
    const { hasError, error, errorInfo } = this.state;
    if (hasError) {
      return (
        <div className="error-boundary">
          <Icon icon={ICON.TELEPRESENCE_BOT} />
          <h1>An Error has occurred.</h1>
          <p className="error">{JSON.stringify(error?.message)}</p>
          <p className="error">{JSON.stringify(errorInfo)}</p>
          <p className="error">{JSON.stringify(errorInfo?.componentStack)}</p>
          <div className="button-wrapper">
            <Button onClick={this.handleClickReload}>
              <Icon icon={ICON.REFRESH} />
              <span>Reload</span>
            </Button>
          </div>
        </div>
      );
    }
    return children;
  }
}
