import React, { createRef, CSSProperties, ReactNode } from 'react';
import classnames from 'classnames';
import { platformInformation } from '../helpers/platform-information.helper';

type IosScrollFixProps = {
  className?: string,
  style?: CSSProperties,
}

type IosScrollFixState = {
}

// don't use bounce scroll as it doesn't work correctly at the moment
const USE_BOUNCE_SCROLL = false;
const BOUNCE_SCROLL_PIXEL_FIX_RANGE = 1;

export class IosScrollFix extends React.Component<IosScrollFixProps, IosScrollFixState> {
  private lastY = 0;
  private requestedCheckNextFrame = false;
  private divRef: React.RefObject<HTMLDivElement>;

  /**
   * @constructor
   */
  constructor(props: IosScrollFixProps) {
    super(props);

    this.divRef = createRef();
  }

  /**
   * @inheritdoc
   */
  componentDidMount = (): void => {
    this.addIosScrollFix();
  }

  /**
   * @inheritdoc
   */
  componentWillUnmount = (): void => {
    this.removeIosScrollFix();
  }

  /**
   * updates the last y position
   */
  private iosScrollFixTouchStart = (e: TouchEvent) => {
    this.lastY = e.touches[0].clientY;
  };

  /**
   * if currently at the top or bottom of the scrollable area and trying to scroll towards the edge of the page prevent the scroll
   */
  private iosScrollFixTouchMove = (e: TouchEvent) => {
    const top = e.touches[0].clientY;

    // Determine scroll position and direction.
    if (this.divRef.current) {
      const { scrollTop } = this.divRef.current;
      const direction = (this.lastY - top) < 0 ? 'up' : 'down';

      // check weather to prevent default
      if (scrollTop === 0 && direction === 'up') {
        // Prevent scrolling up when already at top
        if (e.cancelable) e.preventDefault();
      }
      else if (scrollTop >= (this.divRef.current.scrollHeight - this.divRef.current.clientHeight) && direction === 'down') {
        // Prevent scrolling down when already at bottom
        if (e.cancelable) e.preventDefault();
      }
      this.lastY = top;
    }
  };

  /**
   * if the user scrolls the div it will call a function when the screen is being repainted to check if
   * the scroll height is above the maximum scroll value or below the minimum value it will set it back to the maximum value or minimum value
   */
  IosScrollFixScrollRequestAnimationFrame = (e: Event): void => {
    if (!this.requestedCheckNextFrame && this.divRef.current) {
      window.requestAnimationFrame(() => {
        if (this.divRef.current) {
          const { scrollTop } = this.divRef.current;
          // check weather to prevent default
          if (scrollTop <= 0) {
            // Prevent scrolling up when already at top
            this.divRef.current.scrollTop = 0;
          }
          else if (scrollTop >= (this.divRef.current.scrollHeight - this.divRef.current.clientHeight)) {
            // Prevent scrolling down when already at bottom
            this.divRef.current.scrollTop = this.divRef.current.scrollHeight;
          }
        }
        this.requestedCheckNextFrame = false;
      });
      this.requestedCheckNextFrame = true;
    }
  }

  /**
   * allows bounce scroll on iOS devices wile significantly reducing the frequency of the scroll locking up
   */
  private iosScrollFixWithBounce = (e: Event) => {
    if (this.divRef.current) {
      const { scrollTop } = this.divRef.current;
      const maxScrollTop = this.divRef.current.scrollHeight - this.divRef.current.clientHeight;
      if (scrollTop <= 0 && scrollTop >= 0 - BOUNCE_SCROLL_PIXEL_FIX_RANGE && this.lastY < 0) {
        // moves scroll position down 1 pixel when the scroll position is about to finish bouncing back to the top of the page
        this.divRef.current.scrollTop = 1;
        // Toaster.toast('top scroll fix');
      }
      else if (scrollTop >= maxScrollTop && scrollTop <= maxScrollTop + BOUNCE_SCROLL_PIXEL_FIX_RANGE && this.lastY > maxScrollTop) {
        // moves scroll position up 1 pixel when the scroll position is about to finish bouncing back to the bottom of the page
        this.divRef.current.scrollTop = maxScrollTop - 1;
        // Toaster.toast('bottom scroll fix');
      }

      this.lastY = this.divRef.current.scrollTop;
    }
  }

  /**
   * adds the ios scroll fix listeners from the element
   */
  private addIosScrollFix = () => {
    if (this.divRef.current && platformInformation().isIOS) {
      if (!USE_BOUNCE_SCROLL) {
        this.divRef.current.addEventListener('touchstart', this.iosScrollFixTouchStart, { passive: true });
        this.divRef.current.addEventListener('touchmove', this.iosScrollFixTouchMove, { passive: false });
        this.divRef.current.addEventListener('scroll', this.IosScrollFixScrollRequestAnimationFrame, { passive: true, capture: true });
      }
      else {
        this.divRef.current.addEventListener('scroll', this.iosScrollFixWithBounce, { passive: true, capture: true });
      }
    }
  };

  /**
   * removes the ios scroll fix listeners from the element
   */
  private removeIosScrollFix = () => {
    if (this.divRef.current && platformInformation().isIOS) {
      if (!USE_BOUNCE_SCROLL) {
        this.divRef.current.removeEventListener('touchstart', this.iosScrollFixTouchStart);
        this.divRef.current.removeEventListener('touchmove', this.iosScrollFixTouchMove);
        this.divRef.current.removeEventListener('scroll', this.IosScrollFixScrollRequestAnimationFrame);
      }
      else {
        this.divRef.current.removeEventListener('scroll', this.iosScrollFixWithBounce);
      }
    }
  };

  /**
   * @inheritdoc
   */
  render = (): ReactNode => {
    const {
      className, style, children,
    } = this.props;
    return (
      <div className={classnames('div-ios-scroll-fix', className)} style={style} ref={this.divRef}>
        {children}
      </div>
    );
  }
}
