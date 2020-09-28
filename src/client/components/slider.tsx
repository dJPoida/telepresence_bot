import React, { createRef, CSSProperties, ReactNode } from 'react';
import classNames from 'classnames';
import { findTouchFromTouchIdentifier } from '../helpers/find-touch-from-touch-identifier.helper';
import { Icon } from './icon';
import { round } from '../../shared/helpers/round.helper';
import { ICON } from '../const/icon.constant';
import { AN_ORIENTATION, ORIENTATION } from '../const/orientation.constant';

export type SliderProps = {
  className?: string,
  orientation?: AN_ORIENTATION,
  disabled?: boolean,
  repeatRate?: number,
  verboseUpdate?: boolean,
  onBeginUpdating?: () => void,
  onUpdate?: (position: number) => void,
  onEndUpdating?: () => void,
}

type SliderState = {
  updating: boolean,
  dragging: boolean,
}

const DEFAULT_REPEAT_RATE = 50;
const DEFAULT_ORIENTATION = ORIENTATION.PORTRAIT;

/**
 * Note: The drag position influences the x and y coordinates but they are not governed by it
 * Note: This component attempts to avoid state to update the dom given the frequency and load of the updates
 */
export class Slider extends React.Component<SliderProps, SliderState> {
  private internalPosition = 0;
  private updateInterval: null | ReturnType<typeof setInterval>;
  private position = 0;
  private knobRef: React.RefObject<HTMLDivElement>;
  private dragZoneRef: React.RefObject<HTMLDivElement>;
  private dragPosition?: number;
  private dragPositionOffset?: number;
  private dragTouchIdentifier?: number;

  /**
   * @constructor
   */
  constructor(props: SliderProps) {
    super(props);

    this.state = {
      updating: false,
      dragging: false,
    };

    this.updateInterval = null;
    this.knobRef = createRef();
    this.dragZoneRef = createRef();
  }

  /**
   * @inheritdoc
   */
  componentDidUpdate(prevProps: SliderProps, prevState: SliderState): void {
    // TODO: handle a change to props.disabled if the user is interacting with the slider
    // TODO: handle a change to props.refreshRate if the user is interacting with the slider
  }

  /**
   * @inheritdoc
   */
  componentWillUnmount = (): void => {
    this.unbindDragEvents();
  }

  /**
   * Whether the update should be fired regardless of a change in position
   */
  get verboseUpdate(): boolean {
    const { verboseUpdate } = this.props;
    return verboseUpdate ?? false;
  }

  /**
   * What orientation is the slider (horizontal / vertical)
   */
  get orientation(): AN_ORIENTATION {
    const { orientation } = this.props;
    return orientation ?? DEFAULT_ORIENTATION;
  }

  /**
   * Simple wrapper around the orientation property to make code more legible
   */
  get isVertical(): boolean {
    return this.orientation === ORIENTATION.PORTRAIT;
  }

  /**
   * Simple wrapper around the orientation property to make code more legible
   */
  get isHorizontal(): boolean {
    return this.orientation === ORIENTATION.LANDSCAPE;
  }

  /**
   * How frequently the update callback should be fired
   */
  get repeatRate(): number {
    const { repeatRate } = this.props;
    return repeatRate ?? DEFAULT_REPEAT_RATE;
  }

  /**
   * Return the CSS that needs to be applied to the knob to make it
   * appear like it's moving with the touch / drag operations
   */
  get knobTransformCSS(): CSSProperties {
    return this.isVertical ? {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      '--offsetY': `${this.internalPosition}%`,
    } : {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      '--offsetX': `${this.internalPosition}%`,
    };
  }

  /**
   * Return the CSS that needs to be applied to the knob to make it
   * appear like it's moving with the touch / drag operations
   */
  get knobTransformCSSString(): string {
    return this.isVertical ? `--offsetY: ${this.internalPosition}%;` : `--offsetX: ${this.internalPosition}%;`;
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

    // Recalculate the position based on all of the inputs
    if (dragging && this.dragPosition && this.dragPositionOffset && this.dragZoneRef.current && this.knobRef.current) {
      const dragZoneBoundingRect = this.dragZoneRef.current.getBoundingClientRect();

      const maxWidth = dragZoneBoundingRect.width;
      const maxHeight = dragZoneBoundingRect.height;

      const offsetDragPosition = this.isVertical
        ? round(this.dragPosition - dragZoneBoundingRect.top - this.dragPositionOffset, 2)
        : round(this.dragPosition - dragZoneBoundingRect.left - this.dragPositionOffset, 2);

      this.internalPosition = this.isVertical
        ? Math.max(Math.min(offsetDragPosition / maxHeight, 1), 0) * 100
        : Math.max(Math.min(offsetDragPosition / maxWidth, 1), 0) * 100;
    }
  }

  /**
   * Called by the updateInterval
   */
  doUpdate = (): void => {
    const { onUpdate } = this.props;

    // Snap the position to the nearest integer
    const snappedPosition = this.isVertical
      ? this.internalPosition <= 0 ? Math.ceil(this.internalPosition) : Math.floor(this.internalPosition)
      : this.internalPosition <= 0 ? Math.ceil(this.internalPosition) : Math.floor(this.internalPosition);

    // Check to see if the position has changed
    const positionChanged = this.position !== snappedPosition;

    // Update the position to reflect the snapped position
    this.position = snappedPosition;

    // Fire the update handler if required
    if (onUpdate && (positionChanged || this.verboseUpdate)) {
      setTimeout(() => onUpdate(this.position), 0);
    }
  }

