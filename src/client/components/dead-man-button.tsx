import React, { createRef, ReactNode } from 'react';
import classNames from 'classnames';

export type DeadManButtonProps = {
  className?: string,
  disabled?: boolean,
  repeatRate?: number,
  onBeginUpdating?: () => void,
  onUpdate?: () => void,
  onEndUpdating?: () => void,
}

type DeadManButtonState = {
  updating: boolean,
}

const DEFAULT_REPEAT_RATE = 50;

/**
 * @description
 * The Dead man button is designed to repeat the `onUpdate` event whilst the button is
 * still being pressed or clicked. Once released, the button will cease sending the
 * `onUpdate` event;
 *
 * The `repeatRate` prop defines the rate (in ms) that the `onUpdate` event is fired.
 */
export class DeadManButton extends React.Component<DeadManButtonProps, DeadManButtonState> {
  private updateInterval: null | ReturnType<typeof setInterval>;

  private buttonRef: React.RefObject<HTMLButtonElement>;

  /**
   * @constructor
   */
  constructor(props: DeadManButtonProps) {
    super(props);

    this.state = {
      updating: false,
    };

    this.updateInterval = null;
    this.buttonRef = createRef();
  }

  /**
   * @inheritdoc
   */
  componentDidUpdate(prevProps: DeadManButtonProps, prevState: DeadManButtonState): void {
    // TODO: handle a change to props.repeatRate if the user is interacting with the button
  }

  /**
   * How frequently the update callback should be fired
   */
  get repeatRate(): number {
    const { repeatRate } = this.props;
    return repeatRate ?? DEFAULT_REPEAT_RATE;
  }

  /**
   * @inheritdoc
   */
  componentWillUnmount = (): void => {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * End the updating of the button state
   * Typically called by either the user mouse up or touch end events
   */
  endUpdating = (): boolean => {
    const { updating } = this.state;

    if (updating || this.updateInterval) {
      // kill the interval
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      // Set the state and fire the event
      this.setState({
        updating: false,
      }, () => {
        const { onEndUpdating } = this.props;
        if (onEndUpdating) {
          setTimeout(onEndUpdating, 0);
        }
      });
      return true;
    }
    return false;
  }

  /**
   * Begin the updating of the button state
   * Typically called by either the user mouse down or touch start events
   */
  startUpdating = (): boolean => {
    const { updating } = this.state;

    // If not previously updating or the updateInterval already exist
    if (!updating || this.updateInterval) {
      // kill the interval
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      this.setState({
        updating: true,
      }, () => {
        const { onBeginUpdating, onUpdate } = this.props;

        // fire the onBeginUpdating callback
        if (onBeginUpdating) {
          setTimeout(onBeginUpdating, 0);
        }

        // fire the onUpdate callback
        if (onUpdate) {
          setTimeout(onUpdate, 0);
        }
        // Setup the interval
        this.updateInterval = setInterval(() => {
          // eslint-disable-next-line no-shadow
          const { onUpdate } = this.props;
          // Fire the onUpdate callback every interval
          if (onUpdate) {
            setTimeout(onUpdate, 0);
          }
        }, this.repeatRate);
      });
      return true;
    }

    return false;
  }

  /**
   * Fired when the user presses their mouse down on the button
   */
  handleMouseDown = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
    event.preventDefault();

    if (this.startUpdating()) {
      const handleMouseUp = (evt: MouseEvent) => {
        evt.preventDefault();
        this.endUpdating();
      };

      // Since the mouse-up event might not happen within the bounds of the button,
      // bind a temporary event listener to the whole document.
      document.addEventListener(
        'mouseup',
        handleMouseUp,
        { once: true },
      );
    }
  };

  /**
   * Fired when the user touches the button
   */
  handleTouchStart = (event: React.TouchEvent<HTMLButtonElement>): void => {
    if (event.cancelable) {
      event.preventDefault();
    }

    if (this.startUpdating()) {
      const endTouchIdentifier = event.changedTouches[0].identifier;

      const handleTouchEnd = (evt: TouchEvent): boolean => {
        if (evt.cancelable) {
          evt.preventDefault();
        }

        // Only handle the touch end event if the expected touch was in the list
        const touches = Array.from(evt.changedTouches);
        const expectedTouchInList = touches.find((touch) => touch.identifier === endTouchIdentifier);
        if (expectedTouchInList) {
          this.endUpdating();
          return true;
        }

        // Otherwise re-bind an event listener
        return false;
      };

      // Since the touch-up event might not happen within the bounds of the button,
      // bind an event listener to the whole document. This event listener is removed
      // When a touchend event for the expected corresponding touch identifier is received.
      const bindTouchEndListener = () => {
        document.addEventListener(
          'touchend',
          (e) => {
            if (!handleTouchEnd(e)) {
              bindTouchEndListener();
            };
          },
          {
            once: true,
          },
        );
      };
      bindTouchEndListener();
    }
  }

  /**
   * @inheritdoc
   */
  render = (): ReactNode => {
    const {
      className,
      disabled,
      children,
    } = this.props;

    return (
      <button
        ref={this.buttonRef}
        type="button"
        className={classNames('dead-man-button', className)}
        disabled={disabled}
        onMouseDown={this.handleMouseDown}
        onTouchStart={this.handleTouchStart}
        onClick={(e) => { e.preventDefault(); }}
      >
        {children}
      </button>
    );
  }
};
