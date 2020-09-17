/**
 * @description
 * Find the touch from a touch list based on its identifier
 */
export const findTouchFromTouchIdentifier = (touchList: TouchList, identifier: number): Touch | undefined => {
  if (touchList && identifier !== undefined) {
    for (let i = 0; i < touchList.length; i += 1) {
      if (touchList[i].identifier === identifier) {
        return touchList[i];
      }
    }
  }
  return undefined;
};