  /**
   * Begin the updating of the slider state
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
        const { onBeginUpdating } = this.props;

        // fire the onBeginUpdating callback
        if (onBeginUpdating) {
          setTimeout(onBeginUpdating, 0);
        }

        // Start animating the slider knob
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
   * End the updating of the slider state
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
   * Begin requesting animation frames to update the slider
   */
  startAnimating = (): void => {
    const getStateValues = () => {
      const { knobRef, knobTransformCSSString, doInternalUpdate } = this;
      const { updating } = this.state;
      return {
        knobRef,
        knobTransformCSSString,
        updating,
        doInternalUpdate,
      };
    };

    requestAnimationFrame(function animate(time) {
      const {
        knobRef,
        knobTransformCSSString,
        updating,
        doInternalUpdate,
      } = getStateValues();

      if (knobRef.current) {
        knobRef.current.setAttribute('style', knobTransformCSSString);
      }

      if (updating) {
        doInternalUpdate();
        requestAnimationFrame(animate);
      }
    });
  }

  /**
   * Begin the dragging operation
   *
   * @param {number} startPosition the initial global client x or y position of the mouse cursor / touch event (depending on this.orientation)
   * @param {number} touchIdentifier the finger that was used to begin the drag operation (if touch initiated the drag)
   * @param {function} callBack something to fire after the begin drag has completed
   */
  beginDrag = (startPosition: number, touchIdentifier?: number, callBack?: () => unknown): void => {
    this.dragPosition = startPosition;
    this.dragPositionOffset = startPosition;
    this.dragTouchIdentifier = touchIdentifier;

    if (startPosition && this.knobRef.current && this.dragZoneRef.current) {
      const knobBoundingRect = this.knobRef.current.getBoundingClientRect();

      if (this.isVertical) {
        const maxHeight = knobBoundingRect.height / 2;
        this.dragPositionOffset = round(startPosition - knobBoundingRect.top - maxHeight, 2);
      } else {
        const maxWidth = knobBoundingRect.width / 2;
        this.dragPositionOffset = round(startPosition - knobBoundingRect.left - maxWidth, 2);
      }
    } else {
      this.dragPositionOffset = 0;
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
   * Fired by the mouse and touch move events as the user drags the knob
   *
   * @note: the position coordinate is the global client X/Y position of the mouse cursor / touch event
   */
  drag = (dragPosition?: number): void => {
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
      this.endUpdating();

      if (callBack) {
        callBack();
      }
    });
  }

  /**
   * @description
   * Handle the movement of the mouse over the entire document
   */
  handleWindowMouseMove = (e: MouseEvent): void => {
    const { dragging } = this.state;
    if (
      dragging
      && (this.dragTouchIdentifier === undefined)
      && (e.button === 1 || e.button === 0 || e.button === undefined)
    ) {
      e.stopPropagation();
      if (this.isVertical) {
        this.drag(e.clientY);
      } else {
        this.drag(e.clientX);
      }
    }
  }

  /**
   * Handle the movement of a touch over the entire document
   */
  handleWindowTouchMove = (e: TouchEvent): void => {
    const {
      dragging,
    } = this.state;

    if (dragging && (this.dragTouchIdentifier !== undefined)) {
      const dragTouch = findTouchFromTouchIdentifier(e.changedTouches, this.dragTouchIdentifier);

      if (dragTouch) {
        e.stopPropagation();
        if (e.cancelable) {
          e.preventDefault();
        }
        if (this.isVertical) {
          this.drag(dragTouch.clientY);
        } else {
          this.drag(dragTouch.clientX);
        }
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
   * Const fired when the mouse is pressed on the knob
   */
  handleKnobMouseDown = (e: React.MouseEvent<HTMLDivElement, MouseEvent>): void => {
    const { dragging } = this.state;

    if (
      !dragging
      && (e.button === 1 || e.button === 0 || e.button === undefined)
    ) {
      e.stopPropagation();
      if (this.isVertical) {
        this.beginDrag(e.clientY);
      } else {
        this.beginDrag(e.clientX);
      }
    }
  }

  /**
   * Mouse up on the knob will end the drag operation
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

    // Start a drag and / or pinch operation?
    if (!dragging && e.changedTouches.length > 0) {
      e.stopPropagation();

      const dragTouch = e.changedTouches[0];
      if (this.isVertical) {
        this.beginDrag(dragTouch.clientY, dragTouch.identifier);
      } else {
        this.beginDrag(dragTouch.clientX, dragTouch.identifier);
      }
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
    const { className } = this.props;

    return (
      <div
        className={classNames(
          'slider',
          className, {
            vertical: this.isVertical,
            horizontal: this.isHorizontal,
          },
        )}
      >
        {/* The background is the black area behind the slider */}
        <div className="background" />

        {/* Mainly used for calculating the valid range that the knob can be dragged within */}
        <div
          className="drag-zone"
          ref={this.dragZoneRef}
        >

          {/* This is the knob that the user interacts with */}
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
            <Icon icon={ICON.MENU_HAMBURGER} />
          </div>
        </div>

      </div>
    );
  }
}
