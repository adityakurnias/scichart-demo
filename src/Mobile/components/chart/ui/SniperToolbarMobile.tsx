/**
 * SniperToolbar — Fixed toolbar shown at top of chart when a
 * SniperMeasurement is selected (tap on box in pan mode).
 *
 * Usage in TradePageMobile / chart container:
 *
 *   <SniperToolbar
 *     visible={sniperSelected}
 *     onDelete={() => sniperModRef.current?.deleteSelected()}
 *     onDeselect={() => sniperModRef.current?.deselectAll()}
 *   />
 */

import React from "react";

interface SniperToolbarProps {
  visible: boolean;
  onDelete: () => void;
  onDeselect: () => void;
  // Future: onEdit, onClone, etc.
}

export const SniperToolbar: React.FC<SniperToolbarProps> = ({
  visible,
  onDelete,
  onDeselect,
}) => {
  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 2,
        padding: "4px 8px",
        backgroundColor: "#1E1E30",
        borderBottom: "1px solid #3A3A5C",
        height: 44,
      }}
    >
      {/* Drag handle / move icon — cosmetic, reserved for future */}
      <ToolbarBtn title="Move" onClick={() => {}}>
        <MoveIcon />
      </ToolbarBtn>

      <Divider />

      {/* Edit — placeholder */}
      <ToolbarBtn title="Edit" onClick={() => {}}>
        <EditIcon />
      </ToolbarBtn>

      <Divider />

      {/* Delete */}
      <ToolbarBtn title="Delete" onClick={onDelete} danger>
        <TrashIcon />
      </ToolbarBtn>

      <Divider />

      {/* Close / deselect */}
      <ToolbarBtn title="Close" onClick={onDeselect}>
        <CloseIcon />
      </ToolbarBtn>
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const ToolbarBtn: React.FC<{
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ title, onClick, danger, children }) => (
  <button
    title={title}
    onClick={onClick}
    style={{
      display:         "flex",
      alignItems:      "center",
      justifyContent:  "center",
      width:           36,
      height:          36,
      borderRadius:    6,
      border:          "none",
      background:      "transparent",
      cursor:          "pointer",
      color:           danger ? "#FF5555" : "#C0C0D0",
      padding:         0,
      WebkitTapHighlightColor: "transparent",
    }}
    onMouseEnter={(e) => {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#2A2A45";
    }}
    onMouseLeave={(e) => {
      (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
    }}
  >
    {children}
  </button>
);

const Divider = () => (
  <div style={{ width: 1, height: 20, backgroundColor: "#3A3A5C", margin: "0 2px" }} />
);

// ─── Icons ────────────────────────────────────────────────────────────────────

const MoveIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 2L10 18M2 10L18 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M10 2L7 5M10 2L13 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 18L7 15M10 18L13 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2 10L5 7M2 10L5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 10L15 7M18 10L15 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EditIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 3L17 6L7 16H4V13L14 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M12 5L15 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 5H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M8 5V3H12V5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M5 5L6 17H14L15 5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M8 9V14M12 9V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);