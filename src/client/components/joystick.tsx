import React, { createRef, CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import { XYCoordinate } from '../../shared/types/xy-coordinate.type';
import { findTouchFromTouchIdentifier } from '../helpers/find-touch-from-touch-identifier.helper';
import { Icon } from './icon';
import { round } from '../../shared/helpers/round.helper';
import { ICON } from '../const/icon.constant';

export type JoystickProps = {
  className?: string,
  disabled?: boolean,
  repeatRate?: number,
  limit?: number,
  springBack?: boolean,
  value: XYCoordinate,
  verboseUpdate?: boolean,
  invertY?: boolean,
  keyBindings?: {
    up: string,
    right: string,
    down: string,
    left: string,
  }
  onBeginUpdating?: () => void,
  onUpdate?: (position: XYCoordinate) => void,
  onEndUpdating?: () => void,
}

type JoystickState = {
  updating: boolean,
  dragging: boolean,
  keysDown: {
    up: boolean,
    right: boolean,
    down: boolean,
    left: boolean,
  }
}

const DEFAULT_REPEAT_RATE = 50;
const DEFAULT_SPRING_BACK = true;
const SPRING_COEFFICIENT = 0.9;
const SPRING_MIN_THRESHOLD = 0.5;

/**
 * Note: The drag position influences the x and y coordinates but they are not governed by it
 * Note: This component attempts to avoid state to update the dom given the frequency and load of the updates
 */
export class Joystick extends React.Component<JoystickProps, JoystickState> {
  private internalPosition: XYCoordinate = { x: 0, y: 0 };
  private updateInterval: null | ReturnType<typeof setInterval>;
  private position: XYCoordinate = { x: 0, y: 0 };
  private knobRef: React.RefObject<HTMLDivElement>;
  private dragZoneRef: React.RefObject<HTMLDivElement>;
  private dragPosition?: XYCoordinate;
  private dragPositionOffset?: XYCoordinate;
  private dragTouchIdentifier?: number;

  /**
   * @constructor
   */
  constructor(props: JoystickProps) {
    super(props);

    this.state = {
      updating: false,
      dragging: false,
      keysDown: {
        up: false,
        right: false,
        down: false,
        left: false,
      },
    };

    this.updateInterval = null;
    this.knobRef = createRef();
    this.dragZoneRef = createRef();
  }

  /**
   * @inheritdoc
   */
  componentDidMount(): void {
    this.bindEvents();
  }

  /**
   * @inheritdoc
   */
  componentDidUpdate(prevProps: JoystickProps, prevState: JoystickState): void {
    // TODO: handle a change to props.disabled if the user is interacting with the joystick
    // TODO: handle a change to props.refreshRate if the user is interacting with the joystick

    // When the incoming value changes, update our internal value if the user is not interacting with the knob.
    this.doInternalUpdate();
  }

  /**
   * @inheritdoc
   */
  componentWillUnmount = (): void => {
    this.unbindDragEvents();
    this.unbindEvents();
  }

  /**
   * Whether the update should be fired regardless of a change in position
   */
  get verboseUpdate(): boolean {
    const { verboseUpdate } = this.props;
    return verboseUpdate ?? false;
  }

  /**
   * How frequently the update callback should be fired
   */
  get repeatRate(): number {
    const { repeatRate } = this.props;
    return repeatRate ?? DEFAULT_REPEAT_RATE;
  }

  /**
   * To what value should the position be constrained (0-100)
   */
  get limit(): number {
    const { limit } = this.props;
    return Math.max(0, Math.min(limit ?? 100, 100));
  }

  /**
  * Should the joystick spring back into the center when released
  */
  get springBack(): boolean {
    const { springBack } = this.props;
    return springBack ?? DEFAULT_SPRING_BACK;
  }

  /**
   * Return the CSS that needs to be applied to the knob to make it
   * appear like it's moving with the touch / drag operations
   */
  get knobTransformCSS(): CSSProperties {
    return {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      '--offsetX': `${this.internalPosition.x}%`,
      '--offsetY': `${this.internalPosition.y}%`,
    };
  }

  /**
   * Return the CSS that needs to be applied to the knob to make it
   * appear like it's moving with the touch / drag operations
   */
  get knobTransformCSSString(): string {
    return `
      --offsetX: ${this.internalPosition.x}%;
      --offsetY: ${this.internalPosition.y}%;
    `;
  }

  /**
   * Get the array of keys bound to control input
   * (Primarily used as a shortcut to not have to unwrap the keyBindings every time a key is pressed)
   */
  get controlKeys(): string[] {
    const { keyBindings } = this.props;
    if (keyBindings) {
      return Object.values(keyBindings);
    }
    return [];
  }

  /**
   * Returns true if any of the control keys are being depressed
   */
  get anyKeyDown(): boolean {
    const { keysDown } = this.state;
    return keysDown.up || keysDown.right || keysDown.down || keysDown.left;
  }

  /**
   * Bind ongoing event listeners
   */
  bindEvents = (): void => {
    this.handleWindowKeyDown = this.handleWindowKeyDown.bind(this);
    this.handleWindowKeyUp = this.handleWindowKeyUp.bind(this);

    window.addEventListener('keydown', this.handleWindowKeyDown);
    window.addEventListener('keyup', this.handleWindowKeyUp);
  }

  /**
   * Unbind ongoing event listeners
   */
  unbindEvents = (): void => {
    window.removeEventListener('keyup', this.handleWindowKeyUp);
    window.removeEventListener('keydown', this.handleWindowKeyDown);
  }

  /**
   * Bind any window event listeners at the start of a drag operation
   */
  bindDragEvents = (): void => {
    this.handleWindowMouseMove = this.handleWindowMouseMove.bind(this);
    this.handleWindowTouchMove = this.handleWindowTouchMove.bind(this);
    this.handleWindowMouseUp = this.handleWindowMouseUp.bind(this);
    this.handleWindowTouchEnd = this.handleWindowTouchEnd.bind(this);
    this.handleWindowTouchCancel = this.handleWindowTouchCancel.bind(this);
    window.addEventListener('mousemove', this.handleWindowMouseMove);
    window.addEventListener('touchmove', this.handleWindowTouchMove, { passive: false });
    window.addEventListener('mouseup', this.handleWindowMouseUp);
    window.addEventListener('touchend', this.handleWindowTouchEnd);
    window.addEventListener('touchcancel', this.handleWindowTouchCancel);

    document.addEventListener('touchmove', (e: TouchEvent) => e.preventDefault(), { passive: false });
  }

  /**
   * @description
   * Unbind any event listeners at the end of a drag operation
   */
  unbindDragEvents = (): void => {
    window.removeEventListener('mousemove', this.handleWindowMouseMove);
    window.removeEventListener('touchmove', this.handleWindowTouchMove);
    window.removeEventListener('mouseup', this.handleWindowMouseUp);
    window.removeEventListener('touchend', this.handleWindowTouchEnd);
    window.removeEventListener('touchcancel', this.handleWindowTouchCancel);
  }

  /**
   * Update the internal values (at a higher resolution than the external update)
   */
  doInternalUpdate = (): void => {
    const {
      dragging,
    } = this.state;

    const { value, invertY } = this.props;

    // Recalculate the position based on all of the inputs
    if (dragging && this.dragPosition && this.dragPositionOffset && this.dragZoneRef.current && this.knobRef.current) {
      const dragZoneBoundingRect = this.dragZoneRef.current.getBoundingClientRect();

      const maxWidth = dragZoneBoundingRect.width / 2;
      const maxHeight = dragZoneBoundingRect.height / 2;

      const offsetDragPosition: XYCoordinate = {
        x: round(this.dragPosition.x - dragZoneBoundingRect.left - maxWidth - this.dragPositionOffset.x, 2) * 2,
        y: round(this.dragPosition.y - dragZoneBoundingRect.top - maxHeight - this.dragPositionOffset.y, 2) * 2,
      };

      this.internalPosition = {
        x: Math.max(Math.min(offsetDragPosition.x / (maxWidth * 2), 1), -1) * 100,
        y: Math.max(Math.min(offsetDragPosition.y / (maxHeight * 2), 1), -1) * 100,
      };
    }

    // There's a key down
    else if (this.anyKeyDown) {
      const { keysDown } = this.state;

      const newX = this.internalPosition.x + (keysDown.right ? 1 : 0) + (keysDown.left ? -1 : 0);
      const newY = this.internalPosition.y + (keysDown.down ? 1 : 0) + (keysDown.up ? -1 : 0);

      this.internalPosition = {
        x: Math.max(Math.min(newX, 100), -100),
        y: Math.max(Math.min(newY, 100), -100),
      };
    }

    // Attempt to spring back to the center
    else if (this.springBack) {
      if (
        (Math.abs(this.internalPosition.x) > SPRING_MIN_THRESHOLD)
        || (Math.abs(this.internalPosition.y) > SPRING_MIN_THRESHOLD)
      ) {
        this.internalPosition = {
          x: this.internalPosition.x * SPRING_COEFFICIENT,
          y: this.internalPosition.y * SPRING_COEFFICIENT,
        };
      }

      // reset to zero if below the spring threshold
      else if (
        (Math.abs(this.internalPosition.x) < SPRING_MIN_THRESHOLD)
        && (Math.abs(this.internalPosition.y) < SPRING_MIN_THRESHOLD)
      ) {
        this.internalPosition = {
          x: 0,
          y: 0,
        };
        this.endUpdating();
      }
    } else {
      if (invertY) {
        this.internalPosition = {
          x: value.x,
          y: value.y * -1,
        };
      } else {
        this.internalPosition = value;
      }
      this.endUpdating();
    }
  }

  /**
   * Called by the updateInterval
   */
  doUpdate = (): void => {
    const { invertY, onUpdate } = this.props;

    // Snap the position to the nearest integer
    const snappedPosition = {
      x: this.internalPosition.x <= 0 ? Math.ceil(this.internalPosition.x) : Math.floor(this.internalPosition.x),
      y: this.internalPosition.y <= 0 ? Math.ceil(this.internalPosition.y) : Math.floor(this.internalPosition.y),
    };

    // Invert the Y axis?
    if (invertY) {
      snappedPosition.y *= -1;
    }

    // Check to see if the position has changed in any way
    const positionChanged = this.position.x !== snappedPosition.x || this.position.y !== snappedPosition.y;

    // Update the position to reflect the snapped position
    this.position = snappedPosition;

    // Fire the update handler if required
    if (onUpdate && (positionChanged || this.verboseUpdate)) {
      setTimeout(() => onUpdate(this.position), 0);
    }
  }

  /**
   * Begin the updating of the joystick state
   * Typically called by either the user mouse down or touch start events
   */
  startUpdating = (): boolean => {
    const { updating, dragging } = this.state;
    const { anyKeyDown } = this;

    // If not previously updating or the updateInterval already exist
    if (!updating && (dragging || anyKeyDown)) {
      // kill the interval
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }

      this.setState({
        updating: true,
      }, () => {
        const { onBeginUpdating } = this.props;

        // fire the onBeginUpdating callback
        if (onBeginUpdating) {
          setTimeout(onBeginUpdating, 0);
        }

        // Start animating the joystick knob
        this.startAnimating();

        // fire the onUpdates once
        this.doUpdate();

        // Setup the interval
        this.updateInterval = setInterval(() => {
          this.doUpdate();
        }, this.repeatRate);
      });
      return true;
    }

    return false;
  }

  /**
   * End the updating of the joystick state
   * Typically called by either the user mouse up or touch end events
   */
  endUpdating = (): boolean => {
    const { updating, dragging } = this.state;
    const { anyKeyDown } = this;

    if ((updating || this.updateInterval) && !dragging && !anyKeyDown) {
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
   * Take the internal position and apply it to the knob to keep it up to date
   * (since the knob is also rendered outside of the render loop)
   */
  applyKnobCSS = (): void => {
    if (this.knobRef.current) {
      this.knobRef.current.setAttribute('style', this.knobTransformCSSString);
    }
  }

  /**
   * Begin requesting animation frames to update the joystick
   */
  startAnimating = (): void => {
    const getStateValues = () => {
      const { doInternalUpdate, applyKnobCSS } = this;
      const { updating } = this.state;
      return {
        updating,
        doInternalUpdate,
        applyKnobCSS,
      };
    };

    requestAnimationFrame(function animate() {
      const {
        updating,
        doInternalUpdate,
        applyKnobCSS,
      } = getStateValues();

      if (updating) {
        doInternalUpdate();
        requestAnimationFrame(animate);
      } else {
        applyKnobCSS();
      }
    });
  }

  /**
   * Begin the dragging operation
   *
   * @param {XYCoordinate} startPosition the initial global client x position of the mouse cursor / touch event
   * @param {number} touchIdentifier the finger that was used to begin the drag operation (if touch initiated the drag)
   * @param {function} callBack something to fire after the begin drag has completed
   */
  beginDrag = (startPosition: XYCoordinate, touchIdentifier?: number, callBack?: () => unknown): void => {
    this.dragPosition = startPosition;
    this.dragPositionOffset = startPosition;
    this.dragTouchIdentifier = touchIdentifier;

    if (startPosition && this.knobRef.current && this.dragZoneRef.current) {
      const knobBoundingRect = this.knobRef.current.getBoundingClientRect();

      const maxWidth = knobBoundingRect.width / 2;
      const maxHeight = knobBoundingRect.height / 2;

      this.dragPositionOffset = {
        x: round(startPosition.x - knobBoundingRect.left - maxWidth, 2),
        y: round(startPosition.y - knobBoundingRect.top - maxHeight, 2),
      };
    } else {
      this.dragPositionOffset = { x: 0, y: 0 };
    }

    this.setState({
      dragging: true,
    }, () => {
      this.bindDragEvents();

      this.startUpdating();

      if (callBack) {
        callBack();
      }
    });
  }

  /**
   * Fired by the mouse and touch move events as the user drags the joystick knob
   *
   * @note: the position coordinate is the global client X/Y position of the mouse cursor / touch event
   */
  drag = (dragPosition?: XYCoordinate): void => {
    this.dragPosition = dragPosition;
  }

  /**
   * End the dragging operation
   */
  endDrag = (callBack?: () => unknown): void => {
    this.unbindDragEvents();

    this.dragPosition = undefined;
    this.dragPositionOffset = undefined;
    this.dragTouchIdentifier = undefined;

    this.setState({
      dragging: false,
    }, () => {
      if (callBack) {
        callBack();
      }
    });
  }

  /**
   * Handle the press of a key
   */
  handleWindowKeyDown = (e: KeyboardEvent): void => {
    const { keyBindings } = this.props;
    if (keyBindings && this.controlKeys.includes(e.key)) {
      const { keysDown } = this.state;

      // Start of an UP press
      if ((keyBindings.up === e.key) && !keysDown.up) {
        this.setState({
          keysDown: {
            ...keysDown,
            up: true,
          },
        }, this.startUpdating);
      }

      // Start of an RIGHT press
      else if ((keyBindings.right === e.key) && !keysDown.right) {
        this.setState({
          keysDown: {
            ...keysDown,
            right: true,
          },
        }, this.startUpdating);
      }

      // Start of an DOWN press
      else if ((keyBindings.down === e.key) && !keysDown.down) {
        this.setState({
          keysDown: {
            ...keysDown,
            down: true,
          },
        }, this.startUpdating);
      }

      // Start of an LEFT press
      else if ((keyBindings.left === e.key) && !keysDown.left) {
        this.setState({
          keysDown: {
            ...keysDown,
            left: true,
          },
        }, this.startUpdating);
      }
    }
  }

  /**
   * Handle the release of a key
   */
  handleWindowKeyUp = (e: KeyboardEvent): void => {
    const { keyBindings } = this.props;
    if (keyBindings && this.controlKeys.includes(e.key)) {
      const { keysDown } = this.state;

      // Start of an UP press
      if ((keyBindings.up === e.key) && keysDown.up) {
        this.setState({
          keysDown: {
            ...keysDown,
            up: false,
          },
        }, () => { if (!this.springBack) this.endUpdating(); });
      }

      // Start of an RIGHT press
      else if ((keyBindings.right === e.key) && keysDown.right) {
        this.setState({
          keysDown: {
            ...keysDown,
            right: false,
          },
        }, () => { if (!this.springBack) this.endUpdating(); });
      }

      // Start of an DOWN press
      else if ((keyBindings.down === e.key) && keysDown.down) {
        this.setState({
          keysDown: {
            ...keysDown,
            down: false,
          },
        }, () => { if (!this.springBack) this.endUpdating(); });
      }

      // Start of an LEFT press
      else if ((keyBindings.left === e.key) && keysDown.left) {
        this.setState({
          keysDown: {
            ...keysDown,
            left: false,
          },
        }, () => { if (!this.springBack) this.endUpdating(); });
      }
    }
  }

  /**
   * Handle the movement of the mouse over the entire document
   */
  handleWindowMouseMove = (e: MouseEvent): void => {
    const { dragging } = this.state;
    const { disabled } = this.props;
    if (
      dragging
      && !disabled
      && (this.dragTouchIdentifier === undefined)
      && (e.button === 1 || e.button === 0 || e.button === undefined)
    ) {
      e.stopPropagation();
      this.drag({ x: e.clientX, y: e.clientY });
    }
  }

  /**
   * Handle the movement of a touch over the entire document
   */
  handleWindowTouchMove = (e: TouchEvent): void => {
    const { dragging } = this.state;
    const { disabled } = this.props;

    if (dragging && !disabled && (this.dragTouchIdentifier !== undefined)) {
      const dragTouch = findTouchFromTouchIdentifier(e.changedTouches, this.dragTouchIdentifier);

      if (dragTouch) {
        e.stopPropagation();
        if (e.cancelable) {
          e.preventDefault();
        }
        this.drag({ x: dragTouch.clientX, y: dragTouch.clientY });
      }
    }
  }

  /**
   * Mouse Up anywhere on window end the drag operation
   */
  handleWindowMouseUp = (e: MouseEvent): void => {
    this.handleKnobMouseUp(e);
  }

  /**
   * Touch end from the same touch identifier anywhere on the window will end the drag operation
   */
  handleWindowTouchEnd = (e: TouchEvent): void => {
    this.handleKnobTouchEnd(e);
  }

  /**
   * Touch cancel from the same touch identifier anywhere on the window will end the drag operation
   *
   * @param {React.SyntheticEvent} e
   */
  handleWindowTouchCancel = (e: TouchEvent): void => {
    this.handleKnobTouchEnd(e);
  }

  /**
   * Const fired when the mouse is pressed on the joystick
   */
  handleKnobMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    const { dragging } = this.state;
    const { disabled } = this.props;

    if (
      !disabled
      && !dragging
      && (e.button === 1 || e.button === 0 || e.button === undefined)
    ) {
      e.stopPropagation();
      this.beginDrag({ x: e.clientX, y: e.clientY });
    }
  }

  /**
   * Mouse up on the joystick knob will end the drag operation
   */
  handleKnobMouseUp = (e: MouseEvent | React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    if (
      (this.dragTouchIdentifier === undefined)
      && (e.button === 1 || e.button === 0 || e.button === undefined)
    ) {
      e.stopPropagation();
      this.endDrag();
    }
  }

  /**
   * Touch on the knob will begin the drag operation
   */
  handleKnobTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    const { dragging } = this.state;
    const { disabled } = this.props;

    // Start a drag and / or pinch operation?
    if (!disabled && !dragging && e.changedTouches.length > 0) {
      e.stopPropagation();

      const dragTouch = e.changedTouches[0];
      this.beginDrag({ x: dragTouch.clientX, y: dragTouch.clientY }, dragTouch.identifier);
    }
  }

  /**
   * Touch end from the same touch identifier will end the drag operation
   */
  handleKnobTouchEnd = (e: TouchEvent |React.TouchEvent<HTMLDivElement>): void => {
    const {
      dragging,
    } = this.state;

    if (dragging && (this.dragTouchIdentifier !== undefined)) {
      const dragTouch = findTouchFromTouchIdentifier(e.changedTouches as TouchList, this.dragTouchIdentifier);

      // Stop propagation if we're going to do something
      if (dragTouch) {
        e.stopPropagation();
        this.endDrag();
      }
    }
  }

  /**
   * @inheritdoc
   */
  render(): ReactNode {
    const { className, disabled } = this.props;

    return (
      <div
        className={classNames('joystick', className, { disabled })}
      >
        {/* This is the diamond shaped clipping path */}
        <svg
          className="clip-path-svg"
        >
          <clipPath
            id="joystick_background_clip_path"
            clipPathUnits="objectBoundingBox"
          >
            {/* eslint-disable-next-line max-len */}
            <path d="M0.964,0.585 l-0.38,0.38 a0.12,0.12,0,0,1,-0.17,0 l-0.38,-0.38 a0.12,0.12,0,0,1,0,-0.17 l0.38,-0.38 a0.12,0.12,0,0,1,0.17,0 l0.38,0.38 A0.12,0.12,0,0,1,0.964,0.585" />
          </clipPath>
        </svg>

        {/* The background is the black area behind the joystick */}
        <div className="background" />

        {/* This is the diamond shape representing the limit */}
        <svg
          className="limit-svg"
          viewBox="0 0 100 100"
        >
          {/* eslint-disable-next-line max-len */}
          <path d="M96.49,58.5l-38,38a12,12,0,0,1-17,0l-38-38a12,12,0,0,1,0-17l38-38a12,12,0,0,1,17,0l38,38A12,12,0,0,1,96.49,58.5Z" />
        </svg>

        {/* Mainly used for calculating the valid range that the knob can be dragged within */}
        <div
          className="drag-zone"
          ref={this.dragZoneRef}
        >

          {/* This is the knob / ball of the joystick */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            className="knob"
            ref={this.knobRef}
            style={this.knobTransformCSS}
            onMouseDown={this.handleKnobMouseDown}
            onMouseUp={this.handleKnobMouseUp}
            onTouchStart={this.handleKnobTouchStart}
            onTouchEnd={this.handleKnobTouchEnd}
            onDragStart={(e) => e.preventDefault()}
          >
            <Icon icon={ICON.CONTROL_CAMERA} />
          </div>
        </div>

      </div>
    );
  }
}
