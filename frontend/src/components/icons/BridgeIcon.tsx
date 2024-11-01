import * as React from "react";
const BridgeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={20}
    height={20}
    viewBox="52.675 52.024 28 28"
    {...props}
  >
    <rect
      width={28}
      height={28}
      x={52.675}
      y={52.024}
      rx={5}
      ry={5}
      style={{
        stroke: "#000",
      }}
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      width={16}
      height={16}
      style={{
        fill: "#fff",
        stroke: "#fff",
      }}
    />
    <path
      d="M77.336 54.616 63.699 68.534"
      style={{
        fill: "#d8d8d8",
        stroke: "#000",
      }}
    />
  </svg>
);
export default BridgeIcon;
