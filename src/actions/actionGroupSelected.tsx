import { register } from "./register";
import { getSelectedElements } from "../scene";
import { getNonDeletedElements } from "../element";
import { KEYS } from "../keys";
import React from "react";
import { ToolButton } from "../components/ToolButton";
import useIsMobile from "../is-mobile";
import { groupElements } from "../element/newElement";
import { newElementWith } from "../element/mutateElement";

export const actionGroupSelected = register({
  name: "groupSelected",
  perform(elements, state) {
    const nonDeletedElements = getNonDeletedElements(elements);
    const selectedElements = getSelectedElements(nonDeletedElements, state);

    const leftX = Math.min(
      ...selectedElements.map((el) => Math.min(el.x, el.x + el.width)),
    );
    const topY = Math.min(
      ...selectedElements.map((el) => Math.min(el.y, el.y + el.height)),
    );
    const rightX = Math.max(
      ...selectedElements.map((el) => Math.max(el.x, el.x + el.width)),
    );
    const botY = Math.max(
      ...selectedElements.map((el) => Math.max(el.y, el.y + el.height)),
    );

    const newGroup = groupElements({
      x: leftX,
      y: topY,
      width: rightX - leftX,
      height: botY - topY,
      elements: selectedElements,
      strokeColor: state.currentItemStrokeColor,
      backgroundColor: state.currentItemBackgroundColor,
      fillStyle: state.currentItemFillStyle,
      strokeWidth: state.currentItemStrokeWidth,
      strokeStyle: state.currentItemStrokeStyle,
      roughness: state.currentItemRoughness,
      opacity: state.currentItemOpacity,
    });

    const nextElements = elements
      .map((el) => {
        if (state.selectedElementIds[el.id]) {
          return newElementWith(el, { isDeleted: true });
        }
        return el;
      })
      .concat(newGroup);

    return {
      elements: nextElements,
      appState: {
        ...state,
        selectedElementIds: { [newGroup.id]: true },
      },
      commitToHistory: true,
    };
  },
  keyTest(event) {
    return event[KEYS.CTRL_OR_CMD] && event.key === "g";
  },
  PanelComponent: ({ updateData }) => (
    <ToolButton
      type="button"
      icon="G"
      title="group"
      aria-label="Group selected elements"
      showAriaLabel={useIsMobile()}
      onClick={updateData}
    />
  ),
});
