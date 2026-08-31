"use client";
import type { InputHTMLAttributes } from "react";

/**
 * Number input that ignores accidental scroll-wheel + arrow-key changes.
 * <input type="number"> normally decrements on trackpad scroll while focused
 * and on Up/Down keys — that silently corrupts prices/quantities.
 * This component blurs on wheel and blocks arrow keys.
 */
export default function NumberInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { onWheel, onKeyDown, inputMode, min, step, ...rest } = props;
  return (
    <input
      {...rest}
      type="number"
      inputMode={inputMode ?? "decimal"}
      min={min ?? "0"}
      step={step ?? "1"}
      onWheel={e => {
        (e.currentTarget as HTMLInputElement).blur();
        onWheel?.(e);
      }}
      onKeyDown={e => {
        if (e.key === "ArrowUp" || e.key === "ArrowDown") e.preventDefault();
        onKeyDown?.(e);
      }}
    />
  );
}
