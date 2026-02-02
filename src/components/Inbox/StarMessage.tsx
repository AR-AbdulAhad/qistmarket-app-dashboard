import { cn } from "@/lib/utils";
import { useState } from "react";
import { StarIcon } from "./icons";

export function StarMessage() {
  const [isSelected, setIsSelected] = useState(false);

  return (
    <button
      className="align-bottom"
      onClick={() => setIsSelected((prev) => !prev)}
    >
      <span className="sr-only">Star Message</span>
      <StarIcon
        className={cn(
          "hover:fill-[#FFD02C] dark:hover:fill-[#FFD02C]",
          isSelected
            ? "fill-[#FFD02C]"
            : "fill-[#DFE3F0] dark:fill-[#E5E7EE]/70",
        )}
      />
    </button>
  );
}
